#!/usr/bin/env python3
"""Test newly added authentic Vedda words"""

import requests
import json

def test_new_vedda_words():
    """Test the newly added authentic Vedda vocabulary"""
    url = "http://localhost:5001/api/translate"
    
    print("🧪 TESTING NEWLY ADDED AUTHENTIC VEDDA WORDS")
    print("=" * 60)
    
    # Test cases with new authentic Vedda words
    test_cases = [
        # New authentic Vedda words to English
        ("දියරච්ඡා", "vedda", "english"),  # water
        ("දන්ඩුකච්චා", "vedda", "english"),  # ship
        ("කොයිබා", "vedda", "english"),  # where
        ("මීආට්ටෝ", "vedda", "english"),  # I
        ("ටොපන්", "vedda", "english"),  # you
        ("ටුනමක්", "vedda", "english"),  # three
        
        # English to new Vedda words
        ("water", "english", "vedda"),
        ("ship", "english", "vedda"), 
        ("where", "english", "vedda"),
        ("I", "english", "vedda"),
        ("you", "english", "vedda"),
        ("three", "english", "vedda"),
        
        # Test sentence with old issue (should work now)
        ("These children are playing football", "english", "vedda"),
    ]
    
    for text, source_lang, target_lang in test_cases:
        try:
            data = {
                "text": text,
                "source_language": source_lang,
                "target_language": target_lang
            }
            
            response = requests.post(url, json=data, timeout=30)
            result = response.json()
            
            print(f"\n{'='*50}")
            print(f"INPUT: '{text}' ({source_lang} → {target_lang})")
            print(f"{'='*50}")
            
            if result.get('success'):
                print(f"✅ SUCCESS")
                print(f"OUTPUT: '{result['translated_text']}'")
                print(f"METHOD: {result['translation_method']}")
                print(f"CONFIDENCE: {result['confidence']:.2f}")
                if result.get('methods_used'):
                    print(f"METHODS USED: {result['methods_used']}")
                    
                # Special check for authentic Vedda words
                if source_lang == "vedda" and text in ['දියරච්ඡා', 'දන්ඩුකච්චා', 'කොයිබා', 'මීආට්ටෝ', 'ටොපන්', 'ටුනමක්']:
                    if 'dictionary' in result.get('methods_used', []):
                        print(f"🎯 AUTHENTIC VEDDA WORD RECOGNIZED!")
                    else:
                        print(f"⚠️  Authentic Vedda word not found in dictionary")
                        
            else:
                print(f"❌ ERROR: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ CONNECTION ERROR: {e}")
    
    print(f"\n{'='*60}")
    print("🏁 TESTING COMPLETE")

if __name__ == "__main__":
    test_new_vedda_words()