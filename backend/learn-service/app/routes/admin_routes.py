from flask import Blueprint, request, jsonify

from app.services import admin_service

admin_bp = Blueprint("admin", __name__)

# ----- Challenges -----

@admin_bp.route("/challenges", methods=["GET"])
def admin_list_challenges():
    ctype = request.args.get("type")
    data = admin_service.admin_list_challenges(ctype)
    return jsonify(data), 200


@admin_bp.route("/challenges", methods=["POST"])
def admin_create_challenge():
    payload = request.get_json() or {}
    resp, status = admin_service.admin_create_challenge(payload)
    return jsonify(resp), status


@admin_bp.route("/challenges/<challenge_id>", methods=["GET"])
def admin_get_challenge(challenge_id):
    resp, status = admin_service.admin_get_challenge(challenge_id)
    return jsonify(resp), status


@admin_bp.route("/challenges/<challenge_id>", methods=["PUT"])
def admin_update_challenge(challenge_id):
    payload = request.get_json() or {}
    resp, status = admin_service.admin_update_challenge(challenge_id, payload)
    return jsonify(resp), status


@admin_bp.route("/challenges/<challenge_id>", methods=["DELETE"])
def admin_delete_challenge(challenge_id):
    resp, status = admin_service.admin_delete_challenge(challenge_id)
    return jsonify(resp), status


# ----- Categories -----

@admin_bp.route("/categories", methods=["GET"])
def admin_list_categories():
    data = admin_service.admin_list_categories()
    return jsonify(data), 200


@admin_bp.route("/categories", methods=["POST"])
def admin_create_category():
    payload = request.get_json() or {}
    resp, status = admin_service.admin_create_category(payload)
    return jsonify(resp), status


@admin_bp.route("/categories/<category_id>", methods=["GET"])
def admin_get_category(category_id):
    resp, status = admin_service.admin_get_category(category_id)
    return jsonify(resp), status


@admin_bp.route("/categories/<category_id>", methods=["PUT"])
def admin_update_category(category_id):
    payload = request.get_json() or {}
    resp, status = admin_service.admin_update_category(category_id, payload)
    return jsonify(resp), status


@admin_bp.route("/categories/<category_id>", methods=["DELETE"])
def admin_delete_category(category_id):
    resp, status = admin_service.admin_delete_category(category_id)
    return jsonify(resp), status


# ----- Lessons -----

@admin_bp.route("/lessons", methods=["GET"])
def admin_list_lessons():
    data = admin_service.admin_list_lessons()
    return jsonify(data), 200


@admin_bp.route("/lessons", methods=["POST"])
def admin_create_lesson():
    payload = request.get_json() or {}
    resp, status = admin_service.admin_create_lesson(payload)
    return jsonify(resp), status


@admin_bp.route("/lessons/<lesson_id>", methods=["GET"])
def admin_get_lesson(lesson_id):
    resp, status = admin_service.admin_get_lesson(lesson_id)
    return jsonify(resp), status


@admin_bp.route("/lessons/<lesson_id>", methods=["PUT"])
def admin_update_lesson(lesson_id):
    payload = request.get_json() or {}
    resp, status = admin_service.admin_update_lesson(lesson_id, payload)
    return jsonify(resp), status


@admin_bp.route("/lessons/<lesson_id>", methods=["DELETE"])
def admin_delete_lesson(lesson_id):
    resp, status = admin_service.admin_delete_lesson(lesson_id)
    return jsonify(resp), status


# ----- Exercises -----

@admin_bp.route("/exercises", methods=["GET"])
def admin_list_exercises():
    data = admin_service.admin_list_exercises()
    return jsonify(data), 200


@admin_bp.route("/exercises", methods=["POST"])
def admin_create_exercise():
    payload = request.get_json() or {}
    resp, status = admin_service.admin_create_exercise(payload)
    return jsonify(resp), status


@admin_bp.route("/exercises/<exercise_id>", methods=["GET"])
def admin_get_exercise(exercise_id):
    resp, status = admin_service.admin_get_exercise(exercise_id)
    return jsonify(resp), status


@admin_bp.route("/exercises/<exercise_id>", methods=["PUT"])
def admin_update_exercise(exercise_id):
    payload = request.get_json() or {}
    resp, status = admin_service.admin_update_exercise(exercise_id, payload)
    return jsonify(resp), status


@admin_bp.route("/exercises/<exercise_id>", methods=["DELETE"])
def admin_delete_exercise(exercise_id):
    resp, status = admin_service.admin_delete_exercise(exercise_id)
    return jsonify(resp), status