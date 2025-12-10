from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        from app.db.mongo import get_db, dictionary_collection
        
        # Test MongoDB connection
        db = get_db()
        db.client.admin.command('ping')
        
        word_count = dictionary_collection().count_documents({})
        
        return jsonify({
            'status': 'healthy',
            'service': 'Dictionary Service (MongoDB)',
            'database': 'connected',
            'word_count': word_count
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'Dictionary Service',
            'error': str(e)
        }), 500
