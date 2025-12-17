from flask import Blueprint, jsonify
from app.services.learn_service import get_health_info

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    data = get_health_info()
    return jsonify(data)