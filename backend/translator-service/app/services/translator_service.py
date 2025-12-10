import requests


class VeddaTranslator:
    def __init__(self, dictionary_service_url, history_service_url, google_translate_url):
        self.dictionary_service_url = dictionary_service_url
        self.history_service_url = history_service_url
        self.google_translate_url = google_translate_url
        
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
                f"{self.dictionary_service_url}/api/dictionary/search",
                params={
                    'q': word,
                    'source': source_lang,
                    'target': target_lang
                },
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('count', 0) > 0:
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
            source_code = self.supported_languages.get(source_lang, source_lang)
            target_code = self.supported_languages.get(target_lang, target_lang)
            
            if target_code == 'vedda':
                target_code = 'si'
            elif source_code == 'vedda':
                source_code = 'si'
            
            params = {
                'client': 'gtx',
                'sl': source_code,
                'tl': target_code,
                'dt': 't',
                'q': text
            }
            
            response = requests.get(self.google_translate_url, params=params, timeout=10)
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
        
        sinhala_words = [word.strip() for word in sinhala_text.split() if word.strip()]
        vedda_words = []
        dictionary_hits = 0
        
        for sinhala_word in sinhala_words:
            dict_result = self.search_dictionary(sinhala_word, 'sinhala', 'vedda')
            if dict_result and dict_result.get('found'):
                vedda_word = dict_result['translation'].get('vedda', sinhala_word)
                vedda_words.append(vedda_word)
                dictionary_hits += 1
            else:
                vedda_words.append(sinhala_word)
        
        final_text = ' '.join(vedda_words)
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
        
        vedda_words = [word.strip() for word in text.split() if word.strip()]
        sinhala_words = []
        dictionary_hits = 0
        
        for vedda_word in vedda_words:
            dict_result = self.search_dictionary(vedda_word, 'vedda', 'sinhala')
            if dict_result and dict_result.get('found'):
                sinhala_word = dict_result['translation'].get('sinhala', vedda_word)
                sinhala_words.append(sinhala_word)
                dictionary_hits += 1
            else:
                sinhala_words.append(vedda_word)
        
        sinhala_text = ' '.join(sinhala_words)
        
        if target_language == 'sinhala':
            final_text = sinhala_text
            step2_confidence = 1.0
        else:
            final_text = self.google_translate(sinhala_text, 'sinhala', target_language)
            if not final_text:
                final_text = sinhala_text
                step2_confidence = 0.5
            else:
                step2_confidence = 0.8
        
        dict_coverage = dictionary_hits / len(vedda_words) if vedda_words else 0
        final_confidence = dict_coverage * 0.7 + step2_confidence * 0.3
        
        return {
            'translated_text': final_text,
            'confidence': final_confidence,
            'method': 'vedda_to_sinhala_bridge',
            'source_ipa': '',
            'target_ipa': '',
            'bridge_translation': sinhala_text,
            'methods_used': ['dictionary', 'google', 'sinhala_bridge'],
            'note': f'Translated via Sinhala bridge. Dictionary coverage: {dictionary_hits}/{len(vedda_words)} words'
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

        if target_language == 'vedda':
            return self.translate_to_vedda_via_sinhala(text, source_language)
        elif source_language == 'vedda':
            return self.translate_from_vedda_via_sinhala(text, target_language)
        else:
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
                f"{self.history_service_url}/api/history",
                json=data,
                timeout=5
            )
            return response.status_code == 201
        except Exception as e:
            print(f"History service error: {e}")
            return False
