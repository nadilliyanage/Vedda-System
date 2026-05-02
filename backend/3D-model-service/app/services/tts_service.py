import logging
import edge_tts
import asyncio
import os
import tempfile
import uuid

logger = logging.getLogger(__name__)

# Edge TTS voice mapping – premium Microsoft neural voices
# Male voices prioritised for clarity in pronunciation learning
EDGE_TTS_VOICE_MAP = {
    'english': 'en-US-GuyNeural',       # Clear natural male (US English)
    'vedda':   'en-GB-RyanNeural',      # Clear natural male (British) – suits ancient lang context
    'sinhala': 'si-LK-SameeraNeural',  # Sinhala male
    'tamil':   'ta-IN-ValluvarNeural',  # Tamil male
    'hindi':   'hi-IN-MadhurNeural',   # Hindi male
    'chinese': 'zh-CN-YunxiNeural',    # Chinese male
    'japanese':'ja-JP-KeitaNeural',    # Japanese male
    'korean':  'ko-KR-InJoonNeural',   # Korean male
    'french':  'fr-FR-HenriNeural',    # French male
    'german':  'de-DE-ConradNeural',   # German male
    'spanish': 'es-ES-AlvaroNeural',   # Spanish male
    'italian': 'it-IT-DiegoNeural',    # Italian male
    'portuguese': 'pt-BR-AntonioNeural', # Portuguese male
    'russian': 'ru-RU-DmitryNeural',   # Russian male
    'arabic':  'ar-SA-HamedNeural',    # Arabic male
    'dutch':   'nl-NL-MaartenNeural',  # Dutch male
    'thai':    'th-TH-NiwatNeural',    # Thai male
    'turkish': 'tr-TR-AhmetNeural',    # Turkish male
}

class TTSService:
    def __init__(self):
        logger.info("3D Model TTS Service initialized")

    def text_to_speech(self, text, language='english'):
        """Convert text to speech using Edge TTS neural voice"""
        try:
            if not text:
                return {'success': False, 'error': 'Text is required'}

            temp_dir = tempfile.gettempdir()
            audio_filename = f"model_tts_{uuid.uuid4()}.mp3"
            audio_path = os.path.join(temp_dir, audio_filename)

            # Default to English Guy Neural if language not found
            edge_voice = EDGE_TTS_VOICE_MAP.get(language, 'si-LK-SameeraNeural')
            
            try:
                logger.info(f"Model Edge TTS: voice={edge_voice} lang={language} text='{text[:60]}'")

                async def _run_edge_tts():
                    communicate = edge_tts.Communicate(text, edge_voice)
                    await communicate.save(audio_path)

                asyncio.run(_run_edge_tts())

                if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                    return {
                        'success': True,
                        'audio_path': audio_path,
                        'language': language,
                        'filename': f"speech_{language}.mp3",
                        'engine': 'edge-tts',
                        'voice': edge_voice,
                    }
                else:
                    return {'success': False, 'error': 'Failed to generate audio file'}
            except Exception as e:
                logger.error(f"Model Edge TTS failed: {str(e)}")
                return {'success': False, 'error': f"TTS failed: {str(e)}"}

        except Exception as e:
            logger.error(f"TTS error: {str(e)}")
            return {'success': False, 'error': str(e)}

_tts_service = None

def get_tts_service():
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
