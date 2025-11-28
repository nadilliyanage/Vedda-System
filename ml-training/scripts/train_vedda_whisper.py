"""
Train Custom Vedda Whisper Model
Fine-tunes OpenAI Whisper for Vedda language speech recognition
"""

import torch
from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
)
from datasets import load_from_disk, DatasetDict
from dataclasses import dataclass
from typing import Any, Dict, List, Union
import evaluate
import argparse
from pathlib import Path
import json

# Load WER metric
wer_metric = evaluate.load("wer")

@dataclass
class DataCollatorSpeechSeq2SeqWithPadding:
    """Data collator for speech-to-text"""
    processor: Any
    decoder_start_token_id: int

    def __call__(self, features: List[Dict[str, Union[List[int], torch.Tensor]]]) -> Dict[str, torch.Tensor]:
        # Split inputs and labels since they need different padding
        model_input_name = self.processor.model_input_names[0]
        input_features = [{model_input_name: feature[model_input_name]} for feature in features]
        label_features = [{"input_ids": feature["labels"]} for feature in features]

        # Pad inputs
        batch = self.processor.feature_extractor.pad(input_features, return_tensors="pt")

        # Pad labels
        labels_batch = self.processor.tokenizer.pad(label_features, return_tensors="pt")

        # Replace padding with -100 to ignore loss correctly
        labels = labels_batch["input_ids"].masked_fill(
            labels_batch.attention_mask.ne(1), -100
        )

        # If bos token is appended in previous tokenization step,
        # cut bos token here as it's append later anyways
        if (labels[:, 0] == self.decoder_start_token_id).all().cpu().item():
            labels = labels[:, 1:]

        batch["labels"] = labels

        return batch


def prepare_dataset(batch, processor):
    """Prepare audio features and tokenize text"""
    # Load and process audio
    audio = batch["audio"]
    
    # Compute log-Mel input features
    batch["input_features"] = processor.feature_extractor(
        audio["array"], 
        sampling_rate=audio["sampling_rate"]
    ).input_features[0]
    
    # Tokenize text
    batch["labels"] = processor.tokenizer(batch["text"]).input_ids
    
    return batch


def compute_metrics(pred, processor):
    """Compute WER metric"""
    pred_ids = pred.predictions
    label_ids = pred.label_ids

    # Replace -100 with pad token id
    label_ids[label_ids == -100] = processor.tokenizer.pad_token_id

    # Decode predictions and labels
    pred_str = processor.tokenizer.batch_decode(pred_ids, skip_special_tokens=True)
    label_str = processor.tokenizer.batch_decode(label_ids, skip_special_tokens=True)

    # Compute WER
    wer = 100 * wer_metric.compute(predictions=pred_str, references=label_str)

    return {"wer": wer}


