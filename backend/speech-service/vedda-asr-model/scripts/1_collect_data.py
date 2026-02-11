"""
Step 1: Vedda Audio Data Collection Script

This script helps you collect and organize Vedda speech data for training a custom ASR model.
"""

import os
import json
import sounddevice as sd
import soundfile as sf
import numpy as np
from datetime import datetime
import uuid

class VeddaDataCollector:
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        self.raw_dir = os.path.join(data_dir, 'raw')
        self.transcription_dir = os.path.join(data_dir, 'transcriptions')
        self.dataset_file = os.path.join(data_dir, 'dataset.json')
        
        # Create directories
        os.makedirs(self.raw_dir, exist_ok=True)
        os.makedirs(self.transcription_dir, exist_ok=True)
        
        # Load existing dataset or create new
        self.dataset = self._load_dataset()
    
    def _load_dataset(self):
        """Load existing dataset or create new"""
        if os.path.exists(self.dataset_file):
            with open(self.dataset_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'data': [], 'metadata': {
            'language': 'vedda',
            'created': datetime.now().isoformat(),
            'total_duration': 0,
            'speakers': []
        }}
    
    def _save_dataset(self):
        """Save dataset to JSON"""
        with open(self.dataset_file, 'w', encoding='utf-8') as f:
            json.dump(self.dataset, f, ensure_ascii=False, indent=2)
    
    def record_audio(self, duration=5, sample_rate=16000, speaker_id='speaker_01'):
        """Record audio from microphone"""
        print(f"\n🎤 Recording for {duration} seconds...")
        print(f"   Speaker: {speaker_id}")
        print(f"   Speak in Vedda NOW!")
        
        # Record audio
        audio_data = sd.rec(
            int(duration * sample_rate),
            samplerate=sample_rate,
            channels=1,
            dtype=np.int16
        )
        sd.wait()
        
        print(f"✅ Recording complete!")
        
        # Generate unique ID
        recording_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'vedda_{speaker_id}_{timestamp}_{recording_id}.wav'
        filepath = os.path.join(self.raw_dir, filename)
        
        # Save audio
        sf.write(filepath, audio_data, sample_rate)
        
        # Get transcription from user
        transcription = input("\n📝 Enter Vedda transcription: ").strip()
        
        # Get English translation (optional)
        translation = input("🌐 Enter English translation (optional): ").strip()
        
        # Add to dataset
        entry = {
            'id': recording_id,
            'audio_path': filepath,
            'transcription': transcription,
            'translation': translation,
            'duration': duration,
            'sample_rate': sample_rate,
            'speaker_id': speaker_id,
            'recorded_at': datetime.now().isoformat(),
            'validated': False,
            'quality_checked': False
        }
        
        self.dataset['data'].append(entry)
        self.dataset['metadata']['total_duration'] += duration
        
        if speaker_id not in self.dataset['metadata']['speakers']:
            self.dataset['metadata']['speakers'].append(speaker_id)
        
        self._save_dataset()
        
        print(f"\n✅ Saved: {filename}")
        print(f"📊 Total recordings: {len(self.dataset['data'])}")
        print(f"⏱️  Total duration: {self.dataset['metadata']['total_duration']/60:.1f} minutes")
        
        return entry
    
    def import_audio_file(self, audio_path, transcription, speaker_id='speaker_01', translation=''):
        """Import existing audio file"""
        if not os.path.exists(audio_path):
            print(f"❌ File not found: {audio_path}")
            return None
        
        # Read audio to get duration
        audio_data, sample_rate = sf.read(audio_path)
        duration = len(audio_data) / sample_rate
        
        # Copy to raw directory
        recording_id = str(uuid.uuid4())[:8]
        filename = f'vedda_{speaker_id}_{recording_id}.wav'
        new_path = os.path.join(self.raw_dir, filename)
        
        # Convert to 16kHz mono if needed
        if sample_rate != 16000 or len(audio_data.shape) > 1:
            import librosa
            audio_data = librosa.resample(audio_data, orig_sr=sample_rate, target_sr=16000)
            if len(audio_data.shape) > 1:
                audio_data = audio_data.mean(axis=1)
            sample_rate = 16000
        
        sf.write(new_path, audio_data, sample_rate)
        
        # Add to dataset
        entry = {
            'id': recording_id,
            'audio_path': new_path,
            'transcription': transcription,
            'translation': translation,
            'duration': duration,
            'sample_rate': sample_rate,
            'speaker_id': speaker_id,
            'imported_at': datetime.now().isoformat(),
            'original_path': audio_path,
            'validated': False,
            'quality_checked': False
        }
        
        self.dataset['data'].append(entry)
        self.dataset['metadata']['total_duration'] += duration
        
        if speaker_id not in self.dataset['metadata']['speakers']:
            self.dataset['metadata']['speakers'].append(speaker_id)
        
        self._save_dataset()
        
        print(f"✅ Imported: {filename}")
        print(f"📊 Total recordings: {len(self.dataset['data'])}")
        
        return entry
    
    def create_transcription_template(self):
        """Generate template CSV for batch transcription"""
        template_path = os.path.join(self.transcription_dir, 'transcription_template.csv')
        
        import csv
        with open(template_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['audio_filename', 'vedda_transcription', 'english_translation', 'speaker_id', 'notes'])
            
            # Add rows for each audio file without transcription
            for entry in self.dataset['data']:
                if not entry.get('transcription'):
                    filename = os.path.basename(entry['audio_path'])
                    writer.writerow([filename, '', '', entry.get('speaker_id', ''), ''])
        
        print(f"✅ Template created: {template_path}")
        print(f"📝 Fill in transcriptions and run import_transcriptions()")
    
    def get_statistics(self):
        """Get dataset statistics"""
        total_recordings = len(self.dataset['data'])
        total_duration = self.dataset['metadata']['total_duration']
        speakers = len(self.dataset['metadata']['speakers'])
        validated = sum(1 for x in self.dataset['data'] if x.get('validated'))
        
        print(f"\n{'='*60}")
        print(f"📊 VEDDA ASR DATASET STATISTICS")
        print(f"{'='*60}")
        print(f"Total recordings: {total_recordings}")
        print(f"Total duration: {total_duration/60:.1f} minutes ({total_duration/3600:.2f} hours)")
        print(f"Number of speakers: {speakers}")
        print(f"Validated: {validated}/{total_recordings}")
        print(f"Average duration: {total_duration/total_recordings if total_recordings > 0 else 0:.1f} seconds")
        print(f"\n💡 Recommended minimum: 1 hour (60 minutes)")
        print(f"   Current progress: {(total_duration/3600)*100:.1f}%")
        print(f"{'='*60}\n")


