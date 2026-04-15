import httpx
from app.config import settings
from fastapi import HTTPException

async def verify_recaptcha(token: str, action: str = None) -> bool:
    """
    Verify reCAPTCHA v3 token with Google's API
    
    Args:
        token: The reCAPTCHA token from the frontend
        action: The action name (optional, for additional verification)
    
    Returns:
        bool: True if verification succeeds
        
    Raises:
        HTTPException: If verification fails
    """
    if not settings.RECAPTCHA_SECRET_KEY:
        # If no secret key is configured, log warning but allow in development
        print("⚠️ Warning: RECAPTCHA_SECRET_KEY not configured")
        return True
    
    if not token:
        raise HTTPException(
            status_code=400,
            detail="reCAPTCHA token is required"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.RECAPTCHA_SECRET_KEY,
                    "response": token
                }
            )
            
            result = response.json()
            
            # Check if verification was successful
            if not result.get("success"):
                error_codes = result.get("error-codes", [])
                print(f"❌ reCAPTCHA verification failed: {error_codes}")
                raise HTTPException(
                    status_code=400,
                    detail="reCAPTCHA verification failed. Please try again."
                )
            
            # Check score (v3 returns a score from 0.0 to 1.0)
            score = result.get("score", 0)
            if score < 0.5:  # Threshold for bot detection
                print(f"⚠️ Low reCAPTCHA score: {score}")
                raise HTTPException(
                    status_code=400,
                    detail="Security verification failed. Please try again."
                )
            
            # Optionally verify the action matches
            if action and result.get("action") != action:
                print(f"⚠️ Action mismatch: expected '{action}', got '{result.get('action')}'")
                raise HTTPException(
                    status_code=400,
                    detail="Security verification failed."
                )
            
            print(f"✅ reCAPTCHA verified successfully (score: {score})")
            return True
            
    except httpx.RequestError as e:
        print(f"❌ reCAPTCHA verification request failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify security check. Please try again."
        )
