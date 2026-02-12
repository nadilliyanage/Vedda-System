import os
import argparse
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix
)

# =========================
# CONFIG
# =========================

ALLOWED_LABELS = [
    "spelling_error",
    "wrong_question_word",
    "wrong_verb_form",
    "missing_word",
    "word_order_error",
    "wrong_word",
    "other"
]

MODEL_OUT_PATH = "../app/ml/mistake_classifier_lr.joblib"


# =========================
# UTIL FUNCTIONS
# =========================

def build_input_text(correct_answer: str, student_answer: str) -> str:
    """
    Combine correct + student answer into one lowercase string.
    Makes training and inference case-insensitive.
    """
    ca = (correct_answer or "").strip().lower()
    sa = (student_answer or "").strip().lower()
    return f"correct: {ca} || student: {sa}"



def load_and_clean_data(csv_path: str) -> pd.DataFrame:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found: {csv_path}")

    df = pd.read_csv(csv_path)

    required_cols = {"correct_answer", "student_answer", "error_type"}
    if not required_cols.issubset(df.columns):
        raise ValueError(f"CSV must contain columns: {required_cols}")

    # Normalize text
    df["correct_answer"] = df["correct_answer"].fillna("").astype(str).str.strip().str.lower()
    df["student_answer"] = df["student_answer"].fillna("").astype(str).str.strip().str.lower()
    df["error_type"] = df["error_type"].fillna("").astype(str).str.strip()

    # Keep only allowed labels
    df = df[df["error_type"].isin(ALLOWED_LABELS)].copy()

    # Remove duplicates
    df = df.drop_duplicates(
        subset=["correct_answer", "student_answer", "error_type"]
    ).reset_index(drop=True)

    # Build model input
    df["input_text"] = df.apply(
        lambda r: build_input_text(r["correct_answer"], r["student_answer"]),
        axis=1
    )

    return df


# =========================
# TRAINING
# =========================

