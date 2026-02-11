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
    
    # Hybrid model paths (CNN + SVM)
    FEATURE_EXTRACTOR_PATH = os.getenv("FEATURE_EXTRACTOR_PATH", 
                                       os.path.join(DATA_DIR, "vedda_feature_extractor.keras"))
    SVM_PATH = os.getenv("SVM_PATH", 
                        os.path.join(DATA_DIR, "vedda_svm_classifier.pkl"))
    SCALER_PATH = os.getenv("SCALER_PATH", 
                           os.path.join(DATA_DIR, "vedda_feature_scaler.pkl"))
    METADATA_PATH = os.getenv("METADATA_PATH", 
                             os.path.join(DATA_DIR, "artifact_metadata.xlsx"))
    
    # Download URLs
    FEATURE_EXTRACTOR_URL = os.getenv("FEATURE_EXTRACTOR_URL", "")
    SVM_URL = os.getenv("SVM_URL", "")
    SCALER_URL = os.getenv("SCALER_URL", "")
    METADATA_URL = os.getenv("METADATA_URL", "")
    
    # Image processing configuration
    IMG_SIZE = (224, 224)
    MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
    
    # Class names (must match training order)
    CLASS_NAMES = ['axe', 'bow', 'guitar', 'spoon', 'vedda drum']
