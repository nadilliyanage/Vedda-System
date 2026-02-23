import os
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
from tensorflow.keras.preprocessing import image
from flask import current_app
from werkzeug.utils import secure_filename


class ArtifactIdentifierService:
    """Service for identifying Vedda artifacts using a hybrid CNN + SVM model."""
    
    _instance = None
    
    def __init__(self):
        self.feature_extractor = None
        self.svm = None
        self.scaler = None
        self.artifact_info = {}
        self.class_names = []
        self.img_size = (224, 224)
        self.initialized = False
        
    def initialize(self, feature_extractor_path, svm_path, scaler_path, metadata_path, class_names, img_size):
        """Load the hybrid model components and metadata."""
        try:
            # Load the feature extractor (CNN)
            print(f"Loading feature extractor from: {feature_extractor_path}")
            self.feature_extractor = tf.keras.models.load_model(feature_extractor_path)
            print("✅ Feature extractor loaded successfully")
            
            # Load the SVM classifier
            print(f"Loading SVM classifier from: {svm_path}")
            self.svm = joblib.load(svm_path)
            print("✅ SVM classifier loaded successfully")
            
            # Load the feature scaler
            print(f"Loading feature scaler from: {scaler_path}")
            self.scaler = joblib.load(scaler_path)
            print("✅ Feature scaler loaded successfully")
            
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
        Predict the artifact from an image file using hybrid CNN + SVM model.
        
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
            
            # Extract deep features using CNN feature extractor
            # Use layer-by-layer inference to avoid Sequential.call() compatibility
            # issues across different TensorFlow versions (e.g., macOS vs Windows)
            try:
                x = tf.constant(img_array)
                for layer in self.feature_extractor.layers:
                    x = layer(x)
                features = x.numpy()
            except Exception:
                # Fallback to standard predict if layer iteration fails
                features = self.feature_extractor.predict(img_array, verbose=0)
            
            # Scale features (same as during training)
            features_scaled = self.scaler.transform(features)
            
            # Predict with SVM
            class_index = self.svm.predict(features_scaled)[0]
            artifact_name = self.class_names[class_index]
            
            # Approximate confidence using decision function + softmax
            decision_scores = self.svm.decision_function(features_scaled)[0]
            probs = np.exp(decision_scores) / np.sum(np.exp(decision_scores))
            confidence = float(probs[class_index])
            
            # Get artifact metadata
            artifact_metadata = self.artifact_info.get(artifact_name, {})
            
            # Build result with all class probabilities
            all_predictions = {
                self.class_names[i]: float(probs[i])
                for i in range(len(self.class_names))
            }
            
            result = {
                "artifact_name": artifact_name,
                "category": artifact_metadata.get("category", "Unknown"),
                "description": artifact_metadata.get("description", "No description available"),
                "tags": artifact_metadata.get("tags", ""),
                "confidence": confidence,
                "all_predictions": all_predictions
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
    
    # Initialize if not already initialized
    if not _service_instance.initialized:
        # Initialize with config
        feature_extractor_path = current_app.config.get('FEATURE_EXTRACTOR_PATH')
        svm_path = current_app.config.get('SVM_PATH')
        scaler_path = current_app.config.get('SCALER_PATH')
        metadata_path = current_app.config.get('METADATA_PATH')
        class_names = current_app.config.get('CLASS_NAMES')
        img_size = current_app.config.get('IMG_SIZE')
        
        _service_instance.initialize(feature_extractor_path, svm_path, scaler_path, 
                                     metadata_path, class_names, img_size)
    
    return _service_instance