"""
Migration Script: Update Knowledge Base Schema for Hybrid RAG
Adds required fields to existing vadda_knowledge documents
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongo import init_mongo, get_db
from app import create_app


def migrate_knowledge_schema():
    """
    Migrate existing vadda_knowledge documents to support hybrid RAG.

    Adds fields:
    - difficulty (if missing)
    - exercise_types (if missing)
    - priority (if missing)
    - effectiveness (if missing)
    - error_types (if missing)
    """
    app = create_app()
    init_mongo(app)
    db = get_db()

    knowledge_coll = db["vedda_knowledge"]

    print("Starting knowledge base schema migration...")
    print("=" * 60)

    # Get all documents
    all_docs = list(knowledge_coll.find({}))
    print(f"Found {len(all_docs)} documents in vadda_knowledge collection")

    updated_count = 0

    for doc in all_docs:
        updates = {}

        # Add difficulty if missing (default to beginner)
        if "difficulty" not in doc:
            updates["difficulty"] = "beginner"

        # Add exercise_types if missing (default to both types)
        if "exercise_types" not in doc:
            updates["exercise_types"] = ["multiple_choice", "fill_blank"]

        # Add priority if missing (default to 1)
        if "priority" not in doc:
            updates["priority"] = 1

        # Add effectiveness tracking if missing
        if "effectiveness" not in doc:
            updates["effectiveness"] = {
                "times_used": 0,
                "helped_correct": 0,
                "last_used": None
            }

        # Add error_types if missing (try to infer from skill_tags or use empty)
        if "error_types" not in doc:
            # You can customize this logic based on your domain knowledge
            skill_tags = doc.get("skill_tags", [])
            error_types = []

            # Example inference logic
            if "question_forms" in skill_tags:
                error_types.append("wrong_question_word")
            if "verb_conjugation" in skill_tags:
                error_types.append("wrong_verb_form")
            if "vocabulary" in skill_tags:
                error_types.append("wrong_vocabulary")

            # Default fallback
            if not error_types:
                error_types = ["general_error"]

            updates["error_types"] = error_types

        # Apply updates if any
        if updates:
            knowledge_coll.update_one(
                {"_id": doc["_id"]},
                {"$set": updates}
            )
            updated_count += 1

            print(f"✓ Updated document {doc['_id']}")
            print(f"  Skills: {doc.get('skill_tags', [])}")
            print(f"  Added fields: {list(updates.keys())}")

    print("=" * 60)
    print(f"Migration complete!")
    print(f"  Total documents: {len(all_docs)}")
    print(f"  Updated: {updated_count}")
    print(f"  Already up-to-date: {len(all_docs) - updated_count}")


def verify_migration():
    """
    Verify that all documents have required fields.
    """
    app = create_app()
    init_mongo(app)
    db = get_db()

    knowledge_coll = db["vedda_knowledge"]

    print("\nVerifying migration...")
    print("=" * 60)

    required_fields = ["difficulty", "exercise_types", "priority", "effectiveness", "error_types"]

    all_docs = list(knowledge_coll.find({}))

    missing_fields_count = {field: 0 for field in required_fields}

    for doc in all_docs:
        for field in required_fields:
            if field not in doc:
                missing_fields_count[field] += 1

    print(f"Total documents: {len(all_docs)}\n")

    all_good = True
    for field, count in missing_fields_count.items():
        if count > 0:
            print(f"⚠ {count} documents missing '{field}' field")
            all_good = False
        else:
            print(f"✓ All documents have '{field}' field")

    if all_good:
        print("\n✓ All documents are properly migrated!")
    else:
        print("\n⚠ Some documents need migration")

    # Sample document
    sample = knowledge_coll.find_one({})
    if sample:
        print("\nSample document structure:")
        print("-" * 60)
        print(f"ID: {sample['_id']}")
        print(f"Type: {sample.get('type', 'N/A')}")
        print(f"Skill Tags: {sample.get('skill_tags', [])}")
        print(f"Error Types: {sample.get('error_types', [])}")
        print(f"Difficulty: {sample.get('difficulty', 'N/A')}")
        print(f"Exercise Types: {sample.get('exercise_types', [])}")
        print(f"Priority: {sample.get('priority', 0)}")
        print(f"Has Embedding: {'embedding' in sample and sample['embedding']}")
        print(f"Effectiveness: {sample.get('effectiveness', {})}")


def create_sample_knowledge_entry():
    """
    Create a sample knowledge document with full hybrid RAG support.
    """
    app = create_app()
    init_mongo(app)
    db = get_db()

    knowledge_coll = db["vedda_knowledge"]

    sample_doc = {
        "type": "grammar_rule",
        "skill_tags": ["question_forms", "basic_grammar"],
        "error_types": ["wrong_question_word", "word_order_error"],
        "difficulty": "beginner",
        "exercise_types": ["multiple_choice", "fill_blank"],
        "content": "In Vedda, questions start with the question word followed by the verb. Example: 'Mokadda' (what) comes first.",
        "example": "Mokadda karanne? = What are you doing?",
        "examples": [
            {
                "sentence": "Mokadda karanne?",
                "meaning": "What are you doing?"
            },
            {
                "sentence": "Koheda yanava?",
                "meaning": "Where are you going?"
            }
        ],
        "priority": 2,  # Higher priority = more important
        "effectiveness": {
            "times_used": 0,
            "helped_correct": 0,
            "last_used": None
        }
        # Note: embedding will be added by populate_embeddings.py script
    }

    result = knowledge_coll.insert_one(sample_doc)
    print(f"\n✓ Created sample knowledge document with ID: {result.inserted_id}")
    print(f"Run 'python populate_embeddings.py --populate' to add embeddings")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Migrate knowledge base schema for hybrid RAG")
    parser.add_argument("--migrate", action="store_true", help="Run migration")
    parser.add_argument("--verify", action="store_true", help="Verify migration")
    parser.add_argument("--sample", action="store_true", help="Create sample document")

    args = parser.parse_args()

    if args.migrate:
        migrate_knowledge_schema()
    elif args.verify:
        verify_migration()
    elif args.sample:
        create_sample_knowledge_entry()
    else:
        print("Usage:")
        print("  python migrate_knowledge_schema.py --migrate    # Migrate existing documents")
        print("  python migrate_knowledge_schema.py --verify     # Verify migration")
        print("  python migrate_knowledge_schema.py --sample     # Create sample document")