def guided_collection():
    """Interactive guided data collection"""
    print("\n" + "="*60)
    print("🎙️  VEDDA ASR DATA COLLECTION TOOL")
    print("="*60)
    print("\nThis tool helps you collect audio data for training a custom")
    print("Vedda speech recognition model.\n")
    print("💡 Target: 1-2 hours of high-quality Vedda speech\n")
    
    collector = VeddaDataCollector()
    collector.get_statistics()
    
    while True:
        print("\nOptions:")
        print("  1. Record new audio")
        print("  2. Import existing audio file")
        print("  3. Create transcription template")
        print("  4. View statistics")
        print("  5. Exit")
        
        choice = input("\nChoose option (1-5): ").strip()
        
        if choice == '1':
            # Record audio
            speaker_id = input("Speaker ID (e.g., speaker_01): ").strip() or 'speaker_01'
            duration_input = input("Duration in seconds (default 5): ").strip()
            duration = int(duration_input) if duration_input else 5
            
            collector.record_audio(duration=duration, speaker_id=speaker_id)
            
        elif choice == '2':
            # Import file
            audio_path = input("Audio file path: ").strip().replace('"', '')
            transcription = input("Vedda transcription: ").strip()
            translation = input("English translation (optional): ").strip()
            speaker_id = input("Speaker ID (e.g., speaker_01): ").strip() or 'speaker_01'
            
            collector.import_audio_file(audio_path, transcription, speaker_id, translation)
            
        elif choice == '3':
            collector.create_transcription_template()
            
        elif choice == '4':
            collector.get_statistics()
            
        elif choice == '5':
            print("\n👋 Data collection complete!")
            print(f"📁 Dataset saved to: {collector.dataset_file}")
            print(f"📊 Next step: python scripts/2_prepare_dataset.py")
            break
        
        else:
            print("❌ Invalid choice")


if __name__ == '__main__':
    try:
        guided_collection()
    except KeyboardInterrupt:
        print("\n\n👋 Collection interrupted")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
