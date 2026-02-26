"""
Admin Routes for RAG System Management
Provides endpoints for monitoring and managing the hybrid RAG system
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from bson import ObjectId

from app.db.mongo import get_db
from app.ai.rag_evaluation import (
    compute_retrieval_match_rate,
    compute_error_reduction_rate,
    compute_skill_improvement_rate,
    generate_rag_performance_report
)
from app.ai.effectiveness_tracker import (
    get_knowledge_effectiveness_stats,
    get_most_effective_knowledge,
    get_least_effective_knowledge
)

rag_admin_bp = Blueprint("rag_admin", __name__, url_prefix="/admin/rag")


@rag_admin_bp.get("/performance-report")
def get_performance_report():
    """
    Generate comprehensive RAG system performance report.
    """
    days = request.args.get("days", 30, type=int)

    db = get_db()
    report = generate_rag_performance_report(db, days=days)

    return jsonify(report)


@rag_admin_bp.get("/retrieval-metrics")
def get_retrieval_metrics():
    """
    Get retrieval match rate metrics.
    """
    days = request.args.get("days", 30, type=int)

    db = get_db()
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    metrics = compute_retrieval_match_rate(db, start_date, end_date)

    return jsonify(metrics)


@rag_admin_bp.get("/error-reduction")
def get_error_reduction():
    """
    Analyze error reduction over time.
    """
    user_id = request.args.get("user_id")
    error_type = request.args.get("error_type")
    days = request.args.get("days", 30, type=int)

    db = get_db()
    metrics = compute_error_reduction_rate(
        db,
        user_id=user_id,
        error_type=error_type,
        days=days
    )

    return jsonify(metrics)


@rag_admin_bp.get("/skill-improvement")
def get_skill_improvement():
    """
    Analyze skill improvement for a specific user.
    """
    user_id = request.args.get("user_id")
    skill_tag = request.args.get("skill_tag")
    days = request.args.get("days", 30, type=int)

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    db = get_db()
    metrics = compute_skill_improvement_rate(
        db,
        user_id=user_id,
        skill_tag=skill_tag,
        days=days
    )

    return jsonify(metrics)


@rag_admin_bp.get("/knowledge/most-effective")
def get_top_knowledge():
    """
    Get most effective knowledge documents.
    """
    skill_tag = request.args.get("skill_tag")
    limit = request.args.get("limit", 10, type=int)

    db = get_db()
    docs = get_most_effective_knowledge(db, skill_tag=skill_tag, limit=limit)

    # Format response
    results = []
    for doc in docs:
        effectiveness = doc.get("effectiveness", {})
        times_used = effectiveness.get("times_used", 0)
        helped_correct = effectiveness.get("helped_correct", 0)
        help_rate = helped_correct / times_used if times_used > 0 else 0.0

        results.append({
            "id": str(doc["_id"]),
            "content": doc.get("content", ""),
            "skill_tags": doc.get("skill_tags", []),
            "error_types": doc.get("error_types", []),
            "times_used": times_used,
            "helped_correct": helped_correct,
            "help_rate": round(help_rate, 3)
        })

    return jsonify({"knowledge": results, "count": len(results)})


@rag_admin_bp.get("/knowledge/least-effective")
def get_bottom_knowledge():
    """
    Get least effective knowledge documents (need improvement).
    """
    skill_tag = request.args.get("skill_tag")
    limit = request.args.get("limit", 10, type=int)

    db = get_db()
    docs = get_least_effective_knowledge(db, skill_tag=skill_tag, limit=limit)

    # Format response
    results = []
    for doc in docs:
        effectiveness = doc.get("effectiveness", {})
        times_used = effectiveness.get("times_used", 0)
        helped_correct = effectiveness.get("helped_correct", 0)
        help_rate = helped_correct / times_used if times_used > 0 else 0.0

        results.append({
            "id": str(doc["_id"]),
            "content": doc.get("content", ""),
            "skill_tags": doc.get("skill_tags", []),
            "error_types": doc.get("error_types", []),
            "times_used": times_used,
            "helped_correct": helped_correct,
            "help_rate": round(help_rate, 3)
        })

    return jsonify({"knowledge": results, "count": len(results)})


@rag_admin_bp.get("/knowledge/<knowledge_id>/stats")
def get_knowledge_stats(knowledge_id):
    """
    Get detailed statistics for a specific knowledge document.
    """
    try:
        doc_id = ObjectId(knowledge_id)
    except:
        return jsonify({"error": "Invalid knowledge_id"}), 400

    db = get_db()
    stats = get_knowledge_effectiveness_stats(db, doc_id)

    return jsonify(stats)


@rag_admin_bp.get("/embedding-coverage")
def get_embedding_coverage():
    """
    Check embedding coverage across knowledge base.
    """
    db = get_db()
    knowledge_coll = db["vedda_knowledge"]

    total = knowledge_coll.count_documents({})
    with_embeddings = knowledge_coll.count_documents({
        "embedding": {"$exists": True, "$ne": None, "$ne": []}
    })
    without_embeddings = total - with_embeddings

    # Get sample document
    sample = knowledge_coll.find_one({"embedding": {"$exists": True, "$ne": None}})
    sample_info = None

    if sample:
        embedding = sample.get("embedding", [])
        sample_info = {
            "id": str(sample["_id"]),
            "content_preview": sample.get("content", "")[:80],
            "embedding_dimension": len(embedding),
            "model": sample.get("embedding_model", "unknown"),
            "generated_at": sample.get("embedding_generated_at")
        }

    return jsonify({
        "total_documents": total,
        "with_embeddings": with_embeddings,
        "without_embeddings": without_embeddings,
        "coverage_percentage": round(with_embeddings / total * 100, 1) if total > 0 else 0,
        "sample": sample_info
    })


@rag_admin_bp.get("/system-stats")
def get_system_stats():
    """
    Get overall RAG system statistics.
    """
    db = get_db()

    knowledge_coll = db["vedda_knowledge"]

    total_docs = knowledge_coll.count_documents({})
    with_embeddings = knowledge_coll.count_documents({"embedding": {"$exists": True}})
    used_at_least_once = knowledge_coll.count_documents({"effectiveness.times_used": {"$gt": 0}})

    # Average effectiveness
    pipeline = [
        {"$match": {"effectiveness.times_used": {"$gt": 0}}},
        {"$project": {
            "help_rate": {
                "$cond": [
                    {"$gt": ["$effectiveness.times_used", 0]},
                    {"$divide": ["$effectiveness.helped_correct", "$effectiveness.times_used"]},
                    0
                ]
            }
        }},
        {"$group": {
            "_id": None,
            "avg_help_rate": {"$avg": "$help_rate"}
        }}
    ]

    result = list(knowledge_coll.aggregate(pipeline))
    avg_help_rate = result[0]["avg_help_rate"] if result else 0.0

    # Skill coverage
    skill_tags_set = set()
    for doc in knowledge_coll.find({}, {"skill_tags": 1}):
        skill_tags_set.update(doc.get("skill_tags", []))

    return jsonify({
        "total_knowledge_documents": total_docs,
        "documents_with_embeddings": with_embeddings,
        "documents_used": used_at_least_once,
        "average_help_rate": round(avg_help_rate, 3),
        "unique_skills_covered": len(skill_tags_set),
        "skills": sorted(list(skill_tags_set))
    })

