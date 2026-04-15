from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Header, status
from typing import List, Optional
import os
import json
from pydantic import BaseModel
from app.database import SessionLocal
from app.models import Listing, User, SoldProperty
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import auth as firebase_auth

load_dotenv()

router = APIRouter()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


async def get_current_user(authorization: str = Header(None)):
    """Extract and verify Firebase user from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    token = authorization.split(" ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token  # Contains 'uid', 'email', etc.
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


def serialize_listing(listing, include_user=True, db_session=None):
    """Helper function to serialize a listing object to dict with optional user info"""
    from datetime import datetime
    
    # Check if boost has expired and auto-reset
    if listing.boosted and listing.boost_expires_at:
        if datetime.utcnow() > listing.boost_expires_at:
            listing.boosted = 0
            listing.boost_expires_at = None
            # Only commit if we have a session passed in
            if db_session:
                db_session.commit()
                db_session.refresh(listing)
    
    listing_data = {
        "id": listing.id,
        "title": listing.title,
        "location": listing.location,
        "price": listing.price,
        "type": listing.type,
        "property_type": listing.property_type,
        "rooms": listing.rooms,
        "bathrooms": listing.bathrooms,
        "size": listing.size,
        "description": listing.description,
        "images": json.loads(listing.images) if listing.images else [],
        "floor_plan": listing.floor_plan,
        "views": listing.views,
        "boosted": listing.boosted,
        "boost_expires_at": listing.boost_expires_at.isoformat() if listing.boost_expires_at else None,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        # Apartment/House specific features
        "has_elevator": listing.has_elevator,
        "has_parking": listing.has_parking,
        "has_garage": listing.has_garage,
        "floor": listing.floor,
        "total_floors": listing.total_floors,
        "has_balcony": listing.has_balcony
    }
    
    # Add user information if requested
    if include_user:
        # Use the same session if provided, otherwise create a new one
        if db_session:
            user = db_session.query(User).filter(User.firebase_uid == listing.firebase_uid).first()
            if user:
                listing_data["user"] = {
                    "name": user.name,
                    "surname": user.surname,
                }
            else:
                listing_data["user"] = None
        else:
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.firebase_uid == listing.firebase_uid).first()
                if user:
                    listing_data["user"] = {
                        "name": user.name,
                        "surname": user.surname,
                    }
                else:
                    listing_data["user"] = None
            finally:
                db.close()
    
    return listing_data


def serialize_listing_with_contact(listing, include_user=True, db_session=None):
    """
    Serialize a listing with FULL contact information (for authenticated requests).
    Use this for single listing views where users need to contact the owner.
    """
    listing_data = serialize_listing(listing, include_user=False, db_session=db_session)
    
    # Add full user contact information
    if include_user:
        # Use the same session if provided, otherwise create a new one
        if db_session:
            user = db_session.query(User).filter(User.firebase_uid == listing.firebase_uid).first()
            if user:
                listing_data["user"] = {
                    "name": user.name,
                    "surname": user.surname,
                    "email": user.email,
                    "phone": user.phone,
                    "profile_picture": user.profile_picture
                }
            else:
                listing_data["user"] = None
        else:
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.firebase_uid == listing.firebase_uid).first()
                if user:
                    listing_data["user"] = {
                        "name": user.name,
                        "surname": user.surname,
                        "email": user.email,
                        "phone": user.phone,
                        "profile_picture": user.profile_picture
                    }
                else:
                    listing_data["user"] = None
            finally:
                db.close()
    
    return listing_data



class ListingCreate(BaseModel):
    title: str
    location: str
    price: float
    type: str  # "sale" or "rent"
    rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    size: Optional[float] = None
    description: Optional[str] = None


class ListingUpdate(BaseModel):
    title: str
    location: str
    price: float
    type: str  # "sale" or "rent"
    rooms: Optional[int] = None
    bathrooms: Optional[int] = None
    size: Optional[float] = None
    description: Optional[str] = None


@router.post("/listings/")
async def create_listing(
    firebase_uid: str = Form(...),  # ✅ the logged-in user's Firebase UID
    title: str = Form(...),
    location: str = Form(...),
    price: float = Form(...),
    type: str = Form(...),  # ✅ "sale" or "rent"
    property_type: Optional[str] = Form(None),  # ✅ "private_home", "apartment", "land", or "business"
    rooms: Optional[int] = Form(None),
    bathrooms: Optional[int] = Form(None),
    size: Optional[float] = Form(None),
    description: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    # Apartment/House specific features
    has_elevator: Optional[bool] = Form(None),
    has_parking: Optional[bool] = Form(None),
    has_garage: Optional[bool] = Form(None),
    floor: Optional[int] = Form(None),
    total_floors: Optional[int] = Form(None),
    has_balcony: Optional[bool] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    floor_plan: Optional[UploadFile] = File(None),
):
    # ✅ Auto-geocode if coordinates not provided
    if latitude is None or longitude is None:
        try:
            from app.config import settings
            import requests
            from urllib.parse import quote
            
            # Try Mapbox geocoding
            if settings.MAPBOX_ACCESS_TOKEN and settings.MAPBOX_ACCESS_TOKEN != "your_mapbox_token_here":
                # Add ", Albania" to the search query to prioritize Albanian results
                search_query = f"{location}, Albania" if "albania" not in location.lower() else location
                encoded_query = quote(search_query)
                
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
                        # Extract city name from location string to match better
                        location_lower = location.lower()
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
                        
                        # Find which city is mentioned in the location
                        target_city = None
                        for city, keywords in city_keywords.items():
                            if any(keyword in location_lower for keyword in keywords):
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
                        
                        longitude = feature["center"][0]
                        latitude = feature["center"][1]
                        place_name = feature.get("place_name", location)
                        print(f"✅ Auto-geocoded '{location}' to {place_name} ({latitude}, {longitude})")
        except Exception as e:
            print(f"⚠️ Geocoding failed: {e}")
            # Continue without coordinates - they're optional
    
    image_urls = []

    # ✅ Upload images to Cloudinary
    if images:
        for image in images:
            try:
                # Upload to Cloudinary
                result = cloudinary.uploader.upload(
                    image.file,
                    folder="realestate-listings",
                    resource_type="auto"
                )
                image_urls.append(result["secure_url"])
                print(f"✅ Uploaded image to Cloudinary: {result['secure_url']}")
            except Exception as e:
                print(f"❌ Failed to upload image to Cloudinary: {e}")
                raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    # ✅ Upload floor plan to Cloudinary
    floor_plan_url = None
    if floor_plan:
        try:
            result = cloudinary.uploader.upload(
                floor_plan.file,
                folder="realestate-floor-plans",
                resource_type="auto"
            )
            floor_plan_url = result["secure_url"]
            print(f"✅ Uploaded floor plan to Cloudinary: {floor_plan_url}")
        except Exception as e:
            print(f"❌ Failed to upload floor plan to Cloudinary: {e}")
            raise HTTPException(status_code=500, detail=f"Floor plan upload failed: {str(e)}")

    db = SessionLocal()
    try:
        # ✅ Create new listing in database
        new_listing = Listing(
            firebase_uid=firebase_uid,
            title=title,
            location=location,
            price=price,
            type=type,
            property_type=property_type,
            rooms=rooms,
            bathrooms=bathrooms,
            size=size,
            description=description,
            images=json.dumps(image_urls),  # Store Cloudinary URLs as JSON string
            floor_plan=floor_plan_url,
            latitude=latitude,
            longitude=longitude,
            # Apartment/House specific features
            has_elevator=has_elevator,
            has_parking=has_parking,
            has_garage=has_garage,
            floor=floor,
            total_floors=total_floors,
            has_balcony=has_balcony
        )
        
        db.add(new_listing)
        db.commit()
        db.refresh(new_listing)

        listing_response = {
            "id": new_listing.id,
            "firebase_uid": new_listing.firebase_uid,
            "title": new_listing.title,
            "location": new_listing.location,
            "price": new_listing.price,
            "type": new_listing.type,
            "rooms": new_listing.rooms,
            "bathrooms": new_listing.bathrooms,
            "size": new_listing.size,
            "description": new_listing.description,
            "images": json.loads(new_listing.images) if new_listing.images else [],
            "views": new_listing.views,
            "boosted": new_listing.boosted,
            "latitude": new_listing.latitude,
            "longitude": new_listing.longitude
        }

        print("✅ New Listing Created:", listing_response)
        return {"message": "Listing added successfully", "data": listing_response}
    finally:
        db.close()


@router.get("/listings/")
async def get_listings():
    """Get all property listings with coordinates for map display - boosted listings first"""
    db = SessionLocal()
    try:
        # Order by boosted DESC (boosted=1 first), then by created_at DESC (newest first)
        listings = db.query(Listing).order_by(Listing.boosted.desc(), Listing.created_at.desc()).all()
        return [serialize_listing(listing, db_session=db) for listing in listings]
    finally:
        db.close()


@router.get("/listings/sale")
async def get_sale_listings():
    """Get all listings for sale - boosted listings first"""
    db = SessionLocal()
    try:
        listings = db.query(Listing).filter(Listing.type == "sale").order_by(Listing.boosted.desc(), Listing.created_at.desc()).all()
        return [serialize_listing(listing, db_session=db) for listing in listings]
    finally:
        db.close()


@router.get("/listings/rent")
async def get_rent_listings():
    """Get all listings for rent - boosted listings first"""
    db = SessionLocal()
    try:
        listings = db.query(Listing).filter(Listing.type == "rent").order_by(Listing.boosted.desc(), Listing.created_at.desc()).all()
        return [serialize_listing(listing, db_session=db) for listing in listings]
    finally:
        db.close()


@router.get("/listings/property-type/{property_type}")
async def get_listings_by_property_type(property_type: str):
    """
    Get all listings by property type - boosted listings first
    Property types: private_home, apartment, land
    """
    db = SessionLocal()
    try:
        listings = db.query(Listing).filter(Listing.property_type == property_type).order_by(Listing.boosted.desc(), Listing.created_at.desc()).all()
        return [serialize_listing(listing, db_session=db) for listing in listings]
    finally:
        db.close()


@router.get("/listings/boosted/random")
async def get_random_boosted_listings():
    """
    Get 3 random boosted listings for search dropdown exposure
    Returns different boosted listings each time to give all boosted properties fair visibility
    """
    from sqlalchemy.sql.expression import func
    from datetime import datetime
    
    db = SessionLocal()
    try:
        # Get active boosted listings (boosted=1 and not expired)
        boosted_listings = db.query(Listing).filter(
            Listing.boosted == 1,
            # Include listings where boost_expires_at is null or in the future
            (Listing.boost_expires_at.is_(None)) | (Listing.boost_expires_at > datetime.utcnow())
        ).order_by(func.random()).limit(3).all()
        
        return [serialize_listing(listing, db_session=db) for listing in boosted_listings]
    finally:
        db.close()


@router.get("/listings/{listing_id}")
async def get_listing(listing_id: int):
    """Get a single listing by ID with full contact information"""
    db = SessionLocal()
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Use the version with contact info for single listing views
        return serialize_listing_with_contact(listing, include_user=True, db_session=db)
    finally:
        db.close()


@router.post("/listings/{listing_id}/view")
async def increment_view(listing_id: int):
    """Increment view count for a listing - call this when someone views the listing details"""
    db = SessionLocal()
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        listing.views = (listing.views or 0) + 1
        db.commit()
        
        return {"message": "View counted", "views": listing.views}
    finally:
        db.close()


@router.post("/listings/{listing_id}/boost")
async def boost_listing(
    listing_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Boost a listing to increase visibility (FREE 14-day promotion)
    
    Parameters:
    - listing_id: The listing to boost
    - current_user: Authenticated user from JWT token
    
    The boost will last for 14 days and then automatically expire.
    """
    from datetime import datetime, timedelta
    
    db = SessionLocal()
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Verify ownership using authenticated user's UID
        if listing.firebase_uid != current_user["uid"]:
            raise HTTPException(status_code=403, detail="You can only boost your own listings")
        
        # Set boost with 14-day expiration
        listing.boosted = 1
        listing.boost_expires_at = datetime.utcnow() + timedelta(days=14)
        db.commit()
        
        return {
            "message": "Listing boosted successfully! It will be promoted for 14 days.",
            "listing_id": listing_id,
            "boosted": listing.boosted,
            "expires_at": listing.boost_expires_at.isoformat()
        }
    finally:
        db.close()


