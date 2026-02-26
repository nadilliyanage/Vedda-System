import re

from ..db.mongo import get_collection

def build_rag_context(
    skill_tags: list[str],
    content_word: str | None = None,
    limit_docs: int = 6,
    max_lines: int = 25,
) -> str:
    """
    Retrieves relevant grammar rules/examples from vadda_knowledge collection
    using skill_tags and an optional content_word filter.
    """
    coll = get_collection("vedda_knowledge")
    print(skill_tags)

    query = {"skill_tags": {"$in": skill_tags}}
    if content_word:
        query["content"] = {"$regex": re.escape(content_word), "$options": "i"}

    docs = list(coll.find(query).limit(limit_docs))

    lines: list[str] = []
    for d in docs:
        content = (d.get("content") or "").strip()
        if content:
            lines.append(f"- Rule: {content}")

        examples = d.get("examples") or []
        for ex in examples[:3]:
            s = (ex.get("sentence") or "").strip()
            m = (ex.get("meaning") or "").strip()
            if s and m:
                lines.append(f"- Example: {s} = {m}")

    lines = lines[:max_lines]
    return "\n".join(lines) if lines else "- (No relevant Vadda knowledge found.)"
