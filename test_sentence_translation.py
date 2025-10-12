import requests
import json

def test_sentence_translation():
    """Test sentence translation between English, Sinhala, and Vedda"""
    print("📝 SENTENCE TRANSLATION TESTING")
    print("=" * 60)
    
    translator_url = "http://localhost:5001/api/translate"
    
    # Test sentences as provided by the user
    test_cases = [
        {
            "name": "English to Vedda",
            "text": "These children are playing football.",
            "source_language": "english",
            "target_language": "vedda",
            "expected": "මේ කැකුලෝ පාපන්දු සෙල්ලම් කරනවා.",
            "description": "Should translate 'these' to 'මේ' and 'children' to 'කැකුලෝ'"
        },
        {
            "name": "English to Sinhala", 
            "text": "These children are playing football.",
            "source_language": "english",
            "target_language": "sinhala",
            "expected": "මේ ළමයි පාපන්දු සෙල්ලම් කරනවා.",
            "description": "Should use Google Translate for full sentence"
        },
        {
            "name": "Sinhala to Vedda",
            "text": "මේ ළමයි පාපන්දු සෙල්ලම් කරනවා.",
            "source_language": "sinhala", 
            "target_language": "vedda",
            "expected": "මේ කැකුලෝ පාපන්දු සෙල්ලම් කරනවා.",
            "description": "Should replace 'ළමයි' with 'කැකුලෝ' from dictionary"
        },
        {
            "name": "Vedda to English",
            "text": "මේ කැකුලෝ පාපන්දු සෙල්ලම් කරනවා.",
            "source_language": "vedda",
            "target_language": "english", 
            "expected": "These children are playing football.",
            "description": "Should use Sinhala bridge for unknown words"
        },
        {
            "name": "Vedda to Sinhala",
            "text": "මේ කැකුලෝ පාපන්දු සෙල්ලම් කරනවා.",
            "source_language": "vedda",
            "target_language": "sinhala",
            "expected": "මේ ළමයි පාපන්දු සෙල්ලම් කරනවා.", 
            "description": "Should replace 'කැකුලෝ' with 'ළමයි' from dictionary"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['name']}")
        print(f"📝 Input: '{test_case['text']}'")
        print(f"🎯 Expected: '{test_case['expected']}'")
        print(f"📋 Description: {test_case['description']}")
        
        try:
            response = requests.post(translator_url, json={
                "text": test_case["text"],
                "source_language": test_case["source_language"],
                "target_language": test_case["target_language"]
            }, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                translated_text = result.get('translated_text', 'N/A')
                confidence = result.get('confidence', 'N/A')
                method = result.get('translation_method', 'N/A')
                methods_used = result.get('methods_used', [])
                note = result.get('note', '')
                bridge_lang = result.get('bridge_language', '')
                
                print(f"✅ Status: {response.status_code}")
                print(f"📄 Result: '{translated_text}'")
                print(f"🎯 Confidence: {confidence}")
                print(f"🔧 Method: {method}")
                print(f"🛠️  Methods Used: {methods_used}")
                if bridge_lang:
                    print(f"🌉 Bridge Language: {bridge_lang}")
                if note:
                    print(f"📋 Note: {note}")
                
                # Check if translation is close to expected
                if translated_text.strip() == test_case['expected'].strip():
                    print("✅ PERFECT MATCH!")
                elif any(word in translated_text for word in ['මේ', 'කැකුලෝ', 'ළමයි']) and test_case['target_language'] in ['vedda', 'sinhala']:
                    print("✅ GOOD - Contains expected Vedda/Sinhala words!")
                elif 'children' in translated_text.lower() and test_case['target_language'] == 'english':
                    print("✅ GOOD - Contains expected English words!")
                else:
                    print("⚠️  PARTIAL - Translation may need improvement")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Connection Error: {e}")
        
        print("-" * 50)
    
    print("\n" + "=" * 60)
    print("SENTENCE TRANSLATION ANALYSIS")
    print("=" * 60)
    print("Key Points:")
    print("• 'these' should translate to 'මේ' (dictionary)")
    print("• 'children' should translate to 'කැකුලෝ' (Vedda) or 'ළමයි' (Sinhala)")
    print("• Unknown words should use Sinhala bridge or Google Translate")
    print("• Sentence structure should be preserved where possible")

if __name__ == "__main__":
    test_sentence_translation()