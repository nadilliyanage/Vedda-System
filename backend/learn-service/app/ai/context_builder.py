"""
Context Builder Module
Constructs structured RAG context from retrieved knowledge documents
"""


def build_context_from_docs(docs: list[dict]) -> str:
    """
    Build structured RAG context from retrieved knowledge documents.

    Args:
        docs: List of knowledge documents from vadda_knowledge collection

    Returns:
        Formatted context string ready for LLM prompt injection
    """
    if not docs:
        return "No relevant Vedda knowledge found."

    lines = []
    lines.append("=== RELEVANT VEDDA LANGUAGE KNOWLEDGE ===\n")

    for idx, doc in enumerate(docs, 1):
        lines.append(f"[Knowledge Item {idx}]")

        # Add content (grammar rule/explanation)
        content = doc.get("content", "").strip()
        if content:
            lines.append(f"Rule: {content}")

        # Add example
        example = doc.get("example", "").strip()
        if example:
            lines.append(f"Example: {example}")

        # Add skill tags for context
        skill_tags = doc.get("skill_tags", [])
        if skill_tags:
            lines.append(f"Skills: {', '.join(skill_tags)}")

        # Add error types this knowledge addresses
        error_types = doc.get("error_types", [])
        if error_types:
            lines.append(f"Addresses errors: {', '.join(error_types)}")

        # Separator between knowledge items
        lines.append("---")

    lines.append("=== END OF KNOWLEDGE ===\n")

    return "\n".join(lines)


def build_compact_context(docs: list[dict], max_items: int = 5) -> str:
    """
    Build a more compact context suitable for shorter prompts.

    Args:
        docs: List of knowledge documents
        max_items: Maximum number of items to include

    Returns:
        Compact formatted context string
    """
    if not docs:
        return "No relevant knowledge found."

    lines = []

    for idx, doc in enumerate(docs[:max_items], 1):
        content = doc.get("content", "").strip()
        example = doc.get("example", "").strip()

        if content:
            line = f"{idx}. {content}"
            if example:
                line += f" (e.g., {example})"
            lines.append(line)

    return "\n".join(lines)


def build_context_with_examples(docs: list[dict]) -> str:
    """
    Build context focusing on examples (useful for exercise generation).

    Args:
        docs: List of knowledge documents

    Returns:
        Example-focused context string
    """
    if not docs:
        return "No examples available."

    lines = []
    lines.append("=== VEDDA LANGUAGE EXAMPLES ===\n")

    for doc in docs:
        content = doc.get("content", "").strip()
        if content:
            lines.append(f"• {content}")

        example = doc.get("example", "").strip()
        if example:
            lines.append(f"  Example: {example}")

        # Add multiple examples if available in 'examples' array
        examples_array = doc.get("examples", [])
        for ex in examples_array[:2]:  # Limit to 2 examples per doc
            sentence = ex.get("sentence", "").strip()
            meaning = ex.get("meaning", "").strip()
            if sentence and meaning:
                lines.append(f"  Example: {sentence} = {meaning}")

        lines.append("")  # Empty line for readability

    return "\n".join(lines)


def build_context_for_feedback(
    docs: list[dict],
    student_answer: str,
    correct_answer: str,
    error_type: str | None = None
) -> str:
    """
    Build specialized context for feedback generation.
    Highlights knowledge most relevant to the student's error.

    Args:
        docs: Retrieved knowledge documents
        student_answer: What the student answered
        correct_answer: The correct answer
        error_type: Detected error type (if available)

    Returns:
        Context optimized for feedback generation
    """
    if not docs:
        return "No relevant knowledge to explain this error."

    lines = []
    lines.append("=== RELEVANT GRAMMAR RULES ===\n")

    # Prioritize docs that address the specific error type
    sorted_docs = docs.copy()
    if error_type:
        sorted_docs.sort(
            key=lambda d: 1 if error_type in d.get("error_types", []) else 0,
            reverse=True
        )

    for doc in sorted_docs[:3]:  # Top 3 most relevant
        content = doc.get("content", "").strip()
        if content:
            lines.append(f"• {content}")

        example = doc.get("example", "").strip()
        if example:
            lines.append(f"  Example: {example}")

        lines.append("")

    lines.append("Use this knowledge to explain why the student's answer is incorrect")
    lines.append(f"and guide them toward the correct answer.")

    return "\n".join(lines)


def build_context_for_exercise_generation(
    docs: list[dict],
    skills: list[str],
    error_types: list[str]
) -> str:
    """
    Build specialized context for exercise generation.
    Focuses on providing diverse examples and patterns.

    Args:
        docs: Retrieved knowledge documents
        skills: Target skills for the exercise
        error_types: Error types to focus on

    Returns:
        Context optimized for exercise generation
    """
    if not docs:
        return "No knowledge available for these skills."

    lines = []
    lines.append("=== VEDDA LANGUAGE KNOWLEDGE FOR EXERCISE CREATION ===\n")
    lines.append(f"Target Skills: {', '.join(skills)}")
    lines.append(f"Common Errors to Address: {', '.join(error_types)}\n")

    for doc in docs:
        content = doc.get("content", "").strip()
        if content:
            lines.append(f"Rule: {content}")

        # Include all available examples
        example = doc.get("example", "").strip()
        if example:
            lines.append(f"Example: {example}")

        examples_array = doc.get("examples", [])
        for ex in examples_array:
            sentence = ex.get("sentence", "").strip()
            meaning = ex.get("meaning", "").strip()
            if sentence and meaning:
                lines.append(f"Example: {sentence} = {meaning}")

        lines.append("---")

    lines.append("\nUse these rules and examples to create a challenging exercise")
    lines.append("that helps the learner practice these specific skills and avoid these errors.")

    return "\n".join(lines)

