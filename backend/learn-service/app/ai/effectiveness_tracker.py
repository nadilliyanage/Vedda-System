"""
Knowledge Effectiveness Tracker
Implements learning loop by tracking which knowledge helps learners improve
"""

from datetime import datetime
from typing import List


def update_knowledge_effectiveness(
    db,
    knowledge_ids: list,
    helped: bool
) -> dict:
    """
    Update effectiveness metrics for knowledge documents.
    This implements the learning loop where the system learns which knowledge is helpful.

    Args:
        db: MongoDB database instance
        knowledge_ids: List of knowledge document IDs that were used
        helped: Whether the knowledge helped (learner improved/answered correctly)

    Returns:
        Dictionary with update summary
    """
    if not knowledge_ids:
        return {"updated": 0, "message": "No knowledge IDs provided"}

    knowledge_coll = db["vedda_knowledge"]
    updated_count = 0

    for kid in knowledge_ids:
        # Prepare update operations
        update_ops = {
            "$inc": {
                "effectiveness.times_used": 1
            },
            "$set": {
                "effectiveness.last_used": datetime.utcnow()
            }
        }

        # If knowledge helped, increment helped_correct counter
        if helped:
            update_ops["$inc"]["effectiveness.helped_correct"] = 1

        # Update the document
        result = knowledge_coll.update_one(
            {"_id": kid},
            update_ops
        )

        if result.modified_count > 0:
            updated_count += 1

    return {
        "updated": updated_count,
        "total": len(knowledge_ids),
        "helped": helped
    }


def track_knowledge_usage(
    db,
    user_id: str,
    exercise_id: str,
    knowledge_ids: list,
    was_helpful: bool
) -> None:
    """
    Track detailed knowledge usage for analytics.
    Creates a record in knowledge_usage collection for later analysis.

    Args:
        db: MongoDB database instance
        user_id: User who received the knowledge
        exercise_id: Exercise where knowledge was used
        knowledge_ids: Knowledge documents that were retrieved
        was_helpful: Whether it helped the user answer correctly
    """
    usage_coll = db["knowledge_usage"]

    usage_record = {
        "user_id": user_id,
        "exercise_id": exercise_id,
        "knowledge_ids": knowledge_ids,
        "was_helpful": was_helpful,
        "timestamp": datetime.utcnow()
    }

    usage_coll.insert_one(usage_record)


def get_knowledge_effectiveness_stats(db, knowledge_id) -> dict:
    """
    Get effectiveness statistics for a specific knowledge document.

    Args:
        db: MongoDB database instance
        knowledge_id: Knowledge document ID

    Returns:
        Dictionary containing effectiveness metrics
    """
    knowledge_coll = db["vedda_knowledge"]
    doc = knowledge_coll.find_one({"_id": knowledge_id})

    if not doc:
        return {"error": "Knowledge document not found"}

    effectiveness = doc.get("effectiveness", {})
    times_used = effectiveness.get("times_used", 0)
    helped_correct = effectiveness.get("helped_correct", 0)

    # Calculate help rate
    help_rate = 0.0
    if times_used > 0:
        help_rate = helped_correct / times_used

    return {
        "knowledge_id": str(knowledge_id),
        "times_used": times_used,
        "helped_correct": helped_correct,
        "help_rate": round(help_rate, 3),
        "last_used": effectiveness.get("last_used"),
        "content": doc.get("content", "")[:100]  # Preview
    }


def get_most_effective_knowledge(db, skill_tag: str | None = None, limit: int = 10) -> list[dict]:
    """
    Retrieve most effective knowledge documents based on help rate.

    Args:
        db: MongoDB database instance
        skill_tag: Optional skill tag to filter by
        limit: Maximum number of documents to return

    Returns:
        List of knowledge documents sorted by effectiveness
    """
    knowledge_coll = db["vedda_knowledge"]

    # Build query
    query = {}
    if skill_tag:
        query["skill_tags"] = skill_tag

    # Also require minimum usage threshold for statistical significance
    query["effectiveness.times_used"] = {"$gte": 5}

    # Retrieve documents
    docs = list(knowledge_coll.find(query))

    # Calculate help rate and sort
    scored_docs = []
    for doc in docs:
        effectiveness = doc.get("effectiveness", {})
        times_used = effectiveness.get("times_used", 0)
        helped_correct = effectiveness.get("helped_correct", 0)

        if times_used > 0:
            help_rate = helped_correct / times_used
            scored_docs.append({
                "doc": doc,
                "help_rate": help_rate,
                "times_used": times_used
            })

    # Sort by help rate (descending)
    scored_docs.sort(key=lambda x: x["help_rate"], reverse=True)

    # Return top documents
    return [item["doc"] for item in scored_docs[:limit]]


def get_least_effective_knowledge(db, skill_tag: str | None = None, limit: int = 10) -> list[dict]:
    """
    Retrieve least effective knowledge documents (candidates for improvement).

    Args:
        db: MongoDB database instance
        skill_tag: Optional skill tag to filter by
        limit: Maximum number of documents to return

    Returns:
        List of knowledge documents with lowest effectiveness
    """
    knowledge_coll = db["vedda_knowledge"]

    query = {}
    if skill_tag:
        query["skill_tags"] = skill_tag

    query["effectiveness.times_used"] = {"$gte": 5}

    docs = list(knowledge_coll.find(query))

    scored_docs = []
    for doc in docs:
        effectiveness = doc.get("effectiveness", {})
        times_used = effectiveness.get("times_used", 0)
        helped_correct = effectiveness.get("helped_correct", 0)

        if times_used > 0:
            help_rate = helped_correct / times_used
            scored_docs.append({
                "doc": doc,
                "help_rate": help_rate,
                "times_used": times_used
            })

    # Sort by help rate (ascending)
    scored_docs.sort(key=lambda x: x["help_rate"])

    return [item["doc"] for item in scored_docs[:limit]]


def reset_knowledge_effectiveness(db, knowledge_id) -> dict:
    """
    Reset effectiveness metrics for a knowledge document (e.g., after updating content).

    Args:
        db: MongoDB database instance
        knowledge_id: Knowledge document ID to reset

    Returns:
        Update result summary
    """
    knowledge_coll = db["vedda_knowledge"]

    result = knowledge_coll.update_one(
        {"_id": knowledge_id},
        {
            "$set": {
                "effectiveness": {
                    "times_used": 0,
                    "helped_correct": 0,
                    "last_used": None,
                    "reset_at": datetime.utcnow()
                }
            }
        }
    )

    return {
        "matched": result.matched_count,
        "modified": result.modified_count
    }

