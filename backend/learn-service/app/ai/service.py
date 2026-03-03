import json
from ..config import Config
from ..ai.client import call_openai_json
from ..ai.prompts import (
    FEEDBACK_SYSTEM, FEEDBACK_USER_TEMPLATE,
    GEN_SYSTEM, GEN_USER_TEMPLATE,
    GEN_MC_INSTRUCTIONS, GEN_MC_JSON_TEMPLATE,
    GEN_TEXT_INPUT_INSTRUCTIONS, GEN_TEXT_INPUT_JSON_TEMPLATE
)
from ..ai.rag import build_rag_context
from ..ai.rag_hybrid import hybrid_retrieve
from ..ai.context_builder import (
    build_context_for_feedback,
    build_context_for_exercise_generation
)
from ..db.mongo import get_db

def _safe_json_loads(text: str):
    """
    Parses JSON reliably even if model accidentally adds extra text.
    """
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # try to extract the first JSON object/array
        start_obj = text.find("{")
        start_arr = text.find("[")
        candidates = [i for i in [start_obj, start_arr] if i != -1]
        if not candidates:
            raise
        start = min(candidates)

        end_obj = text.rfind("}")
        end_arr = text.rfind("]")
        end = max(end_obj, end_arr)
        if end <= start:
            raise

        return json.loads(text[start:end+1])

def get_feedback_with_rag(*, sentence: str, correct_answer: str, student_answer: str,
                          skill_tags: list[str], error_type: str | None = None,
                          user_id: str | None = None) -> tuple[dict, dict]:
    """
    Generate feedback using advanced hybrid RAG.

    Args:
        sentence: Exercise question/prompt
        correct_answer: The correct answer
        student_answer: What the student answered
        skill_tags: Skills involved in this exercise
        error_type: Detected error type (if available)
        user_id: User ID for personalization (optional)

    Returns:
        Tuple of (feedback_data, usage_stats)
    """
    db = get_db()

    # Get user stats for personalization
    weak_skills = []
    top_errors = []

    if user_id:
        user_stats = db["user_stats"].find_one({"user_id": user_id})
        if user_stats:
            # Extract weak skills
            skill_stats = user_stats.get("skill_stats", {})
            for skill, stats in skill_stats.items():
                total = stats.get("correct", 0) + stats.get("wrong", 0)
                if total >= 3:
                    accuracy = stats.get("correct", 0) / total
                    if accuracy < 0.6:
                        weak_skills.append(skill)

            # Extract top errors
            error_stats = user_stats.get("error_stats", {})
            error_list = [(err, count) for err, count in error_stats.items()]
            error_list.sort(key=lambda x: x[1], reverse=True)
            top_errors = [err for err, _ in error_list[:3]]

    # Build query for semantic search
    query_text = f"Student answered '{student_answer}' instead of '{correct_answer}'. {sentence}"

    # Retrieve relevant knowledge using hybrid RAG
    retrieved_docs = hybrid_retrieve(
        db=db,
        query_text=query_text,
        skill_tags=skill_tags,
        error_types=[error_type] if error_type else top_errors,
        exercise_type=None,  # Not relevant for feedback
        difficulty=None,  # Don't filter by difficulty for feedback
        weak_skills=weak_skills,
        limit=5
    )

    # Build specialized context for feedback
    if retrieved_docs:
        context = build_context_for_feedback(
            docs=retrieved_docs,
            student_answer=student_answer,
            correct_answer=correct_answer,
            error_type=error_type
        )
    else:
        # Fallback to old RAG if hybrid retrieval returns nothing
        context = build_rag_context(skill_tags, correct_answer)

    user_prompt = FEEDBACK_USER_TEMPLATE.format(
        context=context,
        sentence=sentence,
        correct_answer=correct_answer,
        student_answer=student_answer,
        skill_tags=skill_tags,
        error_type=error_type or "null",
    )
    print(user_prompt)

    raw, usage = call_openai_json(
        model=Config.OPENAI_MODEL_FAST,   # gpt-4o-mini
        system_prompt=FEEDBACK_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.2
    )

    data = _safe_json_loads(raw)

    # Store knowledge IDs for effectiveness tracking
    if retrieved_docs:
        data["_retrieved_knowledge_ids"] = [str(doc["_id"]) for doc in retrieved_docs]

    return data, usage

