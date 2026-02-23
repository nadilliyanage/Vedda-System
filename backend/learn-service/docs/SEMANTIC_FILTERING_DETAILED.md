# Semantic Filtering & Embeddings - Detailed Technical Explanation

## Table of Contents
1. [Overview](#overview)
2. [What Are Embeddings?](#what-are-embeddings)
3. [How Embeddings Are Generated](#how-embeddings-are-generated)
4. [Vector Space & Similarity](#vector-space--similarity)
5. [Semantic Filtering Process](#semantic-filtering-process)
6. [Complete Example Walkthrough](#complete-example-walkthrough)
7. [Implementation Details](#implementation-details)
8. [Visualizations](#visualizations)

---

## Overview

The Hybrid RAG system uses **semantic filtering** to find the most relevant knowledge documents based on meaning (semantics) rather than just keyword matching. This is powered by **embeddings** - numerical representations of text that capture semantic meaning.

### The Problem with Keyword Matching

```
User Query: "Student confused about question words"
Keyword Match Result: Only finds docs with exact words "question" + "words"
Problem: Misses related docs about "mokadda" vs "koheda" differences
```

### The Solution: Semantic Filtering

```
User Query: "Student confused about question words"
Semantic Match Result: Finds all docs about question formation, regardless of exact words
Bonus: Ranks by relevance based on meaning similarity
```

---

## What Are Embeddings?

### Definition
An **embedding** is a mathematical representation of text as a vector (array) of numbers, where:
- Each number captures some aspect of the text's meaning
- Semantically similar texts have similar embeddings
- The distance between vectors reflects semantic distance

### Visual Example

```
Text: "What is the Vedda word for honey?"
Embedding: [0.0076, 0.0023, 0.0085, 0.0245, -0.0157, ...]
           ↑      ↑      ↑      ↑      ↑
         1536 dimensions total (OpenAI text-embedding-3-small)
```

### Why 1536 Dimensions?

OpenAI's `text-embedding-3-small` model:
- Analyzes text with a deep neural network
- Extracts semantic meaning into 1536 dimensions
- Each dimension captures different aspects:
  - Syntax patterns
  - Semantic meaning
  - Contextual relationships
  - Thematic elements

```
Dimension 1: "Is this about learning?" [0.234]
Dimension 2: "Is this about questions?" [0.891]
Dimension 3: "Is this about Vedda?" [0.765]
Dimension 4: "Is this about verbs?" [0.123]
...
Dimension 1536: [0.456]
```

### Key Property: Similarity Preservation

```
Text A: "What is the Vedda word for honey?"
Embedding A: [0.0076, 0.0023, ...]

Text B: "How do you say honey in Vedda?"
Embedding B: [0.0071, 0.0025, ...]
         ↓
Similarity: 0.98 (Very similar - they mean the same thing!)

---

Text C: "The weather is nice today"
Embedding C: [0.1234, 0.5678, ...]
         ↓
Similarity with A: 0.12 (Very different - unrelated meaning!)
```

---

## How Embeddings Are Generated

### Step-by-Step Process

#### Step 1: Text Preparation
```python
# Original document
knowledge_doc = {
    "content": "In Vedda, 'mokadda' means 'what'",
    "example": "Mokadda karanne? = What are you doing?",
    "skill_tags": ["question_forms", "basic_grammar"],
    "error_types": ["wrong_question_word"]
}

# Prepare text for embedding
prepared_text = prepare_knowledge_text_for_embedding(knowledge_doc)

# Result:
prepared_text = """
In Vedda, 'mokadda' means 'what' | 
Example: Mokadda karanne? = What are you doing? | 
Skills: question_forms, basic_grammar | 
Addresses: wrong_question_word
"""
```

**Why preparation matters:**
- Combines all relevant information
- Ensures context is preserved
- Helps embedding capture full semantic meaning

#### Step 2: Send to OpenAI API
```python
# Call OpenAI embedding API
response = client.embeddings.create(
    model="text-embedding-3-small",
    input=prepared_text,
    encoding_format="float"
)

# OpenAI processes the text through a neural network
# Neural Network Steps (internal to OpenAI):
#   1. Tokenize: Break text into tokens/words
#   2. Embedding Layer: Convert tokens to dense vectors
#   3. Transformer Layers: Learn semantic relationships
#   4. Output: 1536-dimensional embedding vector
```

**What happens inside OpenAI's model:**
```
Input Text: "In Vedda, 'mokadda' means 'what'..."
         ↓
[Tokenization]
tokens = ["In", "Vedda", "'", "mokadda", "'", ...]
         ↓
[Word Embeddings - Initial vectors]
         ↓
[Transformer Attention - Learn relationships]
   - Which words relate to which?
   - What's the semantic meaning?
   - What's the context?
         ↓
[Output - Final Embedding]
vector = [0.0076, 0.0023, 0.0085, ..., 0.456]
         (1536 values)
```

#### Step 3: Store the Embedding
```python
# Store in MongoDB
knowledge_coll.update_one(
    {"_id": doc_id},
    {
        "$set": {
            "embedding": [0.0076, 0.0023, ..., 0.456],  # 1536 numbers
            "embedding_model": "text-embedding-3-small",
            "embedding_generated_at": datetime.utcnow()
        }
    }
)

# Document now has embedding attached
{
    "_id": ObjectId(...),
    "content": "In Vedda, 'mokadda' means 'what'",
    "embedding": [0.0076, 0.0023, ..., 0.456],  # ← New field
    "skill_tags": ["question_forms"],
    ...
}
```

### Code Implementation

```python
# app/ai/embedding_service.py

from openai import OpenAI

_client = OpenAI(api_key=Config.OPENAI_API_KEY)

def generate_embedding(text: str) -> list[float]:
    """Generate embedding for a single text"""
    
    response = _client.embeddings.create(
        model="text-embedding-3-small",
        input=text.strip(),
        encoding_format="float"
    )
    
    # Extract the embedding vector (1536 floats)
    embedding = response.data[0].embedding
    
    return embedding  # List of 1536 floats


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts (more efficient)"""
    
    response = _client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,  # Send all at once
        encoding_format="float"
    )
    
    # Extract embeddings for all texts
    embeddings = [item.embedding for item in response.data]
    
    return embeddings  # List of lists (each is 1536 floats)
```

---

## Vector Space & Similarity

### Understanding Vector Space

Imagine a **semantic space** where:
- Each text is represented as a point
- Nearby points have similar meanings
- Far points have different meanings

```
2D Visualization (simplified - actually 1536D):

                    ↑ Y-axis (Grammar Dimension)
                    |
      "verb forms"  |    ●  "What is doing?"
                    |    |
  "Where going?" ●  |    |  ← Close together = Similar meaning
                    |    ●
                    |
       "Numbers" ●  |────────→ X-axis (Question Dimension)
                    |
                    ● "Today is nice"
                    
         (Far apart = Different meaning)
```

### Real Example in 3D

```
Embedding 1: "What is the Vedda word for honey?"
  Vector: (0.23, 0.89, 0.15, ...)

Embedding 2: "How do you say honey in Vedda?"
  Vector: (0.24, 0.87, 0.16, ...)
  
  → These are CLOSE together
  → Similarity = 0.98 (very similar)

---

Embedding 3: "The weather is nice"
  Vector: (0.01, 0.05, 0.92, ...)
  
  → This is FAR from Embedding 1
  → Similarity = 0.12 (very different)
```

### Cosine Similarity: Measuring Distance

**Formula:**
```
similarity = (A · B) / (||A|| × ||B||)

Where:
  A · B     = Dot product (sum of element-wise multiplication)
  ||A||     = Magnitude of vector A (length)
  ||B||     = Magnitude of vector B (length)
  Result    = Number between -1 and 1 (typically 0 to 1 for embeddings)
```

**Example Calculation:**

```
Vector A: [0.2, 0.8, 0.1]  (Document: "question words in Vedda")
Vector B: [0.21, 0.79, 0.12] (Query: "how to ask questions")

Step 1: Dot Product (A · B)
  = (0.2 × 0.21) + (0.8 × 0.79) + (0.1 × 0.12)
  = 0.042 + 0.632 + 0.012
  = 0.686

Step 2: Magnitude of A (||A||)
  = √(0.2² + 0.8² + 0.1²)
  = √(0.04 + 0.64 + 0.01)
  = √0.69
  = 0.83

Step 3: Magnitude of B (||B||)
  = √(0.21² + 0.79² + 0.12²)
  = √(0.0441 + 0.6241 + 0.0144)
  = √0.6826
  = 0.826

Step 4: Final Similarity
  = 0.686 / (0.83 × 0.826)
  = 0.686 / 0.686
  = 0.999 ← Very similar!
```

### Code Implementation

```python
# app/ai/similarity.py

import numpy as np

def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    
    # Convert to numpy arrays
    a = np.array(vec1)
    b = np.array(vec2)
    
    # Calculate dot product
    dot_product = np.dot(a, b)
    
    # Calculate magnitudes
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    # Calculate cosine similarity
    if norm_a == 0 or norm_b == 0:
        return 0.0
    
    similarity = dot_product / (norm_a * norm_b)
    
    return float(similarity)  # Returns value between -1 and 1


def cosine_similarity_batch(query_vec: list[float], 
                           doc_vecs: list[list[float]]) -> list[float]:
    """Calculate similarity between one query and multiple documents"""
    
    query = np.array(query_vec)
    docs = np.array(doc_vecs)
    
    # Vectorized computation (much faster!)
    dot_products = np.dot(docs, query)  # Dot product with all docs at once
    
    query_norm = np.linalg.norm(query)
    doc_norms = np.linalg.norm(docs, axis=1)
    
    # Element-wise division
    similarities = dot_products / (doc_norms * query_norm)
    
    return similarities.tolist()  # Returns list of similarities


# Usage Example:
query_embedding = generate_embedding("question words in Vedda")
doc_embeddings = [doc["embedding"] for doc in knowledge_docs]

similarities = cosine_similarity_batch(query_embedding, doc_embeddings)
# Result: [0.98, 0.45, 0.12, 0.87, ...]
#         Each value is similarity to the query
```

---

## Semantic Filtering Process

### Complete 5-Step Pipeline

#### Step 1: Symbolic Filtering

```python
# Filter documents by traditional criteria (FAST)

query = {
    "skill_tags": {"$in": ["question_forms", "basic_grammar"]},
    "difficulty": "beginner"
}

candidates = knowledge_coll.find(query)
# Result: 4 documents match the symbolic criteria
```

**Why do this first?**
- Eliminates irrelevant documents early
- Much faster than semantic search
- Reduces compute cost

**Example:**
```
All documents: 55
After symbolic filter (skill + difficulty): 4 candidates
Now we proceed to expensive semantic search on only 4 docs
```

#### Step 2: Generate Query Embedding

```python
# Convert user's query into embedding (costs API call)

student_mistake = """
Student answered 'Koheda karanne?' instead of 'Mokadda karanne?'
They confused the question words.
"""

query_embedding = generate_embedding(student_mistake)
# Result: [0.0076, 0.0023, 0.0085, ..., 0.456]  (1536 values)
```

#### Step 3: Compute Semantic Similarities

```python
# Calculate similarity between query and each candidate document

similarities = cosine_similarity_batch(
    query_embedding,
    [doc["embedding"] for doc in candidates]
)

# Results:
# Document 1 (about "mokadda"): 0.87 ← Very similar!
# Document 2 (about "koheda"): 0.84 ← Very similar!
# Document 3 (about question order): 0.72 ← Somewhat similar
# Document 4 (about greetings): 0.23 ← Not very similar
```

#### Step 4: Apply Re-ranking Boosts

```python
# Add boost scores based on multiple factors

for doc, similarity in zip(candidates, similarities):
    
    # Base score: Semantic similarity (weighted)
    score = similarity * 5.0
    
    # Boost 1: Error type match
    if "wrong_question_word" in doc.get("error_types", []):
        score += 3.0
    
    # Boost 2: Weak skill match
    if "question_forms" in doc.get("skill_tags", []):
        score += 2.0
    
    # Boost 3: Document priority
    score += doc.get("priority", 0)
    
    # Final score combines all factors
    doc["final_score"] = score


# Scores breakdown:
# Doc 1: (0.87 * 5.0) + 3.0 + 2.0 + 2 = 10.35
# Doc 2: (0.84 * 5.0) + 3.0 + 2.0 + 2 = 10.20
# Doc 3: (0.72 * 5.0) + 3.0 + 0 + 1 = 7.60
# Doc 4: (0.23 * 5.0) + 0 + 0 + 0 = 1.15
```

**How boosts work:**
```
Semantic score (0.87 * 5) = 4.35
                 ↓
        This is the foundation
                 ↓
        But it's not enough!
                 ↓
        Add domain-specific boosts:
        
  Error type match? +3.0
  ✓ Yes, doc addresses "wrong_question_word"
  
  Learner's weak skill? +2.0
  ✓ Yes, learner is weak at "question_forms"
  
  High quality doc? +priority
  ✓ Yes, priority = 2
  
                 ↓
        Final score = 4.35 + 3.0 + 2.0 + 2.0 = 11.35
```

#### Step 5: Return Top-k Documents

```python
# Sort by score and return top 5

ranked_docs = sorted(candidates, 
                    key=lambda d: d["final_score"], 
                    reverse=True)

top_5_docs = ranked_docs[:5]

# Results (from best to worst):
# 1. "mokadda means 'what'" (score: 10.35)
# 2. "koheda means 'where'" (score: 10.20)
# 3. "question word order" (score: 7.60)
# 4. ...
# 5. ...
```

---

## Complete Example Walkthrough

### Real Scenario: Student Mistake

```
Student Answer: "Koheda karanne?"
Correct Answer: "Mokadda karanne?"
Context: Learning question words in Vedda
```

### Step 1: Extract Student Context

```python
user_stats = {
    "user_id": "691afa88b01da8476e135ba7",
    "skill_stats": {
        "question_forms": {
            "correct": 2,
            "wrong": 5  # ← Weak area!
        },
        "verb_conjugation": {
            "correct": 8,
            "wrong": 2
        }
    },
    "error_stats": {
        "wrong_question_word": 3,  # ← Common error
        "word_order_error": 1
    }
}

weak_skills = ["question_forms"]
top_errors = ["wrong_question_word"]
```

### Step 2: Run Hybrid Retrieval

```python
retrieved_docs = hybrid_retrieve(
    db=db,
    query_text="Student confused 'koheda' and 'mokadda' in question",
    skill_tags=["question_forms", "basic_grammar"],
    error_types=["wrong_question_word"],
    difficulty="beginner",
    weak_skills=["question_forms"],
    limit=5
)
```

### Step 3: Internal Processing

**Symbolic Filter:**
```
Total knowledge docs: 55
Symbolic filter: skill_tags IN ["question_forms", "basic_grammar"]
Result: 4 candidates
```

**Semantic Search:**
```
Query Embedding: [-0.012, 0.234, ..., 0.156]

Doc 1 embedding similarity: 0.87
Doc 2 embedding similarity: 0.84
Doc 3 embedding similarity: 0.72
Doc 4 embedding similarity: 0.23
```

**Re-ranking:**
```
Doc 1 "mokadda (what)":
  Similarity: 0.87
  Score: 0.87*5 + 3 (error match) + 2 (weak skill) + 2 (priority) = 10.35
  
Doc 2 "koheda (where)":
  Similarity: 0.84
  Score: 0.84*5 + 3 (error match) + 2 (weak skill) + 1 (priority) = 10.20
  
Doc 3 "Question word order":
  Similarity: 0.72
  Score: 0.72*5 + 3 (error match) + 2 (weak skill) + 0 (priority) = 8.60
  
Doc 4 "Greetings":
  Similarity: 0.23
  Score: 0.23*5 + 0 + 0 + 0 = 1.15
```

### Step 4: Return Top Documents

```python
# Results (returned to LLM for feedback generation)
[
    {
        "content": "In Vedda, 'mokadda' means 'what'",
        "example": "Mokadda karanne? = What are you doing?",
        "error_types": ["wrong_question_word"],
        "final_score": 10.35
    },
    {
        "content": "In Vedda, 'koheda' means 'where'",
        "example": "Koheda yanava? = Where are you going?",
        "error_types": ["wrong_question_word"],
        "final_score": 10.20
    },
    {
        "content": "Question words in Vedda always come at...",
        "example": "Kauda enne? = Who is coming?",
        "error_types": ["word_order_error"],
        "final_score": 8.60
    }
]
```

### Step 5: Build Context for LLM

```
=== RELEVANT GRAMMAR RULES ===

• In Vedda, 'mokadda' means 'what' and is used to ask about things
  Example: Mokadda karanne? = What are you doing?

• In Vedda, 'koheda' means 'where' and is used to ask about locations
  Example: Koheda yanava? = Where are you going?

• Question words in Vedda always come at the beginning of the sentence
  Example: Kauda enne? = Who is coming?

Use this knowledge to explain why the student's answer is incorrect...
```

### Step 6: LLM Generates Feedback

```
LLM Input:
  - Student answer: "Koheda karanne?"
  - Correct answer: "Mokadda karanne?"
  - RAG Context: (above)

LLM Output:
{
  "is_correct": false,
  "corrected_answer": "Mokadda karanne?",
  "explanation": "You used 'koheda' (where) instead of 'mokadda' (what). 
                 'Mokadda' asks about things or actions, while 'koheda' 
                 asks about locations. In this sentence, you're asking 
                 what the person is doing, so 'mokadda' is correct.",
  "error_type": "wrong_question_word"
}
```

---

## Implementation Details

### File Structure

```
app/ai/
├── embedding_service.py    # Generate embeddings
├── similarity.py           # Compute similarities
├── rag_hybrid.py          # Orchestrate retrieval
├── context_builder.py     # Format for LLM
└── effectiveness_tracker.py # Track what works
```

### Embedding Generation Flow

```python
# 1. Populate embeddings for all knowledge docs
python populate_embeddings.py --populate

# Output:
# Found 55 documents without embeddings
# Processing batch 1 (1-7 of 7)
# ✓ Updated doc1 - Skills: ['question_forms'] - In Vedda...
# ✓ Updated doc2 - Skills: ['greetings'] - Basic greetings...
# ...
# SUMMARY:
#   Total documents: 55
#   Successfully updated: 55
#   Failed: 0
```

### Storage in MongoDB

```javascript
db.vedda_knowledge.findOne({"_id": ObjectId("...")})

{
  "_id": ObjectId("699995ea96630e02a5de5981"),
  "type": "grammar_rule",
  "skill_tags": ["question_forms", "basic_grammar"],
  "error_types": ["wrong_question_word"],
  "difficulty": "beginner",
  "exercise_types": ["multiple_choice", "fill_blank"],
  "content": "In Vedda, 'mokadda' means 'what'...",
  "example": "Mokadda karanne? = What are you doing?",
  
  // ← NEW FIELDS (added by embedding service)
  "embedding": [
    0.0076, 0.0023, 0.0085, 0.0245, -0.0157, ..., 0.456
    // 1536 values total
  ],
  "embedding_model": "text-embedding-3-small",
  "embedding_generated_at": ISODate("2026-02-21T11:18:46.599Z"),
  
  "priority": 2,
  "effectiveness": {
    "times_used": 0,
    "helped_correct": 0,
    "last_used": null
  }
}
```

### Query Execution

```python
# User submits answer
user_answer = "Koheda karanne?"

# System prepares context
context = {
    "query_text": "Student said 'Koheda' instead of 'Mokadda'",
    "skill_tags": ["question_forms"],
    "error_types": ["wrong_question_word"],
    "weak_skills": ["question_forms"],
    "difficulty": "beginner"
}

# Retrieval happens
retrieved_docs = hybrid_retrieve(
    db=db,
    query_text=context["query_text"],
    skill_tags=context["skill_tags"],
    error_types=context["error_types"],
    weak_skills=context["weak_skills"],
    difficulty=context["difficulty"],
    limit=5
)

# Returns 3 documents with scores:
# [Doc1(10.35), Doc2(10.20), Doc3(8.60)]

# Use for feedback
feedback_context = build_context_for_feedback(
    docs=retrieved_docs,
    student_answer=user_answer,
    correct_answer="Mokadda karanne?",
    error_type="wrong_question_word"
)

# Send to LLM
feedback = llm(feedback_context)  # Returns structured feedback
```

---

## Visualizations

### Embedding Space Visualization

```
3D Semantic Space (simplified from 1536D):

                Z-axis
                  ↑
                  |     ● "Vedda language"
                  |    /|
                  |   / |
       ● "Numbers"|  /  |
                  | /   |
                  |/    |
    ─────────────┼──────┼─────→ X-axis (Question Dimension)
                /|      |
               / |      |
              /  |      | ● "What is honey?"
             /   |      |
            /    |      |
           /     |      ● "Where is person?"
          ↙      |
       Y-axis    |


Semantic Relationships:
  "What is honey?" ↔ "How say honey in Vedda?" = CLOSE (0.98 similarity)
  "What is honey?" ↔ "Numbers" = FAR (0.15 similarity)
  "Where is person?" ↔ "What is honey?" = MEDIUM (0.65 similarity)
```

### Similarity Matrix

```
                Doc1    Doc2    Doc3    Doc4
                (mokadda) (koheda) (order) (greet)
Query     0.87    0.84    0.72    0.23
(confusion)

Heatmap:
  High  ██████  ██████  ███░░░  ░░░░░░
       (0.87)  (0.84)  (0.72)  (0.23)
  Low
  
Interpretation:
  - Query is VERY similar to Doc1 & Doc2 (both about question words)
  - Query is SOMEWHAT similar to Doc3 (about word order)
  - Query is NOT similar to Doc4 (about greetings)
```

### Boost Score Breakdown

```
Document: "mokadda means 'what'"

Base Score:
  Semantic Similarity: 0.87 × 5 = 4.35
  ▓▓▓▓ (4.35)

Error Type Match: +3.0
  ▓▓▓ (3.0)

Weak Skill Match: +2.0
  ▓▓ (2.0)

Priority: +2.0
  ▓▓ (2.0)

────────────────
TOTAL: 11.35
████████████████████ (11.35)
```

---

## Summary

### Key Concepts

| Concept | What It Is | Why It Matters |
|---------|-----------|----------------|
| **Embedding** | Text as numbers (vector) | Captures semantic meaning |
| **1536 Dimensions** | Neural network output size | Rich semantic representation |
| **Cosine Similarity** | Angle between vectors | Measures semantic closeness |
| **Symbolic Filter** | Keyword/field matching | Fast, eliminates irrelevant docs |
| **Semantic Filter** | Embedding-based search | Finds meaning-similar docs |
| **Boost Factors** | Domain-specific adjustments | Prioritizes relevant results |

### Processing Flow

```
Text Input
    ↓
Preparation (add context)
    ↓
OpenAI API (convert to embedding)
    ↓
1536-dim Vector (stored in DB)
    ↓
Query Time:
    ↓
Generate Query Embedding
    ↓
Calculate Similarities (cosine)
    ↓
Apply Domain Boosts
    ↓
Rank & Return Top-k
    ↓
Build Context for LLM
    ↓
Generate Feedback/Exercise
```

### Performance Characteristics

```
Operation              Time      Cost
────────────────────────────────────────
Generate 1 embedding   ~100ms    $0.000001
Generate 1536 embedding ~100ms   $0.000001
Cosine similarity      <1ms      Free (local)
Batch similarity (55)  ~5ms      Free (local)
Full retrieval pipeline ~500ms    $0.000001
────────────────────────────────────────
```

---

**Document Version:** 1.0  
**Date:** February 21, 2026  
**System:** Vedda Language Learning Platform - Hybrid RAG

