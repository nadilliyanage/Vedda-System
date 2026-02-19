import json, sys
from collections import Counter

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

with open('vedda-asr-model/data/train_dataset_augmented.json', encoding='utf-8') as f:
    raw = json.load(f)

if isinstance(raw, list):
    items = raw
else:
    items = raw.get('data', raw.get('train', raw.get('data', list(raw.values())[0] if raw else [])))

print(f'Total training items: {len(items)}')
if items:
    print('First item keys:', list(items[0].keys()) if isinstance(items[0], dict) else type(items[0]))
    sample = items[0]
    text_key = 'text' if 'text' in sample else 'transcription' if 'transcription' in sample else list(sample.keys())[0]
    print(f'Text key: {text_key}')
    print(f'Sample text: {sample[text_key]}')

transcriptions = []
for item in items:
    if isinstance(item, dict):
        t = item.get('text', item.get('transcription', ''))
    else:
        t = str(item)
    transcriptions.append(t)

phrase_count = Counter(transcriptions)
words_all = []
for t in transcriptions:
    words_all.extend(t.split())
word_count = Counter(words_all)

print('\nTop 20 phrases in training data:')
for p, c in phrase_count.most_common(20):
    print(f'  {c}x  {p}')

print('\nTop 20 words in training data:')
for w, c in word_count.most_common(20):
    print(f'  {c}x  {w}')

pojja_target = '\u0ddc\u0da2\u0dca\u0da2'  # පොජ්ජ
pojja_count = sum(1 for t in transcriptions if pojja_target in t)
print(f'\npojja-containing phrases: {pojja_count}/{len(transcriptions)} = {pojja_count/len(transcriptions)*100:.1f}%')

unique = len(set(transcriptions))
print(f'Unique transcriptions: {unique} / {len(transcriptions)} = {unique/len(transcriptions)*100:.1f}% unique')
