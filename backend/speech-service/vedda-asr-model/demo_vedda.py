"""
Vedda ASR Demo - Specialized for Sinhala/Vedda output
"""

import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import librosa
import os
import json
from pathlib import Path

class VeddaASRSpecialized:
    def __init__(self, model_path='models/whisper-vedda-final'):
        """Initialize Vedda-specific ASR model"""
        
        self.model_path = model_path
        self.processor = None
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        if not os.path.exists(model_path):
            print(f"❌ Model not found: {model_path}")
            print(f"   Run: python fix_model.py")
            return
        
        try:
            print(f"🤖 Loading Vedda ASR model (Sinhala output)...")
            self.processor = WhisperProcessor.from_pretrained(model_path, language="Sinhala", task="transcribe")
            self.model = WhisperForConditionalGeneration.from_pretrained(model_path)
            
            # Force Sinhala output
            self.model.config.forced_decoder_ids = None
            self.model.config.language_id = "si"
            self.model.config.task = "transcribe"
            
            self.model = self.model.to(self.device)
            self.model.eval()
            
            print(f"✅ Vedda model loaded!")
            print(f"🖥️  Device: {self.device}")
            print(f"🌐 Language: Sinhala (si)")
            print(f"📝 Output: Sinhala script\n")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            print(f"   Make sure model files are properly extracted")
            self.model = None
    
    def transcribe(self, audio_path):
        """Transcribe Vedda audio to Sinhala text"""
        
        if self.model is None:
            return None
        
        if not os.path.exists(audio_path):
            print(f"❌ File not found: {audio_path}")
            return None
        
        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=16000, mono=True)
            duration = len(audio) / sr
            
            # Generate input features
            input_features = self.processor(
                audio,
                sampling_rate=16000,
                return_tensors="pt",
                language="Sinhala"
            ).input_features.to(self.device)
            
            # Generate (with Sinhala language)
            with torch.no_grad():
                predicted_ids = self.model.generate(
                    input_features,
                    language="si",  # Sinhala
                    task="transcribe",
                    num_beams=1,
                    max_new_tokens=128
                )
            
            # Decode
            transcription = self.processor.decode(predicted_ids[0], skip_special_tokens=True)
            
            return {
                'file': os.path.basename(audio_path),
                'transcription': transcription,
                'duration': duration,
                'language': 'Sinhala'
            }
        
        except Exception as e:
            print(f"❌ Error: {e}")
            return None
    
    def transcribe_folder(self, folder_path):
        """Transcribe all audio files in folder"""
        
        if self.model is None:
            print("❌ Model not loaded")
            return
        
        if not os.path.isdir(folder_path):
            print(f"❌ Folder not found: {folder_path}")
            return
        
        results = []
        audio_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.wav', '.mp3', '.ogg', '.flac'))]
        
        print(f"\n📂 Found {len(audio_files)} audio files")
        print(f"🎤 Transcribing all files...")
        print("="*60)
        
        for i, audio_file in enumerate(audio_files[:10], 1):  # First 10 files
            audio_path = os.path.join(folder_path, audio_file)
            result = self.transcribe(audio_path)
            
            if result:
                results.append(result)
                print(f"\n✅ {i}. {result['file']}")
                print(f"   📝 {result['transcription']}")
                print(f"   ⏱️  {result['duration']:.2f}s")
        
        print("\n" + "="*60)
        print(f"\n✅ Transcribed {len(results)} files")
        
        # Save results
        output_file = 'vedda_transcriptions.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Saved to: {output_file}")
        
        return results


if __name__ == '__main__':
    try:
        print("\n" + "="*60)
        print("🎙️  VEDDA ASR - SINHALA OUTPUT")
        print("="*60)
        
        # Initialize
        demo = VeddaASRSpecialized()
        
        if demo.model is None:
            print("\n❌ Model loading failed")
            print("Solution:")
            print("  1. Run: python fix_model.py")
            print("  2. Check: python check_model.py")
            print("  3. Redownload model from Google Colab")
        else:
            # Test transcription
            folder_path = 'data/processed'
            
            if os.path.isdir(folder_path):
                demo.transcribe_folder(folder_path)
            else:
                print(f"\n❌ Folder not found: {folder_path}")
    
    except KeyboardInterrupt:
        print("\n\n👋 Stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
