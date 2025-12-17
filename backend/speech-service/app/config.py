import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT = int(os.getenv("PORT", 5007))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # MongoDB Configuration (optional for dictionary support)
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://heshan:3UAXaHwpIRwEqK8K@cluster0.quemmhk.mongodb.net/vedda-system?retryWrites=true&w=majority&appName=Cluster0')
    DATABASE_NAME = 'vedda-system'
    
    # Audio storage configuration
    AUDIO_STORAGE_PATH = os.getenv('AUDIO_STORAGE_PATH', 'audio_data')
    TEMP_AUDIO_PATH = os.getenv('TEMP_AUDIO_PATH', 'temp')
