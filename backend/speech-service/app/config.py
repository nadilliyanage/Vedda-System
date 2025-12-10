import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT = int(os.getenv("PORT", 5007))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # Audio storage configuration
    AUDIO_STORAGE_PATH = os.getenv('AUDIO_STORAGE_PATH', 'audio_data')
    TEMP_AUDIO_PATH = os.getenv('TEMP_AUDIO_PATH', 'temp')
