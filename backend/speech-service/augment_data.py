"""
Data Augmentation for Vedda ASR Training Data.

Creates 3 augmented variants of each processed audio file:
  1. Speed 0.85x (slower speech)
  2. Speed 1.15x (faster speech)
  3. Light white noise addition

This approximately 4x-multiplies the effective training data:
  ~23 min original -> ~90+ min effective

Output:
  - Augmented WAV files in vedda-asr-model/data/augmented/
  - train_dataset_augmented.json with original + augmented entries
"""

import os
import json
import librosa
import soundfile as sf
import numpy as np
import sys

PROC_DIR = 'vedda-asr-model/data/processed'
RAW_DIR  = 'vedda-asr-model/data/raw'
AUG_DIR  = 'vedda-asr-model/data/augmented'
TRAIN_FILE     = 'vedda-asr-model/data/train_dataset.json'
AUG_TRAIN_FILE = 'vedda-asr-model/data/train_dataset_augmented.json'


def log(msg):
    sys.stdout.buffer.write((str(msg) + '\n').encode('utf-8', errors='replace'))
    sys.stdout.buffer.flush()


def find_audio(item):
    """Resolve audio file path from a dataset item."""
    candidates = [
        os.path.join('vedda-asr-model', item['audio_path'].replace('\\', '/')),
        os.path.join('vedda-asr-model', item.get('original_path', '').replace('\\', '/')),
        os.path.join(PROC_DIR, os.path.basename(item['audio_path'])),
        os.path.join(RAW_DIR, os.path.basename(item['audio_path'])),
    ]
    for p in candidates:
        if p and os.path.exists(p):
            return p
    return None


def augment_speed(audio, rate):
    """Time-stretch without pitch change."""
    return librosa.effects.time_stretch(audio, rate=rate)


def add_noise(audio, level=0.002):
    """Add small amount of white noise."""
    return audio + np.random.randn(len(audio)).astype(np.float32) * level


def make_aug_item(original_item, aug_filename, aug_type):
    """Create a dataset entry for an augmented file."""
    return {
        'audio_path': f'data/augmented/{aug_filename}',
        'transcription': original_item['transcription'],
        'translation': original_item.get('translation', ''),
        'duration': original_item.get('duration', 0),
        'sample_rate': 16000,
        'speaker_id': original_item.get('speaker_id', ''),
        'original_path': original_item.get('original_path', original_item['audio_path']),
        'noise_cancelled': False,
        'augmentation': aug_type,
    }


def main():
    log('=' * 60)
    log('[AUGMENT] VEDDA AUDIO DATA AUGMENTATION')
    log('=' * 60)

    # Load original training data
    with open(TRAIN_FILE, 'r', encoding='utf-8') as f:
        train_data = json.load(f)

    original_items = train_data.get('data', [])
    log(f'Original training samples: {len(original_items)}')

    os.makedirs(AUG_DIR, exist_ok=True)

    augmented_items = []
    ok_count = 0
    skip_count = 0

    for i, item in enumerate(original_items):
        audio_path = find_audio(item)

        if audio_path is None:
            log(f'  [SKIP] File not found: {item["audio_path"]}')
            skip_count += 1
            continue

        try:
            audio, sr = librosa.load(audio_path, sr=16000, mono=True)
            base_name = os.path.splitext(os.path.basename(audio_path))[0]

            # Variant 1: Slower (0.85x)
            aug1 = augment_speed(audio, 0.85)
            fn1 = f'{base_name}_slow.wav'
            sf.write(os.path.join(AUG_DIR, fn1), aug1, 16000)
            augmented_items.append(make_aug_item(item, fn1, 'slow_0.85x'))

            # Variant 2: Faster (1.15x)
            aug2 = augment_speed(audio, 1.15)
            fn2 = f'{base_name}_fast.wav'
            sf.write(os.path.join(AUG_DIR, fn2), aug2, 16000)
            augmented_items.append(make_aug_item(item, fn2, 'fast_1.15x'))

            # Variant 3: Light noise
            aug3 = add_noise(audio)
            fn3 = f'{base_name}_noise.wav'
            sf.write(os.path.join(AUG_DIR, fn3), aug3, 16000)
            augmented_items.append(make_aug_item(item, fn3, 'noise'))

            ok_count += 1

        except Exception as e:
            log(f'  [ERROR] {item["audio_path"]}: {e}')
            skip_count += 1

        if i % 50 == 0:
            log(f'  Progress: {i}/{len(original_items)} | augmented so far: {len(augmented_items)}')

    # Build combined dataset
    combined_items = original_items + augmented_items
    combined_data = {
        'version': '2.0-augmented',
        'total_samples': len(combined_items),
        'original_samples': len(original_items),
        'augmented_samples': len(augmented_items),
        'data': combined_items
    }

    with open(AUG_TRAIN_FILE, 'w', encoding='utf-8') as f:
        json.dump(combined_data, f, ensure_ascii=False, indent=2)

    log('')
    log('=' * 60)
    log('[DONE] AUGMENTATION COMPLETE')
    log('=' * 60)
    log(f'  Original: {len(original_items)} samples')
    log(f'  Augmented: {len(augmented_items)} new samples')
    log(f'  Total: {len(combined_items)} samples')
    log(f'  Skipped: {skip_count}')
    log(f'  Saved to: {AUG_TRAIN_FILE}')
    log('')
    log('[NEXT] Run: python retrain_tiny.py')


if __name__ == '__main__':
    main()
