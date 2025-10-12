from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import urllib.parse
import json
import re
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Service URLs
DICTIONARY_SERVICE_URL = 'http://localhost:5002'
HISTORY_SERVICE_URL = 'http://localhost:5003'

# Google Translate API configuration (using free endpoint)
GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"

class VeddaTranslator:
    def __init__(self):
        self.supported_languages = {
            'vedda': 'vedda',
            'sinhala': 'si',
            'english': 'en',
            'tamil': 'ta',
            'hindi': 'hi',
            'chinese': 'zh',
            'japanese': 'ja',
            'korean': 'ko',
            'french': 'fr',
            'german': 'de',
            'spanish': 'es',
            'italian': 'it',
            'portuguese': 'pt',
            'russian': 'ru',
            'arabic': 'ar',
            'dutch': 'nl',
            'swedish': 'sv',
            'norwegian': 'no',
            'danish': 'da',
            'finnish': 'fi',
            'polish': 'pl',
            'czech': 'cs',
            'hungarian': 'hu',
            'thai': 'th',
            'vietnamese': 'vi',
            'indonesian': 'id',
            'malay': 'ms',
            'turkish': 'tr',
            'hebrew': 'he',
            'greek': 'el',
            'bulgarian': 'bg',
            'romanian': 'ro',
            'ukrainian': 'uk',
            'croatian': 'hr',
            'serbian': 'sr',
            'slovak': 'sk',
            'slovenian': 'sl',
            'latvian': 'lv',
            'lithuanian': 'lt',
            'estonian': 'et'
        }
    
    def search_dictionary(self, word, source_lang='vedda', target_lang='english'):
        """Search dictionary service for word translation"""
        try:
            response = requests.get(
                f"{DICTIONARY_SERVICE_URL}/api/dictionary/search",
                params={
                    'word': word,
                    'source': source_lang,
                    'target': target_lang
                },
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Dictionary service error: {e}")
            return None
    
    def google_translate(self, text, source_lang, target_lang):
        """Use Google Translate API for translation"""
        try:
            # Convert language codes
            source_code = self.supported_languages.get(source_lang, source_lang)
            target_code = self.supported_languages.get(target_lang, target_lang)
            
            if source_code == 'vedda' or target_code == 'vedda':
                return None  # Google doesn't support Vedda
            
            params = {
                'client': 'gtx',
                'sl': source_code,
                'tl': target_code,
                'dt': 't',
                'q': text
            }
            
            response = requests.get(GOOGLE_TRANSLATE_URL, params=params, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if result and len(result) > 0 and len(result[0]) > 0:
                    return result[0][0][0]
            return None
            
        except Exception as e:
            print(f"Google Translate error: {e}")
            return None
    
    def translate_text(self, text, source_language, target_language):
        """Main translation method"""
        if not text.strip():
            return {
                'translated_text': '',
                'confidence': 0,
                'method': 'none',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': ''
            }
        
        # Initialize result
        result = {
            'translated_text': '',
            'confidence': 0,
            'method': 'unknown',
            'source_ipa': '',
            'target_ipa': '',
            'bridge_translation': '',
            'methods_used': []
        }
        
        # Split text into words for word-by-word translation
        words = re.findall(r'\b\w+\b', text.lower())
        translated_words = []
        translation_methods = []
        total_confidence = 0
        
        for word in words:
            word_result = self.translate_word(word, source_language, target_language)
            print(f"DEBUG: Word '{word}' result: {word_result}")
            if word_result:
                translated_words.append(word_result['translation'])
                translation_methods.append(word_result['method'])
                total_confidence += word_result['confidence']
            else:
                translated_words.append(word)
                translation_methods.append('fallback')
                total_confidence += 0.1
        
        print(f"DEBUG: Final translated_words: {translated_words}")
        print(f"DEBUG: Total confidence: {total_confidence}, Words count: {len(words)}")
        
        if translated_words:
            result['translated_text'] = ' '.join(translated_words)
            result['confidence'] = total_confidence / len(words)
            result['methods_used'] = list(set(translation_methods))
            
            # Determine primary method
            if 'dictionary' in translation_methods:
                result['method'] = 'dictionary'
            elif 'bridge' in translation_methods:
                result['method'] = 'bridge'
            elif 'google' in translation_methods:
                result['method'] = 'google'
            else:
                result['method'] = 'fallback'
        
        # Try phrase-level translation if word-by-word didn't work well
        print(f"DEBUG: Word-by-word result confidence: {result['confidence']}")
        if result['confidence'] < 0.5:
            print(f"DEBUG: Trying phrase-level translation because confidence {result['confidence']} < 0.5")
            phrase_result = self.translate_phrase(text, source_language, target_language)
            print(f"DEBUG: Phrase result: {phrase_result}")
            if phrase_result and phrase_result['confidence'] > result['confidence']:
                print(f"DEBUG: Using phrase result because {phrase_result['confidence']} > {result['confidence']}")
                result = phrase_result
        else:
            print(f"DEBUG: Skipping phrase translation because confidence {result['confidence']} >= 0.5")
        
        return result
    
    def translate_word(self, word, source_language, target_language):
        """Translate a single word using various methods"""
        
        print(f"DEBUG: Translating '{word}' from {source_language} to {target_language}")
        
        # Method 1: Direct dictionary lookup
        if source_language == 'vedda' or target_language == 'vedda':
            dict_result = self.search_dictionary(word, source_language, target_language)
            print(f"DEBUG: Dictionary result for '{word}': {dict_result}")
            if dict_result and dict_result.get('found'):
                translation_data = dict_result['translation']
                print(f"DEBUG: Translation data: {translation_data}")
                
                if target_language == 'english' and 'english' in translation_data:
                    return {
                        'translation': translation_data['english'],
                        'confidence': 0.9,
                        'method': 'dictionary',
                        'ipa': translation_data.get('english_ipa', '')
                    }
                elif target_language == 'sinhala' and 'sinhala' in translation_data:
                    return {
                        'translation': translation_data['sinhala'],
                        'confidence': 0.9,
                        'method': 'dictionary',
                        'ipa': translation_data.get('sinhala_ipa', '')
                    }
                elif target_language == 'vedda' and 'vedda' in translation_data:
                    vedda_translation = translation_data['vedda']
                    print(f"DEBUG: Found Vedda translation: '{vedda_translation}'")
                    return {
                        'translation': vedda_translation,
                        'confidence': 0.9,
                        'method': 'dictionary',
                        'ipa': translation_data.get('vedda_ipa', '')
                    }
        
        # Method 2: Bridge translation (English as bridge language)
        if source_language != 'english' and target_language != 'english':
            # First translate to English
            english_result = None
            if source_language == 'vedda':
                dict_result = self.search_dictionary(word, 'vedda', 'english')
                if dict_result and dict_result.get('found'):
                    english_result = dict_result['translation'].get('english')
            else:
                english_result = self.google_translate(word, source_language, 'english')
            
            if english_result:
                # Then translate from English to target
                if target_language == 'vedda':
                    dict_result = self.search_dictionary(english_result, 'english', 'vedda')
                    if dict_result and dict_result.get('found'):
                        return {
                            'translation': dict_result['translation'].get('vedda', word),
                            'confidence': 0.7,
                            'method': 'bridge',
                            'bridge_language': 'english'
                        }
                else:
                    final_result = self.google_translate(english_result, 'english', target_language)
                    if final_result:
                        return {
                            'translation': final_result,
                            'confidence': 0.6,
                            'method': 'bridge',
                            'bridge_language': 'english'
                        }
        
        # Method 3: Direct Google Translate (if both languages are supported)
        if (source_language in self.supported_languages and 
            target_language in self.supported_languages and
            source_language != 'vedda' and target_language != 'vedda'):
            
            google_result = self.google_translate(word, source_language, target_language)
            if google_result:
                return {
                    'translation': google_result,
                    'confidence': 0.8,
                    'method': 'google'
                }
        
        return None
    
    def translate_phrase(self, text, source_language, target_language):
        """Translate entire phrase using available methods"""
        
        # For Vedda translations, try to use dictionary for key words
        if source_language == 'vedda' or target_language == 'vedda':
            return self.vedda_phrase_translation(text, source_language, target_language)
        
        # For other languages, use Google Translate
        google_result = self.google_translate(text, source_language, target_language)
        if google_result:
            return {
                'translated_text': google_result,
                'confidence': 0.8,
                'method': 'google',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': ['google']
            }
        
        return None
    
    def vedda_phrase_translation(self, text, source_language, target_language):
        """Special handling for Vedda phrase translation"""
        # This would implement more sophisticated Vedda phrase translation
        # For now, it's a placeholder that could be enhanced with linguistic rules
        words = text.split()
        translated_parts = []
        
        print(f"DEBUG PHRASE: Processing phrase '{text}' with {len(words)} words")
        
        for word in words:
            word_result = self.translate_word(word.lower(), source_language, target_language)
            print(f"DEBUG PHRASE: Word '{word}' -> {word_result}")
            if word_result:
                translated_parts.append(word_result['translation'])
            else:
                translated_parts.append(word)
        
        print(f"DEBUG PHRASE: Final translated_parts: {translated_parts}")
        
        if translated_parts:
            final_text = ' '.join(translated_parts)
            print(f"DEBUG PHRASE: Final translated text: '{final_text}'")
            return {
                'translated_text': final_text,
                'confidence': 0.6,
                'method': 'vedda_phrase',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': ['dictionary', 'vedda_phrase']
            }
        
        return None
    
    def save_translation_history(self, input_text, output_text, source_language, 
                               target_language, translation_method, confidence):
        """Save translation to history service"""
        try:
            data = {
                'input_text': input_text,
                'output_text': output_text,
                'source_language': source_language,
                'target_language': target_language,
                'translation_method': translation_method,
                'confidence_score': confidence
            }
            
            response = requests.post(
                f"{HISTORY_SERVICE_URL}/api/history",
                json=data,
                timeout=5
            )
            return response.status_code == 201
        except Exception as e:
            print(f"History service error: {e}")
            return False

# Initialize translator
translator = VeddaTranslator()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'translator-service',
        'timestamp': datetime.now().isoformat(),
        'supported_languages': len(translator.supported_languages)
    })

