from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from threading import Thread
import random
import time

from ..db.mongo import ( get_collection, get_db)
from ..ai.service import ( get_feedback_with_rag, generate_exercise_with_rag )
from ..ai.effectiveness_tracker import update_knowledge_effectiveness, track_knowledge_usage
from ..ml.predictor import classify_mistake
from ..services.user_stats_service import (add_user_attempt_and_update_stat, get_weak_skills_and_errors)

ai_bp = Blueprint("ai", __name__)

# -------------------------------
# Background task wrapper
# -------------------------------
def run_add_user_attempt(**kwargs):
    try:
        add_user_attempt_and_update_stat(**kwargs)
    except Exception as e:
        print("Background add_user_attempt failed:", e)

@ai_bp.post("/generate-personalized-exercise")
def generate_personalized_exercise():
    data = request.get_json()
    user_id = data["user_id"]

    # Use timestamp-based exercise number for variety
    exercise_number = int(time.time()) % 1000  # Changes every second

    exercise, usage = generate_personalized_exercise_for_user(
        user_id=user_id,
        exercise_number=exercise_number
    )

    exercise["type"] = "AI_GENERATED"
    exercise["user_id"] = user_id
    exercise["created_at"] = datetime.utcnow()

    result = get_collection("exercises").insert_one(exercise)
    exercise["_id"] = str(result.inserted_id)

    # return jsonify({
    #     "exercise": exercise,
    #     "token_usage": usage
    # })
    return exercise

@ai_bp.post("/classify-mistake")
def classify_mistakes():
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
    is_challenge = payload.get("is_challenge", False)

    # Fetch document from the appropriate collection
    try:
        object_id = ObjectId(exercise_id)
    except Exception:
        return jsonify({"error": "Invalid ID format"}), 400

    if is_challenge:
        doc = get_collection("challenges").find_one({"_id": object_id})
        if not doc:
            return jsonify({"error": "Challenge not found"}), 404
    else:
        doc = get_collection("exercises").find_one({"_id": object_id})
        if not doc:
            return jsonify({"error": "Exercise not found"}), 404

    skill_tags = doc.get("skillTags", [])
    question = doc.get("question", {})
    sentence = question.get("prompt", "")

    # Derive a comparable correct_answer string
    if is_challenge:
        q_type = question.get("type", "")
        if q_type == "text_input":
            correct_answer = question.get("answer", "")
        elif q_type == "multiple_choice":
            correct_opt_ids = set(question.get("correctOptions", []))
            options_map = {o["id"]: o["text"] for o in question.get("options", [])}
            correct_answer = ", ".join(options_map.get(oid, oid) for oid in sorted(correct_opt_ids))
        elif q_type == "match_pairs":
            pairs = question.get("pairs", [])
            correct_answer = "; ".join(f"{p['left']} -> {p['right']}" for p in pairs)
        else:
            correct_answer = question.get("answer", "")
    else:
        correct_answer = question.get("correct_answer", "")

    is_correct = student_answer.strip().lower() == correct_answer.strip().lower()

    # Classify mistake if incorrect
    error_type = None
    if not is_correct:
        error_type = classify_mistake(correct_answer, student_answer)

    # Get feedback with RAG (now includes user_id for personalization)
    feedback, usage = get_feedback_with_rag(
        sentence=sentence,
        correct_answer=correct_answer,
        student_answer=student_answer,
        skill_tags=skill_tags,
        error_type=error_type,
        user_id=user_id  # NEW: Pass user_id for personalization
    )

    # Extract retrieved knowledge IDs for effectiveness tracking
    knowledge_ids = feedback.pop("_retrieved_knowledge_ids", [])

    # Track knowledge effectiveness in background
    if knowledge_ids:
        db = get_db()
        Thread(
            target=lambda: update_knowledge_effectiveness(db, knowledge_ids, is_correct),
            daemon=True
        ).start()

        # Also track detailed usage
        Thread(
            target=lambda: track_knowledge_usage(db, user_id, exercise_id, knowledge_ids, is_correct),
            daemon=True
        ).start()

    # Store attempt in background
    attempt_type = "challenge" if is_challenge else "general"
    Thread(
        target=run_add_user_attempt,
        kwargs={
            "user_id": user_id,
            "exercise_id": exercise_id,
            "skill_tags": skill_tags,
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "student_answer": student_answer,
            "attempt_type": attempt_type,
        },
        daemon=True
    ).start()


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

def generate_personalized_exercise_for_user(user_id: str, exercise_number: int = 1):
    db = get_db()

    # 1. Fetch user stats
    user_stats = db.user_stats.find_one({"user_id": user_id})
    if not user_stats:
        # Create default stats for new user
        user_stats = {
            "user_id": user_id,
            "skill_stats": {},
            "error_stats": {}
        }

    # 2. Extract weak skills + error types
    weak_skills, top_errors = get_weak_skills_and_errors(user_stats)

    # 3. Get all available skills from knowledge base
    knowledge_coll = db["vedda_knowledge"]
    all_skill_tags = knowledge_coll.distinct("skill_tags")

    # 4. Add variety by rotating through skills
    if not weak_skills:
        # If no weak skills, pick random skills from available
        available_skills = [s for s in all_skill_tags if s]
        if available_skills:
            # Pick 1-2 random skills
            num_skills = min(2, len(available_skills))
            weak_skills = random.sample(available_skills, num_skills)
        else:
            weak_skills = ["basic_vocabulary"]
    else:
        # Mix weak skills with random skill for variety
        if len(weak_skills) > 1:
            # Sometimes pick subset of weak skills
            num_to_pick = random.randint(1, len(weak_skills))
            weak_skills = random.sample(weak_skills, num_to_pick)

        # Occasionally add a random skill
        if random.random() < 0.3 and all_skill_tags:  # 30% chance
            random_skill = random.choice([s for s in all_skill_tags if s and s not in weak_skills])
            weak_skills.append(random_skill)

    # 5. Rotate error types for variety
    if not top_errors:
        top_errors = ["spelling_error"]
    elif len(top_errors) > 1:
        # Randomly pick subset
        num_errors = random.randint(1, min(2, len(top_errors)))
        top_errors = random.sample(top_errors, num_errors)

    # 6. Vary difficulty randomly for more variety
    difficulty_levels = ["beginner", "beginner", "intermediate"]  # Weight toward beginner
    difficulty = random.choice(difficulty_levels)

    # 7. Call AI exercise generator with varied parameters
    exercise, usage = generate_exercise_with_rag(
        skills=weak_skills,
        error_types=top_errors,
        exercise_number=exercise_number,
        difficulty=difficulty
    )

    return exercise, usage