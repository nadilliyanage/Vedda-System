import json
from app.config import Config
from app.ai.client import call_openai_json
from app.ai.prompts import (
    FEEDBACK_SYSTEM, FEEDBACK_USER_TEMPLATE,
    GEN_SYSTEM, GEN_USER_TEMPLATE
)
from app.ai.rag import build_rag_context

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
                          skill_tags: list[str], error_type: str | None = None) -> tuple[dict, dict]:
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
    return data, usage

def generate_exercise_with_rag(
    *,
    skills: list[str],
    error_types: list[str],
    exercise_number: int = 1,
) -> tuple[dict, dict]:

    rag_knowledge = build_rag_context(skills)

    user_prompt = GEN_USER_TEMPLATE.format(
        context=rag_knowledge,
        skill_tags=", ".join(skills),
        error_types=", ".join(error_types),
        exercise_number=str(exercise_number)
    )

    raw, usage = call_openai_json(
        model=Config.OPENAI_MODEL_GEN,   # gpt-4o / gpt-4o-mini
        system_prompt=GEN_SYSTEM,
        user_prompt=user_prompt,
        temperature=0.3   # IMPORTANT: low temperature
    )

    data = _safe_json_loads(raw)

    if not isinstance(data, dict):
        raise ValueError("Expected a single JSON object from the model.")

    # Hard validation (VERY IMPORTANT)
    assert data["categoryId"] == "z0"
    assert data["question"]["type"] == "multiple_choice"
    assert len(data["question"]["options"]) == 4

    return data, usage

