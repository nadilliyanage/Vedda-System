"""
Step 4: Evaluate Vedda ASR Model

Evaluates the trained model and generates detailed metrics.
"""

import os
import json
import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from datasets import Dataset, Audio
from evaluate import load
from tqdm import tqdm
import time

class VeddaASREvaluator:
    def __init__(self, model_path='models/whisper-vedda/final'):
        self.model_path = model_path
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        print(f"\n🖥️  Using device: {self.device}")
        
        # Load model and processor
        print(f"Loading model from: {model_path}")
        self.processor = WhisperProcessor.from_pretrained(model_path)
        self.model = WhisperForConditionalGeneration.from_pretrained(model_path)
        self.model = self.model.to(self.device)
        self.model.eval()
        
        print(f"✅ Model loaded successfully")
        
        # Load metrics
        self.wer_metric = load("wer")
        self.cer_metric = load("cer")
    
    def transcribe(self, audio_path):
        """Transcribe a single audio file"""
        import librosa
        
        # Load audio
        audio, sr = librosa.load(audio_path, sr=16000, mono=True)
        
        # Process audio
        input_features = self.processor(
            audio,
            sampling_rate=16000,
            return_tensors="pt"
        ).input_features
        
        input_features = input_features.to(self.device)
        
        # Generate transcription
        start_time = time.time()
        
        with torch.no_grad():
            predicted_ids = self.model.generate(input_features)
        
        inference_time = time.time() - start_time
        
        # Decode transcription
        transcription = self.processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True
        )[0]
        
        return transcription, inference_time
    
    def evaluate_dataset(self, test_file='data/test_dataset.json'):
        """Evaluate on test dataset"""
        print(f"\n{'='*60}")
        print(f"📊 EVALUATING VEDDA ASR MODEL")
        print(f"{'='*60}")
        
        # Load test dataset
        with open(test_file, 'r', encoding='utf-8') as f:
            test_data = json.load(f)
        
        test_samples = test_data['data']
        print(f"\n📂 Test samples: {len(test_samples)}")
        
        # Evaluate each sample
        predictions = []
        references = []
        inference_times = []
        errors = 0
        
        print(f"\n⚙️  Running inference...")
        for sample in tqdm(test_samples, desc="Evaluating"):
            try:
                audio_path = sample['audio_path']
                reference = sample['transcription']
                
                # Transcribe
                prediction, inf_time = self.transcribe(audio_path)
                
                predictions.append(prediction)
                references.append(reference)
                inference_times.append(inf_time)
                
            except Exception as e:
                print(f"\n⚠️  Error processing {audio_path}: {e}")
                errors += 1
        
        if len(predictions) == 0:
            print(f"\n❌ No successful predictions!")
            return
        
        # Calculate metrics
        print(f"\n📈 Calculating metrics...")
        
        wer = self.wer_metric.compute(predictions=predictions, references=references)
        cer = self.cer_metric.compute(predictions=predictions, references=references)
        avg_inference_time = sum(inference_times) / len(inference_times)
        
        # Real-time factor (RTF)
        test_audio_duration = sum(sample['duration'] for sample in test_samples[:len(predictions)])
        total_inference_time = sum(inference_times)
        rtf = total_inference_time / test_audio_duration
        
        # Print results
        print(f"\n{'='*60}")
        print(f"✅ EVALUATION RESULTS")
        print(f"{'='*60}")
        print(f"\n📊 Accuracy Metrics:")
        print(f"   Word Error Rate (WER): {wer*100:.2f}%")
        print(f"   Character Error Rate (CER): {cer*100:.2f}%")
        
        # Accuracy rating
        if wer < 0.10:
            accuracy = "🌟 Excellent (Production-ready)"
        elif wer < 0.20:
            accuracy = "✅ Good (Usable for most tasks)"
        elif wer < 0.30:
            accuracy = "⚠️  Fair (Needs more training data)"
        else:
            accuracy = "❌ Poor (Collect more data and retrain)"
        
        print(f"   Accuracy: {accuracy}")
        
        print(f"\n⚡ Performance Metrics:")
        print(f"   Average inference time: {avg_inference_time*1000:.1f}ms")
        print(f"   Real-time factor (RTF): {rtf:.3f}")
        
        if rtf < 0.5:
            perf = "🚀 Very Fast"
        elif rtf < 1.0:
            perf = "✅ Fast (Real-time capable)"
        else:
            perf = "⚠️  Slow (Consider model optimization)"
        
        print(f"   Performance: {perf}")
        
        print(f"\n📝 Dataset Info:")
        print(f"   Samples evaluated: {len(predictions)}")
        print(f"   Errors: {errors}")
        print(f"   Success rate: {len(predictions)/(len(predictions)+errors)*100:.1f}%")
        
        # Show some examples
        print(f"\n📋 Sample Predictions:")
        print(f"{'='*60}")
        for i in range(min(5, len(predictions))):
            ref = references[i]
            pred = predictions[i]
            match = "✓" if ref == pred else "✗"
            
            print(f"\n{i+1}. {match}")
            print(f"   Reference: {ref}")
            print(f"   Predicted: {pred}")
        
        # Save results
        results = {
            'wer': wer,
            'cer': cer,
            'avg_inference_time': avg_inference_time,
            'rtf': rtf,
            'samples_evaluated': len(predictions),
            'errors': errors,
            'predictions': [
                {'reference': ref, 'prediction': pred}
                for ref, pred in zip(references, predictions)
            ]
        }
        
        results_file = os.path.join(os.path.dirname(self.model_path), 'evaluation_results.json')
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Results saved to: {results_file}")
        print(f"{'='*60}\n")
        
        # Recommendations
        print(f"\n💡 Recommendations:")
        if wer < 0.15:
            print(f"   ✅ Model is ready for production deployment!")
            print(f"   Next: python scripts/5_export_model.py")
        elif wer < 0.30:
            print(f"   ⚠️  Model works but could be improved:")
            print(f"   - Collect more diverse Vedda speech data")
            print(f"   - Train for more epochs")
            print(f"   - Use a larger model (small/medium)")
        else:
            print(f"   ❌ Model needs significant improvement:")
            print(f"   - Collect at least 2-3 hours of high-quality data")
            print(f"   - Verify transcription accuracy")
            print(f"   - Check audio quality (noise, volume)")
            print(f"   - Consider data augmentation")
        
        return results


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Evaluate Vedda ASR Model')
    parser.add_argument('--model', type=str, default='models/whisper-vedda/final',
                       help='Path to trained model')
    parser.add_argument('--test_data', type=str, default='data/test_dataset.json',
                       help='Path to test dataset')
    
    args = parser.parse_args()
    
    try:
        evaluator = VeddaASREvaluator(model_path=args.model)
        evaluator.evaluate_dataset(test_file=args.test_data)
        
    except Exception as e:
        print(f"\n❌ Evaluation failed: {e}")
        import traceback
        traceback.print_exc()
