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
| OpenAI Whisper            | `whisper-small` | Base pre-trained ASR model (241.7M parameters)                                   |
| librosa                   | 0.10+          | Audio loading and resampling to 16 kHz mono                                       |
| soundfile                 | —              | WAV file I/O                                                                      |
| jiwer                     | —              | Word Error Rate (WER) and Character Error Rate (CER) computation                  |
| pydub                     | —              | Audio augmentation (pitch/speed/noise)                                            |
| numpy                     | —              | Numerical operations                                                              |

---

## Model Architecture

- **Base model:** `openai/whisper-small` (241.7M parameters)
- **Encoder:** Frozen during v4 fine-tuning (weights not updated)
- **Decoder:** Fine-tuned on Vedda transcription data (153.6M trainable parameters)
- **Output script:** Sinhala Unicode (`si` language token)
- **Generate config:** `language='si', task='transcribe'`, num_beams=5

---

## Models

| Model | WER | CER | Exact | Samples | Notes |
|---|---|---|---|---|---|
| `whisper-frozen-v4/final` | 71.66% | 34.84% | 52/385 | 385 | Frozen-encoder fine-tune; **active model** |
| `whisper-vedda-final` | 78.75% | 39.26% | 0/20 | 20 | Colab full fine-tune (baseline) |
| `whisper-frozen-v2/final` | 88.60% | 85.40% | 12/38 | 38 | Legacy — no longer on disk |

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
│   ├── whisper-vedda-final/          # Colab full fine-tune (241.7M whisper-small)
│   └── whisper-frozen-v4/            # Frozen-encoder fine-tune; current best (52/385 exact)
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
Base model:      whisper-vedda-final  (Colab-trained whisper-small)
Encoder:         Frozen  (153.6M / 241.7M params trainable)
Learning rate:   5e-6
Batch size:      8
Max epochs:      5
Early stopping:  patience = 2 (metric = WER)  → stopped at epoch 3
Train samples:   342  (augmented audio missing; originals only)
Eval samples:    38
Optimiser:       AdamW  (weight_decay=0.01)
Train loss:      1.11  (final epoch)
Completed:       February 2026
```

---

## Inference Parameters

```python
# vedda_asr_service.py — model.generate() call
language             = 'si'
task                 = 'transcribe'
num_beams            = 5
repetition_penalty   = 1.5
no_repeat_ngram_size = 4
length_penalty       = 0.8
max_new_tokens       = 100   # remove max_length from generation_config to avoid conflict
```

---

## Setup

```bash
pip install -r requirements.txt
```

---

## Evaluate a Model

```bash
# Run inference on active model (whisper-vedda-final) and save results
python ../eval_vedda_final.py

# Evaluate whisper-frozen-v4 specifically
python ../test_frozen_model_v3.py

# Compute WER / CER / exact-match (reads eval_vedda_final_results.json or test_results.json)
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
