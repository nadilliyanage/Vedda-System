from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from threading import Thread

from app.db.mongo import get_collection
from app.ai.service import get_feedback_with_rag
from app.ml.predictor import classify_mistake
from app.services.user_stats_service import add_user_attempt_and_update_stat

ai_bp = Blueprint("ai", __name__)

# -------------------------------
# Background task wrapper
# -------------------------------
def run_add_user_attempt(**kwargs):
    try:
        add_user_attempt_and_update_stat(**kwargs)
    except Exception as e:
        # Log properly in real apps
        print("Background add_user_attempt failed:", e)

@ai_bp.post("/classify-mistake")
def classify_mistake():
    payload = request.get_json(force=True)

    student_answer = payload["student_answer"]
    correct_answer = payload["correct_answer"]

    result = classify_mistake(correct_answer, student_answer)
    return jsonify({"error_type": result})

@ai_bp.post("/submit-answer")
def submit_answer():
    payload = request.get_json(force=True)

    user_id = payload["user_id"]
    exercise_id = payload["exercise_id"]
    student_answer = payload.get("user_answer", "")

    exercise = get_collection("exercises").find_one({"_id": ObjectId(exercise_id)})
    if not exercise:
        return jsonify({"error": "Exercise not found"}), 404

    skill_tags = exercise.get("skillTags", [])
    question = exercise.get("question", "")
    sentence = question.get("prompt", "")
    correct_answer = question.get("correct_answer", "")
    is_correct = student_answer.strip().lower() == correct_answer.strip().lower()

    # store attempt in background
    Thread(
        target=run_add_user_attempt,
        kwargs={
            "user_id": user_id,
            "exercise_id": exercise_id,
            "skill_tags": skill_tags,
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "student_answer": student_answer,
        },
        daemon=True
    ).start()

    feedback, usage = get_feedback_with_rag(
        sentence=sentence,
        correct_answer=correct_answer,
        student_answer=student_answer,
        skill_tags=skill_tags,
        error_type=None,  # later: plug your mistake classifier here
    )

    # update stats
    # _update_user_stats(user_id, skill_tags, bool(feedback.get("is_correct", False)))

    return jsonify({"feedback": feedback, "usage": usage})

def _update_user_stats(user_id: str, skill_tags: list[str], is_correct: bool):
    stats_coll = get_collection("user_stats")
    doc = stats_coll.find_one({"user_id": user_id}) or {"user_id": user_id, "skill_stats": {}}
    skill_stats = doc.get("skill_stats", {})

    for skill in skill_tags:
        skill_stats.setdefault(skill, {"correct": 0, "wrong": 0})
        if is_correct:
            skill_stats[skill]["correct"] += 1
        else:
            skill_stats[skill]["wrong"] += 1

    stats_coll.update_one(
        {"user_id": user_id},
        {"$set": {"skill_stats": skill_stats, "last_updated": datetime.utcnow()}},
        upsert=True
    )
