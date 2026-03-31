#!/usr/bin/env python3
"""
Test fine-tuned Whisper model on all 355 training samples
Comprehensive evaluation with detailed metrics and per-sample results
"""

import json
import torch
import librosa
from jiwer import wer, cer
from pathlib import Path
from datetime import datetime
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from tqdm import tqdm

print("\n" + "="*70)
print("COMPREHENSIVE ASR EVALUATION: ALL 355 SAMPLES")
print("="*70 + "\n")

# Load fine-tuned model
print("🔧 Loading fine-tuned model...")
finetuned_processor = WhisperProcessor.from_pretrained("vedda_whisper_finetuned")
finetuned_model = WhisperForConditionalGeneration.from_pretrained("vedda_whisper_finetuned")

device = "cuda" if torch.cuda.is_available() else "cpu"
finetuned_model = finetuned_model.to(device)
finetuned_model.eval()
print(f"   ✓ Model loaded on {device.upper()}\n")

# Load all 355 training samples
print("📂 Loading all 355 training samples...")
with open('phase8_training_data.json', 'r', encoding='utf-8') as f:
    training_data = json.load(f)

samples = training_data['samples']
print(f"   ✓ Loaded {len(samples)} samples\n")

# Run inference on all samples
print("🔍 Running inference on all 355 samples...")
print("   (This may take 10-15 minutes on CPU)\n")

predictions = []
references = []
sample_results = []

with torch.no_grad():
    for idx, sample in enumerate(tqdm(samples, desc="Processing"), 1):
        audio_path = sample['audio_path']
        reference_text = sample['text']
        
        try:
            # Load audio
            if not Path(audio_path).exists():
                sample_results.append({
                    'index': idx,
                    'file': Path(audio_path).name,
                    'reference': reference_text,
                    'prediction': 'ERROR: Audio not found',
                    'wer': 1.0,
                    'cer': 1.0,
                    'exact_match': False
                })
                continue
            
            audio, sr = librosa.load(audio_path, sr=16000, mono=True)
            
            # Generate prediction
            inputs = finetuned_processor(audio, sampling_rate=16000, return_tensors="pt")
            outputs = finetuned_model.generate(
                inputs['input_features'].to(device),
                language='si',
                task='transcribe'
            )
            prediction = finetuned_processor.batch_decode(outputs, skip_special_tokens=True)[0].strip()
            
            # Calculate metrics
            sample_wer = wer([reference_text], [prediction])
            sample_cer = cer([reference_text], [prediction])
            exact_match = (reference_text == prediction)
            
            predictions.append(prediction)
            references.append(reference_text)
            
            sample_results.append({
                'index': idx,
                'file': Path(audio_path).name,
                'reference': reference_text,
                'prediction': prediction,
                'wer': float(sample_wer),
                'cer': float(sample_cer),
                'exact_match': exact_match
            })
        
        except Exception as e:
            sample_results.append({
                'index': idx,
                'file': Path(audio_path).name if 'audio_path' in locals() else 'unknown',
                'reference': reference_text if 'reference_text' in locals() else 'unknown',
                'prediction': f"ERROR: {str(e)}",
                'wer': 1.0,
                'cer': 1.0,
                'exact_match': False
            })

print("\n")

# Calculate overall metrics
if len(predictions) > 0:
    overall_wer = wer(references, predictions)
    overall_cer = cer(references, predictions)
    exact_match_count = sum(1 for r, p in zip(references, predictions) if r == p)
    exact_match_rate = exact_match_count / len(references)
else:
    overall_wer = overall_cer = exact_match_rate = 0

# Print results summary
print("📊 OVERALL RESULTS (ALL 355 SAMPLES)\n")
print("="*70)
print(f"Total Samples Tested:    {len(sample_results)}")
print(f"Samples Processed:       {len(predictions)}")
print(f"Exact Matches:           {exact_match_count}/{len(references)} ({exact_match_rate:.1%})")
print("="*70)
print(f"Overall WER:             {overall_wer:.1%}")
print(f"Overall CER:             {overall_cer:.1%}")
print("="*70 + "\n")

