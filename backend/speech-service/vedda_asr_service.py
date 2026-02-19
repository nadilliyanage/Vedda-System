"""
Vedda Language ASR Service
Integrates trained Vedda Whisper model with speech service
"""

import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import librosa
import os
from pathlib import Path

# Model path resolution: env var > v4 (if exists) > v2 (stable fallback)
def _resolve_model_path():
    env = os.environ.get('VEDDA_ASR_MODEL_PATH')
    if env and os.path.exists(env):
        return env
    v4 = 'vedda-asr-model/models/whisper-frozen-v4/final'
    if os.path.exists(v4):
        return v4
    return 'vedda-asr-model/models/whisper-frozen-v2/final'

class VeddaASRService:
    """Speech recognition service for Vedda language using trained Whisper model"""
    
    def __init__(self, model_path=None):
        """Initialize Vedda ASR service"""
        
        self.model_path = model_path if model_path else _resolve_model_path()
        self.processor = None
        self.model = None
        self.device = None
        self.is_ready = False
        self.si_token_id = None
        self.transcribe_id = None
        
        try:
            self._load_model()
        except Exception as e:
            print(f"[ERROR] Error loading Vedda ASR model: {e}")
            self.is_ready = False
    
    def _load_model(self):
        """Load pretrained Vedda Whisper model"""
        
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model not found at: {self.model_path}")
        
        print(f"[INFO] Loading Vedda ASR model from: {self.model_path}")
        
        # Load processor and model
        self.processor = WhisperProcessor.from_pretrained(
            self.model_path,
            language="Sinhala",
            task="transcribe"
        )
        
        self.model = WhisperForConditionalGeneration.from_pretrained(self.model_path)
        
        # Set device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self.model.to(self.device)
        self.model.eval()
        
        # Resolve forced-decoder token IDs for Sinhala + transcribe
        self.si_token_id = self.processor.tokenizer.convert_tokens_to_ids("<|si|>")
        self.transcribe_id = self.processor.tokenizer.convert_tokens_to_ids("<|transcribe|>")
        
        print(f"[INFO] Vedda ASR model loaded from: {self.model_path}")
        print(f"[INFO] Device: {self.device}  |  si_token={self.si_token_id}  transcribe_token={self.transcribe_id}")
        
        self.is_ready = True
    
    def transcribe(self, audio_path):
        """
        Transcribe Vedda audio file to Sinhala text
        
        Args:
            audio_path (str): Path to audio file
            
        Returns:
            dict: {
                'text': transcription in Sinhala,
                'language': 'Vedda',
                'confidence': float (0-1),
                'duration': float
            }
        """
        
        if not self.is_ready:
            return {
                'error': 'Model not loaded',
                'text': '',
                'language': 'Vedda',
                'confidence': 0.0
            }
        
        if not os.path.exists(audio_path):
            return {
                'error': f'Audio file not found: {audio_path}',
                'text': '',
                'language': 'Vedda',
                'confidence': 0.0
            }
        
        try:
            # Load and preprocess audio
            audio, sr = librosa.load(audio_path, sr=16000, mono=True)
            duration = len(audio) / sr
            
            # Generate input features
            input_features = self.processor.feature_extractor(
                audio,
                sampling_rate=16000,
                return_tensors="pt"
            ).input_features.to(self.device)

            # Force Sinhala + transcribe (must match training)
            forced_ids = [[1, self.si_token_id], [2, self.transcribe_id]]
            
            # Generate transcription with tuned inference params
            with torch.no_grad():
                predicted_ids = self.model.generate(
                    input_features,
                    forced_decoder_ids=forced_ids,
                    max_new_tokens=100,
                    suppress_tokens=[],
                    no_repeat_ngram_size=4,
                    num_beams=5,
                    repetition_penalty=1.5,
                    length_penalty=0.8,
                    early_stopping=True,
                )
            
            # Decode
            text = self.processor.tokenizer.batch_decode(
                predicted_ids, skip_special_tokens=True
            )[0].strip()
            
            return {
                'text': text,
                'language': 'Vedda',
                'confidence': 0.85,  # Approximate confidence
                'duration': duration,
                'model': 'whisper-vedda-fine-tuned'
            }
        
        except Exception as e:
            return {
                'error': str(e),
                'text': '',
                'language': 'Vedda',
                'confidence': 0.0
            }
    
    def transcribe_batch(self, audio_paths):
        """Transcribe multiple audio files"""
        
        results = []
        for audio_path in audio_paths:
            result = self.transcribe(audio_path)
            results.append({
                'file': Path(audio_path).name,
                **result
            })
        
        return results


# Initialize service
vedda_service = None

def get_vedda_asr_service():
    """Get or initialize Vedda ASR service"""
    global vedda_service
    
    if vedda_service is None:
        vedda_service = VeddaASRService()
    
    return vedda_service


if __name__ == '__main__':
    # Test service
    service = VeddaASRService()
    
    if service.is_ready:
        # Test on sample audio
        test_audio = 'vedda-asr-model/data/processed/vedda_110_20260211_231344_476c8be5.wav'
        
        if os.path.exists(test_audio):
            result = service.transcribe(test_audio)
            print(f"\nTest Result:")
            print(f"  Text: {result['text']}")
            print(f"  Language: {result['language']}")
            print(f"  Duration: {result['duration']:.2f}s")
