"""
Similarity Computation Module
Implements cosine similarity and other similarity metrics for RAG
"""

import numpy as np
from typing import List


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """
    Compute cosine similarity between two vectors.

    Args:
        vec1: First embedding vector
        vec2: Second embedding vector

    Returns:
        Cosine similarity score between -1 and 1 (typically 0 to 1 for embeddings)

    Raises:
        ValueError: If vectors are empty or have different dimensions
    """
    if not vec1 or not vec2:
        raise ValueError("Vectors cannot be empty")

    if len(vec1) != len(vec2):
        raise ValueError(f"Vector dimensions must match: {len(vec1)} vs {len(vec2)}")

    # Convert to numpy arrays
    a = np.array(vec1)
    b = np.array(vec2)

    # Compute cosine similarity
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    # Avoid division by zero
    if norm_a == 0 or norm_b == 0:
        return 0.0

    similarity = dot_product / (norm_a * norm_b)

    # Ensure result is between -1 and 1 (handle floating point errors)
    return float(np.clip(similarity, -1.0, 1.0))


def cosine_similarity_batch(query_vec: list[float], doc_vecs: list[list[float]]) -> list[float]:
    """
    Compute cosine similarity between a query vector and multiple document vectors.
    More efficient than calling cosine_similarity multiple times.

    Args:
        query_vec: Query embedding vector
        doc_vecs: List of document embedding vectors

    Returns:
        List of similarity scores

    Raises:
        ValueError: If inputs are invalid
    """
    if not query_vec:
        raise ValueError("Query vector cannot be empty")

    if not doc_vecs:
        return []

    # Convert to numpy arrays
    query = np.array(query_vec)
    docs = np.array(doc_vecs)

    # Validate dimensions
    if docs.shape[1] != len(query_vec):
        raise ValueError(f"Vector dimensions must match: {docs.shape[1]} vs {len(query_vec)}")

    # Compute dot products for all documents at once
    dot_products = np.dot(docs, query)

    # Compute norms
    query_norm = np.linalg.norm(query)
    doc_norms = np.linalg.norm(docs, axis=1)

    # Avoid division by zero
    if query_norm == 0:
        return [0.0] * len(doc_vecs)

    # Compute similarities
    similarities = dot_products / (doc_norms * query_norm)

    # Handle any NaN values (from zero-norm documents)
    similarities = np.nan_to_num(similarities, nan=0.0)

    # Clip to valid range
    similarities = np.clip(similarities, -1.0, 1.0)

    return similarities.tolist()


def euclidean_distance(vec1: list[float], vec2: list[float]) -> float:
    """
    Compute Euclidean distance between two vectors.
    Lower distance means more similar.

    Args:
        vec1: First embedding vector
        vec2: Second embedding vector

    Returns:
        Euclidean distance (non-negative)
    """
    if not vec1 or not vec2:
        raise ValueError("Vectors cannot be empty")

    if len(vec1) != len(vec2):
        raise ValueError(f"Vector dimensions must match: {len(vec1)} vs {len(vec2)}")

    a = np.array(vec1)
    b = np.array(vec2)

    distance = np.linalg.norm(a - b)
    return float(distance)


def dot_product_similarity(vec1: list[float], vec2: list[float]) -> float:
    """
    Compute dot product between two vectors.
    For normalized embeddings, this is equivalent to cosine similarity.

    Args:
        vec1: First embedding vector
        vec2: Second embedding vector

    Returns:
        Dot product score
    """
    if not vec1 or not vec2:
        raise ValueError("Vectors cannot be empty")

    if len(vec1) != len(vec2):
        raise ValueError(f"Vector dimensions must match: {len(vec1)} vs {len(vec2)}")

    a = np.array(vec1)
    b = np.array(vec2)

    return float(np.dot(a, b))

