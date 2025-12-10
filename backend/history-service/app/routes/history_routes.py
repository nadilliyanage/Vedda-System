from flask import Blueprint, request, jsonify
from app.services.history_service import get_history_service

history_bp = Blueprint('history', __name__)


@history_bp.route('', methods=['POST'])
def add_history():
    """Add translation to history"""
    try:
        history_service = get_history_service()
        data = request.get_json()
        
        required_fields = ['input_text', 'output_text', 'source_language', 'target_language']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        history_id = history_service.add_translation_history(
            input_text=data['input_text'],
            output_text=data['output_text'],
            source_language=data['source_language'],
            target_language=data['target_language'],
            translation_method=data.get('translation_method', ''),
            confidence_score=data.get('confidence_score')
        )
        
        if history_id:
            return jsonify({
                'success': True,
                'id': history_id,
                'message': 'Translation added to history'
            }), 201
        else:
            return jsonify({'error': 'Failed to add translation to history'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@history_bp.route('', methods=['GET'])
def get_history():
    """Get translation history"""
    try:
        history_service = get_history_service()
        limit = int(request.args.get('limit', 50))
        source_language = request.args.get('source_language')
        target_language = request.args.get('target_language')
        
        history = history_service.get_translation_history(
            limit=limit,
            source_language=source_language,
            target_language=target_language
        )
        
        return jsonify({
            'success': True,
            'history': history,
            'count': len(history)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@history_bp.route('/search', methods=['GET'])
def search_history():
    """Search translation history"""
    try:
        history_service = get_history_service()
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 50))
        
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
        
        results = history_service.search_translation_history(query, limit)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'query': query
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@history_bp.route('/stats', methods=['GET'])
def get_statistics():
    """Get history and feedback statistics"""
    try:
        history_service = get_history_service()
        stats = history_service.get_statistics()
        return jsonify({
            'success': True,
            'statistics': stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
