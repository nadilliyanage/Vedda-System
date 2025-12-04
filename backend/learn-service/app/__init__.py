from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.db.mongo import init_mongo
from app.routes.health_routes import health_bp
from app.routes.learn_routes import learn_bp
from app.routes.admin_routes import admin_bp
from app.services.learn_service import seed_challenges_if_empty


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # DB init
    init_mongo(app)

    # Seed initial challenges
    seed_challenges_if_empty()

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(learn_bp, url_prefix="/api/learn")
    app.register_blueprint(admin_bp, url_prefix="/api/learn/admin")

    return app