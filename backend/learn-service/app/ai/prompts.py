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
  "short_summary": "1 sentence"
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
- Use ONLY Vedda words AND sentence patterns that appear VERBATIM in the CONTEXT
- Do NOT invent new words
- Do NOT construct new sentences by mixing words from different examples
- Every Vedda sentence you produce MUST appear EXACTLY in the CONTEXT examples — copy it, do not create it
- If the CONTEXT does not contain enough sentence examples, use the closest matching example as-is
- Generate the EXACT exercise type requested (multiple_choice OR text_input)

EXERCISE FORMAT RULES — READ BEFORE GENERATING:
- "___" (blank placeholder) is ONLY allowed in the prompt when the error type is "missing_word".
  For spelling_error, word_order_error, and other — NEVER use "___" in the prompt. No exceptions.
- spelling_error → prompt must ask about spelling (e.g. "What is the Vedda word for X?" or "Which is the correct spelling?"). No blanks.
- word_order_error → prompt must ask learner to arrange shuffled words. No blanks.
- other → prompt must ask for translation or vocabulary. No blanks.

For multiple_choice:
- Exactly 4 options, exactly ONE correct
- correct_answer MUST match the correct option text exactly
- All option sentences/words MUST come from CONTEXT examples verbatim
- spelling_error MC: 3 wrong options = misspelled variants of the correct word, NOT different words

For text_input:
- The "answer" field MUST contain the correct Vedda word OR full Vedda sentence taken verbatim from CONTEXT
- correct_answer MUST equal the answer field exactly
- Do NOT include options or correctOptions fields
"""

# ── Error-type-aware exercise style guide injected into GEN_USER_TEMPLATE ──────
_ERROR_TYPE_GUIDE = """
ERROR-TYPE AWARE EXERCISE DESIGN (CRITICAL — follow this before anything else):

The learner's COMMON ERRORS are: {error_types}

The application uses exactly 4 error types. Apply the matching rule below:

• missing_word
  → The learner struggles to complete Vedda sentences (they omit words).
  → You MUST select a CONTEXT example sentence that has AT LEAST 3 words. If no 3-word sentence
    exists in CONTEXT, pick the longest available sentence. Do NOT use 1-word or 2-word answers.

  → For text_input:
     - Show the chosen sentence with exactly ONE word replaced by "___".
     - The prompt should be: the incomplete Vedda sentence followed by the COMPLETE English translation in brackets.
     - The English translation in brackets MUST be the full sentence — NOT with ___, show the actual English word.
     - Example prompt: "Fill in the missing Vedda word: \\"Meaththo ___ balanawa.\\" (I see a leaf.)"
     - The answer is ONLY the single missing Vedda word (e.g. "kola"), NOT the full sentence.
     - The answer must NOT contain a full stop / period (.). Strip it if the word ends with one.
     - correct_answer = the missing word only, no trailing punctuation.

  → For multiple_choice:
     - Show the incomplete sentence (one word replaced by "___") in the prompt.
     - The English translation in brackets MUST show the complete meaning — NOT with ___.
     - Example prompt: "Fill in the missing word: \\"Meaththo ___ balanawa.\\" (I see a leaf.)"
     - All 4 options MUST be SINGLE Vedda words that could plausibly fill the blank.
       - 1 option is the correct missing word (from CONTEXT).
       - 3 options are OTHER Vedda words from CONTEXT that are plausible but wrong for this slot.
     - correct_answer = the correct single missing word, no trailing punctuation.
     - Options must NOT contain full stops / periods (.). Strip them if present.
     - This tests whether the learner knows which word belongs in the sentence.

  → SENTENCE SELECTION RULES:
     - MUST pick a sentence with 3 or more words from CONTEXT. if no such sentence exists, pick the longest available sentence.
     - Remove the most meaningful content word (noun or verb) to create the blank.
     - The remaining words in the prompt must still make partial sense in English.

  → The "answer" and "correct_answer" fields = the single missing word (NOT the full sentence).

