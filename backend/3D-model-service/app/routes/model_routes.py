from flask import Blueprint, jsonify, request
from app.services.model_service import ModelService

model_bp = Blueprint('model', __name__)
model_service = ModelService()


@model_bp.route('/words', methods=['GET'])
def get_words():
    """
    Get words with vedda_IPA and other details
    Query parameters:
    - word_type: Filter by word type (optional)
    - search: Search term for vedda_word (optional)
    - limit: Number of results to return (default: 100)
    - skip: Number of results to skip (default: 0)
    """
    try:
        word_type = request.args.get('word_type')
        search = request.args.get('search')
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        
        result = model_service.get_words(
            word_type=word_type,
            search=search,
            limit=limit,
            skip=skip
        )
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@model_bp.route('/words/<word_id>', methods=['GET'])
def get_word_by_id(word_id):
    """Get a specific word by ID with full details including vedda_IPA"""
    try:
        result = model_service.get_word_by_id(word_id)
        
        if not result['success']:
            return jsonify(result), 404
            
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@model_bp.route('/words/vedda/<vedda_word>', methods=['GET'])
def get_word_by_vedda(vedda_word):
    """Get word details by Vedda word including vedda_IPA"""
    try:
        result = model_service.get_word_by_vedda(vedda_word)
        
        if not result['success']:
            return jsonify(result), 404
            
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@model_bp.route('/words/ipa', methods=['GET'])
def get_words_with_ipa():
    """
    Get only words that have vedda_IPA defined
    Query parameters:
    - limit: Number of results to return (default: 100)
    - skip: Number of results to skip (default: 0)
    """
    try:
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        
        result = model_service.get_words_with_ipa(limit=limit, skip=skip)
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500


@model_bp.route('/words/ipa-only', methods=['GET'])
def get_ipa_and_words_only():
    """
    Get only vedda_ipa, sinhala_ipa and words (minimal data)
    Query parameters:
    - limit: Number of results to return (default: 100)
    - skip: Number of results to skip (default: 0)
    - has_vedda_ipa: Filter only words with vedda_ipa (default: false)
    """
    try:
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        has_vedda_ipa = request.args.get('has_vedda_ipa', 'false').lower() == 'true'
        
        result = model_service.get_ipa_and_words_only(
            limit=limit,
            skip=skip,
            has_vedda_ipa=has_vedda_ipa
        )
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500
