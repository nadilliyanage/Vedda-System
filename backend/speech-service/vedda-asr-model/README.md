# Vedda ASR Model — Fine-tuned Whisper Pipeline

A custom Automatic Speech Recognition (ASR) pipeline for the Vedda language, built by fine-tuning OpenAI Whisper on a collected Vedda audio dataset. Outputs Sinhala-script transcriptions.

---

## Technologies Used

| Technology                | Version        | Purpose                                                                           |
| ------------------------- | -------------- | --------------------------------------------------------------------------------- |
| Python                    | 3.10+          | Runtime                                                                           |
| PyTorch                   | 2.x            | Deep learning framework                                                           |
| Hugging Face Transformers | 4.x            | Whisper model fine-tuning (`WhisperForConditionalGeneration`, `WhisperProcessor`) |
| Hugging Face Datasets     | 2.x            | Dataset loading and batching for training                                         |
| OpenAI Whisper            | `whisper-tiny` | Base pre-trained ASR model (39M parameters)                                       |
| librosa                   | 0.10+          | Audio loading and resampling to 16 kHz mono                                       |
| soundfile                 | —              | WAV file I/O                                                                      |
| jiwer                     | —              | Word Error Rate (WER) and Character Error Rate (CER) computation                  |
| pydub                     | —              | Audio augmentation (pitch/speed/noise)                                            |
| numpy                     | —              | Numerical operations                                                              |

---

## Model Architecture

- **Base model:** `openai/whisper-tiny` (39M parameters)
- **Encoder:** Frozen (weights not updated during fine-tuning)
- **Decoder:** Fine-tuned on Vedda transcription data (29.5M trainable parameters)
- **Output script:** Sinhala Unicode (`si` language token)
- **Forced decoder tokens:** `[<|si|>, <|transcribe|>]`

---

## Current Best Model

| Model                     | WER         | CER    | Exact Matches | Notes                            |
| ------------------------- | ----------- | ------ | ------------- | -------------------------------- |
| `whisper-frozen-v2/final` | 88.60%      | 85.40% | 12 / 38       | Current production model         |
| `whisper-frozen-v4/final` | in training | —      | —             | Continues from v2, WER-optimised |

---

## Project Structure

```
vedda-asr-model/
├── data/
│   ├── raw/                          # Original recordings
│   ├── processed/                    # Resampled 16kHz mono WAVs
│   ├── transcriptions/               # Per-file transcription text
│   ├── transcriptions.json           # Transcription index
│   ├── dataset.json                  # Full labelled dataset
│   ├── train_dataset.json            # Training split
│   ├── train_dataset_augmented.json  # Augmented training set (1368 samples)
│   └── test_dataset.json             # Evaluation split (38 samples)
├── models/
│   ├── whisper-frozen-v2/            # Best stable model (12 exact matches)
│   └── whisper-frozen-v4/            # Current training run (WER-optimised)
├── scripts/
│   ├── 1_collect_data.py             # Audio collection helper
│   ├── 2_prepare_dataset.py          # Preprocessing and dataset preparation
│   ├── 3_train_whisper.py            # Whisper fine-tuning pipeline
│   └── 4_evaluate_model.py           # Model evaluation
├── logs/                             # Training logs (stdout + tqdm progress)
├── demo_vedda.py                     # Quick inference demo
├── extract_transcriptions.py         # Utility to extract transcriptions from dataset
├── verify_against_dataset.py         # Verify model output against ground truth
├── verify_transcriptions.py          # Check transcription file consistency
├── vedda_transcriptions.json         # Master transcription list
├── Vedda_ASR_Colab_Training.ipynb    # Google Colab training notebook
└── requirements.txt
```

---

## Training Configuration (v4)

```
Base model:      whisper-frozen-v2/final  (continues from best checkpoint)
Learning rate:   5e-6
Batch size:      8
Max epochs:      5
Early stopping:  patience = 2 (metric = WER)
Train samples:   1368 (342 original × 4 augmentations)
Eval samples:    38
Optimiser:       AdamW  (weight_decay=0.01)
```

---

## Inference Parameters

```python
forced_decoder_ids = [[1, si_token_id], [2, transcribe_token_id]]
num_beams          = 5
repetition_penalty = 1.5
no_repeat_ngram_size = 4
length_penalty     = 0.8
max_new_tokens     = 100
```

---

## Setup

```bash
pip install -r requirements.txt
```

---

## Evaluate a Model

```bash
# Test v2 (current best)
python ../test_frozen_model.py

# Test v4 (after training completes)
python ../test_frozen_model_v3.py

# Verify accuracy metrics
python ../verify_accuracy.py

# Analyse the accuracy report
python ../analyze_report.py
```

---

## Re-train

```bash
# From speech-service directory
python retrain_v3_balanced.py
```

Training logs are written to `logs/train_v4.log` (stdout) and `logs/train_v4_err.log` (progress).

---

## Data Augmentation

The training set uses 4 augmented variants per original recording (pitch shift, speed, noise injection) via `augment_data.py`, expanding 342 samples to 1368.
