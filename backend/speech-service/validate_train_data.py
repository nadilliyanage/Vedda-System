"""Quick validation of the training data balancing logic."""
import json, sys, os
from collections import defaultdict, Counter

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

N_PER_PHRASE = 4

with open('vedda-asr-model/data/train_dataset_augmented.json', encoding='utf-8') as f:
    raw = json.load(f)
items = raw if isinstance(raw, list) else raw.get('data', raw.get('train', []))

groups = defaultdict(list)
for item in items:
    txt = item.get('transcription', item.get('text', '')).strip()
    groups[txt].append(item)

balanced = []
for txt, group in groups.items():
    originals = [x for x in group if 'processed' in x.get('audio_path', x.get('path', ''))]
    augmented = [x for x in group if 'augmented' in x.get('audio_path', x.get('path', ''))]
    selected = (originals + augmented)[:N_PER_PHRASE]
    balanced.extend(selected)

print(f'Raw: {len(items)}, Balanced: {len(balanced)}, Unique: {len(groups)}')

# verify top phrases
txts = [item.get('transcription', '') for item in balanced]
cnt = Counter(txts)
print('Top 10 phrases after balancing:')
for p, c in cnt.most_common(10):
    print(f'  {c}x  {p}')

# verify paths exist  
broken = 0
for item in balanced:
    p = item.get('audio_path', item.get('path', ''))
    if not os.path.exists(p):
        p = os.path.join('vedda-asr-model', p)
    if not os.path.exists(p):
        broken += 1
print(f'Broken paths: {broken}/{len(balanced)}')
