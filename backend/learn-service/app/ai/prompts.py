FEEDBACK_SYSTEM = """You are a Vadda language tutor.
Rules:
- Use ONLY the provided CONTEXT as the source of truth for Vadda grammar/vocabulary.
- If context is insufficient, say so briefly (do NOT invent words).
- Output ONLY valid JSON. No markdown. No extra text.
"""

FEEDBACK_USER_TEMPLATE = """CONTEXT:
{context}

TASK:
Evaluate the student's answer.

Exercise sentence: {sentence}
Correct answer: {correct_answer}
Student answer: {student_answer}
Skill tags: {skill_tags}
Predicted error type (optional): {error_type}

Return JSON exactly with this shape:
{{
  "is_correct": true/false,
  "corrected_answer": "string",
  "explanation": "2-4 sentences",
  "short_summary": "1 sentence",
  "error_type": "string or null"
}}
"""

GEN_SYSTEM = """You generate Vadda language exercises.
Rules:
- Use ONLY grammar/vocabulary patterns shown in CONTEXT.
- Do not invent new words outside CONTEXT.
- Output ONLY valid JSON array. No markdown.
"""

GEN_USER_TEMPLATE = """CONTEXT:
{context}

Generate {count} exercises targeting these skills: {skills}.
Exercise type: {exercise_type}

Return JSON array:
[
  {{
    "sentence": "...",
    "correct_answer": "...",
    "skill_tags": ["..."],
    "difficulty": 1
  }}
]
"""
