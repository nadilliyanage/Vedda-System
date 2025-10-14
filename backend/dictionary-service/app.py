from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database setup
DATABASE = os.path.join('..', '..', 'data', 'vedda_translator.db')

def init_db():
    """Initialize the database with dictionary table"""
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
            frequency_score REAL DEFAULT 1.0,
            confidence_score REAL DEFAULT 0.95,
            last_updated TIMESTAMP,
            source TEXT DEFAULT 'manual',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

class DictionaryService:
    def __init__(self):
        self.dictionary = self.load_dictionary()
    
    def load_dictionary(self):
        """Load dictionary from database with reverse lookup support"""
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('SELECT vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, english_ipa FROM dictionary')
        rows = cursor.fetchall()
        conn.close()
        
        dictionary = {}
        english_to_vedda = {}
        english_to_sinhala = {}
        
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
        
        return {
            'vedda_to_others': dictionary,
            'english_to_vedda': english_to_vedda,
            'english_to_sinhala': english_to_sinhala
        }
    
    def search_word(self, word, source_lang='vedda', target_lang='english'):
        """Search for a word in the dictionary"""
        word_lower = word.lower()
        
        if source_lang == 'vedda':
            return self.dictionary['vedda_to_others'].get(word_lower)
        elif source_lang == 'english' and target_lang == 'vedda':
            return self.dictionary['english_to_vedda'].get(word_lower)
        elif source_lang == 'english' and target_lang == 'sinhala':
            return self.dictionary['english_to_sinhala'].get(word_lower)
        
        return None
    
    def add_word(self, vedda_word, sinhala_word=None, english_word=None, 
                 vedda_ipa=None, sinhala_ipa=None, english_ipa=None,
                 word_type=None, usage_example=None):
        """Add a new word to the dictionary"""
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO dictionary 
                (vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, english_ipa, word_type, usage_example)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, english_ipa, word_type, usage_example))
            
            conn.commit()
            word_id = cursor.lastrowid
            conn.close()
            
            # Reload dictionary
            self.dictionary = self.load_dictionary()
            
            return word_id
        except Exception as e:
            return None
    
    def get_all_words(self, limit=100, offset=0):
        """Get all words from dictionary with pagination"""
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT vedda_word, sinhala_word, english_word, vedda_ipa, sinhala_ipa, english_ipa, word_type, usage_example
            FROM dictionary 
            ORDER BY vedda_word 
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        words = []
        for row in rows:
            words.append({
                'vedda_word': row[0],
                'sinhala_word': row[1],
                'english_word': row[2],
                'vedda_ipa': row[3],
                'sinhala_ipa': row[4],
                'english_ipa': row[5],
                'word_type': row[6],
                'usage_example': row[7]
            })
        
        return words

# Initialize database and service
init_db()
dictionary_service = DictionaryService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'dictionary-service',
        'timestamp': datetime.now().isoformat(),
        'dictionary_size': len(dictionary_service.dictionary['vedda_to_others'])
    })

@app.route('/api/dictionary/search', methods=['GET'])
def search_word():
    """Search for a word in the dictionary"""
    word = request.args.get('word', '').strip()
    source_lang = request.args.get('source', 'vedda')
    target_lang = request.args.get('target', 'english')
    
    if not word:
        return jsonify({'error': 'Word parameter is required'}), 400
    
    result = dictionary_service.search_word(word, source_lang, target_lang)
    
    if result:
        return jsonify({
            'found': True,
            'word': word,
            'translation': result,
            'source_language': source_lang,
            'target_language': target_lang
        })
    else:
        return jsonify({
            'found': False,
            'word': word,
            'source_language': source_lang,
            'target_language': target_lang
        })

@app.route('/api/dictionary', methods=['GET'])
def get_dictionary():
    """Get dictionary words with pagination"""
    limit = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))
    
    words = dictionary_service.get_all_words(limit, offset)
    
    return jsonify({
        'words': words,
        'limit': limit,
        'offset': offset,
        'total_count': len(dictionary_service.dictionary['vedda_to_others'])
    })

@app.route('/api/dictionary/add', methods=['POST'])
def add_word():
    """Add a new word to the dictionary"""
    data = request.get_json()
    
    if not data or 'vedda_word' not in data:
        return jsonify({'error': 'vedda_word is required'}), 400
    
    word_id = dictionary_service.add_word(
        vedda_word=data['vedda_word'],
        sinhala_word=data.get('sinhala_word'),
        english_word=data.get('english_word'),
        vedda_ipa=data.get('vedda_ipa'),
        sinhala_ipa=data.get('sinhala_ipa'),
        english_ipa=data.get('english_ipa'),
        word_type=data.get('word_type'),
        usage_example=data.get('usage_example')
    )
    
    if word_id:
        return jsonify({
            'success': True,
            'word_id': word_id,
            'message': 'Word added successfully'
        }), 201
    else:
        return jsonify({'error': 'Failed to add word'}), 500

@app.route('/api/dictionary/stats', methods=['GET'])
def get_stats():
    """Get dictionary statistics"""
    vedda_count = len(dictionary_service.dictionary['vedda_to_others'])
    english_count = len(dictionary_service.dictionary['english_to_vedda'])
    
    return jsonify({
        'total_vedda_words': vedda_count,
        'total_english_mappings': english_count,
        'service_status': 'active'
    })

if __name__ == '__main__':
    init_db()
    print("Starting Dictionary Service on port 5002...")
    app.run(host='0.0.0.0', port=5002, debug=True)