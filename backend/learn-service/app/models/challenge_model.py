import re
from random import shuffle


def normalize_text(s: str) -> str:
    """Normalize text: trim, lowercase, collapse spaces."""
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def sanitize_challenge_public(ch: dict) -> dict:
    """
    Remove answer / correct data for public API,
    and add shuffled rightOptions for match_pairs.
    """
    sanitized = {k: v for k, v in ch.items() if k not in ("answers", "correct", "_id")}

    # For match_pairs, add shuffled rightOptions
    if ch.get("type") == "match_pairs" and "pairs" in ch:
        right_options = [pair["right"] for pair in ch["pairs"]]
        shuffle(right_options)
        sanitized["rightOptions"] = right_options

    return sanitized