• word_order_error
  → The learner writes the right words but in the wrong order.
  → Generate a SENTENCE CONSTRUCTION exercise.
  → Pick a complete sentence from CONTEXT examples. Shuffle its words for the prompt.
  → The prompt must list the shuffled Vedda words in square brackets, each followed by its English meaning.
  → Example prompt: "Arrange these Vedda words into the correct sentence: [kanna (eat), mama (I), batha (rice)]"
  → The answer is the full correctly ordered Vedda sentence taken VERBATIM from CONTEXT.
  → DO NOT invent a sentence — shuffle an existing CONTEXT example sentence.
  → If multiple_choice: all 4 options MUST be full Vedda sentences (same words, different orders).
     - 1 option is the correctly ordered sentence (verbatim from CONTEXT)
     - 3 options use the same words in wrong orders
  → If text_input: the learner types the correctly ordered full sentence (verbatim from CONTEXT).
  → The "answer" and "correct_answer" fields MUST be the verbatim CONTEXT sentence.
  → May use multiple_choice OR text_input.

• spelling_error
  → The learner misspells individual Vedda words.
  → Generate a single-word vocabulary exercise OR a sentence-based exercise — both are fine.
  → Prompt examples:
     - "What is the Vedda word for \\"[English term]\\"?"
     - "Which of the following is the CORRECT spelling of the Vedda word for \\"[English term]\\"?"

  → For text_input:
     - The learner types the word freely, so no extra action needed.
     - answer = the single correctly spelled Vedda word.

  → For multiple_choice (IMPORTANT — spelling-focused options):
     - The prompt must ask the learner to identify the CORRECT spelling.
     - Example prompt: "Which is the correct spelling of the Vedda word for \\"bee\\"?"
     - All 4 options MUST look like plausible spellings of the SAME word:
         * 1 option = the correct spelling (e.g. "potti")
         * 3 options = deliberately misspelled variants of that SAME word
           (e.g. "pothi", "poti", "ppotti") — swap/drop/double letters.
     - Do NOT use completely different Vedda words as wrong options.
     - This directly tests whether the learner knows the correct spelling.
     - correct_answer = the correctly spelled Vedda word.

• other
  → Generate a single-word vocabulary or simple translation exercise.
  → Prompt: "What is the Vedda word for \\"[English term]\\"?" or "Translate: [Vedda word]"
  → May use multiple_choice OR text_input.

CRITICAL RULES:
- For missing_word: MUST use a sentence with 3+ words from CONTEXT. Remove one content word → make it "___".
  answer = the single missing word ONLY (e.g. "kola"). NEVER the full sentence.
  MC options = 4 single Vedda words (1 correct, 3 plausible wrong words from CONTEXT).
- For word_order_error: answer = FULL correctly ordered Vedda sentence (verbatim from CONTEXT).
  MC options = 4 full sentences using the same words in different orders.
- For spelling_error: answer = single correctly spelled Vedda word.
  MC options = 1 correct spelling + 3 misspelled variants of the SAME word (not different words).
- For other: answer = single Vedda word or short phrase.
  MC options = single Vedda words."""

GEN_USER_TEMPLATE = """
CONTEXT (Vedda vocabulary and examples):
{context}

TARGET SKILL TAGS:
{skill_tags}

COMMON LEARNER ERRORS:
{error_types}

FORMAT LOCK — OBEY BEFORE READING ANYTHING ELSE:
The error type(s) for this generation are: {error_types}
- If error type is "spelling_error" → generate a SPELLING exercise. FORBIDDEN to use "___" in prompt.
- If error type is "word_order_error" → generate a WORD ORDER exercise. FORBIDDEN to use "___" in prompt.
- If error type is "other" → generate a VOCABULARY exercise. FORBIDDEN to use "___" in prompt.
- ONLY if error type is "missing_word" → fill-in-the-blank with "___" is allowed.

{error_type_guide}

TASK:
Generate ONE unique Vedda language exercise that DIRECTLY targets the learner's error type(s) above.

CRITICAL — CONTEXT IS THE ONLY SOURCE OF TRUTH:
- Every Vedda word and sentence you use MUST appear in the CONTEXT above
- For sentence-level exercises (missing_word, word_order_error): pick a full example sentence
  from CONTEXT and build the exercise around it — do NOT compose a new sentence
