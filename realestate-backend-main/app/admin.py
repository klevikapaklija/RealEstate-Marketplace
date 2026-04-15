from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from app.database import SessionLocal
from app.models import User, Listing, Payment, SoldProperty
from app.config import settings
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import os

router = APIRouter()


def verify_admin(x_firebase_uid: str = Header(None, alias="firebase-uid"), x_admin_key: str = Header(None, alias="admin-key")):
    """
    Verify if the request is from an admin user.
    Requires two headers:
    - firebase-uid: The admin's Firebase UID
    - admin-key: Secret admin key
    """
    if not x_firebase_uid or not x_admin_key:
        raise HTTPException(status_code=401, detail="Missing admin credentials")
    
    if x_firebase_uid != settings.ADMIN_FIREBASE_UID or x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Admin access denied")
    
    return x_firebase_uid


@router.get("/admin/stats")
async def get_admin_stats(admin_uid: str = Depends(verify_admin)):
    """
    Get overall platform statistics including revenue, sold properties, and boosting data
    Requires admin authentication
    """
    db = SessionLocal()
    try:
        # User stats
        total_users = db.query(User).count()
        users_by_role = {
            "person": db.query(User).filter(User.role == "person").count(),
            "agent": db.query(User).filter(User.role == "agent").count(),
            "agency": db.query(User).filter(User.role == "agency").count()
        }
        
        # Listing stats
        total_listings = db.query(Listing).count()
        total_sale = db.query(Listing).filter(Listing.type == "sale").count()
        total_rent = db.query(Listing).filter(Listing.type == "rent").count()
        total_boosted = db.query(Listing).filter(Listing.boosted > 0).count()
        active_boosted = db.query(Listing).filter(
            Listing.boosted > 0,
            Listing.boost_expires_at > datetime.utcnow()
        ).count()
        
        # Property type breakdown
        total_apartments = db.query(Listing).filter(Listing.property_type == "apartment").count()
        total_homes = db.query(Listing).filter(Listing.property_type == "private_home").count()
        total_land = db.query(Listing).filter(Listing.property_type == "land").count()
        total_business = db.query(Listing).filter(Listing.property_type == "business").count()
        
        # Get total views across all listings
        listings = db.query(Listing).all()
        total_views = sum(listing.views or 0 for listing in listings)
        
        # Payment/Revenue stats
        total_payments = db.query(Payment).filter(Payment.status == "COMPLETED").count()
        total_revenue_eur = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "COMPLETED",
            Payment.currency == "EUR"
        ).scalar() or 0.0
        
        # Revenue by time periods
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)
        month_start = now - timedelta(days=30)
        
        revenue_today = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "COMPLETED",
            Payment.created_at >= today_start
        ).scalar() or 0.0
        
        revenue_week = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "COMPLETED",
            Payment.created_at >= week_start
        ).scalar() or 0.0
        
        revenue_month = db.query(func.sum(Payment.amount)).filter(
            Payment.status == "COMPLETED",
            Payment.created_at >= month_start
        ).scalar() or 0.0
        
        # Sold properties stats
        total_sold = db.query(SoldProperty).count()
        sold_today = db.query(SoldProperty).filter(
            SoldProperty.sold_at >= today_start
        ).count()
        sold_week = db.query(SoldProperty).filter(
            SoldProperty.sold_at >= week_start
        ).count()
        sold_month = db.query(SoldProperty).filter(
            SoldProperty.sold_at >= month_start
        ).count()
        
        # Calculate total value of sold properties
        total_sold_value = db.query(func.sum(SoldProperty.price)).scalar() or 0.0
        
        # Top sellers
        top_sellers = db.query(
            SoldProperty.user_id,
            func.count(SoldProperty.id).label('count'),
            func.sum(SoldProperty.price).label('total_value')
        ).group_by(SoldProperty.user_id).order_by(desc('count')).limit(5).all()
        
        top_sellers_data = []
        for seller in top_sellers:
            user = db.query(User).filter(User.firebase_uid == seller.user_id).first()
            top_sellers_data.append({
                "user_id": seller.user_id,
                "name": f"{user.name} {user.surname}" if user else "Unknown",
                "sales_count": seller.count,
                "total_value": float(seller.total_value or 0)
            })
        
        # Recent payments
        recent_payments = db.query(Payment).filter(
            Payment.status == "COMPLETED"
        ).order_by(desc(Payment.created_at)).limit(10).all()
        
        recent_payments_data = []
        for payment in recent_payments:
            user = db.query(User).filter(User.firebase_uid == payment.user_id).first()
            listing = db.query(Listing).filter(Listing.id == payment.listing_id).first()
            recent_payments_data.append({
                "id": payment.id,
                "amount": payment.amount,
                "currency": payment.currency,
                "user_name": f"{user.name} {user.surname}" if user else "Unknown",
                "listing_title": listing.title if listing else "Deleted",
                "transaction_id": payment.transaction_id,
                "created_at": payment.created_at.isoformat() if payment.created_at else None
            })
        
        return {
            "users": {
                "total": total_users,
                "by_role": users_by_role
            },
            "listings": {
                "total": total_listings,
                "for_sale": total_sale,
                "for_rent": total_rent,
                "boosted": total_boosted,
                "active_boosted": active_boosted,
                "by_property_type": {
                    "apartments": total_apartments,
                    "private_homes": total_homes,
                    "land": total_land,
                    "business": total_business
                }
            },
            "revenue": {
                "total": float(total_revenue_eur),
                "currency": "EUR",
                "total_transactions": total_payments,
                "today": float(revenue_today),
                "last_7_days": float(revenue_week),
                "last_30_days": float(revenue_month),
                "recent_payments": recent_payments_data
            },
            "sold_properties": {
                "total": total_sold,
                "total_value": float(total_sold_value),
                "today": sold_today,
                "last_7_days": sold_week,
                "last_30_days": sold_month,
                "top_sellers": top_sellers_data
            },
            "engagement": {
                "total_views": total_views
            }
        }
    finally:
        db.close()


