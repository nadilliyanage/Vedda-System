import os


class Config:
    DEBUG = True
    PORT = int(os.environ.get("PORT", 5006))

    # In real life, don't hardcode credentials – use env vars.
    MONGODB_URI = os.environ.get(
        "MONGODB_URI",
        "mongodb+srv://heshan:3UAXaHwpIRwEqK8K@cluster0.quemmhk.mongodb.net/vedda-system?retryWrites=true&w=majority&appName=Cluster0"
    )
    MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "vedda-system")