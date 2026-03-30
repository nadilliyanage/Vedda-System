#!/usr/bin/env python3
"""
Phase 8: Fine-tune Whisper model on 355 high-quality Vedda samples
Uses quality-weighted training to maximize accuracy improvement
"""

import json
import torch
import logging
from pathlib import Path
from datetime import datetime
import librosa
import numpy as np
from transformers import WhisperProcessor, WhisperForConditionalGeneration, Seq2SeqTrainingArguments, Seq2SeqTrainer
from datasets import Dataset
from dataclasses import dataclass
from typing import Any, Dict, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data collator for handling variable-length sequences
@dataclass
class DataCollatorSpeechSeq2Seq:
    processor: WhisperProcessor

    def __call__(self, features: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Process input features
        input_features_list = []
        for feature in features:
            feat = feature.get("input_features")
            # If it's already a tensor, keep it; if numpy, convert
            if isinstance(feat, torch.Tensor):
                input_features_list.append(feat)
            elif isinstance(feat, np.ndarray):
                input_features_list.append(torch.from_numpy(feat).float())
            elif isinstance(feat, list):
                input_features_list.append(torch.tensor(feat, dtype=torch.float32))
        
        # Pad input features (2D: [n_mels, length])
        max_feature_len = max(f.shape[-1] if len(f.shape) > 1 else f.shape[0] for f in input_features_list)
        padded_input_features = []
        for feat in input_features_list:
            if len(feat.shape) == 1:
                feat = feat.unsqueeze(0)  # Add mel dimension if needed
            if feat.shape[-1] < max_feature_len:
                pad_len = max_feature_len - feat.shape[-1]
                feat = torch.nn.functional.pad(feat, (0, pad_len))
            padded_input_features.append(feat)
        
        input_features = torch.stack(padded_input_features)
        
        # Process labels
        labels_list = []
        for feature in features:
            label = feature.get("labels")
            if isinstance(label, torch.Tensor):
                labels_list.append(label)
            elif isinstance(label, np.ndarray):
                labels_list.append(torch.from_numpy(label).long())
            elif isinstance(label, list):
                labels_list.append(torch.tensor(label, dtype=torch.long))
        
        # Pad labels to same length
        max_label_len = max(len(l) for l in labels_list)
        padded_labels = []
        for label in labels_list:
            if len(label) < max_label_len:
                label = torch.cat([label, torch.full((max_label_len - len(label),), -100, dtype=torch.long)])
            padded_labels.append(label)
        
        labels = torch.stack(padded_labels)
        
        return {
            "input_features": input_features,
            "labels": labels
        }

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("\n" + "="*70)
print("PHASE 8: FINE-TUNING WHISPER MODEL ON 355 SAMPLES")
print("="*70 + "\n")

# Configuration
MODEL_NAME = "openai/whisper-small"
LEARNING_RATE = 1e-5
BATCH_SIZE = 4
EPOCHS = 5
WARMUP_STEPS = 100

print("⚙️  Training Configuration:")
print(f"   Base Model: {MODEL_NAME}")
print(f"   Learning Rate: {LEARNING_RATE}")
print(f"   Batch Size: {BATCH_SIZE}")
print(f"   Epochs: {EPOCHS}")
print(f"   Total Samples: ~355\n")

# Load training data
print("📂 Loading training data...")
with open('phase8_training_data.json', 'r', encoding='utf-8') as f:
    training_data = json.load(f)

samples = training_data['samples']
print(f"   ✓ Loaded {len(samples)} samples")
print(f"   ✓ Average Confidence: {training_data['average_confidence']:.2%}\n")

# Initialize processor and model
print("🔧 Loading Whisper model...")
processor = WhisperProcessor.from_pretrained(MODEL_NAME)
model = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)

device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)
print(f"   ✓ Model loaded on {device.upper()}\n")

# Prepare dataset
print("📊 Preparing dataset for training...")

def prepare_dataset(sample):
    """Load and process audio + text for training"""
    try:
        # Load audio
        audio_path = sample['audio_path']
        if not Path(audio_path).exists():
            return None
            
        audio, sr = librosa.load(audio_path, sr=16000, mono=True)
        
        # Process with Whisper processor
        inputs = processor(
            audio,
            sampling_rate=16000,
            return_tensors="np"
        )
        
        # Tokenize text
        labels = processor.tokenizer(
            sample['text'],
            return_tensors="np"
        ).input_ids
        
        return {
            'input_features': inputs['input_features'].squeeze(0),
            'labels': labels.squeeze(0),
            'text': sample['text'],
        }
    except Exception as e:
        logger.warning(f"Failed to process sample {sample.get('text', 'unknown')}: {e}")
        return None

print("   Processing samples...")
processed_samples = []
for idx, sample in enumerate(samples, 1):
    processed = prepare_dataset(sample)
    if processed:
        processed_samples.append(processed)
    
    if idx % 50 == 0:
        print(f"   ✓ Processed {idx}/{len(samples)} samples ({len(processed_samples)} valid)")

print(f"   ✓ Successfully processed {len(processed_samples)} samples\n")

if len(processed_samples) == 0:
    print("❌ ERROR: No valid samples to train on!")
    exit(1)

# Create Hugging Face dataset from list
dataset = Dataset.from_list(processed_samples)

print(f"📊 Dataset created with {len(dataset)} samples\n")

# Training setup
output_dir = "vedda_whisper_finetuned"
training_args = Seq2SeqTrainingArguments(
    output_dir=output_dir,
    per_device_train_batch_size=BATCH_SIZE,
    learning_rate=LEARNING_RATE,
    num_train_epochs=EPOCHS,
    warmup_steps=WARMUP_STEPS,
    save_strategy="epoch",
    logging_steps=10,
    save_total_limit=2,
)

# Create trainer
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    data_collator=DataCollatorSpeechSeq2Seq(processor),
)

# Train
print("🚀 Starting training...")
start_time = datetime.now()

try:
    trainer.train()
    print("\n✅ Training completed successfully")
except Exception as e:
    print(f"\n❌ Training failed: {e}")
    exit(1)

# Save model
print(f"\n💾 Saving fine-tuned model...")
model.save_pretrained(output_dir)
processor.save_pretrained(output_dir)
print(f"   ✓ Model saved to: {output_dir}")

elapsed = datetime.now() - start_time
print(f"\n⏱️  Training time: {elapsed}")

print("\n" + "="*70)
print("✅ PHASE 8 TRAINING COMPLETE")
print("="*70)
print("\nNext steps:")
print("   1. Evaluate model: python evaluate_model.py")
print("   2. Deploy to production: Update vedda_asr_service.py")
print("   3. Monitor accuracy improvement")
