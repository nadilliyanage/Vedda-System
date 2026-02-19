"""
Spot check inference - compare with/without forced_decoder_ids
Write output to a file to avoid Windows cp1252 issues.
"""
import json, torch, librosa, os, sys
from transformers import WhisperProcessor, WhisperForConditionalGeneration

output = []

def log(msg):
    output.append(msg)
    sys.stdout.buffer.write((msg + '\n').encode('utf-8', errors='replace'))
    sys.stdout.buffer.flush()

with open('vedda-asr-model/data/transcriptions.json', 'r', encoding='utf-8') as f:
    refs = json.load(f)
test_files = list(refs.items())[:10]

FINAL_DIR = 'vedda-asr-model/models/whisper-vedda-final/final'
processor = WhisperProcessor.from_pretrained(FINAL_DIR)
model = WhisperForConditionalGeneration.from_pretrained(FINAL_DIR)
model.eval()

results = {}

for mode, kwargs in [
    ('no_force', {}),
    ('si_transcribe', {'forced_decoder_ids': processor.get_decoder_prompt_ids(language='si', task='transcribe')}),
]:
    log(f'\n=== MODE: {mode} ===')
    results[mode] = []
    for fid, ref_trans in test_files:
        audio_path = f'vedda-asr-model/data/raw/{fid}.wav'
        if not os.path.exists(audio_path):
            audio_path = f'vedda-asr-model/data/processed/{fid}.wav'
        if not os.path.exists(audio_path):
            log(f'  MISSING: {fid}')
            continue
        audio, _ = librosa.load(audio_path, sr=16000, mono=True)
        inputs = processor.feature_extractor(audio, sampling_rate=16000, return_tensors='pt')
        with torch.no_grad():
            ids = model.generate(inputs.input_features, max_new_tokens=225, **kwargs)
        pred = processor.tokenizer.batch_decode(ids, skip_special_tokens=True)[0].strip()
        log(f'  REF : {ref_trans}')
        log(f'  PRED: {pred}')
        log('')
        results[mode].append({'ref': ref_trans, 'pred': pred})

# Save
with open('spot_check_results.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

with open('spot_check_results.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print('\n[OK] Saved: spot_check_results.json and spot_check_results.txt')
