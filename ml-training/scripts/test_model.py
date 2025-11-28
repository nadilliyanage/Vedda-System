"""
Test and use trained Vedda Whisper model for inference
"""

import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import soundfile as sf
import argparse
from pathlib import Path
import json

class VeddaWhisperSTT:
    def __init__(self, model_path, device=None):
        """
        Initialize Vedda Whisper STT model
        
        Args:
            model_path: Path to trained model
            device: Device to use ('cuda' or 'cpu')
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        
        print(f"Loading model from {model_path}...")
        print(f"Using device: {self.device}")
        
        self.processor = WhisperProcessor.from_pretrained(model_path)
        self.model = WhisperForConditionalGeneration.from_pretrained(model_path)
        self.model.to(self.device)
        self.model.eval()
        
        # Load training info if available
        info_path = Path(model_path) / "training_info.json"
        if info_path.exists():
            with open(info_path) as f:
                self.training_info = json.load(f)
            print(f"Model trained with WER: {self.training_info.get('final_wer', 'N/A'):.2f}%")
        
        print("✅ Model loaded successfully!")
    
    def transcribe(self, audio_path, language="si", return_timestamps=False):
        """
        Transcribe audio file to Vedda text
        
        Args:
            audio_path: Path to audio file
            language: Language code (default: 'si' for Sinhala/Vedda)
            return_timestamps: Whether to return word timestamps
        
        Returns:
            Transcribed text or dict with text and timestamps
        """
        # Load audio
        audio, sample_rate = sf.read(audio_path)
        
        # Resample if needed
        if sample_rate != 16000:
            import librosa
            audio = librosa.resample(audio, orig_sr=sample_rate, target_sr=16000)
        
        # Process audio
        input_features = self.processor(
            audio,
            sampling_rate=16000,
            return_tensors="pt"
        ).input_features
        
        input_features = input_features.to(self.device)
        
        # Generate transcription
        with torch.no_grad():
            if return_timestamps:
                predicted_ids = self.model.generate(
                    input_features,
                    return_timestamps=True
                )
            else:
                predicted_ids = self.model.generate(input_features)
        
        # Decode
        transcription = self.processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True
        )[0]
        
        if return_timestamps:
            # Extract timestamps if needed
            return {
                "text": transcription,
                "timestamps": predicted_ids  # Process timestamps as needed
            }
        
        return transcription
    
    def transcribe_batch(self, audio_paths, batch_size=8):
        """
        Transcribe multiple audio files
        
        Args:
            audio_paths: List of audio file paths
            batch_size: Batch size for processing
        
        Returns:
            List of transcriptions
        """
        transcriptions = []
        
        for i in range(0, len(audio_paths), batch_size):
            batch_paths = audio_paths[i:i+batch_size]
            batch_transcriptions = [
                self.transcribe(path) for path in batch_paths
            ]
            transcriptions.extend(batch_transcriptions)
        
        return transcriptions


def test_model(model_path, test_audio_path=None, test_dir=None):
    """
    Test the trained model
    
    Args:
        model_path: Path to trained model
        test_audio_path: Single audio file to test
        test_dir: Directory containing test audio files
    """
    print("="*70)
    print("VEDDA WHISPER MODEL TESTING")
    print("="*70)
    
    # Initialize model
    stt = VeddaWhisperSTT(model_path)
    
    if test_audio_path:
        # Test single file
        print(f"\nTranscribing: {test_audio_path}")
        transcription = stt.transcribe(test_audio_path)
        print(f"\nResult: {transcription}")
    
    elif test_dir:
        # Test directory
        test_path = Path(test_dir)
        audio_files = list(test_path.glob("*.wav"))
        
        print(f"\nFound {len(audio_files)} audio files")
        print("="*70)
        
        for audio_file in audio_files:
            print(f"\nFile: {audio_file.name}")
            transcription = stt.transcribe(str(audio_file))
            print(f"Transcription: {transcription}")
            print("-"*70)
    
    else:
        print("\n❌ Please provide either --test_audio or --test_dir")
        return
    
    print("\n✅ Testing complete!")


def interactive_mode(model_path):
    """Interactive transcription mode"""
    stt = VeddaWhisperSTT(model_path)
    
    print("\n" + "="*70)
    print("INTERACTIVE MODE")
    print("="*70)
    print("Enter audio file path to transcribe (or 'quit' to exit)")
    
    while True:
        audio_path = input("\nAudio file: ").strip()
        
        if audio_path.lower() in ['quit', 'exit', 'q']:
            break
        
        if not Path(audio_path).exists():
            print("❌ File not found!")
            continue
        
        try:
            transcription = stt.transcribe(audio_path)
            print(f"\n📝 Transcription: {transcription}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\nGoodbye!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Vedda Whisper model")
    parser.add_argument(
        "--model_path",
        type=str,
        required=True,
        help="Path to trained model"
    )
    parser.add_argument(
        "--test_audio",
        type=str,
        help="Path to single audio file to test"
    )
    parser.add_argument(
        "--test_dir",
        type=str,
        help="Directory containing test audio files"
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Run in interactive mode"
    )
    
    args = parser.parse_args()
    
    if args.interactive:
        interactive_mode(args.model_path)
    else:
        test_model(args.model_path, args.test_audio, args.test_dir)