def train_vedda_whisper(
    dataset_path,
    model_name="openai/whisper-small",
    output_dir="./vedda-whisper-model",
    num_epochs=10,
    batch_size=16,
    learning_rate=1e-5,
    warmup_steps=500,
    gradient_accumulation_steps=1,
    fp16=True,
    push_to_hub=False,
):
    """
    Train Vedda Whisper model
    
    Args:
        dataset_path: Path to prepared dataset
        model_name: Base Whisper model to fine-tune
        output_dir: Where to save the trained model
        num_epochs: Number of training epochs
        batch_size: Per-device batch size
        learning_rate: Learning rate
        warmup_steps: Number of warmup steps
        gradient_accumulation_steps: Gradient accumulation steps
        fp16: Use mixed precision training
        push_to_hub: Push model to Hugging Face Hub
    """
    
    print("="*70)
    print("VEDDA WHISPER MODEL TRAINING")
    print("="*70)
    
    # Load dataset
    print(f"\n1. Loading dataset from {dataset_path}...")
    dataset = load_from_disk(dataset_path)
    
    # Print dataset info
    print(f"\nDataset splits:")
    for split, data in dataset.items():
        print(f"  - {split}: {len(data)} samples")
    
    # Load dataset info
    info_path = Path(dataset_path) / "dataset_info.json"
    if info_path.exists():
        with open(info_path) as f:
            info = json.load(f)
        print(f"\nDataset info:")
        print(f"  - Total duration: {info.get('total_duration_hours', 0):.2f} hours")
        print(f"  - Speakers: {info.get('num_speakers', 0)}")
    
    # Load processor and model
    print(f"\n2. Loading {model_name} model and processor...")
    processor = WhisperProcessor.from_pretrained(model_name)
    model = WhisperForConditionalGeneration.from_pretrained(model_name)
    
    # Set language to Sinhala (closest to Vedda)
    model.generation_config.language = "sinhalese"
    model.generation_config.task = "transcribe"
    
    # Force the model to use Sinhala decoder prompt
    model.config.forced_decoder_ids = None
    model.generation_config.forced_decoder_ids = processor.get_decoder_prompt_ids(
        language="si", task="transcribe"
    )
    
    # Prepare dataset
    print("\n3. Preparing dataset features...")
    dataset = dataset.map(
        lambda batch: prepare_dataset(batch, processor),
        remove_columns=dataset["train"].column_names,
        num_proc=4,  # Use multiprocessing
    )
    
    # Data collator
    data_collator = DataCollatorSpeechSeq2SeqWithPadding(
        processor=processor,
        decoder_start_token_id=model.config.decoder_start_token_id,
    )
    
    # Training arguments
    print("\n4. Setting up training arguments...")
    training_args = Seq2SeqTrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=batch_size,
        gradient_accumulation_steps=gradient_accumulation_steps,
        learning_rate=learning_rate,
        warmup_steps=warmup_steps,
        num_train_epochs=num_epochs,
        gradient_checkpointing=True,
        fp16=fp16 and torch.cuda.is_available(),
        eval_strategy="steps",
        per_device_eval_batch_size=8,
        predict_with_generate=True,
        generation_max_length=225,
        save_steps=500,
        eval_steps=500,
        logging_steps=25,
        report_to=["tensorboard"],
        load_best_model_at_end=True,
        metric_for_best_model="wer",
        greater_is_better=False,
        push_to_hub=push_to_hub,
        save_total_limit=3,  # Only keep best 3 checkpoints
    )
    
    print(f"\nTraining configuration:")
    print(f"  - Epochs: {num_epochs}")
    print(f"  - Batch size: {batch_size}")
    print(f"  - Learning rate: {learning_rate}")
    print(f"  - Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
    print(f"  - Mixed precision (FP16): {fp16 and torch.cuda.is_available()}")
    
    # Initialize trainer
    print("\n5. Initializing trainer...")
    trainer = Seq2SeqTrainer(
        args=training_args,
        model=model,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        data_collator=data_collator,
        compute_metrics=lambda pred: compute_metrics(pred, processor),
        tokenizer=processor.feature_extractor,
    )
    
    # Train!
    print("\n6. Starting training...")
    print("="*70)
    trainer.train()
    
    # Evaluate on test set
    print("\n7. Evaluating on test set...")
    test_results = trainer.evaluate(dataset["test"])
    print(f"\nTest Results:")
    print(f"  - WER: {test_results['eval_wer']:.2f}%")
    print(f"  - Loss: {test_results['eval_loss']:.4f}")
    
    # Save final model
    print(f"\n8. Saving model to {output_dir}...")
    trainer.save_model(output_dir)
    processor.save_pretrained(output_dir)
    
    # Save training info
    training_info = {
        "model_name": model_name,
        "num_epochs": num_epochs,
        "final_wer": test_results['eval_wer'],
        "final_loss": test_results['eval_loss'],
        "dataset_path": str(dataset_path),
        "training_samples": len(dataset["train"]),
        "validation_samples": len(dataset["validation"]),
        "test_samples": len(dataset["test"]),
    }
    
    with open(Path(output_dir) / "training_info.json", 'w') as f:
        json.dump(training_info, f, indent=2)
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETE!")
    print("="*70)
    print(f"\nModel saved to: {output_dir}")
    print(f"Test WER: {test_results['eval_wer']:.2f}%")
    print(f"\nYou can now use the model for inference with:")
    print(f"  python scripts/test_model.py --model_path {output_dir}")
    
    return trainer, test_results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Vedda Whisper model")
    parser.add_argument(
        "--dataset_path",
        type=str,
        required=True,
        help="Path to prepared dataset"
    )
    parser.add_argument(
        "--model_name",
        type=str,
        default="openai/whisper-small",
        choices=["openai/whisper-tiny", "openai/whisper-base", 
                 "openai/whisper-small", "openai/whisper-medium"],
        help="Base Whisper model to fine-tune"
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="./vedda-whisper-model",
        help="Output directory for trained model"
    )
    parser.add_argument(
        "--num_epochs",
        type=int,
        default=10,
        help="Number of training epochs"
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=16,
        help="Per-device batch size"
    )
    parser.add_argument(
        "--learning_rate",
        type=float,
        default=1e-5,
        help="Learning rate"
    )
    parser.add_argument(
        "--no-fp16",
        action="store_true",
        help="Disable mixed precision training"
    )
    
    args = parser.parse_args()
    
    train_vedda_whisper(
        dataset_path=args.dataset_path,
        model_name=args.model_name,
        output_dir=args.output_dir,
        num_epochs=args.num_epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        fp16=not args.no_fp16,
    )
