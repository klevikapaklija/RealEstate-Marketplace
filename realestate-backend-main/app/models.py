from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, JSON, ARRAY
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    surname = Column(String)
    phone = Column(String)
    role = Column(String, default="person")
    favorites = Column(ARRAY(Integer), default=list)  # Array of listing IDs
    profile_picture = Column(Text, nullable=True)  # Cloudinary URL for profile picture



class UserConsent(Base):
    __tablename__ = "user_consents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # Cascade delete
    firebase_uid = Column(String, nullable=True, index=True)  # Track by Firebase UID
    consent_id = Column(String, nullable=True, index=True)  # Anonymous consent ID (for non-logged-in users)
    consent_type = Column(String, nullable=False)  # "terms", "privacy", "cookies"
    version = Column(String, nullable=False)  # "v1.0", "2025-11-05"
    accepted = Column(Boolean, default=True)
    cookie_preferences = Column(JSON, nullable=True)  # {"necessary": true, "analytics": false}
    user_agent = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # "sale" or "rent"
    property_type = Column(String)  # "private_home", "apartment", "land", or "business"
    rooms = Column(Integer)
    bathrooms = Column(Integer)
    size = Column(Float)
    description = Column(Text)
    images = Column(Text)  # Store as JSON string or comma-separated paths
    floor_plan = Column(Text, nullable=True)  # Store Cloudinary URL of floor plan image
    views = Column(Integer, default=0)  # Track how many people viewed this listing
    boosted = Column(Integer, default=0)  # 0 = not boosted, 1 = boosted (free 14-day promotion)
    boost_expires_at = Column(DateTime, nullable=True)  # When the boost expires (14 days from activation)
    created_at = Column(DateTime(timezone=True), server_default=func.now())  # Auto-set when listing is created
    latitude = Column(Float)  # Latitude for map pin
    longitude = Column(Float)  # Longitude for map pin
    
    # Apartment/House specific features
    has_elevator = Column(Boolean, nullable=True)  # Elevator (for apartments/houses)
    has_parking = Column(Boolean, nullable=True)  # Parking available
    has_garage = Column(Boolean, nullable=True)  # Garage
    floor = Column(Integer, nullable=True)  # Floor number (for apartments)
    total_floors = Column(Integer, nullable=True)  # Total floors in building
    has_balcony = Column(Boolean, nullable=True)  # Balcony


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)  # Firebase UID
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="EUR", nullable=False)
    transaction_id = Column(String, unique=True, nullable=False, index=True)  # PayPal order/transaction ID
    status = Column(String, nullable=False)  # "COMPLETED", "FAILED", "PENDING"
    payment_method = Column(String, default="PAYPAL")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SoldProperty(Base):
    __tablename__ = "sold_properties"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)  # Firebase UID of seller
    listing_id = Column(Integer, nullable=False)  # Original listing ID (before deletion)
    title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    type = Column(String, nullable=False)  # "sale" or "rent"
    property_type = Column(String)  # "private_home", "apartment", "land", or "business"
    sold_at = Column(DateTime(timezone=True), server_default=func.now())  # When marked as sold
