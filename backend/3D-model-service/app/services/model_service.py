from bson import ObjectId
from app.db.mongo import get_collection


class ModelService:
    """Service to handle 3D model related operations including word retrieval"""
    
    def __init__(self):
        self.collection_name = 'dictionary'
    
    def _get_collection(self):
        """Get the dictionary collection"""
        return get_collection(self.collection_name)
    
    def _format_word(self, doc):
        """Format a word document for API response"""
        return {
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
    
    def get_words(self, word_type=None, search=None, limit=100, skip=0):
        """
        Get words with optional filtering
        
        Args:
            word_type: Filter by word type (noun, verb, etc.)
            search: Search term for vedda_word
            limit: Maximum number of results
            skip: Number of results to skip for pagination
            
        Returns:
            dict: Response with words array and metadata
        """
        try:
            collection = self._get_collection()
            
            # Build query
            query = {}
            if word_type:
                query['word_type'] = word_type
            if search:
                query['vedda_word'] = {'$regex': search, '$options': 'i'}
            
            # Get total count
            total = collection.count_documents(query)
            
            # Get documents
            cursor = collection.find(query).skip(skip).limit(limit)
            words = [self._format_word(doc) for doc in cursor]
            
            return {
                'success': True,
                'data': words,
                'metadata': {
                    'total': total,
                    'limit': limit,
                    'skip': skip,
                    'count': len(words)
                }
            }
            
        except Exception as e:
            print(f"Error getting words: {e}")
            raise
    
    def get_word_by_id(self, word_id):
        """
        Get a specific word by ID
        
        Args:
            word_id: MongoDB ObjectId as string
            
        Returns:
            dict: Response with word data
        """
        try:
            collection = self._get_collection()
            
            # Validate ObjectId
            try:
                obj_id = ObjectId(word_id)
            except Exception:
                return {
                    'success': False,
                    'error': 'Invalid word ID format'
                }
            
            doc = collection.find_one({'_id': obj_id})
            
            if not doc:
                return {
                    'success': False,
                    'error': 'Word not found'
                }
            
            return {
                'success': True,
                'data': self._format_word(doc)
            }
            
        except Exception as e:
            print(f"Error getting word by ID: {e}")
            raise
    
    def get_word_by_vedda(self, vedda_word):
        """
        Get word details by Vedda word
        
        Args:
            vedda_word: Vedda word string
            
        Returns:
            dict: Response with word data
        """
        try:
            collection = self._get_collection()
            
            # Case-insensitive search
            doc = collection.find_one({
                'vedda_word': {'$regex': f'^{vedda_word}$', '$options': 'i'}
            })
            
            if not doc:
                return {
                    'success': False,
                    'error': f'Word "{vedda_word}" not found'
                }
            
            return {
                'success': True,
                'data': self._format_word(doc)
            }
            
        except Exception as e:
            print(f"Error getting word by vedda word: {e}")
            raise
    
    def get_words_with_ipa(self, limit=100, skip=0):
        """
        Get only words that have vedda_IPA defined
        
        Args:
            limit: Maximum number of results
            skip: Number of results to skip for pagination
            
        Returns:
            dict: Response with words that have IPA notation
        """
        try:
            collection = self._get_collection()
            
            # Query for documents where vedda_ipa exists and is not empty
            query = {
                'vedda_ipa': {'$exists': True, '$ne': ''}
            }
            
            # Get total count
            total = collection.count_documents(query)
            
            # Get documents
            cursor = collection.find(query).skip(skip).limit(limit)
            words = [self._format_word(doc) for doc in cursor]
            
            return {
                'success': True,
                'data': words,
                'metadata': {
                    'total': total,
                    'limit': limit,
                    'skip': skip,
                    'count': len(words),
                    'filter': 'words with vedda_ipa only'
                }
            }
            
        except Exception as e:
            print(f"Error getting words with IPA: {e}")
            raise
    
    def get_word_stats(self):
        """
        Get statistics about words in the database
        
        Returns:
            dict: Statistics including total words, words with IPA, etc.
        """
        try:
            collection = self._get_collection()
            
            total_words = collection.count_documents({})
            words_with_vedda_ipa = collection.count_documents({
                'vedda_ipa': {'$exists': True, '$ne': ''}
            })
            words_with_sinhala_ipa = collection.count_documents({
                'sinhala_ipa': {'$exists': True, '$ne': ''}
            })
            words_with_english_ipa = collection.count_documents({
                'english_ipa': {'$exists': True, '$ne': ''}
            })
            
            return {
                'success': True,
                'data': {
                    'total_words': total_words,
                    'words_with_vedda_ipa': words_with_vedda_ipa,
                    'words_with_sinhala_ipa': words_with_sinhala_ipa,
                    'words_with_english_ipa': words_with_english_ipa,
                    'percentage_with_vedda_ipa': round((words_with_vedda_ipa / total_words * 100), 2) if total_words > 0 else 0
                }
            }
            
        except Exception as e:
            print(f"Error getting word stats: {e}")
            raise
    
    def get_ipa_and_words_only(self, limit=100, skip=0, has_vedda_ipa=False, english_word=None):
        """
        Get only vedda_ipa, sinhala_ipa and words (minimal response)
        
        Args:
            limit: Maximum number of results
            skip: Number of results to skip for pagination
            has_vedda_ipa: If True, only return words with vedda_ipa defined
            english_word: Filter by English word (case-insensitive)
            
        Returns:
            dict: Response with minimal word data (only IPAs and words)
        """
        try:
            collection = self._get_collection()
            
            # Build query
            query = {}
            if has_vedda_ipa:
                query['vedda_ipa'] = {'$exists': True, '$ne': ''}
            if english_word:
                query['english_word'] = {'$regex': f'^{english_word}$', '$options': 'i'}
            
            # Get total count
            total = collection.count_documents(query)
            
            # Get documents with only required fields
            projection = {
                '_id': 1,
                'vedda_word': 1,
                'english_word': 1,
                'sinhala_word': 1,
                'vedda_ipa': 1,
                'sinhala_ipa': 1
            }
            
            cursor = collection.find(query, projection).skip(skip).limit(limit)
            
            # Format minimal response
            words = []
            for doc in cursor:
                words.append({
                    'id': str(doc['_id']),
                    'vedda_word': doc.get('vedda_word', ''),
                    'english_word': doc.get('english_word', ''),
                    'sinhala_word': doc.get('sinhala_word', ''),
                    'vedda_ipa': doc.get('vedda_ipa', ''),
                    'sinhala_ipa': doc.get('sinhala_ipa', '')
                })
            
            return {
                'success': True,
                'data': words,
                'metadata': {
                    'total': total,
                    'limit': limit,
                    'skip': skip,
                    'count': len(words),
                    'fields': ['vedda_word', 'english_word', 'sinhala_word', 'vedda_ipa', 'sinhala_ipa']
                }
            }
            
        except Exception as e:
            print(f"Error getting IPA and words only: {e}")
            raise
