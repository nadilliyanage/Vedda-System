import json
import os
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
CORS(app)

# MongoDB setup
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://heshan:3UAXaHwpIRwEqK8K@cluster0.quemmhk.mongodb.net/vedda-system?retryWrites=true&w=majority&appName=Cluster0')
DATABASE_NAME = 'vedda-system'

class HistoryService:
    def __init__(self):
        self.client = MongoClient(MONGODB_URI)
        self.db = self.client[DATABASE_NAME]
        print("📚 History Service connected to MongoDB")
    
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
            
            result = self.db.translation_history.insert_one(history_doc)
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
            
            cursor = self.db.translation_history.find(query_filter)\
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
            
            cursor = self.db.translation_history.find(search_filter)\
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
            
            result = self.db.user_feedback.insert_one(feedback_doc)
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
            
            cursor = self.db.user_feedback.find(query_filter)\
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
            total_translations = self.db.translation_history.count_documents({})
            
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
            language_pairs = list(self.db.translation_history.aggregate(language_pairs_pipeline))
            
            # Method stats
            method_pipeline = [
                {'$group': {'_id': '$translation_method', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ]
            methods = list(self.db.translation_history.aggregate(method_pipeline))
            
            # Feedback stats
            total_feedback = self.db.user_feedback.count_documents({})
            
            feedback_types_pipeline = [
                {'$group': {'_id': '$feedback_type', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ]
            feedback_types = list(self.db.user_feedback.aggregate(feedback_types_pipeline))
            
            # Recent activity (last 7 days)
            from datetime import timedelta
            week_ago = datetime.now(timezone.utc) - timedelta(days=7)
            recent_translations = self.db.translation_history.count_documents({
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

# Initialize service
history_service = HistoryService()

@app.route('/api/history', methods=['POST'])
def add_history():
    """Add translation to history"""
    try:
        data = request.get_json()
        
        required_fields = ['input_text', 'output_text', 'source_language', 'target_language']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        history_id = history_service.add_translation_history(
            input_text=data['input_text'],
            output_text=data['output_text'],
            source_language=data['source_language'],
            target_language=data['target_language'],
            translation_method=data.get('translation_method', ''),
            confidence_score=data.get('confidence_score')
        )
        
        if history_id:
            return jsonify({
                'success': True,
                'id': history_id,
                'message': 'Translation added to history'
            }), 201
        else:
            return jsonify({'error': 'Failed to add translation to history'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get translation history"""
    try:
        limit = int(request.args.get('limit', 50))
        source_language = request.args.get('source_language')
        target_language = request.args.get('target_language')
        
        history = history_service.get_translation_history(
            limit=limit,
            source_language=source_language,
            target_language=target_language
        )
        
        return jsonify({
            'success': True,
            'history': history,
            'count': len(history)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history/search', methods=['GET'])
def search_history():
    """Search translation history"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 50))
        
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
        
        results = history_service.search_translation_history(query, limit)
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results),
            'query': query
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['POST'])
def add_feedback():
    """Add user feedback"""
    try:
        data = request.get_json()
        
        required_fields = ['original_text', 'suggested_translation', 'feedback_type']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        feedback_id = history_service.add_user_feedback(
            original_text=data['original_text'],
            suggested_translation=data['suggested_translation'],
            current_translation=data.get('current_translation', ''),
            feedback_type=data['feedback_type'],
            user_rating=data.get('user_rating'),
            comments=data.get('comments', '')
        )
        
        if feedback_id:
            return jsonify({
                'success': True,
                'id': feedback_id,
                'message': 'Feedback added successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to add feedback'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    """Get user feedback"""
    try:
        limit = int(request.args.get('limit', 50))
        feedback_type = request.args.get('type')
        
        feedback = history_service.get_user_feedback(limit, feedback_type)
        
        return jsonify({
            'success': True,
            'feedback': feedback,
            'count': len(feedback)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history/stats', methods=['GET'])
def get_statistics():
    """Get history and feedback statistics"""
    try:
        stats = history_service.get_statistics()
        return jsonify({
            'success': True,
            'statistics': stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Test MongoDB connection
        history_service.client.admin.command('ping')
        translation_count = history_service.db.translation_history.count_documents({})
        
        return jsonify({
            'status': 'healthy',
            'service': 'History Service (MongoDB)',
            'database': 'connected',
            'translation_count': translation_count
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'service': 'History Service',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting History Service with MongoDB...")
    app.run(debug=True, host='0.0.0.0', port=5003)