"""
Evaluate whisper-vedda-final (Colab-trained whisper-small) on all available audio.
Single script: inference + WER/CER/exact-match in one run.

Usage:
    python eval_vedda_final.py [--limit N]

Options:
    --limit N   Only evaluate first N samples (default: all)
"""

import os, sys, json, torch, librosa, argparse
from datetime import datetime
from pathlib import Path
from transformers import WhisperProcessor, WhisperForConditionalGeneration

os.chdir(os.path.dirname(os.path.abspath(__file__)))

MODEL_DIR     = 'vedda-asr-model/models/whisper-vedda-final'
TRANS_FILE    = 'vedda-asr-model/data/transcriptions.json'
AUDIO_DIRS    = ['vedda-asr-model/data/processed', 'vedda-asr-model/data/raw']
RESULTS_FILE  = 'eval_vedda_final_results.json'

def log(msg):
    sys.stdout.buffer.write((str(msg) + '\n').encode('utf-8', errors='replace'))
    sys.stdout.buffer.flush()

# ─── WER / CER ────────────────────────────────────────────────────────────────

def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = list(range(n + 1))
    for i in range(1, m + 1):
        prev = dp[0]
        dp[0] = i
        for j in range(1, n + 1):
            tmp = dp[j]
            if a[i-1] == b[j-1]:
                dp[j] = prev
            else:
                dp[j] = 1 + min(prev, dp[j], dp[j-1])
            prev = tmp
    return dp[n]

def wer(ref, hyp):
    r, h = ref.split(), hyp.split()
    if len(r) == 0:
        return 0.0 if len(h) == 0 else 1.0
    return min(edit_distance(r, h) / len(r), 1.0)

