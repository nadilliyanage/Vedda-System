from flask import Blueprint, request, jsonify
from app.services.learn_service import (
    list_challenges_public,
    get_next_challenge_public,
    submit_challenge,
    save_user_lesson_progress
)

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