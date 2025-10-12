import requests
import json

def add_missing_words():
    """Add missing words for sentence translation"""
    print("📚 ADDING MISSING WORDS TO DICTIONARY")
    print("=" * 50)
    
    dict_url = "http://localhost:5002/api/dictionary/add"
    
    # Words needed for the sentence translation
    missing_words = [
        {
            "vedda_word": "ළමයි",
            "english_word": "children", 
            "sinhala_word": "ළමයි",
            "vedda_ipa": "ləməi",
            "english_ipa": "ˈtʃɪldrən",
            "sinhala_ipa": "ləməi",
            "word_type": "noun",
            "usage_example": "ළමයි පාඩම් කරනවා - Children are studying"
        },
        {
            "vedda_word": "සෙල්ලම්",
            "english_word": "playing",
            "sinhala_word": "සෙල්ලම්", 
            "vedda_ipa": "selləm",
            "english_ipa": "ˈpleɪɪŋ",
            "sinhala_ipa": "selləm",
            "word_type": "verb",
            "usage_example": "ළමයි සෙල්ලම් කරනවා - Children are playing"
        },
        {
            "vedda_word": "පාපන්දු",
            "english_word": "football",
            "sinhala_word": "පාපන්දු",
            "vedda_ipa": "paːpəndu",
            "english_ipa": "ˈfʊtbɔːl", 
            "sinhala_ipa": "paːpəndu",
            "word_type": "noun",
            "usage_example": "පාපන්දු සෙල්ලම - football game"
        },
        {
            "vedda_word": "කරනවා",
            "english_word": "doing",
            "sinhala_word": "කරනවා",
            "vedda_ipa": "kərənaːva:",
            "english_ipa": "ˈduːɪŋ",
            "sinhala_ipa": "kərənaːva:",
            "word_type": "verb",
            "usage_example": "කොච්චර වැඩක් කරනවා ද? - How much work are you doing?"
        }
    ]
    
    for word_data in missing_words:
        try:
            response = requests.post(dict_url, json=word_data)
            if response.status_code == 201:
                result = response.json()
                print(f"✅ Added '{word_data['vedda_word']}' -> '{word_data['english_word']}'")
            else:
                print(f"⚠️  '{word_data['vedda_word']}': {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ Error adding '{word_data['vedda_word']}': {e}")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    add_missing_words()