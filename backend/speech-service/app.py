from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from gtts import gTTS
import speech_recognition as sr
import os
import tempfile
import uuid
from datetime import datetime
import logging
import io
import wave
from dotenv import load_dotenv
from vedda_stt_processor import VeddaSTTProcessor

# Load environment variables
load_dotenv()

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

# Language code mapping for Google Speech Recognition
GOOGLE_STT_LANGUAGE_MAP = {
    'english': 'en-US',
    'sinhala': 'si-LK',
    'tamil': 'ta-IN',
    'hindi': 'hi-IN',
    'chinese': 'zh-CN',
    'japanese': 'ja-JP',
    'korean': 'ko-KR',
    'french': 'fr-FR',
    'german': 'de-DE',
    'spanish': 'es-ES',
    'italian': 'it-IT',
    'portuguese': 'pt-BR',
    'russian': 'ru-RU',
    'arabic': 'ar-SA',
    'dutch': 'nl-NL',
    'thai': 'th-TH',
    'vietnamese': 'vi-VN',
    'turkish': 'tr-TR',
    'vedda': 'si-LK'  # Use Sinhala for Vedda
}

# Initialize speech recognizer
recognizer = sr.Recognizer()
recognizer.energy_threshold = 300
recognizer.dynamic_energy_threshold = True
recognizer.pause_threshold = 0.8
recognizer.operation_timeout = None
recognizer.phrase_threshold = 0.3
recognizer.non_speaking_duration = 0.5

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

@app.route('/api/stt', methods=['POST'])
def speech_to_text():
    try:
        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        language = request.form.get('language', 'english')
        
        if audio_file.filename == '':
            return jsonify({'error': 'No audio file selected'}), 400
        
        # Map language to Google Speech Recognition code
        google_lang = GOOGLE_STT_LANGUAGE_MAP.get(language, 'en-US')
        
        logger.info(f"STT request: {language} ({google_lang})")
        
        # Create temporary file
        temp_dir = tempfile.gettempdir()
        audio_filename = f"stt_{uuid.uuid4()}.wav"
        audio_path = os.path.join(temp_dir, audio_filename)
        
        try:
            # Save uploaded file
            audio_file.save(audio_path)
            
            # Load audio file for recognition
            with sr.AudioFile(audio_path) as source:
                # Adjust for ambient noise
                recognizer.adjust_for_ambient_noise(source, duration=0.2)
                # Record the audio
                audio_data = recognizer.record(source)
            
            # Perform speech recognition
            try:
                # Try Google Speech Recognition first
                text = recognizer.recognize_google(audio_data, language=google_lang)
                
                logger.info(f"STT successful: '{text}' ({google_lang})")
                
                return jsonify({
                    'success': True,
                    'text': text,
                    'language': language,
                    'confidence': 0.9,  # Google doesn't provide confidence, assume high
                    'method': 'google_stt'
                })
                
            except sr.UnknownValueError:
                logger.warning(f"Could not understand audio for {language}")
                return jsonify({
                    'success': False,
                    'error': 'Could not understand the audio',
                    'text': '',
                    'language': language
                })
                
            except sr.RequestError as e:
                logger.error(f"Google Speech Recognition error: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'Speech recognition service unavailable',
                    'text': '',
                    'language': language
                }), 503
                    
        finally:
            # Clean up temp file
            if os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except:
                    pass
                    
    except Exception as e:
        logger.error(f"STT endpoint error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/tts/supported-languages', methods=['GET'])
def get_supported_languages():
    """Return list of supported languages for TTS"""
    return jsonify({
        'supported_languages': list(GTTS_LANGUAGE_MAP.keys()),
        'language_map': GTTS_LANGUAGE_MAP
    })

@app.route('/api/stt/supported-languages', methods=['GET'])
def get_stt_supported_languages():
    """Return list of supported languages for STT"""
    return jsonify({
        'supported_languages': list(GOOGLE_STT_LANGUAGE_MAP.keys()),
        'language_map': GOOGLE_STT_LANGUAGE_MAP
    })

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'TTS Service'})

if __name__ == '__main__':
    print("Starting TTS Service on port 5007...")
    print("Supported languages:", list(GTTS_LANGUAGE_MAP.keys()))
    app.run(host='0.0.0.0', port=5007, debug=True)