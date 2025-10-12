#!/usr/bin/env python3
"""Test script for the new mandatory Sinhala bridge translation system"""

import requests
import json

def test_translation(text, source_lang, target_lang):
    """Test translation using the new system"""
    url = "http://localhost:5001/api/translate"
    data = {
        "text": text,
        "source_language": source_lang,
        "target_language": target_lang
    }
    
    try:
        response = requests.post(url, json=data, timeout=30)
        result = response.json()
        
        print(f"\n{'='*60}")
        print(f"INPUT: '{text}' ({source_lang} → {target_lang})")
        print(f"{'='*60}")
        
        if result.get('success'):
            print(f"✅ SUCCESS")
            print(f"OUTPUT: '{result['translated_text']}'")
            print(f"METHOD: {result['translation_method']}")
            print(f"CONFIDENCE: {result['confidence']:.2f}")
            if result.get('bridge_translation'):
                print(f"BRIDGE: {result['bridge_translation']}")
            if result.get('methods_used'):
                print(f"METHODS USED: {result['methods_used']}")
        else:
            print(f"❌ ERROR: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ CONNECTION ERROR: {e}")

def main():
    print("🧪 TESTING NEW MANDATORY SINHALA BRIDGE TRANSLATION SYSTEM")
    print("=" * 80)
    
    # Test 1: English to Vedda (should go English → Sinhala → Vedda)
    test_translation("These children are playing football", "english", "vedda")
    
    # Test 2: Vedda to English (should go Vedda → Sinhala → English)
    test_translation("මේ කැකුලෝ පාපන්දු සෙල්ලම් කරනවා", "vedda", "english")
    
    # Test 3: Sinhala to Vedda (should use dictionary for known words)
    test_translation("මේ ළමයි පාපන්දු සෙල්ලම් කරනවා", "sinhala", "vedda")
    
    # Test 4: Individual word that should be in dictionary
    test_translation("children", "english", "vedda")
    
    # Test 5: Non-Vedda translation (should use direct translation)
    test_translation("Hello world", "english", "french")
    
    print(f"\n{'='*80}")
    print("🏁 TESTING COMPLETE")

if __name__ == "__main__":
    main()