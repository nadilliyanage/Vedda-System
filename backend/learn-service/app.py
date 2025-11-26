import os
import re
from datetime import datetime
from random import choice as rand_choice

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

PORT = int(os.environ.get("PORT", 5006))
MONGODB_URI = os.environ.get(
    "MONGODB_URI",
    "mongodb+srv://heshan:3UAXaHwpIRwEqK8K@cluster0.quemmhk.mongodb.net/vedda-system?retryWrites=true&w=majority&appName=Cluster0"
)

app = Flask(__name__)
CORS(app)

# MongoDB connection
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client['vedda-system']
    challenges_collection = db['challenges']
    lessons_collection = db['lessons']
    categories_collection = db['categories']
    exercises_collection = db['exercises']
    print("MongoDB connected successfully")
except ConnectionFailure as e:
    print(f"MongoDB connection failed: {e}")
    raise


def _normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def _sanitize_challenge(ch):
    sanitized = {k: v for k, v in ch.items() if k not in ("answers", "correct", "_id")}
    # For match_pairs, add shuffled rightOptions
    if ch.get("type") == "match_pairs" and "pairs" in ch:
        from random import shuffle
        right_options = [pair["right"] for pair in ch["pairs"]]
        shuffle(right_options)
        sanitized["rightOptions"] = right_options
    return sanitized


def _seed_challenges_if_empty():
    """Seed initial challenges if collection is empty"""
    if challenges_collection.count_documents({}) == 0:
        seed_challenges = [
            {
                "id": "fb1",
                "type": "fill_blank",
                "prompt": "Type the English word for 'ගසා (gasa)'",
                "answers": ["tree"],
                "xp": 20,
                "coins": 4,
                "timeLimitSec": 45
            },
            {
                "id": "fb2",
                "type": "fill_blank",
                "prompt": "Type the English word for 'අට (ata)'",
                "answers": ["eight", "8"],
                "xp": 20,
                "coins": 4,
                "timeLimitSec": 45
            },
            {
                "id": "mc1",
                "type": "multiple_choice",
                "prompt": "Select the correct English meaning for 'වැලි (weli)'.",
                "options": [
                    {"id": "A", "text": "sand"},
                    {"id": "B", "text": "stone"},
                    {"id": "C", "text": "water"},
                    {"id": "D", "text": "leaf"}
                ],
                "correct": ["A"],
                "xp": 15,
                "coins": 3,
                "timeLimitSec": 30
            },
            {
                "id": "mp1",
                "type": "match_pairs",
                "prompt": "Match the Vedda words with their English meanings",
                "pairs": [
                    {"left": "ගස (gasa)", "right": "tree"},
                    {"left": "වතුර (vatura)", "right": "water"},
                    {"left": "කන්ද (kanda)", "right": "mountain"}
                ],
                "xp": 25,
                "coins": 5,
                "timeLimitSec": 60
            },
            {
                "id": "mp2",
                "type": "match_pairs",
                "prompt": "Match the Vedda numbers with their English translations",
                "pairs": [
                    {"left": "එක (eka)", "right": "one"},
                    {"left": "දෙක (deka)", "right": "two"},
                    {"left": "තුන (thuna)", "right": "three"},
                    {"left": "හතර (hathara)", "right": "four"}
                ],
                "xp": 30,
                "coins": 6,
                "timeLimitSec": 60
            }
        ]
        challenges_collection.insert_many(seed_challenges)
        print(f"Seeded {len(seed_challenges)} challenges to MongoDB")


# Seed challenges on startup if empty
_seed_challenges_if_empty()


@app.route("/health", methods=["GET"])
def health():
    challenge_count = challenges_collection.count_documents({})
    return jsonify({
        "status": "healthy",
        "service": "learn-service",
        "timestamp": datetime.now().isoformat(),
        "challenge_count": challenge_count,
        "database": "MongoDB"
    })


@app.route("/api/learn/challenges", methods=["GET"])
def list_challenges():
    ctype = request.args.get("type")
    query = {"type": ctype} if ctype else {}
    challenges = list(challenges_collection.find(query))
    return jsonify([_sanitize_challenge(c) for c in challenges])


@app.route("/api/learn/next-challenge", methods=["GET"])
def next_challenge():
    ctype = request.args.get("type")
    query = {"type": ctype} if ctype else {}
    challenges = list(challenges_collection.find(query))
    if not challenges:
        return jsonify({"error": "No challenges available"}), 404
    picked = rand_choice(challenges)
    return jsonify(_sanitize_challenge(picked))