def train_model(df: pd.DataFrame, test_size=0.2, random_state=42):
    X = df["input_text"]
    y = df["error_type"]

    # SAFETY CHECK
    if y.nunique() < 2:
        raise ValueError(
            "Dataset contains only one label. Add more labels to train multi-class classifier."
        )

    print("\n===== LABEL DISTRIBUTION =====")
    print(y.value_counts())
    print("\n===== LABEL DISTRIBUTION (%) =====")
    print((y.value_counts(normalize=True) * 100).round(2))

    # ---- FIX: handle labels with < 2 samples ----
    label_counts = y.value_counts()
    rare_labels = label_counts[label_counts < 2].index.tolist()

    if rare_labels:
        print(f"\n⚠️ Rare labels (<2 samples) kept in TRAIN only: {rare_labels}")

        rare_mask = y.isin(rare_labels)
        X_rare = X[rare_mask]
        y_rare = y[rare_mask]

        X_common = X[~rare_mask]
        y_common = y[~rare_mask]

        if y_common.nunique() < 2:
            raise ValueError(
                "After removing rare labels, not enough label variety for stratified split."
            )

        X_train, X_test, y_train, y_test = train_test_split(
            X_common,
            y_common,
            test_size=test_size,
            random_state=random_state,
            stratify=y_common
        )

        # Add rare samples back into TRAIN set
        X_train = pd.concat([X_train, X_rare], ignore_index=True)
        y_train = pd.concat([y_train, y_rare], ignore_index=True)

    else:
        # Normal stratified split
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            stratify=y
        )

    # TF-IDF Vectorizer (shared across all classifiers)
    tfidf = TfidfVectorizer(
        analyzer="char",
        ngram_range=(3, 6),
        sublinear_tf=True,
        max_features=50000
    )
    
    # Transform features once
    print("\nTransforming features with TF-IDF...")
    X_train_tfidf = tfidf.fit_transform(X_train)
    X_test_tfidf = tfidf.transform(X_test)
    
    # Define individual classifiers for the ensemble
    print("\n===== BUILDING HYBRID ENSEMBLE MODEL =====")
    print("Combining: Logistic Regression + Random Forest + Gradient Boosting")
    
    lr_clf = LogisticRegression(
        max_iter=3000,
        solver="lbfgs",
        class_weight="balanced",
        random_state=42
    )
    
    rf_clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    
    gb_clf = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    
    # Create ensemble with soft voting (uses probability estimates)
    ensemble = VotingClassifier(
        estimators=[
            ('lr', lr_clf),
            ('rf', rf_clf),
            ('gb', gb_clf)
        ],
        voting='soft',
        n_jobs=-1
    )
    
    print("\nTraining ensemble model...")
    ensemble.fit(X_train_tfidf, y_train)
    
    # Create pipeline wrapper for consistent interface
    pipeline = Pipeline([
        ('tfidf', tfidf),
        ('ensemble', ensemble)
    ])
    
    # Note: We already trained on tfidf features, so we'll use the trained ensemble
    # Update pipeline with trained components
    pipeline.named_steps['ensemble'] = ensemble
    
    # Evaluation on ensemble
    y_pred = ensemble.predict(X_test_tfidf)
    
    # Also evaluate individual models for comparison
    print("\n===== INDIVIDUAL MODEL PERFORMANCE =====")
    for name, clf in [('Logistic Regression', lr_clf), ('Random Forest', rf_clf), ('Gradient Boosting', gb_clf)]:
        clf.fit(X_train_tfidf, y_train)
        y_pred_individual = clf.predict(X_test_tfidf)
        acc_individual = accuracy_score(y_test, y_pred_individual)
        f1_individual = f1_score(y_test, y_pred_individual, average="macro")
        print(f"{name:25s} - Accuracy: {acc_individual:.4f}, Macro F1: {f1_individual:.4f}")

    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")

    print("\n===== HYBRID ENSEMBLE RESULTS =====")
    print(f"Ensemble Accuracy : {acc:.4f}")
    print(f"Ensemble Macro F1 : {macro_f1:.4f}")

    print("\n===== CLASSIFICATION REPORT =====")
    print(
        classification_report(
            y_test,
            y_pred,
            labels=ALLOWED_LABELS,   # consistent reporting
            digits=4,
            zero_division=0
        )
    )

    cm = confusion_matrix(y_test, y_pred, labels=ALLOWED_LABELS)
    cm_df = pd.DataFrame(cm, index=ALLOWED_LABELS, columns=ALLOWED_LABELS)

    print("\n===== CONFUSION MATRIX =====")
    print(cm_df)

    return pipeline, acc, macro_f1, cm_df


# =========================
# SAVE
# =========================

def save_model(model):
    os.makedirs(os.path.dirname(MODEL_OUT_PATH), exist_ok=True)
    joblib.dump(model, MODEL_OUT_PATH)
    print(f"\n✅ Model saved to: {MODEL_OUT_PATH}")


# =========================
# MAIN
# =========================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data",
        type=str,
        default="data/mistake_dataset_clean.csv",
        help="Path to cleaned dataset CSV"
    )
    parser.add_argument(
        "--test_size",
        type=float,
        default=0.2,
        help="Test split ratio"
    )
    args = parser.parse_args()

    df = load_and_clean_data(args.data)
    print(f"\nLoaded dataset with {len(df)} rows")

    model, acc, macro_f1, cm_df = train_model(
        df,
        test_size=args.test_size
    )

    save_model(model)

    # =========================
    # SAMPLE PREDICTION
    # =========================

    sample_correct = "botakanda"
    sample_student = "botakandaa"

    pred = model.predict([build_input_text(sample_correct, sample_student)])[0]
    proba = model.predict_proba(
        [build_input_text(sample_correct, sample_student)]
    ).max()

    print("\n===== SAMPLE PREDICTION =====")
    print("Correct :", sample_correct)
    print("Student :", sample_student)
    print("Predicted label:", pred)
    print("Confidence:", round(float(proba), 4))


if __name__ == "__main__":
    main()
