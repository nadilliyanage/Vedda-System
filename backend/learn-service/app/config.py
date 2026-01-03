import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    DEBUG = True
    PORT = int(os.environ.get("PORT", 5006))

    # Configuration from environment variables
    MONGODB_URI = os.environ.get("MONGODB_URI")
    MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "vedda-system")
    
    # AI Service Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL_FAST = os.getenv("OPENAI_MODEL_FAST", "gpt-4o-mini")
    OPENAI_MODEL_GEN = os.getenv("OPENAI_MODEL_GEN", "gpt-4o")