from .user import User

def user_from_mongo(doc) -> User | None:
    if not doc:
        return None

    return User(
        id=str(doc["_id"]),
        username=doc.get("username"),
        email=doc.get("email"),
        role=doc.get("role", "user"),
        created_at=doc.get("createdAt"),
        last_login=doc.get("lastLogin"),
    )