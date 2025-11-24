import json
import re
import urllib.parse
from datetime import datetime
import os

import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# Try to import Keras translator (optional)
try:
    from keras_translator import KerasTranslator
    KERAS_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Keras translator not available: {e}")
    KERAS_AVAILABLE = False
    KerasTranslator = None

app = Flask(__name__)
CORS(app)

# Service URLs
DICTIONARY_SERVICE_URL = 'http://localhost:5002'
HISTORY_SERVICE_URL = 'http://localhost:5003'

# Google Translate API configuration (using free endpoint)
GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"


class VeddaTranslator:
    def __init__(self):
        # Initialize Keras neural translator if available
        self.keras_translator = None
        if KERAS_AVAILABLE:
            try:
                model_dir = os.path.dirname(os.path.abspath(__file__))
                self.keras_translator = KerasTranslator(model_dir)
                if self.keras_translator.is_available():
                    print("✅ Neural translation models loaded and ready")
                else:
                    print("⚠️ Neural translation models failed to load")
                    self.keras_translator = None
            except Exception as e:
                print(f"⚠️ Failed to initialize Keras translator: {e}")
                self.keras_translator = None
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
                    'q': word,  # Fixed: Use 'q' parameter as expected by dictionary service
                    'source': source_lang,
                    'target': target_lang
                },
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('count', 0) > 0:
                    # Look for exact match first based on source language
                    for result in data.get('results', []):
                        match_found = False
                        if source_lang == 'vedda' and result.get('vedda_word') == word:
                            match_found = True
                        elif source_lang == 'sinhala' and result.get('sinhala_word') == word:
                            match_found = True
                        elif source_lang == 'english' and result.get('english_word') == word:
                            match_found = True
                        
                        if match_found:
                            return {
                                'found': True,
                                'translation': {
                                    'english': result.get('english_word'),
                                    'sinhala': result.get('sinhala_word'),
                                    'vedda': result.get('vedda_word'),
                                    'vedda_ipa': result.get('vedda_ipa'),
                                    'english_ipa': result.get('english_ipa'),
                                    'sinhala_ipa': result.get('sinhala_ipa')
                                }
                            }
                    # If no exact match, return first result
                    first_result = data['results'][0]
                    return {
                        'found': True,
                        'translation': {
                            'english': first_result.get('english_word'),
                            'sinhala': first_result.get('sinhala_word'),
                            'vedda': first_result.get('vedda_word'),
                            'vedda_ipa': first_result.get('vedda_ipa'),
                            'english_ipa': first_result.get('english_ipa'),
                            'sinhala_ipa': first_result.get('sinhala_ipa')
                        }
                    }
                return {'found': False}
            return {'found': False}
        except Exception as e:
            return {'found': False}
    
    def google_translate(self, text, source_lang, target_lang):
        """Use Google Translate API for translation"""
        try:
            # Convert language codes
            source_code = self.supported_languages.get(source_lang, source_lang)
            target_code = self.supported_languages.get(target_lang, target_lang)
            
            # Special handling for Vedda - use Sinhala as fallback
            if target_code == 'vedda':
                target_code = 'si'  # Use Sinhala as fallback for Vedda
            elif source_code == 'vedda':
                source_code = 'si'  # Use Sinhala as source for Vedda
            
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
                    translated_text = result[0][0][0]
                    return translated_text
            return None
            
        except Exception as e:
            return None
    
    def translate_to_vedda_via_sinhala(self, text, source_language):
        """Translate any language to Vedda via Sinhala bridge"""
        
        # Step 1: Translate source to Sinhala (if not already Sinhala)
        if source_language == 'sinhala':
            sinhala_text = text
            step1_confidence = 1.0
        else:
            sinhala_text = self.google_translate(text, source_language, 'sinhala')
            if not sinhala_text:
                return {
                    'translated_text': text,
                    'confidence': 0.1,
                    'method': 'fallback',
                    'source_ipa': '',
                    'target_ipa': '',
                    'bridge_translation': '',
                    'methods_used': ['fallback'],
                    'note': 'Failed to translate to Sinhala bridge'
                }
            step1_confidence = 0.8
        
        # Step 2: Convert Sinhala words to Vedda using dictionary
        sinhala_words = [word.strip() for word in sinhala_text.split() if word.strip()]
        vedda_words = []
        dictionary_hits = 0
        
        for sinhala_word in sinhala_words:
            # Try to find Vedda equivalent in dictionary
            dict_result = self.search_dictionary(sinhala_word, 'sinhala', 'vedda')
            if dict_result and dict_result.get('found'):
                vedda_word = dict_result['translation'].get('vedda', sinhala_word)
                vedda_words.append(vedda_word)
                dictionary_hits += 1
            else:
                # Keep Sinhala word if no Vedda equivalent found
                vedda_words.append(sinhala_word)
        
        final_text = ' '.join(vedda_words)
        
        # Calculate confidence based on dictionary coverage
        dict_coverage = dictionary_hits / len(sinhala_words) if sinhala_words else 0
        final_confidence = step1_confidence * 0.7 + dict_coverage * 0.3
        
        return {
            'translated_text': final_text,
            'confidence': final_confidence,
            'method': 'sinhala_to_vedda_bridge',
            'source_ipa': '',
            'target_ipa': '',
            'bridge_translation': sinhala_text,
            'methods_used': ['google', 'dictionary', 'sinhala_bridge'],
            'note': f'Translated via Sinhala bridge. Dictionary coverage: {dictionary_hits}/{len(sinhala_words)} words'
        }
    
    def translate_from_vedda_via_sinhala(self, text, target_language):
        """Translate Vedda to any language via Sinhala bridge"""
        
        # FIRST: Check for exact phrase matches in dictionary
        phrase_result = self.search_dictionary(text.strip(), 'vedda', target_language)
        if phrase_result and phrase_result.get('found'):
            translation = phrase_result['translation']
            if target_language == 'english' and translation.get('english'):
                return {
                    'translated_text': translation['english'],
                    'confidence': 0.95,
                    'method': 'vedda_phrase',
                    'source_ipa': translation.get('vedda_ipa', ''),
                    'target_ipa': translation.get('english_ipa', ''),
                    'bridge_translation': translation.get('sinhala', ''),
                    'methods_used': ['dictionary', 'phrase_match'],
                    'note': 'Direct phrase match found in dictionary'
                }
            elif target_language == 'sinhala' and translation.get('sinhala'):
                return {
                    'translated_text': translation['sinhala'],
                    'confidence': 0.95,
                    'method': 'vedda_phrase',
                    'source_ipa': translation.get('vedda_ipa', ''),
                    'target_ipa': translation.get('sinhala_ipa', ''),
                    'bridge_translation': translation.get('sinhala', ''),
                    'methods_used': ['dictionary', 'phrase_match'],
                    'note': 'Direct phrase match found in dictionary'
                }
        
        # SECOND: Try neural translation (Vedda → Sinhala)
        sinhala_text = None
        neural_used = False
        
        if self.keras_translator and self.keras_translator.is_available():
            try:
                neural_result = self.keras_translator.translate_vedda_to_sinhala(text)
                if neural_result and neural_result.get('success'):
                    sinhala_text = neural_result['translated_text']
                    neural_used = True
                    print(f"✅ Neural translation: '{text}' → '{sinhala_text}'")
            except Exception as e:
                print(f"⚠️ Neural translation failed: {e}")
        
        # FALLBACK: Word-by-word dictionary translation
        if not sinhala_text:
            # Step 1: Convert Vedda words to Sinhala using dictionary
            vedda_words = [word.strip() for word in text.split() if word.strip()]
            sinhala_words = []
            dictionary_hits = 0
            
            for vedda_word in vedda_words:
                # Try to find Sinhala equivalent in dictionary
                dict_result = self.search_dictionary(vedda_word, 'vedda', 'sinhala')
                if dict_result and dict_result.get('found'):
                    sinhala_word = dict_result['translation'].get('sinhala', vedda_word)
                    sinhala_words.append(sinhala_word)
                    dictionary_hits += 1
                else:
                    # Keep Vedda word (assume it's close to Sinhala)
                    sinhala_words.append(vedda_word)
            
            sinhala_text = ' '.join(sinhala_words)
        
        # Step 2: Translate Sinhala to target language (if not Sinhala)
        target_ipa = ''
        if target_language == 'sinhala':
            final_text = sinhala_text
            step2_confidence = 1.0
        else:
            translate_result = self.google_translate(sinhala_text, 'sinhala', target_language, include_ipa=True)
            if translate_result:
                if isinstance(translate_result, dict):
                    final_text = translate_result.get('text', sinhala_text)
                    target_ipa = translate_result.get('target_ipa', '')
                else:
                    final_text = translate_result
                step2_confidence = 0.8
            else:
                # Fallback: return Sinhala text
                final_text = sinhala_text
                step2_confidence = 0.5
        
        # Calculate confidence (use neural if available)
        methods_used = []
        if neural_used:
            methods_used = ['neural_model', 'google', 'sinhala_bridge']
            final_confidence = 0.85 * step2_confidence
        else:
            vedda_words = text.split()
            dict_coverage = dictionary_hits / len(vedda_words) if 'dictionary_hits' in locals() and vedda_words else 0
            final_confidence = dict_coverage * 0.7 + step2_confidence * 0.3
            methods_used = ['dictionary', 'google', 'sinhala_bridge']
        
        return {
            'translated_text': final_text,
            'confidence': final_confidence,
            'method': 'vedda_to_sinhala_bridge',
            'source_ipa': '',
            'target_ipa': target_ipa,
            'bridge_translation': sinhala_text,
            'methods_used': methods_used,
            'note': f'Translated via Sinhala bridge{" using neural model" if neural_used else ""}'
        }
    
    def direct_translation(self, text, source_language, target_language):
        """Direct translation for non-Vedda languages"""
        
        result = self.google_translate(text, source_language, target_language)
        if result:
            return {
                'translated_text': result,
                'confidence': 0.85,
                'method': 'google_direct',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': ['google']
            }
        else:
            return {
                'translated_text': text,
                'confidence': 0.1,
                'method': 'fallback',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': ['fallback'],
                'note': 'Google Translate failed'
            }
    
    def translate_text(self, text, source_language, target_language):
        """Main translation method with Sinhala bridge for Vedda"""
        if not text.strip():
            return {
                'translated_text': '',
                'confidence': 0,
                'method': 'none',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': []
            }

        # VEDDA TRANSLATION LOGIC: Always use Sinhala as bridge
        if target_language == 'vedda':
            # Any Language → Sinhala → Vedda
            return self.translate_to_vedda_via_sinhala(text, source_language)
        elif source_language == 'vedda':
            # Vedda → Sinhala → Any Language
            return self.translate_from_vedda_via_sinhala(text, target_language)
        else:
            # Direct translation for non-Vedda languages
            return self.direct_translation(text, source_language, target_language)
    
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


if __name__ == '__main__':
    print("Starting Translation Service on port 5001...")
    print(f"Dictionary Service: {DICTIONARY_SERVICE_URL}")
    print(f"History Service: {HISTORY_SERVICE_URL}")
    app.run(host='0.0.0.0', port=5001, debug=True)