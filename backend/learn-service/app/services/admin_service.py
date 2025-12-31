from app.db.mongo import get_collection
from app.models.common import strip_mongo_id
from flask import g

# ---------- Challenges ----------

def admin_list_challenges(challenge_type: str | None):
    col = get_collection("challenges")
    query = {"type": challenge_type} if challenge_type else {}
    challenges = list(col.find(query))
    return [strip_mongo_id(c) for c in challenges]


def admin_create_challenge(data: dict):
    col = get_collection("challenges")

    if not data.get("id"):
        return {"success": False, "error": "Challenge ID is required"}, 400
    if not data.get("type"):
        return {"success": False, "error": "Challenge type is required"}, 400
    if not data.get("prompt"):
        return {"success": False, "error": "Prompt is required"}, 400

    if col.find_one({"id": data["id"]}):
        return {"success": False, "error": "Challenge ID already exists"}, 400

    ctype = data["type"]
    if ctype == "fill_blank":
        if not data.get("answers") or not isinstance(data["answers"], list):
            return {"success": False, "error": "Answers array is required for fill_blank"}, 400
    elif ctype == "multiple_choice":
        if not data.get("options") or not isinstance(data["options"], list):
            return {"success": False, "error": "Options array is required for multiple_choice"}, 400
        if not data.get("correct") or not isinstance(data["correct"], list):
            return {"success": False, "error": "Correct answers array is required for multiple_choice"}, 400
    elif ctype == "match_pairs":
        if not data.get("pairs") or not isinstance(data["pairs"], list):
            return {"success": False, "error": "Pairs array is required for match_pairs"}, 400

    col.insert_one(data)
    return {"success": True, "message": "Challenge created successfully", "id": data["id"]}, 201


def admin_get_challenge(challenge_id: str):
    col = get_collection("challenges")
    challenge = col.find_one({"id": challenge_id})
    if not challenge:
        return {"error": "Challenge not found"}, 404
    return strip_mongo_id(challenge), 200


def admin_update_challenge(challenge_id: str, data: dict):
    col = get_collection("challenges")
    existing = col.find_one({"id": challenge_id})
    if not existing:
        return {"success": False, "error": "Challenge not found"}, 404

    if "id" in data and data["id"] != challenge_id:
        return {"success": False, "error": "Cannot change challenge ID"}, 400

    result = col.update_one({"id": challenge_id}, {"$set": data})

    if result.modified_count > 0:
        return {"success": True, "message": "Challenge updated successfully"}, 200
    else:
        return {"success": True, "message": "No changes made"}, 200


def admin_delete_challenge(challenge_id: str):
    col = get_collection("challenges")
    result = col.delete_one({"id": challenge_id})

    if result.deleted_count > 0:
        return {"success": True, "message": "Challenge deleted successfully"}, 200
    else:
        return {"success": False, "error": "Challenge not found"}, 404


# ---------- Categories ----------

def admin_list_categories():
    col = get_collection("categories")
    categories = list(col.find({}))
    return [strip_mongo_id(c) for c in categories]


def admin_create_category(data: dict):
    col = get_collection("categories")

    if not data.get("id"):
        return {"success": False, "error": "Category ID is required"}, 400
    if not data.get("name"):
        return {"success": False, "error": "Category name is required"}, 400

    if col.find_one({"id": data["id"]}):
        return {"success": False, "error": "Category ID already exists"}, 400

    col.insert_one(data)
    return {"success": True, "message": "Category created successfully", "id": data["id"]}, 201


def admin_get_category(category_id: str):
    col = get_collection("categories")
    category = col.find_one({"id": category_id})
    if not category:
        return {"error": "Category not found"}, 404
    return strip_mongo_id(category), 200


def admin_update_category(category_id: str, data: dict):
    col = get_collection("categories")

    if not col.find_one({"id": category_id}):
        return {"success": False, "error": "Category not found"}, 404

    if "id" in data and data["id"] != category_id:
        return {"success": False, "error": "Cannot change category ID"}, 400

    result = col.update_one({"id": category_id}, {"$set": data})

    if result.modified_count > 0:
        return {"success": True, "message": "Category updated successfully"}, 200
    else:
        return {"success": True, "message": "No changes made"}, 200


