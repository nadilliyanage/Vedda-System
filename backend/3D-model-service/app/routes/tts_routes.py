from flask import Blueprint, request, jsonify, send_file
from app.services.tts_service import get_tts_service

tts_bp = Blueprint('tts', __name__)

@tts_bp.route('/tts', methods=['POST'])
def text_to_speech():
    """Text to speech endpoint for 3D models"""
    try:
        tts_service = get_tts_service()
        data = request.get_json()
        
        text = data.get('text', '').strip()
        language = data.get('language', 'english')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        result = tts_service.text_to_speech(text, language)
        
        if result['success']:
            return send_file(
                result['audio_path'],
                as_attachment=True,
                download_name=result['filename'],
                mimetype="audio/mpeg"
            )
        else:
            status_code = 503 if 'unavailable' in result.get('error', '') else 500
            return jsonify({'error': result['error']}), status_code
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
