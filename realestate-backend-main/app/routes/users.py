from fastapi import APIRouter, HTTPException, Depends, status, Header, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.database import SessionLocal
from app.models import User
from app.recaptcha_helper import verify_recaptcha
import firebase_admin
from firebase_admin import auth as firebase_auth
import cloudinary
import cloudinary.uploader
import os

router = APIRouter()

class UserCreate(BaseModel):
    firebase_uid: str
    name: str
    surname: str
    email: str
    phone: str
    role: str  # Added to match frontend
    recaptcha_token: str | None = None  # Optional - only required if user consented to analytics
    consent_id: str | None = None  # Anonymous consent ID to merge on signup


class UserUpdate(BaseModel):
    name: str
    surname: str
    email: str
    phone: str

async def get_current_user(authorization: str = Header(None)):
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

@router.get("/users/agents-agencies")
async def get_agents_and_agencies():
    """Public endpoint to fetch all agents and agencies"""
    db = SessionLocal()
    try:
        # Query users with role 'agent' or 'agency'
        agents_agencies = db.query(User).filter(
            User.role.in_(['agent', 'agency'])
        ).all()
        
        return [{
            "id": user.id,
            "name": user.name,
            "surname": user.surname,
            "role": user.role,
            "phone": user.phone,
            "profile_picture": user.profile_picture
        } for user in agents_agencies]
    finally:
        db.close()

