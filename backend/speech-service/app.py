from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from gtts import gTTS
import os
import tempfile
import uuid
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Language code mapping for gTTS
GTTS_LANGUAGE_MAP = {
    'english': 'en',
    'sinhala': 'si',
    'tamil': 'ta',
    'hindi': 'hi',
    'chinese': 'zh',
    'japanese': 'ja',
    'korean': 'ko',
    'french': 'fr',
    'german': 'de',
    'spanish': 'es',
    'italian': 'it',
    'portuguese': 'pt',
    'russian': 'ru',
    'arabic': 'ar',
    'dutch': 'nl',
    'thai': 'th',
    'vietnamese': 'vi',
    'turkish': 'tr',
    'vedda': 'si'  # Use Sinhala for Vedda
}

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        language = data.get('language', 'english')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Map language to gTTS code
        gtts_lang = GTTS_LANGUAGE_MAP.get(language, 'en')
        
        logger.info(f"TTS request: {language} ({gtts_lang}) - '{text[:50]}...'")
        
        # Create temporary file
        temp_dir = tempfile.gettempdir()
        audio_filename = f"tts_{uuid.uuid4()}.mp3"
        audio_path = os.path.join(temp_dir, audio_filename)
        
        try:
            # Generate speech using gTTS
            tts = gTTS(text=text, lang=gtts_lang, slow=False)
            tts.save(audio_path)
            
            # Return the audio file
            return send_file(
                audio_path,
                as_attachment=True,
                download_name=f"speech_{language}.mp3",
                mimetype="audio/mpeg"
            )
            
        except Exception as e:
            logger.error(f"gTTS error: {str(e)}")
            
            # Fallback to English if the language is not supported
            if gtts_lang != 'en':
                logger.info(f"Falling back to English for: {text}")
                try:
                    tts = gTTS(text=text, lang='en', slow=False)
                    tts.save(audio_path)
                    
                    return send_file(
                        audio_path,
                        as_attachment=True,
                        download_name=f"speech_english_fallback.mp3",
                        mimetype="audio/mpeg"
                    )
                except Exception as fallback_e:
                    logger.error(f"Fallback TTS error: {str(fallback_e)}")
                    return jsonify({'error': 'TTS service unavailable'}), 500
            else:
                return jsonify({'error': 'TTS generation failed'}), 500
                
        finally:
            # Clean up temp file after a delay (handled by OS)
            pass
            
    except Exception as e:
        logger.error(f"TTS endpoint error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/tts/supported-languages', methods=['GET'])
def get_supported_languages():
    """Return list of supported languages for TTS"""
    return jsonify({
        'supported_languages': list(GTTS_LANGUAGE_MAP.keys()),
        'language_map': GTTS_LANGUAGE_MAP
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'TTS Service'})

if __name__ == '__main__':
    print("Starting TTS Service on port 5007...")
    print("Supported languages:", list(GTTS_LANGUAGE_MAP.keys()))
    app.run(host='0.0.0.0', port=5007, debug=True)