"""
Comprehensive Audio Input Testing for Vedda ASR Model
Tests all audio files (raw and processed) and generates detailed report
"""

import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import librosa
import os
import json
from pathlib import Path
from datetime import datetime
import time
from collections import defaultdict

class VeddaAudioTester:
    def __init__(self, model_path='models/whisper-vedda-final'):
        """Initialize Vedda ASR tester"""
        
        self.model_path = model_path
        self.processor = None
        self.model = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.results = []
        self.stats = {
            'total_files': 0,
            'successful': 0,
            'failed': 0,
            'total_duration': 0.0,
            'total_inference_time': 0.0,
            'by_source': defaultdict(lambda: {'count': 0, 'success': 0, 'failed': 0})
        }
        
        self._load_model()
    
    def _load_model(self):
        """Load the Vedda ASR model"""
        if not os.path.exists(self.model_path):
            print(f"❌ Model not found: {self.model_path}")
            return False
        
        try:
            print(f"🤖 Loading Vedda ASR model...")
            self.processor = WhisperProcessor.from_pretrained(
                self.model_path, 
                language="Sinhala", 
                task="transcribe"
            )
            self.model = WhisperForConditionalGeneration.from_pretrained(self.model_path)
            self.model.config.forced_decoder_ids = None
            self.model = self.model.to(self.device)
            self.model.eval()
            
            print(f"✅ Model loaded!")
            print(f"🖥️  Device: {self.device}")
            print(f"📊 Parameters: {sum(p.numel() for p in self.model.parameters()):,}")
            return True
        
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    
    def test_audio(self, audio_path):
        """Test a single audio file"""
        if self.model is None:
            return None
        
        if not os.path.exists(audio_path):
            return {
                'file': audio_path,
                'status': 'error',
                'error': 'File not found',
                'transcription': None
            }
        
        try:
            start_time = time.time()
            
            # Load and process audio
            audio, sr = librosa.load(audio_path, sr=16000, mono=True)
            duration = len(audio) / sr
            
            # Generate features
            input_features = self.processor(
                audio,
                sampling_rate=16000,
                return_tensors="pt",
                language="Sinhala"
            ).input_features.to(self.device)
            
            # Transcribe
            with torch.no_grad():
                predicted_ids = self.model.generate(
                    input_features,
                    language="si",
                    task="transcribe",
                    num_beams=1,
                    max_new_tokens=128
                )
            
            transcription = self.processor.decode(predicted_ids[0], skip_special_tokens=True)
            inference_time = time.time() - start_time
            
            result = {
                'file': os.path.basename(audio_path),
                'path': audio_path,
                'status': 'success',
                'transcription': transcription,
                'duration': round(duration, 2),
                'inference_time': round(inference_time, 2),
                'rtf': round(inference_time / duration, 2) if duration > 0 else 0,  # Real-time factor
                'file_size_mb': round(os.path.getsize(audio_path) / (1024 * 1024), 2)
            }
            
            self.stats['successful'] += 1
            self.stats['total_duration'] += duration
            self.stats['total_inference_time'] += inference_time
            
            return result
        
        except Exception as e:
            self.stats['failed'] += 1
            return {
                'file': os.path.basename(audio_path),
                'path': audio_path,
                'status': 'error',
                'error': str(e),
                'transcription': None
            }
    
    def find_all_audio_files(self, base_path='data'):
        """Find all audio files in data directories"""
        audio_extensions = ('.wav', '.mp3', '.ogg', '.flac', '.m4a')
        audio_files = []
        
        if os.path.isdir(base_path):
            for root, dirs, files in os.walk(base_path):
                for file in files:
                    if file.lower().endswith(audio_extensions):
                        full_path = os.path.join(root, file)
                        audio_files.append(full_path)
        
        return sorted(audio_files)
    
    def test_all_audio(self, base_path='data', limit=None):
        """Test all audio files in specified directory"""
        audio_files = self.find_all_audio_files(base_path)
        
        if limit:
            audio_files = audio_files[:limit]
        
        self.stats['total_files'] = len(audio_files)
        
        print(f"\n{'='*80}")
        print(f"🎤 VEDDA ASR - COMPREHENSIVE AUDIO TEST")
        print(f"{'='*80}")
        print(f"📊 Found {len(audio_files)} audio files")
        print(f"🎯 Testing started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*80}\n")
        
        for i, audio_path in enumerate(audio_files, 1):
            # Determine source (raw/processed)
            if 'raw' in audio_path:
                source = 'raw'
            elif 'processed' in audio_path:
                source = 'processed'
            else:
                source = 'other'
            
            self.stats['by_source'][source]['count'] += 1
            
            # Test audio
            result = self.test_audio(audio_path)
            self.results.append(result)
            
            # Update source stats
            if result['status'] == 'success':
                self.stats['by_source'][source]['success'] += 1
            else:
                self.stats['by_source'][source]['failed'] += 1
            
            # Print progress
            status_icon = "✅" if result['status'] == 'success' else "❌"
            print(f"{status_icon} [{i:3d}/{len(audio_files)}] {result['file']}")
            
            if result['status'] == 'success':
                print(f"    📝 {result['transcription'][:80]}{'...' if len(result['transcription']) > 80 else ''}")
                print(f"    ⏱️  Audio: {result['duration']}s | Inference: {result['inference_time']}s | RTF: {result['rtf']}x")
            else:
                print(f"    ❌ {result.get('error', 'Unknown error')}")
            
            # Show progress every 10 files
            if i % 10 == 0:
                success_rate = (self.stats['successful'] / i) * 100
                avg_rtf = (self.stats['total_inference_time'] / self.stats['total_duration']) if self.stats['total_duration'] > 0 else 0
                print(f"    📈 Progress: {success_rate:.1f}% success | Avg RTF: {avg_rtf:.2f}x\n")
        
        print(f"\n{'='*80}")
        print(f"✅ Testing completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*80}\n")
    
    def print_summary(self):
        """Print test summary statistics"""
        print(f"\n{'='*80}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*80}\n")
        
        # Overall stats
        print(f"📈 Overall Results:")
        print(f"   Total Files Tested:    {self.stats['total_files']}")
        print(f"   Successful:            {self.stats['successful']} ({self.stats['successful']/self.stats['total_files']*100:.1f}%)")
        print(f"   Failed:                {self.stats['failed']} ({self.stats['failed']/self.stats['total_files']*100:.1f}%)")
        
        # Time stats
        print(f"\n⏱️  Performance Metrics:")
        print(f"   Total Audio Duration:  {self.stats['total_duration']:.2f}s")
        print(f"   Total Inference Time:  {self.stats['total_inference_time']:.2f}s")
        if self.stats['total_duration'] > 0:
            avg_rtf = self.stats['total_inference_time'] / self.stats['total_duration']
            print(f"   Average RTF:           {avg_rtf:.2f}x (real-time factor)")
        
        # By source
        print(f"\n📂 Results by Source:")
        for source, stats in self.stats['by_source'].items():
            if stats['count'] > 0:
                success_rate = (stats['success'] / stats['count'] * 100)
                print(f"   {source.capitalize():10s} : {stats['success']:3d}/{stats['count']:3d} ({success_rate:5.1f}%)")
        
        print(f"\n{'='*80}\n")
    
    def save_results(self, output_file='test_results.json'):
        """Save test results to JSON file"""
        output_data = {
            'timestamp': datetime.now().isoformat(),
            'device': str(self.device),
            'model_path': self.model_path,
            'summary': {
                'total_files': self.stats['total_files'],
                'successful': self.stats['successful'],
                'failed': self.stats['failed'],
                'success_rate': f"{(self.stats['successful']/self.stats['total_files']*100):.1f}%" if self.stats['total_files'] > 0 else "0%",
                'total_audio_duration_sec': round(self.stats['total_duration'], 2),
                'total_inference_time_sec': round(self.stats['total_inference_time'], 2),
                'avg_rtf': round(self.stats['total_inference_time'] / self.stats['total_duration'], 2) if self.stats['total_duration'] > 0 else 0
            },
            'by_source': {k: dict(v) for k, v in self.stats['by_source'].items()},
            'results': self.results
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"💾 Results saved to: {output_file}")
        return output_file
    
    def generate_html_report(self, output_file='test_report.html'):
        """Generate HTML report of test results"""
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vedda ASR Test Report</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }}
        .container {{ 
            max-width: 1200px; 
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }}
        header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        h1 {{ font-size: 2.5em; margin-bottom: 10px; }}
        .timestamp {{ font-size: 0.9em; opacity: 0.9; }}
        
        .summary {{ 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
            border-bottom: 2px solid #e9ecef;
        }}
        .stat-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }}
        .stat-card h3 {{ color: #667eea; font-size: 0.9em; margin-bottom: 10px; text-transform: uppercase; }}
        .stat-card .value {{ font-size: 2em; font-weight: bold; color: #333; }}
        .stat-card .detail {{ font-size: 0.85em; color: #666; margin-top: 5px; }}
        
        .content {{ padding: 30px; }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        th {{
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }}
        td {{
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
        }}
        tr:hover {{ background: #f8f9fa; }}
        
        .success {{ color: #28a745; font-weight: bold; }}
        .error {{ color: #dc3545; font-weight: bold; }}
        
        .section-title {{
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        
        .progress-bar {{
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
        }}
        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8em;
            font-weight: bold;
        }}
        
        footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎤 Vedda ASR Test Report</h1>
            <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </header>
        
        <div class="summary">
            <div class="stat-card">
                <h3>Total Files</h3>
                <div class="value">{self.stats['total_files']}</div>
            </div>
            <div class="stat-card">
                <h3>Successful</h3>
                <div class="value" style="color: #28a745;">{self.stats['successful']}</div>
                <div class="detail">{self.stats['successful']/self.stats['total_files']*100:.1f}% success rate</div>
            </div>
            <div class="stat-card">
                <h3>Failed</h3>
                <div class="value" style="color: #dc3545;">{self.stats['failed']}</div>
            </div>
            <div class="stat-card">
                <h3>Total Duration</h3>
                <div class="value">{self.stats['total_duration']:.1f}s</div>
            </div>
            <div class="stat-card">
                <h3>Device</h3>
                <div class="value" style="font-size: 1.2em;">{str(self.device).upper()}</div>
            </div>
            <div class="stat-card">
                <h3>Avg RTF</h3>
                <div class="value">{self.stats['total_inference_time'] / self.stats['total_duration'] if self.stats['total_duration'] > 0 else 0:.2f}x</div>
                <div class="detail">Real-time factor</div>
            </div>
        </div>
        
        <div class="content">
            <div class="section-title">📊 Success Rate by Source</div>
            <table>
                <tr>
                    <th>Source</th>
                    <th>Total</th>
                    <th>Success</th>
                    <th>Failed</th>
                    <th>Success Rate</th>
                    <th>Progress</th>
                </tr>
"""
        
        for source, stats in self.stats['by_source'].items():
            if stats['count'] > 0:
                success_rate = (stats['success'] / stats['count'] * 100)
                html_content += f"""
                <tr>
                    <td><strong>{source.capitalize()}</strong></td>
                    <td>{stats['count']}</td>
                    <td class="success">{stats['success']}</td>
                    <td class="error">{stats['failed']}</td>
                    <td>{success_rate:.1f}%</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: {success_rate}%;">{success_rate:.0f}%</div>
                        </div>
                    </td>
                </tr>
"""
        
        html_content += """
            </table>
            
            <div class="section-title">📝 Detailed Results (Last 50 files)</div>
            <table>
                <tr>
                    <th>#</th>
                    <th>Filename</th>
                    <th>Status</th>
                    <th>Transcription</th>
                    <th>Duration (s)</th>
                    <th>Inference (s)</th>
                    <th>RTF</th>
                </tr>
"""
        
        for i, result in enumerate(self.results[-50:], 1):
            status_class = "success" if result['status'] == 'success' else "error"
            status_text = "✅ Success" if result['status'] == 'success' else f"❌ {result.get('error', 'Error')}"
            transcription = result.get('transcription', '')[:50]
            
            html_content += f"""
                <tr>
                    <td>{i}</td>
                    <td>{result['file']}</td>
                    <td class="{status_class}">{status_text}</td>
                    <td>{transcription}{'...' if len(result.get('transcription', '')) > 50 else ''}</td>
                    <td>{result.get('duration', 'N/A')}</td>
                    <td>{result.get('inference_time', 'N/A')}</td>
                    <td>{result.get('rtf', 'N/A')}</td>
                </tr>
"""
        
        html_content += """
            </table>
        </div>
        
        <footer>
            <p>Vedda ASR Comprehensive Audio Input Testing Report</p>
            <p>For more information, contact: Vedda Team</p>
        </footer>
    </div>
</body>
</html>
"""
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"🌐 HTML report saved to: {output_file}")
        return output_file


def main():
    """Main test runner"""
    try:
        # Initialize tester with absolute path
        model_path = os.path.join(os.path.dirname(__file__), 'vedda-asr-model/models/whisper-vedda-final')
        tester = VeddaAudioTester(model_path=model_path)
        
        if tester.model is None:
            print("\n❌ Failed to load model")
            print(f"   Tried: {model_path}")
            print("   Run: python fix_model.py")
            return
        
        # Test all audio files (or limit for testing)
        # Use limit=50 for quick testing, or remove limit for full test
        data_path = os.path.join(os.path.dirname(__file__), 'vedda-asr-model/data')
        tester.test_all_audio(base_path=data_path, limit=None)
        
        # Print summary
        tester.print_summary()
        
        # Save results
        tester.save_results('test_results.json')
        tester.generate_html_report('test_report.html')
        
        print("\n✅ Testing complete!")
        print("📊 View results:")
        print("   - test_results.json (detailed JSON)")
        print("   - test_report.html (interactive HTML report)")
        
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
