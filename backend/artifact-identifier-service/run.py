from app import create_app
from app.utils.file_downloader import ensure_required_files
import os

if __name__ == "__main__":
    # Ensure required files are downloaded before starting the app
    print("🔍 Checking required files...")
    ensure_required_files()
    
    app = create_app()
    port = int(os.environ.get("PORT", app.config.get("PORT", 5009)))
    print(f"🚀 Starting Artifact Identifier Service on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", True))
