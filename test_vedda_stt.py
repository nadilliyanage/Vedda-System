#!/usr/bin/env python3
"""
Test script for Vedda STT Processor
Run this to test the Vedda STT functionality without the full web service
"""

import sys
import os

# Add the speech-service directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'speech-service'))

from vedda_stt_processor import VeddaSTTProcessor

def test_vedda_processor():
    """Test the Vedda STT processor with sample Sinhala text"""
    
    print("🧪 Testing Vedda STT Processor")
    print("=" * 50)
    
    # Initialize processor
    try:
        processor = VeddaSTTProcessor()
        print(f"✅ Vedda processor initialized successfully")
        
        # Get dictionary stats
        stats = processor.get_dictionary_stats()
        print(f"📊 Dictionary Stats: {stats}")
        print()
        
    except Exception as e:
        print(f"❌ Failed to initialize processor: {e}")
        return
    
    # Test cases - Sinhala text that should map to Vedda
    test_cases = [
        {
            "sinhala": "ළමයි ගෙදර ඉන්නවා",
            "expected_vedda": "කැකුලෝ ගෙදර ඉන්නවා",
            "description": "Children are at home"
        },
        {
            "sinhala": "මේ ගස ලොකු",
            "expected_vedda": "මේ ගස් ලොකු", 
            "description": "This tree is big"
        },
        {
            "sinhala": "අම්මා කෑම කරනවා",
            "expected_vedda": "අම්මා කෑම කරනවා",
            "description": "Mother is cooking (some words may remain same)"
        },
        {
            "sinhala": "වතුර පිරිසිදු",
            "expected_vedda": "වතුර පිරිසිදු",
            "description": "Water is clean"
        },
        {
            "sinhala": "පාපන්දු සෙල්ලම්",
            "expected_vedda": "පාපන්දු සෙල්ලම්",
            "description": "Football sports"
        }
    ]
    
    print("🔍 Testing Sinhala to Vedda mapping:")
    print("-" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['description']}")
        print(f"Input (Sinhala): {test_case['sinhala']}")
        print(f"Expected (Vedda): {test_case['expected_vedda']}")
        
        try:
            result = processor.process_sinhala_stt_result(
                test_case['sinhala'], 
                confidence=0.9
            )
            
            if result['success']:
                print(f"✅ Result (Vedda): {result['vedda_text']}")
                print(f"   Confidence: {result['confidence']:.2f}")
                print(f"   Matched Words: {result.get('matched_words', 0)}/{result.get('total_words', 0)}")
                
                # Show word details
                if result.get('word_details'):
                    print("   Word Mappings:")
                    for detail in result['word_details']:
                        method_icon = {
                            'direct_mapping': '🎯',
                            'fuzzy_matching': '🔍', 
                            'no_match': '❓'
                        }.get(detail['method'], '❔')
                        
                        print(f"     {method_icon} {detail['sinhala']} → {detail['vedda']} ({detail['method']})")
                
                # Check if result matches expectation
                if result['vedda_text'] == test_case['expected_vedda']:
                    print("   ✅ Matches expected result!")
                else:
                    print("   ⚠️  Different from expected (may be acceptable)")
            else:
                print(f"❌ Processing failed: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print("🏁 Testing completed!")

def test_dictionary_loading():
    """Test dictionary loading functionality"""
    
    print("\n📚 Testing Dictionary Loading")
    print("-" * 30)
    
    try:
        processor = VeddaSTTProcessor()
        
        # Test if we can access some known dictionary entries
        test_words = ['කැකුලෝ', 'ගස්', 'වතුර', 'අම්මා', 'තාත්තා']
        
        found_words = []
        for word in test_words:
            if word in processor.vedda_dict:
                found_words.append(word)
                data = processor.vedda_dict[word]
                print(f"✅ {word} → {data['sinhala']} → {data['english']}")
        
        print(f"\nFound {len(found_words)}/{len(test_words)} test words in dictionary")
        
        # Test reverse mapping
        print("\n🔄 Testing Sinhala to Vedda reverse mapping:")
        for word in ['ළමයි', 'ගස', 'වතුර']:
            if word.lower() in processor.sinhala_to_vedda:
                vedda_word = processor.sinhala_to_vedda[word.lower()]
                print(f"✅ {word} → {vedda_word}")
            else:
                print(f"❌ {word} not found in reverse mapping")
                
    except Exception as e:
        print(f"❌ Dictionary loading test failed: {e}")

if __name__ == "__main__":
    print("🌟 Vedda STT Processor Test Suite")
    print("=" * 50)
    
    # Run tests
    test_dictionary_loading()
    test_vedda_processor()
    
    print("\n💡 Next steps:")
    print("1. Start the speech service: python backend/speech-service/app.py")
    print("2. Test the web interface at: http://localhost:3000/vedda-stt")
    print("3. Try speaking Vedda words that exist in the dictionary")