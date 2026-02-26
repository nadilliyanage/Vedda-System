"""
RAG Evaluation Metrics Module
Provides metrics to evaluate RAG system performance and learner improvement
"""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple


def compute_retrieval_match_rate(
    db,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> dict:
    """
    Compute how often retrieved knowledge matched the learner's actual error type.
    This measures retrieval precision.

    Args:
        db: MongoDB database instance
        start_date: Start of evaluation period
        end_date: End of evaluation period

    Returns:
        Dictionary with match rate metrics
    """
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    usage_coll = db["knowledge_usage"]

    # Get all knowledge usage records in time period
    query = {
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }

    usage_records = list(usage_coll.find(query))

    if not usage_records:
        return {
            "match_rate": 0.0,
            "total_retrievals": 0,
            "period": f"{start_date.date()} to {end_date.date()}"
        }

    total_retrievals = len(usage_records)
    helpful_retrievals = sum(1 for r in usage_records if r.get("was_helpful", False))

    match_rate = helpful_retrievals / total_retrievals if total_retrievals > 0 else 0.0

    return {
        "match_rate": round(match_rate, 3),
        "helpful_retrievals": helpful_retrievals,
        "total_retrievals": total_retrievals,
        "period": f"{start_date.date()} to {end_date.date()}"
    }


def compute_error_reduction_rate(
    db,
    user_id: str | None = None,
    error_type: str | None = None,
    days: int = 30
) -> dict:
    """
    Compute how much learner's error rate decreased over time.
    This measures learning effectiveness.

    Args:
        db: MongoDB database instance
        user_id: Specific user to analyze (None for all users)
        error_type: Specific error type to analyze (None for all errors)
        days: Number of days to analyze

    Returns:
        Dictionary with error reduction metrics
    """
    attempts_coll = db["user_attempts"]

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    mid_point = start_date + timedelta(days=days/2)

    # Build query
    query = {
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }

    if user_id:
        query["user_id"] = user_id

    if error_type:
        query["error_type"] = error_type

    attempts = list(attempts_coll.find(query))

    if len(attempts) < 10:  # Need minimum data for meaningful analysis
        return {
            "error": "Insufficient data",
            "attempts_found": len(attempts),
            "minimum_required": 10
        }

    # Split into first half and second half
    first_half = [a for a in attempts if a.get("timestamp", end_date) < mid_point]
    second_half = [a for a in attempts if a.get("timestamp", start_date) >= mid_point]

    # Calculate error rates
    def error_rate(attempts_list):
        if not attempts_list:
            return 0.0
        errors = sum(1 for a in attempts_list if not a.get("is_correct", False))
        return errors / len(attempts_list)

    first_half_error_rate = error_rate(first_half)
    second_half_error_rate = error_rate(second_half)

    # Calculate reduction
    reduction = first_half_error_rate - second_half_error_rate
    reduction_percentage = (reduction / first_half_error_rate * 100) if first_half_error_rate > 0 else 0.0

    return {
        "first_half_error_rate": round(first_half_error_rate, 3),
        "second_half_error_rate": round(second_half_error_rate, 3),
        "absolute_reduction": round(reduction, 3),
        "reduction_percentage": round(reduction_percentage, 1),
        "first_half_attempts": len(first_half),
        "second_half_attempts": len(second_half),
        "period_days": days,
        "user_id": user_id or "all_users",
        "error_type": error_type or "all_errors"
    }


def compute_skill_improvement_rate(
    db,
    user_id: str,
    skill_tag: str | None = None,
    days: int = 30
) -> dict:
    """
    Compute how much learner's accuracy improved for specific skills.

    Args:
        db: MongoDB database instance
        user_id: User to analyze
        skill_tag: Specific skill to analyze (None for overall)
        days: Number of days to analyze

    Returns:
        Dictionary with improvement metrics
    """
    attempts_coll = db["user_attempts"]

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    mid_point = start_date + timedelta(days=days/2)

    # Build query
    query = {
        "user_id": user_id,
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }

    if skill_tag:
        query["skill_tags"] = skill_tag

    attempts = list(attempts_coll.find(query))

    if len(attempts) < 10:
        return {
            "error": "Insufficient data",
            "attempts_found": len(attempts),
            "minimum_required": 10
        }

    # Split into first half and second half
    first_half = [a for a in attempts if a.get("timestamp", end_date) < mid_point]
    second_half = [a for a in attempts if a.get("timestamp", start_date) >= mid_point]

    # Calculate accuracy
    def accuracy(attempts_list):
        if not attempts_list:
            return 0.0
        correct = sum(1 for a in attempts_list if a.get("is_correct", False))
        return correct / len(attempts_list)

    first_half_accuracy = accuracy(first_half)
    second_half_accuracy = accuracy(second_half)

    # Calculate improvement
    improvement = second_half_accuracy - first_half_accuracy
    improvement_percentage = (improvement / first_half_accuracy * 100) if first_half_accuracy > 0 else 0.0

    return {
        "first_half_accuracy": round(first_half_accuracy, 3),
        "second_half_accuracy": round(second_half_accuracy, 3),
        "absolute_improvement": round(improvement, 3),
        "improvement_percentage": round(improvement_percentage, 1),
        "first_half_attempts": len(first_half),
        "second_half_attempts": len(second_half),
        "period_days": days,
        "user_id": user_id,
        "skill_tag": skill_tag or "overall"
    }


def compute_rag_impact_score(
    db,
    user_id: str,
    days_before_rag: int = 14,
    days_after_rag: int = 14
) -> dict:
    """
    Compare learner performance before and after RAG system was introduced.
    Requires a reference date when RAG was enabled for the user.

    Args:
        db: MongoDB database instance
        user_id: User to analyze
        days_before_rag: Days to analyze before RAG
        days_after_rag: Days to analyze after RAG

    Returns:
        Dictionary with before/after comparison
    """
    # Check if user has RAG enabled timestamp
    users_coll = db["users"]
    user = users_coll.find_one({"_id": user_id})

    if not user or not user.get("rag_enabled_at"):
        return {
            "error": "User doesn't have rag_enabled_at timestamp",
            "user_id": user_id
        }

    rag_enabled_date = user["rag_enabled_at"]

    # Get attempts before and after
    attempts_coll = db["user_attempts"]

    before_start = rag_enabled_date - timedelta(days=days_before_rag)
    before_attempts = list(attempts_coll.find({
        "user_id": user_id,
        "timestamp": {"$gte": before_start, "$lt": rag_enabled_date}
    }))

    after_end = rag_enabled_date + timedelta(days=days_after_rag)
    after_attempts = list(attempts_coll.find({
        "user_id": user_id,
        "timestamp": {"$gte": rag_enabled_date, "$lte": after_end}
    }))

    if len(before_attempts) < 5 or len(after_attempts) < 5:
        return {
            "error": "Insufficient data for comparison",
            "before_attempts": len(before_attempts),
            "after_attempts": len(after_attempts)
        }

    # Calculate accuracies
    def accuracy(attempts_list):
        correct = sum(1 for a in attempts_list if a.get("is_correct", False))
        return correct / len(attempts_list) if attempts_list else 0.0

    before_accuracy = accuracy(before_attempts)
    after_accuracy = accuracy(after_attempts)

    improvement = after_accuracy - before_accuracy
    improvement_percentage = (improvement / before_accuracy * 100) if before_accuracy > 0 else 0.0

    return {
        "before_rag_accuracy": round(before_accuracy, 3),
        "after_rag_accuracy": round(after_accuracy, 3),
        "improvement": round(improvement, 3),
        "improvement_percentage": round(improvement_percentage, 1),
        "before_attempts": len(before_attempts),
        "after_attempts": len(after_attempts),
        "rag_enabled_date": rag_enabled_date,
        "user_id": user_id
    }


def generate_rag_performance_report(db, days: int = 30) -> dict:
    """
    Generate comprehensive RAG system performance report.

    Args:
        db: MongoDB database instance
        days: Number of days to analyze

    Returns:
        Comprehensive report dictionary
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    report = {
        "report_generated_at": datetime.utcnow(),
        "period_days": days,
        "period_start": start_date,
        "period_end": end_date,
    }

    # Retrieval metrics
    retrieval_metrics = compute_retrieval_match_rate(db, start_date, end_date)
    report["retrieval_metrics"] = retrieval_metrics

    # Overall error reduction
    error_reduction = compute_error_reduction_rate(db, days=days)
    report["error_reduction"] = error_reduction

    # Most effective knowledge
    knowledge_coll = db["vedda_knowledge"]
    top_knowledge = []
    docs = list(knowledge_coll.find({"effectiveness.times_used": {"$gte": 5}}).limit(10))

    for doc in docs:
        eff = doc.get("effectiveness", {})
        times_used = eff.get("times_used", 0)
        helped = eff.get("helped_correct", 0)
        help_rate = helped / times_used if times_used > 0 else 0.0

        top_knowledge.append({
            "content": doc.get("content", "")[:80],
            "help_rate": round(help_rate, 3),
            "times_used": times_used
        })

    top_knowledge.sort(key=lambda x: x["help_rate"], reverse=True)
    report["top_effective_knowledge"] = top_knowledge[:5]

    # System statistics
    report["system_stats"] = {
        "total_knowledge_docs": knowledge_coll.count_documents({}),
        "docs_with_embeddings": knowledge_coll.count_documents({"embedding": {"$exists": True}}),
        "docs_used_at_least_once": knowledge_coll.count_documents({"effectiveness.times_used": {"$gt": 0}})
    }

    return report

