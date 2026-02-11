from flask import Flask
from flask_cors import CORS

from app.config import Config
from app.routes.health_routes import health_bp
from app.routes.identifier_routes import identifier_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS
    CORS(app)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(identifier_bp, url_prefix="/api/identifier")

    # Initialize artifact identifier service on startup
    from app.services.identifier_service import get_identifier_service
    with app.app_context():
        try:
            service = get_identifier_service()
            print("✅ Artifact Identifier Service initialized successfully")
        except Exception as e:
            print(f"⚠️  Warning: Could not initialize identifier service: {e}")
            print(f"   Error type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            print("   Make sure the model and metadata files are in the data/ directory")

    return app
