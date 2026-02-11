"""
Test Custom Vedda ASR Model

Simple script to test your trained model with audio files.
"""

import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import librosa
import os

class VeddaASRDemo:
    def __init__(self, model_path='models/whisper-vedda/final'):
        if not os.path.exists(model_path):
            print(f"❌ Model not found: {model_path}")
            print(f"   Train a model first: python scripts/3_train_whisper.py")
            return
        
        print(f"🤖 Loading Vedda ASR model...")
        self.processor = WhisperProcessor.from_pretrained(model_path)
        self.model = WhisperForConditionalGeneration.from_pretrained(model_path)
        
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model = self.model.to(self.device)
        self.model.eval()
        
        print(f"✅ Model loaded successfully!")
        print(f"🖥️  Using device: {self.device}\n")
    
    def transcribe(self, audio_path):
        """Transcribe audio file"""
        if not os.path.exists(audio_path):
            print(f"❌ Audio file not found: {audio_path}")
            return None
        
        print(f"🎤 Transcribing: {os.path.basename(audio_path)}")
        
        # Load audio
        audio, sr = librosa.load(audio_path, sr=16000, mono=True)
        duration = len(audio) / sr
        
        print(f"   Duration: {duration:.2f} seconds")
        
        # Process audio
        input_features = self.processor(
            audio,
            sampling_rate=16000,
            return_tensors="pt"
        ).input_features
        
        input_features = input_features.to(self.device)
        
        # Generate transcription
        import time
        start = time.time()
        
        with torch.no_grad():
            predicted_ids = self.model.generate(input_features)
        
        inference_time = time.time() - start
        
        # Decode
        transcription = self.processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True
        )[0]
        
        print(f"\n📝 Transcription: {transcription}")
        print(f"⚡ Inference time: {inference_time*1000:.0f}ms")
        print(f"⚡ Real-time factor: {inference_time/duration:.3f}\n")
        
        return transcription


def interactive_demo():
    """Interactive demo"""
    print("\n" + "="*60)
    print("🎙️  VEDDA ASR MODEL DEMO")
    print("="*60)
    
    # Initialize model
    demo = VeddaASRDemo()
    
    while True:
        print("\nOptions:")
        print("  1. Transcribe audio file")
        print("  2. Transcribe all files in a folder")
        print("  3. Exit")
        
        choice = input("\nChoose option (1-3): ").strip()
        
        if choice == '1':
            audio_path = input("\nEnter audio file path: ").strip().replace('"', '')
            demo.transcribe(audio_path)
            
        elif choice == '2':
            folder_path = input("\nEnter folder path: ").strip().replace('"', '')
            
            if not os.path.exists(folder_path):
                print(f"❌ Folder not found: {folder_path}")
                continue
            
            # Get all audio files
            audio_files = []
            for ext in ['.wav', '.mp3', '.ogg', '.flac', '.m4a']:
                audio_files.extend([
                    os.path.join(folder_path, f)
                    for f in os.listdir(folder_path)
                    if f.lower().endswith(ext)
                ])
            
            if not audio_files:
                print(f"❌ No audio files found in: {folder_path}")
                continue
            
            print(f"\n📂 Found {len(audio_files)} audio files")
            
            for audio_path in audio_files:
                demo.transcribe(audio_path)
                print("-" * 60)
            
        elif choice == '3':
            print("\n👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice")


if __name__ == '__main__':
    try:
        interactive_demo()
    except KeyboardInterrupt:
        print("\n\n👋 Demo interrupted")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
