from bson import ObjectId
from ..db.mongo import get_collection
from ..models.common import serialize_mongo_doc
from ..services.user_stats_service import get_completed_exercise_ids
from flask import g

# ---------- Challenges ----------

def admin_list_challenges():
    current_user = g.current_user
    print(f"current user: {current_user}")
    col = get_collection("challenges")
    challenges = list(col.find({}))
    for challenge in challenges:
        if "_id" in challenge:
            challenge["_id"] = str(challenge["_id"])
    return challenges


def admin_create_challenge(data: dict):
    col = get_collection("challenges")

    required = ["id", "lessonId", "categoryId", "challengeNumber", "question"]
    if not all(field in data for field in required):
        return {"success": False, "error": "Missing required fields"}, 400

    if col.find_one({"id": data["id"]}):
        return {"success": False, "error": "Challenge with this ID already exists"}, 400

    col.insert_one(data)
    return {"success": True, "message": "Challenge created successfully"}, 201


def admin_get_challenge(challenge_id: str):
    col = get_collection("challenges")
    challenge = col.find_one({"id": challenge_id}, {"_id": 0})

    if challenge:
        return {"success": True, "challenge": challenge}, 200
    else:
        return {"success": False, "error": "Challenge not found"}, 404


def admin_update_challenge(challenge_id: str, data: dict):
    col = get_collection("challenges")

    data.pop("id", None)
    data.pop("_id", None)

    required = ["lessonId", "categoryId", "challengeNumber", "question"]
    if not all(field in data for field in required):
        return {"success": False, "error": "Missing required fields"}, 400

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
    return [serialize_mongo_doc(c) for c in categories]


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
    return serialize_mongo_doc(category), 200


def admin_update_category(category_id: str, data: dict):
    col = get_collection("categories")


    if not col.find_one({"_id": ObjectId(category_id)}):
        return {"success": False, "error": "Category not found"}, 404

    data.pop("_id", None)
    result = col.update_one({"_id": ObjectId(category_id)}, {"$set": data})

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
    return [serialize_mongo_doc(l) for l in lessons]


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
    return serialize_mongo_doc(lesson), 200


def admin_update_lesson(lesson_id: str, data: dict):
    col = get_collection("lessons")

    if not col.find_one({"_id": ObjectId(lesson_id)}):
        return {"success": False, "error": "Lesson not found"}, 404

    # Remove _id from data to prevent attempting to update immutable field
    data.pop("_id", None)

    result = col.update_one({"_id": ObjectId(lesson_id)}, {"$set": data})

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
    completedExList = get_completed_exercise_ids(current_user.id) if current_user else []
    completed_ids = set(completedExList)  # Already strings from user_attempts
    print(f"Completed IDs: {completed_ids}")

    for exercise in exercises:
        if "_id" in exercise:
            exercise_id_str = str(exercise["_id"])
            exercise["_id"] = exercise_id_str
            exercise["completed"] = exercise_id_str in completed_ids
        else:
            exercise["completed"] = False
    return exercises


def admin_create_exercise(data: dict):
    col = get_collection("exercises")

    required = ["id", "lessonId", "categoryId", "exerciseNumber", "question"]
    if not all(field in data for field in required):
        return {"success": False, "error": "Missing required fields"}, 400

    if col.find_one({"id": data["id"]}):
        return {"success": False, "error": "Exercise with this ID already exists"}, 400
    data["type"] = "MANUAL"
    col.insert_one(data)
    return {"success": True, "message": "Exercise created successfully"}, 201


def admin_get_exercise(exercise_id: str):
    col = get_collection("exercises")
    exercise = col.find_one({"id": exercise_id})

    current_user = g.current_user
    completedExList = get_completed_exercise_ids(current_user.id) if current_user else []
    completed_ids = set(completedExList)  # Already strings from user_attempts

    if exercise:
        if "_id" in exercise:
            exercise_id_str = str(exercise["_id"])
            exercise["_id"] = exercise_id_str
            exercise["completed"] = exercise_id_str in completed_ids
        else:
            exercise["completed"] = False
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