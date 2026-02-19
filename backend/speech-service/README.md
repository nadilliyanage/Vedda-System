# Speech Service

A Flask-based microservice providing Text-to-Speech (TTS) and Speech-to-Text (STT) for all supported languages in the Vedda System, with a dedicated Vedda-language ASR pipeline using a fine-tuned Whisper model.

---

## Technologies Used

| Technology                   | Version | Purpose                                               |
| ---------------------------- | ------- | ----------------------------------------------------- |
| Python                       | 3.10+   | Runtime                                               |
| Flask                        | 3.x     | HTTP microservice framework                           |
| Flask-CORS                   | —       | Cross-origin request handling                         |
| gTTS (Google Text-to-Speech) | —       | TTS for 18+ languages                                 |
| SpeechRecognition            | —       | Google Cloud STT wrapper for standard languages       |
| PyTorch                      | 2.x     | Inference backend for Vedda ASR                       |
| Hugging Face Transformers    | 4.x     | `WhisperForConditionalGeneration`, `WhisperProcessor` |
| librosa                      | 0.10+   | Audio loading and resampling (16 kHz mono)            |
| python-dotenv                | —       | Environment variable management                       |
| gunicorn                     | —       | Production WSGI server (optional)                     |

---

## Port

`5007`

---

## API Endpoints

### POST `/api/tts`

Convert text to speech.

```json
Request:  { "text": "...", "language": "english" }
Response: audio/mpeg file (MP3)
```

### POST `/api/stt`

Convert speech audio to text.

```
Request:  multipart/form-data  { audio: <file>, language: "vedda" }
Response: { "success": true, "text": "රුකුල් පොජ්ජ", "language": "vedda", "confidence": 0.85, "method": "vedda_whisper" }
```

For **Vedda** language — uses the local fine-tuned Whisper model (`vedda_asr_service.py`).  
For all other languages — uses Google Cloud Speech-to-Text via the `SpeechRecognition` library.

### GET `/api/tts/supported-languages`

Returns all TTS-supported language codes.

### GET `/api/stt/supported-languages`

Returns all STT-supported language codes.

### GET `/health`

Health check.

---

## Supported Languages

`english`, `sinhala`, `tamil`, `hindi`, `chinese`, `japanese`, `korean`, `french`, `german`, `spanish`, `italian`, `portuguese`, `russian`, `arabic`, `dutch`, `thai`, `vietnamese`, `turkish`, `vedda`

---

## File Structure

```
speech-service/
├── run.py                        # Main Flask application (entry point)
├── vedda_asr_service.py          # Vedda ASR service (Whisper inference)
├── vedda_stt_processor.py        # Vedda STT post-processor (dictionary mapping)
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables (VEDDA_ASR_MODEL_PATH, etc.)
│
├── vedda-asr-model/              # Vedda ASR training pipeline and models
│   └── README.md                 # See for model details
│
├── retrain_v3_balanced.py        # Training script (currently configured for v4)
├── test_frozen_model.py          # Evaluate whisper-frozen-v2 (current best)
├── test_frozen_model_v3.py       # Evaluate whisper-frozen-v4
├── verify_accuracy.py            # Compute WER / CER / exact-match metrics
├── analyze_report.py             # Analyse accuracy_report.json
├── accuracy_report.json          # Latest evaluation results
├── test_results.json             # Per-sample test output
├── augment_data.py               # Audio augmentation for training data
├── check_train_data.py           # Validate training dataset integrity
├── validate_train_data.py        # Additional dataset validation
├── diagnose_model.py             # Model diagnostic utilities
├── spot_check.py                 # Quick manual spot-check on audio files
├── test_all_audio_inputs.py      # Batch audio input testing
├── test_vedda_integration.py     # End-to-end Vedda integration test
├── run_v4_eval.bat               # Auto-run evaluation when v4 training finishes
│
├── app/                          # Flask app module (blueprints / services)
└── logs/                         # Runtime logs
```

---

## Vedda ASR Model Selection

The service auto-selects the best available model at startup (priority order):

1. `VEDDA_ASR_MODEL_PATH` environment variable (if set and path exists)
2. `vedda-asr-model/models/whisper-frozen-v4/final` (if training is complete)
3. `vedda-asr-model/models/whisper-frozen-v2/final` (stable fallback)

---

## Setup & Run

```bash
pip install -r requirements.txt
python run.py
```

Service starts on `http://0.0.0.0:5007`.

---

## Vedda ASR — Quick Evaluation

```bash
# Run inference on all test samples
python test_frozen_model.py

# Compute WER / CER / exact-match
python verify_accuracy.py

# Print top results and error analysis
python analyze_report.py
```

Current v2 results: **12/38 exact matches**, WER 88.60%, CER 85.40%.