@app.route("/api/learn/submit", methods=["POST"])
def submit_challenge():
    data = request.get_json() or {}
    challenge_id = data.get("challengeId")
    answer = data.get("answer") if "answer" in data else data.get("selectedOption")
    if not challenge_id:
        return jsonify({"success": False, "error": "challengeId required"}), 400
    ch = challenges_collection.find_one({"id": challenge_id})
    if not ch:
        return jsonify({"success": False, "error": "Unknown challengeId"}), 400

    result = {"success": True, "challengeId": challenge_id}
    if ch["type"] == "fill_blank":
        provided = _normalize_text(str(answer))
        valid = {_normalize_text(a) for a in ch.get("answers", [])}
        is_correct = provided in valid
        base_xp = ch.get("xp", 20)
        base_coins = ch.get("coins", 4)
        result.update({
            "type": "fill_blank",
            "correct": is_correct,
            "xpAwarded": base_xp if is_correct else max(1, base_xp // 4),
            "coinsAwarded": base_coins if is_correct else max(1, base_coins // 4)
        })
    elif ch["type"] == "multiple_choice":
        correct_set = set(ch.get("correct", []))
        is_correct = str(answer) in correct_set
        base_xp = ch.get("xp", 15)
        base_coins = ch.get("coins", 3)
        result.update({
            "type": "multiple_choice",
            "correct": is_correct,
            "xpAwarded": base_xp if is_correct else max(1, base_xp // 3),
            "coinsAwarded": base_coins if is_correct else max(1, base_coins // 3)
        })
    elif ch["type"] == "match_pairs":
        # answer should be dict like {"ගස (gasa)": "tree", ...}
        user_pairs = answer if isinstance(answer, dict) else {}
        solution = {pair["left"]: pair["right"] for pair in ch.get("pairs", [])}
        correct_pairs = sum(1 for left, right in user_pairs.items() if solution.get(left) == right)
        total_pairs = len(solution)
        is_correct = correct_pairs == total_pairs
        base_xp = ch.get("xp", 25)
        base_coins = ch.get("coins", 5)
        # Partial credit based on correct pairs
        xp_awarded = int(base_xp * (correct_pairs / total_pairs)) if total_pairs > 0 else 0
        coins_awarded = int(base_coins * (correct_pairs / total_pairs)) if total_pairs > 0 else 0
        result.update({
            "type": "match_pairs",
            "correct": is_correct,
            "correctPairs": correct_pairs,
            "totalPairs": total_pairs,
            "xpAwarded": max(1, xp_awarded) if correct_pairs > 0 else 0,
            "coinsAwarded": max(1, coins_awarded) if correct_pairs > 0 else 0
        })
    else:
        result.update({"correct": False, "xpAwarded": 0, "coinsAwarded": 0, "error": "Unsupported challenge type"})
    return jsonify(result)


# Admin CRUD endpoints
@app.route("/api/learn/admin/challenges", methods=["GET"])
def admin_list_challenges():
    """Get all challenges including answers (for admin)"""
    ctype = request.args.get("type")
    query = {"type": ctype} if ctype else {}
    challenges = list(challenges_collection.find(query))
    # Return full challenge data including answers for admin
    return jsonify([{k: v for k, v in c.items() if k != "_id"} for c in challenges])


@app.route("/api/learn/admin/challenges", methods=["POST"])
def admin_create_challenge():
    """Create a new challenge"""
    data = request.get_json() or {}
    
    # Validate required fields
    if not data.get("id"):
        return jsonify({"success": False, "error": "Challenge ID is required"}), 400
    if not data.get("type"):
        return jsonify({"success": False, "error": "Challenge type is required"}), 400
    if not data.get("prompt"):
        return jsonify({"success": False, "error": "Prompt is required"}), 400
    
    # Check if ID already exists
    if challenges_collection.find_one({"id": data["id"]}):
        return jsonify({"success": False, "error": "Challenge ID already exists"}), 400
    
    # Validate type-specific fields
    if data["type"] == "fill_blank":
        if not data.get("answers") or not isinstance(data["answers"], list):
            return jsonify({"success": False, "error": "Answers array is required for fill_blank"}), 400
    elif data["type"] == "multiple_choice":
        if not data.get("options") or not isinstance(data["options"], list):
            return jsonify({"success": False, "error": "Options array is required for multiple_choice"}), 400
        if not data.get("correct") or not isinstance(data["correct"], list):
            return jsonify({"success": False, "error": "Correct answers array is required for multiple_choice"}), 400
    elif data["type"] == "match_pairs":
        if not data.get("pairs") or not isinstance(data["pairs"], list):
            return jsonify({"success": False, "error": "Pairs array is required for match_pairs"}), 400
    
    # Insert challenge
    challenges_collection.insert_one(data)
    return jsonify({"success": True, "message": "Challenge created successfully", "id": data["id"]})


@app.route("/api/learn/admin/challenges/<challenge_id>", methods=["GET"])
def admin_get_challenge(challenge_id):
    """Get a single challenge by ID (for admin)"""
    challenge = challenges_collection.find_one({"id": challenge_id})
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404
    return jsonify({k: v for k, v in challenge.items() if k != "_id"})


@app.route("/api/learn/admin/challenges/<challenge_id>", methods=["PUT"])
def admin_update_challenge(challenge_id):
    """Update an existing challenge"""
    data = request.get_json() or {}
    
    # Check if challenge exists
    existing = challenges_collection.find_one({"id": challenge_id})
    if not existing:
        return jsonify({"success": False, "error": "Challenge not found"}), 404
    
    # Don't allow changing the ID
    if "id" in data and data["id"] != challenge_id:
        return jsonify({"success": False, "error": "Cannot change challenge ID"}), 400
    
    # Update challenge
    result = challenges_collection.update_one(
        {"id": challenge_id},
        {"$set": data}
    )
    
    if result.modified_count > 0:
        return jsonify({"success": True, "message": "Challenge updated successfully"})
    else:
        return jsonify({"success": True, "message": "No changes made"})


@app.route("/api/learn/admin/challenges/<challenge_id>", methods=["DELETE"])
def admin_delete_challenge(challenge_id):
    """Delete a challenge"""
    result = challenges_collection.delete_one({"id": challenge_id})
    
    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Challenge deleted successfully"})
    else:
        return jsonify({"success": False, "error": "Challenge not found"}), 404


# Category CRUD endpoints
@app.route("/api/learn/admin/categories", methods=["GET"])
def admin_list_categories():
    """Get all categories"""
    categories = list(categories_collection.find({}))
    return jsonify([{k: v for k, v in c.items() if k != "_id"} for c in categories])


@app.route("/api/learn/admin/categories", methods=["POST"])
def admin_create_category():
    """Create a new category"""
    data = request.get_json() or {}
    
    if not data.get("id"):
        return jsonify({"success": False, "error": "Category ID is required"}), 400
    if not data.get("name"):
        return jsonify({"success": False, "error": "Category name is required"}), 400
    
    # Check if ID already exists
    if categories_collection.find_one({"id": data["id"]}):
        return jsonify({"success": False, "error": "Category ID already exists"}), 400
    
    categories_collection.insert_one(data)
    return jsonify({"success": True, "message": "Category created successfully", "id": data["id"]})


@app.route("/api/learn/admin/categories/<category_id>", methods=["GET"])
def admin_get_category(category_id):
    """Get a single category by ID"""
    category = categories_collection.find_one({"id": category_id})
    if not category:
        return jsonify({"error": "Category not found"}), 404
    return jsonify({k: v for k, v in category.items() if k != "_id"})


@app.route("/api/learn/admin/categories/<category_id>", methods=["PUT"])
def admin_update_category(category_id):
    """Update an existing category"""
    data = request.get_json() or {}
    
    # Check if category exists
    if not categories_collection.find_one({"id": category_id}):
        return jsonify({"success": False, "error": "Category not found"}), 404
    
    # Don't allow changing the ID
    if "id" in data and data["id"] != category_id:
        return jsonify({"success": False, "error": "Cannot change category ID"}), 400
    
    result = categories_collection.update_one(
        {"id": category_id},
        {"$set": data}
    )
    
    if result.modified_count > 0:
        return jsonify({"success": True, "message": "Category updated successfully"})
    else:
        return jsonify({"success": True, "message": "No changes made"})


@app.route("/api/learn/admin/categories/<category_id>", methods=["DELETE"])
def admin_delete_category(category_id):
    """Delete a category"""
    result = categories_collection.delete_one({"id": category_id})
    
    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Category deleted successfully"})
    else:
        return jsonify({"success": False, "error": "Category not found"}), 404


# Lesson CRUD endpoints
@app.route("/api/learn/admin/lessons", methods=["GET"])
def admin_list_lessons():
    """Get all lessons"""
    lessons = list(lessons_collection.find({}))
    return jsonify([{k: v for k, v in l.items() if k != "_id"} for l in lessons])


@app.route("/api/learn/admin/lessons", methods=["POST"])
def admin_create_lesson():
    """Create a new lesson"""
    data = request.get_json() or {}
    
    if not data.get("id"):
        return jsonify({"success": False, "error": "Lesson ID is required"}), 400
    if not data.get("topic"):
        return jsonify({"success": False, "error": "Topic is required"}), 400
    if not data.get("categoryId"):
        return jsonify({"success": False, "error": "Category ID is required"}), 400
    
    # Check if ID already exists
    if lessons_collection.find_one({"id": data["id"]}):
        return jsonify({"success": False, "error": "Lesson ID already exists"}), 400
    
    lessons_collection.insert_one(data)
    return jsonify({"success": True, "message": "Lesson created successfully", "id": data["id"]})


@app.route("/api/learn/admin/lessons/<lesson_id>", methods=["GET"])
def admin_get_lesson(lesson_id):
    """Get a single lesson by ID"""
    lesson = lessons_collection.find_one({"id": lesson_id})
    if not lesson:
        return jsonify({"error": "Lesson not found"}), 404
    return jsonify({k: v for k, v in lesson.items() if k != "_id"})


@app.route("/api/learn/admin/lessons/<lesson_id>", methods=["PUT"])
def admin_update_lesson(lesson_id):
    """Update an existing lesson"""
    data = request.get_json() or {}
    
    # Check if lesson exists
    if not lessons_collection.find_one({"id": lesson_id}):
        return jsonify({"success": False, "error": "Lesson not found"}), 404
    
    # Don't allow changing the ID
    if "id" in data and data["id"] != lesson_id:
        return jsonify({"success": False, "error": "Cannot change lesson ID"}), 400
    
    result = lessons_collection.update_one(
        {"id": lesson_id},
        {"$set": data}
    )
    
    if result.modified_count > 0:
        return jsonify({"success": True, "message": "Lesson updated successfully"})
    else:
        return jsonify({"success": True, "message": "No changes made"})


@app.route("/api/learn/admin/lessons/<lesson_id>", methods=["DELETE"])
def admin_delete_lesson(lesson_id):
    """Delete a lesson"""
    result = lessons_collection.delete_one({"id": lesson_id})
    
    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Lesson deleted successfully"})
    else:
        return jsonify({"success": False, "error": "Lesson not found"}), 404


# ========== Admin Exercise Routes ==========

@app.route("/api/learn/admin/exercises", methods=["GET"])
def admin_get_exercises():
    """Get all exercises"""
    exercises = list(exercises_collection.find({}, {"_id": 0}))
    return jsonify(exercises)


@app.route("/api/learn/admin/exercises", methods=["POST"])
def admin_create_exercise():
    """Create a new exercise"""
    data = request.get_json()
    
    # Validate required fields
    required = ["id", "lessonId", "categoryId", "exerciseNumber", "questions"]
    if not all(field in data for field in required):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
    
    # Check if exercise with this ID already exists
    if exercises_collection.find_one({"id": data["id"]}):
        return jsonify({"success": False, "error": "Exercise with this ID already exists"}), 400
    
    # Insert the exercise
    exercises_collection.insert_one(data)
    return jsonify({"success": True, "message": "Exercise created successfully"})


@app.route("/api/learn/admin/exercises/<exercise_id>", methods=["GET"])
def admin_get_exercise(exercise_id):
    """Get a single exercise"""
    exercise = exercises_collection.find_one({"id": exercise_id}, {"_id": 0})
    
    if exercise:
        return jsonify({"success": True, "exercise": exercise})
    else:
        return jsonify({"success": False, "error": "Exercise not found"}), 404


@app.route("/api/learn/admin/exercises/<exercise_id>", methods=["PUT"])
def admin_update_exercise(exercise_id):
    """Update an exercise"""
    data = request.get_json()
    
    # Remove id from data if present (shouldn't update the ID)
    data.pop("id", None)
    data.pop("_id", None)
    
    # Validate required fields
    required = ["lessonId", "categoryId", "exerciseNumber", "questions"]
    if not all(field in data for field in required):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
    
    # Update the exercise
    result = exercises_collection.update_one(
        {"id": exercise_id},
        {"$set": data}
    )
    
    if result.modified_count > 0:
        return jsonify({"success": True, "message": "Exercise updated successfully"})
    else:
        return jsonify({"success": True, "message": "No changes made"})


@app.route("/api/learn/admin/exercises/<exercise_id>", methods=["DELETE"])
def admin_delete_exercise(exercise_id):
    """Delete an exercise"""
    result = exercises_collection.delete_one({"id": exercise_id})
    
    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Exercise deleted successfully"})
    else:
        return jsonify({"success": False, "error": "Exercise not found"}), 404


if __name__ == "__main__":
    print(f"Starting Learn Service on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=True)
