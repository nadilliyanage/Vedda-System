import os
import joblib

_MODEL = None
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "mistake_classifier_lr.joblib"
)

def load_model():
    global _MODEL
    if _MODEL is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError("Mistake classifier model not found.")
        _MODEL = joblib.load(MODEL_PATH)
    return _MODEL


def classify_mistake(correct_answer: str, student_answer: str) -> str:
    model = load_model()
    text = f"correct: {(correct_answer or '').strip().lower()} || student: {(student_answer or '').strip().lower()}"
    probs = model.predict_proba([text])[0]
    confidence = float(probs.max())
    print(confidence)
    return model.predict([text])[0]
