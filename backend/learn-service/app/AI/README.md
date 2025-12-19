# AI Integration Layer - Learn Service

## Overview

This AI integration layer provides a clean, extensible architecture for incorporating OpenAI's GPT models into the Vedda System learn-service. It follows clean architecture principles with proper separation of concerns, dependency injection, and configuration management.

## Architecture

### Components

1. **AIService** (`ai_service.py`) - Main service class for AI operations
2. **AIConfig** (`ai_config.py`) - Configuration and model management
3. **Flask Routes** (`routes/ai_routes.py`) - REST API endpoints

### Key Features

- ✅ **Reusable AI Service Class** - Single service handles all AI operations
- ✅ **Dynamic Prompt Handling** - Accept any prompt with flexible parameters
- ✅ **Runtime Model Switching** - Change GPT models per request or task type
- ✅ **Task-Specific Optimization** - Pre-configured settings for common tasks
- ✅ **Extensible Architecture** - Easy to add new AI-powered features
- ✅ **Environment-Based Configuration** - Secure API key management
- ✅ **Error Handling & Retry Logic** - Robust error handling with automatic retries
- ✅ **Clean Architecture** - Separation of concerns and dependency injection

## Setup

### 1. Environment Variables

Create a `.env` file in the `learn-service` directory:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_ORGANIZATION=your_org_id_here  # Optional

# AI Feature Flag
AI_ENABLED=true
```

### 2. Install Dependencies

```bash
cd backend/learn-service
pip install -r requirements.txt
```

### 3. Verify Installation

The AI routes are automatically registered when the Flask app starts. You can verify by checking:

```bash
curl http://localhost:5006/api/ai/health
```

## Usage Examples

### 1. Basic Completion

```python
from app.AI import AIService

# Initialize service
ai_service = AIService()

# Generate completion
result = ai_service.generate_completion(
    prompt="Explain Vedda language greetings",
    model="gpt-4o-mini",
    temperature=0.7
)

print(result["content"])
```

**API Endpoint:**
```bash
curl -X POST http://localhost:5006/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain Vedda language greetings",
    "model": "gpt-4o-mini",
    "temperature": 0.7
  }'
```

### 2. Generate Learning Exercises

```python
# Using the service directly
result = ai_service.generate_exercises(
    topic="Vedda greetings",
    difficulty="beginner",
    count=5,
    language="Vedda"
)
```

**API Endpoint:**
```bash
curl -X POST http://localhost:5006/api/ai/exercises/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Vedda greetings",
    "difficulty": "beginner",
    "count": 5,
    "language": "Vedda"
  }'
```

### 3. Correct User Mistakes

```python
result = ai_service.correct_mistakes(
    user_input="Ayubowan",
    correct_answer="Bohoma sthuthi",
    context="Basic greeting exercise"
)
```

**API Endpoint:**
```bash
curl -X POST http://localhost:5006/api/ai/corrections/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": "Ayubowan",
    "correct_answer": "Bohoma sthuthi",
    "context": "Basic greeting exercise"
  }'
```

### 4. Generate Summary

```python
result = ai_service.generate_summary(
    content="Long learning content here...",
    summary_type="brief"
)
```

**API Endpoint:**
```bash
curl -X POST http://localhost:5006/api/ai/summary/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Long learning content here...",
    "summary_type": "brief"
  }'
```

### 5. Generate Personalized Learning Path

```python
result = ai_service.generate_learning_path(
    current_level="beginner",
    goals=["Learn basic vocabulary", "Understand grammar"],
    time_available="30 minutes per day"
)
```

**API Endpoint:**
```bash
curl -X POST http://localhost:5006/api/ai/learning-path/generate \
  -H "Content-Type: application/json" \
  -d '{
    "current_level": "beginner",
    "goals": ["Learn basic vocabulary", "Understand grammar"],
    "time_available": "30 minutes per day"
  }'
```

### 6. Task-Based Generation (Recommended)

```python
from app.AI.ai_config import AITaskType

# Automatically uses optimal model and settings for the task
result = ai_service.generate_with_task_type(
    prompt="Generate 5 beginner exercises",
    task_type=AITaskType.EXERCISE_GENERATION
)
```

## API Endpoints

### Health Check
- **GET** `/api/ai/health` - Check AI service status

### Generation
- **POST** `/api/ai/generate` - General purpose AI completion
- **POST** `/api/ai/exercises/generate` - Generate learning exercises
- **POST** `/api/ai/corrections/analyze` - Analyze and correct mistakes
- **POST** `/api/ai/summary/generate` - Generate content summaries
- **POST** `/api/ai/learning-path/generate` - Generate personalized learning paths

### Configuration
- **GET** `/api/ai/models` - List available models and configurations

## Configuration

### Available Models

- `gpt-4` - Most capable, higher cost
- `gpt-4-turbo-preview` - Fast, capable
- `gpt-4o` - Optimized for speed and cost
- `gpt-4o-mini` - Fast and cost-effective (default)
- `gpt-3.5-turbo` - Legacy, lowest cost

### Task-Specific Models

The system automatically selects optimal models for different tasks:

- **Exercise Generation**: `gpt-4o` (creative, high quality)
- **Mistake Correction**: `gpt-4o-mini` (precise, fast)
- **Summary Generation**: `gpt-4o-mini` (efficient)
- **Translation Help**: `gpt-4o` (accurate)
- **Learning Path**: `gpt-4o` (comprehensive)

### Customizing Configuration

Edit `app/AI/ai_config.py`:

```python
# Change default model
DEFAULT_MODEL = AIModel.GPT_4O.value

