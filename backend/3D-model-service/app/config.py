import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Flask configuration."""
    # MongoDB
    MONGODB_URI = os.getenv("MONGODB_URI")
    MONGODB_DB_NAME = os.getenv("DATABASE_NAME", "vedda-system")
    
    # Flask
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    PORT = int(os.getenv("PORT", 5008))
    
    # API Keys (if needed for future use)
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
