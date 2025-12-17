from flask import Flask
from flask_cors import CORS
import logging

from app.config import Config
from app.db.mongo import init_mongo
from app.routes.health_routes import health_bp
from app.routes.speech_routes import speech_bp

# Configure logging
logging.basicConfig(level=logging.INFO)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # Initialize MongoDB (optional, for Vedda dictionary support)
    if app.config.get('MONGODB_URI'):
        init_mongo(app)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(speech_bp, url_prefix="/api")

    return app

