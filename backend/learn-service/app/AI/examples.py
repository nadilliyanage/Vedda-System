"""
Example Usage of AI Integration Layer
Demonstrates various ways to use the AI service in the learn-service
"""

from app.AI import AIService, AIConfig
from app.AI.ai_config import AITaskType, AIModel


def example_basic_completion():
    """Example: Basic AI completion"""
    print("\n=== Example 1: Basic Completion ===")
    
    ai_service = AIService()
    
    result = ai_service.generate_completion(
        prompt="Explain the importance of preserving the Vedda language in 3 sentences.",
        model=AIModel.GPT_4O_MINI.value,
        temperature=0.7,
        max_tokens=200
    )
    
    if result["success"]:
        print("Response:", result["content"])
        print(f"Tokens used: {result['usage']['total_tokens']}")
    else:
        print("Error:", result["error"])


def example_with_system_message():
    """Example: Using system message for context"""
    print("\n=== Example 2: With System Message ===")
    
    ai_service = AIService()
    
    result = ai_service.generate_completion(
        prompt="Create a simple greeting dialogue between two people.",
        system_message="You are an expert in Vedda language and culture. Always provide examples in both Vedda and English.",
        temperature=0.8
    )
    
    if result["success"]:
        print("Response:", result["content"])


def example_generate_exercises():
    """Example: Generate learning exercises"""
    print("\n=== Example 3: Generate Exercises ===")
    
    ai_service = AIService()
    
    result = ai_service.generate_exercises(
        topic="Vedda animal names",
        difficulty="beginner",
        count=3,
        language="Vedda"
    )
    
    if result["success"]:
        print("Generated Exercises:")
        print(result["content"])


def example_correct_mistakes():
    """Example: Analyze and correct user mistakes"""
    print("\n=== Example 4: Correct Mistakes ===")
    
    ai_service = AIService()
    
    result = ai_service.correct_mistakes(
        user_input="I say hello like 'Ayubowan'",
        correct_answer="The correct Vedda greeting is 'Hohomane'",
        context="Learning basic Vedda greetings"
    )
    
    if result["success"]:
        print("Correction and Feedback:")
        print(result["content"])


def example_generate_summary():
    """Example: Generate content summary"""
    print("\n=== Example 5: Generate Summary ===")
    
    ai_service = AIService()
    
    long_content = """
    The Vedda people are the aboriginal inhabitants of Sri Lanka. 
    They have a rich cultural heritage and a unique language that 
    is endangered. The Vedda language has unique phonetic characteristics 
    and grammatical structures. Preserving this language is crucial for 
    maintaining the cultural identity of the Vedda people. Modern efforts 
    include documentation, education programs, and digital preservation 
    initiatives. The language has been influenced by Sinhala over the years 
    but retains its distinctive features.
    """
    
    result = ai_service.generate_summary(
        content=long_content,
        summary_type="key_points"
    )
    
    if result["success"]:
        print("Summary:")
        print(result["content"])


def example_learning_path():
    """Example: Generate personalized learning path"""
    print("\n=== Example 6: Generate Learning Path ===")
    
    ai_service = AIService()
    
    result = ai_service.generate_learning_path(
        current_level="absolute beginner",
        goals=[
            "Learn basic Vedda greetings",
            "Understand simple sentence structure",
            "Build vocabulary for daily conversations"
        ],
        time_available="20 minutes per day for 3 months"
    )
    
    if result["success"]:
        print("Personalized Learning Path:")
        print(result["content"])


def example_task_based_generation():
    """Example: Using task-based generation"""
    print("\n=== Example 7: Task-Based Generation ===")
    
    ai_service = AIService()
    
    # The service automatically selects the best model and parameters
    result = ai_service.generate_with_task_type(
        prompt="Create 3 translation exercises from English to Vedda",
        task_type=AITaskType.EXERCISE_GENERATION
    )
    
    if result["success"]:
        print("Task-Based Generation:")
        print(result["content"])
        print(f"Model used: {result['model']}")


def example_model_switching():
    """Example: Switching models at runtime"""
    print("\n=== Example 8: Model Switching ===")
    
    ai_service = AIService()
    
    prompt = "What are the key features of Vedda language?"
    
    # Try with different models
    models = [AIModel.GPT_4O_MINI.value, AIModel.GPT_4O.value]
    
    for model in models:
        result = ai_service.generate_completion(
            prompt=prompt,
            model=model,
            max_tokens=100
        )
        
        if result["success"]:
            print(f"\nUsing {model}:")
            print(result["content"])
            print(f"Tokens: {result['usage']['total_tokens']}")


def example_custom_parameters():
    """Example: Using custom parameters"""
    print("\n=== Example 9: Custom Parameters ===")
    
    ai_service = AIService()
    
    result = ai_service.generate_completion(
        prompt="Create a creative story about Vedda culture",
        model=AIModel.GPT_4O.value,
        temperature=0.9,  # High creativity
        max_tokens=300,
        top_p=0.95,
        frequency_penalty=0.5,  # Reduce repetition
        presence_penalty=0.5    # Encourage topic diversity
    )
    
    if result["success"]:
        print("Creative Story:")
        print(result["content"])


def example_error_handling():
    """Example: Proper error handling"""
    print("\n=== Example 10: Error Handling ===")
    
    try:
        ai_service = AIService()
        
        # Example with invalid parameters
        result = ai_service.generate_completion(
            prompt="",  # Empty prompt
            max_tokens=10
        )
        
        if result["success"]:
            print("Success:", result["content"])
        else:
            print("Error occurred:", result["error"])
            
    except Exception as e:
        print(f"Exception caught: {str(e)}")


def example_integration_with_flask():
    """
    Example: How to integrate in Flask routes
    This is pseudocode showing the pattern
    """
    print("\n=== Example 11: Flask Integration Pattern ===")
    
    print("""
    from flask import Blueprint, request, jsonify
    from app.AI import AIService
    
    @app.route('/api/custom-ai', methods=['POST'])
    def custom_ai_endpoint():
        data = request.get_json()
        
        # Initialize service (use singleton in production)
        ai_service = AIService()
        
        # Call appropriate method
        result = ai_service.generate_completion(
            prompt=data['prompt'],
            model=data.get('model'),
            temperature=data.get('temperature')
        )
        
        return jsonify(result), 200 if result['success'] else 500
    """)


def run_all_examples():
    """Run all examples"""
    print("=" * 60)
    print("AI Integration Layer - Usage Examples")
    print("=" * 60)
    
    # Check if configuration is valid
    if not AIConfig.validate_config():
        print("\n⚠️  WARNING: OPENAI_API_KEY not set!")
        print("Please set OPENAI_API_KEY in your environment variables.")
        print("Examples will not work without a valid API key.")
        return
    
    # Run examples
    examples = [
        example_basic_completion,
        example_with_system_message,
        example_generate_exercises,
        example_correct_mistakes,
        example_generate_summary,
        example_learning_path,
        example_task_based_generation,
        example_model_switching,
        example_custom_parameters,
        example_error_handling,
        example_integration_with_flask
    ]
    
    for example in examples:
        try:
            example()
        except Exception as e:
            print(f"\nError in {example.__name__}: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_examples()
