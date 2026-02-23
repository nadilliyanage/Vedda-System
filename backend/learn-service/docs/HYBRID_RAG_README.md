# Advanced Hybrid RAG System for Vedda Language Learning

## Overview

This is a production-ready hybrid Retrieval-Augmented Generation (RAG) system that combines:
- **Symbolic filtering** (skill tags, difficulty levels)
- **Semantic search** (OpenAI embeddings + cosine similarity)
- **Intelligent re-ranking** (error type matching, personalization)
- **Learning loop** (effectiveness tracking and continuous improvement)

## Architecture Components

### 1. Knowledge Base Schema (`vadda_knowledge` collection)

```json
{
  "_id": ObjectId,
  "type": "grammar_rule",
  "skill_tags": ["question_forms", "basic_grammar"],
  "error_types": ["wrong_question_word", "word_order_error"],
  "difficulty": "beginner",
  "exercise_types": ["multiple_choice", "fill_blank"],
  "content": "Grammar rule explanation",
  "example": "Example sentence",
  "examples": [
    {"sentence": "...", "meaning": "..."}
  ],
  "embedding": [1536 floats],
  "embedding_model": "text-embedding-3-small",
  "embedding_generated_at": ISODate,
  "priority": 2,
  "effectiveness": {
    "times_used": 150,
    "helped_correct": 120,
    "last_used": ISODate
  }
}
```

### 2. Core Modules

#### `app/ai/embedding_service.py`
- Generates embeddings using OpenAI `text-embedding-3-small`
- Functions:
  - `generate_embedding(text)` - Single text embedding
  - `generate_embeddings_batch(texts)` - Batch processing
  - `prepare_knowledge_text_for_embedding(doc)` - Text preparation

#### `app/ai/similarity.py`
- Implements similarity metrics
- Functions:
  - `cosine_similarity(vec1, vec2)` - Cosine similarity
  - `cosine_similarity_batch(query, docs)` - Batch similarity
  - `euclidean_distance(vec1, vec2)` - Distance metric

#### `app/ai/rag_hybrid.py`
- Advanced hybrid retrieval engine
- Main function: `hybrid_retrieve(db, query_text, skill_tags, error_types, ...)`
- Pipeline:
  1. **Symbolic filtering** - Filter by skills and difficulty
  2. **Semantic scoring** - Compute embedding similarities
  3. **Re-ranking** - Apply boost factors:
     - +3 for error type match
     - +2 for exercise type match
     - +2 for weak skill match
     - +priority value
     - +similarity × 5
  4. **Sort and return** top-k documents

#### `app/ai/context_builder.py`
- Constructs RAG context from retrieved documents
- Functions:
  - `build_context_from_docs(docs)` - General context
  - `build_context_for_feedback(docs, ...)` - Feedback-specific
  - `build_context_for_exercise_generation(docs, ...)` - Exercise generation
  - `build_compact_context(docs)` - Short format

#### `app/ai/effectiveness_tracker.py`
- Implements learning loop
- Functions:
  - `update_knowledge_effectiveness(db, knowledge_ids, helped)` - Update metrics
  - `track_knowledge_usage(db, ...)` - Detailed tracking
  - `get_most_effective_knowledge(db)` - Analytics
  - `get_least_effective_knowledge(db)` - Find weak content

#### `app/ai/rag_evaluation.py`
- Performance metrics and evaluation
- Functions:
  - `compute_retrieval_match_rate(db)` - Retrieval precision
  - `compute_error_reduction_rate(db)` - Learning progress
  - `compute_skill_improvement_rate(db)` - Skill gains
  - `generate_rag_performance_report(db)` - Comprehensive report

### 3. Integration

#### Updated `app/ai/service.py`
- `get_feedback_with_rag()` now uses hybrid retrieval
- `generate_exercise_with_rag()` now uses hybrid retrieval
- Both functions:
  - Accept `user_id` for personalization
  - Return `_retrieved_knowledge_ids` for tracking
  - Use specialized context builders

#### Updated `app/routes/ai_routes.py`
- `/submit-answer` endpoint now:
  - Passes `user_id` to RAG functions
  - Tracks knowledge effectiveness
  - Updates usage statistics

