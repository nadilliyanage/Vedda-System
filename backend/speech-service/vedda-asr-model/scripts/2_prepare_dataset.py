"""
Step 2: Prepare Vedda Dataset for Training

Processes raw audio files and creates training-ready dataset.
"""

import os
import json
import librosa
import soundfile as sf
import numpy as np
from pathlib import Path
from tqdm import tqdm

class DatasetPreparator:
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        self.raw_dir = os.path.join(data_dir, 'raw')
        self.processed_dir = os.path.join(data_dir, 'processed')
        self.dataset_file = os.path.join(data_dir, 'dataset.json')
        self.train_file = os.path.join(data_dir, 'train_dataset.json')
        self.test_file = os.path.join(data_dir, 'test_dataset.json')
        
        os.makedirs(self.processed_dir, exist_ok=True)
        
        # Target audio specifications
        self.target_sr = 16000  # 16kHz sample rate
        self.target_channels = 1  # Mono
    
    def load_dataset(self):
        """Load raw dataset"""
        if not os.path.exists(self.dataset_file):
            print(f"❌ Dataset not found: {self.dataset_file}")
            print(f"   Run: python scripts/1_collect_data.py first")
            return None
        
        with open(self.dataset_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def preprocess_audio(self, audio_path, output_path):
        """
        Preprocess audio file:
        - Convert to 16kHz mono
        - Normalize volume
        - Remove silence
        - Apply noise reduction
        """
        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=None, mono=False)
            
            # Convert to mono if stereo
            if len(audio.shape) > 1:
                audio = librosa.to_mono(audio)
            
            # Resample to 16kHz if needed
            if sr != self.target_sr:
                audio = librosa.resample(audio, orig_sr=sr, target_sr=self.target_sr)
            
            # Normalize volume
            audio = librosa.util.normalize(audio)
            
            # Trim silence from beginning and end
            audio, _ = librosa.effects.trim(audio, top_db=30)
            
            # Apply pre-emphasis to boost high frequencies
            audio = librosa.effects.preemphasis(audio)
            
            # Check duration (skip if too short)
            duration = len(audio) / self.target_sr
            if duration < 0.5:
                print(f"⚠️  Skipping {audio_path} (too short: {duration:.2f}s)")
                return None
            
            # Save processed audio
            sf.write(output_path, audio, self.target_sr)
            
            return {
                'duration': duration,
                'sample_rate': self.target_sr,
                'samples': len(audio)
            }
            
        except Exception as e:
            print(f"❌ Error processing {audio_path}: {e}")
            return None
    
    def prepare_dataset(self):
        """Process all audio files and create training dataset"""
        print("\n" + "="*60)
        print("🔧 PREPARING VEDDA ASR DATASET")
        print("="*60)
        
        # Load raw dataset
        dataset = self.load_dataset()
        if not dataset:
            return
        
        raw_entries = dataset.get('data', [])
        print(f"\n📊 Found {len(raw_entries)} recordings")
        
        # Process each audio file
        processed_entries = []
        failed = 0
        
        print(f"\n⚙️  Processing audio files...")
        for entry in tqdm(raw_entries, desc="Processing"):
            audio_path = entry.get('audio_path')
            
            if not os.path.exists(audio_path):
                print(f"⚠️  File not found: {audio_path}")
                failed += 1
                continue
            
            # Generate output path
            audio_filename = os.path.basename(audio_path)
            output_path = os.path.join(self.processed_dir, audio_filename)
            
            # Preprocess audio
            audio_info = self.preprocess_audio(audio_path, output_path)
            
            if audio_info:
                # Create processed entry
                processed_entry = {
                    'audio_path': output_path,
                    'transcription': entry.get('transcription', ''),
                    'translation': entry.get('translation', ''),
                    'duration': audio_info['duration'],
                    'sample_rate': audio_info['sample_rate'],
                    'speaker_id': entry.get('speaker_id', 'unknown'),
                    'original_path': audio_path
                }
                processed_entries.append(processed_entry)
            else:
                failed += 1
        
        print(f"\n✅ Processed: {len(processed_entries)}/{len(raw_entries)} files")
        if failed > 0:
            print(f"⚠️  Failed: {failed} files")
        
        # Split into train/test sets (90/10 split)
        from sklearn.model_selection import train_test_split
        
        train_data, test_data = train_test_split(
            processed_entries,
            test_size=0.1,
            random_state=42,
            shuffle=True
        )
        
        print(f"\n📂 Dataset split:")
        print(f"   Train: {len(train_data)} samples")
        print(f"   Test:  {len(test_data)} samples")
        
        # Calculate statistics
        train_duration = sum(x['duration'] for x in train_data)
        test_duration = sum(x['duration'] for x in test_data)
        
        print(f"\n⏱️  Duration:")
        print(f"   Train: {train_duration/60:.1f} minutes")
        print(f"   Test:  {test_duration/60:.1f} minutes")
        print(f"   Total: {(train_duration+test_duration)/60:.1f} minutes")
        
        # Save datasets
        train_dataset = {
            'data': train_data,
            'metadata': {
                'total_samples': len(train_data),
                'total_duration': train_duration,
                'split': 'train'
            }
        }
        
        test_dataset = {
            'data': test_data,
            'metadata': {
                'total_samples': len(test_data),
                'total_duration': test_duration,
                'split': 'test'
            }
        }
        
        with open(self.train_file, 'w', encoding='utf-8') as f:
            json.dump(train_dataset, f, ensure_ascii=False, indent=2)
        
        with open(self.test_file, 'w', encoding='utf-8') as f:
            json.dump(test_dataset, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Saved:")
        print(f"   Train: {self.train_file}")
        print(f"   Test:  {self.test_file}")
        
        # Check if ready for training
        if train_duration >= 3600:  # 1 hour
            print(f"\n✅ Dataset ready for training!")
            print(f"   Next: python scripts/3_train_whisper.py")
        else:
            needed = (3600 - train_duration) / 60
            print(f"\n⚠️  Dataset too small for optimal training")
            print(f"   Recommended: {needed:.0f} more minutes")
            print(f"   You can still train, but accuracy may be lower")
        
        print(f"\n{'='*60}\n")
        
        return train_dataset, test_dataset


if __name__ == '__main__':
    try:
        preparator = DatasetPreparator()
        preparator.prepare_dataset()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
