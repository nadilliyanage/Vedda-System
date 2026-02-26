"""
Quick Setup Script for Hybrid RAG System
Automates the setup process
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongo import init_mongo, get_db
from app import create_app
from datetime import datetime


def check_mongodb_connection():
    """Check if MongoDB is connected."""
    print("\n1️⃣ Checking MongoDB connection...")

    try:
        app = create_app()
        init_mongo(app)
        db = get_db()

        # Test connection
        db.command('ping')
        print("   ✓ MongoDB connected successfully")
        return True, db
    except Exception as e:
        print(f"   ✗ MongoDB connection failed: {e}")
        return False, None


def check_knowledge_collection(db):
    """Check if vadda_knowledge collection exists and has documents."""
    print("\n2️⃣ Checking vadda_knowledge collection...")

    try:
        knowledge_coll = db["vadda_knowledge"]
        count = knowledge_coll.count_documents({})

        if count == 0:
            print(f"   ⚠ Collection exists but is empty (0 documents)")
            return False
        else:
            print(f"   ✓ Found {count} knowledge documents")
            return True
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False


def check_schema_fields(db):
    """Check if required fields exist in documents."""
    print("\n3️⃣ Checking document schema...")

    required_fields = ["difficulty", "exercise_types", "priority", "effectiveness", "error_types"]

    try:
        knowledge_coll = db["vadda_knowledge"]
        sample = knowledge_coll.find_one({})

        if not sample:
            print("   ⚠ No documents to check")
            return False

        missing_fields = []
        for field in required_fields:
            if field not in sample:
                missing_fields.append(field)

        if missing_fields:
            print(f"   ⚠ Missing fields in schema: {missing_fields}")
            print(f"   → Run: python migrate_knowledge_schema.py --migrate")
            return False
        else:
            print(f"   ✓ All required fields present")
            return True

    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False


def check_embeddings(db):
    """Check embedding coverage."""
    print("\n4️⃣ Checking embeddings...")

    try:
        knowledge_coll = db["vedda_knowledge"]
        total = knowledge_coll.count_documents({})
        with_embeddings = knowledge_coll.count_documents({
            "embedding": {"$exists": True, "$ne": None, "$ne": []}
        })

        coverage = (with_embeddings / total * 100) if total > 0 else 0

        print(f"   Total documents: {total}")
        print(f"   With embeddings: {with_embeddings}")
        print(f"   Coverage: {coverage:.1f}%")

        if coverage < 100:
            print(f"   ⚠ {total - with_embeddings} documents need embeddings")
            print(f"   → Run: python populate_embeddings.py --populate")
            return False
        else:
            print(f"   ✓ All documents have embeddings")
            return True

    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False


def check_openai_api_key():
    """Check if OpenAI API key is configured."""
    print("\n5️⃣ Checking OpenAI API configuration...")

    try:
        from app.config import Config

        if Config.OPENAI_API_KEY:
            # Mask the key for security
            key_preview = Config.OPENAI_API_KEY[:8] + "..." if len(Config.OPENAI_API_KEY) > 8 else "***"
            print(f"   ✓ OpenAI API key configured ({key_preview})")
            return True
        else:
            print(f"   ✗ OpenAI API key not configured")
            print(f"   → Set OPENAI_API_KEY in .env file")
            return False

    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False


def create_sample_data(db):
    """Create sample knowledge documents for testing."""
    print("\n📝 Creating sample knowledge documents...")

    samples = [
        {
            "type": "grammar_rule",
            "skill_tags": ["question_forms", "basic_grammar"],
            "error_types": ["wrong_question_word"],
            "difficulty": "beginner",
            "exercise_types": ["multiple_choice", "fill_blank"],
            "content": "In Vedda, 'mokadda' means 'what' and is used to ask about things or actions.",
            "example": "Mokadda karanne? = What are you doing?",
            "examples": [
                {"sentence": "Mokadda karanne?", "meaning": "What are you doing?"},
                {"sentence": "Mokadda ona?", "meaning": "What do you want?"}
            ],
            "priority": 2,
            "effectiveness": {
                "times_used": 0,
                "helped_correct": 0,
                "last_used": None
            }
        },
        {
            "type": "grammar_rule",
            "skill_tags": ["question_forms", "basic_grammar"],
            "error_types": ["wrong_question_word"],
            "difficulty": "beginner",
            "exercise_types": ["multiple_choice", "fill_blank"],
            "content": "In Vedda, 'koheda' means 'where' and is used to ask about locations.",
            "example": "Koheda yanava? = Where are you going?",
            "examples": [
                {"sentence": "Koheda yanava?", "meaning": "Where are you going?"},
                {"sentence": "Koheda innava?", "meaning": "Where is it?"}
            ],
            "priority": 2,
            "effectiveness": {
                "times_used": 0,
                "helped_correct": 0,
                "last_used": None
            }
        },
        {
            "type": "grammar_rule",
            "skill_tags": ["greetings", "basic_vocabulary"],
            "error_types": ["wrong_vocabulary"],
            "difficulty": "beginner",
            "exercise_types": ["multiple_choice", "fill_blank"],
            "content": "Basic Vedda greetings: 'Ayubowan' is the traditional greeting meaning 'may you live long'.",
            "example": "Ayubowan = Hello/Greetings",
            "examples": [
                {"sentence": "Ayubowan", "meaning": "Hello/Greetings"}
            ],
            "priority": 1,
            "effectiveness": {
                "times_used": 0,
                "helped_correct": 0,
                "last_used": None
            }
        }
    ]

    try:
        knowledge_coll = db["vadda_knowledge"]
        result = knowledge_coll.insert_many(samples)
        print(f"   ✓ Created {len(result.inserted_ids)} sample documents")
        print(f"   → Run: python populate_embeddings.py --populate")
        return True
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False


def create_indexes(db):
    """Create recommended indexes for performance."""
    print("\n6️⃣ Creating database indexes...")

    try:
        knowledge_coll = db["vadda_knowledge"]

        # Create indexes
        knowledge_coll.create_index([("skill_tags", 1)])
        knowledge_coll.create_index([("difficulty", 1)])
        knowledge_coll.create_index([("error_types", 1)])
        knowledge_coll.create_index([("effectiveness.times_used", -1)])

        print("   ✓ Created indexes on vadda_knowledge")

        # User stats indexes
        db["user_stats"].create_index([("user_id", 1)])
        db["user_attempts"].create_index([("user_id", 1), ("timestamp", -1)])

        print("   ✓ Created indexes on user collections")

        return True

    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False


def run_setup():
    """Run complete setup check."""
    print("="*60)
    print("HYBRID RAG SYSTEM - SETUP VERIFICATION")
    print("="*60)

    # Check MongoDB
    connected, db = check_mongodb_connection()
    if not connected:
        print("\n❌ Setup failed: Cannot connect to MongoDB")
        return

    # Check collection
    has_collection = check_knowledge_collection(db)

    if not has_collection:
        print("\n⚠ No knowledge documents found. Would you like to create sample data?")
        response = input("Create sample documents? (yes/no): ")
        if response.lower() == "yes":
            create_sample_data(db)

    # Check schema
    schema_ok = check_schema_fields(db)

    # Check embeddings
    embeddings_ok = check_embeddings(db)

    # Check API key
    api_ok = check_openai_api_key()

    # Create indexes
    create_indexes(db)

    # Summary
    print("\n" + "="*60)
    print("SETUP SUMMARY")
    print("="*60)

    checks = [
        ("MongoDB Connection", connected),
        ("Knowledge Collection", has_collection or True),
        ("Schema Fields", schema_ok),
        ("Embeddings", embeddings_ok),
        ("OpenAI API Key", api_ok),
    ]

    for check_name, status in checks:
        symbol = "✓" if status else "✗"
        print(f"{symbol} {check_name}")

    all_ok = all(status for _, status in checks)

    print("="*60)

    if all_ok:
        print("\n🎉 Setup complete! Hybrid RAG system is ready to use.")
        print("\nNext steps:")
        print("  1. Start service: python run.py")
        print("  2. Run tests: python test_hybrid_rag.py --all")
        print("  3. Check admin dashboard: GET /api/learn/admin/rag/system-stats")
    else:
        print("\n⚠ Setup incomplete. Please address the issues above.")
        print("\nCommon fixes:")
        print("  • Schema: python migrate_knowledge_schema.py --migrate")
        print("  • Embeddings: python populate_embeddings.py --populate")
        print("  • API Key: Add OPENAI_API_KEY to .env file")


if __name__ == "__main__":
    run_setup()

