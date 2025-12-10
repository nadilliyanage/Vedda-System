import logging
from gtts import gTTS
import speech_recognition as sr
import os
import tempfile
import uuid

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


# Singleton instance
_speech_service_instance = None


def get_speech_service():
    """Get or create singleton SpeechService instance"""
    global _speech_service_instance
    if _speech_service_instance is None:
        _speech_service_instance = SpeechService()
    return _speech_service_instance


class SpeechService:
    def __init__(self):
        # Initialize speech recognizer
        self.recognizer = sr.Recognizer()
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        self.recognizer.operation_timeout = None
        self.recognizer.phrase_threshold = 0.3
        self.recognizer.non_speaking_duration = 0.5
        logger.info("Speech Service initialized")
    
    def text_to_speech(self, text, language='english'):
        """Convert text to speech using gTTS"""
        try:
            if not text:
                return {'success': False, 'error': 'Text is required'}
            
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
                
                return {
                    'success': True,
                    'audio_path': audio_path,
                    'language': language,
                    'filename': f"speech_{language}.mp3"
                }
                
            except Exception as e:
                logger.error(f"gTTS error: {str(e)}")
                
                # Fallback to English if the language is not supported
                if gtts_lang != 'en':
                    logger.info(f"Falling back to English for: {text}")
                    try:
                        tts = gTTS(text=text, lang='en', slow=False)
                        tts.save(audio_path)
                        
                        return {
                            'success': True,
                            'audio_path': audio_path,
                            'language': 'english',
                            'filename': 'speech_english_fallback.mp3',
                            'fallback': True
                        }
                    except Exception as fallback_e:
                        logger.error(f"Fallback TTS error: {str(fallback_e)}")
                        return {'success': False, 'error': 'TTS service unavailable'}
                else:
                    return {'success': False, 'error': 'TTS generation failed'}
                    
        except Exception as e:
            logger.error(f"TTS error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def speech_to_text(self, audio_file, language='english'):
        """Convert speech to text using Google Speech Recognition"""
        try:
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
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.2)
                    # Record the audio
                    audio_data = self.recognizer.record(source)
                
                # Perform speech recognition
                try:
                    # Try Google Speech Recognition
                    text = self.recognizer.recognize_google(audio_data, language=google_lang)
                    
                    logger.info(f"STT successful: '{text}' ({google_lang})")
                    
                    return {
                        'success': True,
                        'text': text,
                        'language': language,
                        'confidence': 0.9,  # Google doesn't provide confidence, assume high
                        'method': 'google_stt'
                    }
                    
                except sr.UnknownValueError:
                    logger.warning(f"Could not understand audio for {language}")
                    return {
                        'success': False,
                        'error': 'Could not understand the audio',
                        'text': '',
                        'language': language
                    }
                    
                except sr.RequestError as e:
                    logger.error(f"Google Speech Recognition error: {str(e)}")
                    return {
                        'success': False,
                        'error': 'Speech recognition service unavailable',
                        'text': '',
                        'language': language
                    }
                        
            finally:
                # Clean up temp file
                if os.path.exists(audio_path):
                    try:
                        os.remove(audio_path)
                    except:
                        pass
                        
        except Exception as e:
            logger.error(f"STT error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_supported_tts_languages(self):
        """Get list of supported TTS languages"""
        return {
            'supported_languages': list(GTTS_LANGUAGE_MAP.keys()),
            'language_map': GTTS_LANGUAGE_MAP
        }
    
    def get_supported_stt_languages(self):
        """Get list of supported STT languages"""
        return {
            'supported_languages': list(GOOGLE_STT_LANGUAGE_MAP.keys()),
            'language_map': GOOGLE_STT_LANGUAGE_MAP
        }


# Global instance
_speech_service = None


def get_speech_service():
    """Get speech service instance"""
    global _speech_service
    if _speech_service is None:
        _speech_service = SpeechService()
    return _speech_service
