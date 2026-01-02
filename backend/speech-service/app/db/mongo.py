from pymongo import MongoClient

_mongo_client = None
_db = None


def init_mongo(app):
    """Initialize MongoDB connection"""
    global _mongo_client, _db
    
    mongodb_uri = app.config.get('MONGODB_URI')
    database_name = app.config.get('DATABASE_NAME', 'vedda-system')
    
    if mongodb_uri:
        _mongo_client = MongoClient(mongodb_uri)
        _db = _mongo_client[database_name]
        print(f"Speech Service connected to MongoDB: {database_name}")
    else:
        print("⚠️ MongoDB URI not configured, running without dictionary support")


def get_db():
    """Get database instance"""
    return _db


def dictionary_collection():
    """Get dictionary collection"""
    if _db is not None:
        return _db.dictionary
    return None
