# Semantic Filtering - Quick Visual Guide

## One-Page Overview

### What is Semantic Filtering?

Instead of just keyword matching, semantic filtering finds documents based on **meaning** using embeddings (vectors of numbers).

```
❌ KEYWORD MATCHING:
  Query: "question words"
  Found: Only docs with exact words "question" + "words"
  Problem: Misses relevant docs that mean the same thing

✅ SEMANTIC FILTERING:
  Query: "how to ask what in Vedda"
  Found: All docs about question formation, mokadda, koheda, etc.
  Benefit: Finds by meaning, not just keywords
```

---

## 5-Minute Understanding

### 1. What is an Embedding?

**Simple Explanation:**
An embedding is a set of numbers that represent the meaning of text.

```
Text: "What is the Vedda word for honey?"

Embedding:
[0.0076, 0.0023, 0.0085, 0.0245, -0.0157, ...]
          ↑ 1536 numbers total
          
Each number captures part of the meaning:
- Num 1: "Is this about language?" (0.0076)
- Num 2: "Is this about questions?" (0.0023)
- Num 3: "Is this about Vedda?" (0.0085)
...
- Num 1536: (...) = 0.456
```

**Why 1536?** OpenAI's neural network uses 1536 dimensions to capture rich semantic meaning.

---

### 2. How Are Embeddings Generated?

```
Step 1: Take Knowledge Document
┌─────────────────────────────────────┐
│ Content: "mokadda" means "what"     │
│ Example: "Mokadda karanne?"         │
│ Skills: ["question_forms"]          │
└─────────────────────────────────────┘

        ↓ Preparation (combine all info)

Step 2: Send to OpenAI API
┌─────────────────────────────────────┐
│ "mokadda means what | Example:      │
│  Mokadda karanne? | Skills:         │
│  question_forms"                    │
└─────────────────────────────────────┘

        ↓ Neural Network Processing

Step 3: Get Back Embedding
┌─────────────────────────────────────┐
│ [0.0076, 0.0023, ..., 0.456]       │
│ (1536 numbers representing meaning) │
└─────────────────────────────────────┘

        ↓ Store in Database

Step 4: Save to MongoDB
┌─────────────────────────────────────┐
│ {                                   │
│   "_id": ObjectId(...),             │
│   "content": "mokadda means what",  │
│   "embedding": [0.0076, 0.0023...] │
│ }                                   │
└─────────────────────────────────────┘
```

---

### 3. How is Similarity Calculated?

**Cosine Similarity = How similar are two meaning-vectors?**

```
Document 1: "What is Vedda word for honey?"
Embedding:  [0.20, 0.85, 0.15]

Document 2: "How to say honey in Vedda?"
Embedding:  [0.21, 0.84, 0.16]

        ↓ Calculate angle between vectors

Cosine Similarity = 0.98 ✓✓✓ VERY SIMILAR!

---

Document 3: "The weather is nice"
Embedding:  [0.01, 0.05, 0.92]

        ↓ Calculate angle between vectors

Cosine Similarity = 0.12 ✗ NOT SIMILAR
```

**Visual:**
```
     Vector A          Vector B          Vector C
     (similar)         (different)
       ↗                  ↗                  ↓
      /                  /                  |
     /                  /                   |
    /                  /                    |
   ↗ Very close!      ↗ Far apart!         | Very different!

Similarity = 0.98      Similarity = 0.12   Similarity = 0.05
(Close vectors)        (Far vectors)       (Opposite vectors)
```

---

### 4. How Does Filtering Work?

```
STEP 1: SYMBOLIC FILTER (Fast)
┌──────────────────────────────────┐
│ All 55 knowledge docs            │
│ Filter: skill_tags = question_*  │
│ Filter: difficulty = beginner    │
└──────────────────────────────────┘
         ↓ Returns 4 candidates

STEP 2: SEMANTIC SEARCH (Accurate)
┌──────────────────────────────────┐
│ Query: "Student confused about"  │
│        "question words"           │
│                                  │
│ Generate query embedding         │
│ Compare to 4 docs' embeddings    │
│ Get similarity scores:           │
│ Doc1: 0.87 ✓✓✓✓✓               │
│ Doc2: 0.84 ✓✓✓✓                │
│ Doc3: 0.72 ✓✓✓                 │
│ Doc4: 0.23 ✓                    │
└──────────────────────────────────┘
         ↓ Returns ranked docs

STEP 3: BOOST FACTORS (Domain-specific)
┌──────────────────────────────────┐
│ Doc1 Score:                      │
│ • Similarity: 0.87 × 5 = 4.35   │
│ • Error match: +3.0              │
│ • Weak skill match: +2.0         │
│ • Priority: +2.0                 │
│ = TOTAL: 11.35 🏆 #1             │
│                                  │
│ Doc2 Score:                      │
│ • Similarity: 0.84 × 5 = 4.20   │
│ • Error match: +3.0              │
│ • Weak skill match: +2.0         │
│ • Priority: +1.0                 │
│ = TOTAL: 10.20 🥈 #2             │
│                                  │
│ Doc3 Score:                      │
│ • Similarity: 0.72 × 5 = 3.60   │
│ • Error match: +3.0              │
│ • Weak skill match: +0.0         │
│ • Priority: +0.0                 │
│ = TOTAL: 6.60 🥉 #3              │
│                                  │
│ Doc4 Score:                      │
│ • Similarity: 0.23 × 5 = 1.15   │
│ • Error match: +0.0              │
│ • = TOTAL: 1.15 ❌ Not relevant   │
└──────────────────────────────────┘
         ↓ Returns Top-3 Docs

STEP 4: BUILD CONTEXT
┌──────────────────────────────────┐
│ === RELEVANT GRAMMAR RULES ===   │
│                                  │
│ • "mokadda" means "what"         │
│   Example: Mokadda karanne?      │
│                                  │
│ • "koheda" means "where"         │
│   Example: Koheda yanava?        │
│                                  │
│ • Question word order rule       │
│   Example: Kauda enne?           │
└──────────────────────────────────┘
         ↓ Pass to LLM

STEP 5: GENERATE FEEDBACK
┌──────────────────────────────────┐
│ Student said: "Koheda karanne?"  │
│ Correct: "Mokadda karanne?"      │
│                                  │
│ Feedback: "You used 'koheda'     │
│ (where) instead of 'mokadda'     │
│ (what). 'Mokadda' asks about     │
│ things or actions..."            │
└──────────────────────────────────┘
```

