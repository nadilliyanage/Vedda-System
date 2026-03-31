#!/usr/bin/env python3
"""
Phase 8: Prepare training data for model retraining
Converts phase4_training_dataset.json → Hugging Face dataset format
"""

import json
import os
from pathlib import Path

print("\n" + "="*70)
print("PHASE 8: PREPARING TRAINING DATA")
print("="*70 + "\n")

# Load training dataset
base_path = Path("vedda-asr-model")
training_data_path = base_path / "phase4_training_dataset.json"

if not training_data_path.exists():
    print(f"❌ ERROR: {training_data_path} not found")
    exit(1)

with open(training_data_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

samples = data['samples']
print(f"📊 Loading {len(samples)} samples from training dataset...\n")

# Prepare dataset
training_samples = []
for idx, sample in enumerate(samples, 1):
    audio_path = sample.get('audio_path')
    reference_text = sample.get('reference_text')
    confidence = sample.get('quality_confidence', 0.8)
    
    # Audio path already has full relative path, no need to modify
    if not Path(audio_path).exists():
        print(f"⚠️  Skipping sample {idx}: Audio not found - {audio_path}")
        continue
    
    sample_dict = {
        'audio_path': audio_path,
        'text': reference_text,
        'confidence': confidence,
        'training_weight': min(1.0, confidence)  # Weight by confidence
    }
    training_samples.append(sample_dict)
    
    if idx % 50 == 0:
        print(f"   ✓ Prepared {idx}/{len(samples)} samples")
    elif len(training_samples) > 0 and len(training_samples) % 50 == 0:
        print(f"   ✓ Prepared {len(training_samples)} valid samples")

print(f"\n✅ Prepared {len(training_samples)} training samples\n")

# Save training data
training_data = {
    'total_samples': len(training_samples),
    'average_confidence': data['average_confidence'],
    'samples': training_samples
}

output_file = 'phase8_training_data.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(training_data, f, indent=2, ensure_ascii=False)

file_size = os.path.getsize(output_file) / (1024*1024)
print(f"💾 Training data saved: {output_file}")
print(f"   Size: {file_size:.1f} MB")
print(f"   Samples: {len(training_samples)}")
print(f"   Avg Confidence: {data['average_confidence']:.2%}")

print("\n" + "="*70)
print("✅ PHASE 8 STEP 1 COMPLETE - Ready for model retraining")
print("="*70 + "\n")

print("📌 Next step: Train model")
print("   python finetune_whisper.py")
