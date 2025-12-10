import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT = int(os.getenv("PORT", 5003))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # MongoDB Configuration
    MONGODB_URI = os.getenv(
        'MONGODB_URI',
        'mongodb+srv://heshan:3UAXaHwpIRwEqK8K@cluster0.quemmhk.mongodb.net/vedda-system?retryWrites=true&w=majority&appName=Cluster0'
    )
    DATABASE_NAME = 'vedda-system'
