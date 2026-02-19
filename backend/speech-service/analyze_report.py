import json, sys
from collections import Counter

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

with open('accuracy_report.json', encoding='utf-8') as f:
    report = json.load(f)

results = report.get('detailed_results', [])

# Show exact matches
print('=== EXACT MATCHES ===')
exact = [r for r in results if r.get('match_type', '') == '✅ EXACT']
for r in exact:
    print(f'  {r["file_id"]}')
    print(f'  Text: {r["reference"]}')
    print()

# Show top partial matches (lowest CER)
print('=== TOP PARTIAL MATCHES (by CER) ===')
partial = [r for r in results if r.get('match_type', '') not in ('✅ EXACT',) and r.get('cer', 1.0) < 1.0]
partial.sort(key=lambda x: x.get('cer', 1.0))
for r in partial[:15]:
    print(f'  REF : {r["reference"]}')
    print(f'  PRED: {r["prediction"]}')
    print(f'  WER={r.get("wer",0)*100:.0f}%  CER={r.get("cer",0)*100:.0f}%')
    print()

# Bias analysis
preds = [r.get('prediction', '') for r in results]
all_words = []
for p in preds:
    all_words.extend(p.split())
word_freq = Counter(all_words)
print('=== MOST COMMON OUTPUT WORDS ===')
for w, c in word_freq.most_common(20):
    print(f'  {c:3d}x  {w}')

unique_preds = set(preds)
print(f'\nTotal predictions: {len(preds)}')
print(f'Unique predictions: {len(unique_preds)}')
print(f'Repetition rate: {(len(preds)-len(unique_preds))/len(preds)*100:.0f}% duplicate outputs')
