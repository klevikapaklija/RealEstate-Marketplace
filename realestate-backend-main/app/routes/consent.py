from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
from app.database import SessionLocal
from app.models import UserConsent, User
from firebase_admin import auth

router = APIRouter(prefix="/consent", tags=["consent"])
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ConsentRequest(BaseModel):
    consent_type: str  # "terms", "privacy", "cookies", "all"
    version: str = "v1.0"
    accepted: bool = True
    cookie_preferences: Optional[Dict[str, bool]] = None  # {"necessary": true, "analytics": false}
    consent_id: Optional[str] = None  # Anonymous consent ID for non-logged-in users

def get_client_info(request: Request):
    """Extract client user agent (no IP address tracking for privacy)"""
    user_agent = request.headers.get("User-Agent", "unknown")
    return user_agent

async def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get current user from Firebase token (optional - returns None if not logged in)
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None, None, None
    
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token.get("uid")
        
        # Get user from database
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        user_id = user.id if user else None
        
        return firebase_uid, user_id, decoded_token
    except Exception as e:
        # Invalid token, treat as anonymous
        return None, None, None

@router.post("/save")
async def save_consent(
    consent_req: ConsentRequest,
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Save user consent for terms, privacy policy, or cookies.
    Can be called by logged-in users (with Firebase token) or anonymous users.
    """
    firebase_uid = None
    user_id = None
    
    # Try to get user info if logged in
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.replace("Bearer ", "")
            decoded_token = auth.verify_id_token(token)
            firebase_uid = decoded_token.get("uid")
            
            # Get user_id from database
            user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
            if user:
                user_id = user.id
        except Exception as e:
            # User not logged in or invalid token, continue as anonymous
            print(f"Token verification failed: {e}")
            pass
    
    # Get client info (user agent only, no IP for privacy)
    user_agent = get_client_info(request)
    
    # Handle "all" consent type (saves all three)
    consent_types = []
    if consent_req.consent_type == "all":
        consent_types = ["terms", "privacy", "cookies"]
    else:
        consent_types = [consent_req.consent_type]
    
    saved_consents = []
    
    try:
        for consent_type in consent_types:
            # Check if consent already exists for this user (to avoid duplicates after merge)
            existing_consent = None
            if firebase_uid:
                existing_consent = db.query(UserConsent).filter(
                    UserConsent.firebase_uid == firebase_uid,
                    UserConsent.consent_type == consent_type
                ).order_by(UserConsent.timestamp.desc()).first()
                
                if existing_consent:
                    print(f"DEBUG - Found existing consent to update: id={existing_consent.id}, type={consent_type}, consent_id={existing_consent.consent_id}")
                else:
                    print(f"DEBUG - No existing consent found for firebase_uid={firebase_uid}, type={consent_type}")
            elif consent_req.consent_id:
                # For anonymous users, check by consent_id
                existing_consent = db.query(UserConsent).filter(
                    UserConsent.consent_id == consent_req.consent_id,
                    UserConsent.consent_type == consent_type
                ).order_by(UserConsent.timestamp.desc()).first()
                
                if existing_consent:
                    print(f"DEBUG - Found existing anonymous consent to update: id={existing_consent.id}, type={consent_type}")
            
            if existing_consent:
                # Update existing consent record and clear consent_id
                print(f"DEBUG - Updating existing consent: id={existing_consent.id}, type={consent_type}, firebase_uid={firebase_uid}, user_id={user_id}")
                existing_consent.version = consent_req.version
                existing_consent.accepted = consent_req.accepted
                existing_consent.cookie_preferences = consent_req.cookie_preferences if consent_type == "cookies" else None
                existing_consent.user_agent = user_agent
                existing_consent.timestamp = datetime.utcnow()
                existing_consent.consent_id = None  # Clear consent_id on update
                
                saved_consents.append({
                    "consent_type": consent_type,
                    "version": consent_req.version,
                    "accepted": consent_req.accepted,
                    "timestamp": existing_consent.timestamp.isoformat(),
                    "updated": True
                })
            else:
                # Create new consent record
                new_consent = UserConsent(
                    user_id=user_id,
                    firebase_uid=firebase_uid,
                    consent_id=consent_req.consent_id if not firebase_uid else None,  # Only store consent_id for anonymous users
                    consent_type=consent_type,
                    version=consent_req.version,
                    accepted=consent_req.accepted,
                    cookie_preferences=consent_req.cookie_preferences if consent_type == "cookies" else None,
                    user_agent=user_agent,
                    timestamp=datetime.utcnow()
                )
                
                print(f"DEBUG - Adding new consent: type={consent_type}, firebase_uid={firebase_uid}, consent_id={consent_req.consent_id if not firebase_uid else None}, user_id={user_id}, user_agent={user_agent}")
                db.add(new_consent)
                saved_consents.append({
                    "consent_type": consent_type,
                    "version": consent_req.version,
                    "accepted": consent_req.accepted,
                    "timestamp": new_consent.timestamp.isoformat(),
                    "updated": False
                })
        
        print(f"DEBUG - Committing {len(saved_consents)} consent records to database...")
        db.commit()
        print(f"DEBUG - ✅ Consent commit successful!")
        
        # Verify the save
        for consent_type in consent_types:
            check = db.query(UserConsent).filter(
                UserConsent.firebase_uid == firebase_uid if firebase_uid else UserConsent.consent_id == consent_req.consent_id,
                UserConsent.consent_type == consent_type
            ).order_by(UserConsent.timestamp.desc()).first()
            print(f"DEBUG - Verification: {consent_type} consent exists in DB: {check is not None}")
        
        return {
            "success": True,
            "message": "Consent saved successfully",
            "consents": saved_consents,
            "user_logged_in": firebase_uid is not None,
            "firebase_uid": firebase_uid,
            "user_id": user_id
        }
    except Exception as e:
        print(f"ERROR - Failed to save consent: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save consent: {str(e)}")

@router.post("/merge")
async def merge_anonymous_consent(
    request: Request,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Merge anonymous consent records (identified by consent_id from localStorage)
    with the logged-in user's account after they register/login.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Verify user is logged in
        token = authorization.replace("Bearer ", "")
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token.get("uid")
        
        # Get user from database
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get consent_id from request body
        body = await request.json()
        consent_id = body.get("consent_id")
        
        if not consent_id:
            return {
                "success": True,
                "message": "No consent_id provided, nothing to merge",
                "merged_count": 0
            }
        
        print(f"DEBUG - Merging consent_id '{consent_id}' to firebase_uid '{firebase_uid}' (user_id: {user.id})")
        
        # Find all anonymous consent records with this consent_id
        anonymous_consents = db.query(UserConsent).filter(
            UserConsent.consent_id == consent_id,
            UserConsent.firebase_uid == None
        ).all()
        
        if not anonymous_consents:
            print(f"DEBUG - No anonymous consents found with consent_id '{consent_id}'")
            return {
                "success": True,
                "message": "No anonymous consents found to merge",
                "merged_count": 0
            }
        
        # Update all anonymous records to belong to this user
        merged_count = 0
        for consent in anonymous_consents:
            consent.firebase_uid = firebase_uid
            consent.user_id = user.id
            consent.consent_id = None  # Clear consent_id after merge
            merged_count += 1
            print(f"DEBUG - Merged consent record: {consent.consent_type} from {consent.timestamp}")
        
        db.commit()
        print(f"DEBUG - ✅ Successfully merged {merged_count} consent records")
        
        return {
            "success": True,
            "message": f"Successfully merged {merged_count} consent record(s)",
            "merged_count": merged_count,
            "firebase_uid": firebase_uid,
            "user_id": user.id
        }
        
    except Exception as e:
        print(f"ERROR - Failed to merge consents: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to merge consents: {str(e)}")

@router.get("/status")
async def get_consent_status(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get user's current consent status.
    Returns the latest consent for each type.
    """
    firebase_uid = None
    
    # Try to get user info if logged in
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.replace("Bearer ", "")
            decoded_token = auth.verify_id_token(token)
            firebase_uid = decoded_token.get("uid")
        except Exception as e:
            pass
    
    if not firebase_uid:
        return {
            "success": False,
            "message": "User not logged in",
            "consents": {}
        }
    
    # Get latest consent for each type
    consent_types = ["terms", "privacy", "cookies"]
    consents = {}
    
    for consent_type in consent_types:
        latest_consent = db.query(UserConsent).filter(
            UserConsent.firebase_uid == firebase_uid,
            UserConsent.consent_type == consent_type
        ).order_by(UserConsent.timestamp.desc()).first()
        
        if latest_consent:
            consents[consent_type] = {
                "version": latest_consent.version,
                "accepted": latest_consent.accepted,
                "timestamp": latest_consent.timestamp.isoformat(),
                "cookie_preferences": latest_consent.cookie_preferences
            }
        else:
            consents[consent_type] = None
    
    return {
        "success": True,
        "firebase_uid": firebase_uid,
        "consents": consents
    }

@router.get("/history")
async def get_consent_history(
    request: Request,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Get full consent history for the user.
    Requires authentication.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token.get("uid")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    
    # Get all consents for this user
    consents = db.query(UserConsent).filter(
        UserConsent.firebase_uid == firebase_uid
    ).order_by(UserConsent.timestamp.desc()).all()
    
    history = []
    for consent in consents:
        history.append({
            "id": consent.id,
            "consent_type": consent.consent_type,
            "version": consent.version,
            "accepted": consent.accepted,
            "cookie_preferences": consent.cookie_preferences,
            "user_agent": consent.user_agent,
            "timestamp": consent.timestamp.isoformat()
        })
    
    return {
        "success": True,
        "total": len(history),
        "history": history
    }

@router.get("/all")
async def get_all_consents(db: Session = Depends(get_db)):
    """
    Get ALL consent records in the database (for admin/debugging).
    Returns all consents with user info.
    """
    try:
        # Get all consents ordered by most recent
        consents = db.query(UserConsent).order_by(UserConsent.timestamp.desc()).limit(100).all()
        
        results = []
        for consent in consents:
            results.append({
                "id": consent.id,
                "user_id": consent.user_id,
                "firebase_uid": consent.firebase_uid,
                "consent_id": consent.consent_id,
                "consent_type": consent.consent_type,
                "version": consent.version,
                "accepted": consent.accepted,
                "cookie_preferences": consent.cookie_preferences,
                "user_agent": consent.user_agent[:50] + "..." if consent.user_agent and len(consent.user_agent) > 50 else consent.user_agent,
                "timestamp": consent.timestamp.isoformat() if consent.timestamp else None
            })
        
        return {
            "success": True,
            "total": len(results),
            "message": f"Showing {len(results)} most recent consent records",
            "consents": results
        }
    except Exception as e:
        print(f"ERROR - Failed to fetch consents: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch consents: {str(e)}")

@router.get("/stats")
async def get_consent_stats(db: Session = Depends(get_db)):
    """
    Get consent statistics - total counts by type.
    """
    try:
        total_consents = db.query(UserConsent).count()
        
        # Count by type
        terms_count = db.query(UserConsent).filter(UserConsent.consent_type == "terms").count()
        privacy_count = db.query(UserConsent).filter(UserConsent.consent_type == "privacy").count()
        cookies_count = db.query(UserConsent).filter(UserConsent.consent_type == "cookies").count()
        
        # Count unique users
        unique_firebase_uids = db.query(UserConsent.firebase_uid).distinct().filter(UserConsent.firebase_uid.isnot(None)).count()
        unique_user_ids = db.query(UserConsent.user_id).distinct().filter(UserConsent.user_id.isnot(None)).count()
        
        # Get most recent consent
        latest_consent = db.query(UserConsent).order_by(UserConsent.timestamp.desc()).first()
        
        return {
            "success": True,
            "total_records": total_consents,
            "by_type": {
                "terms": terms_count,
                "privacy": privacy_count,
                "cookies": cookies_count
            },
            "unique_users": {
                "firebase_uids": unique_firebase_uids,
                "user_ids": unique_user_ids
            },
            "latest_consent": {
                "id": latest_consent.id if latest_consent else None,
                "type": latest_consent.consent_type if latest_consent else None,
                "timestamp": latest_consent.timestamp.isoformat() if latest_consent and latest_consent.timestamp else None
            } if latest_consent else None
        }
    except Exception as e:
        print(f"ERROR - Failed to get consent stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")
