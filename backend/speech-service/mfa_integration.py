"""
Montreal Forced Aligner (MFA) Integration Module
Prepares Vedda ASR data for forced alignment to extract clean segments

This module implements Phase 2 of LoReSpeech: generate frame-level alignments
to extract clean, precisely-aligned audio-transcription segments.

Reference: https://montreal-forced-aligner.readthedocs.io/
"""

import os
import json
import subprocess
import shutil
from pathlib import Path
from typing import List, Dict, Tuple
import librosa
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MFASetupManager:
    """Manage Montreal Forced Aligner installation and configuration"""
    
    @staticmethod
    def check_mfa_installed() -> bool:
        """Check if MFA is installed"""
        try:
            result = subprocess.run(['mfa', '--version'], 
                                 capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    @staticmethod
    def install_mfa() -> bool:
        """
        Install Montreal Forced Aligner
        
        Command: pip install montreal-forced-aligner
        """
        print("\n📦 Installing Montreal Forced Aligner...")
        try:
            subprocess.run(['pip', 'install', 'montreal-forced-aligner', '-q'],
                         check=True, timeout=300)
            print("✓ MFA installed successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to install MFA: {e}")
            return False
    
    @staticmethod
    def download_acoustic_model(language: str = "sinhala") -> bool:
        """
        Download acoustic model for language
        
        For Vedda, use Sinhala acoustic model as close proxy
        
        Command: mfa model download acoustic sinhala
        """
        print(f"\n📥 Downloading acoustic model for {language}...")
        try:
            cmd = ['mfa', 'model', 'download', 'acoustic', language]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            
            if result.returncode == 0:
                print(f"✓ Acoustic model {language} downloaded")
                return True
            else:
                # Try alternative language if Sinhala not available
                if language == "sinhala":
                    print(f"⚠ {language} model not available, trying english...")
                    return MFASetupManager.download_acoustic_model("english")
                print(f"❌ Failed to download {language}: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error downloading model: {e}")
            return False
    
    @staticmethod
    def download_lexicon(language: str = "sinhala") -> bool:
        """
        Download pronunciation lexicon for language
        
        Command: mfa model download lexicon sinhala
        """
        print(f"\n📥 Downloading lexicon for {language}...")
        try:
            cmd = ['mfa', 'model', 'download', 'lexicon', language]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            
            if result.returncode == 0:
                print(f"✓ Lexicon {language} downloaded")
                return True
            else:
                print(f"⚠ Lexicon {language} not available")
                return False
        except Exception as e:
            print(f"❌ Error downloading lexicon: {e}")
            return False


class MFACorpusPreparation:
    """Prepare corpus for MFA alignment"""
    
    def __init__(self, corpus_dir: str = "mfa_corpus"):
        """
        Initialize corpus preparation
        
        Directory structure:
        mfa_corpus/
        ├── audio/
        │   ├── speaker1/
        │   │   ├── sample1.wav
        │   │   └── sample2.wav
        │   └── speaker2/
        └── text/
            ├── speaker1/
            │   ├── sample1.txt
            │   └── sample2.txt
            └── speaker2/
        """
        self.corpus_dir = corpus_dir
        self.audio_dir = os.path.join(corpus_dir, 'audio')
        self.text_dir = os.path.join(corpus_dir, 'text')
        
        # Create directories
        os.makedirs(self.audio_dir, exist_ok=True)
        os.makedirs(self.text_dir, exist_ok=True)
    
    def add_sample(self, audio_path: str, text: str, speaker_id: str = "default",
                  sample_id: str = None):
        """
        Add a sample to the corpus
        
        Args:
            audio_path: Path to audio file
            text: Transcription text
            speaker_id: Speaker identifier
            sample_id: Sample identifier (defaults to audio filename stem)
        """
        if not os.path.exists(audio_path):
            logger.warning(f"Audio file not found: {audio_path}")
            return False
        
        # Use audio filename stem if sample_id not provided
        if not sample_id:
            sample_id = Path(audio_path).stem
        
        # Create speaker directories
        speaker_audio_dir = os.path.join(self.audio_dir, speaker_id)
        speaker_text_dir = os.path.join(self.text_dir, speaker_id)
        os.makedirs(speaker_audio_dir, exist_ok=True)
        os.makedirs(speaker_text_dir, exist_ok=True)
        
        # Copy audio file
        dest_audio = os.path.join(speaker_audio_dir, f"{sample_id}.wav")
        
        # Convert to WAV if needed
        if not audio_path.lower().endswith('.wav'):
            audio, sr = librosa.load(audio_path, sr=16000, mono=True)
            librosa.output.write_wav(dest_audio, audio, sr)
        else:
            shutil.copy2(audio_path, dest_audio)
        
        # Write text file
        dest_text = os.path.join(speaker_text_dir, f"{sample_id}.txt")
        with open(dest_text, 'w', encoding='utf-8') as f:
            f.write(text)
        
        logger.info(f"Added sample: {speaker_id}/{sample_id}")
        return True
    
    def add_samples_batch(self, samples: List[Tuple[str, str, str]]):
        """
        Add multiple samples to corpus
        
        Args:
            samples: List of (audio_path, text, speaker_id) tuples
        """
        for i, (audio_path, text, speaker_id) in enumerate(samples, 1):
            if (i - 1) % 50 == 0:
                logger.info(f"Adding sample {i}/{len(samples)}")
            
            try:
                self.add_sample(audio_path, text, speaker_id)
            except Exception as e:
                logger.error(f"Error adding sample {audio_path}: {e}")
    
    def validate_corpus(self) -> Dict:
        """Validate corpus structure"""
        audio_count = 0
        text_count = 0
        speakers = set()
        
        for speaker_dir in os.listdir(self.audio_dir):
            speaker_audio_dir = os.path.join(self.audio_dir, speaker_dir)
            speaker_text_dir = os.path.join(self.text_dir, speaker_dir)
            
            if os.path.isdir(speaker_audio_dir):
                speakers.add(speaker_dir)
                audio_files = list(Path(speaker_audio_dir).glob('*.wav'))
                text_files = list(Path(speaker_text_dir).glob('*.txt')) if os.path.exists(speaker_text_dir) else []
                
                audio_count += len(audio_files)
                text_count += len(text_files)
                
                if len(audio_files) != len(text_files):
                    logger.warning(f"Mismatch in {speaker_dir}: "
                                 f"{len(audio_files)} audio, {len(text_files)} text")
        
        validation = {
            'total_speakers': len(speakers),
            'total_audio_files': audio_count,
            'total_text_files': text_count,
            'match': audio_count == text_count,
            'speakers': list(speakers)
        }
        
        logger.info(f"Corpus validation: {audio_count} samples, "
                   f"{len(speakers)} speakers")
        
        return validation


class MFAAlignmentRunner:
    """Run MFA alignment and process results"""
    
    @staticmethod
    def run_alignment(corpus_dir: str, output_dir: str = None,
                     acoustic_model: str = "sinhala",
                     lexicon: str = "sinhala",
                     num_jobs: int = 4) -> bool:
        """
        Run MFA alignment
        
        Command:
        mfa align [corpus_dir] [acoustic_model] [lexicon] [output_dir] 
                  --num_jobs [n]
        """
        if not output_dir:
            output_dir = os.path.join(corpus_dir, "aligned")
        
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"\n🔄 Running MFA alignment...")
        print(f"   Corpus: {corpus_dir}")
        print(f"   Acoustic Model: {acoustic_model}")
        print(f"   Lexicon: {lexicon}")
        print(f"   Output: {output_dir}")
        
        try:
            cmd = [
                'mfa', 'align',
                corpus_dir,
                acoustic_model,
                lexicon,
                output_dir,
                '--num_jobs', str(num_jobs)
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
            
            if result.returncode == 0:
                print("✓ Alignment completed successfully")
                return True
            else:
                print(f"❌ Alignment failed:")
                print(result.stderr)
                return False
        
        except Exception as e:
            print(f"❌ Error running alignment: {e}")
            return False
    
    @staticmethod
    def parse_textgrid(textgrid_path: str) -> List[Dict]:
        """
        Parse TextGrid file to extract alignments
        
        Returns: List of {start, end, text} dictionaries
        """
        segments = []
        
        try:
            # Simple TextGrid parser (handles Praat format)
            with open(textgrid_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            in_tier = False
            for line in lines:
                line = line.strip()
                
                if line.startswith('intervals ['):
                    in_tier = True
                
                if in_tier:
                    if ' = ' in line:
                        key, val = line.split('=', 1)
                        key, val = key.strip(), val.strip('"')
                        
                        if key == 'xmin':
                            start_time = float(val)
                        elif key == 'xmax':
                            end_time = float(val)
                        elif key == 'text':
                            text = val
                            
                            if text:  # Only add non-empty segments
                                segments.append({
                                    'start': start_time,
                                    'end': end_time,
                                    'duration': end_time - start_time,
                                    'text': text
                                })
                            in_tier = False
            
            return segments
        
        except Exception as e:
            logger.error(f"Error parsing TextGrid {textgrid_path}: {e}")
            return []


class VeddaSegmentExtractor:
    """Extract clean segments from aligned audio"""
    
    @staticmethod
    def extract_segments_from_audio(audio_path: str, segments: List[Dict],
                                   output_dir: str = None, 
                                   min_duration: float = 0.5) -> List[Dict]:
        """
        Extract audio segments based on alignment points
        
        Args:
            audio_path: Path to full audio file
            segments: List of {start, end, text} from TextGrid
            output_dir: Directory to save extracted segments
            min_duration: Minimum segment duration to keep
            
        Returns:
            List of extracted segment metadata
        """
        if not output_dir:
            output_dir = os.path.join(
                os.path.dirname(audio_path), 
                'extracted_segments'
            )
        os.makedirs(output_dir, exist_ok=True)
        
        # Load full audio
        audio, sr = librosa.load(audio_path, sr=16000, mono=True)
        
        extracted = []
        for i, seg in enumerate(segments):
            duration = seg['duration']
            
            if duration < min_duration:
                continue  # Skip too-short segments
            
            # Extract segment
            start_sample = int(seg['start'] * sr)
            end_sample = int(seg['end'] * sr)
            segment_audio = audio[start_sample:end_sample]
            
            # Save segment
            segment_id = f"{Path(audio_path).stem}_{i:03d}"
            segment_path = os.path.join(output_dir, f"{segment_id}.wav")
            librosa.output.write_wav(segment_path, segment_audio, sr)
            
            extracted.append({
                'segment_id': segment_id,
                'original_file': Path(audio_path).name,
                'start_time': seg['start'],
                'end_time': seg['end'],
                'duration': duration,
                'text': seg['text'],
                'audio_path': segment_path
            })
        
        logger.info(f"Extracted {len(extracted)} segments from {Path(audio_path).name}")
        return extracted
    
    @staticmethod
    def batch_extract_segments(corpus_output_dir: str,
                              segments_output_dir: str = None) -> List[Dict]:
        """
        Extract segments from entire corpus
        
        Args:
            corpus_output_dir: MFA output directory with TextGrid files
            segments_output_dir: Where to save extracted segments
        """
        if not segments_output_dir:
            segments_output_dir = os.path.join(corpus_output_dir, 'extracted_segments')
        
        all_segments = []
        aligned_dir = os.path.join(corpus_output_dir, 'aligned')
        
        # Find all TextGrid files
        for textgrid_path in Path(aligned_dir).rglob('*.TextGrid'):
            # Parse alignments
            segments = VeddaSegmentExtractor.parse_textgrid(textgrid_path)
            
            # Find corresponding audio file
            speaker_dir = textgrid_path.parent.name
            audio_name = textgrid_path.stem
            audio_dirs = [aligned_dir]  # Search in aligned directory
            
            audio_path = None
            for search_dir in audio_dirs:
                candidate = os.path.join(search_dir, speaker_dir, f"{audio_name}.wav")
                if os.path.exists(candidate):
                    audio_path = candidate
                    break
            
            if audio_path and segments:
                extracted = VeddaSegmentExtractor.extract_segments_from_audio(
                    audio_path, segments, 
                    output_dir=segments_output_dir
                )
                all_segments.extend(extracted)
        
        return all_segments


def main():
    """Main workflow: setup MFA and process Vedda corpus"""
    print("\n" + "="*80)
    print(" Montreal Forced Aligner (MFA) Setup for Vedda ASR")
    print("="*80)
    
    # Step 1: Check/install MFA
    print("\n[Step 1] Checking MFA installation...")
    if not MFASetupManager.check_mfa_installed():
        print("MFA not installed. Installing...")
        if not MFASetupManager.install_mfa():
            print("❌ Failed to install MFA")
            return
    else:
        print("✓ MFA already installed")
    
    # Step 2: Download models
    print("\n[Step 2] Downloading acoustic model and lexicon...")
    MFASetupManager.download_acoustic_model("sinhala")
    MFASetupManager.download_lexicon("sinhala")
    
    # Step 3: Prepare corpus
    print("\n[Step 3] Preparing corpus...")
    corpus_prep = MFACorpusPreparation("mfa_corpus")
    # TODO: Load Vedda samples from validated dataset
    corpus_prep.add_sample("sample.wav", "හොච්ච දික්කා", "speaker_default")
    
    # Validate
    validation = corpus_prep.validate_corpus()
    print(f"✓ Corpus ready: {validation['total_audio_files']} samples, "
          f"{validation['total_speakers']} speakers")
    
    # Step 4: Run alignment
    print("\n[Step 4] Running alignment...")
    success = MFAAlignmentRunner.run_alignment(
        "mfa_corpus",
        output_dir="mfa_output",
        num_jobs=4
    )
    
    if success:
        # Step 5: Extract segments
        print("\n[Step 5] Extracting aligned segments...")
        segments = VeddaSegmentExtractor.batch_extract_segments("mfa_output")
        
        print(f"\n✓ Extracted {len(segments)} aligned segments")
        
        # Save segment metadata
        segments_json = {
            'total_segments': len(segments),
            'segments': segments
        }
        with open('mfa_output/extracted_segments_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(segments_json, f, indent=2, ensure_ascii=False)
        
        print("✓ Segment metadata saved to mfa_output/extracted_segments_metadata.json")


if __name__ == '__main__':
    # This is setup/reference code
    # Actual usage would be in integration with loReSpeech_quick_start.py
    print("Montreal Forced Aligner Integration Module")
    print("\nUsage:")
    print("  from mfa_integration import MFASetupManager, MFACorpusPreparation, MFAAlignmentRunner")
    print("\nSee loReSpeech_quick_start.py for full workflow")
