from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
import re
import os
import time
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Listing
from app.routes.listings import serialize_listing
import google.generativeai as genai

router = APIRouter()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("⚠️ Warning: GEMINI_API_KEY not set. Chatbot functionality will be disabled.")
else:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
else:
    model = None

# Rate limiting: Store IP address and last request time
rate_limit_store = {}
RATE_LIMIT_SECONDS = 5  # 5 seconds between requests per IP
MAX_REQUESTS_PER_MINUTE = 10  # Maximum 10 requests per minute per IP


class ChatMessage(BaseModel):
    message: str
    language: Optional[str] = "auto"  # "en", "sq" (Albanian), or "auto"


class ChatResponse(BaseModel):
    response: str
    listings: Optional[List[dict]] = None
    intent: str
    language: str


def check_rate_limit(client_ip: str) -> bool:
    """Check if client has exceeded rate limit"""
    current_time = time.time()
    
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = {
            'last_request': current_time,
            'requests': []
        }
        return True
    
    client_data = rate_limit_store[client_ip]
    
    # Check minimum time between requests (5 seconds)
    if current_time - client_data['last_request'] < RATE_LIMIT_SECONDS:
        return False
    
    # Clean up old requests (older than 1 minute)
    client_data['requests'] = [
        req_time for req_time in client_data['requests'] 
        if current_time - req_time < 60
    ]
    
    # Check requests per minute
    if len(client_data['requests']) >= MAX_REQUESTS_PER_MINUTE:
        return False
    
    # Update rate limit data
    client_data['last_request'] = current_time
    client_data['requests'].append(current_time)
    
    return True


def is_property_related(message: str) -> bool:
    """Check if the message is related to real estate/property"""
    
    # Greetings - always respond politely
    greetings = [
        'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
        'përshëndetje', 'tungjatjeta', 'mirëdita', 'mirëmëngjes', 'mirëmbrëma',
        'alo', 'hej', 'halo'
    ]
    
    message_lower = message.lower().strip()
    
    # If it's just a greeting (short message), consider it property-related to respond politely
    if any(greeting == message_lower for greeting in greetings):
        return True
    
    property_keywords = [
        # English
        'property', 'house', 'apartment', 'home', 'rent', 'sale', 'buy', 'real estate',
        'bedroom', 'bathroom', 'land', 'villa', 'condo', 'flat', 'listing', 'price',
        'location', 'area', 'square', 'meter', 'feet', 'lease', 'landlord', 'tenant',
        'business', 'commercial', 'office', 'shop', 'store', 'retail', 'workspace',
        
        # Albanian
        'shtëpi', 'apartament', 'banesë', 'tokë', 'qira', 'shitje', 'blerje', 'pronë',
        'dhomë', 'banjo', 'vilë', 'trual', 'çmim', 'vend', 'zonë', 'metër', 'qera',
        'pronar', 'qiramarrës', 'pasuri', 'biznes', 'dyqan', 'lokal', 'zyrë', 'ambient'
    ]
    
    return any(keyword in message_lower for keyword in property_keywords)


