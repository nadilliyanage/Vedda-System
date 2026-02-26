# Hybrid RAG Quick Reference Guide

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Setup system
python setup_hybrid_rag.py

# 3. Migrate schema
python migrate_knowledge_schema.py --migrate

# 4. Generate embeddings
python populate_embeddings.py --populate

# 5. Run tests
python test_hybrid_rag.py --all

# 6. Start service
python run.py
```

## 📁 Files Created

### Core Modules
- `app/ai/embedding_service.py` - OpenAI embedding generation
- `app/ai/similarity.py` - Cosine similarity calculations
- `app/ai/rag_hybrid.py` - Hybrid retrieval engine
- `app/ai/context_builder.py` - RAG context formatting
- `app/ai/effectiveness_tracker.py` - Learning loop tracking
- `app/ai/rag_evaluation.py` - Performance metrics

### Routes
- `app/routes/rag_admin_routes.py` - Admin API endpoints

### Scripts
- `migrate_knowledge_schema.py` - Schema migration
- `populate_embeddings.py` - Embedding generation
- `test_hybrid_rag.py` - Test suite
- `setup_hybrid_rag.py` - Setup verification

### Documentation
- `HYBRID_RAG_README.md` - Full documentation
- `QUICK_REFERENCE.md` - This file

## 🔌 API Endpoints

### User Endpoints

#### Submit Answer with RAG Feedback
```http
POST /api/learn/ai/submit-answer
Content-Type: application/json

{
  "user_id": "user123",
  "exercise_id": "60f7b3b3b3b3b3b3b3b3b3b3",
  "user_answer": "Mokadda karanne?"
}
```

#### Generate Personalized Exercise
```http
POST /api/learn/ai/generate-personalized-exercise
Content-Type: application/json

{
  "user_id": "user123"
}
```

### Admin Endpoints

#### System Stats
```http
GET /api/learn/admin/rag/system-stats
```

#### Performance Report
```http
GET /api/learn/admin/rag/performance-report?days=30
```

#### Retrieval Metrics
```http
GET /api/learn/admin/rag/retrieval-metrics?days=7
```

#### Most Effective Knowledge
```http
GET /api/learn/admin/rag/knowledge/most-effective?limit=10
```

#### Least Effective Knowledge
```http
GET /api/learn/admin/rag/knowledge/least-effective?limit=10
```

#### Embedding Coverage
```http
GET /api/learn/admin/rag/embedding-coverage
```

#### Error Reduction Analysis
```http
GET /api/learn/admin/rag/error-reduction?user_id=user123&days=30
```

#### Skill Improvement
```http
GET /api/learn/admin/rag/skill-improvement?user_id=user123&skill_tag=question_forms&days=30
```

## 💻 Code Usage Examples

### Generate Embedding
```python
from app.ai.embedding_service import generate_embedding

embedding = generate_embedding("Your text here")
# Returns: [1536 floats]
```

### Compute Similarity
```python
from app.ai.similarity import cosine_similarity

score = cosine_similarity(embedding1, embedding2)
# Returns: float between -1 and 1
```

### Hybrid Retrieval
```python
from app.ai.rag_hybrid import hybrid_retrieve
from app.db.mongo import get_db

db = get_db()
docs = hybrid_retrieve(
    db=db,
    query_text="Student answered 'koheda' instead of 'mokadda'",
    skill_tags=["question_forms"],
    error_types=["wrong_question_word"],
    difficulty="beginner",
    weak_skills=["grammar"],
    limit=5
)
```

### Build Context
```python
from app.ai.context_builder import build_context_for_feedback

context = build_context_for_feedback(
    docs=retrieved_docs,
    student_answer="wrong answer",
    correct_answer="correct answer",
    error_type="wrong_question_word"
)
```

### Track Effectiveness
```python
from app.ai.effectiveness_tracker import update_knowledge_effectiveness

update_knowledge_effectiveness(
    db=db,
    knowledge_ids=["id1", "id2", "id3"],
    helped=True  # Did the knowledge help the student?
)
```

### Generate Report
```python
from app.ai.rag_evaluation import generate_rag_performance_report

report = generate_rag_performance_report(db, days=30)
```

## 📊 Boost Factors (Configurable)

In `app/ai/rag_hybrid.py`, you can adjust these weights:

```python
# Semantic similarity weight
semantic_score = similarities[i] * 5.0

# Error type match boost
if doc_errors & learner_errors:
    boost_score += 3.0

# Exercise type match boost
if exercise_type in doc_exercise_types:
    boost_score += 2.0

# Weak skill match boost
if doc_skills & weak_skill_set:
    boost_score += 2.0

