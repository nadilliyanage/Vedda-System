"""
Quick script to populate sample knowledge base for testing
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongo import init_mongo, get_db
from app import create_app


def create_sample_knowledge_base():
    """Create a comprehensive sample knowledge base for testing."""
    app = create_app()
    init_mongo(app)
    db = get_db()

    knowledge_coll = db["vedda_knowledge"]

    # Check existing count
    existing_count = knowledge_coll.count_documents({})
    print(f"\nExisting knowledge documents: {existing_count}")

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
            "skill_tags": ["question_forms", "basic_grammar"],
            "error_types": ["word_order_error"],
            "difficulty": "beginner",
            "exercise_types": ["multiple_choice", "fill_blank"],
            "content": "Question words in Vedda always come at the beginning of the sentence, followed by the verb.",
            "example": "Kauda enne? = Who is coming?",
            "examples": [
                {"sentence": "Kauda enne?", "meaning": "Who is coming?"},
                {"sentence": "Keyada giye?", "meaning": "When did you go?"}
            ],
            "priority": 1,
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
        },
        {
            "type": "vocabulary",
            "skill_tags": ["numbers", "basic_vocabulary"],
            "error_types": ["wrong_vocabulary"],
            "difficulty": "beginner",
            "exercise_types": ["multiple_choice"],
            "content": "Numbers 1-5 in Vedda: ekka (1), deka (2), tunka (3), hatara (4), paha (5)",
            "example": "ekka = one",
            "examples": [
                {"sentence": "ekka", "meaning": "one"},
                {"sentence": "deka", "meaning": "two"},
                {"sentence": "tunka", "meaning": "three"}
            ],
            "priority": 1,
            "effectiveness": {
                "times_used": 0,
                "helped_correct": 0,
                "last_used": None
            }
        },
        {
            "type": "grammar_rule",
            "skill_tags": ["verb_conjugation", "intermediate_grammar"],
            "error_types": ["wrong_verb_form"],
            "difficulty": "intermediate",
            "exercise_types": ["fill_blank"],
            "content": "Vedda verbs conjugate based on tense. Present tense uses -nava suffix.",
            "example": "yan + nava = yanava (going)",
            "examples": [
                {"sentence": "mama yanava", "meaning": "I am going"},
                {"sentence": "oya yanava", "meaning": "You are going"}
            ],
            "priority": 2,
            "effectiveness": {
                "times_used": 0,
                "helped_correct": 0,
                "last_used": None
            }
        }
    ]

    # Insert only if not already present
    inserted_count = 0
    for sample in samples:
        # Check if similar document exists
        existing = knowledge_coll.find_one({
            "content": sample["content"]
        })

        if not existing:
            knowledge_coll.insert_one(sample)
            inserted_count += 1
            print(f"✓ Inserted: {sample['content'][:60]}...")
        else:
            print(f"  Skipped (exists): {sample['content'][:60]}...")

    total = knowledge_coll.count_documents({})
    print(f"\n✓ Sample knowledge base ready!")
    print(f"  Total documents: {total}")
    print(f"  Newly inserted: {inserted_count}")
    print(f"\n➡ Next: Run 'python populate_embeddings.py --populate' to generate embeddings")


if __name__ == "__main__":
    create_sample_knowledge_base()

