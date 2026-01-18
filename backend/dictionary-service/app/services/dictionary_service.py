import logging
from datetime import datetime, timezone
from bson import ObjectId
from app.db.mongo import get_db, dictionary_collection
import pandas as pd
from typing import Dict, List, Optional
from collections import OrderedDict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LRUCache:
    """Simple LRU cache implementation"""
    def __init__(self, maxsize=1000):
        self.cache = OrderedDict()
        self.maxsize = maxsize
        self.hits = 0
        self.misses = 0
    
    def get(self, key):
        if key in self.cache:
            self.hits += 1
            self.cache.move_to_end(key)
            return self.cache[key]
        self.misses += 1
        return None
    
    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        else:
            self.cache[key] = value
            if len(self.cache) > self.maxsize:
                self.cache.popitem(last=False)
    
    def clear(self):
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def info(self):
        return {
            'hits': self.hits,
            'misses': self.misses,
            'size': len(self.cache),
            'maxsize': self.maxsize
        }


class DictionaryService:
    def __init__(self):
        self.db = get_db()
        self.dictionary = self.load_dictionary()
        self.translation_cache = LRUCache(maxsize=1000)
        self._build_fast_indexes()
        print(f"✅ Dictionary Service initialized - {len(self.dictionary['all_words'])} entries loaded")
        print(f"✅ Fast indexes built - O(1) lookup enabled")
    
    def load_dictionary(self):
        """Load dictionary from MongoDB with reverse lookup support - OPTIMIZED"""
        try:
            dictionary = {
                'vedda_to_english': {},
                'english_to_vedda': {},
                'vedda_to_sinhala': {},
                'sinhala_to_vedda': {},
                'english_to_sinhala': {},
                'sinhala_to_english': {},
                'all_words': [],
                'word_map': {}  # Fast O(1) lookup by ID
            }
            
            # Load all dictionary entries in one batch
            cursor = dictionary_collection().find({}, {
                '_id': 1,
                'vedda_word': 1,
                'english_word': 1,
                'sinhala_word': 1,
                'vedda_ipa': 1,
                'sinhala_ipa': 1,
                'english_ipa': 1,
                'word_type': 1,
                'usage_example': 1,
                'frequency_score': 1,
                'confidence_score': 1
            })
            
            for doc in cursor:
                vedda_word = doc.get('vedda_word', '').strip()
                english_word = doc.get('english_word', '').strip()
                sinhala_word = doc.get('sinhala_word', '').strip()
                
                # Create complete word entry
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
                
                # Build fast lookup indexes (lowercase for case-insensitive search)
                if vedda_word and english_word:
                    vedda_lower = vedda_word.lower()
                    english_lower = english_word.lower()
                    dictionary['vedda_to_english'][vedda_lower] = word_entry
                    dictionary['english_to_vedda'][english_lower] = word_entry
                
                if vedda_word and sinhala_word:
                    vedda_lower = vedda_word.lower()
                    sinhala_lower = sinhala_word.lower()
                    dictionary['vedda_to_sinhala'][vedda_lower] = word_entry
                    dictionary['sinhala_to_vedda'][sinhala_lower] = word_entry
                
                if english_word and sinhala_word:
                    english_lower = english_word.lower()
                    sinhala_lower = sinhala_word.lower()
                    dictionary['english_to_sinhala'][english_lower] = word_entry
                    dictionary['sinhala_to_english'][sinhala_lower] = word_entry
                
                dictionary['all_words'].append(word_entry)
                dictionary['word_map'][str(doc['_id'])] = word_entry
            
            print(f"Loaded {len(dictionary['all_words'])} dictionary entries from MongoDB")
            return dictionary
            
        except Exception as e:
            print(f"❌ Error loading dictionary: {e}")
            return {
                'vedda_to_english': {},
                'english_to_vedda': {},
                'vedda_to_sinhala': {},
                'sinhala_to_vedda': {},
                'english_to_sinhala': {},
                'sinhala_to_english': {},
                'all_words': [],
                'word_map': {}
            }
    
    def _build_fast_indexes(self):
        """Build additional fast lookup indexes for common queries"""
        self.word_type_index = {}
        for word in self.dictionary['all_words']:
            word_type = word.get('word_type', 'unknown')
            if word_type not in self.word_type_index:
                self.word_type_index[word_type] = []
            self.word_type_index[word_type].append(word)
    
    def fast_translate(self, word: str, source_lang: str, target_lang: str) -> Optional[Dict]:
        """Ultra-fast O(1) translation lookup with LRU cache"""
        word_lower = word.lower().strip()
        cache_key = f"{word_lower}:{source_lang}:{target_lang}"
        
        # Check cache first
        cached_result = self.translation_cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Direct dictionary lookup based on language pair
        lookup_key = f"{source_lang}_to_{target_lang}"
        lookup_dict = self.dictionary.get(lookup_key, {})
        
        result = lookup_dict.get(word_lower, None)
        
        # Cache the result (even if None)
        self.translation_cache.put(cache_key, result)
        
        return result
    
    def search_dictionary(self, query, source_language='all', target_language='all', limit=50):
        """OPTIMIZED: Memory-based search with fast filtering"""
        try:
            query_lower = query.lower().strip()
            results = []
            
            # Fast exact match first (O(1) lookup)
            if source_language != 'all':
                exact_match = self.fast_translate(query, source_language, target_language)
                if exact_match:
                    return [exact_match]
            
            # Fast filtering using in-memory dictionary
            if source_language == 'vedda':
                results = [entry for entry in self.dictionary['all_words']
                          if query_lower in entry['vedda_word'].lower()]
            elif source_language == 'english':
                results = [entry for entry in self.dictionary['all_words']
                          if query_lower in entry['english_word'].lower()]
            elif source_language == 'sinhala':
                results = [entry for entry in self.dictionary['all_words']
                          if query_lower in entry['sinhala_word'].lower()]
            else:
                # Search all languages
                results = [entry for entry in self.dictionary['all_words']
                          if (query_lower in entry['vedda_word'].lower() or
                              query_lower in entry['english_word'].lower() or
                              query_lower in entry['sinhala_word'].lower() or
                              query_lower in entry.get('usage_example', '').lower())]
            
            # Sort by relevance (exact match first, then by frequency)
            results.sort(key=lambda x: (
                not (x['vedda_word'].lower() == query_lower or
                     x['english_word'].lower() == query_lower or
                     x['sinhala_word'].lower() == query_lower),
                -x['frequency_score']
            ))
            
            return results[:limit]
            
        except Exception as e:
            print(f"❌ Search error: {e}")
            return []
    
    def add_word(self, vedda_word, english_word, sinhala_word='', vedda_ipa='', 
                sinhala_ipa='', english_ipa='', word_type='', usage_example=''):
        """Add new word to dictionary"""
        try:
            # Check if word already exists (all three fields must match)
            existing = dictionary_collection().find_one({
                'vedda_word': vedda_word,
                'sinhala_word': sinhala_word,
                'english_word': english_word
            })
            
            if existing:
                # Delete the duplicate and add the new one
                dictionary_collection().delete_one({'_id': existing['_id']})
            
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
            
            result = dictionary_collection().insert_one(word_doc)
            
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
        """OPTIMIZED: Get random words using in-memory data"""
        try:
            import random
            
            if word_type:
                # Use pre-built index
                words = self.word_type_index.get(word_type, [])
            else:
                words = self.dictionary['all_words']
            
            if not words:
                return []
            
            # Fast random sampling
            sample_size = min(count, len(words))
            return random.sample(words, sample_size)
            
        except Exception as e:
            print(f"❌ Error getting random words: {e}")
            return []
    
    def clear_cache(self):
        """Clear LRU cache for fast_translate"""
        self.translation_cache.clear()
        print("✅ Translation cache cleared")
    
    def get_cache_info(self):
        """Get cache statistics"""
        return self.translation_cache.info()
    
    def get_word_types(self):
        """Get all available word types"""
        try:
            word_types = dictionary_collection().distinct('word_type')
            return [wt for wt in word_types if wt and wt.strip()]
        except Exception as e:
            print(f"❌ Error getting word types: {e}")
            return []
    
    def get_all_words(self, limit=0, offset=0):
        """Get all dictionary words with pagination"""
        try:
            if limit > 0:
                cursor = dictionary_collection().find({}).skip(offset).limit(limit)
            else:
                cursor = dictionary_collection().find({}).skip(offset)
            results = []
            
            for doc in cursor:
                results.append({
                    'id': str(doc['_id']),
                    'vedda_word': doc.get('vedda_word', ''),
                    'sinhala_word': doc.get('sinhala_word', ''),
                    'english_word': doc.get('english_word', ''),
                    'vedda_ipa': doc.get('vedda_ipa', ''),
                    'sinhala_ipa': doc.get('sinhala_ipa', ''),
                    'english_ipa': doc.get('english_ipa', ''),
                    'word_type': doc.get('word_type', ''),
                    'usage_example': doc.get('usage_example', ''),
                    'confidence_score': doc.get('confidence_score', 0.95),
                    'frequency_score': doc.get('frequency_score', 1.0)
                })
            
            total_count = dictionary_collection().count_documents({})
            
            return {
                'results': results,
                'count': len(results),
                'total_count': total_count,
                'limit': limit,
                'offset': offset
            }
            
        except Exception as e:
            print(f"❌ Error getting all words: {e}")
            return {'results': [], 'count': 0, 'total_count': 0}
    
    def get_statistics(self):
        """Get dictionary statistics"""
        try:
            total_words = dictionary_collection().count_documents({})
            word_types = len(self.get_word_types())
            
            # Word type breakdown
            pipeline = [
                {'$group': {'_id': '$word_type', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ]
            type_breakdown = list(dictionary_collection().aggregate(pipeline))
            
            return {
                'total_words': total_words,
                'word_types': word_types,
                'type_breakdown': [
                    {'type': item['_id'], 'count': item['count']} 
                    for item in type_breakdown if item['_id']
                ]
            }
            
        except Exception as e:
            print(f"❌ Error getting statistics: {e}")
            return {}
    
    def update_word(self, word_id, update_data):
        """Update a dictionary word"""
        try:
            # Validate ObjectId
            try:
                object_id = ObjectId(word_id)
            except:
                return {'success': False, 'error': 'Invalid word ID'}
            
            # Prepare update
            valid_fields = ['vedda_word', 'sinhala_word', 'english_word', 'vedda_ipa', 
                          'sinhala_ipa', 'english_ipa', 'word_type', 'usage_example']
            
            update_fields = {}
            for field in valid_fields:
                if field in update_data:
                    update_fields[field] = update_data[field]
            
            if not update_fields:
                return {'success': False, 'error': 'No valid fields to update'}
            
            update_fields['last_updated'] = datetime.now(timezone.utc)
            
            result = dictionary_collection().update_one(
                {'_id': object_id}, 
                {'$set': update_fields}
            )
            
            if result.matched_count == 0:
                return {'success': False, 'error': 'Word not found'}
            
            # Reload dictionary
            self.dictionary = self.load_dictionary()
            
            return {
                'success': True,
                'message': 'Word updated successfully',
                'id': word_id
            }
            
        except Exception as e:
            print(f"❌ Error updating word: {e}")
            return {'success': False, 'error': str(e)}
    
    def delete_word(self, word_id):
        """Delete a dictionary word"""
        try:
            # Validate ObjectId
            try:
                object_id = ObjectId(word_id)
            except:
                return {'success': False, 'error': 'Invalid word ID'}
            
            result = dictionary_collection().delete_one({'_id': object_id})
            
            if result.deleted_count == 0:
                return {'success': False, 'error': 'Word not found'}
            
            # Reload dictionary
            self.dictionary = self.load_dictionary()
            
            return {
                'success': True,
                'message': 'Word deleted successfully',
                'id': word_id
            }
            
        except Exception as e:
            print(f"❌ Error deleting word: {e}")
            return {'success': False, 'error': str(e)}
    
    def upload_csv(self, file):
        """Upload CSV or XLSX file with dictionary words"""
        import io
        import csv
        
        try:
            if not file or file.filename == '':
                return {'success': False, 'error': 'No file provided'}
            
            # Check file extension
            filename_lower = file.filename.lower()
            if not (filename_lower.endswith('.csv') or filename_lower.endswith('.xlsx')):
                return {'success': False, 'error': 'File must be CSV or XLSX format'}
            
            is_xlsx = filename_lower.endswith('.xlsx')
            
            # Read and parse file content
            try:
                file.seek(0)
                
                if is_xlsx:
                    # Handle XLSX files using pandas
                    logger.info("Processing XLSX file")
                    df = pd.read_excel(file, engine='openpyxl')
                    records = df.to_dict('records')
                    fieldnames = list(df.columns)
                    logger.info(f"XLSX file loaded: {len(records)} rows, columns: {fieldnames}")
                else:
                    # Handle CSV files with proper UTF-8 handling
                    raw_content = file.read()
                    content = None
                    
                    for encoding in ['utf-8-sig', 'utf-8', 'utf-16', 'cp1252']:
                        try:
                            content = raw_content.decode(encoding)
                            logger.info(f"Successfully decoded CSV with {encoding} encoding")
                            break
                        except UnicodeDecodeError:
                            continue
                    
                    if content is None:
                        logger.error("Failed to decode CSV")
                        return {'success': False, 'error': 'Unable to decode CSV file. Please save as UTF-8 encoding.'}
                    
                    stream = io.StringIO(content)
                    csv_reader = csv.DictReader(stream)
                    records = list(csv_reader)
                    fieldnames = csv_reader.fieldnames
                    logger.info(f"CSV file loaded: {len(records)} rows, columns: {fieldnames}")
                
                if not fieldnames or not records:
                    return {'success': False, 'error': 'File appears to be empty or invalid'}
                    
            except Exception as e:
                logger.error(f"Error reading file: {str(e)}")
                return {'success': False, 'error': f'Error reading file: {str(e)}'}
            
            added_count = 0
            errors = []
            
            for row_num, row in enumerate(records, start=2):
                try:
                    # Helper function for pandas NaN handling
                    def safe_get_string(row, key):
                        value = row.get(key, '')
                        if pd.isna(value):
                            return ''
                        return str(value).strip()
                    
                    vedda_word = safe_get_string(row, 'vedda_word')
                    if not vedda_word:
                        errors.append(f"Row {row_num}: vedda_word is required")
                        continue
                    
                    sinhala_word = safe_get_string(row, 'sinhala_word')
                    english_word = safe_get_string(row, 'english_word')
                    
                    logger.info(f"Processing row {row_num}: vedda='{vedda_word}', sinhala='{sinhala_word}'")
                    
                    # Check if word exists (all three fields must match)
                    existing = dictionary_collection().find_one({
                        'vedda_word': vedda_word,
                        'sinhala_word': sinhala_word,
                        'english_word': english_word
                    })
                    if existing:
                        # Delete the duplicate and insert the new one
                        dictionary_collection().delete_one({'_id': existing['_id']})
                        errors.append(f"Row {row_num}: Duplicate removed for '{vedda_word}' + '{sinhala_word}' + '{english_word}'")
                    
                    # Insert word
                    word_doc = {
                        'vedda_word': vedda_word,
                        'english_word': english_word,
                        'sinhala_word': sinhala_word,
                        'vedda_ipa': safe_get_string(row, 'vedda_ipa'),
                        'sinhala_ipa': safe_get_string(row, 'sinhala_ipa'),
                        'english_ipa': safe_get_string(row, 'english_ipa'),
                        'word_type': safe_get_string(row, 'word_type'),
                        'usage_example': safe_get_string(row, 'usage_example'),
                        'frequency_score': 1.0,
                        'confidence_score': 0.95,
                        'source': 'xlsx_upload' if is_xlsx else 'csv_upload',
                        'created_at': datetime.utcnow(),
                        'last_updated': datetime.utcnow()
                    }
                    
                    result = dictionary_collection().insert_one(word_doc)
                    logger.info(f"Inserted with ID: {result.inserted_id}")
                    added_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            # Reload dictionary
            self.dictionary = self.load_dictionary()
            
            return {
                'success': True,
                'added_count': added_count,
                'errors': errors,
                'message': f'Successfully added {added_count} words'
            }
            
        except Exception as e:
            logger.error(f"Upload error: {str(e)}")
            return {'success': False, 'error': str(e)}


# Global instance
_dictionary_service = None


def get_dictionary_service():
    """Get dictionary service instance"""
    global _dictionary_service
    if _dictionary_service is None:
        _dictionary_service = DictionaryService()
    return _dictionary_service