def get_gemini_system_prompt(language: str) -> str:
    """Get system prompt for Gemini to restrict to property queries only"""
    if language == "sq":
        return """Ti je një asistent virtual i sjellshëm dhe i dobishëm i specializuar për pasuri të paluajtshme në Shqipëri. 

RREGULLAT:
1. Përgjigju në mënyrë të sjellshme dhe miqësore të gjitha pyetjeve.
2. Për përshëndetje (si "hi", "hello", "tungjatjeta"), përgjigju në mënyrë të ngrohtë dhe pyet si mund të ndihmosh me pasuri të paluajtshme.
3. Përgjigju pyetjeve lidhur me: shtëpi, apartamente, tokë, ambiente biznesi, qira, shitje, çmime të pronave, lokacione, karakteristika të pronave.
4. Nëse dikush pyet diçka që NUK lidhet me pasuri (si matematikë, shkencë, histori), thuaj me mirësjellje: "Më falni, unë jam i specializuar vetëm për pyetje mbi pasuri të paluajtshme. A mund t'ju ndihmoj me diçka lidhur me shtëpi, apartamente, ambiente biznesi, ose prona?"
5. Mbaj përgjigjet e shkurtra (2-3 fjali) dhe të dobishme.
6. Nëse dikush të pyet për detaje specifike që nuk i ke, sugjero që ata të shikojnë listën e pronave.
7. Ji gjithmonë i sjellshëm, edhe kur refuzon të përgjigjesh për tema jo të pasurive.

Qëllimi yt: Të jesh ndihmës i sjellshëm që ndihmon përdoruesit të gjejnë pronën e duhur në Shqipëri."""
    else:
        return """You are a friendly and helpful virtual assistant specialized in real estate properties in Albania.

RULES:
1. Respond politely and warmly to all questions.
2. For greetings (like "hi", "hello", "hey"), respond warmly and ask how you can help with real estate.
3. Answer questions about: houses, apartments, land, commercial/business properties, rent, sale, property prices, locations, property features.
4. If someone asks about something NOT related to real estate (like math, science, history), politely say: "I'm sorry, I'm specialized only in real estate questions. Can I help you with something related to houses, apartments, commercial properties, or other real estate in Albania?"
5. Keep responses short (2-3 sentences) and helpful.
6. If someone asks for specific details you don't have, suggest they view the property listings.
7. Always be polite, even when declining to answer non-real estate topics.

Your goal: Be a helpful, friendly assistant that helps users find the right property in Albania."""


def detect_language(text: str) -> str:
    """Detect if text is Albanian or English"""
    # Albanian specific words/patterns
    albanian_words = [
        'shtëpi', 'apartament', 'tokë', 'qira', 'shitje', 'dhoma', 'banjo',
        'çmimi', 'buxhet', 'ku', 'zona', 'vend', 'për', 'dua', 'kërkoj',
        'më', 'në', 'kam', 'nevojë', 'euro', 'lekë'
    ]
    
    text_lower = text.lower()
    albanian_count = sum(1 for word in albanian_words if word in text_lower)
    
    return "sq" if albanian_count > 0 else "en"


