"""
AI Configuration Module
Manages AI model configurations and settings
"""
import os
from enum import Enum


class AIModel(Enum):
    """Enum for supported AI models"""
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    GPT_35_TURBO = "gpt-3.5-turbo"


class AITaskType(Enum):
    """Enum for different AI task types"""
    EXERCISE_GENERATION = "exercise_generation"
    MISTAKE_CORRECTION = "mistake_correction"
    SUMMARY_GENERATION = "summary_generation"
    TRANSLATION_HELP = "translation_help"
    LEARNING_PATH = "learning_path"
    CUSTOM = "custom"


class AIConfig:
    """
    AI Configuration class for managing model selection and settings
    """
    
    # API Configuration
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
    OPENAI_ORGANIZATION = os.environ.get("OPENAI_ORGANIZATION", None)
    
    # Default models for different tasks
    DEFAULT_MODEL = AIModel.GPT_4O_MINI.value
    
    # Task-specific model mapping (can be overridden at runtime)
    TASK_MODEL_MAPPING = {
        AITaskType.EXERCISE_GENERATION: AIModel.GPT_4O.value,
        AITaskType.MISTAKE_CORRECTION: AIModel.GPT_4O_MINI.value,
        AITaskType.SUMMARY_GENERATION: AIModel.GPT_4O_MINI.value,
        AITaskType.TRANSLATION_HELP: AIModel.GPT_4O.value,
        AITaskType.LEARNING_PATH: AIModel.GPT_4O.value,
        AITaskType.CUSTOM: AIModel.GPT_4O_MINI.value,
    }
    
    # Model parameters
    DEFAULT_TEMPERATURE = 0.7
    DEFAULT_MAX_TOKENS = 1000
    DEFAULT_TOP_P = 1.0
    DEFAULT_FREQUENCY_PENALTY = 0.0
    DEFAULT_PRESENCE_PENALTY = 0.0
    
    # Task-specific temperature settings
    TASK_TEMPERATURE_MAPPING = {
        AITaskType.EXERCISE_GENERATION: 0.8,  # More creative
        AITaskType.MISTAKE_CORRECTION: 0.3,   # More deterministic
        AITaskType.SUMMARY_GENERATION: 0.5,   # Balanced
        AITaskType.TRANSLATION_HELP: 0.4,     # Precise
        AITaskType.LEARNING_PATH: 0.7,        # Moderately creative
        AITaskType.CUSTOM: 0.7,
    }
    
    # Rate limiting and retry settings
    MAX_RETRIES = 3
    RETRY_DELAY = 1  # seconds
    REQUEST_TIMEOUT = 30  # seconds
    
    @staticmethod
    def get_model_for_task(task_type: AITaskType) -> str:
        """
        Get the appropriate model for a specific task type
        
        Args:
            task_type: The type of AI task
            
        Returns:
            Model name as string
        """
        return AIConfig.TASK_MODEL_MAPPING.get(
            task_type, 
            AIConfig.DEFAULT_MODEL
        )
    
    @staticmethod
    def get_temperature_for_task(task_type: AITaskType) -> float:
        """
        Get the appropriate temperature for a specific task type
        
        Args:
            task_type: The type of AI task
            
        Returns:
            Temperature value
        """
        return AIConfig.TASK_TEMPERATURE_MAPPING.get(
            task_type,
            AIConfig.DEFAULT_TEMPERATURE
        )
    
    @staticmethod
    def validate_config() -> bool:
        """
        Validate that required configuration is present
        
        Returns:
            True if configuration is valid, False otherwise
        """
        if not AIConfig.OPENAI_API_KEY:
            return False
        return True
