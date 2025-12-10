import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT = int(os.getenv("PORT", 5001))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # Service URLs
    DICTIONARY_SERVICE_URL = os.getenv('DICTIONARY_SERVICE_URL', 'http://localhost:5002')
    HISTORY_SERVICE_URL = os.getenv('HISTORY_SERVICE_URL', 'http://localhost:5003')
    
    # Google Translate API configuration
    GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
