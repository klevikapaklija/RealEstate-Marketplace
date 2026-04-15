from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import os
from app.database import SessionLocal
from app.models import Listing, Payment
import requests
from datetime import datetime, timedelta

router = APIRouter()

# PayPal Configuration - Add to .env file
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

if not PAYPAL_CLIENT_ID or not PAYPAL_CLIENT_SECRET:
    raise ValueError(
        "PayPal credentials are required. "
        "Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables."
    )
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "live")  # "sandbox" or "live"

# PayPal API URLs - Using LIVE mode
PAYPAL_API_BASE = "https://api-m.paypal.com" if PAYPAL_MODE == "live" else "https://api-m.sandbox.paypal.com"


class CreatePaymentRequest(BaseModel):
    listing_id: int
    firebase_uid: str
    boost_tier: int  # 1 only


class ExecutePaymentRequest(BaseModel):
    order_id: str
    listing_id: int
    boost_tier: int


# Boost pricing (in EUR) - Single tier only
BOOST_PRICES = {
    1: 5.00   # Single boost option - €5.00 (production price)
}

# Tier names
TIER_NAMES = {
    1: "Featured Listing Boost (15 days)"
}


def get_paypal_access_token():
    """Get PayPal access token for API calls"""
    url = f"{PAYPAL_API_BASE}/v1/oauth2/token"
    
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US"
    }
    
    data = {
        "grant_type": "client_credentials"
    }
    
    response = requests.post(
        url,
        headers=headers,
        data=data,
        auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    )
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        raise HTTPException(status_code=500, detail="Failed to get PayPal access token")


@router.post("/payment/create-order")
async def create_payment_order(payment_request: CreatePaymentRequest):
    """
    Create a PayPal order for boosting a listing
    
    Returns PayPal order ID and approval URL for user to complete payment
    """
    
    # Debug logging
    print(f"🔍 Received payment request: {payment_request}")
    print(f"🔍 Listing ID: {payment_request.listing_id}")
    print(f"🔍 Firebase UID: {payment_request.firebase_uid}")
    print(f"🔍 Boost Tier: {payment_request.boost_tier}")
    
    # Validate boost tier
    if payment_request.boost_tier not in BOOST_PRICES:
        raise HTTPException(status_code=400, detail="Invalid boost tier. Must be 1")
    
    # Verify listing exists and user owns it
    db = SessionLocal()
    try:
        listing = db.query(Listing).filter(Listing.id == payment_request.listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.firebase_uid != payment_request.firebase_uid:
            raise HTTPException(status_code=403, detail="You can only boost your own listings")
    finally:
        db.close()
    
    # Get PayPal access token
    try:
        access_token = get_paypal_access_token()
    except Exception as e:
        print(f"❌ PayPal auth error: {e}")
        raise HTTPException(status_code=500, detail=f"PayPal authentication failed: {str(e)}")
    
    # Get price for tier
    price = BOOST_PRICES[payment_request.boost_tier]
    
    # Create PayPal order
    url = f"{PAYPAL_API_BASE}/v2/checkout/orders"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": f"listing_{payment_request.listing_id}",
                "description": f"Listing Boost for Property #{payment_request.listing_id}",
                "amount": {
                    "currency_code": "EUR",
                    "value": f"{price:.2f}",
                    "breakdown": {
                        "item_total": {
                            "currency_code": "EUR",
                            "value": f"{price:.2f}"
                        }
                    }
                },
                "items": [
                    {
                        "name": "Featured Listing Boost",
                        "description": "15 days premium placement",
                        "unit_amount": {
                            "currency_code": "EUR",
                            "value": f"{price:.2f}"
                        },
                        "quantity": "1",
                        "category": "DIGITAL_GOODS"
                    }
                ]
            }
        ],
        "application_context": {
            "brand_name": "RealEstateAL",
            "landing_page": "BILLING",  # Show credit card form directly
            "user_action": "PAY_NOW",
            "return_url": f"https://realestate-frontend-production.up.railway.app/payment/success?listing_id={payment_request.listing_id}&tier={payment_request.boost_tier}",
            "cancel_url": f"https://realestate-frontend-production.up.railway.app/profile",
            "shipping_preference": "NO_SHIPPING"
        }
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    print(f"📤 PayPal Order Creation Response Status: {response.status_code}")
    print(f"📤 PayPal Response: {response.text}")
    
    if response.status_code == 201:
        order_data = response.json()
        
        # Get approval URL
        approval_url = next(
            (link["href"] for link in order_data["links"] if link["rel"] == "approve"),
            None
        )
        
        print(f"✅ PayPal Order Created: {order_data['id']}")
        print(f"🔗 Approval URL: {approval_url}")
        
        return {
            "order_id": order_data["id"],
            "approval_url": approval_url,
            "amount": price,
            "tier": payment_request.boost_tier,
            "tier_name": TIER_NAMES[payment_request.boost_tier]  # ✅ FIXED
        }
    else:
        print(f"❌ PayPal Error Response: {response.text}")
        error_detail = response.json() if response.text else {"message": "Unknown error"}
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create PayPal order: {error_detail.get('message', error_detail)}"
        )


