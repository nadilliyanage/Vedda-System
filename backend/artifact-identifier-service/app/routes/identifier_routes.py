import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app.services.identifier_service import get_identifier_service

identifier_bp = Blueprint('identifier', __name__)


def allowed_file(filename):
    """Check if file extension is allowed."""
    allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'})
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


@identifier_bp.route('/predict', methods=['POST'])
def predict_artifact():
    """
    Endpoint to identify an artifact from an uploaded image.
    
    Expects:
        - file: image file in the request
        
    Returns:
        JSON with artifact identification results
    """
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({
                'error': 'No file provided',
                'message': 'Please upload an image file'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'message': 'Please select a file to upload'
            }), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type',
                'message': f'Allowed file types: {", ".join(current_app.config.get("ALLOWED_EXTENSIONS", []))}'
            }), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_dir = '/tmp'
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
        
        filepath = os.path.join(temp_dir, filename)
        file.save(filepath)
        
        try:
            # Get prediction
            identifier_service = get_identifier_service()
            result = identifier_service.predict_artifact(filepath)
            
            # Clean up temp file
            if os.path.exists(filepath):
                os.remove(filepath)
            
            return jsonify({
                'success': True,
                'data': result
            }), 200
            
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(filepath):
                os.remove(filepath)
            raise e
        
    except Exception as e:
        print(f"❌ Error in predict_artifact: {e}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500


@identifier_bp.route('/classes', methods=['GET'])
def get_classes():
    """
    Get list of artifact classes that can be identified.
    
    Returns:
        JSON with list of class names
    """
    try:
        class_names = current_app.config.get('CLASS_NAMES', [])
        return jsonify({
            'success': True,
            'data': {
                'classes': class_names,
                'count': len(class_names)
            }
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to get classes',
            'message': str(e)
        }), 500


@identifier_bp.route('/info', methods=['GET'])
def get_service_info():
    """
    Get service information including model status.
    
    Returns:
        JSON with service information
    """
    try:
        identifier_service = get_identifier_service()
        return jsonify({
            'success': True,
            'data': {
                'initialized': identifier_service.initialized,
                'classes': identifier_service.class_names,
                'artifacts_count': len(identifier_service.artifact_info),
                'image_size': identifier_service.img_size
            }
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Failed to get service info',
            'message': str(e)
        }), 500
