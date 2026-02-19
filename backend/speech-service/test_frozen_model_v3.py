"""
Test the v4 Vedda frozen-encoder model (continues from v2).
Run this after retrain_v3_balanced.py (configured for v4) completes.
Uses tuned inference: beam search, repetition_penalty, no_repeat_ngram.
"""

import os, json, torch, librosa, sys
from datetime import datetime
from transformers import WhisperProcessor, WhisperForConditionalGeneration

FROZEN_MODEL_DIR = 'vedda-asr-model/models/whisper-frozen-v4/final'
RESULTS_FILE     = 'test_results.json'
TRANSCRIPTIONS   = 'vedda-asr-model/data/transcriptions.json'


def log(msg):
    sys.stdout.buffer.write((str(msg) + '\n').encode('utf-8', errors='replace'))
    sys.stdout.buffer.flush()


def main():
    log('=' * 60)
    log('[TEST] VEDDA FROZEN-ENCODER v4 MODEL EVALUATION (from v2+)')
    log('=' * 60)

    if not os.path.exists(FROZEN_MODEL_DIR):
        log(f'[ERROR] Model not found: {FROZEN_MODEL_DIR}')
        log('  Run: python retrain_v3_balanced.py first')
        sys.exit(1)

    log('[LOAD] Loading v3 model...')
    processor = WhisperProcessor.from_pretrained(FROZEN_MODEL_DIR)
    model = WhisperForConditionalGeneration.from_pretrained(FROZEN_MODEL_DIR)
    model.eval()

    si_token_id   = processor.tokenizer.convert_tokens_to_ids('<|si|>')
    transcribe_id = processor.tokenizer.convert_tokens_to_ids('<|transcribe|>')
    forced_ids    = [[1, si_token_id], [2, transcribe_id]]
    log(f'[INFO] Forcing Sinhala (token {si_token_id}) + transcribe')

    with open(TRANSCRIPTIONS, 'r', encoding='utf-8') as f:
        refs = json.load(f)
    log(f'[INFO] Reference transcriptions: {len(refs)}')

    results = []
    errors  = 0
    log(f'[RUN] Running inference on {len(refs)} files...')

    for i, (fid, ref_trans) in enumerate(refs.items()):
        audio_path = None
        for d in ['vedda-asr-model/data/processed', 'vedda-asr-model/data/raw']:
            p = os.path.join(d, f'{fid}.wav')
            if os.path.exists(p):
                audio_path = p
                break

        if audio_path is None:
            results.append({'file': f'{fid}.wav', 'status': 'error',
                            'transcription': '', 'error': 'Not found'})
            errors += 1
            continue

        try:
            audio, _ = librosa.load(audio_path, sr=16000, mono=True)
            inp = processor.feature_extractor(audio, sampling_rate=16000, return_tensors='pt')
            with torch.no_grad():
                ids = model.generate(
                    inp.input_features,
                    forced_decoder_ids=forced_ids,
                    max_new_tokens=100,
                    suppress_tokens=[],
                    no_repeat_ngram_size=4,
                    num_beams=5,
                    repetition_penalty=1.5,
                    length_penalty=0.8,
                    early_stopping=True,
                )
            pred = processor.tokenizer.batch_decode(ids, skip_special_tokens=True)[0].strip()
            results.append({'file': f'{fid}.wav', 'status': 'success',
                            'transcription': pred, 'reference': ref_trans})
        except Exception as e:
            results.append({'file': f'{fid}.wav', 'status': 'error',
                            'transcription': '', 'error': str(e)})
            errors += 1

        if i % 20 == 0:
            log(f'   {i}/{len(refs)} files...')

    output = {
        'timestamp': datetime.now().isoformat(),
        'model': FROZEN_MODEL_DIR,
        'device': 'cpu',
        'summary': {'total': len(results), 'success': len(results) - errors, 'errors': errors},
        'results': results,
    }
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    log(f'\n[OK] Saved {len(results)} results to {RESULTS_FILE}')
    log(f'[INFO] Errors: {errors}')
    log('[NEXT] Run: python verify_accuracy.py')


if __name__ == '__main__':
    main()
