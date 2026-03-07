from flask import Blueprint, request, jsonify
from app.services.learn_service import (
    list_challenges_public,
    get_next_challenge_public,
    submit_challenge,
    save_user_lesson_progress
)
from app.services.user_stats_service import get_leaderboard
from app.services.lesson_cache_service import get_all_lessons

from app.db.mongo import get_db
from datetime import datetime, timedelta

learn_bp = Blueprint("learn", __name__)


@learn_bp.get("/challenges")
def list_challenges():
    ctype = request.args.get("type")
    challenges = list_challenges_public(ctype)
    return jsonify(challenges)


@learn_bp.get("/next-challenge")
def next_challenge():
    ctype = request.args.get("type")
    payload, status = get_next_challenge_public(ctype)
    return jsonify(payload), status


@learn_bp.post("/submit")
def submit():
    data = request.get_json() or {}
    payload, status = submit_challenge(data)
    return jsonify(payload), status

@learn_bp.post("/lesson-progress")
def lesson_progress():
    payload = request.get_json(force=True)

    user_id = payload["user_id"]
    lesson_id = payload["lesson_id"]
    is_completed = payload["completed"]
    result = save_user_lesson_progress(user_id, lesson_id, is_completed)

    return jsonify({
        "success": True,
        "user_id": user_id,
        "lesson_id": lesson_id,
        "completed": is_completed,
        "started_at": result["started_at"],
        "completed_at": result["completed_at"],
    }), 200

@learn_bp.get("/leaderboard")
def leaderboard():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id query parameter is required"}), 400
    data = get_leaderboard(user_id)
    return jsonify(data), 200

@learn_bp.get("/user-dashboard")
def get_dashboard():
    db = get_db()
    user_id = request.args.get("user_id")

    # Get total lessons from cache instead of database
    total_lessons = len(get_all_lessons())
    total_exercises = db.exercises.count_documents({"type": "MANUAL"})
    # ...existing code...
    lessons_completed = db.user_lessons.count_documents({
        "user_id": user_id,
        "completed": True
    })

    # Exercises completed (MANUAL only)
    manual_exercise_ids = {
        str(e["_id"]) for e in db.exercises.find({"type": "MANUAL"}, {"_id": 1})
    }
    completed_exercise_ids = db.user_attempts.distinct("exercise_id", {"user_id": user_id, "is_correct": True})
    exercises_completed = len([eid for eid in completed_exercise_ids if eid in manual_exercise_ids])

    # Average score
    user_stats = db.user_stats.find_one({"user_id": user_id})
    avg_score = 0
    if user_stats and user_stats.get("overall"):
        avg_score = int(user_stats["overall"]["overall_accuracy"] * 100)

    # Streak
    streak = calculate_streak(db, user_id)

    return jsonify({
        "lessons_completed": lessons_completed,
        "exercises_completed": exercises_completed,
        "avg_score": avg_score,
        "streak": streak,
        "total_lessons": total_lessons,
        "total_exercises": total_exercises,
        "error_stats": user_stats["error_stats"],
    })


@learn_bp.get("/challenge-stat")
def get_challenge_stat():
    db = get_db()
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id query parameter is required"}), 400

    # Get all challenge attempts for the user
    challenge_attempts = list(db.user_attempts.find({
        "user_id": user_id,
        "attempt_type": "challenge"
    }))

    # Calculate accuracy
    total_attempts = len(challenge_attempts)
    if total_attempts == 0:
        accuracy = 0
        best_streak = 0
        total_time_spent = 0
    else:
        correct_attempts = sum(1 for attempt in challenge_attempts if attempt.get("is_correct", False))
        accuracy = round((correct_attempts / total_attempts) * 100, 2)

        # Calculate best streak
        best_streak = calculate_challenge_best_streak(challenge_attempts)

        # Calculate total time spent (sum of time_spent)
        total_time_spent = sum(attempt.get("time_spent", 0) or 0 for attempt in challenge_attempts)

    return jsonify({
        "accuracy": accuracy,
        "bestStreak": best_streak,
        "totalTimeSpent": total_time_spent
    })


def calculate_challenge_best_streak(attempts):
    """
    Calculate the best streak of consecutive days with challenge attempts.
    Uses the timestamp field from user attempts.
    """
    if not attempts:
        return 0

    # Extract unique dates from attempts
    dates = set()
    for attempt in attempts:
        if "timestamp" in attempt and attempt["timestamp"]:
            dates.add(attempt["timestamp"].date())

    if not dates:
        return 0

    # Sort dates
    sorted_dates = sorted(dates)

    # Calculate best streak
    best_streak = 1
    current_streak = 1

    for i in range(1, len(sorted_dates)):
        # Check if consecutive days
        if (sorted_dates[i] - sorted_dates[i-1]).days == 1:
            current_streak += 1
            best_streak = max(best_streak, current_streak)
        else:
            current_streak = 1

    return best_streak


def calculate_streak(db, user_id):
    attempts = db.user_attempts.find(
        {"user_id": user_id},
        {"timestamp": 1}
    )

    dates = set(a["timestamp"].date() for a in attempts if "timestamp" in a)

    if not dates:
        return 0

    streak = 0
    today = datetime.utcnow().date()

    while today in dates:
        streak += 1
        today -= timedelta(days=1)

    return streak