#### New `app/routes/rag_admin_routes.py`
Admin endpoints:
- `GET /admin/rag/performance-report` - Full system report
- `GET /admin/rag/retrieval-metrics` - Retrieval stats
- `GET /admin/rag/error-reduction` - Error analysis
- `GET /admin/rag/skill-improvement` - Skill progress
- `GET /admin/rag/knowledge/most-effective` - Top knowledge
- `GET /admin/rag/knowledge/least-effective` - Weak knowledge
- `GET /admin/rag/embedding-coverage` - Embedding status
- `GET /admin/rag/system-stats` - Overall statistics

## Setup and Deployment

### 1. Install Dependencies

```bash
cd backend/learn-service
pip install -r requirements.txt
```

### 2. Migrate Knowledge Base Schema

```bash
# Add required fields to existing documents
python migrate_knowledge_schema.py --migrate

# Verify migration
python migrate_knowledge_schema.py --verify

# Create sample document
python migrate_knowledge_schema.py --sample
```

### 3. Generate Embeddings

```bash
# Populate embeddings for all documents
python populate_embeddings.py --populate

# Verify embedding coverage
python populate_embeddings.py --verify

# Re-generate all embeddings (if needed)
python populate_embeddings.py --update-all
```

### 4. Start Service

```bash
python run.py
```

## Usage Examples

### Example 1: Submit Answer with RAG Feedback

```python
# POST /api/learn/ai/submit-answer
{
  "user_id": "user123",
  "exercise_id": "exercise456",
  "user_answer": "Mokada karanne?"
}

# Response includes:
{
  "feedback": {
    "is_correct": false,
    "explanation": "...",
    "hint": "..."
  },
  "usage": {
    "total_tokens": 150
  }
}
```

### Example 2: Generate Personalized Exercise

```python
# POST /api/learn/ai/generate-personalized-exercise
{
  "user_id": "user123"
}

# Response:
{
  "exercise": {
    "categoryId": "z0",
    "question": {
      "type": "multiple_choice",
      "prompt": "How do you say 'What are you doing?' in Vedda?",
      "options": ["Mokadda karanne?", "Koheda yanava?", "..."],
      "correct_answer": "Mokadda karanne?"
    }
  },
  "token_usage": {...}
}
```

### Example 3: Get RAG Performance Report

```python
# GET /api/learn/admin/rag/performance-report?days=30

# Response:
{
  "report_generated_at": "2026-02-21T10:00:00Z",
  "period_days": 30,
  "retrieval_metrics": {
    "match_rate": 0.847,
    "helpful_retrievals": 254,
    "total_retrievals": 300
  },
  "error_reduction": {
    "first_half_error_rate": 0.35,
    "second_half_error_rate": 0.22,
    "reduction_percentage": 37.1
  },
  "top_effective_knowledge": [
    {
      "content": "Question words in Vedda...",
      "help_rate": 0.92,
      "times_used": 45
    }
  ],
  "system_stats": {
    "total_knowledge_docs": 150,
    "docs_with_embeddings": 150,
    "docs_used_at_least_once": 98
  }
}
```

## Exercise Generation Variety

To ensure each call to `/api/learn/ai/generate-personalized-exercise` produces a new exercise, the generator now:
- Varies `exercise_number` per request (timestamp-based)
- Rotates skill and error selections for the user
- Randomizes the query phrasing and sampled knowledge context
- Uses a higher temperature for more diverse LLM outputs

This does not change the Hybrid RAG architecture; it only adds controlled variety in exercise generation.

## How It Works

### Retrieval Flow

1. **User submits answer** → System detects error type
2. **Extract user context**:
   - Weak skills from `user_stats`
   - Common error types from `error_stats`
3. **Build semantic query**:
   ```
   "Student answered 'X' instead of 'Y'. [context]"
   ```
4. **Hybrid retrieval**:
   - Filter by skill tags and difficulty
   - Generate query embedding
   - Compute similarities
   - Apply boost factors:
     - Error type match: +3
     - Exercise type match: +2
     - Weak skill match: +2
     - Document priority: +priority
     - Semantic similarity: +sim×5
