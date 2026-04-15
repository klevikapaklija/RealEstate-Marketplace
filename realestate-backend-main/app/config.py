import os
from pathlib import Path
from dotenv import load_dotenv

# Get the directory where this config.py file is located
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file in the backend directory
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

# Debug: Print if .env was found
if env_path.exists():
    print(f"✅ Loaded .env from: {env_path}")
else:
    print(f"⚠️ .env file not found at: {env_path}")

class Settings:
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    def __post_init__(self):
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL environment variable is required")
    
    # Map API Keys
    MAPBOX_ACCESS_TOKEN: str = os.getenv("MAPBOX_ACCESS_TOKEN", "")
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    
    # Map Default Settings
    MAP_DEFAULT_CENTER_LAT: float = float(os.getenv("MAP_DEFAULT_CENTER_LAT", "41.3275"))
    MAP_DEFAULT_CENTER_LNG: float = float(os.getenv("MAP_DEFAULT_CENTER_LNG", "19.8187"))
    MAP_DEFAULT_ZOOM: int = int(os.getenv("MAP_DEFAULT_ZOOM", "12"))
    
    # Admin Configuration
    ADMIN_FIREBASE_UID: str = os.getenv("ADMIN_FIREBASE_UID", "")
    ADMIN_SECRET_KEY: str = os.getenv("ADMIN_SECRET_KEY", "")
    
    # reCAPTCHA
    RECAPTCHA_SECRET_KEY: str = os.getenv("RECAPTCHA_SECRET_KEY", "")
    
    # CORS Origins
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
