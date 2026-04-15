from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response
import os
import base64
import json
from app.database import Base, engine, ensure_all_columns_exist
from app import models
import firebase_admin
from firebase_admin import credentials

# Initialize Firebase Admin SDK
# Load from base64 environment variable (required for security)
firebase_creds_base64 = os.getenv("FIREBASE_CREDENTIALS_BASE64")
if not firebase_creds_base64:
    raise ValueError(
        "FIREBASE_CREDENTIALS_BASE64 environment variable is required. "
        "Please provide your Firebase service account as base64-encoded JSON. "
        "Never commit credentials to git or use local file paths."
    )
print("🔐 Loading Firebase credentials from environment variable...")
cred_json = base64.b64decode(firebase_creds_base64)
cred_dict = json.loads(cred_json)
cred = credentials.Certificate(cred_dict)

firebase_admin.initialize_app(cred)

# ✅ Create all tables if they don’t exist yet
print("🔄 Checking for missing tables...")
Base.metadata.create_all(bind=engine)
print("✅ All tables are ready.")

Base.metadata.create_all(bind=engine)
ensure_all_columns_exist(Base)

from app.routes import users
from app.routes import listings
from app.routes import map as map_routes
from app.routes import payment
from app.routes import consent
from app.routes import panorama
from app import admin
from app import chatbot

app = FastAPI()

# ✅ Make sure the upload directory exists
os.makedirs("uploads", exist_ok=True)

# ✅ Serve uploaded images so the frontend can access them
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(users.router, prefix="/api")
app.include_router(listings.router, prefix="/api")
app.include_router(map_routes.router, prefix="/api")
app.include_router(admin.router, prefix="/api")  # Admin routes
app.include_router(chatbot.router, prefix="/api")  # Chatbot routes
app.include_router(payment.router, prefix="/api")  # Payment routes
app.include_router(consent.router, prefix="/api")  # Consent tracking routes
app.include_router(panorama.router, prefix="/api")  # 360° Panorama stitching routes

# CORS setup
# Allow local frontend and any other origins you add
FRONTEND_URL = os.getenv("FRONTEND_URL", "")  # Will set this in Railway later
origins = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",
    "http://192.168.100.1:3000",  # Your local network for phone testing
    "https://realestate-frontend-production.up.railway.app",  # Production frontend
    "https://realestateal.al",  # Custom domain
    "http://realestateal.al",  # Custom domain HTTP
]

# Add production frontend URL if it exists
if FRONTEND_URL:
    origins.append(FRONTEND_URL)

# Configure CORS with restricted origins for security
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://realestateal.al,https://www.realestateal.al"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Restrict to specific origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Content-Type"],
)

@app.middleware("http")
async def add_cors_headers(request, call_next):
    """Add CORS headers to static file responses"""
    response = await call_next(request)
    
    # Add CORS headers to all responses, especially static files
    if request.url.path.startswith("/uploads"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    
    return response

@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Content Security Policy - Allow necessary resources for your app
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.gstatic.com https://www.google.com https://apis.google.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "img-src 'self' data: https: blob:; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "connect-src 'self' https://www.google-analytics.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; "
        "frame-src 'self' https://www.google.com https://realestateal.up.railway.app; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )
    
    # X-Frame-Options - Prevent clickjacking (SAMEORIGIN allows same-domain framing)
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    
    # X-Content-Type-Options - Prevent MIME sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # Referrer-Policy - Control referrer information
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Permissions-Policy - Control browser features
    response.headers["Permissions-Policy"] = (
        "geolocation=(), "
        "microphone=(), "
        "camera=(), "
        "payment=(), "
        "usb=(), "
        "magnetometer=(), "
        "gyroscope=(), "
        "accelerometer=()"
    )
    
    return response
