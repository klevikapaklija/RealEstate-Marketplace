from fastapi import APIRouter, HTTPException
from app.config import settings

router = APIRouter()

@router.get("/map/config")
async def get_map_config():
    """
    Get map configuration including API token and default settings.
    This endpoint provides the frontend with necessary map credentials securely.
    
    Note: Mapbox tokens are designed to be exposed client-side and are restricted
    by domain in the Mapbox dashboard. This is safe and standard practice.
    """
    # Check if at least one map provider is configured
    has_mapbox = bool(settings.MAPBOX_ACCESS_TOKEN and settings.MAPBOX_ACCESS_TOKEN != "your_mapbox_token_here")
    has_google = bool(settings.GOOGLE_MAPS_API_KEY and settings.GOOGLE_MAPS_API_KEY != "your_google_maps_key_here")
    
    if not has_mapbox and not has_google:
        raise HTTPException(
            status_code=503, 
            detail="Map service not configured. Please add MAPBOX_ACCESS_TOKEN or GOOGLE_MAPS_API_KEY to .env file"
        )
    
    # Determine which provider to use (prefer Mapbox for real estate)
    provider = "mapbox" if has_mapbox else "google"
    
    return {
        "provider": provider,
        "mapbox": {
            "accessToken": settings.MAPBOX_ACCESS_TOKEN if has_mapbox else None,
            "enabled": has_mapbox
        },
        "google": {
            "apiKey": settings.GOOGLE_MAPS_API_KEY if has_google else None,
            "enabled": has_google
        },
        "defaultCenter": {
            "lat": settings.MAP_DEFAULT_CENTER_LAT,
            "lng": settings.MAP_DEFAULT_CENTER_LNG
        },
        "defaultZoom": settings.MAP_DEFAULT_ZOOM
    }

@router.get("/map/bounds")
async def get_listings_in_bounds(
    north: float,
    south: float,
    east: float,
    west: float
):
    """
    Get all listings within map bounds for efficient map rendering.
    This prevents loading all listings when user is viewing a specific area.
    
    Example: /map/bounds?north=41.5&south=41.1&east=19.9&west=19.7
    """
    from app.database import SessionLocal
    from app.models import Listing
    from app.routes.listings import serialize_listing
    
    db = SessionLocal()
    try:
        # Query listings within bounding box
        listings = db.query(Listing).filter(
            Listing.latitude.isnot(None),
            Listing.longitude.isnot(None),
            Listing.latitude <= north,
            Listing.latitude >= south,
            Listing.longitude <= east,
            Listing.longitude >= west
        ).all()
        
        return {
            "count": len(listings),
            "bounds": {
                "north": north,
                "south": south,
                "east": east,
                "west": west
            },
            "listings": [serialize_listing(listing) for listing in listings]
        }
    finally:
        db.close()

