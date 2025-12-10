from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.routes.health_routes import health_bp
from app.routes.speech_routes import speech_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(speech_bp, url_prefix="/api")

    return app

