from flask import Blueprint, request, jsonify
from app.services.history_service import get_history_service

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route('', methods=['POST'])
def add_feedback():
    """Add user feedback"""
    try:
        history_service = get_history_service()
        data = request.get_json()
        
        required_fields = ['original_text', 'suggested_translation', 'feedback_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        feedback_id = history_service.add_user_feedback(
            original_text=data['original_text'],
            suggested_translation=data['suggested_translation'],
            current_translation=data.get('current_translation', ''),
            feedback_type=data['feedback_type'],
            user_rating=data.get('user_rating'),
            comments=data.get('comments', '')
        )
        
        if feedback_id:
            return jsonify({
                'success': True,
                'id': feedback_id,
                'message': 'Feedback added successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to add feedback'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@feedback_bp.route('', methods=['GET'])
def get_feedback():
    """Get user feedback"""
    try:
        history_service = get_history_service()
        limit = int(request.args.get('limit', 50))
        feedback_type = request.args.get('type')
        
        feedback = history_service.get_user_feedback(limit, feedback_type)
        
        return jsonify({
            'success': True,
            'feedback': feedback,
            'count': len(feedback)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