@router.get("/map/geocode")
async def geocode_address(address: str):
    """
    Convert an address to latitude/longitude coordinates.
    ⚠️ WARNING: This endpoint costs money on Mapbox!
    Should ONLY be called for:
    1. User searching for a location (e.g., "Tirana")
    2. Creating/editing listings with new addresses
    
    Should NEVER be called for:
    - Displaying existing listings (they have lat/long in DB)
    - Moving the map around
    - Showing markers
    
    Example: /map/geocode?address=Tirana, Albania
    """
    import requests
    from urllib.parse import quote
    
    # 🚨 Log every geocoding request to track usage
    print(f"🗺️ GEOCODING REQUEST: address='{address}'")
    
    # Check which service is available
    if settings.MAPBOX_ACCESS_TOKEN and settings.MAPBOX_ACCESS_TOKEN != "your_mapbox_token_here":
        # Add ", Albania" to the search query to prioritize Albanian results
        search_query = f"{address}, Albania" if "albania" not in address.lower() else address
        encoded_query = quote(search_query)
        
        # Use Mapbox Geocoding API
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{encoded_query}.json"
        params = {
            "access_token": settings.MAPBOX_ACCESS_TOKEN,
            "limit": 5,  # Get top 5 results to filter
            "country": "AL",  # Restrict to Albania
            "types": "place,locality,neighborhood,address,poi",  # Include POI for landmarks
            "proximity": "19.8187,41.3275"  # Center of Albania (Tirana) to bias results
        }
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data.get("features"):
                # Extract city name from address string to match better
                address_lower = address.lower()
                city_keywords = {
                    'tirana': ['tirana', 'tiranë', 'tirane'],
                    'durrës': ['durrës', 'durres', 'durazzo'],
                    'vlorë': ['vlorë', 'vlore', 'valona'],
                    'shkodër': ['shkodër', 'shkoder', 'scutari'],
                    'elbasan': ['elbasan'],
                    'korçë': ['korçë', 'korce', 'korca'],
                    'fier': ['fier'],
                    'berat': ['berat'],
                    'lushnjë': ['lushnjë', 'lushnje'],
                    'kavajë': ['kavajë', 'kavaje'],
                    'gjirokastër': ['gjirokastër', 'gjirokaster'],
                    'sarandë': ['sarandë', 'sarande', 'saranda']
                }
                
                # Find which city is mentioned in the address
                target_city = None
                for city, keywords in city_keywords.items():
                    if any(keyword in address_lower for keyword in keywords):
                        target_city = city
                        break
                
                # Try to find a result that matches the target city
                feature = None
                if target_city:
                    for f in data["features"]:
                        place_name_lower = f.get("place_name", "").lower()
                        # Check if the result contains the target city
                        if any(keyword in place_name_lower for keyword in city_keywords[target_city]):
                            feature = f
                            break
                
                # If no match found, use first result
                if not feature:
                    feature = data["features"][0]
                
                return {
                    "address": feature.get("place_name"),
                    "latitude": feature["center"][1],
                    "longitude": feature["center"][0]
                }
    
    elif settings.GOOGLE_MAPS_API_KEY and settings.GOOGLE_MAPS_API_KEY != "your_google_maps_key_here":
        # Use Google Geocoding API
        url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": address,
            "key": settings.GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data.get("results"):
                result = data["results"][0]
                location = result["geometry"]["location"]
                return {
                    "address": result.get("formatted_address"),
                    "latitude": location["lat"],
                    "longitude": location["lng"]
                }
    
    raise HTTPException(
        status_code=503,
        detail="Geocoding service not configured or request failed"
    )


@router.get("/map/static")
async def get_static_map(location: str, width: int = 600, height: int = 400, zoom: int = 14):
    """
    Get a static map image URL for a given location.
    
    Example: /map/static?location=Tirana,Albania&width=600&height=400&zoom=14
    
    Returns a URL to a static map image that can be used in <img> tags.
    """
    import requests
    
    # First, geocode the location to get coordinates
    geocode_result = None
    
    # Try Mapbox first
    if settings.MAPBOX_ACCESS_TOKEN and settings.MAPBOX_ACCESS_TOKEN != "your_mapbox_token_here":
        # Geocode the location
        geocode_url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{location}.json"
        geocode_params = {
            "access_token": settings.MAPBOX_ACCESS_TOKEN,
            "limit": 1
        }
        
        response = requests.get(geocode_url, params=geocode_params)
        if response.status_code == 200:
            data = response.json()
            if data.get("features"):
                feature = data["features"][0]
                lng, lat = feature["center"]
                
                # Generate Mapbox static image URL
                # Format: https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(lng,lat)/lng,lat,zoom,0/widthxheight
                static_url = (
                    f"https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/"
                    f"pin-s+3b82f6({lng},{lat})/{lng},{lat},{zoom},0/{width}x{height}"
                    f"?access_token={settings.MAPBOX_ACCESS_TOKEN}"
                )
                
                return {
                    "url": static_url,
                    "location": feature.get("place_name"),
                    "latitude": lat,
                    "longitude": lng,
                    "provider": "mapbox"
                }
    
    # Try Google Maps as fallback
    if settings.GOOGLE_MAPS_API_KEY and settings.GOOGLE_MAPS_API_KEY != "your_google_maps_key_here":
        # Google Static Maps API
        static_url = (
            f"https://maps.googleapis.com/maps/api/staticmap?"
            f"center={location}&zoom={zoom}&size={width}x{height}"
            f"&markers=color:red%7C{location}"
            f"&key={settings.GOOGLE_MAPS_API_KEY}"
        )
        
        return {
            "url": static_url,
            "location": location,
            "provider": "google"
        }
    
    raise HTTPException(
        status_code=503,
        detail="Map service not configured. Please add MAPBOX_ACCESS_TOKEN or GOOGLE_MAPS_API_KEY to .env file"
    )