def extract_search_params(message: str, language: str) -> dict:
    """Extract search parameters from natural language"""
    params = {
        'type': None,  # 'sale' or 'rent'
        'property_type': None,  # 'apartment', 'private_home', 'land'
        'min_price': None,
        'max_price': None,
        'location': None,
        'min_rooms': None,
        'max_rooms': None
    }
    
    message_lower = message.lower()
    
    # Detect type (sale/rent) - IMPROVED with more patterns
    if language == "sq":
        if any(word in message_lower for word in ['qira', 'qera', 'me qira', 'për qira', 'qiramarrje']):
            params['type'] = 'rent'
        elif any(word in message_lower for word in ['shitje', 'blerje', 'blej', 'për shitje', 'shes']):
            params['type'] = 'sale'
    else:
        if any(word in message_lower for word in ['rent', 'rental', 'lease', 'for rent', 'to rent', 'renting']):
            params['type'] = 'rent'
        elif any(word in message_lower for word in ['buy', 'sale', 'purchase', 'for sale', 'to buy', 'buying', 'sell', 'selling']):
            params['type'] = 'sale'
    
    # Detect property type - IMPROVED with more variations
    if language == "sq":
        if any(word in message_lower for word in ['apartament', 'banesë', 'apartamente']):
            params['property_type'] = 'apartment'
        elif any(word in message_lower for word in ['shtëpi', 'vilë', 'shtëpia', 'villa']):
            params['property_type'] = 'private_home'
        elif any(word in message_lower for word in ['tokë', 'trual', 'toka']):
            params['property_type'] = 'land'
        elif any(word in message_lower for word in ['biznes', 'dyqan', 'lokal', 'zyrë', 'ambient', 'tregtare']):
            params['property_type'] = 'business'
    else:
        if any(word in message_lower for word in ['apartment', 'flat', 'condo', 'apartments']):
            params['property_type'] = 'apartment'
        elif any(word in message_lower for word in ['house', 'home', 'villa', 'houses', 'homes']):
            params['property_type'] = 'private_home'
        elif any(word in message_lower for word in ['land', 'plot', 'lot', 'plots']):
            params['property_type'] = 'land'
        elif any(word in message_lower for word in ['business', 'commercial', 'office', 'shop', 'store', 'retail', 'workspace']):
            params['property_type'] = 'business'
    
    # Extract price/budget
    # Look for numbers with currency symbols or keywords
    price_patterns = [
        r'(\d+)\s*(?:euro|eur|€)',
        r'(\d+)\s*(?:dollar|usd|\$)',
        r'(\d+)\s*(?:lek|lekë|all)',
        r'(?:budget|buxhet|price|çmim).*?(\d+)',
        r'(\d+).*?(?:month|muaj|per month|në muaj)',
    ]
    
    for pattern in price_patterns:
        match = re.search(pattern, message_lower)
        if match:
            price = int(match.group(1))
            # If it's a very small number, assume it's in thousands
            if price < 1000 and params['type'] == 'rent':
                params['max_price'] = price
            else:
                params['max_price'] = price
            break
    
    # Extract location - IMPROVED to handle "in X" patterns
    # Common Albanian cities/areas with variations
    location_mapping = {
        'tirana': ['tirana', 'tiranë', 'tirane', 'in tirana', 'në tiranë', 'tek tirana'],
        'durrës': ['durrës', 'durres', 'in durres', 'në durrës', 'tek durrës'],
        'vlorë': ['vlorë', 'vlore', 'in vlore', 'në vlorë', 'tek vlorë'],
        'shkodër': ['shkodër', 'shkoder', 'in shkoder', 'në shkodër', 'tek shkodër'],
        'elbasan': ['elbasan', 'in elbasan', 'në elbasan', 'tek elbasan'],
        'korçë': ['korçë', 'korce', 'in korce', 'në korçë', 'tek korçë'],
        'berat': ['berat', 'in berat', 'në berat', 'tek berat'],
        'fier': ['fier', 'in fier', 'në fier', 'tek fier'],
        'gjirokastër': ['gjirokastër', 'gjirokaster', 'in gjirokaster', 'në gjirokastër'],
        'lushnjë': ['lushnjë', 'lushnje', 'in lushnje', 'në lushnjë'],
        'kamëz': ['kamëz', 'kamez', 'in kamez', 'në kamëz'],
        'kavajë': ['kavajë', 'kavaje', 'in kavaje', 'në kavajë'],
        'laç': ['laç', 'lac', 'in lac', 'në laç'],
        'kukës': ['kukës', 'kukes', 'in kukes', 'në kukës']
    }
    
    # Try to find location with better pattern matching
    for city, variations in location_mapping.items():
        for variation in variations:
            if variation in message_lower:
                params['location'] = city.capitalize()
                break
        if params['location']:
            break
    
    # If no specific city found, look for location indicators
    if not params['location']:
        # Pattern: "in X", "at X", "near X", "në X", "tek X", "pranë X"
        location_patterns = [
            r'(?:in|at|near|around)\s+([a-zA-ZëçËÇ]+)',
            r'(?:në|tek|pranë|afër)\s+([a-zA-ZëçËÇ]+)',
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, message_lower)
            if match:
                potential_location = match.group(1).strip()
                # Check if it's at least 3 characters and not a common word
                if len(potential_location) >= 3 and potential_location not in ['the', 'për', 'një', 'with', 'me']:
                    params['location'] = potential_location.capitalize()
                    break
    
    # Extract number of rooms
    room_patterns = [
        r'(\d+)\s*(?:bedroom|bedrooms|dhoma|dhomash)',
        r'(\d+)\s*(?:room|rooms|dhomë|dhoma)',
        r'(\d+)(?:\+|\s+or more|\s+ose më shumë)',
    ]
    
    for pattern in room_patterns:
        match = re.search(pattern, message_lower)
        if match:
            params['min_rooms'] = int(match.group(1))
            break
    
    return params


