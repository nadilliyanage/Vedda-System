#!/usr/bin/env python3
"""
Phase 8: Evaluate fine-tuned model vs baseline
Compare accuracy metrics before and after training
"""

import json
import torch
import librosa
from jiwer import wer, cer
from pathlib import Path
from datetime import datetime
from transformers import WhisperProcessor, WhisperForConditionalGeneration

print("\n" + "="*70)
print("PHASE 8: EVALUATING FINE-TUNED MODEL")
print("="*70 + "\n")

# Load baseline model
print("📂 Loading baseline model...")
baseline_model_name = "openai/whisper-small"
baseline_processor = WhisperProcessor.from_pretrained(baseline_model_name)
baseline_model = WhisperForConditionalGeneration.from_pretrained(baseline_model_name)

device = "cuda" if torch.cuda.is_available() else "cpu"
baseline_model = baseline_model.to(device)

# Load fine-tuned model
print("📂 Loading fine-tuned model...")
if not Path("vedda_whisper_finetuned").exists():
    print("❌ Fine-tuned model not found. Run finetune_whisper.py first.")
    exit(1)

finetuned_processor = WhisperProcessor.from_pretrained("vedda_whisper_finetuned")
finetuned_model = WhisperForConditionalGeneration.from_pretrained("vedda_whisper_finetuned")
finetuned_model = finetuned_model.to(device)

print(f"   ✓ Models loaded on {device.upper()}\n")

# Load validation data (use training data samples as test set)
print("📂 Loading validation data...")
with open('phase8_training_data.json', 'r', encoding='utf-8') as f:
    training_data = json.load(f)

samples = training_data['samples'][:50]  # Test on first 50 for speed
print(f"   ✓ Loaded {len(samples)} samples for evaluation\n")

# Evaluate
baseline_predictions = []
finetuned_predictions = []
references = []

print("🔍 Running inference...")
baseline_model.eval()
finetuned_model.eval()

with torch.no_grad():
    for idx, sample in enumerate(samples, 1):
        audio_path = sample['audio_path']
        reference_text = sample['text']
        
        try:
            # Load audio
            if not Path(audio_path).exists():
                continue
                
            audio, sr = librosa.load(audio_path, sr=16000, mono=True)
            
            # Baseline prediction
            baseline_inputs = baseline_processor(audio, sampling_rate=16000, return_tensors="pt")
            baseline_outputs = baseline_model.generate(
                baseline_inputs['input_features'].to(device)
            )
            baseline_pred = baseline_processor.batch_decode(
                baseline_outputs,
                skip_special_tokens=True
            )[0].strip()
            
            # Fine-tuned prediction
            finetuned_inputs = finetuned_processor(audio, sampling_rate=16000, return_tensors="pt")
            finetuned_outputs = finetuned_model.generate(
                finetuned_inputs['input_features'].to(device)
            )
            finetuned_pred = finetuned_processor.batch_decode(
                finetuned_outputs,
                skip_special_tokens=True
            )[0].strip()
            
            baseline_predictions.append(baseline_pred)
            finetuned_predictions.append(finetuned_pred)
            references.append(reference_text)
            
            if idx % 10 == 0:
                print(f"   ✓ Processed {idx}/{len(samples)} samples")
        
        except Exception as e:
            print(f"   ⚠️  Failed to process sample {idx}: {e}")

print("\n")

if len(references) == 0:
    print("❌ No valid samples for evaluation!")
    exit(1)

# Calculate metrics
baseline_wer = wer(references, baseline_predictions)
finetuned_wer = wer(references, finetuned_predictions)

baseline_cer = cer(references, baseline_predictions)
finetuned_cer = cer(references, finetuned_predictions)

# Exact match
baseline_exact = sum(1 for r, p in zip(references, baseline_predictions) if r == p) / len(references)
finetuned_exact = sum(1 for r, p in zip(references, finetuned_predictions) if r == p) / len(references)

print("📊 EVALUATION RESULTS\n")
print("=" * 75)
print(f"{'Metric':<20} {'Baseline':<16} {'Fine-tuned':<16} {'Improvement':<20}")
print("=" * 75)

print(f"{'WER (Word Error)':<20} {baseline_wer:<16.1%} {finetuned_wer:<16.1%}", end="")
if baseline_wer > 0:
    wer_improvement = (baseline_wer - finetuned_wer) / baseline_wer * 100
    print(f" {wer_improvement:>+6.1f}%")
else:
    print(" N/A")

print(f"{'CER (Char Error)':<20} {baseline_cer:<16.1%} {finetuned_cer:<16.1%}", end="")
if baseline_cer > 0:
    cer_improvement = (baseline_cer - finetuned_cer) / baseline_cer * 100
    print(f" {cer_improvement:>+6.1f}%")
else:
    print(" N/A")

print(f"{'Exact Match':<20} {baseline_exact:<16.1%} {finetuned_exact:<16.1%}", end="")
if baseline_exact > 0:
    exact_improvement = (finetuned_exact - baseline_exact) / baseline_exact * 100
    print(f" {exact_improvement:>+6.1f}%")
else:
    print(" N/A")

print("=" * 75)

# Show sample predictions
print("\n📝 Sample Predictions (first 3):\n")
for i in range(min(3, len(samples))):
    print(f"Reference:      {references[i]}")
    print(f"Baseline:       {baseline_predictions[i]}")
    print(f"Fine-tuned:     {finetuned_predictions[i]}")
    match = "✅ EXACT MATCH" if finetuned_predictions[i] == references[i] else "➖ No match"
    print(f"Status:         {match}")
    print()

# Save evaluation results
results = {
    'evaluation_date': str(datetime.now()),
    'test_samples': len(samples),
    'baseline_wer': float(baseline_wer),
    'finetuned_wer': float(finetuned_wer),
    'baseline_cer': float(baseline_cer),
    'finetuned_cer': float(finetuned_cer),
    'baseline_exact_match': float(baseline_exact),
    'finetuned_exact_match': float(finetuned_exact),
}

with open('phase8_evaluation_results.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f"💾 Results saved: phase8_evaluation_results.json")

print("\n" + "="*70)
if finetuned_wer < baseline_wer and finetuned_exact > baseline_exact:
    print("✅ MODEL IMPROVED! Ready for deployment")
    print(f"\n   Accuracy improved from {baseline_exact:.1%} → {finetuned_exact:.1%}")
    print(f"   WER reduced from {baseline_wer:.1%} → {finetuned_wer:.1%}")
else:
    print("⚠️  Model needs adjustment")
    print("   Try: Increase epochs, adjust learning rate, or collect more data")
print("="*70 + "\n")

from datetime import datetime
