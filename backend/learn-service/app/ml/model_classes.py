"""
Shared model classes for mistake classifier.
These classes are used both during training and inference.
They need to be in a stable module path so pickle can find them when loading.
"""
import numpy as np
from scipy.sparse import hstack, csr_matrix
from sklearn.base import BaseEstimator, TransformerMixin


def compute_word_order_features(correct_answer: str, student_answer: str) -> dict:
    """
    Compute features that help detect word order errors.
    Returns dictionary of engineered features.
    """
    ca = (correct_answer or "").strip().lower()
    sa = (student_answer or "").strip().lower()

    correct_words = ca.split()
    student_words = sa.split()

    correct_set = set(correct_words)
    student_set = set(student_words)

    intersection = len(correct_set & student_set)
    union = len(correct_set | student_set)
    jaccard_sim = intersection / union if union > 0 else 0

    same_words = 1.0 if correct_set == student_set and len(correct_set) > 0 else 0.0

    word_count_diff = abs(len(correct_words) - len(student_words))

    position_mismatches = 0
    min_len = min(len(correct_words), len(student_words))
    for i in range(min_len):
        if correct_words[i] != student_words[i]:
            position_mismatches += 1

    position_mismatch_ratio = position_mismatches / min_len if min_len > 0 else 0

    word_order_signal = 1.0 if (same_words and position_mismatch_ratio > 0) else 0.0

    char_diff = sum(1 for c1, c2 in zip(ca, sa) if c1 != c2)
    max_len = max(len(ca), len(sa))
    char_diff_ratio = char_diff / max_len if max_len > 0 else 0

    missing_words = len(correct_set - student_set)
    extra_words = len(student_set - correct_set)

    # Strong indicators for missing/extra word errors
    has_missing_words = 1.0 if missing_words > 0 else 0.0
    has_extra_words = 1.0 if extra_words > 0 else 0.0

    # Combined indicator: student has different word count (missing or extra)
    word_count_mismatch = 1.0 if (missing_words > 0 or extra_words > 0) else 0.0

    def get_word_bigrams(words):
        return set(tuple(words[i:i+2]) for i in range(len(words)-1)) if len(words) > 1 else set()

    correct_bigrams = get_word_bigrams(correct_words)
    student_bigrams = get_word_bigrams(student_words)

    bigram_overlap = len(correct_bigrams & student_bigrams)
    bigram_total = len(correct_bigrams | student_bigrams)
    bigram_sim = bigram_overlap / bigram_total if bigram_total > 0 else 1.0

    word_order_disruption = (1 - bigram_sim) if same_words else 0.0

    return {
        'jaccard_sim': jaccard_sim,
        'same_words': same_words,
        'word_count_diff': word_count_diff,
        'position_mismatch_ratio': position_mismatch_ratio,
        'word_order_signal': word_order_signal,
        'char_diff_ratio': char_diff_ratio,
        'missing_words': missing_words,
        'extra_words': extra_words,
        'bigram_sim': bigram_sim,
        'word_order_disruption': word_order_disruption,
        'has_missing_words': has_missing_words,
        'has_extra_words': has_extra_words,
        'word_count_mismatch': word_count_mismatch
    }


class WordOrderFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Custom transformer that extracts word-order related features.
    """
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        features = []
        for text in X:
            parts = text.split(" || ")
            if len(parts) == 2:
                correct = parts[0].replace("correct: ", "")
                student = parts[1].replace("student: ", "")
            else:
                correct = ""
                student = text

            feat_dict = compute_word_order_features(correct, student)
            features.append([
                feat_dict['jaccard_sim'],
                feat_dict['same_words'],
                feat_dict['word_count_diff'],
                feat_dict['position_mismatch_ratio'],
                feat_dict['word_order_signal'],
                feat_dict['char_diff_ratio'],
                feat_dict['missing_words'],
                feat_dict['extra_words'],
                feat_dict['bigram_sim'],
                feat_dict['word_order_disruption'],
                feat_dict['has_missing_words'],
                feat_dict['has_extra_words'],
                feat_dict['word_count_mismatch']
            ])
        return csr_matrix(np.array(features))


class MistakeClassifierModel:
    """
    Wrapper class that combines all transformers and ensemble for easy prediction.
    """
    def __init__(self, char_tfidf, word_tfidf, word_order_extractor, ensemble):
        self.char_tfidf = char_tfidf
        self.word_tfidf = word_tfidf
        self.word_order_extractor = word_order_extractor
        self.ensemble = ensemble
        self.classes_ = ensemble.classes_

    def _transform_features(self, X):
        """Transform input text to combined features."""
        X_char = self.char_tfidf.transform(X)
        X_word = self.word_tfidf.transform(X)
        X_order = self.word_order_extractor.transform(X)
        return hstack([X_char, X_word, X_order])

    def predict(self, X):
        """Predict error type for input texts."""
        X_combined = self._transform_features(X)
        return self.ensemble.predict(X_combined)

    def predict_proba(self, X):
        """Predict probability distributions for input texts."""
        X_combined = self._transform_features(X)
        return self.ensemble.predict_proba(X_combined)