def generate_response(params: dict, listings: List, language: str) -> str:
    """Generate natural language response"""
    
    if language == "sq":
        # Albanian responses
        if not listings:
            return "Më falni, nuk gjeta asnjë pronë që përputhet me kërkesat tuaja. A dëshironi të ndryshoni kriteret?"
        
        response = f"Gjeta {len(listings)} pronë"
        if len(listings) == 1:
            response = "Gjeta 1 pronë"
        
        if params['type'] == 'rent':
            response += " për qira"
        elif params['type'] == 'sale':
            response += " për shitje"
        
        if params['property_type']:
            prop_types = {
                'apartment': 'apartamente',
                'private_home': 'shtëpi',
                'land': 'toka',
                'business': 'ambiente biznesi'
            }
            response += f" ({prop_types.get(params['property_type'], '')})"
        
        if params['location']:
            response += f" në {params['location']}"
        
        if params['max_price']:
            response += f" deri në ${params['max_price']}"
        
        response += ". Ja lista:"
        
    else:
        # English responses
        if not listings:
            return "Sorry, I couldn't find any properties matching your criteria. Would you like to adjust your search?"
        
        response = f"I found {len(listings)} propert"
        response += "y" if len(listings) == 1 else "ies"
        
        if params['type'] == 'rent':
            response += " for rent"
        elif params['type'] == 'sale':
            response += " for sale"
        
        if params['property_type']:
            prop_types = {
                'apartment': 'apartments',
                'private_home': 'houses',
                'land': 'land plots',
                'business': 'commercial properties'
            }
            response += f" ({prop_types.get(params['property_type'], '')})"
        
        if params['location']:
            response += f" in {params['location']}"
        
        if params['max_price']:
            response += f" up to ${params['max_price']}"
        
        response += ". Here's what I found:"
    
    return response


def get_greeting_response(language: str) -> str:
    """Return greeting based on language"""
    if language == "sq":
        return """Përshëndetje! Unë jam asistenti juaj virtual për pasuri të paluajtshme. 🏠

Si mund t'ju ndihmoj sot? Mund të më pyesni për:
• Shtëpi ose apartamente për shitje ose qira
• Prona në zona specifike
• Çmime dhe detaje të pronave

Për shembull:
- "Dua të gjej një apartament për qira në Tiranë me buxhet 500€"
- "A keni shtëpi për shitje në Durrës?"
- "Më trego prona me 3 dhoma në Vlorë"

Si mund t'ju ndihmoj?"""
    else:
        return """Hello! I'm your virtual real estate assistant. 🏠

How can I help you today? You can ask me about:
• Houses or apartments for sale or rent
• Properties in specific areas
• Prices and property details

For example:
- "I need to rent an apartment in Tirana with a budget of $500"
- "Do you have houses for sale in Durres?"
- "Show me properties with 3 bedrooms in Vlore"

What are you looking for?"""


