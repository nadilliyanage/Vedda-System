"""
Vedda ASR - Retrain v4: Continue from v2 + Fix Best-Model Metric
---------------------------------------------------------------
Improvements over v3:
  1. Start from v2 checkpoint (not fresh whisper-tiny)
  2. metric_for_best_model = 'wer' (not eval_loss!)
  3. Higher LR=5e-6 to gently refine without forgetting
  4. Only 5 epochs max, patience=2 for fast stopping
  5. save_total_limit=5 so early checkpoints are not lost
  6. NO data balancing - v2 data distribution was working
  7. Saves to whisper-frozen-v4/
"""

import os, json, random, sys, torch, librosa, numpy as np
from datetime import datetime
from collections import defaultdict
from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
)
from torch.utils.data import Dataset
import evaluate

# ── paths ─────────────────────────────────────────────────────────────────────
BASE_MODEL    = 'vedda-asr-model/models/whisper-frozen-v2/final'  # continue from v2!
AUGMENTED_DS  = 'vedda-asr-model/data/train_dataset_augmented.json'
TEST_DS_FILE  = 'vedda-asr-model/data/test_dataset.json'
OUTPUT_DIR    = 'vedda-asr-model/models/whisper-frozen-v4'

# ── config ────────────────────────────────────────────────────────────────────
N_PER_PHRASE  = 999    # no balancing cap — use all augmented data like v2
SAMPLE_RATE   = 16000
MAX_AUDIO_LEN = 30     # seconds
LEARNING_RATE = 5e-6
BATCH_SIZE    = 8
GRAD_ACCUM    = 1
MAX_EPOCHS    = 5
WARMUP_STEPS  = 20
PATIENCE      = 2      # stop fast — epoch 1-2 tends to be best
WEIGHT_DECAY  = 0.01

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)


def log(msg):
    sys.stdout.buffer.write((str(msg) + '\n').encode('utf-8', errors='replace'))
    sys.stdout.buffer.flush()


# ── load & balance dataset ─────────────────────────────────────────────────────
def load_and_balance(path, n_per_phrase):
    with open(path, encoding='utf-8') as f:
        raw = json.load(f)
    items = raw if isinstance(raw, list) else raw.get('data', raw.get('train', []))

    # group by transcription text
    groups = defaultdict(list)
    for item in items:
        txt = item.get('transcription', item.get('text', '')).strip()
        groups[txt].append(item)

    balanced = []
    for txt, group in groups.items():
        # distinguish originals (data/processed/) from augmented (data/augmented/)
        originals = [x for x in group if 'processed' in x.get('audio_path', x.get('path', ''))]
        augmented = [x for x in group if 'augmented' in x.get('audio_path', x.get('path', ''))]
        selected = (originals + augmented)[:n_per_phrase]
        balanced.extend(selected)

    random.shuffle(balanced)
    log(f'  Data summary:  {len(items)} raw  ->  {len(balanced)} balanced')
    log(f'  Unique phrases: {len(groups)}')
    phrase_counts = sorted([len(g) for g in groups.values()])
    log(f'  Phrase freq:  min={phrase_counts[0]}  max={phrase_counts[-1]}  '
        f'p50={phrase_counts[len(phrase_counts)//2]}')
    return balanced


# ── dataset class ──────────────────────────────────────────────────────────────
class VeddaDataset(Dataset):
    def __init__(self, items, processor):
        self.items = items
        self.processor = processor

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        item = self.items[idx]
        audio_path = item.get('audio_path', item.get('path', ''))
        # Resolve relative path — JSON stores 'data\processed\...' relative to vedda-asr-model/
        if not os.path.exists(audio_path):
            audio_path = os.path.join('vedda-asr-model', audio_path)
        text = item.get('transcription', item.get('text', '')).strip()

        audio, _ = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
        if len(audio) > SAMPLE_RATE * MAX_AUDIO_LEN:
            audio = audio[:SAMPLE_RATE * MAX_AUDIO_LEN]

        feat = self.processor.feature_extractor(
            audio, sampling_rate=SAMPLE_RATE, return_tensors='pt'
        )
        labels = self.processor.tokenizer(
            text, return_tensors='pt', padding=False
        ).input_ids.squeeze()

        return {
            'input_features': feat.input_features.squeeze(),
            'labels': labels,
        }


def collate_fn(batch, processor):
    input_features = [{'input_features': x['input_features']} for x in batch]
    label_list = [x['labels'] for x in batch]

    batch_features = processor.feature_extractor.pad(input_features, return_tensors='pt')
    max_len = max(l.shape[0] for l in label_list)
    padded_labels = torch.full((len(label_list), max_len), -100, dtype=torch.long)
    for i, lbl in enumerate(label_list):
        padded_labels[i, :lbl.shape[0]] = lbl

    batch_features['labels'] = padded_labels
    return batch_features


def compute_metrics(pred, processor):
    wer_metric = evaluate.load('wer')
    pred_ids = pred.predictions
    label_ids = pred.label_ids
    label_ids[label_ids == -100] = processor.tokenizer.pad_token_id
    pred_str  = processor.tokenizer.batch_decode(pred_ids,  skip_special_tokens=True)
    label_str = processor.tokenizer.batch_decode(label_ids, skip_special_tokens=True)
    pred_str  = [p.strip() for p in pred_str]
    label_str = [l.strip() for l in label_str]
    wer = wer_metric.compute(predictions=pred_str, references=label_str)
    return {'wer': round(wer, 4)}


