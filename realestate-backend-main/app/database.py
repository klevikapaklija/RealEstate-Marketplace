from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# ✅ Database URL (PostgreSQL)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Test@localhost/test"
)

# Fix Railway's postgres:// URL to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = DATABASE_URL

# ✅ Engine with connection pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=20,        # Base pool size
    max_overflow=40,     # Allow overflow connections
    pool_timeout=60,     # Wait longer before timeout
    pool_recycle=300     # Recycle connections after 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ✅ Auto-column sync helper
def ensure_all_columns_exist(Base):
    """
    Checks all SQLAlchemy models for missing columns and adds them automatically
    if they are missing (works for PostgreSQL).
    """
    try:
        with engine.connect() as conn:
            with conn.begin():
                inspector = inspect(engine)
                
                # Ensure users table has all required columns
                if "users" in Base.metadata.tables:
                    required_columns = {
                        "surname": "TEXT",
                        "phone": "TEXT",
                        "role": "TEXT DEFAULT 'person'",
                        "favorites": "INTEGER[] DEFAULT '{}'",
                        "profile_picture": "TEXT"
                    }
                    
                    existing_cols = [col["name"] for col in inspector.get_columns("users")]
                    
                    for col_name, col_type in required_columns.items():
                        if col_name not in existing_cols:
                            try:
                                print(f"Adding missing column '{col_name}' to users table...")
                                conn.execute(text(f'ALTER TABLE users ADD COLUMN {col_name} {col_type}'))
                                print(f"✅ Added {col_name} column successfully")
                            except Exception as e:
                                print(f"⚠️ Failed to add column {col_name}: {str(e)}")
                    
                    # Create GIN index for favorites array (for fast lookups)
                    try:
                        conn.execute(text('CREATE INDEX IF NOT EXISTS idx_users_favorites ON users USING GIN (favorites)'))
                        print("✅ Created GIN index on favorites column")
                    except Exception as e:
                        print(f"⚠️ Index creation note: {str(e)}")
                
                # Check firebase_uid type
                if "users" in Base.metadata.tables:
                    cols = inspector.get_columns("users")
                    for c in cols:
                        if c["name"] == "firebase_uid":
                            col_type_str = str(c["type"]).lower()
                            if "char" not in col_type_str and "text" not in col_type_str:
                                try:
                                    print(f"ℹ️ Detected users.firebase_uid as {c['type']}; attempting to ALTER to TEXT")
                                    conn.execute(
                                        text('ALTER TABLE users ALTER COLUMN firebase_uid TYPE TEXT USING firebase_uid::text')
                                    )
                                    print("✅ Altered users.firebase_uid to TEXT")
                                except Exception as e:
                                    print(f"⚠️ Failed altering users.firebase_uid type: {e}")
                            break
                
                # Ensure listings table has all required columns
                if "listings" in Base.metadata.tables:
                    required_columns = {
                        "views": "INTEGER DEFAULT 0",
                        "boosted": "INTEGER DEFAULT 0",
                        "boost_expires_at": "TIMESTAMP",
                        "created_at": "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP",
                        "latitude": "DOUBLE PRECISION",
                        "longitude": "DOUBLE PRECISION",
                        "property_type": "TEXT",
                        "has_elevator": "BOOLEAN",
                        "has_parking": "BOOLEAN",
                        "has_garage": "BOOLEAN",
                        "floor": "INTEGER",
                        "total_floors": "INTEGER",
                        "has_balcony": "BOOLEAN",
                        "floor_plan": "TEXT"
                    }
                    
                    existing_cols = [col["name"] for col in inspector.get_columns("listings")]
                    
                    for col_name, col_type in required_columns.items():
                        if col_name not in existing_cols:
                            try:
                                print(f"Adding missing column '{col_name}' to listings table...")
                                conn.execute(text(f'ALTER TABLE listings ADD COLUMN {col_name} {col_type}'))
                                print(f"✅ Added {col_name} column successfully")
                            except Exception as e:
                                print(f"⚠️ Error adding {col_name}: {e}")
                
                # Ensure user_consents table exists and has all required columns
                if "user_consents" in Base.metadata.tables:
                    required_consent_columns = {
                        "user_id": "INTEGER",
                        "firebase_uid": "TEXT",
                        "consent_id": "TEXT",
                        "consent_type": "TEXT NOT NULL",
                        "version": "TEXT NOT NULL",
                        "accepted": "BOOLEAN DEFAULT TRUE",
                        "cookie_preferences": "JSONB",
                        "user_agent": "TEXT",
                        "timestamp": "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
                    }
                    
                    existing_consent_cols = [col["name"] for col in inspector.get_columns("user_consents")]
                    
                    for col_name, col_type in required_consent_columns.items():
                        if col_name not in existing_consent_cols:
                            try:
                                print(f"Adding missing column '{col_name}' to user_consents table...")
                                conn.execute(text(f'ALTER TABLE user_consents ADD COLUMN {col_name} {col_type}'))
                                print(f"✅ Added {col_name} column successfully")
                            except Exception as e:
                                print(f"⚠️ Failed to add column {col_name}: {str(e)}")
                
                # Add index on consent_id for fast lookups
                try:
                    conn.execute(text('CREATE INDEX IF NOT EXISTS idx_user_consents_consent_id ON user_consents(consent_id)'))
                    print("✅ Created index on consent_id")
                except Exception as e:
                    print(f"⚠️ Index creation note: {str(e)}")
    except Exception as e:
        print(f"⚠️ Error during column sync: {str(e)}")

