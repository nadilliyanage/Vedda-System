import requests
try:
    import eng_to_ipa as ipa
    IPA_AVAILABLE = True
except ImportError:
    IPA_AVAILABLE = False

try:
    from sinling import SinhalaTokenizer
    SINLING_AVAILABLE = True
    sinhala_tokenizer = SinhalaTokenizer()
except ImportError:
    SINLING_AVAILABLE = False
    sinhala_tokenizer = None


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
    
    def generate_english_ipa(self, text):
        """Generate IPA pronunciation for English text"""
        if not IPA_AVAILABLE or not text:
            return ''
        try:
            return ipa.convert(text)
        except Exception as e:
            return ''
    
    def generate_vedda_sinhala_ipa(self, text):
        """Generate IPA phonetic representation for Vedda/Sinhala text"""
        if not SINLING_AVAILABLE or not text:
            return ''
        try:
            # IPA phonetic mapping for Sinhala/Vedda script
            sinhala_to_ipa = {
                # Vowels
                'අ': 'ə', 'ආ': 'aː', 'ඇ': 'æ', 'ඈ': 'æː', 'ඉ': 'i', 'ඊ': 'iː', 'උ': 'u', 'ඌ': 'uː',
                'ඍ': 'ru', 'ඎ': 'ruː', 'ඏ': 'lu', 'ඐ': 'luː', 'එ': 'e', 'ඒ': 'eː', 'ඓ': 'ai',
                'ඔ': 'o', 'ඕ': 'oː', 'ඖ': 'au',
                # Consonants (Velar)
                'ක': 'ka', 'ඛ': 'kʰa', 'ග': 'ɡa', 'ඝ': 'ɡʰa', 'ඞ': 'ŋa',
                # Consonants (Palatal)
                'ච': 't͡ʃa', 'ඡ': 't͡ʃʰa', 'ජ': 'd͡ʒa', 'ඣ': 'd͡ʒʰa', 'ඤ': 'ɲa',
                # Consonants (Retroflex)
                'ට': 'ʈa', 'ඨ': 'ʈʰa', 'ඩ': 'ɖa', 'ඪ': 'ɖʰa', 'ණ': 'ɳa',
                # Consonants (Dental)
                'ත': 't̪a', 'ථ': 't̪ʰa', 'ද': 'd̪a', 'ධ': 'd̪ʰa', 'න': 'na',
                # Consonants (Labial)
                'ප': 'pa', 'ඵ': 'pʰa', 'බ': 'ba', 'භ': 'bʰa', 'ම': 'ma',
                # Consonants (Approximants)
                'ය': 'ja', 'ර': 'ra', 'ල': 'la', 'ව': 'ʋa', 
                # Consonants (Sibilants)
                'ශ': 'ʃa', 'ෂ': 'ʂa', 'ස': 'sa', 'හ': 'ha', 'ළ': 'ɭa', 'ෆ': 'fa',
                # Diacritics and modifiers
                'ං': 'ŋ', 'ඃ': 'h', '්': '', 
                'ා': 'aː', 'ැ': 'æ', 'ෑ': 'æː', 
                'ි': 'i', 'ී': 'iː', 'ු': 'u', 'ූ': 'uː',
                'ෘ': 'ru', 'ෲ': 'ruː', 'ෟ': 'lu', 'ෳ': 'luː', 
                'ෙ': 'e', 'ේ': 'eː', 'ෛ': 'ai', 
                'ො': 'o', 'ෝ': 'oː', 'ෞ': 'au'
            }
            
            result = ''
            for char in text:
                result += sinhala_to_ipa.get(char, char)
            
            return result.strip()
        except Exception as e:
            return ''
    
    def generate_singlish_romanization(self, text):
        """Generate Singlish romanization for Vedda/Sinhala text"""
        if not SINLING_AVAILABLE or not text:
            return ''
        try:
            # Singlish romanization mapping
            sinhala_to_singlish = {
                # Vowels
                'අ': 'a', 'ආ': 'aa', 'ඇ': 'ae', 'ඈ': 'aae', 'ඉ': 'i', 'ඊ': 'ii', 'උ': 'u', 'ඌ': 'uu',
                'ඍ': 'ru', 'ඎ': 'ruu', 'ඏ': 'lu', 'ඐ': 'luu', 'එ': 'e', 'ඒ': 'ee', 'ඓ': 'ai',
                'ඔ': 'o', 'ඕ': 'oo', 'ඖ': 'au',
                # Consonants (Velar)
                'ක': 'ka', 'ඛ': 'kha', 'ග': 'ga', 'ඝ': 'gha', 'ඞ': 'nga',
                # Consonants (Palatal)
                'ච': 'cha', 'ඡ': 'chha', 'ජ': 'ja', 'ඣ': 'jha', 'ඤ': 'gna',
                # Consonants (Retroflex)
                'ට': 'ta', 'ඨ': 'tha', 'ඩ': 'da', 'ඪ': 'dha', 'ණ': 'na',
                # Consonants (Dental)
                'ත': 'tha', 'ථ': 'thha', 'ද': 'dha', 'ධ': 'dhha', 'න': 'na',
                # Consonants (Labial)
                'ප': 'pa', 'ඵ': 'pha', 'බ': 'ba', 'භ': 'bha', 'ම': 'ma',
                # Consonants (Approximants)
                'ය': 'ya', 'ර': 'ra', 'ල': 'la', 'ව': 'wa', 
                # Consonants (Sibilants)
                'ශ': 'sha', 'ෂ': 'sha', 'ස': 'sa', 'හ': 'ha', 'ළ': 'la', 'ෆ': 'fa',
                # Diacritics and modifiers
                'ං': 'ng', 'ඃ': 'h', '්': '', 
                'ා': 'aa', 'ැ': 'ae', 'ෑ': 'aae', 
                'ි': 'i', 'ී': 'ii', 'ු': 'u', 'ූ': 'uu',
                'ෘ': 'ru', 'ෲ': 'ruu', 'ෟ': 'lu', 'ෳ': 'luu', 
                'ෙ': 'e', 'ේ': 'ee', 'ෛ': 'ai', 
                'ො': 'o', 'ෝ': 'oo', 'ෞ': 'au'
            }
            
            result = ''
            for char in text:
                result += sinhala_to_singlish.get(char, char)
            
            return result.strip()
        except Exception as e:
            return ''
    
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
        word_sources = []  # Track whether each word came from dictionary or is Sinhala fallback
        dictionary_hits = 0
        
        for sinhala_word in sinhala_words:
            dict_result = self.search_dictionary(sinhala_word, 'sinhala', 'vedda')
            if dict_result and dict_result.get('found'):
                vedda_word = dict_result['translation'].get('vedda', sinhala_word)
                vedda_words.append(vedda_word)
                word_sources.append(('vedda', dict_result['translation']))
                dictionary_hits += 1
            else:
                vedda_words.append(sinhala_word)
                word_sources.append(('sinhala', sinhala_word))
        
        final_text = ' '.join(vedda_words)
        dict_coverage = dictionary_hits / len(sinhala_words) if sinhala_words else 0
        final_confidence = step1_confidence * 0.7 + dict_coverage * 0.3
        
        # Generate source IPA if source is English
        source_ipa = self.generate_english_ipa(text) if source_language == 'english' else ''
        
        # Build target IPA and Singlish by combining dictionary and generated versions
        target_ipa_parts = []
        target_singlish_parts = []
        for i, (source_type, source_data) in enumerate(word_sources):
            if source_type == 'vedda':
                # Word from Vedda dictionary - use vedda_ipa or generate from vedda word
                vedda_word = vedda_words[i]
                vedda_ipa = source_data.get('vedda_ipa', '')
                if not vedda_ipa:
                    # Generate IPA for Vedda word
                    vedda_ipa = self.generate_vedda_sinhala_ipa(vedda_word)
                if vedda_ipa:
                    target_ipa_parts.append(vedda_ipa)
                # Generate Singlish
                singlish = self.generate_singlish_romanization(vedda_word)
                if singlish:
                    target_singlish_parts.append(singlish)
            else:
                # Sinhala fallback word - try dictionary first, then generate
                sinhala_word = source_data
                dict_result = self.search_dictionary(sinhala_word, 'sinhala', 'sinhala')
                if dict_result and dict_result.get('found'):
                    sinhala_ipa = dict_result['translation'].get('sinhala_ipa', '')
                    if sinhala_ipa:
                        target_ipa_parts.append(sinhala_ipa)
                    else:
                        # Generate IPA for Sinhala word
                        generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                        if generated_ipa:
                            target_ipa_parts.append(generated_ipa)
                else:
                    # Generate IPA for Sinhala word
                    generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                    if generated_ipa:
                        target_ipa_parts.append(generated_ipa)
                # Generate Singlish
                singlish = self.generate_singlish_romanization(sinhala_word)
                if singlish:
                    target_singlish_parts.append(singlish)
        
        target_ipa = ' '.join(target_ipa_parts)
        target_singlish = ' '.join(target_singlish_parts)
        
        return {
            'translated_text': final_text,
            'confidence': final_confidence,
            'method': 'sinhala_to_vedda_bridge',
            'source_ipa': source_ipa,
            'target_ipa': target_ipa,
            'target_romanization': target_singlish,
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
                # Get English IPA from dictionary or generate it
                target_ipa = translation.get('english_ipa', '')
                if not target_ipa:
                    target_ipa = self.generate_english_ipa(translation['english'])
                
                # Generate source romanization from vedda word
                source_romanization = self.generate_singlish_romanization(text.strip())
                
                return {
                    'translated_text': translation['english'],
                    'confidence': 0.95,
                    'method': 'vedda_phrase',
                    'source_ipa': translation.get('vedda_ipa', ''),
                    'source_romanization': source_romanization,
                    'target_ipa': target_ipa,
                    'bridge_translation': translation.get('sinhala', ''),
                    'methods_used': ['dictionary', 'phrase_match'],
                    'note': 'Direct phrase match found in dictionary'
                }
            elif target_language == 'sinhala' and translation.get('sinhala'):
                # Get Sinhala IPA from dictionary or generate IPA
                target_ipa = translation.get('sinhala_ipa', '')
                if not target_ipa:
                    target_ipa = self.generate_vedda_sinhala_ipa(translation['sinhala'])
                
                # Generate romanization for both source and target
                source_romanization = self.generate_singlish_romanization(text.strip())
                target_romanization = self.generate_singlish_romanization(translation['sinhala'])
                
                return {
                    'translated_text': translation['sinhala'],
                    'confidence': 0.95,
                    'method': 'vedda_phrase',
                    'source_ipa': translation.get('vedda_ipa', ''),
                    'source_romanization': source_romanization,
                    'target_ipa': target_ipa,
                    'target_romanization': target_romanization,
                    'bridge_translation': translation.get('sinhala', ''),
                    'methods_used': ['dictionary', 'phrase_match'],
                    'note': 'Direct phrase match found in dictionary'
                }
        
        vedda_words = [word.strip() for word in text.split() if word.strip()]
        sinhala_words = []
        word_sources = []  # Track whether each word came from dictionary or is fallback
        dictionary_hits = 0
        
        for vedda_word in vedda_words:
            dict_result = self.search_dictionary(vedda_word, 'vedda', 'sinhala')
            if dict_result and dict_result.get('found'):
                sinhala_word = dict_result['translation'].get('sinhala', vedda_word)
                sinhala_words.append(sinhala_word)
                word_sources.append(('vedda', dict_result['translation']))
                dictionary_hits += 1
            else:
                sinhala_words.append(vedda_word)
                word_sources.append(('sinhala', vedda_word))
        
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
        
        # Build source IPA and Singlish by combining dictionary and generated versions
        source_ipa_parts = []
        source_singlish_parts = []
        for i, (source_type, source_data) in enumerate(word_sources):
            if source_type == 'vedda':
                # Word from Vedda dictionary - use vedda_ipa or generate
                vedda_word = vedda_words[i]
                vedda_ipa = source_data.get('vedda_ipa', '')
                if not vedda_ipa:
                    # Generate IPA for Vedda word
                    vedda_ipa = self.generate_vedda_sinhala_ipa(vedda_word)
                if vedda_ipa:
                    source_ipa_parts.append(vedda_ipa)
                # Generate Singlish
                singlish = self.generate_singlish_romanization(vedda_word)
                if singlish:
                    source_singlish_parts.append(singlish)
            else:
                # Sinhala fallback word - try dictionary first, then generate
                sinhala_word = source_data
                dict_result = self.search_dictionary(sinhala_word, 'sinhala', 'sinhala')
                if dict_result and dict_result.get('found'):
                    sinhala_ipa = dict_result['translation'].get('sinhala_ipa', '')
                    if sinhala_ipa:
                        source_ipa_parts.append(sinhala_ipa)
                    else:
                        # Generate IPA for Sinhala word
                        generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                        if generated_ipa:
                            source_ipa_parts.append(generated_ipa)
                else:
                    # Generate IPA for Sinhala word
                    generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                    if generated_ipa:
                        source_ipa_parts.append(generated_ipa)
                # Generate Singlish
                singlish = self.generate_singlish_romanization(sinhala_word)
                if singlish:
                    source_singlish_parts.append(singlish)
        
        source_ipa = ' '.join(source_ipa_parts)
        source_singlish = ' '.join(source_singlish_parts)
        
        # Generate target IPA based on target language
        if target_language == 'english':
            target_ipa = self.generate_english_ipa(final_text)
        elif target_language == 'sinhala':
            # For Sinhala, build IPA from dictionary or generate
            target_ipa_parts = []
            for sinhala_word in sinhala_words:
                dict_result = self.search_dictionary(sinhala_word, 'sinhala', 'sinhala')
                if dict_result and dict_result.get('found'):
                    sinhala_ipa = dict_result['translation'].get('sinhala_ipa', '')
                    if sinhala_ipa:
                        target_ipa_parts.append(sinhala_ipa)
                    else:
                        # Generate IPA for Sinhala word
                        generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                        if generated_ipa:
                            target_ipa_parts.append(generated_ipa)
                else:
                    # Generate IPA for Sinhala word
                    generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                    if generated_ipa:
                        target_ipa_parts.append(generated_ipa)
            target_ipa = ' '.join(target_ipa_parts)
        else:
            target_ipa = ''
        
        return {
            'translated_text': final_text,
            'confidence': final_confidence,
            'method': 'vedda_to_sinhala_bridge',
            'source_ipa': source_ipa,
            'source_romanization': source_singlish,
            'target_ipa': target_ipa,
            'bridge_translation': sinhala_text,
            'methods_used': ['dictionary', 'google', 'sinhala_bridge'],
            'note': f'Translated via Sinhala bridge. Dictionary coverage: {dictionary_hits}/{len(vedda_words)} words'
        }
    
    def direct_translation(self, text, source_language, target_language):
        """Direct translation for non-Vedda languages"""
        
        result = self.google_translate(text, source_language, target_language)
        if result:
            # Generate IPA for English text
            source_ipa = self.generate_english_ipa(text) if source_language == 'english' else ''
            
            # Generate target IPA and romanization based on target language
            target_romanization = ''
            if target_language == 'english':
                target_ipa = self.generate_english_ipa(result)
            elif target_language == 'sinhala':
                target_ipa = self.generate_vedda_sinhala_ipa(result)
                target_romanization = self.generate_singlish_romanization(result)
            else:
                target_ipa = ''
            
            return {
                'translated_text': result,
                'confidence': 0.85,
                'method': 'google_direct',
                'source_ipa': source_ipa,
                'target_ipa': target_ipa,
                'target_romanization': target_romanization,
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
