"""
Script to populate embeddings for all knowledge documents in vadda_knowledge collection.
Run this once to initialize embeddings for existing documents.
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongo import init_mongo, get_db
from app.ai.embedding_service import generate_embedding, prepare_knowledge_text_for_embedding
from app import create_app


def populate_embeddings(batch_size: int = 10):
    """
    Populate embeddings for all knowledge documents that don't have them.

    Args:
        batch_size: Number of documents to process in each batch
    """
    app = create_app()
    init_mongo(app)
    db = get_db()

    knowledge_coll = db["vedda_knowledge"]

    # Find documents without embeddings
    docs_without_embeddings = list(knowledge_coll.find({
        "$or": [
            {"embedding": {"$exists": False}},
            {"embedding": None},
            {"embedding": []}
        ]
    }))

    total_docs = len(docs_without_embeddings)
    print(f"Found {total_docs} documents without embeddings")

    if total_docs == 0:
        print("All documents already have embeddings!")
        return

    # Process in batches
    updated_count = 0
    failed_count = 0

    for i in range(0, total_docs, batch_size):
        batch = docs_without_embeddings[i:i+batch_size]
        print(f"\nProcessing batch {i//batch_size + 1} ({i+1}-{min(i+batch_size, total_docs)} of {total_docs})")

        for doc in batch:
            try:
                # Prepare text for embedding
                text = prepare_knowledge_text_for_embedding(doc)

                if not text or not text.strip():
                    print(f"  ⚠ Skipping document {doc['_id']} - no text content")
                    continue

                # Generate embedding
                embedding = generate_embedding(text)

                # Update document
                result = knowledge_coll.update_one(
                    {"_id": doc["_id"]},
                    {
                        "$set": {
                            "embedding": embedding,
                            "embedding_generated_at": datetime.utcnow(),
                            "embedding_model": "text-embedding-3-small"
                        }
                    }
                )

                if result.modified_count > 0:
                    updated_count += 1
                    skill_tags = doc.get("skill_tags", [])
                    content_preview = doc.get("content", "")[:60]
                    print(f"  ✓ Updated {doc['_id']} - Skills: {skill_tags} - {content_preview}...")
                else:
                    print(f"  ⚠ No update for {doc['_id']}")

            except Exception as e:
                failed_count += 1
                print(f"  ✗ Failed to process {doc['_id']}: {e}")

    print(f"\n{'='*60}")
    print(f"SUMMARY:")
    print(f"  Total documents: {total_docs}")
    print(f"  Successfully updated: {updated_count}")
    print(f"  Failed: {failed_count}")
    print(f"{'='*60}")


def update_existing_embeddings(force: bool = False):
    """
    Re-generate embeddings for documents that already have them.
    Useful if embedding model or preparation logic changes.

    Args:
        force: If True, update all documents even if they have embeddings
    """
    app = create_app()
    init_mongo(app)
    db = get_db()

    knowledge_coll = db["vedda_knowledge"]

    if force:
        docs = list(knowledge_coll.find({}))
        print(f"Force updating embeddings for all {len(docs)} documents")
    else:
        print("This will re-generate embeddings for all existing documents.")
        confirm = input("Are you sure? (yes/no): ")
        if confirm.lower() != "yes":
            print("Cancelled.")
            return
        docs = list(knowledge_coll.find({}))

    updated_count = 0

    for doc in docs:
        try:
            text = prepare_knowledge_text_for_embedding(doc)

            if not text or not text.strip():
                continue

            embedding = generate_embedding(text)

            knowledge_coll.update_one(
                {"_id": doc["_id"]},
                {
                    "$set": {
                        "embedding": embedding,
                        "embedding_updated_at": datetime.utcnow(),
                        "embedding_model": "text-embedding-3-small"
                    }
                }
            )

            updated_count += 1
            print(f"Updated {doc['_id']}")

        except Exception as e:
            print(f"Failed to update {doc['_id']}: {e}")

    print(f"\nUpdated {updated_count} documents")


def verify_embeddings():
    """
    Verify embedding quality and coverage.
    """
    app = create_app()
    init_mongo(app)
    db = get_db()

    knowledge_coll = db["vedda_knowledge"]

    total = knowledge_coll.count_documents({})
    with_embeddings = knowledge_coll.count_documents({"embedding": {"$exists": True, "$ne": None}})
    without_embeddings = total - with_embeddings

    print(f"\nEmbedding Coverage Report:")
    print(f"{'='*60}")
    print(f"  Total knowledge documents: {total}")
    print(f"  With embeddings: {with_embeddings} ({with_embeddings/total*100:.1f}%)")
    print(f"  Without embeddings: {without_embeddings} ({without_embeddings/total*100:.1f}%)")
    print(f"{'='*60}")

    # Sample a document with embedding to verify
    sample = knowledge_coll.find_one({"embedding": {"$exists": True}})
    if sample:
        embedding = sample.get("embedding", [])
        print(f"\nSample embedding verification:")
        print(f"  Document ID: {sample['_id']}")
        print(f"  Content: {sample.get('content', '')[:80]}...")
        print(f"  Embedding dimension: {len(embedding)}")
        print(f"  First 5 values: {embedding[:5]}")
        print(f"  Model: {sample.get('embedding_model', 'unknown')}")
        print(f"  Generated at: {sample.get('embedding_generated_at', 'unknown')}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Manage knowledge embeddings")
    parser.add_argument("--populate", action="store_true", help="Populate missing embeddings")
    parser.add_argument("--update-all", action="store_true", help="Re-generate all embeddings")
    parser.add_argument("--verify", action="store_true", help="Verify embedding coverage")
    parser.add_argument("--batch-size", type=int, default=10, help="Batch size for processing")

    args = parser.parse_args()

    if args.populate:
        populate_embeddings(batch_size=args.batch_size)
    elif args.update_all:
        update_existing_embeddings(force=True)
    elif args.verify:
        verify_embeddings()
    else:
        print("Usage:")
        print("  python populate_embeddings.py --populate         # Add embeddings to documents without them")
        print("  python populate_embeddings.py --update-all       # Re-generate all embeddings")
        print("  python populate_embeddings.py --verify           # Check embedding coverage")
        print("  python populate_embeddings.py --populate --batch-size 20  # Custom batch size")

