import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT = int(os.getenv("PORT", 5009))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    
    # Model Configuration
    # Use local path if running locally, docker path if in container
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(DATA_DIR, "vedda_artifacts_model.keras"))
    METADATA_PATH = os.getenv("METADATA_PATH", os.path.join(DATA_DIR, "artifact_metadata.xlsx"))
    
    # Image processing configuration
    IMG_SIZE = (224, 224)
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
    
    # Class names (must match training order)
    CLASS_NAMES = ['axe', 'bow', 'guitar', 'spoon', 'vedda drum']
