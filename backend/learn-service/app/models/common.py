def serialize_mongo_doc(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc