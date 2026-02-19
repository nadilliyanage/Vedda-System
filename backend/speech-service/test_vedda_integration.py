"""
Test Vedda ASR Integration with Speech Service
"""

import requests
import os
from pathlib import Path

def test_vedda_asr_endpoint():
    """Test the /api/stt endpoint with Vedda language"""
    
    print("\n" + "="*60)
    print("🧪 TESTING VEDDA ASR INTEGRATION")
    print("="*60)
    
    # Speech service endpoint
    API_URL = "http://localhost:5007/api/stt"
    
    # Test audio file
    test_audio = "vedda-asr-model/data/processed/vedda_110_20260211_231344_476c8be5.wav"
    
    if not os.path.exists(test_audio):
        print(f"❌ Test audio not found: {test_audio}")
        print(f"\n📋 Create one using:")
        print(f"   python vedda-asr-model/scripts/2_prepare_dataset.py")
        return
    
    print(f"\n📂 Test audio: {test_audio}")
    
    try:
        # Open audio file
        with open(test_audio, 'rb') as f:
            files = {'audio': f}
            data = {'language': 'vedda'}
            
            print(f"\n🚀 Sending request to {API_URL}")
            print(f"   Language: vedda")
            
            # Send request
            response = requests.post(API_URL, files=files, data=data)
        
        print(f"\n{'='*60}")
        print("📊 RESPONSE:")
        print(f"{'='*60}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Status: {response.status_code}")
            print(f"   Success: {result.get('success')}")
            print(f"   Text: {result.get('text')}")
            print(f"   Language: {result.get('language')}")
            print(f"   Confidence: {result.get('confidence')}")
            print(f"   Method: {result.get('method')}")
            
            if result.get('success'):
                print(f"\n✅ VEDDA ASR WORKING!")
            else:
                print(f"\n⚠️  Error: {result.get('error')}")
        else:
            print(f"\n❌ Status: {response.status_code}")
            print(f"   Response: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Cannot connect to {API_URL}")
        print(f"\n📋 Make sure speech service is running:")
        print(f"   cd backend/speech-service")
        print(f"   python app.py")
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    print(f"\n{'='*60}\n")


if __name__ == '__main__':
    test_vedda_asr_endpoint()