@router.post("/payment/capture-order")
async def capture_payment_order(execute_request: ExecutePaymentRequest):
    """
    Capture/execute a PayPal order after user approval
    
    This is called after user completes payment on PayPal
    """
    
    print(f"💰 Capturing PayPal order: {execute_request.order_id}")
    print(f"📋 Listing ID: {execute_request.listing_id}, Tier: {execute_request.boost_tier}")
    
    # Get PayPal access token
    access_token = get_paypal_access_token()
    
    # Capture the order
    url = f"{PAYPAL_API_BASE}/v2/checkout/orders/{execute_request.order_id}/capture"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.post(url, headers=headers)
    
    print(f"📥 Capture Response Status: {response.status_code}")
    print(f"📥 Capture Response: {response.text}")
    
    if response.status_code == 201:
        capture_data = response.json()
        
        print(f"✅ Payment Status: {capture_data.get('status')}")
        
        # Check if payment was successful or pending
        payment_status = capture_data.get("status")
        
        if payment_status == "COMPLETED":
            # Payment completed successfully
            # Update listing boost in database
            db = SessionLocal()
            try:
                listing = db.query(Listing).filter(Listing.id == execute_request.listing_id).first()
                if listing:
                    # Set boost and expiration date (15 days from now)
                    listing.boosted = execute_request.boost_tier
                    listing.boost_expires_at = datetime.utcnow() + timedelta(days=15)
                    
                    # Get payment amount from capture data
                    amount = float(capture_data["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"])
                    currency = capture_data["purchase_units"][0]["payments"]["captures"][0]["amount"]["currency_code"]
                    
                    # Save payment record
                    payment = Payment(
                        user_id=listing.firebase_uid,  # Use the listing owner's firebase_uid
                        listing_id=execute_request.listing_id,
                        amount=amount,
                        currency=currency,
                        transaction_id=capture_data["id"],
                        status="COMPLETED",
                        payment_method="PAYPAL"
                    )
                    db.add(payment)
                    db.commit()
                    
                    print(f"✅ Listing {execute_request.listing_id} boosted successfully!")
                    print(f"📅 Expires at: {listing.boost_expires_at}")
                    print(f"💾 Payment saved: {amount} {currency} - Transaction ID: {capture_data['id']}")
                    
                    return {
                        "success": True,
                        "message": "Payment successful! Your listing has been boosted for 15 days.",
                        "listing_id": execute_request.listing_id,
                        "boost_tier": execute_request.boost_tier,
                        "expires_at": listing.boost_expires_at.isoformat(),
                        "transaction_id": capture_data["id"],
                        "payer_email": capture_data["payer"]["email_address"] if "payer" in capture_data else None
                    }
                else:
                    print(f"❌ Listing {execute_request.listing_id} not found")
                    raise HTTPException(status_code=404, detail="Listing not found")
            finally:
                db.close()
        elif payment_status == "PENDING":
            # Payment is pending (awaiting bank verification)
            print(f"⏳ Payment is PENDING - awaiting verification")
            raise HTTPException(
                status_code=202, 
                detail="Payment is being verified by your bank. Please complete the verification in your banking app or SMS, then try again."
            )
        else:
            print(f"⚠️ Payment status is not COMPLETED: {payment_status}")
            raise HTTPException(status_code=400, detail=f"Payment status: {payment_status}. Please contact support if money was deducted.")
    elif response.status_code == 422:
        # Order might have already been captured
        error_data = response.json() if response.text else {}
        error_name = error_data.get('details', [{}])[0].get('issue', '')
        
        if 'INSTRUMENT_DECLINED' in error_name or 'INSTRUMENT' in error_name:
            print(f"❌ Payment instrument declined")
            raise HTTPException(
                status_code=400,
                detail="Payment declined by your bank. Please verify your card details or try a different payment method."
            )
        else:
            print(f"❌ PayPal 422 Error: {response.text}")
            raise HTTPException(
                status_code=400,
                detail="Payment could not be processed. Please try again or contact support."
            )
    else:
        print(f"❌ PayPal Capture Error: {response.text}")
        error_data = response.json() if response.text else {}
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to capture payment: {error_data.get('message', 'Unknown error')}"
        )


@router.get("/payment/prices")
async def get_boost_prices():
    """Get current boost pricing - Single tier only"""
    return {
        "prices": [
            {
                "tier": 1,
                "name": "Featured Listing",
                "duration": "15 days",
                "price": BOOST_PRICES[1],
                "currency": "EUR",
                "features": [
                    "Featured on homepage for maximum visibility",
                    "Top of search results in all categories", 
                    "Special featured badge on your listing",
                    "15 days of premium placement"
                ]
            }
        ]
    }


@router.post("/payment/webhook")
async def paypal_webhook(request: Request):
    """
    PayPal webhook for payment notifications
    
    Configure this URL in your PayPal Developer Dashboard:
    https://your-domain.com/payment/webhook
    """
    
    body = await request.json()
    
    # Verify webhook signature (recommended for production)
    # You can implement webhook signature verification here
    
    event_type = body.get("event_type")
    
    if event_type == "PAYMENT.CAPTURE.COMPLETED":
        # Payment was successful
        resource = body.get("resource", {})
        order_id = resource.get("id")
        
        print(f"✅ Payment completed for order: {order_id}")
        
        # You can add additional logic here
        # e.g., send confirmation email, update analytics, etc.
        
    elif event_type == "PAYMENT.CAPTURE.DENIED":
        # Payment was denied
        print(f"❌ Payment denied")
        
    return {"status": "received"}