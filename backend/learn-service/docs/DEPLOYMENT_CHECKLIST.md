# Deployment Checklist - Hybrid RAG System

## Pre-Deployment

### Environment Setup
- [ ] Python 3.8+ installed
- [ ] MongoDB running and accessible
- [ ] OpenAI API key obtained
- [ ] `.env` file configured with `OPENAI_API_KEY`
- [ ] Dependencies installed: `pip install -r requirements.txt`

### Database Preparation
- [ ] MongoDB connection tested
- [ ] `vadda_knowledge` collection exists
- [ ] Knowledge documents populated (at least 10-20)
- [ ] Sample data created if needed

## Deployment Steps

### Step 1: Schema Migration
```bash
cd backend/learn-service
python migrate_knowledge_schema.py --migrate
python migrate_knowledge_schema.py --verify
```
- [ ] Migration completed successfully
- [ ] All documents have required fields
- [ ] Verification passed

### Step 2: Generate Embeddings
```bash
python populate_embeddings.py --populate
python populate_embeddings.py --verify
```
- [ ] Embeddings generated for all documents
- [ ] Coverage is 100%
- [ ] No errors during generation
- [ ] Embedding model: text-embedding-3-small
- [ ] Dimension: 1536

### Step 3: Create Database Indexes
```bash
python setup_hybrid_rag.py
# Or manually in MongoDB:
```
```javascript
db.vedda_knowledge.createIndex({"skill_tags": 1})
db.vedda_knowledge.createIndex({"difficulty": 1})
db.vedda_knowledge.createIndex({"error_types": 1})
db.vedda_knowledge.createIndex({"effectiveness.times_used": -1})
db.user_stats.createIndex({"user_id": 1})
db.user_attempts.createIndex({"user_id": 1, "timestamp": -1})
```
- [ ] Indexes created successfully
- [ ] Query performance verified

### Step 4: Run Tests
```bash
python test_hybrid_rag.py --all
```
- [ ] Test 1: Embedding Generation - PASSED
- [ ] Test 2: Cosine Similarity - PASSED
- [ ] Test 3: Batch Similarity - PASSED
- [ ] Test 4: Hybrid Retrieval - PASSED
- [ ] Test 5: Context Building - PASSED
- [ ] Test 6: Effectiveness Tracking - PASSED
- [ ] Test 7: End-to-End Flow - PASSED
- [ ] Test 8: Performance Report - PASSED
- [ ] Overall: 8/8 tests passed

### Step 5: Start Service
```bash
python run.py
```
- [ ] Service starts without errors
- [ ] Port 5006 is accessible
- [ ] Health check endpoint responds: `GET /health`

### Step 6: Verify API Endpoints
```bash
# System stats
curl http://localhost:5006/api/learn/admin/rag/system-stats

# Embedding coverage
curl http://localhost:5006/api/learn/admin/rag/embedding-coverage

# Performance report
curl http://localhost:5006/api/learn/admin/rag/performance-report?days=30
```
- [ ] `/admin/rag/system-stats` returns valid JSON
- [ ] `/admin/rag/embedding-coverage` shows 100% coverage
- [ ] `/admin/rag/performance-report` generates report
- [ ] All admin endpoints accessible

### Step 7: Test User Flow
```bash
# Submit answer endpoint
curl -X POST http://localhost:5006/api/learn/ai/submit-answer \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test123","exercise_id":"...","user_answer":"..."}'

# Generate exercise endpoint
curl -X POST http://localhost:5006/api/learn/ai/generate-personalized-exercise \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test123"}'
```
- [ ] Submit answer returns feedback with RAG context
- [ ] Generate exercise returns valid exercise
- [ ] Knowledge IDs tracked in responses
- [ ] Effectiveness updates in background

## Post-Deployment

### Monitoring Setup
- [ ] Set up daily embedding coverage check
- [ ] Set up weekly performance report review
- [ ] Set up alerts for low retrieval match rate
- [ ] Monitor OpenAI API usage and costs

### Performance Verification
- [ ] Average retrieval time < 500ms
- [ ] Context generation time < 100ms
- [ ] No memory leaks
- [ ] Database query performance acceptable

### Data Verification
- [ ] User stats collection updating correctly
- [ ] Knowledge effectiveness tracking working
- [ ] knowledge_usage collection populated
- [ ] Error types classified correctly

## Ongoing Maintenance

### Daily Tasks
- [ ] Check embedding coverage: `python populate_embeddings.py --verify`
- [ ] Monitor retrieval metrics: `GET /admin/rag/retrieval-metrics`
- [ ] Review error logs

### Weekly Tasks
- [ ] Generate performance report: `GET /admin/rag/performance-report?days=7`
- [ ] Review least effective knowledge: `GET /admin/rag/knowledge/least-effective`
- [ ] Update poor-performing knowledge content

### Monthly Tasks
- [ ] Full system analysis: `python test_hybrid_rag.py --all`
- [ ] Review skill improvement trends
- [ ] Adjust boost factors if needed
- [ ] Re-train mistake classifier with new data
- [ ] Backup knowledge base

## Troubleshooting Checklist

### If embeddings fail to generate:
- [ ] Verify OpenAI API key is valid
- [ ] Check API rate limits
- [ ] Verify internet connectivity
- [ ] Check document content is not empty

### If retrieval returns no results:
- [ ] Verify documents have embeddings
- [ ] Check skill_tags match query
- [ ] Review symbolic filtering criteria
- [ ] Check MongoDB connection

### If effectiveness not updating:
- [ ] Verify background threads are running
- [ ] Check MongoDB write permissions
- [ ] Review knowledge_ids in responses
- [ ] Verify user_attempts collection updates

### If performance is slow:
- [ ] Verify indexes exist
- [ ] Check document count
- [ ] Review embedding generation frequency
- [ ] Consider caching strategy

## Rollback Plan

If issues occur:
1. [ ] Stop service: `Ctrl+C` or kill process
2. [ ] Restore previous code version
3. [ ] Restore database backup
4. [ ] Verify old system works
5. [ ] Investigate issue
6. [ ] Fix and redeploy

## Success Criteria

✅ System is considered successfully deployed when:
- [ ] All tests pass (8/8)
- [ ] Embedding coverage is 100%
- [ ] API endpoints respond correctly
- [ ] User flow works end-to-end
- [ ] Effectiveness tracking updates
- [ ] Performance metrics acceptable
- [ ] No errors in logs
- [ ] Documentation accessible
- [ ] Team trained on system

## Sign-off

- [ ] Developer verified: _________________ Date: _______
- [ ] QA tested: _________________ Date: _______
- [ ] Product owner approved: _________________ Date: _______
- [ ] Deployed to production: _________________ Date: _______

---

**Version:** 1.0  
**Last Updated:** February 21, 2026  
**System:** Vedda Language Learning Platform - Hybrid RAG System

