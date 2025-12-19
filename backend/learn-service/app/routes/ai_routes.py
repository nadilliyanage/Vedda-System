"""
AI Routes Module
Flask endpoints for AI-powered learning features
"""
from flask import Blueprint, request, jsonify
from app.AI import AIService, AIConfig
from app.AI.ai_config import AITaskType
import logging

logger = logging.getLogger(__name__)

ai_routes = Blueprint("ai_routes", __name__, url_prefix="/api/ai")

# Initialize AI Service (singleton pattern)
ai_service = None


def get_ai_service():
    """Get or create AI service instance"""
    global ai_service
    if ai_service is None:
        try:
            if not AIConfig.validate_config():
                raise ValueError("AI configuration is invalid. Check OPENAI_API_KEY.")
            ai_service = AIService()
        except Exception as e:
            logger.error(f"Failed to initialize AI service: {str(e)}")
            raise
    return ai_service


@ai_routes.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint for AI service
    
    Returns:
        JSON response with service status
    """
    try:
        service = get_ai_service()
        is_healthy = service.test_connection()
        
        return jsonify({
            "success": True,
            "status": "healthy" if is_healthy else "degraded",
            "message": "AI service is operational" if is_healthy else "AI service connection issues"
        }), 200 if is_healthy else 503
        
    except Exception as e:
        return jsonify({
            "success": False,
            "status": "error",
            "message": str(e)
        }), 500


@ai_routes.route("/generate", methods=["POST"])
def generate_completion():
    """
    Generate a completion using AI
    
    Expected JSON body:
    {
        "prompt": "Your prompt here",
        "model": "gpt-4o-mini" (optional),
        "temperature": 0.7 (optional),
        "max_tokens": 1000 (optional),
        "system_message": "System context" (optional)
    }
    
    Returns:
        JSON response with AI-generated content
    """
    try:
        data = request.get_json()
        
        if not data or "prompt" not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: prompt"
            }), 400
        
        service = get_ai_service()
        
        result = service.generate_completion(
            prompt=data["prompt"],
            model=data.get("model"),
            temperature=data.get("temperature"),
            max_tokens=data.get("max_tokens"),
            system_message=data.get("system_message")
        )
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error in generate_completion: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ai_routes.route("/exercises/generate", methods=["POST"])
def generate_exercises():
    """
    Generate learning exercises
    
    Expected JSON body:
    {
        "topic": "Vedda greetings",
        "difficulty": "beginner",
        "count": 5,
        "language": "Vedda"
    }
    
    Returns:
        JSON response with generated exercises
    """
    try:
        data = request.get_json()
        
        if not data or "topic" not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: topic"
            }), 400
        
        service = get_ai_service()
        
        result = service.generate_exercises(
            topic=data["topic"],
            difficulty=data.get("difficulty", "beginner"),
            count=data.get("count", 5),
            language=data.get("language", "Vedda")
        )
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error in generate_exercises: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ai_routes.route("/corrections/analyze", methods=["POST"])
def analyze_mistakes():
    """
    Analyze and correct user mistakes
    
    Expected JSON body:
    {
        "user_input": "User's answer",
        "correct_answer": "Correct answer",
        "context": "Optional context" (optional)
    }
    
    Returns:
        JSON response with correction and explanation
    """
    try:
        data = request.get_json()
        
        required_fields = ["user_input", "correct_answer"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        service = get_ai_service()
        
        result = service.correct_mistakes(
            user_input=data["user_input"],
            correct_answer=data["correct_answer"],
            context=data.get("context")
        )
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error in analyze_mistakes: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ai_routes.route("/summary/generate", methods=["POST"])
def generate_summary():
    """
    Generate a summary of learning content
    
    Expected JSON body:
    {
        "content": "Content to summarize",
        "summary_type": "brief" (optional: brief, detailed, key_points)
    }
    
    Returns:
        JSON response with generated summary
    """
    try:
        data = request.get_json()
        
        if not data or "content" not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: content"
            }), 400
        
        service = get_ai_service()
        
        result = service.generate_summary(
            content=data["content"],
            summary_type=data.get("summary_type", "brief")
        )
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error in generate_summary: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ai_routes.route("/learning-path/generate", methods=["POST"])
def generate_learning_path():
    """
    Generate a personalized learning path
    
    Expected JSON body:
    {
        "current_level": "beginner",
        "goals": ["Learn basic vocabulary", "Understand grammar"],
        "time_available": "30 minutes per day"
    }
    
    Returns:
        JSON response with personalized learning path
    """
    try:
        data = request.get_json()
        
        required_fields = ["current_level", "goals", "time_available"]
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        if not isinstance(data["goals"], list):
            return jsonify({
                "success": False,
                "error": "goals must be a list of strings"
            }), 400
        
        service = get_ai_service()
        
        result = service.generate_learning_path(
            current_level=data["current_level"],
            goals=data["goals"],
            time_available=data["time_available"]
        )
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Error in generate_learning_path: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ai_routes.route("/models", methods=["GET"])
def list_models():
    """
    List available AI models and task configurations
    
    Returns:
        JSON response with model information
    """
    try:
        from app.AI.ai_config import AIModel
        
        models = [model.value for model in AIModel]
        task_mapping = {
            task.value: AIConfig.get_model_for_task(task) 
            for task in AITaskType
        }
        
        return jsonify({
            "success": True,
            "available_models": models,
            "default_model": AIConfig.DEFAULT_MODEL,
            "task_model_mapping": task_mapping
        }), 200
        
    except Exception as e:
        logger.error(f"Error in list_models: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
