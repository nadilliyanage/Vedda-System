from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime
import requests
import urllib.parse

app = Flask(__name__)
CORS(app)

# Database setup
DATABASE = os.path.join('..', 'data', 'vedda_translator.db')

# Google Translate API configuration (using free endpoint)
GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"

def init_db():
    """Initialize the database with necessary tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Dictionary table for word mappings
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dictionary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vedda_word TEXT NOT NULL,
            sinhala_word TEXT,
            english_word TEXT,
            vedda_ipa TEXT,
            sinhala_ipa TEXT,
            english_ipa TEXT,
            word_type TEXT,
            usage_example TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Translation history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS translation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input_text TEXT NOT NULL,
            output_text TEXT NOT NULL,
            source_language TEXT NOT NULL,
            target_language TEXT NOT NULL,
            translation_method TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # User feedback table for improvements
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_text TEXT NOT NULL,
            suggested_translation TEXT NOT NULL,
            current_translation TEXT,
            feedback_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

class VeddaTranslator:
    def __init__(self):
        self.dictionary = self.load_dictionary()
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
    
    def load_dictionary(self):
        """Load dictionary from database with reverse lookup support"""
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, english_ipa FROM dictionary')
        rows = cursor.fetchall()
        conn.close()
        
        dictionary = {}
        english_to_vedda = {}  # Reverse lookup for English to Vedda
        english_to_sinhala = {}  # Reverse lookup for English to Sinhala
        
        for row in rows:
            vedda, sinhala, english, vedda_ipa, sinhala_ipa, english_ipa = row
            
            # Vedda word as key (original dictionary)
            dictionary[vedda.lower()] = {
                'sinhala': sinhala,
                'english': english,
                'vedda_ipa': vedda_ipa,
                'sinhala_ipa': sinhala_ipa,
                'english_ipa': english_ipa
            }
            
            # English word as key (reverse lookup)
            if english:
                english_to_vedda[english.lower()] = {
                    'vedda': vedda,
                    'sinhala': sinhala,
                    'vedda_ipa': vedda_ipa,
                    'sinhala_ipa': sinhala_ipa,
                    'english_ipa': english_ipa
                }
                english_to_sinhala[english.lower()] = {
                    'sinhala': sinhala,
                    'sinhala_ipa': sinhala_ipa
                }
        
        self.english_to_vedda = english_to_vedda
        self.english_to_sinhala = english_to_sinhala
        return dictionary
    
    def call_google_translate(self, text, source_lang, target_lang):
        """Call Google Translate using requests"""
        try:
            # Google Translate API parameters
            params = {
                'client': 'gtx',
                'sl': source_lang,
                'tl': target_lang,
                'dt': 't',
                'q': text
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(GOOGLE_TRANSLATE_URL, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                # Parse the Google Translate response
                if result and len(result) > 0 and len(result[0]) > 0:
                    translated_text = ''.join([part[0] for part in result[0] if part[0]])
                    return {
                        'text': translated_text,
                        'confidence': 0.95,  # Default confidence
                        'method': 'google_translate'
                    }
            
            return None
            
        except Exception as e:
            print(f"Google Translate API error: {e}")
            return None
    
    def use_google_translate(self, text, source_lang, target_lang):
        """Use Google Translate for non-Vedda translations"""
        try:
            # Convert our language codes to Google Translate codes
            source_code = self.supported_languages.get(source_lang, source_lang)
            target_code = self.supported_languages.get(target_lang, target_lang)
            
            # Skip if source is Vedda but target is not supported
            if source_lang == 'vedda' and target_lang not in self.supported_languages:
                return None
                
            # Skip if target is Vedda but source is not supported  
            if target_lang == 'vedda' and source_lang not in self.supported_languages:
                return None
            
            # Use Google Translate for supported language pairs (excluding Vedda)
            if source_lang != 'vedda' and target_lang != 'vedda':
                return self.call_google_translate(text, source_code, target_code)
            
            return None
            
        except Exception as e:
            print(f"Google Translate error: {e}")
            return None
    
    def translate_via_bridge_language(self, text, source_lang, target_lang):
        """Translate via English as bridge language"""
        try:
            # If source is Vedda, translate to English first, then to target
            if source_lang == 'vedda' and target_lang not in ['vedda', 'sinhala', 'english']:
                english_result = self.translate_text(text, 'vedda', 'english', include_ipa=False)
                if english_result and english_result['translated_text']:
                    google_result = self.use_google_translate(
                        english_result['translated_text'], 
                        'english', 
                        target_lang
                    )
                    if google_result:
                        return {
                            'text': google_result['text'],
                            'method': 'vedda_to_english_to_target',
                            'bridge_translation': english_result['translated_text']
                        }
            
            # If target is Vedda, translate source to English first, then to Vedda
            elif target_lang == 'vedda' and source_lang not in ['vedda', 'sinhala', 'english']:
                google_result = self.use_google_translate(text, source_lang, 'english')
                if google_result:
                    vedda_result = self.translate_text(
                        google_result['text'], 
                        'english', 
                        'vedda', 
                        include_ipa=False
                    )
                    if vedda_result and vedda_result['translated_text']:
                        return {
                            'text': vedda_result['translated_text'],
                            'method': 'source_to_english_to_vedda',
                            'bridge_translation': google_result['text']
                        }
            
            return None
            
        except Exception as e:
            print(f"Bridge translation error: {e}")
            return None
    
    def translate_word(self, word, target_language='english', source_language='vedda'):
        """Translate a single word with enhanced logic for multiple source languages"""
        word_lower = word.lower()
        
        # Handle English to Vedda translation
        if source_language == 'english' and target_language == 'vedda':
            if word_lower in self.english_to_vedda:
                entry = self.english_to_vedda[word_lower]
                return {
                    'text': entry['vedda'],
                    'ipa': entry['vedda_ipa'],
                    'source_ipa': entry['english_ipa'],
                    'method': 'english_to_vedda_direct'
                }
            else:
                # If no Vedda translation found, return Sinhala translation
                if word_lower in self.english_to_sinhala:
                    entry = self.english_to_sinhala[word_lower]
                    return {
                        'text': entry['sinhala'],
                        'ipa': entry['sinhala_ipa'],
                        'source_ipa': entry['english_ipa'],
                        'method': 'english_to_sinhala_fallback'
                    }
                else:
                    # Use Google Translate to get Sinhala translation
                    sinhala_result = self.call_google_translate(word, 'en', 'si')
                    if sinhala_result:
                        return {
                            'text': sinhala_result['text'],
                            'ipa': None,
                            'source_ipa': None,
                            'method': 'english_to_sinhala_google'
                        }
                    else:
                        return {
                            'text': word,
                            'ipa': None,
                            'source_ipa': None,
                            'method': 'unknown'
                        }
        
        # Handle English to other languages (not Vedda)
        elif source_language == 'english' and target_language != 'vedda':
            google_result = self.call_google_translate(word, 'en', self.supported_languages.get(target_language, target_language))
            if google_result:
                return {
                    'text': google_result['text'],
                    'ipa': None,
                    'source_ipa': None,
                    'method': 'google_translate'
                }
            else:
                return {
                    'text': word,
                    'ipa': None,
                    'source_ipa': None,
                    'method': 'unknown'
                }
        
        # Handle Vedda to other languages (original logic)
        elif source_language == 'vedda':
            if word_lower in self.dictionary:
                entry = self.dictionary[word_lower]
                translation = entry.get(target_language)
                ipa = entry.get(f'{target_language}_ipa')
                source_ipa = entry.get('vedda_ipa')
                
                if translation:
                    return {
                        'text': translation,
                        'ipa': ipa,
                        'source_ipa': source_ipa,
                        'method': 'dictionary'
                    }
                else:
                    # Fallback to Sinhala if target language not available
                    return {
                        'text': entry.get('sinhala', word),
                        'ipa': entry.get('sinhala_ipa'),
                        'source_ipa': source_ipa,
                        'method': 'vedda_fallback'
                    }
            else:
                # If word not found in Vedda dictionary, treat it as Sinhala word
                if target_language != 'sinhala':
                    # Try to translate from Sinhala to target language using Google Translate
                    sinhala_result = self.call_google_translate(word, 'si', self.supported_languages.get(target_language, target_language))
                    if sinhala_result:
                        return {
                            'text': sinhala_result['text'],
                            'ipa': None,
                            'source_ipa': None,
                            'method': 'sinhala_to_target'
                        }
                
                # If target is Sinhala or Google Translate failed, return as-is (Sinhala word)
                return {
                    'text': word,
                    'ipa': None,
                    'source_ipa': None,
                    'method': 'sinhala_word'
                }
        
        # Handle other language pairs using Google Translate
        else:
            google_result = self.call_google_translate(word, 
                                                     self.supported_languages.get(source_language, source_language),
                                                     self.supported_languages.get(target_language, target_language))
            if google_result:
                return {
                    'text': google_result['text'],
                    'ipa': None,
                    'method': 'google_translate'
                }
            else:
                return {
                    'text': word,
                    'ipa': None,
                    'method': 'unknown'
                }
    
    def translate_text(self, text, source_lang='vedda', target_lang='english', include_ipa=False):
        """Enhanced translate text with Google Translate integration"""
        
        # Handle direct Google Translate for non-Vedda language pairs
        if source_lang != 'vedda' and target_lang != 'vedda':
            google_result = self.use_google_translate(text, source_lang, target_lang)
            if google_result:
                result = {
                    'translated_text': google_result['text'],
                    'original_text': text,
                    'source_language': source_lang,
                    'target_language': target_lang,
                    'translation_methods': [google_result['method']],
                    'word_count': len(text.split()),
                    'confidence': google_result.get('confidence')
                }
                return result
        
        # Handle bridge translations (via English)
        bridge_result = self.translate_via_bridge_language(text, source_lang, target_lang)
        if bridge_result:
            result = {
                'translated_text': bridge_result['text'],
                'original_text': text,
                'source_language': source_lang,
                'target_language': target_lang,
                'translation_methods': [bridge_result['method']],
                'word_count': len(text.split()),
                'bridge_translation': bridge_result.get('bridge_translation')
            }
            return result
        
        # Original Vedda dictionary-based translation with enhanced Sinhala handling
        words = text.split()
        translated_words = []
        target_ipa_transcriptions = []
        source_ipa_transcriptions = []
        translation_methods = []
        sinhala_words = []  # Track words treated as Sinhala
        
        for word in words:
            # Remove punctuation for translation but keep it
            clean_word = word.strip('.,!?;:"')
            punctuation = word[len(clean_word):]
            
            translation_result = self.translate_word(clean_word, target_lang, source_lang)
            translated_words.append(translation_result['text'] + punctuation)
            target_ipa_transcriptions.append(translation_result['ipa'])
            source_ipa_transcriptions.append(translation_result['source_ipa'])
            translation_methods.append(translation_result['method'])
            
            # Track Sinhala words for potential batch translation
            if translation_result['method'] in ['sinhala_word', 'sinhala_to_target']:
                sinhala_words.append(clean_word)
        
        # If we have many Sinhala words and target is not Sinhala, 
        # try batch translation for better context
        if len(sinhala_words) > 2 and target_lang != 'sinhala' and source_lang == 'vedda':
            # Try translating the full text as Sinhala for better context
            full_sinhala_result = self.use_google_translate(text, 'sinhala', target_lang)
            if full_sinhala_result:
                result = {
                    'translated_text': full_sinhala_result['text'],
                    'original_text': text,
                    'source_language': source_lang,
                    'target_language': target_lang,
                    'translation_methods': ['vedda_as_sinhala_batch'],
                    'word_count': len(words),
                    'confidence': full_sinhala_result.get('confidence'),
                    'sinhala_words_detected': len(sinhala_words),
                    'note': 'Text treated as Sinhala due to Vedda-Sinhala similarity'
                }
                return result
        
        result = {
            'translated_text': ' '.join(translated_words),
            'original_text': text,
            'source_language': source_lang,
            'target_language': target_lang,
            'translation_methods': translation_methods,
            'word_count': len(words),
            'sinhala_words_detected': len(sinhala_words)
        }
        
        if include_ipa:
            # Filter out None values and join with spaces
            valid_target_ipa = [ipa for ipa in target_ipa_transcriptions if ipa]
            valid_source_ipa = [ipa for ipa in source_ipa_transcriptions if ipa]
            result['target_ipa_transcription'] = ' '.join(valid_target_ipa) if valid_target_ipa else None
            result['source_ipa_transcription'] = ' '.join(valid_source_ipa) if valid_source_ipa else None
            result['ipa_transcription'] = result['target_ipa_transcription']  # Backward compatibility
            result['word_target_ipa_list'] = target_ipa_transcriptions
            result['word_source_ipa_list'] = source_ipa_transcriptions
        
        return result
        
        return result

# Initialize translator
translator = VeddaTranslator()

@app.route('/')
def home():
    return jsonify({
        'message': 'Vedda Language Translator API with Google Translate Integration',
        'version': '2.0.0',
        'endpoints': {
            'translate': '/api/translate',
            'dictionary': '/api/dictionary',
            'history': '/api/history',
            'languages': '/api/languages'
        }
    })

@app.route('/api/languages', methods=['GET'])
def get_supported_languages():
    """Get list of all supported languages"""
    return jsonify({
        'languages': [
            {'code': 'vedda', 'name': 'Vedda', 'native': 'වැද්දා', 'flag': 'VE'},
            {'code': 'sinhala', 'name': 'Sinhala', 'native': 'සිංහල', 'flag': '🇱🇰'},
            {'code': 'english', 'name': 'English', 'native': 'English', 'flag': '🇺🇸'},
            {'code': 'tamil', 'name': 'Tamil', 'native': 'தமிழ்', 'flag': '🇮🇳'},
            {'code': 'hindi', 'name': 'Hindi', 'native': 'हिन्दी', 'flag': '🇮🇳'},
            {'code': 'chinese', 'name': 'Chinese', 'native': '中文', 'flag': '🇨🇳'},
            {'code': 'japanese', 'name': 'Japanese', 'native': '日本語', 'flag': '🇯🇵'},
            {'code': 'korean', 'name': 'Korean', 'native': '한국어', 'flag': '🇰🇷'},
            {'code': 'french', 'name': 'French', 'native': 'Français', 'flag': '🇫🇷'},
            {'code': 'german', 'name': 'German', 'native': 'Deutsch', 'flag': '🇩🇪'},
            {'code': 'spanish', 'name': 'Spanish', 'native': 'Español', 'flag': '🇪🇸'},
            {'code': 'italian', 'name': 'Italian', 'native': 'Italiano', 'flag': '🇮🇹'},
            {'code': 'portuguese', 'name': 'Portuguese', 'native': 'Português', 'flag': '🇵🇹'},
            {'code': 'russian', 'name': 'Russian', 'native': 'Русский', 'flag': '🇷🇺'},
            {'code': 'arabic', 'name': 'Arabic', 'native': 'العربية', 'flag': '🇸🇦'},
            {'code': 'dutch', 'name': 'Dutch', 'native': 'Nederlands', 'flag': '🇳🇱'},
            {'code': 'swedish', 'name': 'Swedish', 'native': 'Svenska', 'flag': '🇸🇪'},
            {'code': 'norwegian', 'name': 'Norwegian', 'native': 'Norsk', 'flag': '🇳🇴'},
            {'code': 'danish', 'name': 'Danish', 'native': 'Dansk', 'flag': '🇩🇰'},
            {'code': 'finnish', 'name': 'Finnish', 'native': 'Suomi', 'flag': '🇫🇮'},
            {'code': 'thai', 'name': 'Thai', 'native': 'ไทย', 'flag': '🇹🇭'},
            {'code': 'vietnamese', 'name': 'Vietnamese', 'native': 'Tiếng Việt', 'flag': '🇻🇳'},
            {'code': 'turkish', 'name': 'Turkish', 'native': 'Türkçe', 'flag': '🇹🇷'}
        ],
        'total_languages': 23,
        'vedda_supported': True,
        'google_translate_integration': True
    })

@app.route('/api/translate', methods=['POST'])
def translate():
    try:
        data = request.get_json()
        text = data.get('text', '')
        source_lang = data.get('source_language', 'vedda')
        target_lang = data.get('target_language', 'english')
        include_ipa = data.get('include_ipa', False)
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        result = translator.translate_text(text, source_lang, target_lang, include_ipa)
        
        # Save to history
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO translation_history 
            (input_text, output_text, source_language, target_language, translation_method)
            VALUES (?, ?, ?, ?, ?)
        ''', (text, result['translated_text'], source_lang, target_lang, 'dictionary_based'))
        conn.commit()
        conn.close()
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dictionary', methods=['GET', 'POST'])
def dictionary():
    if request.method == 'GET':
        # Get all dictionary entries
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM dictionary ORDER BY vedda_word')
        rows = cursor.fetchall()
        conn.close()
        
        entries = []
        for row in rows:
            entries.append({
                'id': row[0],
                'vedda_word': row[1],
                'sinhala_word': row[2],
                'english_word': row[3],
                'vedda_ipa': row[4],
                'sinhala_ipa': row[5],
                'english_ipa': row[6],
                'word_type': row[7],
                'usage_example': row[8],
                'created_at': row[9]
            })
        
        return jsonify({'dictionary': entries, 'count': len(entries)})
    
    elif request.method == 'POST':
        # Add new dictionary entry
        try:
            data = request.get_json()
            vedda_word = data.get('vedda_word', '').strip()
            sinhala_word = data.get('sinhala_word', '').strip()
            english_word = data.get('english_word', '').strip()
            vedda_ipa = data.get('vedda_ipa', '').strip()
            sinhala_ipa = data.get('sinhala_ipa', '').strip()
            english_ipa = data.get('english_ipa', '').strip()
            word_type = data.get('word_type', '').strip()
            usage_example = data.get('usage_example', '').strip()
            
            if not vedda_word:
                return jsonify({'error': 'Vedda word is required'}), 400
            
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO dictionary 
                (vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, english_ipa, word_type, usage_example)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, english_ipa, word_type, usage_example))
            conn.commit()
            conn.close()
            
            # Reload dictionary
            translator.dictionary = translator.load_dictionary()
            
            return jsonify({'message': 'Dictionary entry added successfully'})
        
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def history():
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM translation_history 
            ORDER BY created_at DESC 
            LIMIT 100
        ''')
        rows = cursor.fetchall()
        conn.close()
        
        history_entries = []
        for row in rows:
            history_entries.append({
                'id': row[0],
                'input_text': row[1],
                'output_text': row[2],
                'source_language': row[3],
                'target_language': row[4],
                'translation_method': row[5],
                'created_at': row[6]
            })
        
        return jsonify({'history': history_entries})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dictionary/stats', methods=['GET'])
def get_dictionary_stats():
    """Get dictionary statistics"""
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data'))
        from csv_data_manager import VeddaDataManager
        
        manager = VeddaDataManager()
        stats = manager.get_statistics()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dictionary/update', methods=['POST'])
def update_dictionary_from_csv():
    """Update dictionary from CSV file"""
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data'))
        from csv_data_manager import VeddaDataManager
        
        # Get CSV file path from request
        data = request.get_json()
        csv_file = data.get('csv_file', os.path.join('..', 'data', 'vedda_dictionary.csv'))
        
        manager = VeddaDataManager(csv_file)
        success = manager.import_csv_to_database()
        
        if success:
            # Reload the translator's dictionary
            global translator
            translator = VeddaTranslator()
            
            stats = manager.get_statistics()
            return jsonify({
                'success': True,
                'message': 'Dictionary updated successfully',
                'stats': stats
            })
        else:
            return jsonify({'success': False, 'message': 'Failed to update dictionary'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/dictionary/export', methods=['GET'])
def export_dictionary_to_csv():
    """Export current dictionary to CSV"""
    try:
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'data'))
        from csv_data_manager import VeddaDataManager
        
        manager = VeddaDataManager()
        output_file = manager.export_database_to_csv()
        
        return jsonify({
            'success': True,
            'message': 'Dictionary exported successfully',
            'file': output_file
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
def feedback():
    try:
        data = request.get_json()
        original_text = data.get('original_text', '')
        suggested_translation = data.get('suggested_translation', '')
        current_translation = data.get('current_translation', '')
        feedback_type = data.get('feedback_type', 'correction')
        
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO user_feedback 
            (original_text, suggested_translation, current_translation, feedback_type)
            VALUES (?, ?, ?, ?)
        ''', (original_text, suggested_translation, current_translation, feedback_type))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Feedback submitted successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)