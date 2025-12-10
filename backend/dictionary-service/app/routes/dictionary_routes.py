from flask import Blueprint, request, jsonify
from app.services.dictionary_service import get_dictionary_service

dictionary_bp = Blueprint('dictionary', __name__)


@dictionary_bp.route('/search', methods=['GET'])
def search_dictionary():
    """Search dictionary endpoint"""
    try:
        dictionary_service = get_dictionary_service()
        query = request.args.get('q', '').strip()
        source_language = request.args.get('source', 'all')
        target_language = request.args.get('target', 'all')
        limit = int(request.args.get('limit', 50))
        
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
        
        results = dictionary_service.search_dictionary(
            query, source_language, target_language, limit
        )
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'query': query
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dictionary_bp.route('/add', methods=['POST'])
def add_word():
    """Add new word to dictionary"""
    try:
        dictionary_service = get_dictionary_service()
        data = request.get_json()
        
        vedda_word = data.get('vedda_word', '').strip()
        english_word = data.get('english_word', '').strip()
        
        if not vedda_word or not english_word:
            return jsonify({'error': 'vedda_word and english_word are required'}), 400
        
        result = dictionary_service.add_word(
            vedda_word=vedda_word,
            english_word=english_word,
            sinhala_word=data.get('sinhala_word', ''),
            vedda_ipa=data.get('vedda_ipa', ''),
            sinhala_ipa=data.get('sinhala_ipa', ''),
            english_ipa=data.get('english_ipa', ''),
            word_type=data.get('word_type', ''),
            usage_example=data.get('usage_example', '')
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dictionary_bp.route('/random', methods=['GET'])
def get_random_words():
    """Get random words for learning/quiz"""
    try:
        dictionary_service = get_dictionary_service()
        count = int(request.args.get('count', 10))
        word_type = request.args.get('type', None)
        
        results = dictionary_service.get_random_words(count, word_type)
        
        return jsonify({
            'success': True,
            'words': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dictionary_bp.route('/types', methods=['GET'])
def get_word_types():
    """Get available word types"""
    try:
        dictionary_service = get_dictionary_service()
        types = dictionary_service.get_word_types()
        return jsonify({
            'success': True,
            'word_types': types
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dictionary_bp.route('/all', methods=['GET'])
def get_all_words():
    """Get all dictionary words with pagination"""
    try:
        dictionary_service = get_dictionary_service()
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        result = dictionary_service.get_all_words(limit, offset)
        
        return jsonify({
            'success': True,
            **result
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dictionary_bp.route('/stats', methods=['GET'])
def get_dictionary_stats():
    """Get dictionary statistics"""
    try:
        dictionary_service = get_dictionary_service()
        stats = dictionary_service.get_statistics()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dictionary_bp.route('/<word_id>', methods=['PUT'])
def update_word(word_id):
    """Update a dictionary word"""
    try:
        dictionary_service = get_dictionary_service()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        result = dictionary_service.update_word(word_id, data)
        
        if result['success']:
            return jsonify(result)
        else:
            status_code = 404 if 'not found' in result.get('error', '').lower() else 400
            return jsonify(result), status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dictionary_bp.route('/<word_id>', methods=['DELETE'])
def delete_word(word_id):
    """Delete a dictionary word"""
    try:
        dictionary_service = get_dictionary_service()
        result = dictionary_service.delete_word(word_id)
        
        if result['success']:
            return jsonify(result)
        else:
            status_code = 404 if 'not found' in result.get('error', '').lower() else 400
            return jsonify(result), status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@dictionary_bp.route('/upload-csv', methods=['POST'])
def upload_csv():
    """Upload CSV or XLSX file with dictionary words"""
    try:
        dictionary_service = get_dictionary_service()
        
        if 'csv_file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['csv_file']
        result = dictionary_service.upload_csv(file)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
