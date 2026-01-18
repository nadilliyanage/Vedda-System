from flask import Blueprint, request, jsonify
from datetime import datetime
from app.services.translator_service import VeddaTranslator

translator_bp = Blueprint('translator', __name__)

# Initialize translator (will be set by init_translator)
translator = None


def init_translator(app):
    """Initialize translator with config"""
    global translator
    translator = VeddaTranslator(
        dictionary_service_url=app.config['DICTIONARY_SERVICE_URL'],
        history_service_url=app.config['HISTORY_SERVICE_URL'],
        google_translate_url=app.config['GOOGLE_TRANSLATE_URL']
    )


@translator_bp.route('/translate', methods=['POST'])
def translate():
    """Main translation endpoint"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    text = data.get('text', '').strip()
    source_language = data.get('source_language', 'english').lower()
    target_language = data.get('target_language', 'vedda').lower()
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    if source_language not in translator.supported_languages:
        return jsonify({'error': f'Unsupported source language: {source_language}'}), 400
    
    if target_language not in translator.supported_languages:
        return jsonify({'error': f'Unsupported target language: {target_language}'}), 400
    
    # Perform translation
    result = translator.translate_text(text, source_language, target_language)
    
    # Save to history - DISABLED to improve performance (history service not running)
    # try:
    #     translator.save_translation_history(
    #         input_text=text,
    #         output_text=result['translated_text'],
    #         source_language=source_language,
    #         target_language=target_language,
    #         translation_method=result['method'],
    #         confidence=result['confidence']
    #     )
    # except Exception as e:
    #     print(f"Failed to save history: {e}")
    
    return jsonify({
        'success': True,
        'input_text': text,
        'translated_text': result['translated_text'],
        'source_language': source_language,
        'target_language': target_language,
        'confidence': result['confidence'],
        'translation_method': result['method'],
        'methods_used': result.get('methods_used', []),
        'source_ipa': result.get('source_ipa', ''),
        'target_ipa': result.get('target_ipa', ''),
        'source_romanization': result.get('source_romanization', ''),
        'target_romanization': result.get('target_romanization', ''),
        'bridge_translation': result.get('bridge_translation', '')
    })


@translator_bp.route('/languages', methods=['GET'])
def get_languages():
    """Get supported languages"""
    return jsonify({
        'supported_languages': translator.supported_languages,
        'total_count': len(translator.supported_languages)
    })