@router.get("/users/agent/{user_id}")
async def get_agent_by_id(user_id: int):
    """Public endpoint to fetch a specific agent or agency by ID"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(
            User.id == user_id,
            User.role.in_(['agent', 'agency'])
        ).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        return {
            "id": user.id,
            "firebase_uid": user.firebase_uid,
            "name": user.name,
            "surname": user.surname,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
            "profile_picture": user.profile_picture
        }
    finally:
        db.close()

@router.post("/users/")
async def create_user(
    firebase_uid: str = Form(...),
    name: str = Form(...),
    surname: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    role: str = Form(...),
    recaptcha_token: Optional[str] = Form(None),
    consent_id: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    # Verify reCAPTCHA only if token is provided (user consented to analytics)
    if recaptcha_token:
        await verify_recaptcha(recaptcha_token, action="signup")
    
    if firebase_uid != current_user["uid"]:
        raise HTTPException(status_code=403, detail="UID mismatch")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")

        # Handle profile picture upload
        profile_picture_url = None
        if profile_picture and profile_picture.filename:
            try:
                file_content = await profile_picture.read()
                upload_result = cloudinary.uploader.upload(
                    file_content,
                    folder="realestate-profile-pictures",
                    resource_type="auto"
                )
                profile_picture_url = upload_result["secure_url"]
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to upload profile picture: {str(e)}")

        new_user = User(
            firebase_uid=firebase_uid,
            name=name,
            surname=surname,
            email=email,
            phone=phone,
            role=role,
            profile_picture=profile_picture_url
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # ✅ Merge anonymous consent with new user account
        if consent_id:
            try:
                from app.models import UserConsent
                # Find all consents with this consent_id
                anonymous_consents = db.query(UserConsent).filter(
                    UserConsent.consent_id == consent_id
                ).all()
                
                if anonymous_consents:
                    print(f"✅ Found {len(anonymous_consents)} anonymous consent(s) to merge for consent_id: {consent_id}")
                    for consent in anonymous_consents:
                        # Update with user info
                        consent.user_id = new_user.id
                        consent.firebase_uid = new_user.firebase_uid
                        consent.consent_id = None  # Clear consent_id since user is now logged in
                    db.commit()
                    print(f"✅ Merged {len(anonymous_consents)} consent(s) with new user account")
                else:
                    print(f"ℹ️ No anonymous consents found for consent_id: {consent_id}")
            except Exception as e:
                print(f"⚠️ Error merging consent: {e}")
                # Don't fail user creation if consent merge fails
                db.rollback()

        user_response = {
            "id": new_user.id,
            "firebase_uid": new_user.firebase_uid,
            "name": new_user.name,
            "surname": new_user.surname,
            "email": new_user.email,
            "phone": new_user.phone,
            "role": new_user.role,
            "profile_picture": new_user.profile_picture
        }
        return {"message": "User created successfully!", "user": user_response}
    finally:
        db.close()

@router.get("/me")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == current_user["uid"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "firebase_uid": user.firebase_uid,
            "name": user.name,
            "surname": user.surname,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "profile_picture": user.profile_picture
        }
    finally:
        db.close()

@router.get("/users/{firebase_uid}")
def get_user(firebase_uid: str, current_user: dict = Depends(get_current_user)):
    """Get user profile by firebase_uid - requires authentication"""
    # Only allow users to view their own profile
    if firebase_uid != current_user["uid"]:
        raise HTTPException(
            status_code=403, 
            detail="Forbidden: You can only view your own profile"
        )
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "id": user.id,
            "firebase_uid": user.firebase_uid,
            "name": user.name,
            "surname": user.surname,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "profile_picture": user.profile_picture
        }
    finally:
        db.close()

@router.put("/users/{firebase_uid}")
async def update_user(
    firebase_uid:str,
    name: str = Form(...),
    surname: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    profile_picture: Optional[UploadFile] = File(None),
    remove_profile_picture: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Update user profile - requires authentication"""
    # Only allow users to update their own profile
    if firebase_uid != current_user["uid"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only update your own profile"
        )
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.name = name
        user.surname = surname
        user.email = email
        user.phone = phone

        # Handle profile picture deletion
        if remove_profile_picture == "true" and user.profile_picture:
            try:
                # Extract public_id from Cloudinary URL
                public_id = user.profile_picture.split('/')[-1].split('.')[0]
                public_id_with_folder = f"realestate-profile-pictures/{public_id}"
                cloudinary.uploader.destroy(public_id_with_folder)
            except Exception as e:
                print(f"Error deleting old profile picture: {e}")
            user.profile_picture = None

        # Handle profile picture upload/replacement
        if profile_picture and profile_picture.filename:
            # Delete old profile picture if exists
            if user.profile_picture:
                try:
                    public_id = user.profile_picture.split('/')[-1].split('.')[0]
                    public_id_with_folder = f"realestate-profile-pictures/{public_id}"
                    cloudinary.uploader.destroy(public_id_with_folder)
                except Exception as e:
                    print(f"Error deleting old profile picture: {e}")
            
            # Upload new profile picture
            try:
                file_content = await profile_picture.read()
                upload_result = cloudinary.uploader.upload(
                    file_content,
                    folder="realestate-profile-pictures",
                    resource_type="auto"
                )
                user.profile_picture = upload_result["secure_url"]
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to upload profile picture: {str(e)}")

        db.commit()
        db.refresh(user)

        user_response = {
            "id": user.id,
            "firebase_uid": user.firebase_uid,
            "name": user.name,
            "surname": user.surname,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "profile_picture": user.profile_picture
        }

        return {"message": "User updated successfully", "user": user_response}
    finally:
        db.close()

@router.delete("/users/{firebase_uid}")
def delete_user(firebase_uid: str, current_user: dict = Depends(get_current_user)):
    """Delete user account - requires authentication"""
    # Only allow users to delete their own account
    if firebase_uid != current_user["uid"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only delete your own account"
        )
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Delete profile picture from Cloudinary if exists
        if user.profile_picture:
            try:
                public_id = user.profile_picture.split('/')[-1].split('.')[0]
                public_id_with_folder = f"realestate-profile-pictures/{public_id}"
                cloudinary.uploader.destroy(public_id_with_folder)
            except Exception as e:
                print(f"Error deleting profile picture: {e}")

        # Import UserConsent to delete related consents
        from app.models import UserConsent, Listing
        
        # Delete all user consents first (to avoid foreign key constraint)
        db.query(UserConsent).filter(UserConsent.user_id == user.id).delete()
        
        # Delete all user's listings
        db.query(Listing).filter(Listing.firebase_uid == firebase_uid).delete()
        
        # Now delete the user
        db.delete(user)
        db.commit()

        return {"message": "User and all associated data deleted successfully"}
    finally:
        db.close()


