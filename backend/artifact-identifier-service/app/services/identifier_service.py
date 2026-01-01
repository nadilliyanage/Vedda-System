import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from flask import current_app
from werkzeug.utils import secure_filename


class ArtifactIdentifierService:
    """Service for identifying Vedda artifacts using a trained TensorFlow model."""
    
    _instance = None
    
    def __init__(self):
        self.model = None
        self.artifact_info = {}
        self.class_names = []
        self.img_size = (224, 224)
        self.initialized = False
        
    def initialize(self, model_path, metadata_path, class_names, img_size):
        """Load the model and metadata."""
        try:
            # Load the trained model
            print(f"Loading model from: {model_path}")
            self.model = tf.keras.models.load_model(model_path)
            print("✅ Model loaded successfully")
            
            # Load metadata
            print(f"Loading metadata from: {metadata_path}")
            metadata_df = pd.read_excel(metadata_path)
            
            # Build artifact info dictionary
            for _, row in metadata_df.iterrows():
                self.artifact_info[row["artifact_name"]] = {
                    "category": row["category"],
                    "description": row["description"],
                    "tags": row["tags"]
                }
            print(f"✅ Loaded metadata for {len(self.artifact_info)} artifacts")
            
            # Set class names and image size
            self.class_names = class_names
            self.img_size = img_size
            self.initialized = True
            
            return True
            
        except Exception as e:
            print(f"❌ Error initializing artifact identifier: {e}")
            raise e
    
    def predict_artifact(self, img_path):
        """
        Predict the artifact from an image file.
        
        Args:
            img_path: Path to the image file
            
        Returns:
            Dictionary containing prediction results with artifact info
        """
        if not self.initialized:
            raise RuntimeError("Service not initialized. Call initialize() first.")
        
        try:
            # Load and preprocess the image
            img = image.load_img(img_path, target_size=self.img_size)
            img_array = image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0)
            
            # Make prediction
            predictions = self.model.predict(img_array)[0]
            class_index = np.argmax(predictions)
            artifact_name = self.class_names[class_index]
            confidence = float(predictions[class_index])
            
            # Get artifact metadata
            artifact_metadata = self.artifact_info.get(artifact_name, {})
            
            # Build result
            result = {
                "artifact_name": artifact_name,
                "category": artifact_metadata.get("category", "Unknown"),
                "description": artifact_metadata.get("description", "No description available"),
                "tags": artifact_metadata.get("tags", ""),
                "confidence": confidence,
                "all_predictions": {
                    self.class_names[i]: float(predictions[i])
                    for i in range(len(self.class_names))
                }
            }
            
            return result
            
        except Exception as e:
            print(f"❌ Error during prediction: {e}")
            raise e
    
    def is_allowed_file(self, filename):
        """Check if the uploaded file has an allowed extension."""
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'bmp'})
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in allowed_extensions


# Singleton pattern
_service_instance = None


def get_identifier_service():
    """Get or create the singleton instance of the identifier service."""
    global _service_instance
    
    if _service_instance is None:
        _service_instance = ArtifactIdentifierService()
        
        # Initialize with config
        model_path = current_app.config.get('MODEL_PATH')
        metadata_path = current_app.config.get('METADATA_PATH')
        class_names = current_app.config.get('CLASS_NAMES')
        img_size = current_app.config.get('IMG_SIZE')
        
        _service_instance.initialize(model_path, metadata_path, class_names, img_size)
    
    return _service_instance