def generate_exercise_with_rag(
    *,
    skills: list[str],
    error_types: list[str],
    exercise_number: int = 1,
    difficulty: str = "beginner",
    exercise_type: str = "multiple_choice"
) -> tuple[dict, dict]:
    """
    Generate exercise using advanced hybrid RAG.

    Args:
        skills: Target skills for the exercise
        error_types: Error types to address
        exercise_number: Exercise number in sequence
        difficulty: Difficulty level
        exercise_type: Type of exercise to generate

    Returns:
        Tuple of (exercise_data, usage_stats)
    """
    import random

    db = get_db()

    # Build query for semantic search with variety
    query_variations = [
        f"Generate exercise for skills: {', '.join(skills)}. Address errors: {', '.join(error_types)}.",
        f"Create practice question about {', '.join(skills)} to help with {', '.join(error_types)}.",
        f"Design exercise targeting {', '.join(skills)} skills, focusing on {', '.join(error_types)}.",
        f"Make a {difficulty} level exercise for {', '.join(skills)}."
    ]
    query_text = random.choice(query_variations)

    # Retrieve relevant knowledge using hybrid RAG
    # Request more docs and randomly sample for variety
    retrieved_docs = hybrid_retrieve(
        db=db,
        query_text=query_text,
        skill_tags=skills,
        error_types=error_types,
        exercise_type=exercise_type,
        difficulty=difficulty,
        weak_skills=skills,  # All target skills are weak
        limit=8  # Get more docs
    )

    # Randomly sample from retrieved docs for variety
    if len(retrieved_docs) > 6:
        retrieved_docs = random.sample(retrieved_docs, 6)

    # Build specialized context for exercise generation
    if retrieved_docs:
        rag_knowledge = build_context_for_exercise_generation(
            docs=retrieved_docs,
            skills=skills,
            error_types=error_types
        )
    else:
        # Fallback to old RAG
        rag_knowledge = build_rag_context(skills)

    # Randomly pick exercise type
    exercise_type = random.choice(["multiple_choice", "text_input"])

    # Build type-specific instructions and JSON template
    if exercise_type == "text_input":
        type_specific_instructions = GEN_TEXT_INPUT_INSTRUCTIONS
        json_template = GEN_TEXT_INPUT_JSON_TEMPLATE.format(
            exercise_number=str(exercise_number),
            skill_tags=", ".join(f'"{s}"' for s in skills)
        )
    else:
        type_specific_instructions = GEN_MC_INSTRUCTIONS
        json_template = GEN_MC_JSON_TEMPLATE.format(
            exercise_number=str(exercise_number),
            skill_tags=", ".join(f'"{s}"' for s in skills)
        )

    user_prompt = GEN_USER_TEMPLATE.format(
        context=rag_knowledge,
        skill_tags=", ".join(skills),
        error_types=", ".join(error_types),
        exercise_type=exercise_type,
        exercise_number=str(exercise_number),
        type_specific_instructions=type_specific_instructions,
        json_template=json_template
    )

    raw, usage = call_openai_json(
        model=Config.OPENAI_MODEL_GEN,   # gpt-4o / gpt-4o-mini
        system_prompt=GEN_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.8   # INCREASED: Higher temperature for variety (was 0.3)
    )

    data = _safe_json_loads(raw)

    if not isinstance(data, dict):
        raise ValueError("Expected a single JSON object from the model.")

    # Hard validation
    assert data["categoryId"] == "z0"
    q_type = data["question"]["type"]
    assert q_type in ("multiple_choice", "text_input"), f"Unexpected question type: {q_type}"

    if q_type == "multiple_choice":
        assert len(data["question"]["options"]) == 4
    else:
        assert data["question"].get("answer"), "text_input exercise must have an answer field"
        assert data["question"].get("correct_answer"), "text_input exercise must have a correct_answer field"

    # Store knowledge IDs for effectiveness tracking
    if retrieved_docs:
        data["_retrieved_knowledge_ids"] = [str(doc["_id"]) for doc in retrieved_docs]

    return data, usage

