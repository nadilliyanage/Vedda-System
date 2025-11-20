import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# MongoDB setup
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://heshan:3UAXaHwpIRwEqK8K@cluster0.quemmhk.mongodb.net/vedda-system?retryWrites=true&w=majority&appName=Cluster0')
DATABASE_NAME = 'vedda-system'

class DictionaryService:
    def __init__(self):
        self.client = MongoClient(MONGODB_URI)
        self.db = self.client[DATABASE_NAME]
        self.dictionary = self.load_dictionary()
    
    def load_dictionary(self):
        """Load dictionary from MongoDB with reverse lookup support"""
        try:
            dictionary = {
                'vedda_to_english': {},
                'english_to_vedda': {},
                'vedda_to_sinhala': {},
                'sinhala_to_vedda': {},
                'all_words': []
            }
            
            # Load all dictionary entries
            cursor = self.db.dictionary.find({})
            
            for doc in cursor:
                vedda_word = doc.get('vedda_word', '').strip()
                english_word = doc.get('english_word', '').strip()
                sinhala_word = doc.get('sinhala_word', '').strip()
                
                if vedda_word and english_word:
                    # Vedda to English mapping
                    dictionary['vedda_to_english'][vedda_word.lower()] = english_word
                    dictionary['english_to_vedda'][english_word.lower()] = vedda_word
                
                if vedda_word and sinhala_word:
                    # Vedda to Sinhala mapping
                    dictionary['vedda_to_sinhala'][vedda_word.lower()] = sinhala_word
                    dictionary['sinhala_to_vedda'][sinhala_word.lower()] = vedda_word
                
                # Add complete word entry
                word_entry = {
                    'id': str(doc['_id']),
                    'vedda_word': vedda_word,
                    'english_word': english_word,
                    'sinhala_word': sinhala_word,
                    'vedda_ipa': doc.get('vedda_ipa', ''),
                    'sinhala_ipa': doc.get('sinhala_ipa', ''),
                    'english_ipa': doc.get('english_ipa', ''),
                    'word_type': doc.get('word_type', ''),
                    'usage_example': doc.get('usage_example', ''),
                    'frequency_score': doc.get('frequency_score', 1.0),
                    'confidence_score': doc.get('confidence_score', 0.95)
                }
                dictionary['all_words'].append(word_entry)
            
            print(f"📚 Loaded {len(dictionary['all_words'])} dictionary entries from MongoDB")
            return dictionary
            
        except Exception as e:
            print(f"❌ Error loading dictionary: {e}")
            return {
                'vedda_to_english': {},
                'english_to_vedda': {},
                'vedda_to_sinhala': {},
                'sinhala_to_vedda': {},
                'all_words': []
            }
    
    def search_dictionary(self, query, source_language='all', target_language='all', limit=50):
        """Search dictionary entries"""
        try:
            # Build MongoDB query
            search_conditions = []
            
            if source_language == 'vedda':
                search_conditions.append({'vedda_word': {'$regex': query, '$options': 'i'}})
            elif source_language == 'english':
                search_conditions.append({'english_word': {'$regex': query, '$options': 'i'}})
            elif source_language == 'sinhala':
                search_conditions.append({'sinhala_word': {'$regex': query, '$options': 'i'}})
            else:
                # Search all languages
                search_conditions.extend([
                    {'vedda_word': {'$regex': query, '$options': 'i'}},
                    {'english_word': {'$regex': query, '$options': 'i'}},
                    {'sinhala_word': {'$regex': query, '$options': 'i'}},
                    {'usage_example': {'$regex': query, '$options': 'i'}}
                ])
            
            query_filter = {'$or': search_conditions} if len(search_conditions) > 1 else search_conditions[0]
            
            # Execute search
            cursor = self.db.dictionary.find(query_filter).limit(limit)
            results = []
            
            for doc in cursor:
                result = {
                    'id': str(doc['_id']),
                    'vedda_word': doc.get('vedda_word', ''),
                    'english_word': doc.get('english_word', ''),
                    'sinhala_word': doc.get('sinhala_word', ''),
                    'vedda_ipa': doc.get('vedda_ipa', ''),
                    'sinhala_ipa': doc.get('sinhala_ipa', ''),
                    'english_ipa': doc.get('english_ipa', ''),
                    'word_type': doc.get('word_type', ''),
                    'usage_example': doc.get('usage_example', ''),
                    'frequency_score': doc.get('frequency_score', 1.0),
                    'confidence_score': doc.get('confidence_score', 0.95)
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            print(f"❌ Search error: {e}")
            return []
    
    def add_word(self, vedda_word, english_word, sinhala_word='', vedda_ipa='', 
                sinhala_ipa='', english_ipa='', word_type='', usage_example=''):
        """Add new word to dictionary"""
        try:
            # Check if word already exists
            existing = self.db.dictionary.find_one({
                'vedda_word': vedda_word,
                'english_word': english_word
            })
            
            if existing:
                return {'success': False, 'error': 'Word already exists'}
            
            # Insert new word
            word_doc = {
                'vedda_word': vedda_word.strip(),
                'english_word': english_word.strip(),
                'sinhala_word': sinhala_word.strip(),
                'vedda_ipa': vedda_ipa.strip(),
                'sinhala_ipa': sinhala_ipa.strip(),
                'english_ipa': english_ipa.strip(),
                'word_type': word_type.strip(),
                'usage_example': usage_example.strip(),
                'frequency_score': 1.0,
                'confidence_score': 0.95,
                'source': 'user_input',
                'created_at': datetime.utcnow(),
                'last_updated': datetime.utcnow()
            }
            
            result = self.db.dictionary.insert_one(word_doc)
            
            # Reload dictionary
            self.dictionary = self.load_dictionary()
            
            return {
                'success': True,
                'id': str(result.inserted_id),
                'message': 'Word added successfully'
            }
            
        except Exception as e:
            print(f"❌ Error adding word: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_random_words(self, count=10, word_type=None):
        """Get random words for quiz/learning"""
        try:
            pipeline = []
            
            # Filter by word type if specified
            if word_type:
                pipeline.append({'$match': {'word_type': word_type}})
            
            # Random sample
            pipeline.append({'$sample': {'size': count}})
            
            cursor = self.db.dictionary.aggregate(pipeline)
            results = []
            
            for doc in cursor:
                result = {
                    'id': str(doc['_id']),
                    'vedda_word': doc.get('vedda_word', ''),
                    'english_word': doc.get('english_word', ''),
                    'sinhala_word': doc.get('sinhala_word', ''),
                    'word_type': doc.get('word_type', ''),
                    'usage_example': doc.get('usage_example', '')
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            print(f"❌ Error getting random words: {e}")
            return []
    
    def get_word_types(self):
        """Get all available word types"""
        try:
            word_types = self.db.dictionary.distinct('word_type')
            return [wt for wt in word_types if wt and wt.strip()]
        except Exception as e:
            print(f"❌ Error getting word types: {e}")
            return []

# Initialize service
dictionary_service = DictionaryService()

@app.route('/api/dictionary/search', methods=['GET'])
def search_dictionary():
    """Search dictionary endpoint"""
    try:
        query = request.args.get('q', '').strip()
        source_language = request.args.get('source', 'all')
        target_language = request.args.get('target', 'all')
        limit = int(request.args.get('limit', 50))
        
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
        
        results = dictionary_service.search_dictionary(
            query, source_language, target_language, limit
        )
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'query': query
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dictionary/add', methods=['POST'])
def add_word():
    """Add new word to dictionary"""
    try:
        data = request.get_json()
        
        vedda_word = data.get('vedda_word', '').strip()
        english_word = data.get('english_word', '').strip()
        
        if not vedda_word or not english_word:
            return jsonify({'error': 'vedda_word and english_word are required'}), 400
        
        result = dictionary_service.add_word(
            vedda_word=vedda_word,
            english_word=english_word,
            sinhala_word=data.get('sinhala_word', ''),
            vedda_ipa=data.get('vedda_ipa', ''),
            sinhala_ipa=data.get('sinhala_ipa', ''),
            english_ipa=data.get('english_ipa', ''),
            word_type=data.get('word_type', ''),
            usage_example=data.get('usage_example', '')
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dictionary/random', methods=['GET'])
def get_random_words():
    """Get random words for learning/quiz"""
    try:
        count = int(request.args.get('count', 10))
        word_type = request.args.get('type', None)
        
        results = dictionary_service.get_random_words(count, word_type)
        
        return jsonify({
            'success': True,
            'words': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dictionary/types', methods=['GET'])
def get_word_types():
    """Get available word types"""
    try:
        types = dictionary_service.get_word_types()
        return jsonify({
            'success': True,
            'types': types
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dictionary/stats', methods=['GET'])
def get_dictionary_stats():
    """Get dictionary statistics"""
    try:
        total_words = dictionary_service.db.dictionary.count_documents({})
        word_types = len(dictionary_service.get_word_types())
        
        # Word type breakdown
        pipeline = [
            {'$group': {'_id': '$word_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        type_breakdown = list(dictionary_service.db.dictionary.aggregate(pipeline))
        
        return jsonify({
            'success': True,
            'stats': {
                'total_words': total_words,
                'word_types': word_types,
                'type_breakdown': [{'type': item['_id'], 'count': item['count']} 
                                 for item in type_breakdown if item['_id']]
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Test MongoDB connection
        dictionary_service.client.admin.command('ping')
        word_count = dictionary_service.db.dictionary.count_documents({})
        
        return jsonify({
            'status': 'healthy',
            'service': 'Dictionary Service (MongoDB)',
            'database': 'connected',
            'word_count': word_count
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'Dictionary Service',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Dictionary Service with MongoDB...")
    print(f"📊 Dictionary loaded with {len(dictionary_service.dictionary['all_words'])} words")
    app.run(debug=True, host='0.0.0.0', port=5002)