- If CONTEXT lacks enough examples, use the closest available example as-is
- NEVER translate English phrases into Vedda yourself — only use pre-existing CONTEXT examples

IMPORTANT - CREATE VARIETY:
- Each exercise MUST be different from previous ones
- Use different examples from the CONTEXT each time
- Use exercise number {exercise_number} as inspiration for variety

General constraints (apply after error-type rules above):
- Question type: {exercise_type}
- Difficulty: beginner
- Prompt language: English (with Vedda words shown where needed)
- XP = 1
- Points = 1
- Time limit = 30 seconds
- "rest" must be an empty string

{type_specific_instructions}

Return JSON EXACTLY in this format:

{json_template}
"""

GEN_MC_INSTRUCTIONS = """Options constraints:
- Exactly 4 options
- Only ONE option is correct (can be A, B, C, or D - vary the position!)
- Shuffle the correct answer position for variety
- correct_answer and all option "text" values MUST NOT contain a full stop / period (.). Strip trailing punctuation.

Per error type:
- missing_word:
    The prompt shows a Vedda sentence with "___" + COMPLETE English translation in brackets (no ___ in English).
    Options are SINGLE Vedda words that could fill the blank — no full stops.
    1 option = the correct missing word. 3 options = other Vedda words from CONTEXT (plausible but wrong).
    Do NOT use full sentences as options.
- word_order_error:
    ALL 4 options MUST be full Vedda sentences using the SAME words in different orders.
    1 option = correct order. 3 options = wrong word orders.
- spelling_error / other:
    For spelling_error: prompt asks learner to pick the CORRECT spelling.
    1 option = correct Vedda word spelling.
    3 options = misspelled variants of that SAME word (swap/drop/double letters) — NOT different words.
    For other: all option texts must be single Vedda words from CONTEXT.
    1 option = correct word. 3 options = plausible but wrong Vedda words."""

GEN_MC_JSON_TEMPLATE = """{{
  "categoryId": "z0",
  "exerciseNumber": "{exercise_number}",
  "skillTags": [{skill_tags}],
  "question": {{
    "questionNo": "{exercise_number}",
    "type": "multiple_choice",
    "prompt": "...",
    "xp": 1,
    "points": 1,
    "timeLimitSec": 30,
    "rest": "",
    "options": [
      {{ "id": "A", "text": "...", "correct": true/false }},
      {{ "id": "B", "text": "...", "correct": true/false }},
      {{ "id": "C", "text": "...", "correct": true/false }},
      {{ "id": "D", "text": "...", "correct": true/false }}
    ],
    "correctOptions": ["A" or "B" or "C" or "D"],
    "correct_answer": "..."
  }}
}}"""

GEN_TEXT_INPUT_INSTRUCTIONS = """Answer constraints:
- If the exercise targets missing_word:
    prompt = the Vedda sentence with ONE word replaced by "___" + COMPLETE English translation in brackets (no ___ in English)
    answer = the single missing Vedda word ONLY (e.g. "kola") — NOT the full sentence
- If the exercise targets word_order_error: answer = the full correctly ordered Vedda sentence
- If the exercise targets spelling_error or other: answer = a single correct Vedda word or short phrase
- correct_answer and answer fields MUST be identical
- answer and correct_answer MUST NOT contain a full stop / period (.). Strip trailing punctuation.
- Do NOT include options or correctOptions fields"""

GEN_TEXT_INPUT_JSON_TEMPLATE = """{{
  "categoryId": "z0",
  "exerciseNumber": "{exercise_number}",
  "skillTags": [{skill_tags}],
  "question": {{
    "questionNo": "{exercise_number}",
    "type": "text_input",
    "prompt": "...",
    "xp": 1,
    "points": 1,
    "timeLimitSec": 30,
    "rest": "",
    "answer": "...",
    "correct_answer": "..."
  }}
}}"""


# ── Sentence-level error types that must never produce single-word exercises ───
# These match the exact labels output by the mistake classifier model.
SENTENCE_LEVEL_ERROR_TYPES = {"missing_word", "word_order_error"}