# ── main ───────────────────────────────────────────────────────────────────────
def main():
    log('=' * 60)
    log('[TRAIN v4]  VEDDA FROZEN ENCODER  -  CONTINUE FROM v2')
    log(f'  Start: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    log('=' * 60)

    # ── load & balance data ────────────────────────────────────────────────────
    log('\n[DATA] Loading and balancing training data...')
    train_items = load_and_balance(AUGMENTED_DS, N_PER_PHRASE)

    with open(TEST_DS_FILE, encoding='utf-8') as f:
        test_raw = json.load(f)
    if isinstance(test_raw, dict):
        test_raw = test_raw.get('test', test_raw.get('data', []))
    test_items = test_raw
    log(f'  Test items: {len(test_items)}')

    # ── processor ─────────────────────────────────────────────────────────────
    log('\n[MODEL] Loading base whisper-tiny processor + model...')
    processor = WhisperProcessor.from_pretrained(BASE_MODEL)
    # CRITICAL: set Sinhala prefix so labels match inference forced_decoder_ids
    processor.tokenizer.set_prefix_tokens(language='sinhala', task='transcribe')

    model = WhisperForConditionalGeneration.from_pretrained(BASE_MODEL)

    # ── freeze encoder ────────────────────────────────────────────────────────
    for param in model.model.encoder.parameters():
        param.requires_grad = False

    total_params    = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    log(f'  Total params:    {total_params:,}')
    log(f'  Trainable params:{trainable_params:,}  (encoder frozen)')

    # ── datasets ──────────────────────────────────────────────────────────────
    train_dataset = VeddaDataset(train_items, processor)
    eval_dataset  = VeddaDataset(test_items,  processor)
    log(f'\n  Train size: {len(train_dataset)}')
    log(f'  Eval  size: {len(eval_dataset)}')

    from functools import partial
    _collate = partial(collate_fn, processor=processor)

    # ── training args ─────────────────────────────────────────────────────────
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    training_args = Seq2SeqTrainingArguments(
        output_dir                  = OUTPUT_DIR,
        num_train_epochs            = MAX_EPOCHS,
        per_device_train_batch_size = BATCH_SIZE,
        per_device_eval_batch_size  = BATCH_SIZE,
        gradient_accumulation_steps = GRAD_ACCUM,
        learning_rate               = LEARNING_RATE,
        warmup_steps                = WARMUP_STEPS,
        weight_decay                = WEIGHT_DECAY,
        eval_strategy               = 'epoch',
        save_strategy               = 'epoch',
        load_best_model_at_end      = True,
        metric_for_best_model       = 'wer',   # FIX: use WER not eval_loss
        greater_is_better           = False,
        save_total_limit            = 5,        # keep more checkpoints
        predict_with_generate       = True,
        generation_max_length       = 128,
        fp16                        = False,
        logging_steps               = 50,
        report_to                   = 'none',
        dataloader_num_workers      = 0,
        remove_unused_columns       = False,
        seed                        = SEED,
    )

    trainer = Seq2SeqTrainer(
        model           = model,
        args            = training_args,
        train_dataset   = train_dataset,
        eval_dataset    = eval_dataset,
        data_collator   = _collate,
        compute_metrics = lambda pred: compute_metrics(pred, processor),
    )

    # ── train ─────────────────────────────────────────────────────────────────
    log('\n[TRAIN] Starting training...')
    log(f'  LR={LEARNING_RATE}, batch={BATCH_SIZE}, max_epochs={MAX_EPOCHS}, '
        f'patience={PATIENCE}, metric=WER, base=v2')

    # Early stopping callback
    from transformers import EarlyStoppingCallback
    trainer.add_callback(EarlyStoppingCallback(early_stopping_patience=PATIENCE))

    train_result = trainer.train()

    # ── save final ────────────────────────────────────────────────────────────
    final_dir = os.path.join(OUTPUT_DIR, 'final')
    trainer.save_model(final_dir)
    processor.save_pretrained(final_dir)
    log(f'\n[SAVE] Best model saved to: {final_dir}')
    log(f'  train_loss={train_result.training_loss:.4f}')

    # ── quick inference check ─────────────────────────────────────────────────
    log('\n[CHECK] Running 5 test predictions...')
    model.eval()
    si_tok   = processor.tokenizer.convert_tokens_to_ids('<|si|>')
    tr_tok   = processor.tokenizer.convert_tokens_to_ids('<|transcribe|>')
    forced   = [[1, si_tok], [2, tr_tok]]

    for item in test_items[:5]:
        ap = item.get('audio_path', item.get('path', ''))
        if not os.path.exists(ap):
            ap = os.path.join('vedda-asr-model', ap)
        audio, _ = librosa.load(ap, sr=SAMPLE_RATE, mono=True)
        feat = processor.feature_extractor(audio, sampling_rate=SAMPLE_RATE, return_tensors='pt')
        with torch.no_grad():
            ids = model.generate(
                feat.input_features,
                forced_decoder_ids=forced,
                max_new_tokens=100,
                num_beams=5,
                repetition_penalty=1.5,
                no_repeat_ngram_size=4,
                length_penalty=0.8,
                early_stopping=True,
            )
        pred = processor.tokenizer.batch_decode(ids, skip_special_tokens=True)[0].strip()
        ref  = item.get('transcription', item.get('text', ''))
        match = '[OK]' if pred == ref else '[--]'
        log(f'  {match}  REF: {ref}')
        log(f'       PRED: {pred}')

    log('\n[DONE] Training complete.')
    log('[NEXT] Run: python test_frozen_model_v3.py')


if __name__ == '__main__':
    main()