# Show distribution
exact_matches = sum(1 for r in sample_results if r.get('exact_match', False))
high_accuracy = sum(1 for r in sample_results if r.get('cer', 1.0) < 0.1)
medium_accuracy = sum(1 for r in sample_results if 0.1 <= r.get('cer', 1.0) < 0.3)
low_accuracy = sum(1 for r in sample_results if r.get('cer', 1.0) >= 0.3)

print("📈 ACCURACY DISTRIBUTION\n")
print(f"✅ Exact Match (CER=0%):           {exact_matches} samples ({exact_matches/len(sample_results):.1%})")
print(f"🟢 High Accuracy (CER<10%):       {high_accuracy} samples ({high_accuracy/len(sample_results):.1%})")
print(f"🟡 Medium Accuracy (CER 10-30%):  {medium_accuracy} samples ({medium_accuracy/len(sample_results):.1%})")
print(f"🔴 Low Accuracy (CER≥30%):        {low_accuracy} samples ({low_accuracy/len(sample_results):.1%})")
print()

# Show sample results (first 10 and last 5)
print("📝 SAMPLE PREDICTIONS (First 10 samples)\n")
print("-"*70)
for result in sample_results[:10]:
    print(f"\n[Sample {result['index']}] {result['file']}")
    print(f"  Reference:  {result['reference']}")
    print(f"  Prediction: {result['prediction']}")
    status = "✅ EXACT" if result['exact_match'] else f"CER: {result['cer']:.1%}"
    print(f"  Status:     {status}")

print("\n" + "-"*70)
print("📝 SAMPLE PREDICTIONS (Last 5 samples)\n")
print("-"*70)
for result in sample_results[-5:]:
    print(f"\n[Sample {result['index']}] {result['file']}")
    print(f"  Reference:  {result['reference']}")
    print(f"  Prediction: {result['prediction']}")
    status = "✅ EXACT" if result['exact_match'] else f"CER: {result['cer']:.1%}"
    print(f"  Status:     {status}")

# Save detailed results
output_file = 'test_all_355_results.json'
results_summary = {
    'test_date': str(datetime.now()),
    'total_samples': len(sample_results),
    'samples_processed': len(predictions),
    'overall_wer': float(overall_wer),
    'overall_cer': float(overall_cer),
    'exact_match_rate': float(exact_match_rate),
    'exact_match_count': exact_match_count,
    'accuracy_distribution': {
        'exact_match': exact_matches,
        'high_accuracy': high_accuracy,
        'medium_accuracy': medium_accuracy,
        'low_accuracy': low_accuracy
    },
    'sample_results': sample_results
}

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(results_summary, f, indent=2, ensure_ascii=False)

print("\n" + "="*70)
print(f"💾 Detailed results saved: {output_file}")
print("="*70 + "\n")

# Comparison with evaluation set
print("📊 COMPARISON: Full Dataset vs Evaluation Set\n")
print("="*70)
print(f"{'Metric':<20} {'Eval Set (50)':<20} {'Full Set (355)':<20}")
print("="*70)
print(f"{'Exact Match':<20} {0.68:<20.1%} {exact_match_rate:<20.1%}")
print(f"{'WER':<20} {0.152:<20.1%} {overall_wer:<20.1%}")
print(f"{'CER':<20} {0.031:<20.1%} {overall_cer:<20.1%}")
print("="*70 + "\n")

# Final status
if exact_match_rate >= 0.60:
    status = "🟢 EXCELLENT"
elif exact_match_rate >= 0.40:
    status = "🟡 GOOD"
else:
    status = "🔴 NEEDS IMPROVEMENT"

print("✅ TESTING COMPLETE\n")
print(f"Status: {status}")
print(f"Accuracy on 355 training samples: {exact_match_rate:.1%}")
print(f"Model is ready for {'production deployment ✅' if exact_match_rate >= 0.60 else 'further optimization'}")
