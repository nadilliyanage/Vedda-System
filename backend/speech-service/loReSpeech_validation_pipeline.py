"""
LoReSpeech Validation Pipeline for Vedda ASR
Implements two-step validation: manual review + automatic verification using TER scoring

Features:
- Reverse transcription for validation
- Token Error Rate (TER) calculation
- Sample quality assessment
- Metadata enrichment
- Validation status tracking
"""

import os
import json
import torch
import librosa
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from jiwer import cer, wer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class SampleMetadata:
    """Enhanced metadata for each training sample"""
    file_id: str
    audio_path: str
    reference_text: str
    predicted_text: str = ""
    speaker_id: str = ""
    speaker_gender: str = ""  # M/F/Unknown
    recording_quality: str = "unknown"  # high/medium/low
    validation_status: str = "pending"  # pending/manual_verified/auto_verified/rejected
    ter_score: float = 0.0  # 0-1, lower is better
    wer_score: float = 0.0
    cer_score: float = 0.0
    duration_seconds: float = 0.0
    noise_level: str = "unknown"  # low/medium/high
    speech_rate: str = "normal"  # slow/normal/fast
    phonetic_complexity: str = "medium"  # simple/medium/complex
    quality_confidence: float = 0.0  # 0-1
    last_reviewed: str = ""
    reviewer_notes: str = ""
    training_weight: float = 1.0  # For weighted training
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Convert to JSON"""
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)


class TERCalculator:
    """Token Error Rate calculation (simplified form of translation error rate)"""
    
    @staticmethod
    def calculate_ter(reference: str, hypothesis: str) -> float:
        """
        Calculate Token Error Rate between reference and hypothesis
        Similar to WER but operates on character-level tokens
        
        Args:
            reference: Reference text (ground truth)
            hypothesis: Hypothesis text (model output)
            
        Returns:
            TER score (0.0 = perfect, 1.0 = completely wrong)
        """
        if not reference or not hypothesis:
            return 1.0 if reference != hypothesis else 0.0
        
        # Use character-level for Vedda (Sinhala script)
        ref_chars = list(reference.strip())
        hyp_chars = list(hypothesis.strip())
        
        if len(ref_chars) == 0:
            return 1.0 if len(hyp_chars) > 0 else 0.0
        
        # Calculate character error rate (similar to TER)
        ter = cer(reference, hypothesis)
        return min(ter, 1.0)
    
    @staticmethod
    def batch_calculate_ter(references: List[str], hypotheses: List[str]) -> List[float]:
        """Calculate TER for multiple sample pairs"""
        return [TERCalculator.calculate_ter(ref, hyp) 
                for ref, hyp in zip(references, hypotheses)]


class QualityAnalyzer:
    """Analyze audio quality metrics"""
    
    @staticmethod
    def analyze_noise_level(audio: np.ndarray, sr: int = 16000) -> str:
        """Estimate noise level from audio"""
        # Simple RMS-based noise detection
        rms = np.sqrt(np.mean(audio ** 2))
        
        # Normalize to 0-1 range
        normalized_rms = min(rms / 0.1, 1.0)
        
        if normalized_rms < 0.2:
            return "low"
        elif normalized_rms < 0.5:
            return "medium"
        else:
            return "high"
    
    @staticmethod
    def analyze_speech_rate(duration: float, text: str) -> str:
        """Estimate speech rate from duration and word count"""
        word_count = len(text.split())
        
        # Estimate words per minute
        wpm = (word_count / max(duration, 0.1)) * 60
        
        if wpm < 80:
            return "slow"
        elif wpm < 150:
            return "normal"
        else:
            return "fast"
    
    @staticmethod
    def assess_quality_confidence(ter_score: float, duration: float, 
                                 noise_level: str = "medium") -> float:
        """
        Calculate quality confidence score (0-1, higher is better)
        
        Factors:
        - TER score (lower better)
        - Duration (avoid too short/long)
        - Noise level (low is better)
        """
        # TER component (40% weight)
        ter_confidence = 1.0 - min(ter_score, 1.0)
        
        # Duration component (30% weight) - prefer 1-5 seconds
        if 1.0 <= duration <= 5.0:
            duration_confidence = 1.0
        elif duration < 1.0:
            duration_confidence = 0.5 + (duration / 2)
        else:
            duration_confidence = max(0.3, 1.0 - (duration - 5) / 10)
        
        # Noise component (30% weight)
        noise_map = {"low": 1.0, "medium": 0.7, "high": 0.4}
        noise_confidence = noise_map.get(noise_level, 0.5)
        
        # Weighted average
        total_confidence = (ter_confidence * 0.4 + 
                          duration_confidence * 0.3 + 
                          noise_confidence * 0.3)
        
        return min(max(total_confidence, 0.0), 1.0)


class VeddaValidationPipeline:
    """Main validation pipeline for Vedda ASR data"""
    
    def __init__(self, model_path: str = None, metadata_file: str = "sample_metadata.json"):
        """
        Initialize validation pipeline
        
        Args:
            model_path: Path to Vedda Whisper model
            metadata_file: File to store/load metadata
        """
        self.model_path = model_path or _resolve_model_path()
        self.metadata_file = metadata_file
        self.metadata_storage: Dict[str, SampleMetadata] = {}
        
        # Initialize model
        self.processor = None
        self.model = None
        self.device = None
        self._load_model()
        
        # Load existing metadata
        self._load_metadata()
    
    def _load_model(self):
        """Load Vedda Whisper model"""
        if not os.path.exists(self.model_path):
            logger.warning(f"Model not found at {self.model_path}, validation will be limited")
            return
        
        try:
            logger.info(f"Loading model from {self.model_path}")
            self.processor = WhisperProcessor.from_pretrained(self.model_path)
            self.model = WhisperForConditionalGeneration.from_pretrained(self.model_path)
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            self.model = self.model.to(self.device)
            self.model.eval()
            logger.info(f"Model loaded successfully on device: {self.device}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = None
    
    def _load_metadata(self):
        """Load metadata from file"""
        if os.path.exists(self.metadata_file):
            try:
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Reconstruct SampleMetadata objects
                    self.metadata_storage = {
                        k: SampleMetadata(**v) for k, v in data.items()
                    }
                logger.info(f"Loaded metadata for {len(self.metadata_storage)} samples")
            except Exception as e:
                logger.error(f"Error loading metadata: {e}")
    
    def _save_metadata(self):
        """Save metadata to file"""
        try:
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                data = {k: v.to_dict() for k, v in self.metadata_storage.items()}
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved metadata for {len(self.metadata_storage)} samples")
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")
    
    def reverse_transcribe(self, audio_path: str) -> str:
        """
        Reverse transcribe audio using current model
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Transcribed text (empty string if error)
        """
        if not self.model or not os.path.exists(audio_path):
            return ""
        
        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=16000, mono=True)
            
            # Generate features
            input_features = self.processor.feature_extractor(
                audio,
                sampling_rate=16000,
                return_tensors="pt"
            ).input_features.to(self.device)
            
            # Transcribe
            with torch.no_grad():
                predicted_ids = self.model.generate(
                    input_features,
                    language='si',
                    task='transcribe',
                    max_new_tokens=100,
                )
            
            text = self.processor.tokenizer.batch_decode(
                predicted_ids, skip_special_tokens=True
            )[0].strip()
            
            return text
        
        except Exception as e:
            logger.error(f"Error transcribing {audio_path}: {e}")
            return ""
    
    def validate_sample(self, audio_path: str, reference_text: str, 
                       file_id: str = None, manual_verified: bool = False) -> SampleMetadata:
        """
        Validate a single audio-transcription sample
        
        Args:
            audio_path: Path to audio file
            reference_text: Ground truth transcription
            file_id: Optional sample identifier
            manual_verified: Whether manually verified by human
            
        Returns:
            SampleMetadata with validation results
        """
        if not file_id:
            file_id = Path(audio_path).stem
        
        # Load audio
        audio, sr = librosa.load(audio_path, sr=16000, mono=True)
        duration = len(audio) / sr
        
        # Reverse transcribe
        predicted_text = self.reverse_transcribe(audio_path)
        
        # Calculate error metrics
        ter_score = TERCalculator.calculate_ter(reference_text, predicted_text)
        wer_score = wer(reference_text, predicted_text)
        cer_score = cer(reference_text, predicted_text)
        
        # Analyze quality
        noise_level = QualityAnalyzer.analyze_noise_level(audio, sr)
        speech_rate = QualityAnalyzer.analyze_speech_rate(duration, reference_text)
        quality_confidence = QualityAnalyzer.assess_quality_confidence(
            ter_score, duration, noise_level
        )
        
        # Determine validation status
        validation_status = "manual_verified" if manual_verified else "auto_verified"
        
        # Create metadata
        metadata = SampleMetadata(
            file_id=file_id,
            audio_path=audio_path,
            reference_text=reference_text,
            predicted_text=predicted_text,
            validation_status=validation_status,
            ter_score=ter_score,
            wer_score=wer_score,
            cer_score=cer_score,
            duration_seconds=duration,
            noise_level=noise_level,
            speech_rate=speech_rate,
            quality_confidence=quality_confidence,
            last_reviewed=datetime.now().isoformat(),
            training_weight=1.0 if quality_confidence > 0.7 else 0.5
        )
        
        # Store metadata
        self.metadata_storage[file_id] = metadata
        
        logger.info(f"Validated {file_id}: TER={ter_score:.3f}, Confidence={quality_confidence:.3f}")
        
        return metadata
    
    def batch_validate(self, samples: List[Tuple[str, str]], 
                      manual_verified: bool = False) -> List[SampleMetadata]:
        """
        Validate multiple samples
        
        Args:
            samples: List of (audio_path, reference_text) tuples
            manual_verified: Whether all samples manually verified
            
        Returns:
            List of SampleMetadata
        """
        results = []
        for i, (audio_path, reference_text) in enumerate(samples):
            logger.info(f"Validating {i+1}/{len(samples)}")
            metadata = self.validate_sample(audio_path, reference_text, manual_verified=manual_verified)
            results.append(metadata)
        
        self._save_metadata()
        return results
    
    def filter_by_ter_threshold(self, ter_threshold: float = 0.3) -> List[SampleMetadata]:
        """
        Filter samples by TER score threshold
        
        Args:
            ter_threshold: Maximum TER score to keep (lower = stricter)
            
        Returns:
            List of samples below threshold
        """
        good_samples = [
            m for m in self.metadata_storage.values()
            if m.ter_score <= ter_threshold
        ]
        
        logger.info(f"Filtered to {len(good_samples)} samples with TER <= {ter_threshold}")
        return good_samples
    
    def get_validation_report(self) -> Dict:
        """Generate validation report"""
        if not self.metadata_storage:
            return {}
        
        samples = list(self.metadata_storage.values())
        
        validation_statuses = {}
        for s in samples:
            status = s.validation_status
            validation_statuses[status] = validation_statuses.get(status, 0) + 1
        
        ter_scores = [s.ter_score for s in samples]
        wer_scores = [s.wer_score for s in samples]
        cer_scores = [s.cer_score for s in samples]
        
        return {
            "total_samples": len(samples),
            "validation_statuses": validation_statuses,
            "ter_stats": {
                "mean": np.mean(ter_scores),
                "median": np.median(ter_scores),
                "std": np.std(ter_scores),
                "min": np.min(ter_scores),
                "max": np.max(ter_scores),
            },
            "wer_stats": {
                "mean": np.mean(wer_scores),
                "median": np.median(wer_scores),
            },
            "cer_stats": {
                "mean": np.mean(cer_scores),
                "median": np.median(cer_scores),
            },
            "quality_confidence_mean": np.mean([s.quality_confidence for s in samples]),
            "timestamp": datetime.now().isoformat()
        }
    
    def export_high_quality_dataset(self, confidence_threshold: float = 0.7) -> Dict:
        """Export high-quality samples for training"""
        high_quality = [
            s for s in self.metadata_storage.values()
            if s.quality_confidence >= confidence_threshold and s.validation_status in ["manual_verified", "auto_verified"]
        ]
        
        logger.info(f"Exported {len(high_quality)} high-quality samples (confidence >= {confidence_threshold})")
        
        # Group by speaker (if available)
        by_speaker = {}
        for s in high_quality:
            speaker = s.speaker_id or "unknown"
            if speaker not in by_speaker:
                by_speaker[speaker] = []
            by_speaker[speaker].append(s)
        
        return {
            "samples": [s.to_dict() for s in high_quality],
            "by_speaker": {k: [s.to_dict() for s in v] for k, v in by_speaker.items()},
            "count": len(high_quality),
            "average_confidence": np.mean([s.quality_confidence for s in high_quality])
        }


def _resolve_model_path():
    """Resolve model path (same as in vedda_asr_service.py)"""
    env = os.environ.get('VEDDA_ASR_MODEL_PATH')
    if env and os.path.exists(env):
        return env
    colab_final = 'vedda-asr-model/models/whisper-vedda-final'
    if os.path.exists(colab_final):
        return colab_final
    v4 = 'vedda-asr-model/models/whisper-frozen-v4/final'
    if os.path.exists(v4):
        return v4
    return 'vedda-asr-model/models/whisper-frozen-v2/final'


if __name__ == '__main__':
    # Example usage
    pipeline = VeddaValidationPipeline()
    
    # Validate a single sample
    result = pipeline.validate_sample(
        audio_path='vedda-asr-model/data/processed/sample.wav',
        reference_text='හොච්ච දික්කා'
    )
    print(f"\nValidation Result:")
    print(result.to_json())
    
    # Generate report
    report = pipeline.get_validation_report()
    print(f"\nValidation Report:")
    print(json.dumps(report, indent=2, ensure_ascii=False))
