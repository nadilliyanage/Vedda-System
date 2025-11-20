import os
import re
from datetime import datetime
from random import choice as rand_choice

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

PORT = int(os.environ.get("PORT", 5006))
MONGODB_URI = os.environ.get(
    "MONGODB_URI",
    "mongodb+srv://heshan:3UAXaHwpIRwEqK8K@cluster0.quemmhk.mongodb.net/vedda-system?retryWrites=true&w=majority&appName=Cluster0"
)

app = Flask(__name__)
CORS(app)

# MongoDB connection
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client['vedda-system']
    challenges_collection = db['challenges']
    print("MongoDB connected successfully")
except ConnectionFailure as e:
    print(f"MongoDB connection failed: {e}")
    raise


def _normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def _sanitize_challenge(ch):
    sanitized = {k: v for k, v in ch.items() if k not in ("answers", "correct", "_id")}
    # For match_pairs, add shuffled rightOptions
    if ch.get("type") == "match_pairs" and "pairs" in ch:
        from random import shuffle
        right_options = [pair["right"] for pair in ch["pairs"]]
        shuffle(right_options)
        sanitized["rightOptions"] = right_options
    return sanitized


def _seed_challenges_if_empty():
    """Seed initial challenges if collection is empty"""
    if challenges_collection.count_documents({}) == 0:
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
        challenges_collection.insert_many(seed_challenges)
        print(f"Seeded {len(seed_challenges)} challenges to MongoDB")


# Seed challenges on startup if empty
_seed_challenges_if_empty()


@app.route("/health", methods=["GET"])
def health():
    challenge_count = challenges_collection.count_documents({})
    return jsonify({
        "status": "healthy",
        "service": "learn-service",
        "timestamp": datetime.now().isoformat(),
        "challenge_count": challenge_count,
        "database": "MongoDB"
    })


@app.route("/api/learn/challenges", methods=["GET"])
def list_challenges():
    ctype = request.args.get("type")
    query = {"type": ctype} if ctype else {}
    challenges = list(challenges_collection.find(query))
    return jsonify([_sanitize_challenge(c) for c in challenges])


@app.route("/api/learn/next-challenge", methods=["GET"])
def next_challenge():
    ctype = request.args.get("type")
    query = {"type": ctype} if ctype else {}
    challenges = list(challenges_collection.find(query))
    if not challenges:
        return jsonify({"error": "No challenges available"}), 404
    picked = rand_choice(challenges)
    return jsonify(_sanitize_challenge(picked))


@app.route("/api/learn/submit", methods=["POST"])
def submit_challenge():
    data = request.get_json() or {}
    challenge_id = data.get("challengeId")
    answer = data.get("answer") if "answer" in data else data.get("selectedOption")
    if not challenge_id:
        return jsonify({"success": False, "error": "challengeId required"}), 400
    ch = challenges_collection.find_one({"id": challenge_id})
    if not ch:
        return jsonify({"success": False, "error": "Unknown challengeId"}), 400

    result = {"success": True, "challengeId": challenge_id}
    if ch["type"] == "fill_blank":
        provided = _normalize_text(str(answer))
        valid = {_normalize_text(a) for a in ch.get("answers", [])}
        is_correct = provided in valid
        base_xp = ch.get("xp", 20)
        base_coins = ch.get("coins", 4)
        result.update({
            "type": "fill_blank",
            "correct": is_correct,
            "xpAwarded": base_xp if is_correct else max(1, base_xp // 4),
            "coinsAwarded": base_coins if is_correct else max(1, base_coins // 4)
        })
    elif ch["type"] == "multiple_choice":
        correct_set = set(ch.get("correct", []))
        is_correct = str(answer) in correct_set
        base_xp = ch.get("xp", 15)
        base_coins = ch.get("coins", 3)
        result.update({
            "type": "multiple_choice",
            "correct": is_correct,
            "xpAwarded": base_xp if is_correct else max(1, base_xp // 3),
            "coinsAwarded": base_coins if is_correct else max(1, base_coins // 3)
        })
    elif ch["type"] == "match_pairs":
        # answer should be dict like {"ගස (gasa)": "tree", ...}
        user_pairs = answer if isinstance(answer, dict) else {}
        solution = {pair["left"]: pair["right"] for pair in ch.get("pairs", [])}
        correct_pairs = sum(1 for left, right in user_pairs.items() if solution.get(left) == right)
        total_pairs = len(solution)
        is_correct = correct_pairs == total_pairs
        base_xp = ch.get("xp", 25)
        base_coins = ch.get("coins", 5)
        # Partial credit based on correct pairs
        xp_awarded = int(base_xp * (correct_pairs / total_pairs)) if total_pairs > 0 else 0
        coins_awarded = int(base_coins * (correct_pairs / total_pairs)) if total_pairs > 0 else 0
        result.update({
            "type": "match_pairs",
            "correct": is_correct,
            "correctPairs": correct_pairs,
            "totalPairs": total_pairs,
            "xpAwarded": max(1, xp_awarded) if correct_pairs > 0 else 0,
            "coinsAwarded": max(1, coins_awarded) if correct_pairs > 0 else 0
        })
    else:
        result.update({"correct": False, "xpAwarded": 0, "coinsAwarded": 0, "error": "Unsupported challenge type"})
    return jsonify(result)


if __name__ == "__main__":
    print(f"Starting Learn Service on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=True)