# Priority boost
boost_score += priority

# Effectiveness boost
help_rate = helped_correct / times_used
boost_score += help_rate * 1.5
```

## 🗄️ MongoDB Schema

### vadda_knowledge Collection
```javascript
{
  _id: ObjectId,
  type: "grammar_rule",
  skill_tags: ["question_forms"],
  error_types: ["wrong_question_word"],
  difficulty: "beginner",
  exercise_types: ["multiple_choice", "fill_blank"],
  content: "Rule text",
  example: "Example sentence",
  examples: [{sentence: "...", meaning: "..."}],
  embedding: [1536 floats],
  embedding_model: "text-embedding-3-small",
  embedding_generated_at: ISODate,
  priority: 2,
  effectiveness: {
    times_used: 150,
    helped_correct: 120,
    last_used: ISODate
  }
}
```

### user_stats Collection
```javascript
{
  user_id: "user123",
  skill_stats: {
    "question_forms": {
      correct: 10,
      wrong: 5
    }
  },
  error_stats: {
    "wrong_question_word": 3,
    "spelling_error": 2
  },
  overall: {
    overall_accuracy: 0.67
  },
  last_updated: ISODate
}
```

### knowledge_usage Collection (for tracking)
```javascript
{
  user_id: "user123",
  exercise_id: "60f...",
  knowledge_ids: [ObjectId, ...],
  was_helpful: true,
  timestamp: ISODate
}
```

## 🔧 Common Tasks

### Add New Knowledge Document
```javascript
db.vedda_knowledge.insertOne({
  type: "grammar_rule",
  skill_tags: ["your_skill"],
  error_types: ["your_error"],
  difficulty: "beginner",
  exercise_types: ["multiple_choice"],
  content: "Your rule explanation",
  example: "Example sentence",
  priority: 1,
  effectiveness: {
    times_used: 0,
    helped_correct: 0,
    last_used: null
  }
})

// Then run: python populate_embeddings.py --populate
```

### Update Boost Weights
Edit `app/ai/rag_hybrid.py` around line 100:
```python
semantic_score = similarities[i] * 5.0  # Change this
boost_score += 3.0  # And these
```

### Reset Effectiveness for Document
```python
from app.ai.effectiveness_tracker import reset_knowledge_effectiveness

reset_knowledge_effectiveness(db, knowledge_id)
```

### Create Custom Context Builder
```python
def build_custom_context(docs: list[dict]) -> str:
    lines = []
    for doc in docs:
        lines.append(f"Rule: {doc.get('content')}")
        lines.append(f"Example: {doc.get('example')}")
    return "\n".join(lines)
```

## 📈 Performance Monitoring

### Daily
```bash
# Check embedding coverage
python populate_embeddings.py --verify

# Monitor retrieval metrics
curl http://localhost:5006/api/learn/admin/rag/retrieval-metrics
```

### Weekly
```bash
# Performance report
curl http://localhost:5006/api/learn/admin/rag/performance-report?days=7

# Find weak knowledge
curl http://localhost:5006/api/learn/admin/rag/knowledge/least-effective
```

### Monthly
```bash
# Full system analysis
python test_hybrid_rag.py --all

# Generate comprehensive report
curl http://localhost:5006/api/learn/admin/rag/performance-report?days=30
```

## 🐛 Troubleshooting

### No embeddings generated
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Populate embeddings
python populate_embeddings.py --populate
```

### Low retrieval accuracy
```python
# Adjust boost weights in rag_hybrid.py
# Check error type classification in routes
# Verify knowledge content quality
```

### Slow retrieval
```javascript
// Add indexes in MongoDB
db.vedda_knowledge.createIndex({"skill_tags": 1})
db.vedda_knowledge.createIndex({"embedding": 1})
```

### Import errors
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

## 🎯 Best Practices

1. **Keep knowledge base updated** - Regularly review and update low-performing content
2. **Monitor effectiveness** - Track help_rate and adjust content accordingly
3. **Use appropriate boost weights** - Tune based on your domain
4. **Batch embed when possible** - Use `generate_embeddings_batch()` for efficiency
5. **Create indexes** - Ensure MongoDB indexes exist for performance
6. **Track usage** - Use knowledge_usage collection for analytics
7. **Regular reports** - Review weekly performance reports

## 📞 Support

For issues or questions:
- Review logs in console output
- Check `HYBRID_RAG_README.md` for detailed docs
- Run `python test_hybrid_rag.py --all` to diagnose issues
- Verify setup with `python setup_hybrid_rag.py`

---

**Version:** 1.0  
**Last Updated:** February 21, 2026  
**System:** Vedda Language Learning Platform - Hybrid RAG

