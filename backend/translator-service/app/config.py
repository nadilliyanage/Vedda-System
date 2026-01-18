import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT = int(os.getenv("PORT", 5001))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # Service URLs (using 127.0.0.1 instead of localhost for faster DNS resolution on Windows)
    DICTIONARY_SERVICE_URL = os.getenv('DICTIONARY_SERVICE_URL', 'http://127.0.0.1:5002/api/dictionary')
    HISTORY_SERVICE_URL = os.getenv('HISTORY_SERVICE_URL', 'http://127.0.0.1:5003')
    
    # Google Translate API configuration
    GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
