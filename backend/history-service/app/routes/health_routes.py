from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        from app.db.mongo import get_db
        
        # Test MongoDB connection
        db = get_db()
        db.client.admin.command('ping')
        
        return jsonify({
            'status': 'healthy',
            'service': 'History Service (MongoDB)',
            'database': 'connected'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'History Service',
            'error': str(e)
        }), 500