---

## Real Numbers Example

### Complete Flow

```
USER INTERACTION:
  Student: "What is the Vedda word for honey?"
  Student Answer: "pinida"
  Correct Answer: "piniya"

SYSTEM PROCESSING:

1️⃣ Extract Context
   Weak Skills: ["vocabulary"]
   Common Errors: ["wrong_vocabulary"]

2️⃣ Symbolic Filter
   Query knowledge for skill="vocabulary"
   Found: 8 documents

3️⃣ Generate Query Embedding
   Query: "honey vs pinida error in vocabulary"
   Embedding: [-0.012, 0.234, ..., 0.156] (1536 numbers)

4️⃣ Calculate Similarities
   Doc1 (piniya=honey): 0.92 ★★★★★
   Doc2 (numbers): 0.45 ★★
   Doc3 (colors): 0.38 ★★
   Doc4 (greetings): 0.15 ★
   Doc5 (actions): 0.28 ★
   Doc6 (body parts): 0.51 ★★★
   Doc7 (family): 0.33 ★
   Doc8 (animals): 0.67 ★★★★

5️⃣ Apply Boosts
   Doc1:
     Similarity: 0.92 × 5 = 4.60
     + Error match: 3.0
     + Weak skill: 2.0
     = TOTAL: 9.60 🏆

   Doc8 (animals):
     Similarity: 0.67 × 5 = 3.35
     + Error match: 0.0
     + Weak skill: 0.0
     = TOTAL: 3.35

6️⃣ Top-3 Results
   ✅ Doc1: "piniya (honey)" - Score 9.60
   ✅ Doc6: "body parts" - Score 5.51
   ✅ Doc8: "animals" - Score 3.35

7️⃣ Generate Feedback
   "Good effort! The Vedda word for
   honey is 'piniya' not 'pinida'.
   Remember the double 'i' ending."
```

---

## Key Formulas

### Cosine Similarity Formula

```
       A · B
sim = ─────────
      ||A|| ||B||

Where:
  A · B = sum of (A[i] × B[i]) for all i
  ||A|| = sqrt(sum of A[i]²)
  ||B|| = sqrt(sum of B[i]²)

Result: Number between 0 and 1
  1.0 = Identical meaning
  0.5 = Somewhat similar
  0.0 = Completely different
```

### Boost Score Formula

```
final_score = (similarity × 5) + boost_factors

Where boost_factors include:
  - Error type match: +3.0
  - Exercise type match: +2.0
  - Weak skill match: +2.0
  - Document priority: +value
  - Effectiveness rate: +help_rate×1.5
```

---

## Why This Matters

### Traditional Keyword Search
```
Query: "what question"
Match: Docs containing "what" AND "question"
Problem: Misses "mokadda" or "how to ask"
Result: Limited, rigid
```

### Semantic Search (Our System)
```
Query: "what question"
Match: Docs about asking questions, mokadda, koheda, etc.
Benefit: Understands meaning, finds related concepts
Result: Rich, flexible, learner-focused
```

---

## Implementation Summary

| Step | Input | Process | Output |
|------|-------|---------|--------|
| 1 | Text | Preparation | Combined text |
| 2 | Combined text | OpenAI API | Embedding (1536 numbers) |
| 3 | Embedding | Store | Document in DB |
| 4 | User query | Generate embedding | Query embedding |
| 5 | Query + Docs | Cosine similarity | Similarity scores |
| 6 | Similarity | Apply boosts | Final scores |
| 7 | Scores | Sort & filter | Top-k docs |
| 8 | Docs | Format | Context string |
| 9 | Context | LLM | Feedback |

---

## Quick Setup

```bash
# 1. Generate embeddings for all knowledge docs
python populate_embeddings.py --populate

# 2. Verify 100% coverage
python populate_embeddings.py --verify

# 3. Test the system
python test_hybrid_rag.py --test 4  # Test hybrid retrieval

# 4. Monitor performance
curl http://localhost:5006/api/learn/admin/rag/system-stats
```

---

**For detailed technical explanation, see:** `SEMANTIC_FILTERING_DETAILED.md`

---

**Document Version:** 1.0  
**Date:** February 21, 2026  
**System:** Vedda Language Learning Platform

