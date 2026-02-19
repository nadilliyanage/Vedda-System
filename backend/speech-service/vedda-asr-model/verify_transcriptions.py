"""
Verify transcriptions.json completeness and find missing entries
"""

import json
import os
from pathlib import Path

def verify_transcriptions():
    """Check if all audio files have transcriptions"""
    
    train_file = 'data/train_dataset.json'
    transcriptions_file = 'data/transcriptions.json'
    
    if not os.path.exists(train_file):
        print(f"❌ {train_file} not found")
        return
    
    if not os.path.exists(transcriptions_file):
        print(f"❌ {transcriptions_file} not found")
        return
    
    # Load files
    with open(train_file, 'r', encoding='utf-8') as f:
        train_data = json.load(f)
    
    with open(transcriptions_file, 'r', encoding='utf-8') as f:
        transcriptions = json.load(f)
    
    # Check completeness
    print("\n" + "="*60)
    print("🔍 VERIFICATION REPORT")
    print("="*60)
    
    train_entries = train_data['data']
    missing = []
    duplicates = {}
    
    for entry in train_entries:
        audio_path = entry['audio_path']
        filename = Path(audio_path).stem
        transcription = entry['transcription']
        
        # Check if in transcriptions.json
        if filename not in transcriptions:
            missing.append({
                'filename': filename,
                'transcription': transcription,
                'audio_path': audio_path
            })
        else:
            # Check if transcription matches
            if transcriptions[filename] != transcription:
                print(f"⚠️  Mismatch for {filename}")
    
    print(f"\n📊 Statistics:")
    print(f"   Train dataset entries: {len(train_entries)}")
    print(f"   Transcriptions.json entries: {len(transcriptions)}")
    print(f"   Missing: {len(missing)}")
    
    if missing:
        print(f"\n❌ MISSING TRANSCRIPTIONS ({len(missing)} total):")
        for item in missing[:10]:  # Show first 10
            print(f'   "{item["filename"]}": "{item["transcription"]}"')
        
        if len(missing) > 10:
            print(f"   ... and {len(missing) - 10} more")
        
        # Add missing to transcriptions.json
        print(f"\n✅ Adding {len(missing)} missing transcriptions...")
        for item in missing:
            transcriptions[item['filename']] = item['transcription']
        
        # Save updated transcriptions
        with open(transcriptions_file, 'w', encoding='utf-8') as f:
            json.dump(transcriptions, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Updated transcriptions.json with {len(missing)} entries")
        print(f"   New total: {len(transcriptions)}")
    else:
        print(f"\n✅ All transcriptions are complete!")
    
    print(f"\n{'='*60}\n")


if __name__ == '__main__':
    verify_transcriptions()
