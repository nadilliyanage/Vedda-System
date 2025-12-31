from app import create_app
import os

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", app.config.get("PORT", 5009)))
    print(f"🚀 Starting Artifact Identifier Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", True))
