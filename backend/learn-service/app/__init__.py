from flask import Flask, g, request
from flask_cors import CORS
from bson import ObjectId

from app.config import Config
from app.db.mongo import init_mongo, user_collection
from app.routes.health_routes import health_bp
from app.routes.learn_routes import learn_bp
from app.routes.admin_routes import admin_bp
from app.routes.ai_routes import ai_bp
from app.services.learn_service import seed_challenges_if_empty
from app.models.converters import user_from_mongo  # from your models package


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # DB init
    init_mongo(app)

    # Seed initial challenges
    seed_challenges_if_empty()

    # ---- Load current user for every request ----
    @app.before_request
    def load_current_user():
        user_id = request.headers.get("X-User-Id")
        print(f"User ID: {user_id}")
        if not user_id:
            g.current_user = None
            return

        try:
            doc = user_collection().find_one({"_id": ObjectId(user_id)})
        except Exception as e:
            print("Error loading user:", e)
            g.current_user = None
            return

        g.current_user = user_from_mongo(doc)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(learn_bp, url_prefix="/api/learn")
    app.register_blueprint(admin_bp, url_prefix="/api/learn/admin")
    app.register_blueprint(ai_bp, url_prefix="/api/learn/ai" )

    return app
