from datetime import datetime
from ..db.mongo import get_collection
from ..models.user_attempt_model import UserAttempt
from ..ml.predictor import classify_mistake

def add_user_attempt_and_update_stat(user_id: str, exercise_id: str, skill_tags: list,
                     is_correct: bool, correct_answer: str = None, student_answer: str = None):
    error_type = classify_mistake(correct_answer, student_answer)
    save_user_attempt(
        user_id=user_id,
        exercise_id=exercise_id,
        skill_tags=skill_tags,
        is_correct=is_correct,
        error_type=error_type
    )

    update_user_stats(
        user_id=user_id,
        skill_tags=skill_tags,
        is_correct=is_correct,
        error_type=error_type
    )


def update_user_stats(
    user_id: str,
    skill_tags: list[str],
    is_correct: bool,
    error_type: str | None
):
    """
    Incrementally updates user statistics after each attempt.
    Assumes error_type is already predicted (or None if correct).
    """
    stats_col = _user_stat_col()

    # Fetch existing stats or initialize
    doc = stats_col.find_one({"user_id": user_id})

    if not doc:
        doc = {
            "user_id": user_id,
            "skill_stats": {},
            "error_stats": {},
            "overall": {
                "total_attempts": 0,
                "total_correct": 0,
                "overall_accuracy": 0.0
            }
        }

    # -----------------------
    # Update SKILL STATS
    # -----------------------
    for skill in skill_tags:
        s = doc["skill_stats"].get(skill, {
            "attempts": 0,
            "correct": 0,
            "wrong": 0,
            "accuracy": 0.0
        })

        s["attempts"] += 1
        if is_correct:
            s["correct"] += 1
        else:
            s["wrong"] += 1

        s["accuracy"] = round(s["correct"] / s["attempts"], 2)
        doc["skill_stats"][skill] = s

    # -----------------------
    # Update ERROR STATS
    # -----------------------
    if not is_correct and error_type:
        doc["error_stats"][error_type] = doc["error_stats"].get(error_type, 0) + 1

    # -----------------------
    # Update OVERALL STATS
    # -----------------------
    doc["overall"]["total_attempts"] += 1
    if is_correct:
        doc["overall"]["total_correct"] += 1

    doc["overall"]["overall_accuracy"] = round(
        doc["overall"]["total_correct"] / doc["overall"]["total_attempts"], 2
    )

    doc["last_updated"] = datetime.utcnow()

    # -----------------------
    # Save (UPSERT)
    # -----------------------
    stats_col.update_one(
        {"user_id": user_id},
        {"$set": doc},
        upsert=True
    )


# ---------- User Attempts ----------
def add_user_attempt(user_id: str, exercise_id: str, skill_tags: list,
                     is_correct: bool, correct_answer: str = None, student_answer: str = None):
    error_type = classify_mistake(correct_answer, student_answer)
    return save_user_attempt(
        user_id=user_id,
        exercise_id=exercise_id,
        skill_tags=skill_tags,
        is_correct=is_correct,
        error_type=error_type
    )


def save_user_attempt(user_id: str, exercise_id: str, skill_tags: list,
                      is_correct: bool, error_type: str = None):
    col = _user_attempts_col()

    # Create the user attempt model
    attempt = UserAttempt(
        user_id=user_id,
        exercise_id=exercise_id,
        skill_tags=skill_tags,
        is_correct=is_correct,
        error_type=error_type,
        timestamp=datetime.utcnow()
    )

    # Convert to dictionary and insert into MongoDB
    attempt_dict = attempt.to_dict()
    result = col.insert_one(attempt_dict)

    # Add the MongoDB _id to the returned document
    attempt_dict["_id"] = str(result.inserted_id)

    return attempt_dict


def get_user_attempts(user_id: str, limit: int = 50):
    """
    Retrieve user attempts from MongoDB.

    Args:
        user_id: The ID of the user
        limit: Maximum number of attempts to return (default: 50)

    Returns:
        list: List of user attempt documents
    """
    col = _user_attempts_col()
    attempts = list(col.find({"user_id": user_id})
                    .sort("timestamp", -1)
                    .limit(limit))

    # Convert ObjectId to string for JSON serialization
    for attempt in attempts:
        attempt["_id"] = str(attempt["_id"])

    return attempts

def get_completed_exercise_ids(user_id: str):
    """
    Return a list of unique exercise_id values for correct attempts by the user.
    Uses MongoDB's distinct() to efficiently get unique IDs.
    """
    col = _user_attempts_col()

    # Use distinct to get unique exercise_ids directly from MongoDB
    result = col.distinct("exercise_id", {"user_id": user_id, "is_correct": True})

    print(f"[DEBUG] get_completed_exercise_ids for user {user_id}: found {len(result)} unique completed exercises")
    print(f"[DEBUG] Completed exercise IDs: {result}")

    return result

def get_weak_skills_and_errors(user_stats, min_attempts=5, threshold=0.6):
    weak_skills = []

    for skill, s in user_stats.get("skill_stats", {}).items():
        if s["attempts"] >= min_attempts and s["accuracy"] < threshold:
            weak_skills.append(skill)

    error_stats = user_stats.get("error_stats", {})
    top_errors = sorted(
        error_stats.keys(),
        key=lambda k: safe_int(error_stats.get(k)),
        reverse=True
    )[:2]

    return weak_skills, top_errors

def safe_int(val):
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0

def _user_attempts_col():
    return get_collection("user_attempts")

def _user_stat_col():
    return get_collection("user_stats")