"""
Prepare Vedda dataset for training
Converts collected audio data to Hugging Face dataset format
"""

import json
import pandas as pd
from pathlib import Path
from datasets import Dataset, DatasetDict, Audio, Features, Value
import argparse

def load_metadata(metadata_path):
    """Load metadata JSON file"""
    with open(metadata_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_audio_files(metadata, base_dir):
    """Check if all audio files exist"""
    valid_entries = []
    missing_files = []
    
    for entry in metadata:
        audio_path = Path(base_dir) / entry['audio_filepath']
        if audio_path.exists():
            # Update to absolute path
            entry['audio_filepath'] = str(audio_path.absolute())
            valid_entries.append(entry)
        else:
            missing_files.append(entry['audio_filepath'])
    
    if missing_files:
        print(f"⚠️  Warning: {len(missing_files)} audio files not found:")
        for f in missing_files[:5]:  # Show first 5
            print(f"  - {f}")
        if len(missing_files) > 5:
            print(f"  ... and {len(missing_files) - 5} more")
    
    return valid_entries

def split_dataset(data, train_ratio=0.8, val_ratio=0.1, test_ratio=0.1):
    """Split dataset into train/validation/test sets"""
    import random
    random.shuffle(data)
    
    n = len(data)
    train_size = int(n * train_ratio)
    val_size = int(n * val_ratio)
    
    train_data = data[:train_size]
    val_data = data[train_size:train_size + val_size]
    test_data = data[train_size + val_size:]
    
    return train_data, val_data, test_data

def prepare_vedda_dataset(
    metadata_path,
    output_dir,
    train_ratio=0.8,
    val_ratio=0.1,
    test_ratio=0.1
):
    """
    Prepare Vedda dataset for training
    
    Args:
        metadata_path: Path to metadata.json
        output_dir: Output directory for processed dataset
        train_ratio: Ratio for training set (default: 0.8)
        val_ratio: Ratio for validation set (default: 0.1)
        test_ratio: Ratio for test set (default: 0.1)
    """
    print("="*60)
    print("VEDDA DATASET PREPARATION")
    print("="*60)
    
    # Load metadata
    print(f"\n1. Loading metadata from {metadata_path}...")
    metadata = load_metadata(metadata_path)
    print(f"   Found {len(metadata)} recordings")
    
    # Validate audio files
    print("\n2. Validating audio files...")
    base_dir = Path(metadata_path).parent
    valid_data = validate_audio_files(metadata, base_dir)
    print(f"   ✅ {len(valid_data)} valid audio files")
    
    # Calculate statistics
    total_duration = sum(item['duration'] for item in valid_data)
    speakers = len(set(item['speaker_id'] for item in valid_data))
    print(f"\n3. Dataset Statistics:")
    print(f"   - Total duration: {total_duration/3600:.2f} hours")
    print(f"   - Number of speakers: {speakers}")
    print(f"   - Average duration: {total_duration/len(valid_data):.2f} seconds")
    
    # Split dataset
    print("\n4. Splitting dataset...")
    train_data, val_data, test_data = split_dataset(
        valid_data, train_ratio, val_ratio, test_ratio
    )
    
    print(f"   - Train: {len(train_data)} samples ({len(train_data)/len(valid_data)*100:.1f}%)")
    print(f"   - Validation: {len(val_data)} samples ({len(val_data)/len(valid_data)*100:.1f}%)")
    print(f"   - Test: {len(test_data)} samples ({len(test_data)/len(valid_data)*100:.1f}%)")
    
    # Convert to DataFrames
    print("\n5. Converting to Hugging Face Dataset format...")
    train_df = pd.DataFrame(train_data)
    val_df = pd.DataFrame(val_data)
    test_df = pd.DataFrame(test_data)
    
    # Define features
    features = Features({
        'audio': Audio(sampling_rate=16000),
        'text': Value('string'),
        'speaker_id': Value('string'),
        'duration': Value('float32'),
    })
    
    # Create datasets with proper column names
    train_df = train_df.rename(columns={'audio_filepath': 'audio'})
    val_df = val_df.rename(columns={'audio_filepath': 'audio'})
    test_df = test_df.rename(columns={'audio_filepath': 'audio'})
    
    # Select only needed columns
    columns = ['audio', 'text', 'speaker_id', 'duration']
    train_df = train_df[columns]
    val_df = val_df[columns]
    test_df = test_df[columns]
    
    # Convert to HF Dataset
    train_dataset = Dataset.from_pandas(train_df, features=features)
    val_dataset = Dataset.from_pandas(val_df, features=features)
    test_dataset = Dataset.from_pandas(test_df, features=features)
    
    # Create DatasetDict
    dataset_dict = DatasetDict({
        'train': train_dataset,
        'validation': val_dataset,
        'test': test_dataset
    })
    
    # Save dataset
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"\n6. Saving dataset to {output_path}...")
    dataset_dict.save_to_disk(str(output_path))
    
    # Save dataset info
    info = {
        'total_samples': len(valid_data),
        'train_samples': len(train_data),
        'val_samples': len(val_data),
        'test_samples': len(test_data),
        'total_duration_hours': total_duration / 3600,
        'num_speakers': speakers,
        'sample_rate': 16000,
        'splits': {
            'train': train_ratio,
            'validation': val_ratio,
            'test': test_ratio
        }
    }
    
    with open(output_path / 'dataset_info.json', 'w') as f:
        json.dump(info, f, indent=2)
    
    print("\n" + "="*60)
    print("✅ DATASET PREPARATION COMPLETE!")
    print("="*60)
    print(f"\nDataset saved to: {output_path}")
    print(f"\nYou can now train your model using:")
    print(f"  python scripts/train_vedda_whisper.py --dataset_path {output_path}")
    
    return dataset_dict


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare Vedda dataset for training")
    parser.add_argument(
        "--metadata",
        type=str,
        default="vedda_dataset/metadata.json",
        help="Path to metadata.json file"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="vedda_dataset_prepared",
        help="Output directory for prepared dataset"
    )
    parser.add_argument(
        "--train-ratio",
        type=float,
        default=0.8,
        help="Training set ratio (default: 0.8)"
    )
    parser.add_argument(
        "--val-ratio",
        type=float,
        default=0.1,
        help="Validation set ratio (default: 0.1)"
    )
    parser.add_argument(
        "--test-ratio",
        type=float,
        default=0.1,
        help="Test set ratio (default: 0.1)"
    )
    
    args = parser.parse_args()
    
    prepare_vedda_dataset(
        metadata_path=args.metadata,
        output_dir=args.output,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio
    )
