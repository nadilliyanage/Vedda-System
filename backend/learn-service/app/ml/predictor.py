import os
import joblib

from app.ml.model_classes import (
    WordOrderFeatureExtractor,
    MistakeClassifierModel,
    compute_word_order_features
)

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

        loaded = joblib.load(MODEL_PATH)

        # Handle both old (wrapper class) and new (dictionary) formats
        if isinstance(loaded, dict) and 'char_tfidf' in loaded:
            # New dictionary format - create wrapper locally
            _MODEL = MistakeClassifierModel(
                char_tfidf=loaded['char_tfidf'],
                word_tfidf=loaded['word_tfidf'],
                word_order_extractor=loaded['word_order_extractor'],
                ensemble=loaded['ensemble']
            )
        else:
            # Old format - already a MistakeClassifierModel instance
            _MODEL = loaded

    return _MODEL


def classify_mistake(correct_answer: str, student_answer: str) -> str:
    model = load_model()
    text = f"correct: {(correct_answer or '').strip().lower()} || student: {(student_answer or '').strip().lower()}"
    probs = model.predict_proba([text])[0]
    confidence = float(probs.max())
    print(confidence)
    return model.predict([text])[0]