# ==================== FAVORITES ENDPOINTS ====================

# Get user's favorites (requires authentication)
@router.get("/users/{firebase_uid}/favorites")
def get_user_favorites(firebase_uid: str, current_user: dict = Depends(get_current_user)):
    """Get user's favorite listing IDs - requires authentication"""
    # Only allow users to view their own favorites
    if firebase_uid != current_user["uid"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only view your own favorites"
        )
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            return []  # Return empty array instead of 404
        
        favorites = user.favorites if user.favorites is not None else []
        return favorites
    finally:
        db.close()


# Add favorite (requires authentication)
@router.post("/users/{firebase_uid}/favorites/{listing_id}")
def add_user_favorite(firebase_uid: str, listing_id: int, current_user: dict = Depends(get_current_user)):
    """Add a listing to user's favorites - requires authentication"""
    # Only allow users to modify their own favorites
    if firebase_uid != current_user["uid"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only modify your own favorites"
        )
    
    print(f"📥 POST /users/{firebase_uid}/favorites/{listing_id}")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize favorites if None
        if user.favorites is None:
            user.favorites = []
        
        # Add to favorites if not already there
        if listing_id not in user.favorites:
            user.favorites = user.favorites + [listing_id]
            db.commit()
            db.refresh(user)
        
        return {"message": "Listing added to favorites", "favorites": user.favorites}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# Remove favorite (requires authentication)
@router.delete("/users/{firebase_uid}/favorites/{listing_id}")
def remove_user_favorite(firebase_uid: str, listing_id: int, current_user: dict = Depends(get_current_user)):
    """Remove a listing from user's favorites - requires authentication"""
    # Only allow users to modify their own favorites
    if firebase_uid != current_user["uid"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only modify your own favorites"
        )
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize favorites if None
        if user.favorites is None:
            user.favorites = []
        
        # Remove from favorites if present
        if listing_id in user.favorites:
            user.favorites = [fav for fav in user.favorites if fav != listing_id]
            db.commit()
            db.refresh(user)
        
        return {"message": "Listing removed from favorites", "favorites": user.favorites}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# OLD ENDPOINTS (keep for backwards compatibility)

@router.get("/users/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    """Get user's favorite listing IDs"""
    db = SessionLocal()
    try:
        # Try both 'uid' and 'user_id' keys
        user_uid = current_user.get('uid') or current_user.get('user_id')
    
        if not user_uid:
            raise HTTPException(status_code=400, detail="No UID in token")
    
        user = db.query(User).filter(User.firebase_uid == user_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return empty array if favorites is None
        favorites = user.favorites if user.favorites is not None else []
        return favorites
    finally:
        db.close()


@router.post("/users/favorites/{listing_id}")
async def add_favorite(listing_id: int, current_user: dict = Depends(get_current_user)):
    """Add a listing to user's favorites"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == current_user["uid"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if listing exists
        from app.models import Listing
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Initialize favorites if None
        if user.favorites is None:
            user.favorites = []
        
        # Add to favorites if not already there (idempotent)
        if listing_id not in user.favorites:
            user.favorites = user.favorites + [listing_id]  # PostgreSQL array append
            db.commit()
            db.refresh(user)
        
        return {
            "message": "Listing added to favorites",
            "favorites": user.favorites if user.favorites else []
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.delete("/users/favorites/{listing_id}")
async def remove_favorite(listing_id: int, current_user: dict = Depends(get_current_user)):
    """Remove a listing from user's favorites"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == current_user["uid"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize favorites if None
        if user.favorites is None:
            user.favorites = []
        
        # Remove from favorites if present (idempotent)
        if listing_id in user.favorites:
            user.favorites = [fav for fav in user.favorites if fav != listing_id]
            db.commit()
            db.refresh(user)
        
        return {
            "message": "Listing removed from favorites",
            "favorites": user.favorites if user.favorites else []
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()