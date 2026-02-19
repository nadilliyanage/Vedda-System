"""
Comprehensive diagnosis and improvement strategy for Vedda ASR model.
Checks audio quality, dataset stats, and tests whisper-tiny as alternative.
"""
import json, os, librosa, torch
import numpy as np
from pathlib import Path

output_lines = []

def log(msg):
    output_lines.append(msg)
    # Write using buffer to avoid encoding issues
    import sys
    sys.stdout.buffer.write((str(msg) + '\n').encode('utf-8', errors='replace'))
    sys.stdout.buffer.flush()

# ===========================
# STEP 1: Dataset Statistics
# ===========================
log("=" * 60)
log("STEP 1: DATASET STATISTICS")
log("=" * 60)

with open('vedda-asr-model/data/transcriptions.json', 'r', encoding='utf-8') as f:
    refs = json.load(f)

log(f"Total reference transcriptions: {len(refs)}")

# Count words in each transcription
word_counts = [len(t.split()) for t in refs.values()]
char_counts = [len(t) for t in refs.values()]
log(f"Avg words per transcription: {np.mean(word_counts):.1f} (max: {max(word_counts)}, min: {min(word_counts)})")
log(f"Avg chars per transcription: {np.mean(char_counts):.1f}")

# ===========================
# STEP 2: Audio Quality Check
# ===========================
log("\n" + "=" * 60)
log("STEP 2: AUDIO QUALITY CHECK")
log("=" * 60)

raw_dir = 'vedda-asr-model/data/raw'
proc_dir = 'vedda-asr-model/data/processed'

durations = []
missing = []

for fid in list(refs.keys())[:50]:  # sample 50 files
    audio_path = os.path.join(raw_dir, f'{fid}.wav')
    if not os.path.exists(audio_path):
        audio_path = os.path.join(proc_dir, f'{fid}.wav')
    if not os.path.exists(audio_path):
        missing.append(fid)
        continue
    try:
        audio, sr = librosa.load(audio_path, sr=None, mono=True)
        dur = len(audio) / sr
        durations.append(dur)
    except Exception as e:
        log(f"  Error loading {fid}: {e}")

if durations:
    log(f"Sampled {len(durations)} audio files:")
    log(f"  Duration: avg={np.mean(durations):.2f}s, min={np.min(durations):.2f}s, max={np.max(durations):.2f}s")
    log(f"  Estimated total audio time: {sum(durations)/60:.1f} min (from {len(durations)} samples)")
    log(f"  Missing files: {len(missing)}")
else:
    log("  No audio files found in sample!")

# ===========================
# STEP 3: Tokenizer analysis
# ===========================
log("\n" + "=" * 60)
log("STEP 3: TOKENIZER ANALYSIS FOR VEDDA VOCABULARY")
log("=" * 60)

from transformers import WhisperProcessor
processor = WhisperProcessor.from_pretrained('vedda-asr-model/models/whisper-vedda-final/final')

# Check how Vedda words are tokenized
vedda_words = ['හොච්ච', 'දික්කා', 'ගැට', 'මන්දා', 'පොජ්ජ', 'ලැත්තෝ', 'ගච්ච', 'මංගච්ච', 'රකුරු', 'ඇත්ත']
log("Vedda word tokenization:")
for word in vedda_words:
    tokens = processor.tokenizer.encode(word, add_special_tokens=False)
    decoded = [processor.tokenizer.decode([t]) for t in tokens]
    log(f"  '{word}' -> {len(tokens)} tokens: {decoded}")

# ===========================
# STEP 4: Whisper-tiny baseline
# ===========================
log("\n" + "=" * 60)
log("STEP 4: WHISPER-TINY BASE MODEL INFERENCE (no fine-tuning)")
log("=" * 60)
log("Testing base whisper-tiny to see if smaller model understands Vedda better...")

from transformers import WhisperForConditionalGeneration

try:
    tiny_processor = WhisperProcessor.from_pretrained('openai/whisper-tiny')
    tiny_model = WhisperForConditionalGeneration.from_pretrained('openai/whisper-tiny')
    tiny_model.eval()
    forced_ids = tiny_processor.get_decoder_prompt_ids(language='si', task='transcribe')

    test_files = list(refs.items())[:5]
    log("Testing 5 files with whisper-tiny base (no tuning):")
    for fid, ref_trans in test_files:
        audio_path = os.path.join(raw_dir, f'{fid}.wav')
        if not os.path.exists(audio_path):
            audio_path = os.path.join(proc_dir, f'{fid}.wav')
        if not os.path.exists(audio_path):
            continue
        audio, _ = librosa.load(audio_path, sr=16000, mono=True)
        inputs = tiny_processor.feature_extractor(audio, sampling_rate=16000, return_tensors='pt')
        with torch.no_grad():
            ids = tiny_model.generate(inputs.input_features, forced_decoder_ids=forced_ids, max_new_tokens=225)
        pred = tiny_processor.tokenizer.batch_decode(ids, skip_special_tokens=True)[0].strip()
        log(f"  REF : {ref_trans}")
        log(f"  PRED: {pred}")
        log("")
except Exception as e:
    log(f"  Error: {e}")

# ===========================
# SUMMARY
# ===========================
log("\n" + "=" * 60)
log("SUMMARY AND RECOMMENDATIONS")
log("=" * 60)

if durations:
    total_est = (sum(durations) / len(durations)) * len(refs) / 60
    log(f"Estimated total data: ~{total_est:.1f} minutes")
    if total_est < 30:
        log("STATUS: INSUFFICIENT DATA - Whisper needs 30+ min for reliable fine-tuning")
    elif total_est < 60:
        log("STATUS: MARGINAL - May need more data or smaller model")
    else:
        log("STATUS: SUFFICIENT - Problem may be in training configuration")

log("\nPaths forward:")
log("1. Collect more Vedda recordings (target: 30-60 min)")
log("2. Try Whisper-tiny (39M params) - requires less data than Whisper-small (244M)")
log("3. Use data augmentation (speed, pitch, noise)")
log("4. Try lower learning rate (1e-5) and more epochs (20-30)")

# Save results
with open('diagnosis_results.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

log("\n[SAVED] Full results: diagnosis_results.txt")
