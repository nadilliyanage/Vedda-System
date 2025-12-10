from datetime import datetime, timezone
from app.db.mongo import get_db, translation_history_collection, feedback_collection


class HistoryService:
    def __init__(self):
        self.db = get_db()
        print("📚 History Service initialized")
    
    def add_translation_history(self, input_text, output_text, source_language, 
                              target_language, translation_method, confidence_score=None):
        """Add translation to history"""
        try:
            history_doc = {
                'input_text': input_text,
                'output_text': output_text,
                'source_language': source_language,
                'target_language': target_language,
                'translation_method': translation_method,
                'confidence_score': confidence_score,
                'created_at': datetime.now(timezone.utc)
            }
            
            result = translation_history_collection().insert_one(history_doc)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"❌ Error adding translation history: {e}")
            return None
    
    def get_translation_history(self, limit=50, source_language=None, target_language=None):
        """Get recent translation history"""
        try:
            query_filter = {}
            
            if source_language:
                query_filter['source_language'] = source_language
            if target_language:
                query_filter['target_language'] = target_language
            
            cursor = translation_history_collection().find(query_filter)\
                .sort('created_at', -1)\
                .limit(limit)
            
            history = []
            for doc in cursor:
                history_item = {
                    'id': str(doc['_id']),
                    'input_text': doc['input_text'],
                    'output_text': doc['output_text'],
                    'source_language': doc['source_language'],
                    'target_language': doc['target_language'],
                    'translation_method': doc.get('translation_method', ''),
                    'confidence_score': doc.get('confidence_score'),
                    'created_at': doc['created_at'].isoformat() if doc.get('created_at') else None
                }
                history.append(history_item)
            
            return history
            
        except Exception as e:
            print(f"❌ Error getting translation history: {e}")
            return []
    
    def search_translation_history(self, query, limit=50):
        """Search translation history"""
        try:
            search_filter = {
                '$or': [
                    {'input_text': {'$regex': query, '$options': 'i'}},
                    {'output_text': {'$regex': query, '$options': 'i'}}
                ]
            }
            
            cursor = translation_history_collection().find(search_filter)\
                .sort('created_at', -1)\
                .limit(limit)
            
            results = []
            for doc in cursor:
                result = {
                    'id': str(doc['_id']),
                    'input_text': doc['input_text'],
                    'output_text': doc['output_text'],
                    'source_language': doc['source_language'],
                    'target_language': doc['target_language'],
                    'translation_method': doc.get('translation_method', ''),
                    'confidence_score': doc.get('confidence_score'),
                    'created_at': doc['created_at'].isoformat() if doc.get('created_at') else None
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            print(f"❌ Error searching translation history: {e}")
            return []
    
    def add_user_feedback(self, original_text, suggested_translation, current_translation,
                         feedback_type, user_rating=None, comments=''):
        """Add user feedback"""
        try:
            feedback_doc = {
                'original_text': original_text,
                'suggested_translation': suggested_translation,
                'current_translation': current_translation,
                'feedback_type': feedback_type,
                'user_rating': user_rating,
                'comments': comments,
                'created_at': datetime.now(timezone.utc)
            }
            
            result = feedback_collection().insert_one(feedback_doc)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"❌ Error adding user feedback: {e}")
            return None
    
    def get_user_feedback(self, limit=50, feedback_type=None):
        """Get user feedback"""
        try:
            query_filter = {}
            if feedback_type:
                query_filter['feedback_type'] = feedback_type
            
            cursor = feedback_collection().find(query_filter)\
                .sort('created_at', -1)\
                .limit(limit)
            
            feedback_list = []
            for doc in cursor:
                feedback_item = {
                    'id': str(doc['_id']),
                    'original_text': doc['original_text'],
                    'suggested_translation': doc['suggested_translation'],
                    'current_translation': doc.get('current_translation', ''),
                    'feedback_type': doc['feedback_type'],
                    'user_rating': doc.get('user_rating'),
                    'comments': doc.get('comments', ''),
                    'created_at': doc['created_at'].isoformat() if doc.get('created_at') else None
                }
                feedback_list.append(feedback_item)
            
            return feedback_list
            
        except Exception as e:
            print(f"❌ Error getting user feedback: {e}")
            return []
    
    def get_statistics(self):
        """Get history and feedback statistics"""
        try:
            # Translation history stats
            total_translations = translation_history_collection().count_documents({})
            
            # Language pair stats
            language_pairs_pipeline = [
                {
                    '$group': {
                        '_id': {
                            'source': '$source_language',
                            'target': '$target_language'
                        },
                        'count': {'$sum': 1}
                    }
                },
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]
            language_pairs = list(translation_history_collection().aggregate(language_pairs_pipeline))
            
            # Method stats
            method_pipeline = [
                {'$group': {'_id': '$translation_method', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ]
            methods = list(translation_history_collection().aggregate(method_pipeline))
            
            # Feedback stats
            total_feedback = feedback_collection().count_documents({})
            
            feedback_types_pipeline = [
                {'$group': {'_id': '$feedback_type', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ]
            feedback_types = list(feedback_collection().aggregate(feedback_types_pipeline))
            
            # Recent activity (last 7 days)
            from datetime import timedelta
            week_ago = datetime.now(timezone.utc) - timedelta(days=7)
            recent_translations = translation_history_collection().count_documents({
                'created_at': {'$gte': week_ago}
            })
            
            return {
                'total_translations': total_translations,
                'total_feedback': total_feedback,
                'recent_translations': recent_translations,
                'top_language_pairs': [
                    {
                        'pair': f"{pair['_id']['source']} → {pair['_id']['target']}",
                        'count': pair['count']
                    }
                    for pair in language_pairs
                ],
                'translation_methods': [
                    {'method': method['_id'], 'count': method['count']}
                    for method in methods if method['_id']
                ],
                'feedback_types': [
                    {'type': fb['_id'], 'count': fb['count']}
                    for fb in feedback_types if fb['_id']
                ]
            }
            
        except Exception as e:
            print(f"❌ Error getting statistics: {e}")
            return {}


# Global instance
_history_service = None


def get_history_service():
    """Get history service instance"""
    global _history_service
    if _history_service is None:
        _history_service = HistoryService()
    return _history_service