@router.put("/listings/{listing_id}")
async def update_listing(
    listing_id: int,
    title: str = Form(...),
    location: str = Form(...),
    price: float = Form(...),
    firebase_uid: str = Form(...),
    type: str = Form(...),
    property_type: Optional[str] = Form(None),
    rooms: Optional[str] = Form(None),  # Accept as string to handle empty values
    bathrooms: Optional[str] = Form(None),  # Accept as string to handle empty values
    size: Optional[str] = Form(None),  # Accept as string to handle empty values
    description: Optional[str] = Form(None),
    latitude: Optional[str] = Form(None),  # Accept as string to handle empty values
    longitude: Optional[str] = Form(None),  # Accept as string to handle empty values
    # Apartment/House specific features
    has_elevator: Optional[str] = Form(None),
    has_parking: Optional[str] = Form(None),
    has_garage: Optional[str] = Form(None),
    floor: Optional[str] = Form(None),
    total_floors: Optional[str] = Form(None),
    has_balcony: Optional[str] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    removed_images: Optional[str] = Form(None),
    floor_plan: Optional[UploadFile] = File(None),
    remove_floor_plan: Optional[str] = Form(None)
):
    """Update a listing with support for adding/removing images"""
    
    # Helper function to safely convert to number
    def safe_to_number(value, convert_type=int):
        if value is None or value == "" or value == "null":
            return None
        try:
            return convert_type(value)
        except (ValueError, TypeError):
            return None
    
    # Helper function to safely convert to boolean
    def safe_to_boolean(value):
        if value is None or value == "" or value == "null":
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ("true", "1", "yes")
        return bool(value)
    
    db = SessionLocal()
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Verify ownership
        if listing.firebase_uid != firebase_uid:
            raise HTTPException(status_code=403, detail="You can only edit your own listings")
        
        # Update basic fields
        listing.title = title
        listing.location = location
        listing.price = price
        listing.type = type
        
        # Update optional numeric fields (convert from string, handle empty values)
        listing.rooms = safe_to_number(rooms, int)
        listing.bathrooms = safe_to_number(bathrooms, int)
        listing.size = safe_to_number(size, float)
        listing.description = description if description else None
        
        # Update property_type if provided
        if property_type is not None and property_type != "":
            listing.property_type = property_type
        
        # Update coordinates if provided (convert from string, handle empty values)
        converted_lat = safe_to_number(latitude, float)
        converted_lng = safe_to_number(longitude, float)
        
        if converted_lat is not None:
            listing.latitude = converted_lat
        if converted_lng is not None:
            listing.longitude = converted_lng
        
        # Update apartment/house specific features
        listing.has_elevator = safe_to_boolean(has_elevator)
        listing.has_parking = safe_to_boolean(has_parking)
        listing.has_garage = safe_to_boolean(has_garage)
        listing.floor = safe_to_number(floor, int)
        listing.total_floors = safe_to_number(total_floors, int)
        listing.has_balcony = safe_to_boolean(has_balcony)
        
        # Handle images
        current_images = json.loads(listing.images) if listing.images else []
        
        # Remove specified images from Cloudinary
        if removed_images:
            removed_list = json.loads(removed_images)
            for img_url in removed_list:
                try:
                    # Extract public_id from Cloudinary URL
                    # URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
                    if "cloudinary.com" in img_url:
                        parts = img_url.split("/")
                        # Get the public_id (folder/filename without extension)
                        public_id_with_ext = "/".join(parts[parts.index("upload") + 2:])
                        public_id = public_id_with_ext.rsplit(".", 1)[0]
                        
                        # Delete from Cloudinary
                        cloudinary.uploader.destroy(public_id)
                        print(f"✅ Deleted image from Cloudinary: {public_id}")
                except Exception as e:
                    print(f"⚠️ Failed to delete image from Cloudinary: {e}")
            
            current_images = [img for img in current_images if img not in removed_list]
        
        # Add new images to Cloudinary
        if images:
            for image in images:
                try:
                    result = cloudinary.uploader.upload(
                        image.file,
                        folder="realestate-listings",
                        resource_type="auto"
                    )
                    current_images.append(result["secure_url"])
                    print(f"✅ Uploaded new image to Cloudinary: {result['secure_url']}")
                except Exception as e:
                    print(f"❌ Failed to upload image to Cloudinary: {e}")
        
        # Update images in database
        listing.images = json.dumps(current_images)
        
        # Handle floor plan
        # Remove floor plan if requested
        if remove_floor_plan and remove_floor_plan.lower() == "true":
            if listing.floor_plan:
                try:
                    # Delete from Cloudinary
                    if "cloudinary.com" in listing.floor_plan:
                        parts = listing.floor_plan.split("/")
                        public_id_with_ext = "/".join(parts[parts.index("upload") + 2:])
                        public_id = public_id_with_ext.rsplit(".", 1)[0]
                        cloudinary.uploader.destroy(public_id)
                        print(f"✅ Deleted floor plan from Cloudinary: {public_id}")
                except Exception as e:
                    print(f"⚠️ Failed to delete floor plan from Cloudinary: {e}")
            listing.floor_plan = None
        
        # Upload new floor plan if provided
        if floor_plan:
            # Delete old floor plan from Cloudinary if exists
            if listing.floor_plan:
                try:
                    if "cloudinary.com" in listing.floor_plan:
                        parts = listing.floor_plan.split("/")
                        public_id_with_ext = "/".join(parts[parts.index("upload") + 2:])
                        public_id = public_id_with_ext.rsplit(".", 1)[0]
                        cloudinary.uploader.destroy(public_id)
                        print(f"✅ Deleted old floor plan from Cloudinary: {public_id}")
                except Exception as e:
                    print(f"⚠️ Failed to delete old floor plan: {e}")
            
            # Upload new floor plan
            try:
                result = cloudinary.uploader.upload(
                    floor_plan.file,
                    folder="realestate-floor-plans",
                    resource_type="auto"
                )
                listing.floor_plan = result["secure_url"]
                print(f"✅ Uploaded new floor plan to Cloudinary: {listing.floor_plan}")
            except Exception as e:
                print(f"❌ Failed to upload floor plan to Cloudinary: {e}")
        
        db.commit()
        db.refresh(listing)
        
        return {
            "message": "Listing updated successfully",
            "listing": serialize_listing(listing, db_session=db)
        }
    finally:
        db.close()


