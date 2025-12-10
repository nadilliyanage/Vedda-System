from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.routes.health_routes import health_bp
from app.routes.translator_routes import translator_bp, init_translator


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # Initialize translator service
    init_translator(app)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(translator_bp, url_prefix="/api")

    return app

