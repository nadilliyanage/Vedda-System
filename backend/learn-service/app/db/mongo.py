from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

client = None
db = None


def init_mongo(app):
    """Initialize MongoDB connection using app config."""
    global client, db

    uri = app.config["MONGODB_URI"]
    db_name = app.config["MONGODB_DB_NAME"]

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client[db_name]
        print("MongoDB connected successfully")
    except ConnectionFailure as e:
        print(f"MongoDB connection failed: {e}")
        raise


def get_collection(name: str):
    """Get a MongoDB collection from the initialized DB."""
    if db is None:
        raise RuntimeError("MongoDB is not initialized. Call init_mongo(app) first.")
    return db[name]

def user_collection():
    """Get a MongoDB collection from the initialized DB."""
    if db is None:
        raise RuntimeError("MongoDB is not initialized. Call init_mongo(app) first.")
    return db['users']