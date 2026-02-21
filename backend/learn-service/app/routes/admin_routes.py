from flask import Blueprint, request, jsonify

from app.services import admin_service

admin_bp = Blueprint("admin", __name__)

# ----- Challenges -----

@admin_bp.get("/challenges")
def admin_list_challenges():
    data = admin_service.admin_list_challenges()
    return jsonify(data), 200


@admin_bp.post("/challenges")
def admin_create_challenge():
    payload = request.get_json() or {}
    resp, status = admin_service.admin_create_challenge(payload)
    return jsonify(resp), status


@admin_bp.get("/challenges/<challenge_id>")
def admin_get_challenge(challenge_id):
    resp, status = admin_service.admin_get_challenge(challenge_id)
    return jsonify(resp), status


@admin_bp.put("/challenges/<challenge_id>")
def admin_update_challenge(challenge_id):
    payload = request.get_json() or {}
    resp, status = admin_service.admin_update_challenge(challenge_id, payload)
    return jsonify(resp), status


@admin_bp.delete("/challenges/<challenge_id>")
def admin_delete_challenge(challenge_id):
    resp, status = admin_service.admin_delete_challenge(challenge_id)
    return jsonify(resp), status


# ----- Categories -----

@admin_bp.get("/categories")
def admin_list_categories():
    data = admin_service.admin_list_categories()
    return jsonify(data), 200


@admin_bp.post("/categories")
def admin_create_category():
    payload = request.get_json() or {}
    resp, status = admin_service.admin_create_category(payload)
    return jsonify(resp), status


@admin_bp.get("/categories/<category_id>")
def admin_get_category(category_id):
    resp, status = admin_service.admin_get_category(category_id)
    return jsonify(resp), status


@admin_bp.put("/categories/<category_id>")
def admin_update_category(category_id):
    payload = request.get_json() or {}
    resp, status = admin_service.admin_update_category(category_id, payload)
    return jsonify(resp), status


@admin_bp.delete("/categories/<category_id>")
def admin_delete_category(category_id):
    resp, status = admin_service.admin_delete_category(category_id)
    return jsonify(resp), status


# ----- Lessons -----

@admin_bp.get("/lessons")
def admin_list_lessons():
    data = admin_service.admin_list_lessons()
    return jsonify(data), 200


@admin_bp.post("/lessons")
def admin_create_lesson():
    payload = request.get_json() or {}
    resp, status = admin_service.admin_create_lesson(payload)
    return jsonify(resp), status


@admin_bp.get("/lessons/<lesson_id>")
def admin_get_lesson(lesson_id):
    resp, status = admin_service.admin_get_lesson(lesson_id)
    return jsonify(resp), status


@admin_bp.put("/lessons/<lesson_id>")
def admin_update_lesson(lesson_id):
    payload = request.get_json() or {}
    resp, status = admin_service.admin_update_lesson(lesson_id, payload)
    return jsonify(resp), status


@admin_bp.delete("/lessons/<lesson_id>")
def admin_delete_lesson(lesson_id):
    resp, status = admin_service.admin_delete_lesson(lesson_id)
    return jsonify(resp), status


# ----- Exercises -----

@admin_bp.get("/exercises")
def admin_list_exercises():
    data = admin_service.admin_list_exercises()
    return jsonify(data), 200


@admin_bp.post("/exercises")
def admin_create_exercise():
    payload = request.get_json() or {}
    resp, status = admin_service.admin_create_exercise(payload)
    return jsonify(resp), status


@admin_bp.get("/exercises/<exercise_id>")
def admin_get_exercise(exercise_id):
    resp, status = admin_service.admin_get_exercise(exercise_id)
    return jsonify(resp), status


@admin_bp.put("/exercises/<exercise_id>")
def admin_update_exercise(exercise_id):
    payload = request.get_json() or {}
    resp, status = admin_service.admin_update_exercise(exercise_id, payload)
    return jsonify(resp), status


@admin_bp.delete("/exercises/<exercise_id>")
def admin_delete_exercise(exercise_id):
    resp, status = admin_service.admin_delete_exercise(exercise_id)
    return jsonify(resp), status