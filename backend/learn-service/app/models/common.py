def strip_mongo_id(doc: dict) -> dict:
    """Return a copy of a MongoDB document without the _id field."""
    return {k: v for k, v in doc.items() if k != "_id"}