@router.get("/admin/users")
async def get_all_users(
    admin_uid: str = Depends(verify_admin),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all users with pagination
    Requires admin authentication
    """
    db = SessionLocal()
    try:
        users = db.query(User).offset(skip).limit(limit).all()
        
        return {
            "total": db.query(User).count(),
            "skip": skip,
            "limit": limit,
            "users": [
                {
                    "id": user.id,
                    "firebase_uid": user.firebase_uid,
                    "email": user.email,
                    "name": user.name,
                    "surname": user.surname,
                    "phone": user.phone,
                    "role": user.role
                }
                for user in users
            ]
        }
    finally:
        db.close()


@router.get("/admin/listings")
async def get_all_listings_admin(
    admin_uid: str = Depends(verify_admin),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all listings with full details for admin
    Requires admin authentication
    """
    db = SessionLocal()
    try:
        from app.routes.listings import serialize_listing
        
        listings = db.query(Listing).offset(skip).limit(limit).all()
        
        return {
            "total": db.query(Listing).count(),
            "skip": skip,
            "limit": limit,
            "listings": [serialize_listing(listing) for listing in listings]
        }
    finally:
        db.close()


@router.delete("/admin/listings/{listing_id}")
async def delete_listing_admin(
    listing_id: int,
    admin_uid: str = Depends(verify_admin)
):
    """
    Delete any listing (admin override)
    Requires admin authentication
    """
    db = SessionLocal()
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Delete associated images
        if listing.images:
            import json
            image_paths = json.loads(listing.images)
            for img_path in image_paths:
                try:
                    if os.path.exists(img_path):
                        os.remove(img_path)
                        print(f"🗑️ Admin deleted image: {img_path}")
                except Exception as e:
                    print(f"⚠️ Failed to delete image {img_path}: {e}")
        
        # Delete the listing
        db.delete(listing)
        db.commit()
        
        return {
            "message": "Listing deleted successfully by admin",
            "listing_id": listing_id,
            "deleted_by": admin_uid
        }
    finally:
        db.close()


@router.delete("/admin/users/{firebase_uid}")
async def delete_user_admin(
    firebase_uid: str,
    admin_uid: str = Depends(verify_admin),
    delete_listings: bool = False
):
    """
    Delete a user account (admin override)
    If delete_listings=true, also deletes all their listings
    Requires admin authentication
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent admin from deleting themselves
        if firebase_uid == admin_uid:
            raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
        deleted_listings = 0
        if delete_listings:
            # Delete all user's listings
            listings = db.query(Listing).filter(Listing.firebase_uid == firebase_uid).all()
            
            for listing in listings:
                # Delete images
                if listing.images:
                    import json
                    image_paths = json.loads(listing.images)
                    for img_path in image_paths:
                        try:
                            if os.path.exists(img_path):
                                os.remove(img_path)
                        except Exception as e:
                            print(f"⚠️ Failed to delete image: {e}")
                
                db.delete(listing)
                deleted_listings += 1
        
        # Delete the user
        db.delete(user)
        db.commit()
        
        return {
            "message": "User deleted successfully by admin",
            "firebase_uid": firebase_uid,
            "deleted_listings": deleted_listings,
            "deleted_by": admin_uid
        }
    finally:
        db.close()


@router.put("/admin/users/{firebase_uid}/role")
async def update_user_role(
    firebase_uid: str,
    role: str,
    admin_uid: str = Depends(verify_admin)
):
    """
    Update a user's role
    Available roles: person, agent, admin
    Requires admin authentication
    """
    valid_roles = ["person", "agent", "admin"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        old_role = user.role
        user.role = role
        db.commit()
        
        return {
            "message": "User role updated successfully",
            "firebase_uid": firebase_uid,
            "old_role": old_role,
            "new_role": role,
            "updated_by": admin_uid
        }
    finally:
        db.close()


@router.put("/admin/listings/{listing_id}/boost")
async def admin_boost_listing(
    listing_id: int,
    tier: int,
    admin_uid: str = Depends(verify_admin)
):
    """
    Boost any listing (admin override, free boost)
    Requires admin authentication
    """
    if tier < 0 or tier > 3:
        raise HTTPException(status_code=400, detail="Boost tier must be between 0-3")
    
    db = SessionLocal()
    try:
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        old_boost = listing.boosted
        listing.boosted = tier
        db.commit()
        
        return {
            "message": "Listing boost updated by admin",
            "listing_id": listing_id,
            "old_boost": old_boost,
            "new_boost": tier,
            "boosted_by": admin_uid
        }
    finally:
        db.close()


@router.get("/admin/search")
async def admin_search(
    admin_uid: str = Depends(verify_admin),
    query: str = "",
    type: Optional[str] = None
):
    """
    Search across users and listings
    type: 'users' or 'listings' or None (both)
    """
    db = SessionLocal()
    try:
        results = {}
        
        if type in [None, "users"]:
            # Search users by email, name, or phone
            users = db.query(User).filter(
                (User.email.ilike(f"%{query}%")) |
                (User.name.ilike(f"%{query}%")) |
                (User.surname.ilike(f"%{query}%")) |
                (User.phone.ilike(f"%{query}%"))
            ).limit(50).all()
            
            results["users"] = [
                {
                    "id": user.id,
                    "firebase_uid": user.firebase_uid,
                    "email": user.email,
                    "name": user.name,
                    "surname": user.surname,
                    "phone": user.phone,
                    "role": user.role
                }
                for user in users
            ]
        
        if type in [None, "listings"]:
            # Search listings by title, location, or description
            listings = db.query(Listing).filter(
                (Listing.title.ilike(f"%{query}%")) |
                (Listing.location.ilike(f"%{query}%")) |
                (Listing.description.ilike(f"%{query}%"))
            ).limit(50).all()
            
            from app.routes.listings import serialize_listing
            results["listings"] = [serialize_listing(listing) for listing in listings]
        
        return results
    finally:
        db.close()


@router.get("/admin/sold-properties")
async def get_sold_properties(
    admin_uid: str = Depends(verify_admin),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all sold properties with pagination
    Requires admin authentication
    """
    db = SessionLocal()
    try:
        sold_props = db.query(SoldProperty).order_by(
            desc(SoldProperty.sold_at)
        ).offset(skip).limit(limit).all()
        
        sold_data = []
        for prop in sold_props:
            user = db.query(User).filter(User.firebase_uid == prop.user_id).first()
            sold_data.append({
                "id": prop.id,
                "listing_id": prop.listing_id,
                "title": prop.title,
                "location": prop.location,
                "price": prop.price,
                "type": prop.type,
                "property_type": prop.property_type,
                "seller": {
                    "firebase_uid": prop.user_id,
                    "name": f"{user.name} {user.surname}" if user else "Unknown",
                    "email": user.email if user else None,
                    "phone": user.phone if user else None
                },
                "sold_at": prop.sold_at.isoformat() if prop.sold_at else None
            })
        
        return {
            "total": db.query(SoldProperty).count(),
            "skip": skip,
            "limit": limit,
            "sold_properties": sold_data
        }
    finally:
        db.close()


@router.get("/admin/payments")
async def get_payments(
    admin_uid: str = Depends(verify_admin),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """
    Get all payments with pagination
    status: 'COMPLETED', 'PENDING', 'FAILED', or None (all)
    Requires admin authentication
    """
    db = SessionLocal()
    try:
        query = db.query(Payment)
        
        if status:
            query = query.filter(Payment.status == status)
        
        payments = query.order_by(desc(Payment.created_at)).offset(skip).limit(limit).all()
        
        payments_data = []
        for payment in payments:
            user = db.query(User).filter(User.firebase_uid == payment.user_id).first()
            listing = db.query(Listing).filter(Listing.id == payment.listing_id).first()
            
            payments_data.append({
                "id": payment.id,
                "amount": payment.amount,
                "currency": payment.currency,
                "status": payment.status,
                "payment_method": payment.payment_method,
                "transaction_id": payment.transaction_id,
                "user": {
                    "firebase_uid": payment.user_id,
                    "name": f"{user.name} {user.surname}" if user else "Unknown",
                    "email": user.email if user else None
                },
                "listing": {
                    "id": payment.listing_id,
                    "title": listing.title if listing else "Deleted Listing",
                    "location": listing.location if listing else None
                },
                "created_at": payment.created_at.isoformat() if payment.created_at else None
            })
        
        total_query = db.query(Payment)
        if status:
            total_query = total_query.filter(Payment.status == status)
        
        return {
            "total": total_query.count(),
            "skip": skip,
            "limit": limit,
            "payments": payments_data
        }
    finally:
        db.close()
