import json
import os
import sqlite3
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database setup
DATABASE = os.path.join('..', '..', 'data', 'vedda_translator.db')

def init_db():
    """Initialize the database with history and feedback tables"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Translation history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS translation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input_text TEXT NOT NULL,
            output_text TEXT NOT NULL,
            source_language TEXT NOT NULL,
            target_language TEXT NOT NULL,
            translation_method TEXT,
            confidence_score REAL,
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
            user_rating INTEGER,
            comments TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

class HistoryService:
    def __init__(self):
        pass
    
    def add_translation_history(self, input_text, output_text, source_language, 
                              target_language, translation_method=None, confidence_score=None):
        """Add a translation to history"""
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO translation_history 
                (input_text, output_text, source_language, target_language, translation_method)
                VALUES (?, ?, ?, ?, ?)
            ''', (input_text, output_text, source_language, target_language, translation_method))
            
            conn.commit()
            history_id = cursor.lastrowid
            conn.close()
            
            return history_id
        except Exception as e:
            return None
    
    def get_translation_history(self, limit=50, offset=0, source_language=None, target_language=None):
        """Get translation history with optional filtering"""
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        query = '''
            SELECT id, input_text, output_text, source_language, target_language, 
                   translation_method, created_at
            FROM translation_history
        '''
        params = []
        
        if source_language or target_language:
            conditions = []
            if source_language:
                conditions.append('source_language = ?')
                params.append(source_language)
            if target_language:
                conditions.append('target_language = ?')
                params.append(target_language)
            query += ' WHERE ' + ' AND '.join(conditions)
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                'id': row[0],
                'input_text': row[1],
                'output_text': row[2],
                'source_language': row[3],
                'target_language': row[4],
                'translation_method': row[5],
                'created_at': row[6]
            })
        
        return history
    
    def add_feedback(self, original_text, suggested_translation, current_translation=None,
                    feedback_type='correction', user_rating=None, comments=None):
        """Add user feedback"""
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO user_feedback 
                (original_text, suggested_translation, current_translation, feedback_type, user_rating, comments)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (original_text, suggested_translation, current_translation, feedback_type, user_rating, comments))
            
            conn.commit()
            feedback_id = cursor.lastrowid
            conn.close()
            
            return feedback_id
        except Exception as e:
            return None
    
    def get_feedback(self, limit=50, offset=0):
        """Get user feedback"""
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, original_text, suggested_translation, current_translation, 
                   feedback_type, user_rating, comments, created_at
            FROM user_feedback
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ''', (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        feedback = []
        for row in rows:
            feedback.append({
                'id': row[0],
                'original_text': row[1],
                'suggested_translation': row[2],
                'current_translation': row[3],
                'feedback_type': row[4],
                'user_rating': row[5],
                'comments': row[6],
                'created_at': row[7]
            })
        
        return feedback
    
    def get_statistics(self):
        """Get service statistics"""
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        
        # Total translations
        cursor.execute('SELECT COUNT(*) FROM translation_history')
        total_translations = cursor.fetchone()[0]
        
        # Total feedback
        cursor.execute('SELECT COUNT(*) FROM user_feedback')
        total_feedback = cursor.fetchone()[0]
        
        # Language pair statistics
        cursor.execute('''
            SELECT source_language, target_language, COUNT(*) as count
            FROM translation_history
            GROUP BY source_language, target_language
            ORDER BY count DESC
            LIMIT 10
        ''')
        language_pairs = cursor.fetchall()
        
        # Recent activity (last 24 hours)
        cursor.execute('''
            SELECT COUNT(*) FROM translation_history
            WHERE created_at >= datetime('now', '-1 day')
        ''')
        recent_translations = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            'total_translations': total_translations,
            'total_feedback': total_feedback,
            'recent_translations_24h': recent_translations,
            'popular_language_pairs': [
                {
                    'source': pair[0],
                    'target': pair[1],
                    'count': pair[2]
                } for pair in language_pairs
            ]
        }

# Initialize service
history_service = HistoryService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'history-service',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get translation history"""
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    source_language = request.args.get('source_language')
    target_language = request.args.get('target_language')
    
    history = history_service.get_translation_history(
        limit=limit, 
        offset=offset,
        source_language=source_language,
        target_language=target_language
    )
    
    return jsonify({
        'history': history,
        'limit': limit,
        'offset': offset
    })

@app.route('/api/history', methods=['POST'])
def add_history():
    """Add translation to history"""
    data = request.get_json()
    
    required_fields = ['input_text', 'output_text', 'source_language', 'target_language']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    history_id = history_service.add_translation_history(
        input_text=data['input_text'],
        output_text=data['output_text'],
        source_language=data['source_language'],
        target_language=data['target_language'],
        translation_method=data.get('translation_method'),
        confidence_score=data.get('confidence_score')
    )
    
    if history_id:
        return jsonify({
            'success': True,
            'history_id': history_id,
            'message': 'Translation added to history'
        }), 201
    else:
        return jsonify({'error': 'Failed to add translation to history'}), 500

@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    """Get user feedback"""
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    feedback = history_service.get_feedback(limit=limit, offset=offset)
    
    return jsonify({
        'feedback': feedback,
        'limit': limit,
        'offset': offset
    })

@app.route('/api/feedback', methods=['POST'])
def add_feedback():
    """Add user feedback"""
    data = request.get_json()
    
    required_fields = ['original_text', 'suggested_translation']
    if not data or not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    feedback_id = history_service.add_feedback(
        original_text=data['original_text'],
        suggested_translation=data['suggested_translation'],
        current_translation=data.get('current_translation'),
        feedback_type=data.get('feedback_type', 'correction'),
        user_rating=data.get('user_rating'),
        comments=data.get('comments')
    )
    
    if feedback_id:
        return jsonify({
            'success': True,
            'feedback_id': feedback_id,
            'message': 'Feedback added successfully'
        }), 201
    else:
        return jsonify({'error': 'Failed to add feedback'}), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get service statistics"""
    stats = history_service.get_statistics()
    return jsonify(stats)

if __name__ == '__main__':
    init_db()
    print("Starting History Service on port 5003...")
    app.run(host='0.0.0.0', port=5003, debug=True)