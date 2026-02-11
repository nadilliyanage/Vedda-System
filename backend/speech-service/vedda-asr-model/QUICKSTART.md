# 🚀 Quick Start: Train Your Vedda ASR Model

## ⚡ Fast Track (Minimum Viable Model)

### Step 1: Setup (5 minutes)

```powershell
# Navigate to model directory
cd "d:\SLIIT\RP\Vedda System\backend\speech-service\vedda-asr-model"

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Collect Data (30-60 minutes)

**Option A: Record New Audio**

```powershell
python scripts/1_collect_data.py
```

- Choose option 1 (Record new audio)
- Record 20-50 short Vedda phrases (3-5 seconds each)
- Enter transcriptions for each recording
- Target: 10-15 minutes of audio minimum

**Option B: Import Existing Audio**

```powershell
python scripts/1_collect_data.py
```

- Choose option 2 (Import existing audio)
- Provide audio file path and transcription
- Repeat for all your audio files

**Recommended Phrases to Record:**

1. **Greetings:** "හෙලෝ", "ආයුබෝවන්"
2. **Family:** "අප්පච්චි", "අම්මා", "කැකුළා"
3. **Actions:** "යනවා", "එන්න", "කන්න"
4. **Questions:** "කොහේද", "මොකද්ද", "කවුද"
5. **Common phrases:** "අප්පච්චි කැලේට යනවා"

### Step 3: Prepare Dataset (2 minutes)

```powershell
python scripts/2_prepare_dataset.py
```

This will:

- Convert audio to 16kHz mono WAV
- Normalize volume
- Remove silence
- Split into train/test sets (90%/10%)

### Step 4: Train Model (10-60 minutes)

**Quick Training (CPU):**

```powershell
python scripts/3_train_whisper.py --model_size tiny --epochs 5 --batch_size 4
```

- ⏱️ Time: 10-20 minutes on CPU
- 📊 Quality: Basic, suitable for testing

**Recommended Training (GPU):**

```powershell
python scripts/3_train_whisper.py --model_size small --epochs 10 --batch_size 8
```

- ⏱️ Time: 30-60 minutes with GPU
- 📊 Quality: Good for production

**High Quality (GPU):**

```powershell
python scripts/3_train_whisper.py --model_size base --epochs 15 --batch_size 8
```

- ⏱️ Time: 1-2 hours with GPU
- 📊 Quality: Excellent

### Step 5: Evaluate Model (1 minute)

```powershell
python scripts/4_evaluate_model.py
```

Metrics you'll see:

- **WER < 10%** = Excellent ✅
- **WER 10-20%** = Good ✅
- **WER 20-30%** = Fair ⚠️
- **WER > 30%** = Needs more data ❌

### Step 6: Use Your Model

```python
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import librosa

# Load your model
model_path = "models/whisper-vedda/final"
processor = WhisperProcessor.from_pretrained(model_path)
model = WhisperForConditionalGeneration.from_pretrained(model_path)

# Transcribe audio
audio, sr = librosa.load("vedda_audio.wav", sr=16000)
input_features = processor(audio, sampling_rate=16000, return_tensors="pt").input_features

predicted_ids = model.generate(input_features)
transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]

print(f"Transcription: {transcription}")
```

---

## 🎓 Using Google Colab (Free GPU)

If you don't have a GPU, use Google Colab:

1. **Open Colab:** https://colab.research.google.com/
2. **Enable GPU:**
   - Runtime → Change runtime type → GPU (T4)
3. **Mount Google Drive:**
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```
4. **Upload your data folder to Google Drive**
5. **Run training:**
   ```python
   !pip install -q transformers datasets evaluate jiwer librosa
   !cd /content/drive/MyDrive/vedda-asr-model
   !python scripts/3_train_whisper.py --model_size small --epochs 10
   ```
6. **Download trained model from Colab**

---

## 📋 Troubleshooting

### "Not enough memory"

- Use smaller model: `--model_size tiny`
- Reduce batch size: `--batch_size 2`
- Use Google Colab with GPU

### "Dataset too small"

- Minimum: 10 minutes of audio
- Recommended: 1 hour of audio
- Can train with less, but accuracy will be lower

### "Training is very slow"

- CPU training is slow (10-60min for tiny model)
- Use Google Colab free GPU (5-10x faster)
- Or use cloud GPU (AWS, Azure)

### "High WER (poor accuracy)"

- Collect more diverse audio data
- Verify transcription accuracy
- Train for more epochs
- Use larger model (small → base)

---

## 🎯 Production Integration

Once trained, integrate with your speech service:

```python
# In speech_service.py

class SpeechService:
    def __init__(self):
        # Load custom Vedda model
        if os.path.exists('vedda-asr-model/models/whisper-vedda/final'):
            from transformers import WhisperProcessor, WhisperForConditionalGeneration

            self.vedda_processor = WhisperProcessor.from_pretrained(
                'vedda-asr-model/models/whisper-vedda/final'
            )
            self.vedda_model = WhisperForConditionalGeneration.from_pretrained(
                'vedda-asr-model/models/whisper-vedda/final'
            )
            print("✅ Custom Vedda ASR model loaded")
        else:
            self.vedda_model = None

    def speech_to_text(self, audio_file, language='english'):
        if language == 'vedda' and self.vedda_model:
            # Use custom Vedda model
            return self._transcribe_vedda(audio_file)
        else:
            # Use Google STT
            return self._google_stt(audio_file, language)

    def _transcribe_vedda(self, audio_file):
        import librosa

        # Load audio
        audio, sr = librosa.load(audio_file, sr=16000, mono=True)

        # Process
        input_features = self.vedda_processor(
            audio,
            sampling_rate=16000,
            return_tensors="pt"
        ).input_features

        # Generate transcription
        predicted_ids = self.vedda_model.generate(input_features)
        transcription = self.vedda_processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True
        )[0]

        return {
            'success': True,
            'text': transcription,
            'language': 'vedda',
            'confidence': 0.95,
            'method': 'custom_vedda_model'
        }
```

---

## 📈 Improvement Roadmap

### Phase 1: MVP (Week 1)

- ✅ Collect 10-15 minutes of audio
- ✅ Train tiny/small model
- ✅ Test basic functionality

### Phase 2: Production (Month 1)

- 📊 Collect 1 hour of diverse audio
- 🎓 Train base model
- 📈 Achieve WER < 15%
- 🚀 Deploy to production

### Phase 3: Excellence (Month 2-3)

- 📊 Collect 5-10 hours of audio
- 👥 Multiple speakers (age/gender diversity)
- 🎯 Achieve WER < 10%
- 🌍 Contribute to community

---

## 🎉 Success Checklist

- [ ] Installed dependencies
- [ ] Collected at least 10 minutes of Vedda audio
- [ ] Transcribed all audio accurately
- [ ] Prepared dataset (train/test split)
- [ ] Trained model successfully
- [ ] Evaluated model (WER calculated)
- [ ] Tested with new audio samples
- [ ] Integrated with speech service
- [ ] Model performs better than Sinhala STT for Vedda

---

**Need Help?** Check [README.md](README.md) for detailed documentation.
