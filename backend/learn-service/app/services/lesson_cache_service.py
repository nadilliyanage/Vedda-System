from ..db.mongo import get_collection
from ..models.common import serialize_mongo_doc
import logging

logger = logging.getLogger(__name__)

# In-memory cache for lessons
_lessons_cache = None
_cache_initialized = False


def _init_cache():
    """Initialize the cache by loading all lessons from MongoDB."""
    global _lessons_cache, _cache_initialized

    try:
        col = get_collection("lessons")
        lessons = list(col.find({}))
        _lessons_cache = [serialize_mongo_doc(l) for l in lessons]
        _cache_initialized = True
        logger.info(f"Lesson cache initialized with {len(_lessons_cache)} lessons")
    except Exception as e:
        logger.error(f"Error initializing lesson cache: {e}")
        _lessons_cache = []
        _cache_initialized = True


def _invalidate_cache():
    """Invalidate the cache, forcing a reload on next access."""
    global _lessons_cache, _cache_initialized
    _lessons_cache = None
    _cache_initialized = False
    logger.debug("Lesson cache invalidated")


def get_all_lessons():
    """
    Get all lessons from cache.
    If cache is not initialized, load from database.

    Returns:
        List of serialized lesson documents
    """
    global _lessons_cache, _cache_initialized

    if not _cache_initialized:
        _init_cache()

    return _lessons_cache if _lessons_cache is not None else []


def get_lesson_by_id(lesson_id: str):
    """
    Get a single lesson by ID from cache.

    Args:
        lesson_id: The lesson ID to search for

    Returns:
        The lesson document if found, None otherwise
    """
    lessons = get_all_lessons()
    for lesson in lessons:
        if lesson.get("id") == lesson_id:
            return lesson
    return None


def invalidate_cache_after_create(data: dict):
    """
    Call this after creating a new lesson to invalidate the cache.

    Args:
        data: The created lesson data (unused, but kept for consistency)
    """
    _invalidate_cache()
    logger.info(f"Cache invalidated after lesson creation")


def invalidate_cache_after_update(lesson_id: str, data: dict):
    """
    Call this after updating a lesson to invalidate the cache.

    Args:
        lesson_id: The lesson ID that was updated
        data: The updated lesson data
    """
    _invalidate_cache()
    logger.info(f"Cache invalidated after lesson update: {lesson_id}")


def invalidate_cache_after_delete(lesson_id: str):
    """
    Call this after deleting a lesson to invalidate the cache.

    Args:
        lesson_id: The lesson ID that was deleted
    """
    _invalidate_cache()
    logger.info(f"Cache invalidated after lesson deletion: {lesson_id}")


def reload_cache():
    """
    Explicitly reload the cache from database.
    Useful for manual refresh if needed.
    """
    _invalidate_cache()
    _init_cache()
    logger.info("Lesson cache reloaded from database")

