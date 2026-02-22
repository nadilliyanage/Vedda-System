"""
Test script to verify exercise variety
Run this with the service running to test if exercises are different
"""

import requests
import json
import time

url = 'http://localhost:5006/api/learn/ai/generate-personalized-exercise'
user_id = '691afa88b01da8476e135ba7'

print("Testing Exercise Variety")
print("=" * 60)

exercises = []

for i in range(3):
    print(f"\nGenerating Exercise {i+1}...")

    try:
        response = requests.post(url, json={"user_id": user_id})

        if response.status_code == 200:
            data = response.json()
            exercise = data.get("exercise", {})
            question = exercise.get("question", {})

            prompt = question.get("prompt", "")
            options = question.get("options", [])
            correct_answer = question.get("correct_answer", "")

            exercises.append({
                "prompt": prompt,
                "correct_answer": correct_answer,
                "all_options": [opt.get("text") for opt in options]
            })

            print(f"  Prompt: {prompt}")
            print(f"  Correct Answer: {correct_answer}")
            print(f"  Options: {[opt.get('text') for opt in options]}")

        else:
            print(f"  Error: {response.status_code}")
            print(f"  Response: {response.text}")

    except Exception as e:
        print(f"  Exception: {e}")

    # Wait a bit between requests
    if i < 2:
        time.sleep(2)

print("\n" + "=" * 60)
print("VARIETY CHECK")
print("=" * 60)

# Check if all exercises are different
prompts = [e["prompt"] for e in exercises]
answers = [e["correct_answer"] for e in exercises]

unique_prompts = len(set(prompts))
unique_answers = len(set(answers))

print(f"\nUnique Prompts: {unique_prompts}/{len(prompts)}")
print(f"Unique Answers: {unique_answers}/{len(answers)}")

if unique_prompts == len(prompts) and unique_answers == len(answers):
    print("\n✓ SUCCESS: All exercises are different!")
else:
    print("\n⚠ WARNING: Some exercises are the same")
    print("\nPrompts:")
    for i, p in enumerate(prompts, 1):
        print(f"  {i}. {p}")
    print("\nAnswers:")
    for i, a in enumerate(answers, 1):
        print(f"  {i}. {a}")