@app.route('/api/translate', methods=['POST'])
def translate():
    """Main translation endpoint"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    text = data.get('text', '').strip()
    source_language = data.get('source_language', 'english').lower()
    target_language = data.get('target_language', 'vedda').lower()
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    if source_language not in translator.supported_languages:
        return jsonify({'error': f'Unsupported source language: {source_language}'}), 400
    
    if target_language not in translator.supported_languages:
        return jsonify({'error': f'Unsupported target language: {target_language}'}), 400
    
    # Perform translation
    result = translator.translate_text(text, source_language, target_language)
    
    # Save to history (async, don't wait for response)
    try:
        translator.save_translation_history(
            input_text=text,
            output_text=result['translated_text'],
            source_language=source_language,
            target_language=target_language,
            translation_method=result['method'],
            confidence=result['confidence']
        )
    except Exception as e:
        print(f"Failed to save history: {e}")
    
    return jsonify({
        'success': True,
        'input_text': text,
        'translated_text': result['translated_text'],
        'source_language': source_language,
        'target_language': target_language,
        'confidence': result['confidence'],
        'translation_method': result['method'],
        'methods_used': result.get('methods_used', []),
        'source_ipa': result.get('source_ipa', ''),
        'target_ipa': result.get('target_ipa', ''),
        'bridge_translation': result.get('bridge_translation', '')
    })

@app.route('/api/languages', methods=['GET'])
def get_languages():
    """Get supported languages"""
    return jsonify({
        'supported_languages': translator.supported_languages,
        'total_count': len(translator.supported_languages)
    })

@app.route('/api/translate/word', methods=['POST'])
def translate_word():
    """Translate a single word with detailed information"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    word = data.get('word', '').strip()
    source_language = data.get('source_language', 'english').lower()
    target_language = data.get('target_language', 'vedda').lower()
    
    if not word:
        return jsonify({'error': 'Word is required'}), 400
    
    result = translator.translate_word(word, source_language, target_language)
    
    if result:
        return jsonify({
            'success': True,
            'word': word,
            'translation': result['translation'],
            'confidence': result['confidence'],
            'method': result['method'],
            'ipa': result.get('ipa', ''),
            'source_language': source_language,
            'target_language': target_language
        })
    else:
        return jsonify({
            'success': False,
            'word': word,
            'message': 'Translation not found',
            'source_language': source_language,
            'target_language': target_language
        })

if __name__ == '__main__':
    print("Starting Translation Service on port 5001...")
    print(f"Dictionary Service: {DICTIONARY_SERVICE_URL}")
    print(f"History Service: {HISTORY_SERVICE_URL}")
    app.run(host='0.0.0.0', port=5001, debug=True)