5. **Build context** from top-k documents
6. **Generate feedback** using LLM with context
7. **Track effectiveness** in background

### Learning Loop

1. Knowledge used → `times_used++`
2. If student improves → `helped_correct++`
3. Calculate `help_rate = helped_correct / times_used`
4. Future retrievals boost high help_rate docs
5. Low help_rate docs flagged for improvement

## Evaluation Metrics

### Retrieval Match Rate
Percentage of retrievals that actually helped the learner.

**Formula**: `helpful_retrievals / total_retrievals`

### Error Reduction Rate
How much learner's error rate decreased over time.

**Formula**: `(early_error_rate - late_error_rate) / early_error_rate × 100`

### Skill Improvement Rate
How much accuracy improved for specific skills.

**Formula**: `(late_accuracy - early_accuracy) / early_accuracy × 100`

## Performance Optimization

### Indexing (MongoDB)

```javascript
// Create indexes for optimal retrieval
db.vedda_knowledge.createIndex({ "skill_tags": 1 })
db.vedda_knowledge.createIndex({ "difficulty": 1 })
db.vedda_knowledge.createIndex({ "error_types": 1 })
db.vedda_knowledge.createIndex({ "effectiveness.times_used": -1 })
db.vedda_knowledge.createIndex({ "embedding": 1 })

// For user stats
db.user_stats.createIndex({ "user_id": 1 })
db.user_attempts.createIndex({ "user_id": 1, "timestamp": -1 })
db.knowledge_usage.createIndex({ "timestamp": -1 })
```

### Caching Strategy

```python
# Cache embeddings (in production)
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_embedding(text):
    return generate_embedding(text)
```

### Batch Processing

Use `generate_embeddings_batch()` for multiple texts to reduce API calls.

## Monitoring and Maintenance

### Daily Tasks
1. Check embedding coverage: `python populate_embeddings.py --verify`
2. Monitor retrieval metrics: `GET /admin/rag/retrieval-metrics`

### Weekly Tasks
1. Review performance report: `GET /admin/rag/performance-report?days=7`
2. Identify weak knowledge: `GET /admin/rag/knowledge/least-effective`
3. Update low-performing documents

### Monthly Tasks
1. Analyze skill improvement trends
2. Re-train mistake classifier with new data
3. Adjust boost factors based on metrics

## Troubleshooting

### Issue: Low retrieval match rate

**Solution**: 
- Review boost factor weights in `rag_hybrid.py`
- Check if error types are correctly classified
- Verify embedding quality

### Issue: Documents without embeddings

**Solution**:
```bash
python populate_embeddings.py --populate
```

### Issue: Poor knowledge effectiveness

**Solution**:
- Use `GET /admin/rag/knowledge/least-effective` to identify
- Rewrite low-performing knowledge content
- Reset effectiveness: modify `effectiveness_tracker.py`

## API Reference

### RAG Functions

```python
# Hybrid retrieval
from app.ai.rag_hybrid import hybrid_retrieve

docs = hybrid_retrieve(
    db=db,
    query_text="User's mistake context",
    skill_tags=["question_forms"],
    error_types=["wrong_question_word"],
    difficulty="beginner",
    weak_skills=["grammar"],
    limit=5
)

# Generate embedding
from app.ai.embedding_service import generate_embedding

embedding = generate_embedding("Text to embed")

# Compute similarity
from app.ai.similarity import cosine_similarity

score = cosine_similarity(vec1, vec2)

# Track effectiveness
from app.ai.effectiveness_tracker import update_knowledge_effectiveness

update_knowledge_effectiveness(
    db=db,
    knowledge_ids=["id1", "id2"],
    helped=True
)
```

## Future Enhancements

1. **Vector Database**: Migrate to Pinecone/Weaviate for faster semantic search
2. **Fine-tuning**: Fine-tune embedding model on Vedda-specific data
3. **Multi-modal**: Add image/audio embeddings for richer context
4. **A/B Testing**: Compare different retrieval strategies
5. **Real-time Analytics**: Dashboard for live RAG performance

## License

Part of the Vedda Language Learning Platform - Final Year Project 2026