def admin_delete_category(category_id: str):
    col = get_collection("categories")
    result = col.delete_one({"id": category_id})

    if result.deleted_count > 0:
        return {"success": True, "message": "Category deleted successfully"}, 200
    else:
        return {"success": False, "error": "Category not found"}, 404


# ---------- Lessons ----------

def admin_list_lessons():
    col = get_collection("lessons")
    lessons = list(col.find({}))
    return [strip_mongo_id(l) for l in lessons]


def admin_create_lesson(data: dict):
    col = get_collection("lessons")

    if not data.get("id"):
        return {"success": False, "error": "Lesson ID is required"}, 400
    if not data.get("topic"):
        return {"success": False, "error": "Topic is required"}, 400
    if not data.get("categoryId"):
        return {"success": False, "error": "Category ID is required"}, 400

    if col.find_one({"id": data["id"]}):
        return {"success": False, "error": "Lesson ID already exists"}, 400

    col.insert_one(data)
    return {"success": True, "message": "Lesson created successfully", "id": data["id"]}, 201


def admin_get_lesson(lesson_id: str):
    col = get_collection("lessons")
    lesson = col.find_one({"id": lesson_id})
    if not lesson:
        return {"error": "Lesson not found"}, 404
    return strip_mongo_id(lesson), 200


def admin_update_lesson(lesson_id: str, data: dict):
    col = get_collection("lessons")

    if not col.find_one({"id": lesson_id}):
        return {"success": False, "error": "Lesson not found"}, 404

    if "id" in data and data["id"] != lesson_id:
        return {"success": False, "error": "Cannot change lesson ID"}, 400

    result = col.update_one({"id": lesson_id}, {"$set": data})

    if result.modified_count > 0:
        return {"success": True, "message": "Lesson updated successfully"}, 200
    else:
        return {"success": True, "message": "No changes made"}, 200


def admin_delete_lesson(lesson_id: str):
    col = get_collection("lessons")
    result = col.delete_one({"id": lesson_id})

    if result.deleted_count > 0:
        return {"success": True, "message": "Lesson deleted successfully"}, 200
    else:
        return {"success": False, "error": "Lesson not found"}, 404


# ---------- Exercises ----------

def admin_list_exercises():
    current_user = g.current_user
    print(f"current user: {current_user}")
    col = get_collection("exercises")
    exercises = list(col.find({}))
    for exercise in exercises:
        if "_id" in exercise:
            exercise["_id"] = str(exercise["_id"])
    return exercises


def admin_create_exercise(data: dict):
    col = get_collection("exercises")

    required = ["id", "lessonId", "categoryId", "exerciseNumber", "question"]
    if not all(field in data for field in required):
        return {"success": False, "error": "Missing required fields"}, 400

    if col.find_one({"id": data["id"]}):
        return {"success": False, "error": "Exercise with this ID already exists"}, 400

    col.insert_one(data)
    return {"success": True, "message": "Exercise created successfully"}, 201


def admin_get_exercise(exercise_id: str):
    col = get_collection("exercises")
    exercise = col.find_one({"id": exercise_id}, {"_id": 0})

    if exercise:
        return {"success": True, "exercise": exercise}, 200
    else:
        return {"success": False, "error": "Exercise not found"}, 404


def admin_update_exercise(exercise_id: str, data: dict):
    col = get_collection("exercises")

    data.pop("id", None)
    data.pop("_id", None)

    required = ["lessonId", "categoryId", "exerciseNumber", "question"]
    if not all(field in data for field in required):
        return {"success": False, "error": "Missing required fields"}, 400

    result = col.update_one({"id": exercise_id}, {"$set": data})

    if result.modified_count > 0:
        return {"success": True, "message": "Exercise updated successfully"}, 200
    else:
        return {"success": True, "message": "No changes made"}, 200


def admin_delete_exercise(exercise_id: str):
    col = get_collection("exercises")
    result = col.delete_one({"id": exercise_id})

    if result.deleted_count > 0:
        return {"success": True, "message": "Exercise deleted successfully"}, 200
    else:
        return {"success": False, "error": "Exercise not found"}, 404