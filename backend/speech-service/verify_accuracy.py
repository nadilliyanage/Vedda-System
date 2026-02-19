"""
Verify Vedda ASR Model Accuracy
Compares predicted transcriptions against reference transcriptions.json
Calculates WER (Word Error Rate) and CER (Character Error Rate)
"""

import json
import os
import sys
from collections import defaultdict
from datetime import datetime
import re

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

class VeddaAccuracyVerifier:
    def __init__(self):
        self.reference_file = 'vedda-asr-model/data/transcriptions.json'
        self.test_results_file = 'test_results.json'
        self.references = {}
        self.predictions = {}
        self.accuracy_results = []
        self.stats = {
            'total_files': 0,
            'exact_match': 0,
            'partial_match': 0,
            'no_match': 0,
            'total_wer': 0.0,
            'total_cer': 0.0,
            'avg_wer': 0.0,
            'avg_cer': 0.0
        }
    
    def load_references(self):
        """Load reference transcriptions"""
        if not os.path.exists(self.reference_file):
            print(f"❌ Reference file not found: {self.reference_file}")
            return False
        
        try:
            with open(self.reference_file, 'r', encoding='utf-8') as f:
                self.references = json.load(f)
            print(f"✅ Loaded {len(self.references)} reference transcriptions")
            return True
        except Exception as e:
            print(f"❌ Error loading references: {e}")
            return False
    
    def load_predictions(self):
        """Load predicted transcriptions from test results"""
        if not os.path.exists(self.test_results_file):
            print(f"❌ Test results file not found: {self.test_results_file}")
            return False
        
        try:
            with open(self.test_results_file, 'r', encoding='utf-8') as f:
                test_data = json.load(f)
            
            # Extract predictions from test results
            for result in test_data.get('results', []):
                if result['status'] == 'success':
                    # Extract file ID from filename
                    filename = result['file']
                    # vedda_001_20260211_091413_d1dd712e.wav -> vedda_001_20260211_091413_d1dd712e
                    file_id = filename.replace('.wav', '').replace('.mp3', '')
                    self.predictions[file_id] = result.get('transcription', '')
            
            print(f"✅ Loaded {len(self.predictions)} predictions")
            return True
        except Exception as e:
            print(f"❌ Error loading predictions: {e}")
            return False
    
    def calculate_wer(self, reference, prediction):
        """Calculate Word Error Rate"""
        ref_words = reference.split()
        pred_words = prediction.split()
        
        # Simple WER: count different words
        if len(ref_words) == 0 and len(pred_words) == 0:
            return 0.0
        if len(ref_words) == 0:
            return 1.0
        
        # Levenshtein-like distance for word sequences
        differences = 0
        max_len = max(len(ref_words), len(pred_words))
        
        for i in range(max_len):
            ref_word = ref_words[i] if i < len(ref_words) else ""
            pred_word = pred_words[i] if i < len(pred_words) else ""
            
            if ref_word != pred_word:
                differences += 1
        
        wer = differences / max_len if max_len > 0 else 0.0
        return min(wer, 1.0)
    
    def calculate_cer(self, reference, prediction):
        """Calculate Character Error Rate"""
        if len(reference) == 0 and len(prediction) == 0:
            return 0.0
        if len(reference) == 0:
            return 1.0
        
        # Simple edit distance
        differences = 0
        for i in range(max(len(reference), len(prediction))):
            ref_char = reference[i] if i < len(reference) else ""
            pred_char = prediction[i] if i < len(prediction) else ""
            
            if ref_char != pred_char:
                differences += 1
        
        cer = differences / len(reference) if len(reference) > 0 else 0.0
        return min(cer, 1.0)
    
    def verify_accuracy(self):
        """Compare predictions with references"""
        print(f"\n{'='*80}")
        print(f"🔍 VERIFYING VEDDA ASR MODEL ACCURACY")
        print(f"{'='*80}\n")
        
        matched_keys = []
        
        # Find matching reference/prediction pairs
        for ref_key, ref_text in self.references.items():
            # Try to find matching prediction by ID
            # ref_key format: "vedda_001_20260211_091413_d1dd712e"
            # pred_key format: same
            
            if ref_key in self.predictions:
                pred_text = self.predictions[ref_key]
                matched_keys.append(ref_key)
                
                # Calculate metrics
                wer = self.calculate_wer(ref_text, pred_text)
                cer = self.calculate_cer(ref_text, pred_text)
                
                # Determine match type
                if ref_text == pred_text:
                    match_type = "✅ EXACT"
                    self.stats['exact_match'] += 1
                elif self._similarity(ref_text, pred_text) > 0.7:
                    match_type = "⚠️  PARTIAL"
                    self.stats['partial_match'] += 1
                else:
                    match_type = "❌ WRONG"
                    self.stats['no_match'] += 1
                
                result = {
                    'file_id': ref_key,
                    'reference': ref_text,
                    'prediction': pred_text,
                    'match_type': match_type,
                    'wer': wer,
                    'cer': cer
                }
                self.accuracy_results.append(result)
                self.stats['total_wer'] += wer
                self.stats['total_cer'] += cer
        
        self.stats['total_files'] = len(self.accuracy_results)
        
        if self.stats['total_files'] > 0:
            self.stats['avg_wer'] = self.stats['total_wer'] / self.stats['total_files']
            self.stats['avg_cer'] = self.stats['total_cer'] / self.stats['total_files']
        
        print(f"Matched: {len(self.accuracy_results)} files\n")
    
    def _similarity(self, text1, text2):
        """Simple string similarity (0-1)"""
        if not text1 or not text2:
            return 0.0
        
        common = sum(1 for c in text1 if c in text2)
        total = max(len(text1), len(text2))
        return common / total if total > 0 else 0.0
    
    def print_summary(self):
        """Print accuracy summary"""
        print(f"\n{'='*80}")
        print(f"📊 ACCURACY SUMMARY")
        print(f"{'='*80}\n")
        
        total = self.stats['total_files']
        exact = self.stats['exact_match']
        partial = self.stats['partial_match']
        wrong = self.stats['no_match']
        
        print(f"Results Overview:")
        print(f"  Total Files Tested:  {total}")
        print(f"  Exact Matches:       {exact:3d} ({exact/total*100:5.1f}%) ✅")
        print(f"  Partial Matches:     {partial:3d} ({partial/total*100:5.1f}%) ⚠️")
        print(f"  No Matches:          {wrong:3d} ({wrong/total*100:5.1f}%) ❌")
        
        print(f"\nError Metrics:")
        print(f"  Average WER:         {self.stats['avg_wer']*100:6.2f}%")
        print(f"  Average CER:         {self.stats['avg_cer']*100:6.2f}%")
        
        # Quality assessment
        print(f"\n📈 Quality Assessment:")
        wer = self.stats['avg_wer']
        if exact / total > 0.8:
            print(f"  Status: ✅ EXCELLENT (Most predictions are correct)")
        elif exact / total > 0.5:
            print(f"  Status: ⚠️  ACCEPTABLE (Majority correct, some errors)")
        elif exact / total > 0.2:
            print(f"  Status: ⚠️  POOR (Many errors, model needs improvement)")
        else:
            print(f"  Status: ❌ VERY POOR (Model is not trained properly)")
        
        print(f"\n🎯 Recommendations:")
        if exact / total > 0.8:
            print(f"  ✓ Model is production-ready!")
        elif exact / total > 0.5:
            print(f"  • Collect more training data (1-2 hours minimum)")
            print(f"  • Train for more epochs (20-30)")
            print(f"  • Verify training data quality")
        else:
            print(f"  ❌ Model requires retraining:")
            print(f"  • Check if training was completed successfully")
            print(f"  • Verify training data is correct Vedda language")
            print(f"  • Collect at least 30 minutes - 1 hour of Vedda audio")
            print(f"  • Run: python scripts/3_train_whisper.py --epochs 30")
        
        print(f"\n{'='*80}\n")
    
    def print_sample_results(self, num_samples=20):
        """Print sample results"""
        print(f"\n{'='*80}")
        print(f"📋 SAMPLE RESULTS (First {num_samples} files)")
        print(f"{'='*80}\n")
        
        for i, result in enumerate(self.accuracy_results[:num_samples], 1):
            print(f"{i:2d}. [{result['match_type']}]")
            print(f"    Reference: {result['reference'][:70]}")
            print(f"    Predicted: {result['prediction'][:70]}")
            print(f"    WER: {result['wer']*100:5.1f}% | CER: {result['cer']*100:5.1f}%")
            print()
    
    def print_wrong_examples(self, num_examples=10):
        """Print examples of wrong predictions"""
        wrong = [r for r in self.accuracy_results if '❌' in r['match_type']]
        
        if not wrong:
            print(f"\n✅ No wrong predictions found!")
            return
        
        print(f"\n{'='*80}")
        print(f"❌ WRONG PREDICTIONS (First {num_examples} errors)")
        print(f"{'='*80}\n")
        
        for i, result in enumerate(wrong[:num_examples], 1):
            print(f"{i}. FILE: {result['file_id']}")
            print(f"   EXPECTED:  {result['reference']}")
            print(f"   PREDICTED: {result['prediction']}")
            print(f"   ERROR:     WER {result['wer']*100:.1f}% | CER {result['cer']*100:.1f}%")
            print()
    
    def save_detailed_report(self, output_file='accuracy_report.json'):
        """Save detailed accuracy report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': self.stats,
            'detailed_results': self.accuracy_results
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Detailed report saved to: {output_file}")
        return output_file
    
    def run(self):
        """Run full verification"""
        print(f"\n🚀 Starting verification...")
        print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   Reference: {self.reference_file}")
        print(f"   Results:   {self.test_results_file}\n")
        
        # Load data
        if not self.load_references():
            return False
        if not self.load_predictions():
            return False
        
        # Verify accuracy
        self.verify_accuracy()
        
        # Print results
        self.print_summary()
        self.print_sample_results(num_samples=10)
        self.print_wrong_examples(num_examples=10)
        
        # Save report
        self.save_detailed_report()
        
        return True


def main():
    """Main entry point"""
    try:
        verifier = VeddaAccuracyVerifier()
        verifier.run()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
