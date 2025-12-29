from flask import Blueprint, jsonify
from app.db.mongo import get_collection

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        dictionary_collection = get_collection('dictionary')
        word_count = dictionary_collection.count_documents({})
        
        return jsonify({
            'status': 'healthy',
            'service': '3D Model Service',
            'database': 'connected',
            'word_count': word_count
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': '3D Model Service',
            'error': str(e)
        }), 500
