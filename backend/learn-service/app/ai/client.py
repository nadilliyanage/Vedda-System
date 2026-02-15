from openai import OpenAI
from app.config import Config
# from app.ai.service import generate_exercises_with_rag

_client = OpenAI(api_key=Config.OPENAI_API_KEY)

def call_openai_json(model: str, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> tuple[str, dict]:
    """
    Uses OpenAI Responses API and returns (text, usage_dict).
    We will parse JSON later in service.py.
    """
    resp = _client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )
    usage = getattr(resp, "usage", None)
    usage_dict = usage.model_dump() if usage else {}
    return (resp.output_text or "").strip(), usage_dict


# @ai_bp.get("/personalized-exercises")
# def personalized_exercises():
#     db = get_db()
#     user_id = request.args.get("user_id")
#     if not user_id:
#         return jsonify({"error": "user_id required"}), 400
#
#     stats_doc = db["user_stats"].find_one({"user_id": user_id}) or {"skill_stats": {}}
#     weak_skills = _pick_weak_skills(stats_doc.get("skill_stats", {}))
#
#     if not weak_skills:
#         weak_skills = ["greetings"]  # fallback skill tag you have in KB
#
#     exercises, usage = generate_exercises_with_rag(skills=weak_skills, count=5, exercise_type="fill_blank")
#
#     # store generated exercises (optional)
#     db["ai_generated_exercises"].insert_one({
#         "user_id": user_id,
#         "weak_skills": weak_skills,
#         "exercises": exercises,
#         "openai_usage": usage,
#         "model": "gpt-4o",
#         "created_at": datetime.utcnow()
#     })
#
#     return jsonify({"weak_skills": weak_skills, "exercises": exercises, "usage": usage})

def _pick_weak_skills(skill_stats: dict) -> list[str]:
    weak = []
    for skill, s in skill_stats.items():
        total = (s.get("correct", 0) + s.get("wrong", 0))
        if total < 5:
            continue
        acc = s.get("correct", 0) / total
        if acc < 0.6:
            weak.append(skill)
    return weak[:3]
