"""
Vedda Audio Data Collector
Records audio samples with metadata for training custom STT model
"""

import sounddevice as sd
import soundfile as sf
import numpy as np
from datetime import datetime
import json
import os
from pathlib import Path

class VeddaAudioRecorder:
    def __init__(self, sample_rate=16000, output_dir="vedda_dataset"):
        self.sample_rate = sample_rate
        self.output_dir = Path(output_dir)
        self.audio_dir = self.output_dir / "audio"
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.output_dir / "metadata.json"
        self.metadata = self.load_metadata()
    
    def load_metadata(self):
        """Load existing metadata if available"""
        if self.metadata_file.exists():
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def save_metadata(self):
        """Save metadata to JSON"""
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(self.metadata, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Saved {len(self.metadata)} recordings")
    
    def record_sample(self, text, speaker_id, duration=10):
        """
        Record a single audio sample
        
        Args:
            text: Vedda text to be spoken
            speaker_id: Unique speaker identifier
            duration: Recording duration in seconds
        
        Returns:
            filepath: Path to saved audio file
        """
        print(f"\n{'='*60}")
        print(f"Speaker {speaker_id}, please say:")
        print(f"\n  '{text}'")
        print(f"\n{'='*60}")
        
        # Countdown
        import time
        for i in range(3, 0, -1):
            print(f"Starting in {i}...")
            time.sleep(1)
        
        print("\n🎤 RECORDING... Speak now!")
        
        # Record audio
        audio = sd.rec(
            int(duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=1,
            dtype=np.float32
        )
        sd.wait()
        
        print("✅ Recording complete!")
        
        # Play back for verification
        verify = input("\nPlay back? (y/n): ")
        if verify.lower() == 'y':
            sd.play(audio, self.sample_rate)
            sd.wait()
        
        # Ask if keeping
        keep = input("Keep this recording? (y/n): ")
        if keep.lower() != 'y':
            print("❌ Recording discarded")
            return None
        
        # Save audio file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"vedda_{speaker_id}_{len(self.metadata):05d}_{timestamp}.wav"
        filepath = self.audio_dir / filename
        
        # Normalize audio to prevent clipping
        audio = audio / np.max(np.abs(audio))
        
        sf.write(str(filepath), audio, self.sample_rate)
        
        # Calculate actual duration
        actual_duration = len(audio) / self.sample_rate
        
        # Save metadata
        metadata_entry = {
            "audio_filepath": str(filepath.relative_to(self.output_dir)),
            "text": text,
            "speaker_id": speaker_id,
            "duration": actual_duration,
            "sample_rate": self.sample_rate,
            "timestamp": timestamp,
            "index": len(self.metadata)
        }
        
        self.metadata.append(metadata_entry)
        
        # Auto-save every 10 recordings
        if len(self.metadata) % 10 == 0:
            self.save_metadata()
        
        return filepath
    
    def get_stats(self):
        """Get statistics about collected data"""
        if not self.metadata:
            return {
                "total_recordings": 0,
                "total_duration": 0,
                "speakers": 0,
                "avg_duration": 0
            }
        
        total_duration = sum(item["duration"] for item in self.metadata)
        speakers = len(set(item["speaker_id"] for item in self.metadata))
        
        return {
            "total_recordings": len(self.metadata),
            "total_duration": total_duration,
            "total_hours": total_duration / 3600,
            "speakers": speakers,
            "avg_duration": total_duration / len(self.metadata)
        }
    
    def print_stats(self):
        """Print collection statistics"""
        stats = self.get_stats()
        print(f"\n{'='*60}")
        print("DATA COLLECTION STATISTICS")
        print(f"{'='*60}")
        print(f"Total Recordings: {stats['total_recordings']}")
        print(f"Total Duration: {stats['total_duration']:.2f} seconds ({stats.get('total_hours', 0):.2f} hours)")
        print(f"Speakers: {stats['speakers']}")
        print(f"Average Duration: {stats['avg_duration']:.2f} seconds")
        print(f"{'='*60}\n")


# Common Vedda sentences for data collection
VEDDA_SENTENCES = [
    # Greetings & Basic
    "හෙලෝ",
    "ඔයා කොහොමද",
    "මං හොඳින්",
    "ස්තූතියි",
    
    # Family
    "මේ කැකුලෝ ගෙදර ඉන්නවා",
    "නත්තෝ කතා කරනවා",
    "අප්පෝ වැඩ කරනවා",
    "අම්මෝ කෑම හදනවා",
    "කැකුලෝ ක්‍රීඩා කරනවා",
    
    # Actions
    "මං යනවා",
    "ඔයා එනවා",
    "අපි බලමු",
    "ඔහු කනවා",
    "ඇය බොනවා",
    
    # Objects
    "මේ ගස් ලොකු",
    "ඒ ගෙදර සුන්දර",
    "මේ කෑම රසයි",
    "ඒ වතුර පිරිසිදු",
    
    # Numbers
    "එක",
    "දෙක",
    "තුන",
    "හතර",
    "පහ",
    
    # Questions
    "මේක මොකද",
    "කවුද ඔයා",
    "කොහෙද ගෙදර",
    "කවදාද එන්නේ",
    
    # Add 100+ more Vedda sentences here
    # Organize by category: daily activities, nature, culture, etc.
]


def collect_data_interactive():
    """Interactive data collection session"""
    recorder = VeddaAudioRecorder()
    
    print("\n" + "="*60)
    print("VEDDA SPEECH DATA COLLECTION")
    print("="*60)
    
    # Get speaker info
    speaker_id = input("\nEnter speaker ID (e.g., SPKR001): ").strip()
    if not speaker_id:
        speaker_id = f"SPKR{len(set(item['speaker_id'] for item in recorder.metadata)) + 1:03d}"
        print(f"Using auto-generated ID: {speaker_id}")
    
    print(f"\nTotal sentences to record: {len(VEDDA_SENTENCES)}")
    print("Recording duration: 10 seconds each")
    print("\nInstructions:")
    print("1. Read the sentence naturally")
    print("2. Speak clearly but at normal speed")
    print("3. You can re-record if needed")
    print("\nPress Enter to start...")
    input()
    
    successful_recordings = 0
    
    for i, sentence in enumerate(VEDDA_SENTENCES, 1):
        print(f"\n--- Recording {i}/{len(VEDDA_SENTENCES)} ---")
        
        filepath = recorder.record_sample(sentence, speaker_id, duration=10)
        
        if filepath:
            successful_recordings += 1
        
        # Take breaks
        if i % 20 == 0:
            recorder.print_stats()
            cont = input("\nTake a break? Press Enter to continue or 'q' to quit: ")
            if cont.lower() == 'q':
                break
    
    # Final save and stats
    recorder.save_metadata()
    recorder.print_stats()
    
    print(f"\n✅ Session complete! Recorded {successful_recordings} samples.")
    print(f"Data saved to: {recorder.output_dir}")


if __name__ == "__main__":
    collect_data_interactive()
