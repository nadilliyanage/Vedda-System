import os
import argparse
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
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
    "word_order_error",
    "missing_word",
    "other"
]

MODEL_OUT_PATH = "../app/ml/mistake_classifier_llr.joblib"


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

    # TF-IDF for standalone baselines: word-level unigrams/bigrams
    # provide a higher-level view of each sample
    tfidf_baseline = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        sublinear_tf=True,
        max_features=8000
    )

    X_train_baseline = tfidf_baseline.fit_transform(X_train)
    X_test_baseline  = tfidf_baseline.transform(X_test)

    rf_individual = RandomForestClassifier(
        n_estimators=30,
        max_depth=4,
        min_samples_split=10,
        max_features="sqrt",
        class_weight="balanced",
        random_state=7,
        n_jobs=-1
    )
    rf_individual.fit(X_train_baseline, y_train)
    y_pred_individual = rf_individual.predict(X_test_baseline)
    acc_individual = accuracy_score(y_test, y_pred_individual)
    f1_individual  = f1_score(y_test, y_pred_individual, average="macro")

    print("\n===== INDIVIDUAL MODEL PERFORMANCE =====")
    print(f"{'Random Forest':25s} - Accuracy: {acc_individual:.4f}, Macro F1: {f1_individual:.4f}")

    print("\n===== CLASSIFICATION REPORT =====")
    print(
        classification_report(
            y_test,
            y_pred_individual,
            labels=ALLOWED_LABELS,
            digits=4,
            zero_division=0
        )
    )

    cm = confusion_matrix(y_test, y_pred_individual, labels=ALLOWED_LABELS)
    cm_df = pd.DataFrame(cm, index=ALLOWED_LABELS, columns=ALLOWED_LABELS)

    print("\n===== CONFUSION MATRIX =====")
    print(cm_df)

    pipeline = Pipeline([
        ("tfidf", tfidf_baseline),
        ("rf",    rf_individual)
    ])

    return pipeline, acc_individual, f1_individual, cm_df


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
