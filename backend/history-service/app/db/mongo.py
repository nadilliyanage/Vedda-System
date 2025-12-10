from pymongo import MongoClient

_mongo_client = None
_db = None


def init_mongo(app):
    """Initialize MongoDB connection"""
    global _mongo_client, _db
    
    mongodb_uri = app.config['MONGODB_URI']
    database_name = app.config['DATABASE_NAME']
    
    _mongo_client = MongoClient(mongodb_uri)
    _db = _mongo_client[database_name]
    
    print(f"📚 History Service connected to MongoDB: {database_name}")


def get_db():
    """Get database instance"""
    return _db


def translation_history_collection():
    """Get translation history collection"""
    return _db.translation_history if _db else None


def feedback_collection():
    """Get feedback collection"""
    return _db.feedback if _db else None
