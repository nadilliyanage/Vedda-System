from datetime import datetime
from random import choice as rand_choice

from ..db.mongo import get_collection
from ..models.challenge_model import normalize_text, sanitize_challenge_public

def _challenges_col():
    return get_collection("challenges")


def _user_lesson_col():
    return get_collection("user_lessons")

#User lesson progress

def save_user_lesson_progress(
    user_id: str,
    lesson_id: str,
    completed: bool = False
):
    """
    Creates or updates a user_lesson record.
    - If lesson is started: create record
    - If lesson is completed: mark completed + timestamp
    """
    col = _user_lesson_col()

    existing = col.find_one({
        "user_id": user_id,
        "lesson_id": lesson_id
    })

    now = datetime.utcnow()

    # If record does not exist → create it
    if not existing:
        doc = {
            "user_id": user_id,
            "lesson_id": lesson_id,
            "completed": completed,
            "started_at": now,
            "completed_at": now if completed else None
        }
        col.insert_one(doc)
        return doc

    # If exists and now completed → update
    if completed and not existing.get("completed", False):
        col.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "completed": True,
                    "completed_at": now
                }
            }
        )
    return existing

# ---------- Seeding ----------

def seed_challenges_if_empty():
    """Seed initial challenges if collection is empty."""
    col = _challenges_col()
    if col.count_documents({}) > 0:
        return

    seed_challenges = [
        {
            "id": "fb1",
            "type": "fill_blank",
            "prompt": "Type the English word for 'ගසා (gasa)'",
            "answers": ["tree"],
            "xp": 20,
            "coins": 4,
            "timeLimitSec": 45
        },
        {
            "id": "fb2",
            "type": "fill_blank",
            "prompt": "Type the English word for 'අට (ata)'",
            "answers": ["eight", "8"],
            "xp": 20,
            "coins": 4,
            "timeLimitSec": 45
        },
        {
            "id": "mc1",
            "type": "multiple_choice",
            "prompt": "Select the correct English meaning for 'වැලි (weli)'.",
            "options": [
                {"id": "A", "text": "sand"},
                {"id": "B", "text": "stone"},
                {"id": "C", "text": "water"},
                {"id": "D", "text": "leaf"}
            ],
            "correct": ["A"],
            "xp": 15,
            "coins": 3,
            "timeLimitSec": 30
        },
        {
            "id": "mp1",
            "type": "match_pairs",
            "prompt": "Match the Vedda words with their English meanings",
            "pairs": [
                {"left": "ගස (gasa)", "right": "tree"},
                {"left": "වතුර (vatura)", "right": "water"},
                {"left": "කන්ද (kanda)", "right": "mountain"}
            ],
            "xp": 25,
            "coins": 5,
            "timeLimitSec": 60
        },
        {
            "id": "mp2",
            "type": "match_pairs",
            "prompt": "Match the Vedda numbers with their English translations",
            "pairs": [
                {"left": "එක (eka)", "right": "one"},
                {"left": "දෙක (deka)", "right": "two"},
                {"left": "තුන (thuna)", "right": "three"},
                {"left": "හතර (hathara)", "right": "four"}
            ],
            "xp": 30,
            "coins": 6,
            "timeLimitSec": 60
        }
    ]
    col.insert_many(seed_challenges)
    print(f"Seeded {len(seed_challenges)} challenges to MongoDB")


# ---------- Health ----------

def get_health_info():
    col = _challenges_col()
    challenge_count = col.count_documents({})
    return {
        "status": "healthy",
        "service": "learn-service",
        "timestamp": datetime.now().isoformat(),
        "challenge_count": challenge_count,
        "database": "MongoDB"
    }


# ---------- Public challenge listing ----------

def list_challenges_public(challenge_type: str | None):
    col = _challenges_col()
    query = {"type": challenge_type} if challenge_type else {}
    challenges = list(col.find(query))
    return [sanitize_challenge_public(c) for c in challenges]


def get_next_challenge_public(challenge_type: str | None):
    col = _challenges_col()
    query = {"type": challenge_type} if challenge_type else {}
    challenges = list(col.find(query))

    if not challenges:
        return {"error": "No challenges available"}, 404

    picked = rand_choice(challenges)
    return sanitize_challenge_public(picked), 200


# ---------- Submit logic ----------

def submit_challenge(payload: dict):
    """
    Handles /api/learn/submit logic.
    Returns (response_dict, http_status).
    """
    col = _challenges_col()

    challenge_id = payload.get("challengeId")
    answer = payload.get("answer") if "answer" in payload else payload.get("selectedOption")

    if not challenge_id:
        return {"success": False, "error": "challengeId required"}, 400

    ch = col.find_one({"id": challenge_id})
    if not ch:
        return {"success": False, "error": "Unknown challengeId"}, 400

    ch_type = ch.get("type")
    result = {"success": True, "challengeId": challenge_id}

    if ch_type == "fill_blank":
        provided = normalize_text(str(answer))
        valid = {normalize_text(a) for a in ch.get("answers", [])}
        is_correct = provided in valid
        base_xp = ch.get("xp", 20)
        base_coins = ch.get("coins", 4)
        result.update({
            "type": "fill_blank",
            "correct": is_correct,
            "xpAwarded": base_xp if is_correct else max(1, base_xp // 4),
            "coinsAwarded": base_coins if is_correct else max(1, base_coins // 4),
        })
        return result, 200

    if ch_type == "multiple_choice":
        correct_set = set(ch.get("correct", []))
        is_correct = str(answer) in correct_set
        base_xp = ch.get("xp", 15)
        base_coins = ch.get("coins", 3)
        result.update({
            "type": "multiple_choice",
            "correct": is_correct,
            "xpAwarded": base_xp if is_correct else max(1, base_xp // 3),
            "coinsAwarded": base_coins if is_correct else max(1, base_coins // 3),
        })
        return result, 200

    if ch_type == "match_pairs":
        # answer should be dict like {"ගස (gasa)": "tree", ...}
        user_pairs = answer if isinstance(answer, dict) else {}
        solution = {pair["left"]: pair["right"] for pair in ch.get("pairs", [])}
        correct_pairs = sum(
            1 for left, right in user_pairs.items() if solution.get(left) == right
        )
        total_pairs = len(solution)
        is_correct = correct_pairs == total_pairs
        base_xp = ch.get("xp", 25)
        base_coins = ch.get("coins", 5)

        xp_awarded = int(base_xp * (correct_pairs / total_pairs)) if total_pairs > 0 else 0
        coins_awarded = int(base_coins * (correct_pairs / total_pairs)) if total_pairs > 0 else 0

        result.update({
            "type": "match_pairs",
            "correct": is_correct,
            "correctPairs": correct_pairs,
            "totalPairs": total_pairs,
            "xpAwarded": max(1, xp_awarded) if correct_pairs > 0 else 0,
            "coinsAwarded": max(1, coins_awarded) if correct_pairs > 0 else 0,
        })
        return result, 200

    # Unsupported type
    result.update({
        "type": ch_type,
        "correct": False,
        "xpAwarded": 0,
        "coinsAwarded": 0,
        "error": "Unsupported challenge type",
    })
    return result, 400
