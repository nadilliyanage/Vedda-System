import json
import os
import re
from datetime import datetime
from random import choice as rand_choice

from flask import Flask, request, jsonify
from flask_cors import CORS

PORT = int(os.environ.get("PORT", 5005))
DATA_DIR = os.path.join(os.path.dirname(__file__), "storage")
DATA_FILE = os.path.join(DATA_DIR, "challenges.json")

app = Flask(__name__)
CORS(app)


def _normalize_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def _sanitize_challenge(ch):
    return {k: v for k, v in ch.items() if k not in ("answers", "correct")}


def _load_challenges():
    if not os.path.exists(DATA_FILE):
        os.makedirs(DATA_DIR, exist_ok=True)
        seed = {
            "challenges": [
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
                }
            ]
        }
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(seed, f, ensure_ascii=False, indent=2)
        return seed["challenges"]
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data.get("challenges", [])


CHALLENGES = _load_challenges()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "learn-service",
        "timestamp": datetime.now().isoformat(),
        "challenge_count": len(CHALLENGES)
    })


@app.route("/api/learn/challenges", methods=["GET"])
def list_challenges():
    ctype = request.args.get("type")
    pool = [c for c in CHALLENGES if (c["type"] == ctype)] if ctype else CHALLENGES
    return jsonify([_sanitize_challenge(c) for c in pool])


@app.route("/api/learn/next-challenge", methods=["GET"])
def next_challenge():
    ctype = request.args.get("type")
    pool = [c for c in CHALLENGES if (c["type"] == ctype)] if ctype else CHALLENGES
    if not pool:
        return jsonify({"error": "No challenges available"}), 404
    picked = rand_choice(pool)
    return jsonify(_sanitize_challenge(picked))


@app.route("/api/learn/submit", methods=["POST"])
def submit_challenge():
    data = request.get_json() or {}
    challenge_id = data.get("challengeId")
    answer = data.get("answer") if "answer" in data else data.get("selectedOption")
    if not challenge_id:
        return jsonify({"success": False, "error": "challengeId required"}), 400
    by_id = {c["id"]: c for c in CHALLENGES}
    ch = by_id.get(challenge_id)
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
    else:
        result.update({"correct": False, "xpAwarded": 0, "coinsAwarded": 0, "error": "Unsupported challenge type"})
    return jsonify(result)


if __name__ == "__main__":
    print(f"Starting Learn Service on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=True)
