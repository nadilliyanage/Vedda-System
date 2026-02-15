FEEDBACK_SYSTEM = """You are a Vadda language tutor.
Rules:
- Use ONLY the provided CONTEXT as the source of truth for Vadda grammar/vocabulary.
- If context is insufficient, say so briefly (do NOT invent words).
- Do NOT use the word "student" in your responses. Address the learner directly using "you" or "your".
- Output ONLY valid JSON. No markdown. No extra text.
"""

FEEDBACK_USER_TEMPLATE = """CONTEXT:
{context}

TASK:
Evaluate the answer provided.

Exercise sentence: {sentence}
Correct answer: {correct_answer}
Given answer: {student_answer}
Skill tags: {skill_tags}
Predicted error type (optional): {error_type}

Return JSON exactly with this shape:
{{
  "is_correct": true/false (If correct answer and given answer is equal then value should be true),
  "corrected_answer": "string",
  "explanation": "2-4 sentences",
  "short_summary": "1 sentence",
  "error_type": "string or null"
}}
"""

GEN_SYSTEM = """You are an AI that generates Vedda language learning exercises.

STRICT RULES (DO NOT VIOLATE):
- Output ONLY valid JSON
- Do NOT include explanations, comments, or markdown
- Do NOT include text outside JSON
- Do NOT change field names
- Do NOT change JSON structure
- categoryId MUST always be "z0"
- Use ONLY Vedda words from CONTEXT
- Do NOT invent new words
- Exactly ONE option must be correct
- correct_answer MUST match the correct option text exactly
"""

GEN_USER_TEMPLATE = """
CONTEXT (Vedda vocabulary and examples):
{context}

TARGET SKILL TAGS:
{skill_tags}

COMMON LEARNER ERRORS:
{error_types}

TASK:
Generate ONE Vedda language multiple-choice vocabulary exercise.

Exercise constraints:
- Question type: multiple_choice
- Difficulty: beginner
- Prompt language: English
- Ask for the Vedda word of an English term
- XP = 1
- Points = 1
- Time limit = 30 seconds
- "rest" must be an empty string

Options constraints:
- Exactly 4 options
- Only ONE option is correct
- Incorrect options must be plausible but wrong
- All option texts must be Vedda words from CONTEXT

Return JSON EXACTLY in this format:

{{
  "categoryId": "z0",
  "exerciseNumber": "{exercise_number}",
  "skillTags": [{skill_tags}],
  "question": {{
    "questionNo": "{exercise_number}",
    "type": "multiple_choice",
    "prompt": "What is the Vedda word for \\"Honey\\"?",
    "xp": 1,
    "points": 1,
    "timeLimitSec": 30,
    "rest": "",
    "options": [
      {{ "id": "A", "text": "...", "correct": false }},
      {{ "id": "B", "text": "...", "correct": true }},
      {{ "id": "C", "text": "...", "correct": false }},
      {{ "id": "D", "text": "...", "correct": false }}
    ],
    "correctOptions": ["B"],
    "correct_answer": "..."
  }}
}}
"""

