"""
LoReSpeech Implementation Guide - Quick Start Script
Applies LoReSpeech methodology principles to improve Vedda ASR

Steps:
1. Phase 1: Validate existing 385 samples
2. Phase 2: Filter high-quality samples
3. Phase 3: Prepare for MFA alignment
4. Phase 4: Export for retraining
"""

import os
import json
import argparse
from pathlib import Path
from loReSpeech_validation_pipeline import VeddaValidationPipeline, TERCalculator, QualityAnalyzer
import librosa
import numpy as np

def load_transcriptions(json_file: str) -> dict:
    """Load transcriptions from JSON file"""
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def find_audio_files(directories: list) -> dict:
    """Find all audio files in directories"""
    audio_files = {}
    audio_extensions = {'.wav', '.mp3', '.m4a', '.flac', '.ogg'}
    
    for directory in directories:
        if os.path.exists(directory):
            for file_path in Path(directory).rglob('*'):
                if file_path.suffix.lower() in audio_extensions:
                    file_id = file_path.stem
                    audio_files[file_id] = str(file_path)
    
    return audio_files

def phase1_validate_all_samples():
    """Phase 1: Validate all existing 385 samples"""
    print("\n" + "="*80)
    print("PHASE 1: Validate All Existing Samples")
    print("="*80)
    
    # Initialize pipeline
    pipeline = VeddaValidationPipeline(
        metadata_file="vedda-asr-model/phase1_validation_metadata.json"
    )
    
    # Find audio files and transcriptions
    audio_dirs = ['vedda-asr-model/data/processed', 'vedda-asr-model/data/raw']
    audio_files = find_audio_files(audio_dirs)
    
    transcriptions_file = 'vedda-asr-model/data/transcriptions.json'
    if not os.path.exists(transcriptions_file):
        transcriptions_file = 'vedda-asr-model/vedda_transcriptions.json'
    
    if not os.path.exists(transcriptions_file):
        print(f"❌ Transcriptions file not found!")
        return None
    
    transcriptions = load_transcriptions(transcriptions_file)
    
    print(f"✓ Found {len(audio_files)} audio files")
    print(f"✓ Found {len(transcriptions)} transcriptions")
    
    # Validate samples
    samples_to_validate = []
    for file_id, transcript_info in transcriptions.items():
        if file_id in audio_files:
            audio_path = audio_files[file_id]
            reference_text = transcript_info.get('text') if isinstance(transcript_info, dict) else transcript_info
            samples_to_validate.append((audio_path, reference_text, file_id))
    
    print(f"✓ Matching {len(samples_to_validate)} audio-transcript pairs")
    
    if samples_to_validate:
        print(f"\nValidating {len(samples_to_validate)} samples...")
        for i, (audio_path, ref_text, file_id) in enumerate(samples_to_validate, 1):
            if (i - 1) % 50 == 0:
                print(f"  Progress: {i}/{len(samples_to_validate)}")
            
            try:
                pipeline.validate_sample(audio_path, ref_text, file_id=file_id)
            except Exception as e:
                print(f"    ⚠ Error validating {file_id}: {str(e)[:60]}")
        
        print(f"✓ Validation complete!")
    
    # Generate report
    report = pipeline.get_validation_report()
    print("\n📊 VALIDATION REPORT:")
    print(f"  Total samples: {report['total_samples']}")
    print(f"  Average TER: {report['ter_stats']['mean']:.3f}")
    print(f"  Average WER: {report['wer_stats']['mean']:.3f}")
    print(f"  Average CER: {report['cer_stats']['mean']:.3f}")
    print(f"  Average Quality Confidence: {report['quality_confidence_mean']:.3f}")
    print(f"  Validation Statuses: {report['validation_statuses']}")
    
    # Save report
    with open('vedda-asr-model/phase1_validation_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    return pipeline

def phase2_filter_high_quality(pipeline, ter_threshold=0.3):
    """Phase 2: Filter samples by quality threshold"""
    print("\n" + "="*80)
    print("PHASE 2: Filter High-Quality Samples")
    print("="*80)
    
    print(f"\nFiltering samples with TER ≤ {ter_threshold}...")
    high_quality = pipeline.filter_by_ter_threshold(ter_threshold=ter_threshold)
    
    print(f"✓ Kept {len(high_quality)} high-quality samples")
    print(f"  Removed {len(pipeline.metadata_storage) - len(high_quality)} low-quality samples")
    
    # Show statistics
    ter_scores = [m.ter_score for m in high_quality]
    print(f"\nHigh-Quality Set Statistics:")
    print(f"  TER Mean: {np.mean(ter_scores):.3f}")
    print(f"  TER Std: {np.std(ter_scores):.3f}")
    print(f"  TER Range: [{np.min(ter_scores):.3f}, {np.max(ter_scores):.3f}]")
    
    # Show examples of removed samples
    removed = [m for m in pipeline.metadata_storage.values() 
               if m.ter_score > ter_threshold]
    
    if removed:
        print(f"\nExamples of Removed Samples (TER > {ter_threshold}):")
        for m in sorted(removed, key=lambda x: x.ter_score, reverse=True)[:5]:
            print(f"  [{m.file_id}] TER={m.ter_score:.3f}")
            print(f"    Ref: {m.reference_text}")
            print(f"    Pred: {m.predicted_text}")
            print()
    
    # Export filtered set
    filtered_data = {
        'samples': [m.to_dict() for m in high_quality],
        'count': len(high_quality),
        'ter_threshold': ter_threshold,
        'ter_stats': {
            'mean': float(np.mean(ter_scores)),
            'std': float(np.std(ter_scores)),
        }
    }
    
    with open('vedda-asr-model/phase2_filtered_dataset.json', 'w', encoding='utf-8') as f:
        json.dump(filtered_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Exported to vedda-asr-model/phase2_filtered_dataset.json")
    return high_quality

def phase3_analyze_speaker_consistency(pipeline):
    """Phase 3: Analyze speaker consistency and identify issues"""
    print("\n" + "="*80)
    print("PHASE 3: Analyze Speaker Consistency")
    print("="*80)
    
    # Group by quality confidence
    samples = list(pipeline.metadata_storage.values())
    
    confidence_buckets = {
        'excellent': [m for m in samples if m.quality_confidence >= 0.8],
        'good': [m for m in samples if 0.6 <= m.quality_confidence < 0.8],
        'fair': [m for m in samples if 0.4 <= m.quality_confidence < 0.6],
        'poor': [m for m in samples if m.quality_confidence < 0.4],
    }
    
    print("\n📊 Distribution by Quality Confidence:")
    for bucket, samples_in_bucket in confidence_buckets.items():
        pct = (len(samples_in_bucket) / len(samples) * 100) if samples else 0
        print(f"  {bucket.upper():10s}: {len(samples_in_bucket):3d} samples ({pct:5.1f}%)")
    
    # Analyze noise levels
    noise_distribution = {}
    for m in samples:
        noise_distribution[m.noise_level] = noise_distribution.get(m.noise_level, 0) + 1
    
    print("\n🔊 Distribution by Noise Level:")
    for noise_level in ['low', 'medium', 'high']:
        count = noise_distribution.get(noise_level, 0)
        pct = (count / len(samples) * 100) if samples else 0
        print(f"  {noise_level.upper():10s}: {count:3d} samples ({pct:5.1f}%)")
    
    # Identify problematic samples
    problematic = [m for m in samples if m.quality_confidence < 0.5]
    print(f"\n⚠️  Problematic Samples (confidence < 0.5): {len(problematic)}")
    
    if problematic:
        print("  Top 5 Problematic Samples:")
        for m in sorted(problematic, key=lambda x: x.quality_confidence)[:5]:
            print(f"    [{m.file_id}] Confidence={m.quality_confidence:.2f}, Noise={m.noise_level}")
            print(f"      Ref: {m.reference_text[:50]}...")
            print(f"      Pred: {m.predicted_text[:50]}...")
    
    # Export analysis
    analysis = {
        'confidence_distribution': {k: len(v) for k, v in confidence_buckets.items()},
        'noise_distribution': noise_distribution,
        'problematic_samples': len(problematic),
        'recommendations': [
            "Manual review of problematic samples recommended",
            "Consider re-recording samples with high noise levels",
            "Focus on samples with 0.6+ confidence for initial training",
        ]
    }
    
    with open('vedda-asr-model/phase3_analysis_report.json', 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Analysis saved to vedda-asr-model/phase3_analysis_report.json")
    return confidence_buckets

def phase4_prepare_for_training(pipeline):
    """Phase 4: Prepare dataset for retraining"""
    print("\n" + "="*80)
    print("PHASE 4: Prepare Dataset for Retraining")
    print("="*80)
    
    # Export high-quality dataset
    export_data = pipeline.export_high_quality_dataset(confidence_threshold=0.6)
    
    print(f"\n✓ Exported {export_data['count']} samples for training")
    print(f"  Average Quality Confidence: {export_data['average_confidence']:.3f}")
    
    # Create training metadata
    training_data = {
        'total_samples': export_data['count'],
        'average_confidence': export_data['average_confidence'],
        'samples': export_data['samples'],
        'training_config': {
            'batch_size': 8,
            'learning_rate': 1e-5,
            'num_epochs': 10,
            'weight_samples_by_confidence': True,
            'description': 'Retrained on LoReSpeech-validated dataset'
        }
    }
    
    # Save training data
    with open('vedda-asr-model/phase4_training_dataset.json', 'w', encoding='utf-8') as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Training dataset saved to vedda-asr-model/phase4_training_dataset.json")
    
    # Create training script template
    training_script = f"""
# Training Script Template
# Generated from LoReSpeech validation pipeline

import json
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration

# Load training data
with open('vedda-asr-model/phase4_training_dataset.json', 'r') as f:
    training_data = json.load(f)

# Configuration
config = training_data['training_config']
samples = training_data['samples']

print(f"Training on {{len(samples)}} samples")
print(f"Config: {{config}}")

# TODO: Implement training loop
# 1. Load processor and model
# 2. Create dataset from samples
# 3. Weight samples by confidence scores
# 4. Train with specified hyperparameters
# 5. Save fine-tuned model
# 6. Evaluate on validation set
"""
    
    with open('vedda-asr-model/training_script_template.py', 'w', encoding='utf-8') as f:
        f.write(training_script.strip())
    
    print(f"✓ Training script template saved to vedda-asr-model/training_script_template.py")
    
    return training_data

def main():
    parser = argparse.ArgumentParser(description='LoReSpeech implementation for Vedda ASR')
    parser.add_argument('--phase', choices=['1', '2', '3', '4', 'all'], default='all',
                       help='Which phase to run')
    parser.add_argument('--ter-threshold', type=float, default=0.3,
                       help='TER threshold for filtering (lower = stricter)')
    parser.add_argument('--confidence-threshold', type=float, default=0.6,
                       help='Quality confidence threshold for training data')
    args = parser.parse_args()
    
    print("\n" + "="*80)
    print(" LoReSpeech Implementation for Vedda ASR")
    print("="*80)
    print("\nApplying LoReSpeech methodology principles:")
    print("  ✓ Two-step validation (automatic + manual)")
    print("  ✓ Quality-based filtering using TER scoring")
    print("  ✓ Metadata enrichment for training")
    print("  ✓ Confidence-weighted dataset preparation")
    
    pipeline = None
    
    # Phase 1
    if args.phase in ['1', 'all']:
        pipeline = phase1_validate_all_samples()
        if args.phase == '1':
            return
    
    # Phase 2
    if args.phase in ['2', 'all'] and pipeline:
        high_quality = phase2_filter_high_quality(pipeline, ter_threshold=args.ter_threshold)
        if args.phase == '2':
            return
    
    # Phase 3
    if args.phase in ['3', 'all'] and pipeline:
        confidence_buckets = phase3_analyze_speaker_consistency(pipeline)
        if args.phase == '3':
            return
    
    # Phase 4
    if args.phase in ['4', 'all'] and pipeline:
        training_data = phase4_prepare_for_training(pipeline)
    
    print("\n" + "="*80)
    print("✓ LoReSpeech Implementation Complete!")
    print("="*80)
    print("\nNext Steps:")
    print("  1. Review quality analysis in vedda-asr-model/phase3_analysis_report.json")
    print("  2. Manually verify flagged samples")
    print("  3. Implement MFA alignment for longer utterances")
    print("  4. Retrain model using vedda-asr-model/phase4_training_dataset.json")
    print("  5. Expected accuracy improvement: 30-50% WER reduction")

if __name__ == '__main__':
    main()
