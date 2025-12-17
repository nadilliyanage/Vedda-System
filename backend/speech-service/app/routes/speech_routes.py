from flask import Blueprint, request, jsonify, send_file
from app.services.speech_service import get_speech_service
from app.services.vedda_stt_processor import get_vedda_stt_processor

speech_bp = Blueprint('speech', __name__)


@speech_bp.route('/tts', methods=['POST'])
def text_to_speech():
    """Text to speech endpoint"""
    try:
        speech_service = get_speech_service()
        data = request.get_json()
        
        text = data.get('text', '').strip()
        language = data.get('language', 'english')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        result = speech_service.text_to_speech(text, language)
        
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


@speech_bp.route('/stt', methods=['POST'])
def speech_to_text():
    """Speech to text endpoint"""
    try:
        speech_service = get_speech_service()
        
        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        language = request.form.get('language', 'english')
        
        if audio_file.filename == '':
            return jsonify({'error': 'No audio file selected'}), 400
        
        result = speech_service.speech_to_text(audio_file, language)
        
        # If Vedda language, process through Vedda STT processor
        if language == 'vedda' and result.get('success'):
            try:
                vedda_processor = get_vedda_stt_processor()
                vedda_result = vedda_processor.process_sinhala_stt_result(
                    result['text'], 
                    result.get('confidence', 0.9)
                )
                
                if vedda_result['success']:
                    return jsonify({
                        'success': True,
                        'text': vedda_result['vedda_text'],
                        'original_sinhala': vedda_result['original_sinhala'],
                        'language': 'vedda',
                        'confidence': vedda_result['confidence'],
                        'matched_words': vedda_result.get('matched_words', 0),
                        'total_words': vedda_result.get('total_words', 0),
                        'word_details': vedda_result.get('word_details', []),
                        'method': 'vedda_stt_with_dictionary'
                    })
            except Exception as e:
                # Fallback to original result if Vedda processing fails
                result['vedda_processing_error'] = str(e)
        
        return jsonify(result)
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@speech_bp.route('/tts/supported-languages', methods=['GET'])
def get_supported_tts_languages():
    """Get supported TTS languages"""
    try:
        speech_service = get_speech_service()
        return jsonify(speech_service.get_supported_tts_languages())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@speech_bp.route('/stt/supported-languages', methods=['GET'])
def get_supported_stt_languages():
    """Get supported STT languages"""
    try:
        speech_service = get_speech_service()
        return jsonify(speech_service.get_supported_stt_languages())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@speech_bp.route('/vedda-stt/stats', methods=['GET'])
def get_vedda_stt_stats():
    """Get Vedda STT processor statistics"""
    try:
        vedda_processor = get_vedda_stt_processor()
        stats = vedda_processor.get_dictionary_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
