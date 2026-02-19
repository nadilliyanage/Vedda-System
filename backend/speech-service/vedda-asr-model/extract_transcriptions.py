"""
Extract transcriptions from train_dataset.json into Colab-compatible format

This creates a transcriptions.json file for uploading to Google Drive
"""

import json
import os
from pathlib import Path

def extract_transcriptions():
    """Extract transcriptions from train_dataset.json"""
    
    train_file = 'data/train_dataset.json'
    output_file = 'data/transcriptions.json'
    
    if not os.path.exists(train_file):
        print(f"❌ Error: {train_file} not found")
        return
    
    print(f"📂 Loading {train_file}...")
    
    # Load train dataset
    with open(train_file, 'r', encoding='utf-8') as f:
        train_data = json.load(f)
    
    # Extract transcriptions
    transcriptions = {}
    
    for entry in train_data['data']:
        audio_path = entry['audio_path']
        transcription = entry['transcription']
        
        # Get filename without extension
        filename = Path(audio_path).stem  # Gets: vedda_110_20260211_231344_476c8be5
        
        # Store in format: {"filename": "transcription"}
        transcriptions[filename] = transcription
    
    print(f"✅ Extracted {len(transcriptions)} transcriptions")
    
    # Save to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(transcriptions, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Saved to: {output_file}")
    print(f"\n📋 File content preview:")
    preview_items = list(transcriptions.items())[:3]
    for key, value in preview_items:
        print(f'   "{key}": "{value}"')
    print(f"   ... ({len(transcriptions)} total)")
    
    print(f"\n📥 NEXT STEPS:")
    print(f"   1. Upload audio files from data/processed/ to:")
    print(f"      Google Drive → vedda-asr-dataset/audio/")
    print(f"   2. Upload transcriptions.json to:")
    print(f"      Google Drive → vedda-asr-dataset/")
    print(f"\n✅ Ready for Colab training!")


if __name__ == '__main__':
    extract_transcriptions()
