import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT = int(os.getenv("PORT"))
    DEBUG = os.getenv("DEBUG").lower() == "true"
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI')
    DATABASE_NAME = os.getenv('DATABASE_NAME')