def cer(ref, hyp):
    if len(ref) == 0:
        return 0.0 if len(hyp) == 0 else 1.0
    return min(edit_distance(list(ref), list(hyp)) / len(ref), 1.0)

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=None)
    args = parser.parse_args()

    log('=' * 65)
    log('[EVAL] whisper-vedda-final  (Colab whisper-small fine-tuned)')
    log('=' * 65)

    # Check model
    if not os.path.exists(MODEL_DIR):
        log(f'[ERROR] Model not found: {MODEL_DIR}')
        sys.exit(1)

    model_files = os.listdir(MODEL_DIR)
    log(f'[INFO] Model dir: {MODEL_DIR}')
    log(f'[INFO] Files:     {model_files}')

    # Load model
    log('\n[LOAD] Loading processor and model...')
    processor = WhisperProcessor.from_pretrained(MODEL_DIR)
    model = WhisperForConditionalGeneration.from_pretrained(MODEL_DIR)
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device).eval()

    si_id  = processor.tokenizer.convert_tokens_to_ids('<|si|>')
    tr_id  = processor.tokenizer.convert_tokens_to_ids('<|transcribe|>')
    params = sum(p.numel() for p in model.parameters())

    log(f'[INFO] Device:         {device}')
    log(f'[INFO] Params:         {params/1e6:.1f}M')
    log(f'[INFO] si_token_id:    {si_id}  ("si" = Sinhala)')
    log(f'[INFO] transcribe_id:  {tr_id}')
    log('[INFO] Using modern language/task API (no manual forced_decoder_ids)')

    # Load references
    log(f'\n[DATA] Loading references from {TRANS_FILE}...')
    with open(TRANS_FILE, 'r', encoding='utf-8') as f:
        refs = json.load(f)

    # Filter to files we actually have audio for
    available = []
    for fid, ref in refs.items():
        for d in AUDIO_DIRS:
            p = os.path.join(d, f'{fid}.wav')
            if os.path.exists(p):
                available.append((fid, ref, p))
                break

    log(f'[INFO] References:     {len(refs)}')
    log(f'[INFO] Audio found:    {len(available)}')

    if args.limit:
        available = available[:args.limit]
        log(f'[INFO] Limited to:     {args.limit}')

    # Inference
    log(f'\n[RUN] Running inference on {len(available)} samples...\n')

    results   = []
    wers, cers = [], []
    exact     = 0
    errors    = 0

    for i, (fid, ref, audio_path) in enumerate(available):
        try:
            audio, _ = librosa.load(audio_path, sr=16000, mono=True)
            inp = processor.feature_extractor(audio, sampling_rate=16000, return_tensors='pt')
            with torch.no_grad():
                ids = model.generate(
                    inp.input_features.to(device),
                    language='si',
                    task='transcribe',
                    max_new_tokens=100,
                    no_repeat_ngram_size=4,
                    num_beams=5,
                    repetition_penalty=1.5,
                    length_penalty=0.8,
                    early_stopping=True,
                )
            pred = processor.tokenizer.batch_decode(ids, skip_special_tokens=True)[0].strip()

            w = wer(ref, pred)
            c = cer(ref, pred)
            wers.append(w)
            cers.append(c)
            is_exact = (pred == ref)
            if is_exact:
                exact += 1

            results.append({
                'file':      f'{fid}.wav',
                'reference': ref,
                'predicted': pred,
                'exact':     is_exact,
                'wer':       round(w, 4),
                'cer':       round(c, 4),
                'status':    'success',
            })

        except Exception as e:
            log(f'  [ERR] {fid}: {e}')
            results.append({'file': f'{fid}.wav', 'status': 'error', 'error': str(e)})
            errors += 1

        # Progress every 25 samples
        if (i + 1) % 25 == 0 or i == 0:
            avg_w = sum(wers)/len(wers) if wers else 0
            log(f'  [{i+1:>4}/{len(available)}]  WER so far: {avg_w*100:.1f}%  exact: {exact}')

    # Summary
    n = len(wers)
    avg_wer = sum(wers) / n if n else 1.0
    avg_cer = sum(cers) / n if n else 1.0
    exact_pct = exact / n * 100 if n else 0

    log('\n' + '=' * 65)
    log('[RESULTS] whisper-vedda-final evaluation')
    log('=' * 65)
    log(f'  Samples evaluated : {n}')
    log(f'  Errors            : {errors}')
    log(f'  Exact matches     : {exact} / {n}  ({exact_pct:.1f}%)')
    log(f'  Avg WER           : {avg_wer*100:.2f}%')
    log(f'  Avg CER           : {avg_cer*100:.2f}%')
    log('=' * 65)

    # Show some examples
    log('\n[SAMPLES] First 10 results:')
    for r in results[:10]:
        if r['status'] == 'success':
            mark = '✔' if r['exact'] else '✘'
            log(f'  {mark}  ref: {r["reference"]}')
            log(f'     pred: {r["predicted"]}')
            log(f'     WER={r["wer"]:.2f}  CER={r["cer"]:.2f}')
            log('')

    # Save full results
    output = {
        'timestamp': datetime.now().isoformat(),
        'model':     MODEL_DIR,
        'device':    str(device),
        'params_M':  round(params/1e6, 1),
        'summary': {
            'total':     len(available),
            'evaluated': n,
            'errors':    errors,
            'exact':     exact,
            'exact_pct': round(exact_pct, 2),
            'avg_wer':   round(avg_wer * 100, 2),
            'avg_cer':   round(avg_cer * 100, 2),
        },
        'results': results,
    }
    with open(RESULTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    log(f'\n[SAVED] Full results → {RESULTS_FILE}')
    log('[TIP] CER is more meaningful than WER for Sinhala (diacritics count as full word mismatches in WER)')

    if avg_wer < 0.30:
        log('\n[GRADE] Excellent (WER < 30%) ✔')
    elif avg_wer < 0.60:
        log('\n[GRADE] Good (WER < 60%) — production usable')
    else:
        log('\n[GRADE] Needs improvement — consider further fine-tuning')


if __name__ == '__main__':
    main()
