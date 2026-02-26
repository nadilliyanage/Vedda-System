"""
Advanced Hybrid RAG Retrieval Engine
Combines symbolic filtering with semantic search and intelligent re-ranking
"""

from typing import Optional
from ..db.mongo import get_db
from .embedding_service import generate_embedding
from .similarity import cosine_similarity_batch


def hybrid_retrieve(
    db,
    query_text: str,
    skill_tags: list[str],
    error_types: list[str] | None = None,
    exercise_type: str | None = None,
    difficulty: str | None = None,
    weak_skills: list[str] | None = None,
    limit: int = 5
) -> list[dict]:
    """
    Advanced hybrid retrieval combining symbolic filtering and semantic search.

    Retrieval Pipeline:
    1. Symbolic filtering (skill_tags, difficulty)
    2. Semantic scoring (cosine similarity with query embedding)
    3. Re-ranking with boost factors
    4. Sort and return top-k

    Args:
        db: MongoDB database instance
        query_text: Text query for semantic search (e.g., student's mistake context)
        skill_tags: Required skill tags to filter by
        error_types: Error types the learner commonly makes (for boosting)
        exercise_type: Type of exercise (e.g., "multiple_choice", "fill_blank")
        difficulty: Difficulty level (e.g., "beginner", "intermediate", "advanced")
        weak_skills: Skills the learner struggles with (for boosting)
        limit: Maximum number of documents to return

    Returns:
        List of knowledge documents ranked by relevance score
    """
    error_types = error_types or []
    weak_skills = weak_skills or []

    # STEP 1: Symbolic Filtering
    query = {}

    # Filter by skill tags (documents must match at least one skill tag)
    if skill_tags:
        query["skill_tags"] = {"$in": skill_tags}

    # Filter by difficulty if specified
    if difficulty:
        query["difficulty"] = difficulty

    # Retrieve candidate documents
    knowledge_coll = db["vedda_knowledge"]
    candidates = list(knowledge_coll.find(query))

    if not candidates:
        print(f"No candidates found for query: {query}")
        return []

    print(f"Found {len(candidates)} candidates after symbolic filtering")

    # STEP 2: Semantic Scoring
    try:
        query_embedding = generate_embedding(query_text)
    except Exception as e:
        print(f"Failed to generate query embedding: {e}")
        # Fallback to symbolic-only ranking
        return _fallback_ranking(candidates, skill_tags, error_types, weak_skills, limit)

    # Extract embeddings from documents
    doc_embeddings = []
    valid_docs = []

    for doc in candidates:
        if "embedding" in doc and doc["embedding"]:
            doc_embeddings.append(doc["embedding"])
            valid_docs.append(doc)
        else:
            # Documents without embeddings get zero similarity
            pass

    # Compute semantic similarities
    if doc_embeddings:
        similarities = cosine_similarity_batch(query_embedding, doc_embeddings)
    else:
        similarities = []

    # STEP 3: Re-ranking with Boost Factors
    scored_docs = []

    for i, doc in enumerate(valid_docs):
        # Base score: semantic similarity (weighted heavily)
        semantic_score = similarities[i] * 5.0 if i < len(similarities) else 0.0

        boost_score = 0.0

        # Boost 1: Error type match (+3 points)
        doc_errors = set(doc.get("error_types", []))
        learner_errors = set(error_types)
        if doc_errors & learner_errors:  # intersection
            boost_score += 3.0

        # Boost 2: Exercise type match (+2 points)
        if exercise_type:
            doc_exercise_types = doc.get("exercise_types", [])
            if exercise_type in doc_exercise_types:
                boost_score += 2.0

        # Boost 3: Weak skill match (+2 points)
        doc_skills = set(doc.get("skill_tags", []))
        weak_skill_set = set(weak_skills)
        if doc_skills & weak_skill_set:
            boost_score += 2.0

        # Boost 4: Document priority (+priority value)
        priority = doc.get("priority", 0)
        boost_score += priority

        # Boost 5: Effectiveness boost (if available)
        effectiveness = doc.get("effectiveness", {})
        times_used = effectiveness.get("times_used", 0)
        helped_correct = effectiveness.get("helped_correct", 0)

        if times_used >= 5:  # Only consider if statistically significant
            help_rate = helped_correct / times_used
            boost_score += help_rate * 1.5  # Up to +1.5 for perfect help rate

        # Total score
        total_score = semantic_score + boost_score

        scored_docs.append({
            "doc": doc,
            "score": total_score,
            "semantic_score": semantic_score,
            "boost_score": boost_score
        })

    # Handle documents without embeddings (add them with lower scores)
    docs_without_embeddings = [d for d in candidates if d not in valid_docs]
    for doc in docs_without_embeddings:
        # Give them a small base score based on symbolic matching only
        boost_score = 0.0

        doc_errors = set(doc.get("error_types", []))
        if doc_errors & set(error_types):
            boost_score += 3.0

        if exercise_type and exercise_type in doc.get("exercise_types", []):
            boost_score += 2.0

        if set(doc.get("skill_tags", [])) & set(weak_skills):
            boost_score += 2.0

        boost_score += doc.get("priority", 0)

        scored_docs.append({
            "doc": doc,
            "score": boost_score,
            "semantic_score": 0.0,
            "boost_score": boost_score
        })

    # STEP 4: Sort by Total Score (descending)
    scored_docs.sort(key=lambda x: x["score"], reverse=True)

    # STEP 5: Return top-k documents
    top_docs = [item["doc"] for item in scored_docs[:limit]]

    # Debug logging
    print(f"Hybrid retrieval returned {len(top_docs)} documents")
    for i, item in enumerate(scored_docs[:limit]):
        print(f"  Rank {i+1}: score={item['score']:.2f} "
              f"(semantic={item['semantic_score']:.2f}, boost={item['boost_score']:.2f})")

    return top_docs


def _fallback_ranking(
    candidates: list[dict],
    skill_tags: list[str],
    error_types: list[str],
    weak_skills: list[str],
    limit: int
) -> list[dict]:
    """
    Fallback ranking when embeddings are not available.
    Uses only symbolic matching and boost factors.
    """
    scored = []

    for doc in candidates:
        score = 0.0

        # Skill tag matches
        doc_skills = set(doc.get("skill_tags", []))
        skill_matches = len(doc_skills & set(skill_tags))
        score += skill_matches * 2.0

        # Error type matches
        doc_errors = set(doc.get("error_types", []))
        if doc_errors & set(error_types):
            score += 3.0

        # Weak skill matches
        if doc_skills & set(weak_skills):
            score += 2.0

        # Priority
        score += doc.get("priority", 0)

        scored.append({"doc": doc, "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)
    return [item["doc"] for item in scored[:limit]]