@router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: int):
    db = SessionLocal()
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Delete images from Cloudinary before deleting listing
        if listing.images:
            try:
                image_urls = json.loads(listing.images)
                for img_url in image_urls:
                    try:
                        if "cloudinary.com" in img_url:
                            parts = img_url.split("/")
                            public_id_with_ext = "/".join(parts[parts.index("upload") + 2:])
                            public_id = public_id_with_ext.rsplit(".", 1)[0]
                            cloudinary.uploader.destroy(public_id)
                            print(f"✅ Deleted image from Cloudinary: {public_id}")
                    except Exception as e:
                        print(f"⚠️ Failed to delete image from Cloudinary: {e}")
            except Exception as e:
                print(f"⚠️ Failed to process images for deletion: {e}")
        
        # Delete floor plan from Cloudinary before deleting listing
        if listing.floor_plan:
            try:
                if "cloudinary.com" in listing.floor_plan:
                    parts = listing.floor_plan.split("/")
                    public_id_with_ext = "/".join(parts[parts.index("upload") + 2:])
                    public_id = public_id_with_ext.rsplit(".", 1)[0]
                    cloudinary.uploader.destroy(public_id)
                    print(f"✅ Deleted floor plan from Cloudinary: {public_id}")
            except Exception as e:
                print(f"⚠️ Failed to delete floor plan from Cloudinary: {e}")
        
        db.delete(listing)
        db.commit()
        
        return {"message": "Listing deleted successfully"}
    finally:
        db.close()


