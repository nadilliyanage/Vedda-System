"""
Verify transcriptions.json against dataset.json (raw data)
"""

import json
import os
from pathlib import Path

def verify_against_dataset():
    """Check transcriptions against raw dataset.json"""
    
    dataset_file = 'data/dataset.json'
    train_file = 'data/train_dataset.json'
    test_file = 'data/test_dataset.json'
    transcriptions_file = 'data/transcriptions.json'
    
    print("\n" + "="*60)
    print("🔍 COMPLETE VERIFICATION REPORT")
    print("="*60)
    
    # Check which files exist
    print(f"\n📂 Files found:")
    print(f"   dataset.json: {'✅' if os.path.exists(dataset_file) else '❌'}")
    print(f"   train_dataset.json: {'✅' if os.path.exists(train_file) else '❌'}")
    print(f"   test_dataset.json: {'✅' if os.path.exists(test_file) else '❌'}")
    print(f"   transcriptions.json: {'✅' if os.path.exists(transcriptions_file) else '❌'}")
    
    # Load all files
    if os.path.exists(dataset_file):
        with open(dataset_file, 'r', encoding='utf-8') as f:
            dataset = json.load(f)
        dataset_entries = dataset.get('data', [])
        print(f"\n📊 dataset.json: {len(dataset_entries)} entries (raw)")
    else:
        print(f"\n❌ dataset.json not found, skipping")
        return
    
    if os.path.exists(train_file):
        with open(train_file, 'r', encoding='utf-8') as f:
            train_data = json.load(f)
        train_entries = train_data.get('data', [])
        print(f"   train_dataset.json: {len(train_entries)} entries (training set)")
    
    if os.path.exists(test_file):
        with open(test_file, 'r', encoding='utf-8') as f:
            test_data = json.load(f)
        test_entries = test_data.get('data', [])
        print(f"   test_dataset.json: {len(test_entries)} entries (test set)")
    
    if os.path.exists(transcriptions_file):
        with open(transcriptions_file, 'r', encoding='utf-8') as f:
            transcriptions = json.load(f)
        print(f"   transcriptions.json: {len(transcriptions)} entries (extracted)")
    else:
        transcriptions = {}
    
    # Compare dataset.json vs transcriptions.json
    print(f"\n" + "-"*60)
    print("🔎 COMPARING: dataset.json vs transcriptions.json")
    print("-"*60)
    
    missing_in_trans = []
    for entry in dataset_entries:
        filename = Path(entry['audio_path']).stem
        transcription = entry['transcription']
        
        if filename not in transcriptions:
            missing_in_trans.append({
                'filename': filename,
                'transcription': transcription
            })
    
    print(f"\n❌ Missing in transcriptions.json: {len(missing_in_trans)}")
    if missing_in_trans:
        print(f"\n   First 10 missing:")
        for item in missing_in_trans[:10]:
            print(f'   "{item["filename"]}": "{item["transcription"]}"')
        
        if len(missing_in_trans) > 10:
            print(f"   ... and {len(missing_in_trans) - 10} more")
        
        # Fix it
        print(f"\n✅ Adding {len(missing_in_trans)} missing transcriptions...")
        for item in missing_in_trans:
            transcriptions[item['filename']] = item['transcription']
        
        with open(transcriptions_file, 'w', encoding='utf-8') as f:
            json.dump(transcriptions, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Updated! New total: {len(transcriptions)} entries")
    else:
        print(f"\n✅ All {len(dataset_entries)} entries have transcriptions!")
    
    print(f"\n{'='*60}\n")


if __name__ == '__main__':
    verify_against_dataset()
