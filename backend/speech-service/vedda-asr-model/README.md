# Custom Vedda ASR Model Training Pipeline

## 🎯 Overview
Train a custom speech recognition model specifically for Vedda language using fine-tuned Whisper or Wav2Vec2 models.

## 📋 Approach Options

### Option 1: Fine-tune Whisper (Recommended)
**Best for:** Low-resource languages, fastest to get working results  
**Requirements:** 1-2 hours of high-quality Vedda audio with transcriptions  
**Model:** OpenAI Whisper (small/base/medium)

### Option 2: Fine-tune Wav2Vec2
**Best for:** Languages similar to pre-trained language (Sinhala)  
**Requirements:** 10+ hours of audio  
**Model:** facebook/wav2vec2-large-xlsr-53

### Option 3: Train from Scratch
**Best for:** Large datasets available  
**Requirements:** 100+ hours of audio  
**Not recommended** for Vedda due to data scarcity

## 📁 Project Structure

```
vedda-asr-model/
├── data/
│   ├── raw/              # Raw audio recordings
│   ├── processed/        # Processed WAV files (16kHz mono)
│   ├── transcriptions/   # Text transcriptions
│   └── dataset.json      # Training dataset metadata
├── models/
│   ├── checkpoints/      # Training checkpoints
│   ├── final/           # Final trained model
│   └── whisper-vedda/   # Fine-tuned Whisper model
├── scripts/
│   ├── 1_collect_data.py        # Data collection helper
│   ├── 2_prepare_dataset.py     # Prepare training data
│   ├── 3_train_whisper.py       # Train Whisper model
│   ├── 4_evaluate_model.py      # Evaluate model
│   └── 5_export_model.py        # Export for production
└── notebooks/
    └── vedda_asr_training.ipynb # Interactive training notebook

```

## 🎤 Step 1: Data Collection (CRITICAL)

### Minimum Requirements
- **Duration:** 1-2 hours of clean audio
- **Speakers:** 5-10 native Vedda speakers (diverse ages/genders)
- **Environment:** Quiet recordings, no background noise
- **Format:** WAV, 16kHz sample rate, mono channel
- **Transcriptions:** Accurate Vedda text for each audio

### Recording Guidelines
1. **Content diversity:**
   - Common phrases and greetings
   - Daily conversation
   - Traditional stories/songs
   - Dictionary words in sentences
   
2. **Audio quality:**
   - Use good microphone (or smartphone close to speaker)
   - Quiet room, no echo
   - Consistent volume
   - 3-10 seconds per recording
   
3. **Transcription accuracy:**
   - Native speaker verification
   - Consistent orthography
   - Mark unclear sections

### Data Collection Script
Use `scripts/1_collect_data.py` to:
- Record audio directly
- Import existing recordings
- Create transcription templates
- Organize dataset structure

## 🔧 Step 2: Dataset Preparation

### Audio Preprocessing
```python
# Automatic preprocessing:
# - Convert to 16kHz mono WAV
# - Normalize volume
# - Remove silence
# - Split long recordings
# - Quality checks
```

### Dataset Format
```json
{
  "data": [
    {
      "audio_path": "data/processed/vedda_001.wav",
      "transcription": "හෙලෝ මේ ඇත්තෝ",
      "duration": 2.5,
      "speaker_id": "speaker_01",
      "validated": true
    }
  ]
}
```

Run: `python scripts/2_prepare_dataset.py`

## 🎓 Step 3: Model Training

### Fine-tune Whisper (Recommended)

```bash
# Install dependencies
pip install openai-whisper transformers datasets

# Start training
python scripts/3_train_whisper.py \
    --model_size small \
    --train_data data/dataset.json \
    --epochs 10 \
    --batch_size 8 \
    --learning_rate 1e-5
```

**Training time:** 1-6 hours (depending on GPU)  
**GPU required:** 8GB+ VRAM (or use Google Colab free GPU)

### Training Parameters
- **Model size:** `tiny` (39M) / `small` (244M) / `base` (74M)
- **Epochs:** 5-15 (more data = fewer epochs needed)
- **Batch size:** 4-16 (depending on GPU memory)
- **Learning rate:** 1e-5 to 3e-5

## 📊 Step 4: Evaluation

```bash
# Evaluate on test set
python scripts/4_evaluate_model.py \
    --model models/whisper-vedda \
    --test_data data/test_dataset.json
```

**Metrics:**
- Word Error Rate (WER): Target < 20%
- Character Error Rate (CER): Target < 10%
- Real-time factor (RTF): Target < 0.5

## 🚀 Step 5: Production Deployment

```bash
# Export optimized model
python scripts/5_export_model.py \
    --input models/whisper-vedda \
    --output models/final/vedda-asr.pt \
    --quantize
```

### Integration with Speech Service

```python
# Load custom Vedda model
from vedda_asr import VeddaASR

vedda_model = VeddaASR('models/final/vedda-asr.pt')

# Use in speech service
def speech_to_text(audio_file, language='vedda'):
    if language == 'vedda':
        return vedda_model.transcribe(audio_file)
    else:
        return google_stt.recognize(audio_file, language)
```

## 💡 Quick Start with Limited Data

### Scenario: Only have 10-20 Vedda recordings

**Solution: Hybrid Approach**
1. Use Sinhala Whisper model as base (already understands similar phonetics)
2. Fine-tune on your 10-20 Vedda recordings
3. Use dictionary post-processing for OOV words

```python
# Load Sinhala-adapted model
model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-small")
# Fine-tune on Vedda data
train(model, vedda_recordings, epochs=20)
# Lower learning rate for small datasets
```

## 🔥 Using Google Colab (Free GPU)

1. Open `notebooks/vedda_asr_training.ipynb` in Colab
2. Upload your Vedda audio + transcriptions
3. Run all cells (training takes ~30 min)
4. Download trained model
5. Deploy in your speech service

## 📈 Expected Results

### With 1 hour of data:
- WER: 15-25%
- Better than Sinhala STT for Vedda-specific words
- Good for common phrases

### With 10 hours of data:
- WER: 5-15%
- Production-ready quality
- Handles diverse speakers

### With 50+ hours of data:
- WER: 2-8%
- Near-human accuracy
- Robust to noise and accents

## 🎯 Next Steps

1. **Immediate:** Collect 10 Vedda recordings (see `scripts/1_collect_data.py`)
2. **Week 1:** Record 1 hour of diverse Vedda speech
3. **Week 2:** Train initial model, evaluate
4. **Week 3:** Collect feedback, improve dataset
5. **Month 2:** Deploy production model, continue collecting data

## 📚 Resources

- **Whisper documentation:** https://github.com/openai/whisper
- **Hugging Face ASR:** https://huggingface.co/docs/transformers/tasks/asr
- **Mozilla Common Voice:** Contribute Vedda data for community
- **Tutorial:** `notebooks/vedda_asr_training.ipynb`

## ⚠️ Important Notes

1. **Data privacy:** Get consent from speakers before recording
2. **Cultural sensitivity:** Work with Vedda community elders
3. **Validation:** Have native speakers verify transcriptions
4. **Iterative:** Start small, improve continuously
5. **Backup:** Keep raw data backed up safely

## 🤝 Community Contribution

Consider contributing your Vedda ASR model to:
- Hugging Face Model Hub
- Mozilla Common Voice
- Academic research initiatives

This helps preserve and promote the Vedda language!
