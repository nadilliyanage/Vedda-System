"""
Unit Tests for AI Integration Layer
Run with: pytest test_ai_integration.py
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from app.ai import AIService, AIConfig
from app.ai.ai_config import AITaskType, AIModel


class TestAIConfig:
    """Tests for AIConfig class"""
    
    def test_validate_config_with_api_key(self):
        """Test config validation with API key"""
        with patch.dict('os.environ', {'OPENAI_API_KEY': 'test-key'}):
            AIConfig.OPENAI_API_KEY = 'test-key'
            assert AIConfig.validate_config() is True
    
    def test_validate_config_without_api_key(self):
        """Test config validation without API key"""
        AIConfig.OPENAI_API_KEY = ''
        assert AIConfig.validate_config() is False
    
    def test_get_model_for_task(self):
        """Test model selection for different tasks"""
        model = AIConfig.get_model_for_task(AITaskType.EXERCISE_GENERATION)
        assert model == AIModel.GPT_4O.value
        
        model = AIConfig.get_model_for_task(AITaskType.MISTAKE_CORRECTION)
        assert model == AIModel.GPT_4O_MINI.value
    
    def test_get_temperature_for_task(self):
        """Test temperature selection for different tasks"""
        temp = AIConfig.get_temperature_for_task(AITaskType.EXERCISE_GENERATION)
        assert temp == 0.8
        
        temp = AIConfig.get_temperature_for_task(AITaskType.MISTAKE_CORRECTION)
        assert temp == 0.3


class TestAIService:
    """Tests for AIService class"""
    
    @patch('app.AI.ai_service.OpenAI')
    def test_service_initialization(self, mock_openai):
        """Test AI service initialization"""
        service = AIService(api_key='test-key')
        assert service is not None
        assert service.api_key == 'test-key'
    
    def test_service_initialization_without_api_key(self):
        """Test service initialization fails without API key"""
        with pytest.raises(ValueError, match="OpenAI API key is required"):
            AIService(api_key=None)
    
    @patch('app.AI.ai_service.OpenAI')
    def test_generate_completion_success(self, mock_openai):
        """Test successful completion generation"""
        # Mock the OpenAI response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Test response"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.model = "gpt-4o-mini"
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 20
        mock_response.usage.total_tokens = 30
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        service = AIService(api_key='test-key')
        result = service.generate_completion(prompt="Test prompt")
        
        assert result["success"] is True
        assert result["content"] == "Test response"
        assert result["model"] == "gpt-4o-mini"
        assert result["usage"]["total_tokens"] == 30
    
    @patch('app.AI.ai_service.OpenAI')
    def test_generate_completion_failure(self, mock_openai):
        """Test completion generation with error"""
        mock_client = MagicMock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        mock_openai.return_value = mock_client
        
        service = AIService(api_key='test-key')
        result = service.generate_completion(prompt="Test prompt")
        
        assert result["success"] is False
        assert "error" in result
        assert result["content"] is None
    
    @patch('app.AI.ai_service.OpenAI')
    def test_generate_with_task_type(self, mock_openai):
        """Test task-based generation"""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Exercise content"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.model = "gpt-4o"
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 150
        mock_response.usage.total_tokens = 200
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        service = AIService(api_key='test-key')
        result = service.generate_with_task_type(
            prompt="Create exercises",
            task_type=AITaskType.EXERCISE_GENERATION
        )
        
        assert result["success"] is True
        assert result["model"] == "gpt-4o"
    
    @patch('app.AI.ai_service.OpenAI')
    def test_generate_exercises(self, mock_openai):
        """Test exercise generation"""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Generated exercises"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.model = "gpt-4o"
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 500
        mock_response.usage.total_tokens = 600
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        service = AIService(api_key='test-key')
        result = service.generate_exercises(
            topic="Vedda greetings",
            difficulty="beginner",
            count=5
        )
        
        assert result["success"] is True
        assert "content" in result
    
    @patch('app.AI.ai_service.OpenAI')
    def test_correct_mistakes(self, mock_openai):
        """Test mistake correction"""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Correction feedback"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.model = "gpt-4o-mini"
        mock_response.usage.prompt_tokens = 50
        mock_response.usage.completion_tokens = 100
        mock_response.usage.total_tokens = 150
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        service = AIService(api_key='test-key')
        result = service.correct_mistakes(
            user_input="Wrong answer",
            correct_answer="Right answer"
        )
        
        assert result["success"] is True
    
    @patch('app.AI.ai_service.OpenAI')
    def test_generate_summary(self, mock_openai):
        """Test summary generation"""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Summary content"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.model = "gpt-4o-mini"
        mock_response.usage.prompt_tokens = 200
        mock_response.usage.completion_tokens = 50
        mock_response.usage.total_tokens = 250
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        service = AIService(api_key='test-key')
        result = service.generate_summary(
            content="Long content",
            summary_type="brief"
        )
        
        assert result["success"] is True
    
    @patch('app.AI.ai_service.OpenAI')
    def test_generate_learning_path(self, mock_openai):
        """Test learning path generation"""
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Learning path"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.model = "gpt-4o"
        mock_response.usage.prompt_tokens = 150
        mock_response.usage.completion_tokens = 400
        mock_response.usage.total_tokens = 550
        
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        service = AIService(api_key='test-key')
        result = service.generate_learning_path(
            current_level="beginner",
            goals=["Goal 1", "Goal 2"],
            time_available="30 minutes"
        )
        
        assert result["success"] is True
    
    @patch('app.AI.ai_service.OpenAI')
    def test_retry_logic(self, mock_openai):
        """Test retry logic on failure"""
        from openai import RateLimitError
        
        mock_client = MagicMock()
        # Fail twice, then succeed
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Success after retry"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.model = "gpt-4o-mini"
        mock_response.usage.prompt_tokens = 10
        mock_response.usage.completion_tokens = 20
        mock_response.usage.total_tokens = 30
        
        mock_client.chat.completions.create.side_effect = [
            RateLimitError(message="Rate limit", response=None, body=None),
            RateLimitError(message="Rate limit", response=None, body=None),
            mock_response
        ]
        mock_openai.return_value = mock_client
        
        service = AIService(api_key='test-key')
        result = service.generate_completion(prompt="Test")
        
        assert result["success"] is True
        assert mock_client.chat.completions.create.call_count == 3


class TestAIRoutes:
    """Tests for Flask routes"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from app import create_app
        app = create_app()
        app.config['TESTING'] = True
        return app.test_client()
    
    @patch('app.routes.ai_routes.get_ai_service')
    def test_health_endpoint(self, mock_get_service, client):
        """Test health check endpoint"""
        mock_service = MagicMock()
        mock_service.test_connection.return_value = True
        mock_get_service.return_value = mock_service
        
        response = client.get('/api/ai/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
    
    @patch('app.routes.ai_routes.get_ai_service')
    def test_generate_endpoint(self, mock_get_service, client):
        """Test generate endpoint"""
        mock_service = MagicMock()
        mock_service.generate_completion.return_value = {
            "success": True,
            "content": "Test response"
        }
        mock_get_service.return_value = mock_service
        
        response = client.post('/api/ai/generate', json={
            "prompt": "Test prompt"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
    
    @patch('app.routes.ai_routes.get_ai_service')
    def test_generate_exercises_endpoint(self, mock_get_service, client):
        """Test exercise generation endpoint"""
        mock_service = MagicMock()
        mock_service.generate_exercises.return_value = {
            "success": True,
            "content": "Exercises"
        }
        mock_get_service.return_value = mock_service
        
        response = client.post('/api/ai/exercises/generate', json={
            "topic": "Test topic",
            "difficulty": "beginner"
        })
        assert response.status_code == 200
    
    def test_generate_endpoint_missing_prompt(self, client):
        """Test generate endpoint with missing prompt"""
        response = client.post('/api/ai/generate', json={})
        assert response.status_code == 400
        data = response.get_json()
        assert data["success"] is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
