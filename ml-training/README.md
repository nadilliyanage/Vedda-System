# Vedda Speech-to-Text Model Training - Quick Start

## Prerequisites

1. **Python 3.9+** installed
2. **GPU with 16GB+ VRAM** (or Google Colab Pro)
3. **10+ hours of Vedda audio data**

## Installation

```bash
cd ml-training
pip install -r requirements.txt
```

## Step-by-Step Training Process

### Step 1: Collect Audio Data

Record Vedda speech samples:

```bash
python scripts/collect_vedda_data.py
```

This will:
- Prompt you to record Vedda sentences
- Save audio files to `vedda_dataset/audio/`
- Create metadata in `vedda_dataset/metadata.json`

**Goal**: Collect at least 10 hours (600 minutes) of audio

### Step 2: Prepare Dataset

Convert raw audio to training format:

```bash
python scripts/prepare_dataset.py \
  --metadata vedda_dataset/metadata.json \
  --output vedda_dataset_prepared
```

This will:
- Validate all audio files
- Split into train/validation/test (80/10/10)
- Convert to Hugging Face dataset format
- Save to `vedda_dataset_prepared/`

### Step 3: Train the Model

Fine-tune Whisper on your Vedda dataset:

```bash
python scripts/train_vedda_whisper.py \
  --dataset_path vedda_dataset_prepared \
  --model_name openai/whisper-small \
  --output_dir vedda-whisper-model \
  --num_epochs 10 \
  --batch_size 16
```

**Model sizes to choose from:**
- `whisper-tiny`: Fastest, lowest accuracy (5-10 hours data)
- `whisper-base`: Good balance (10-20 hours data)
- `whisper-small`: **Recommended** (20-30 hours data)
- `whisper-medium`: Best accuracy (30+ hours data)

Training time:
- **RTX 3090**: ~2-4 hours for small model
- **Google Colab Pro**: ~3-5 hours

### Step 4: Test the Model

Test your trained model:

```bash
# Test single audio file
python scripts/test_model.py \
  --model_path vedda-whisper-model \
  --test_audio test_audio.wav

# Test directory of files
python scripts/test_model.py \
  --model_path vedda-whisper-model \
  --test_dir test_audios/

# Interactive mode
python scripts/test_model.py \
  --model_path vedda-whisper-model \
  --interactive
```

### Step 5: Deploy to Your App

Integrate the model into your speech service:

```python
from scripts.test_model import VeddaWhisperSTT

# Initialize model
stt = VeddaWhisperSTT("vedda-whisper-model")

# Transcribe audio
text = stt.transcribe("audio.wav")
print(text)  # "මේ කැකුලෝ ගෙදර ඉන්නවා"
```

## Google Colab Training

Don't have a GPU? Use Google Colab:

1. Upload your dataset to Google Drive
2. Open the Colab notebook (coming soon)
3. Run all cells
4. Download trained model

## Monitoring Training

View training progress in TensorBoard:

```bash
tensorboard --logdir vedda-whisper-model
```

Open http://localhost:6006 to see:
- Training/validation loss
- Word Error Rate (WER)
- Learning rate schedule

## Expected Results

| Dataset Size | Model | Training Time | WER | Accuracy |
|-------------|-------|--------------|-----|----------|
| 10 hours | Small | 2-3 hours | 15-20% | 80-85% |
| 20 hours | Small | 3-4 hours | 10-15% | 85-90% |
| 30 hours | Small | 4-5 hours | 8-12% | 88-92% |
| 50 hours | Medium | 6-8 hours | 5-8% | 92-95% |

## Troubleshooting

### Out of Memory Error
```bash
# Reduce batch size
python scripts/train_vedda_whisper.py --batch_size 8

# Or use gradient accumulation
python scripts/train_vedda_whisper.py --batch_size 8 --gradient_accumulation_steps 2
```

### Slow Training
```bash
# Use smaller model
python scripts/train_vedda_whisper.py --model_name openai/whisper-tiny

# Or use FP16 mixed precision (enabled by default)
```

### Poor Accuracy
- Collect more data (aim for 30+ hours)
- Ensure clean audio recordings
- Balance speakers (multiple speakers)
- Add more diverse sentences

## Data Collection Tips

1. **Multiple Speakers**: Get 5-10 different speakers
2. **Clean Audio**: Quiet environment, good microphone
3. **Natural Speech**: Speak naturally, not too slow
4. **Diverse Content**: Vary sentence structures and topics
5. **Quality over Quantity**: 10 hours of clean audio > 20 hours of noisy audio

## Next Steps

After training:
1. Evaluate on test set
2. Test with real speech
3. Integrate into your app
4. Collect more data to improve
5. Retrain with larger dataset

## Need Help?

- Check training logs: `vedda-whisper-model/logs/`
- View model info: `cat vedda-whisper-model/training_info.json`
- Test individual samples to debug

---

**Ready to start?** Run:
```bash
python scripts/collect_vedda_data.py
```
