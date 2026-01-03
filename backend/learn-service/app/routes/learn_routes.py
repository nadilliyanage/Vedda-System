from flask import Blueprint, request, jsonify
from app.services.learn_service import (
    list_challenges_public,
    get_next_challenge_public,
    submit_challenge,
    save_user_lesson_progress
)

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

@learn_bp.get("/user-dashboard")
def get_dashboard():
    db = get_db()
    user_id = request.args.get("user_id")

    total_lessons = db.lessons.count_documents({})
    total_exercises = db.exercises.count_documents({})
    # Lessons completed
    lessons_completed = db.user_lessons.count_documents({
        "user_id": user_id,
        "completed": True
    })

    # Exercises completed
    exercises_completed = len(
        db.user_attempts.distinct("exercise_id", {"user_id": user_id})
    )

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
    })


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