@router.post("/listings/{listing_id}/mark-sold")
async def mark_listing_as_sold(listing_id: int):
    """Mark a listing as sold, save to sold_properties table, and delete the listing"""
    db = SessionLocal()
    try:
        print(f"🔄 Marking listing {listing_id} as sold...")
        
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            print(f"❌ Listing {listing_id} not found")
            raise HTTPException(status_code=404, detail="Listing not found")
        
        print(f"📋 Found listing: {listing.title}")
        
        # Create sold property record
        sold_property = SoldProperty(
            user_id=listing.firebase_uid,
            listing_id=listing.id,
            title=listing.title,
            location=listing.location,
            price=listing.price,
            type=listing.type,
            property_type=listing.property_type
        )
        db.add(sold_property)
        
        # Commit the sold property record first
        db.commit()
        db.refresh(sold_property)
        print(f"✅ Sold property record saved with ID: {sold_property.id}")
        
        # Delete images from Cloudinary
        if listing.images:
            try:
                image_urls = json.loads(listing.images)
                for img_url in image_urls:
                    try:
                        if "cloudinary.com" in img_url:
                            parts = img_url.split("/")
                            public_id_with_ext = "/".join(parts[parts.index("upload") + 2:])
                            public_id = public_id_with_ext.rsplit(".", 1)[0]
                            cloudinary.uploader.destroy(public_id)
                            print(f"✅ Deleted sold listing image from Cloudinary: {public_id}")
                    except Exception as e:
                        print(f"⚠️ Failed to delete image from Cloudinary: {e}")
            except Exception as e:
                print(f"⚠️ Failed to process images for deletion: {e}")
        
        # Delete the listing
        db.delete(listing)
        db.commit()
        
        print(f"✅ Listing marked as sold and saved to statistics: {listing.title}")
        
        return {
            "message": "Listing marked as sold successfully",
            "sold_property_id": sold_property.id
        }
    except Exception as e:
        db.rollback()
        print(f"❌ Error marking listing as sold: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to mark listing as sold: {str(e)}")
    finally:
        db.close()


@router.get("/listings/user/{firebase_uid}")
async def get_user_listings(firebase_uid: str):
    """Return all listings created by a specific user"""
    db = SessionLocal()
    try:
        listings = db.query(Listing).filter(Listing.firebase_uid == firebase_uid).all()
        return [serialize_listing(listing, db_session=db) for listing in listings]
    finally:
        db.close()
