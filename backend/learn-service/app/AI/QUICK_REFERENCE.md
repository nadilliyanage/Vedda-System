# AI Integration Layer - Quick Reference

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Add to .env file
OPENAI_API_KEY=sk-your-api-key-here
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Test Connection
```bash
curl http://localhost:5006/api/ai/health
```

---

## 📋 Common Use Cases

### Generate Exercises
```python
from app.AI import AIService

ai = AIService()
result = ai.generate_exercises(
    topic="Vedda greetings",
    difficulty="beginner",
    count=5
)
```

**API:**
```bash
POST /api/ai/exercises/generate
{
  "topic": "Vedda greetings",
  "difficulty": "beginner",
  "count": 5
}
```

---

### Correct User Mistakes
```python
result = ai.correct_mistakes(
    user_input="Wrong answer",
    correct_answer="Right answer",
    context="Exercise context"
)
```

**API:**
```bash
POST /api/ai/corrections/analyze
{
  "user_input": "Wrong answer",
  "correct_answer": "Right answer",
  "context": "Exercise context"
}
```

---

### Generate Summary
```python
result = ai.generate_summary(
    content="Long text...",
    summary_type="brief"
)
```

**API:**
```bash
POST /api/ai/summary/generate
{
  "content": "Long text...",
  "summary_type": "brief"
}
```

---

## 🎯 Task Types

Use task-based generation for optimal performance:

```python
from app.AI.ai_config import AITaskType

result = ai.generate_with_task_type(
    prompt="Your prompt",
    task_type=AITaskType.EXERCISE_GENERATION
)
```

**Available Task Types:**
- `EXERCISE_GENERATION` - Creating exercises
- `MISTAKE_CORRECTION` - Analyzing errors
- `SUMMARY_GENERATION` - Content summaries
- `TRANSLATION_HELP` - Translation assistance
- `LEARNING_PATH` - Learning plans
- `CUSTOM` - General purpose

---

## 🔧 Model Selection

### Default Models by Task
- **Exercises**: `gpt-4o` (creative, high quality)
- **Corrections**: `gpt-4o-mini` (fast, precise)
- **Summaries**: `gpt-4o-mini` (efficient)
- **Translations**: `gpt-4o` (accurate)
- **Learning Paths**: `gpt-4o` (comprehensive)

### Override Model
```python
result = ai.generate_with_task_type(
    prompt="Your prompt",
    task_type=AITaskType.EXERCISE_GENERATION,
    model_override="gpt-4o-mini"  # Use cheaper model
)
```

---

## 📊 Response Format

All methods return:
```python
{
    "success": True,
    "content": "AI generated content",
    "model": "gpt-4o-mini",
    "usage": {
        "prompt_tokens": 50,
        "completion_tokens": 100,
        "total_tokens": 150
    },
    "finish_reason": "stop"
}
```

On error:
```python
{
    "success": False,
    "error": "Error message",
    "content": None
}
```

---

## ⚙️ Configuration

### Available Models
- `gpt-4` - Most capable
- `gpt-4o` - Optimized, fast
- `gpt-4o-mini` - Fast & cheap ✅ (default)
- `gpt-3.5-turbo` - Legacy

### Parameters
```python
result = ai.generate_completion(
    prompt="Your prompt",
    model="gpt-4o-mini",
    temperature=0.7,      # 0.0-2.0 (creativity)
    max_tokens=1000,      # Response length
    top_p=1.0,           # Nucleus sampling
    frequency_penalty=0,  # Reduce repetition
    presence_penalty=0    # Topic diversity
)
```

---

## 🛡️ Error Handling

The service includes:
- ✅ Automatic retries (3 attempts)
- ✅ Rate limit handling
- ✅ Connection error recovery
- ✅ Detailed logging

```python
result = ai.generate_completion(prompt="Test")
if result["success"]:
    print(result["content"])
else:
    print(f"Error: {result['error']}")
```

---

## 💰 Cost Optimization Tips

1. **Use appropriate models**
   - Simple tasks → `gpt-4o-mini`
   - Complex tasks → `gpt-4o`

2. **Limit tokens**
   ```python
   max_tokens=200  # Set reasonable limits
   ```

3. **Cache results**
   - Store frequent responses
   - Use database caching

4. **Batch operations**
   - Combine multiple requests

---

## 🔐 Security Checklist

- ✅ API key in environment variables
- ✅ Never commit `.env` files
- ✅ Validate user inputs
- ⚠️ Add rate limiting to endpoints
- ⚠️ Implement user quotas
- ⚠️ Add authentication

---

## 🧪 Testing

### Python
```python
def test_ai_service():
    ai = AIService()
    result = ai.generate_completion(
        prompt="Test",
        max_tokens=10
    )
    assert result["success"] == True
```

### cURL
```bash
# Health check
curl http://localhost:5006/api/ai/health

# Generate
curl -X POST http://localhost:5006/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

---

## 📚 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/health` | GET | Health check |
| `/api/ai/generate` | POST | General completion |
| `/api/ai/exercises/generate` | POST | Create exercises |
| `/api/ai/corrections/analyze` | POST | Correct mistakes |
| `/api/ai/summary/generate` | POST | Generate summaries |
| `/api/ai/learning-path/generate` | POST | Learning plans |
| `/api/ai/models` | GET | List models |

---

## 🆘 Troubleshooting

### API Key Error
```bash
# Check environment variable
echo $OPENAI_API_KEY

# Set in .env
OPENAI_API_KEY=sk-...
```

### Rate Limit
- Service retries automatically
- Consider upgrading OpenAI plan

### Connection Timeout
- Check internet connection
- Verify OpenAI status
- Increase timeout in config

---

## 📖 Full Documentation

See [README.md](README.md) for complete documentation.

---

## 💡 Best Practices

1. ✅ Use task-specific methods
2. ✅ Set reasonable token limits
3. ✅ Cache frequent requests
4. ✅ Monitor usage regularly
5. ✅ Handle errors gracefully
6. ✅ Log interactions for debugging
7. ✅ Test with different models
8. ✅ Validate user inputs

---

**Need Help?** Check the examples in `examples.py` or read the full documentation in `README.md`.