# Adjust task-specific models
TASK_MODEL_MAPPING = {
    AITaskType.EXERCISE_GENERATION: AIModel.GPT_4O.value,
    # ... customize as needed
}

# Adjust temperature settings
TASK_TEMPERATURE_MAPPING = {
    AITaskType.EXERCISE_GENERATION: 0.9,  # More creative
    # ... customize as needed
}
```

## Extending the System

### Adding a New AI Task Type

1. **Add Task Type** to `ai_config.py`:
```python
class AITaskType(Enum):
    # ... existing types
    VOCABULARY_QUIZ = "vocabulary_quiz"
```

2. **Configure Task** in `AIConfig`:
```python
TASK_MODEL_MAPPING = {
    # ... existing mappings
    AITaskType.VOCABULARY_QUIZ: AIModel.GPT_4O_MINI.value,
}

TASK_TEMPERATURE_MAPPING = {
    # ... existing mappings
    AITaskType.VOCABULARY_QUIZ: 0.6,
}
```

3. **Add Method** to `AIService`:
```python
def generate_vocabulary_quiz(self, words: List[str], difficulty: str) -> Dict[str, Any]:
    """Generate a vocabulary quiz"""
    system_message = "You are an expert quiz creator."
    
    prompt = f"""Create a {difficulty} vocabulary quiz for these words:
    {', '.join(words)}
    
    Include multiple choice questions."""
    
    return self.generate_with_task_type(
        prompt=prompt,
        task_type=AITaskType.VOCABULARY_QUIZ,
        system_message=system_message
    )
```

4. **Add Route** in `ai_routes.py`:
```python
@ai_routes.route("/quiz/vocabulary", methods=["POST"])
def generate_vocabulary_quiz():
    """Generate a vocabulary quiz"""
    data = request.get_json()
    service = get_ai_service()
    
    result = service.generate_vocabulary_quiz(
        words=data["words"],
        difficulty=data.get("difficulty", "medium")
    )
    
    return jsonify(result), 200 if result["success"] else 500
```

### Using Different AI Providers

The architecture supports easy migration to other AI providers:

1. Create a new service class (e.g., `AnthropicService`)
2. Implement the same interface as `AIService`
3. Update the service factory in routes to switch providers

## Error Handling

The service includes comprehensive error handling:

- **Automatic Retry** - Retries failed requests up to 3 times
- **Rate Limiting** - Handles rate limit errors with exponential backoff
- **Connection Errors** - Retries on network issues
- **Validation** - Input validation at route level
- **Logging** - Detailed logging for debugging

## Best Practices

1. **Always use task-specific methods** when available (e.g., `generate_exercises()`)
2. **Cache results** to avoid redundant API calls
3. **Monitor usage** through the OpenAI dashboard
4. **Use appropriate models** for each task (don't use GPT-4 when GPT-4o-mini suffices)
5. **Set reasonable max_tokens** to control costs
6. **Implement user feedback** to improve prompts over time

## Security Considerations

- ✅ API keys stored in environment variables
- ✅ Never commit `.env` files
- ✅ Validate all user inputs
- ✅ Implement rate limiting on routes
- ✅ Log AI interactions for audit trail
- ⚠️ Consider implementing user-based quotas
- ⚠️ Add authentication/authorization to AI endpoints

## Cost Optimization

1. **Use cheaper models** for simple tasks (GPT-4o-mini)
2. **Limit max_tokens** appropriately
3. **Cache frequent requests**
4. **Batch operations** when possible
5. **Monitor usage** regularly

## Testing

### Unit Test Example

```python
def test_ai_service():
    service = AIService()
    
    result = service.generate_completion(
        prompt="Test prompt",
        max_tokens=50
    )
    
    assert result["success"] == True
    assert "content" in result
```

### Integration Test

```bash
# Test health endpoint
curl http://localhost:5006/api/ai/health

# Test generation
curl -X POST http://localhost:5006/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

## Troubleshooting

### "OpenAI API key is required"
- Ensure `OPENAI_API_KEY` is set in environment variables

### "Rate limit exceeded"
- The service will automatically retry
- Consider upgrading your OpenAI plan

### "Model not found"
- Check that you have access to the specified model
- Some models require specific API tiers

### "Connection timeout"
- Check internet connectivity
- Verify OpenAI service status
- Adjust `REQUEST_TIMEOUT` in config

## Future Enhancements

- [ ] Streaming responses for long generations
- [ ] Conversation context management
- [ ] Function calling for structured outputs
- [ ] Fine-tuned models for Vedda language
- [ ] Cost tracking and analytics
- [ ] A/B testing framework for prompts
- [ ] User feedback loop integration
- [ ] Prompt template management system

## License

Part of the Vedda System - Learn Service