@router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, request: Request):
    """
    AI-powered chatbot using Google Gemini that understands natural language queries 
    in Albanian and English. ONLY responds to real estate related questions.
    
    Rate limited to prevent abuse:
    - 5 seconds minimum between requests
    - Maximum 10 requests per minute per IP
    
    Example queries:
    - "I need to rent a house, budget $500/month in Tirana"
    - "Dua të gjej një apartament për qira në Tiranë me buxhet 500€"
    - "Show me 3 bedroom apartments for sale"
    - "A keni shtëpi për shitje në Durrës?"
    """
    
    # Get client IP for rate limiting
    client_ip = request.client.host if request.client else "unknown"
    
    # Check rate limit
    if not check_rate_limit(client_ip):
        language = detect_language(message.message)
        error_msg = (
            "Ju lutem prisni pak para se të dërgoni një mesazh tjetër. Limite: 5 sekonda ndërmjet kërkesave."
            if language == "sq"
            else "Please wait before sending another message. Limit: 5 seconds between requests."
        )
        raise HTTPException(status_code=429, detail=error_msg)
    
    message_text = message.message.strip()
    
    # Detect language if auto
    if message.language == "auto":
        language = detect_language(message_text)
    else:
        language = message.language
    
    # Check if Gemini is configured
    if not model:
        error_msg = (
            "Asistenti AI nuk është i konfiguruar. Ju lutem kontaktoni administratorin."
            if language == "sq"
            else "AI assistant is not configured. Please contact the administrator."
        )
        raise HTTPException(status_code=503, detail=error_msg)
    
    # Check if query is property-related
    if not is_property_related(message_text):
        off_topic_msg = (
            "Më falni, unë jam i specializuar vetëm për pyetje mbi pasuri të paluajtshme. A mund t'ju ndihmoj me diçka lidhur me shtëpi, apartamente, ose prona?"
            if language == "sq"
            else "I'm sorry, I'm specialized only in real estate questions. Can I help you with something related to houses, apartments, or properties?"
        )
        return ChatResponse(
            response=off_topic_msg,
            listings=None,
            intent="off_topic",
            language=language
        )
    
    # Check for greetings
    greetings = ['hello', 'hi', 'hey', 'përshëndetje', 'tungjatjeta', 'ç\'kemi', 'help', 'ndihmë']
    if any(greeting in message_text.lower() for greeting in greetings) and len(message_text.split()) < 5:
        return ChatResponse(
            response=get_greeting_response(language),
            listings=None,
            intent="greeting",
            language=language
        )
    
    # Extract search parameters using existing logic
    params = extract_search_params(message_text, language)
    
    # Debug: Log extracted parameters
    print(f"DEBUG - User query: {message_text}")
    print(f"DEBUG - Extracted params: {params}")
    
    # Build database query
    db = SessionLocal()
    try:
        query = db.query(Listing)
        
        # Apply filters
        if params['type']:
            query = query.filter(Listing.type == params['type'])
        
        if params['property_type']:
            query = query.filter(Listing.property_type == params['property_type'])
        
        if params['location']:
            query = query.filter(Listing.location.ilike(f"%{params['location']}%"))
        
        if params['max_price']:
            query = query.filter(Listing.price <= params['max_price'])
        
        if params['min_price']:
            query = query.filter(Listing.price >= params['min_price'])
        
        if params['min_rooms']:
            query = query.filter(Listing.rooms >= params['min_rooms'])
        
        if params['max_rooms']:
            query = query.filter(Listing.rooms <= params['max_rooms'])
        
        # Debug: Log query details
        print(f"DEBUG - Applied filters: type={params['type']}, property_type={params['property_type']}, location={params['location']}")
        
        # Execute query and prioritize boosted listings
        listings = query.order_by(Listing.boosted.desc()).limit(10).all()
        
        # Debug: Log results
        print(f"DEBUG - Found {len(listings)} listings")
        if listings:
            print(f"DEBUG - First result: type={listings[0].type}, property_type={listings[0].property_type}, location={listings[0].location}")
        
        # Serialize listings
        serialized_listings = [serialize_listing(listing) for listing in listings]
        
        # Use Gemini to generate natural response
        try:
            # Create context for Gemini
            system_prompt = get_gemini_system_prompt(language)
            
            # Build listing summary for Gemini
            if serialized_listings:
                listings_summary = f"\n\nFound {len(serialized_listings)} properties:\n"
                for i, listing in enumerate(serialized_listings[:5], 1):  # Show max 5 in summary
                    listings_summary += f"{i}. {listing['title']} - ${listing['price']} - {listing['location']}"
                    if listing.get('rooms'):
                        listings_summary += f" - {listing['rooms']} rooms"
                    listings_summary += "\n"
            else:
                listings_summary = "\n\nNo properties found matching the criteria."
            
            # Generate AI response
            prompt = f"""{system_prompt}

User question: {message_text}

Search results: {listings_summary}

Provide a helpful, friendly response in {"Albanian" if language == "sq" else "English"}. Keep it concise (2-3 sentences max). If properties were found, mention how many and briefly describe them. If none found, suggest adjusting search criteria."""

            gemini_response = model.generate_content(prompt)
            response_text = gemini_response.text
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            # Fallback to simple response
            response_text = generate_response(params, serialized_listings, language)
        
        return ChatResponse(
            response=response_text,
            listings=serialized_listings if serialized_listings else None,
            intent="property_search",
            language=language
        )
        
    finally:
        db.close()


@router.get("/chat/suggestions")
async def get_suggestions(language: str = "en"):
    """Get example queries for the chatbot"""
    
    if language == "sq":
        return {
            "suggestions": [
                "Dua të gjej një apartament për qira në Tiranë me buxhet 500€",
                "A keni shtëpi për shitje në Durrës?",
                "Më trego prona me 3 dhoma",
                "Apartamente për shitje me çmim deri në 100,000€",
                "Tokë për shitje në Vlorë",
                "Kërkoj ambient biznesi për qira në Tiranë"
            ]
        }
    else:
        return {
            "suggestions": [
                "I need to rent an apartment in Tirana with a budget of $500",
                "Do you have houses for sale in Durres?",
                "Show me properties with 3 bedrooms",
                "Apartments for sale under $100,000",
                "Land for sale in Vlore",
                "Looking for commercial space for rent in Tirana"
            ]
        }
