from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.db.mongo import init_mongo
from app.routes.health_routes import health_bp
from app.routes.history_routes import history_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # DB init
    init_mongo(app)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(history_bp, url_prefix="/api/history")

    return app

