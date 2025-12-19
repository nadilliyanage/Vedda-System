"""
AI Service Module
Main service class for AI operations using OpenAI API
"""
import logging
import time
from typing import Optional, Dict, Any, List
from openai import OpenAI, OpenAIError, APIError, RateLimitError, APIConnectionError
from .ai_config import AIConfig, AIModel, AITaskType


logger = logging.getLogger(__name__)


class AIService:
    """
    Reusable AI Service class for handling OpenAI API interactions
    Follows clean architecture principles with dependency injection
    """
    
    def __init__(self, api_key: Optional[str] = None, organization: Optional[str] = None):
        """
        Initialize the AI Service
        
        Args:
            api_key: OpenAI API key (uses config if not provided)
            organization: OpenAI organization ID (optional)
        """
        self.api_key = api_key or AIConfig.OPENAI_API_KEY
        self.organization = organization or AIConfig.OPENAI_ORGANIZATION
        
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        # Initialize OpenAI client
        self.client = OpenAI(
            api_key=self.api_key,
            organization=self.organization
        )
        
        logger.info("AIService initialized successfully")
    
    def generate_completion(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        system_message: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a completion using OpenAI API
        
        Args:
            prompt: The user prompt
            model: Model to use (defaults to config default)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            system_message: Optional system message for context
            **kwargs: Additional parameters for the API call
            
        Returns:
            Dictionary containing response and metadata
        """
        model = model or AIConfig.DEFAULT_MODEL
        temperature = temperature if temperature is not None else AIConfig.DEFAULT_TEMPERATURE
        max_tokens = max_tokens or AIConfig.DEFAULT_MAX_TOKENS
        
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = self._call_api_with_retry(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            return {
                "success": True,
                "content": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                },
                "finish_reason": response.choices[0].finish_reason
            }
            
        except Exception as e:
            logger.error(f"Error generating completion: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "content": None
            }
    
    def generate_with_task_type(
        self,
        prompt: str,
        task_type: AITaskType,
        model_override: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate completion with task-specific configuration
        
        Args:
            prompt: The user prompt
            task_type: Type of AI task (determines model and parameters)
            model_override: Override the default model for this task
            **kwargs: Additional parameters
            
        Returns:
            Dictionary containing response and metadata
        """
        model = model_override or AIConfig.get_model_for_task(task_type)
        temperature = AIConfig.get_temperature_for_task(task_type)
        
        logger.info(f"Generating completion for task: {task_type.value} using model: {model}")
        
        return self.generate_completion(
            prompt=prompt,
            model=model,
            temperature=temperature,
            **kwargs
        )
    
    def generate_exercises(
        self,
        topic: str,
        difficulty: str,
        count: int = 5,
        language: str = "Vedda"
    ) -> Dict[str, Any]:
        """
        Generate learning exercises for a specific topic
        
        Args:
            topic: The topic to generate exercises for
            difficulty: Difficulty level (beginner, intermediate, advanced)
            count: Number of exercises to generate
            language: Target language
            
        Returns:
            Dictionary containing generated exercises
        """
        system_message = (
            "You are an expert language teacher specializing in creating "
            "engaging and effective learning exercises."
        )
        
        prompt = f"""Generate {count} {difficulty}-level exercises for learning {language} language.
        
Topic: {topic}

For each exercise, provide:
1. Exercise type (translation, fill-in-blank, matching, etc.)
2. Question/prompt
3. Correct answer
4. Brief explanation

Format the response as a structured JSON array."""
        
        return self.generate_with_task_type(
            prompt=prompt,
            task_type=AITaskType.EXERCISE_GENERATION,
            system_message=system_message,
            max_tokens=2000
        )
    
    def correct_mistakes(
        self,
        user_input: str,
        correct_answer: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Provide detailed correction and explanation for user mistakes
        
        Args:
            user_input: The user's answer
            correct_answer: The correct answer
            context: Optional context about the exercise
            
        Returns:
            Dictionary containing correction and explanation
        """
        system_message = (
            "You are a patient and encouraging language tutor. "
            "Provide constructive feedback and clear explanations."
        )
        
        prompt = f"""Analyze the user's answer and provide feedback.

User's Answer: {user_input}
Correct Answer: {correct_answer}
{f'Context: {context}' if context else ''}

Provide:
1. What was incorrect
2. Why it was incorrect
3. The correct form
4. Tips to avoid this mistake in the future

Be encouraging and educational."""
        
        return self.generate_with_task_type(
            prompt=prompt,
            task_type=AITaskType.MISTAKE_CORRECTION,
            system_message=system_message
        )
    
    def generate_summary(
        self,
        content: str,
        summary_type: str = "brief"
    ) -> Dict[str, Any]:
        """
        Generate a summary of learning content
        
        Args:
            content: The content to summarize
            summary_type: Type of summary (brief, detailed, key_points)
            
        Returns:
            Dictionary containing the summary
        """
        system_message = "You are an expert at creating clear and concise summaries."
        
        prompt = f"""Create a {summary_type} summary of the following content:

{content}

Focus on key learning points and important concepts."""
        
        return self.generate_with_task_type(
            prompt=prompt,
            task_type=AITaskType.SUMMARY_GENERATION,
            system_message=system_message
        )
    
    def generate_learning_path(
        self,
        current_level: str,
        goals: List[str],
        time_available: str
    ) -> Dict[str, Any]:
        """
        Generate a personalized learning path
        
        Args:
            current_level: User's current proficiency level
            goals: List of learning goals
            time_available: Available time for learning
            
        Returns:
            Dictionary containing the learning path
        """
        system_message = (
            "You are an expert educational consultant specializing in "
            "creating personalized learning paths."
        )
        
        goals_str = "\n".join([f"- {goal}" for goal in goals])
        
        prompt = f"""Create a personalized learning path with the following parameters:

Current Level: {current_level}
Learning Goals:
{goals_str}
Available Time: {time_available}

Provide:
1. Recommended learning sequence
2. Time allocation for each topic
3. Milestones and checkpoints
4. Resources and practice suggestions

Format as a structured plan."""
        
        return self.generate_with_task_type(
            prompt=prompt,
            task_type=AITaskType.LEARNING_PATH,
            system_message=system_message,
            max_tokens=2000
        )
    
    def _call_api_with_retry(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float,
        max_tokens: int,
        **kwargs
    ):
        """
        Call OpenAI API with retry logic
        
        Args:
            messages: List of message dictionaries
            model: Model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens
            **kwargs: Additional parameters
            
        Returns:
            API response
            
        Raises:
            Exception: If all retries fail
        """
        last_exception = None
        
        for attempt in range(AIConfig.MAX_RETRIES):
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    top_p=kwargs.get('top_p', AIConfig.DEFAULT_TOP_P),
                    frequency_penalty=kwargs.get('frequency_penalty', AIConfig.DEFAULT_FREQUENCY_PENALTY),
                    presence_penalty=kwargs.get('presence_penalty', AIConfig.DEFAULT_PRESENCE_PENALTY),
                    timeout=AIConfig.REQUEST_TIMEOUT
                )
                return response
                
            except RateLimitError as e:
                logger.warning(f"Rate limit hit on attempt {attempt + 1}: {str(e)}")
                last_exception = e
                if attempt < AIConfig.MAX_RETRIES - 1:
                    time.sleep(AIConfig.RETRY_DELAY * (attempt + 1))
                    
            except APIConnectionError as e:
                logger.warning(f"Connection error on attempt {attempt + 1}: {str(e)}")
                last_exception = e
                if attempt < AIConfig.MAX_RETRIES - 1:
                    time.sleep(AIConfig.RETRY_DELAY)
                    
            except APIError as e:
                logger.error(f"API error on attempt {attempt + 1}: {str(e)}")
                last_exception = e
                if attempt < AIConfig.MAX_RETRIES - 1:
                    time.sleep(AIConfig.RETRY_DELAY)
                else:
                    raise
                    
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
                raise
        
        # If all retries failed, raise the last exception
        raise last_exception
    
    def test_connection(self) -> bool:
        """
        Test the connection to OpenAI API
        
        Returns:
            True if connection is successful, False otherwise
        """
        try:
            response = self.generate_completion(
                prompt="Say 'Hello'",
                max_tokens=10
            )
            return response.get("success", False)
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return False
