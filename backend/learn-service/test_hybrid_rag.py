"""
Test Script for Hybrid RAG System
Demonstrates all major features and validates functionality
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongo import init_mongo, get_db
from app import create_app
from app.ai.embedding_service import generate_embedding, prepare_knowledge_text_for_embedding
from app.ai.similarity import cosine_similarity, cosine_similarity_batch
from app.ai.rag_hybrid import hybrid_retrieve
from app.ai.context_builder import (
    build_context_for_feedback,
    build_context_for_exercise_generation
)
from app.ai.effectiveness_tracker import (
    update_knowledge_effectiveness,
    get_most_effective_knowledge
)
from app.ai.rag_evaluation import generate_rag_performance_report
from datetime import datetime


def test_embedding_generation():
    """Test embedding generation functionality."""
    print("\n" + "="*60)
    print("TEST 1: Embedding Generation")
    print("="*60)

    test_text = "In Vedda, questions start with the question word followed by the verb."

    try:
        embedding = generate_embedding(test_text)
        print(f"✓ Generated embedding for: {test_text[:50]}...")
        print(f"✓ Embedding dimension: {len(embedding)}")
        print(f"✓ First 5 values: {embedding[:5]}")
        return True
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_similarity_computation():
    """Test cosine similarity computation."""
    print("\n" + "="*60)
    print("TEST 2: Cosine Similarity")
    print("="*60)

    try:
        text1 = "What is your name in Vedda?"
        text2 = "How do you ask someone's name in Vedda?"
        text3 = "The weather is nice today."

        emb1 = generate_embedding(text1)
        emb2 = generate_embedding(text2)
        emb3 = generate_embedding(text3)

        sim_similar = cosine_similarity(emb1, emb2)
        sim_different = cosine_similarity(emb1, emb3)

        print(f"✓ Similarity (similar texts): {sim_similar:.3f}")
        print(f"✓ Similarity (different texts): {sim_different:.3f}")

        if sim_similar > sim_different:
            print("✓ Similarity scores make sense!")
            return True
        else:
            print("⚠ Warning: Similar texts have lower similarity than different texts")
            return False

    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_batch_similarity():
    """Test batch similarity computation."""
    print("\n" + "="*60)
    print("TEST 3: Batch Similarity")
    print("="*60)

    try:
        query = "How to ask questions in Vedda?"
        docs = [
            "Question words in Vedda always come first",
            "Verbs in Vedda conjugate based on tense",
            "Questions use specific word order in Vedda"
        ]

        query_emb = generate_embedding(query)
        doc_embs = [generate_embedding(d) for d in docs]

        similarities = cosine_similarity_batch(query_emb, doc_embs)

        print(f"✓ Query: {query}")
        for i, (doc, sim) in enumerate(zip(docs, similarities)):
            print(f"  Doc {i+1}: {sim:.3f} - {doc[:40]}...")

        return True

    except Exception as e:
        print(f"✗ Failed: {e}")
        return False


def test_hybrid_retrieval():
    """Test hybrid RAG retrieval."""
    print("\n" + "="*60)
    print("TEST 4: Hybrid Retrieval")
    print("="*60)

    app = create_app()
    init_mongo(app)
    db = get_db()

    try:
        query_text = "Student answered 'Koheda karanne?' instead of 'Mokadda karanne?'"
        skill_tags = ["question_forms", "basic_grammar"]
        error_types = ["wrong_question_word"]

        docs = hybrid_retrieve(
            db=db,
            query_text=query_text,
            skill_tags=skill_tags,
            error_types=error_types,
            difficulty="beginner",
            weak_skills=["question_forms"],
            limit=3
        )

        print(f"✓ Retrieved {len(docs)} documents")

        for i, doc in enumerate(docs, 1):
            print(f"\n  Document {i}:")
            print(f"    Content: {doc.get('content', '')[:60]}...")
            print(f"    Skills: {doc.get('skill_tags', [])}")
            print(f"    Errors: {doc.get('error_types', [])}")
            print(f"    Has embedding: {'embedding' in doc}")

        return len(docs) > 0

    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_context_building():
    """Test context builder functions."""
    print("\n" + "="*60)
    print("TEST 5: Context Building")
    print("="*60)

    app = create_app()
    init_mongo(app)
    db = get_db()

    try:
        # Get some documents
        knowledge_coll = db["vedda_knowledge"]
        docs = list(knowledge_coll.find({"skill_tags": {"$in": ["question_forms"]}}).limit(2))

        if not docs:
            print("⚠ No documents found in knowledge base")
            return False

        # Test feedback context
        context = build_context_for_feedback(
            docs=docs,
            student_answer="wrong answer",
            correct_answer="correct answer",
            error_type="wrong_question_word"
        )

        print("✓ Generated feedback context:")
        print(context[:200] + "...")

        # Test exercise context
        ex_context = build_context_for_exercise_generation(
            docs=docs,
            skills=["question_forms"],
            error_types=["wrong_question_word"]
        )

        print("\n✓ Generated exercise context:")
        print(ex_context[:200] + "...")

        return True

    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_effectiveness_tracking():
    """Test effectiveness tracking."""
    print("\n" + "="*60)
    print("TEST 6: Effectiveness Tracking")
    print("="*60)

    app = create_app()
    init_mongo(app)
    db = get_db()

    try:
        knowledge_coll = db["vedda_knowledge"]

        # Get a sample document
        sample_doc = knowledge_coll.find_one({})

        if not sample_doc:
            print("⚠ No documents in knowledge base")
            return False

        doc_id = sample_doc["_id"]

        # Track usage
        result = update_knowledge_effectiveness(
            db=db,
            knowledge_ids=[doc_id],
            helped=True
        )

        print(f"✓ Updated effectiveness: {result}")

        # Get most effective knowledge
        top_knowledge = get_most_effective_knowledge(db, limit=3)

        print(f"✓ Found {len(top_knowledge)} effective knowledge documents")

        return True

    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_end_to_end_flow():
    """Test complete end-to-end RAG flow."""
    print("\n" + "="*60)
    print("TEST 7: End-to-End RAG Flow")
    print("="*60)

    app = create_app()
    init_mongo(app)
    db = get_db()

    try:
        # Simulate a student mistake scenario
        print("\n📝 Scenario: Student makes a mistake on question formation")

        skill_tags = ["question_forms"]
        error_type = "wrong_question_word"
        user_id = "test_user_123"

        # 1. Retrieve knowledge
        print("\n1️⃣ Retrieving relevant knowledge...")
        query_text = "Student confused question words mokadda and koheda"

        docs = hybrid_retrieve(
            db=db,
            query_text=query_text,
            skill_tags=skill_tags,
            error_types=[error_type],
            difficulty="beginner",
            weak_skills=skill_tags,
            limit=3
        )

        print(f"   ✓ Retrieved {len(docs)} documents")

        # 2. Build context
        print("\n2️⃣ Building context for feedback...")
        context = build_context_for_feedback(
            docs=docs,
            student_answer="Koheda karanne?",
            correct_answer="Mokadda karanne?",
            error_type=error_type
        )

        print(f"   ✓ Context length: {len(context)} characters")

        # 3. Track effectiveness (simulated)
        print("\n3️⃣ Tracking knowledge effectiveness...")
        if docs:
            knowledge_ids = [doc["_id"] for doc in docs]
            result = update_knowledge_effectiveness(
                db=db,
                knowledge_ids=knowledge_ids,
                helped=True  # Simulating that it helped
            )
            print(f"   ✓ Updated {result['updated']} documents")

        print("\n✓ End-to-end flow completed successfully!")
        return True

    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_performance_report():
    """Test RAG performance reporting."""
    print("\n" + "="*60)
    print("TEST 8: Performance Report Generation")
    print("="*60)

    app = create_app()
    init_mongo(app)
    db = get_db()

    try:
        report = generate_rag_performance_report(db, days=30)

        print("✓ Generated performance report:")
        print(f"  Period: {report.get('period_days')} days")
        print(f"  System stats: {report.get('system_stats')}")

        retrieval = report.get('retrieval_metrics', {})
        if retrieval:
            print(f"  Retrieval match rate: {retrieval.get('match_rate', 'N/A')}")

        return True

    except Exception as e:
        print(f"✗ Failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_all_tests():
    """Run all tests."""
    print("\n" + "🚀"*30)
    print("HYBRID RAG SYSTEM - COMPREHENSIVE TEST SUITE")
    print("🚀"*30)

    tests = [
        ("Embedding Generation", test_embedding_generation),
        ("Cosine Similarity", test_similarity_computation),
        ("Batch Similarity", test_batch_similarity),
        ("Hybrid Retrieval", test_hybrid_retrieval),
        ("Context Building", test_context_building),
        ("Effectiveness Tracking", test_effectiveness_tracking),
        ("End-to-End Flow", test_end_to_end_flow),
        ("Performance Report", test_performance_report),
    ]

    results = []

    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:10} - {test_name}")

    print("="*60)
    print(f"TOTAL: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("="*60)

    if passed == total:
        print("\n🎉 All tests passed! Hybrid RAG system is ready.")
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Review errors above.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test Hybrid RAG System")
    parser.add_argument("--test", type=str, help="Run specific test (1-8)")
    parser.add_argument("--all", action="store_true", help="Run all tests")

    args = parser.parse_args()

    if args.test:
        test_num = int(args.test)
        tests_map = {
            1: test_embedding_generation,
            2: test_similarity_computation,
            3: test_batch_similarity,
            4: test_hybrid_retrieval,
            5: test_context_building,
            6: test_effectiveness_tracking,
            7: test_end_to_end_flow,
            8: test_performance_report,
        }

        if test_num in tests_map:
            tests_map[test_num]()
        else:
            print(f"Invalid test number: {test_num}")
    elif args.all or not any(vars(args).values()):
        run_all_tests()
    else:
        print("Usage:")
        print("  python test_hybrid_rag.py --all          # Run all tests")
        print("  python test_hybrid_rag.py --test 1       # Run specific test")

