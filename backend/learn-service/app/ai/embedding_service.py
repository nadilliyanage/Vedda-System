"""
Embedding Service for Vedda Knowledge Base
Generates embeddings using OpenAI's text-embedding-3-small model
"""

from openai import OpenAI
from ..config import Config

# Initialize OpenAI client
_client = OpenAI(api_key=Config.OPENAI_API_KEY)

# Embedding model configuration
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSION = 1536  # Default dimension for text-embedding-3-small


def generate_embedding(text: str) -> list[float]:
    """
    Generate embedding vector for given text using OpenAI's embedding model.

    Args:
        text: Input text to embed

    Returns:
        List of floats representing the embedding vector

    Raises:
        ValueError: If text is empty
        Exception: If API call fails
    """
    if not text or not text.strip():
        raise ValueError("Text cannot be empty")

    try:
        response = _client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text.strip(),
            encoding_format="float"
        )

        embedding = response.data[0].embedding
        return embedding

    except Exception as e:
        print(f"Error generating embedding: {e}")
        raise


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple texts in a single API call (more efficient).

    Args:
        texts: List of input texts to embed

    Returns:
        List of embedding vectors

    Raises:
        ValueError: If texts list is empty
        Exception: If API call fails
    """
    if not texts:
        raise ValueError("Texts list cannot be empty")

    # Filter out empty texts
    valid_texts = [t.strip() for t in texts if t and t.strip()]

    if not valid_texts:
        raise ValueError("No valid texts to embed")

    try:
        response = _client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=valid_texts,
            encoding_format="float"
        )

        embeddings = [item.embedding for item in response.data]
        return embeddings

    except Exception as e:
        print(f"Error generating batch embeddings: {e}")
        raise


def prepare_knowledge_text_for_embedding(doc: dict) -> str:
    """
    Prepare knowledge document text for embedding generation.
    Combines multiple fields to create rich semantic representation.

    Args:
        doc: Knowledge document from vadda_knowledge collection

    Returns:
        Formatted text suitable for embedding
    """
    parts = []

    # Add content (main rule/explanation)
    if doc.get("content"):
        parts.append(doc["content"])

    # Add example if available
    if doc.get("example"):
        parts.append(f"Example: {doc['example']}")

    # Add skill tags for context
    if doc.get("skill_tags"):
        parts.append(f"Skills: {', '.join(doc['skill_tags'])}")

    # Add error types for context
    if doc.get("error_types"):
        parts.append(f"Addresses: {', '.join(doc['error_types'])}")

    return " | ".join(parts)

