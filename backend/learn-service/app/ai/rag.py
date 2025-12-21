from app.db.mongo import get_collection

def build_rag_context(skill_tags: list[str], limit_docs: int = 6, max_lines: int = 25) -> str:
    """
    Retrieves relevant grammar rules/examples from vadda_knowledge collection
    using skill_tags and builds a small context string for the LLM.
    """
    coll = get_collection("vedda_knowledge")
    print(skill_tags)

    docs = list(coll.find({"skill_tags": {"$in": skill_tags}}).limit(limit_docs))

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
