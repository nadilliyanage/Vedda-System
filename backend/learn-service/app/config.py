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
    
    # AI Service Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "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")
    OPENAI_MODEL_FAST = os.getenv("OPENAI_MODEL_FAST", "gpt-4o-mini")
    OPENAI_MODEL_GEN = os.getenv("OPENAI_MODEL_GEN", "gpt-4o")