"""
Quick Deployment Verification Script
Run this to verify the Hybrid RAG system is properly deployed
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongo import init_mongo, get_db
from app import create_app


def verify_deployment():
    """Verify all deployment requirements are met."""

    print("\n" + "="*70)
    print("HYBRID RAG SYSTEM - DEPLOYMENT VERIFICATION")
    print("="*70)

    checks = []

    # 1. MongoDB Connection
    print("\n[1/7] Checking MongoDB connection...")
    try:
        app = create_app()
        init_mongo(app)
        db = get_db()
        db.command('ping')
        print("  ✓ MongoDB connected")
        checks.append(True)
    except Exception as e:
        print(f"  ✗ MongoDB connection failed: {e}")
        checks.append(False)
        return checks

    # 2. Knowledge Base
    print("\n[2/7] Checking knowledge base...")
    try:
        knowledge_coll = db["vedda_knowledge"]
        count = knowledge_coll.count_documents({})

        if count > 0:
            print(f"  ✓ Found {count} knowledge documents")
            checks.append(True)
        else:
            print("  ✗ No knowledge documents found")
            print("    → Run: python create_sample_kb.py")
            checks.append(False)
    except Exception as e:
        print(f"  ✗ Error: {e}")
        checks.append(False)

    # 3. Schema Fields
    print("\n[3/7] Checking schema fields...")
    try:
        sample = knowledge_coll.find_one({})
        required = ["difficulty", "exercise_types", "priority", "effectiveness", "error_types"]

        missing = [f for f in required if f not in sample]

        if not missing:
            print("  ✓ All required schema fields present")
            checks.append(True)
        else:
            print(f"  ✗ Missing fields: {missing}")
            print("    → Run: python migrate_knowledge_schema.py --migrate")
            checks.append(False)
    except Exception as e:
        print(f"  ✗ Error: {e}")
        checks.append(False)

    # 4. Embeddings
    print("\n[4/7] Checking embeddings...")
    try:
        total = knowledge_coll.count_documents({})
        with_emb = knowledge_coll.count_documents({"embedding": {"$exists": True, "$ne": None}})
        coverage = (with_emb / total * 100) if total > 0 else 0

        if coverage == 100:
            print(f"  ✓ 100% embedding coverage ({with_emb}/{total})")
            checks.append(True)
        else:
            print(f"  ⚠ {coverage:.1f}% coverage ({with_emb}/{total})")
            print("    → Run: python populate_embeddings.py --populate")
            checks.append(False)
    except Exception as e:
        print(f"  ✗ Error: {e}")
        checks.append(False)

    # 5. OpenAI API Key
    print("\n[5/7] Checking OpenAI API configuration...")
    try:
        from app.config import Config

        if Config.OPENAI_API_KEY:
            key_preview = Config.OPENAI_API_KEY[:8] + "..." if len(Config.OPENAI_API_KEY) > 8 else "***"
            print(f"  ✓ OpenAI API key configured ({key_preview})")
            checks.append(True)
        else:
            print("  ✗ OpenAI API key not set")
            print("    → Set OPENAI_API_KEY in .env file")
            checks.append(False)
    except Exception as e:
        print(f"  ✗ Error: {e}")
        checks.append(False)

    # 6. Indexes
    print("\n[6/7] Checking database indexes...")
    try:
        indexes = list(knowledge_coll.list_indexes())
        index_names = [idx['name'] for idx in indexes]

        # Count non-default indexes
        custom_indexes = [idx for idx in index_names if idx != '_id_']

        if len(custom_indexes) >= 1:
            print(f"  ✓ Found {len(custom_indexes)} custom index(es)")
            for idx in custom_indexes[:3]:  # Show first 3
                print(f"    - {idx}")
            checks.append(True)
        else:
            print("  ⚠ No custom indexes found (recommended but not required)")
            print("    → Optional: Run python setup_hybrid_rag.py")
            checks.append(True)  # Non-critical, mark as pass
    except Exception as e:
        print(f"  ⚠ Could not verify indexes: {e}")
        checks.append(True)  # Non-critical

    # 7. Test Suite
    print("\n[7/7] Running quick test...")
    try:
        from app.ai.embedding_service import generate_embedding
        test_emb = generate_embedding("test")

        if len(test_emb) == 1536:
            print("  ✓ Embedding generation working")
            checks.append(True)
        else:
            print("  ✗ Unexpected embedding dimension")
            checks.append(False)
    except Exception as e:
        print(f"  ✗ Embedding test failed: {e}")
        checks.append(False)

    # Summary
    print("\n" + "="*70)
    print("VERIFICATION SUMMARY")
    print("="*70)

    passed = sum(checks)
    total = len(checks)

    status_items = [
        "MongoDB Connection",
        "Knowledge Base",
        "Schema Fields",
        "Embeddings",
        "OpenAI API Key",
        "Database Indexes",
        "System Test"
    ]

    for i, (item, status) in enumerate(zip(status_items, checks), 1):
        symbol = "✓" if status else "✗"
        print(f"{symbol} [{i}/7] {item}")

    print("="*70)
    print(f"Result: {passed}/{total} checks passed ({passed/total*100:.1f}%)")
    print("="*70)

    if passed == total:
        print("\n🎉 DEPLOYMENT VERIFIED - System is ready!")
        print("\nNext steps:")
        print("  1. Run full test suite: python test_hybrid_rag.py --all")
        print("  2. Start service: python run.py")
        print("  3. Test API: curl http://localhost:5006/api/learn/admin/rag/system-stats")
    else:
        print(f"\n⚠ {total - passed} check(s) failed. Please fix the issues above.")

    return checks


if __name__ == "__main__":
    verify_deployment()


