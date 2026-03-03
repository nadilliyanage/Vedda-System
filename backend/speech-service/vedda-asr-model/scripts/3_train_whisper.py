"""
Step 3: Train Custom Vedda ASR Model (Whisper Fine-tuning)

Fine-tunes OpenAI Whisper model on Vedda language data.
"""

import os
import json
import torch
from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
    WhisperFeatureExtractor,
    WhisperTokenizer
)
from datasets import Dataset, Audio
from dataclasses import dataclass
from typing import Any, Dict, List, Union
import numpy as np

@dataclass
class DataCollatorSpeechSeq2SeqWithPadding:
    """Custom data collator for Whisper"""
    processor: Any
    decoder_start_token_id: int

    def __call__(self, features: List[Dict[str, Union[List[int], torch.Tensor]]]) -> Dict[str, torch.Tensor]:
        # Split inputs and labels
        input_features = [{"input_features": feature["input_features"]} for feature in features]
        label_features = [{"input_ids": feature["labels"]} for feature in features]

        # Pad input features
        batch = self.processor.feature_extractor.pad(input_features, return_tensors="pt")

        # Pad labels
        labels_batch = self.processor.tokenizer.pad(label_features, return_tensors="pt")

        # Replace padding with -100 to ignore loss
        labels = labels_batch["input_ids"].masked_fill(labels_batch.attention_mask.ne(1), -100)

        # Remove decoder_start_token_id if present
        if (labels[:, 0] == self.decoder_start_token_id).all().cpu().item():
            labels = labels[:, 1:]

        batch["labels"] = labels

        return batch


class VeddaASRTrainer:
    def __init__(self, 
                 model_size='small',
                 output_dir='models/whisper-vedda',
                 data_dir='data'):
        
        self.model_size = model_size
        self.output_dir = output_dir
        self.data_dir = data_dir
        self.train_file = os.path.join(data_dir, 'train_dataset.json')
        self.test_file = os.path.join(data_dir, 'test_dataset.json')
        
        # Check CUDA availability
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"\n🖥️  Using device: {self.device}")
        
        if self.device == 'cpu':
            print(f"⚠️  Training on CPU will be VERY slow!")
            print(f"   Consider using Google Colab with free GPU")
        
        os.makedirs(output_dir, exist_ok=True)
    
    def load_datasets(self):
        """Load train and test datasets"""
        print(f"\n📂 Loading datasets...")
        
        # Load JSON files
        with open(self.train_file, 'r', encoding='utf-8') as f:
            train_json = json.load(f)
        
        with open(self.test_file, 'r', encoding='utf-8') as f:
            test_json = json.load(f)
        
        # Create Hugging Face datasets
        train_dataset = Dataset.from_dict({
            'audio': [x['audio_path'] for x in train_json['data']],
            'transcription': [x['transcription'] for x in train_json['data']]
        })
        
        test_dataset = Dataset.from_dict({
            'audio': [x['audio_path'] for x in test_json['data']],
            'transcription': [x['transcription'] for x in test_json['data']]
        })
        
        # Add audio feature
        train_dataset = train_dataset.cast_column("audio", Audio(sampling_rate=16000))
        test_dataset = test_dataset.cast_column("audio", Audio(sampling_rate=16000))
        
        print(f"✅ Train samples: {len(train_dataset)}")
        print(f"✅ Test samples: {len(test_dataset)}")
        
        return train_dataset, test_dataset
    
    def load_model_and_processor(self):
        """Load Whisper model and processor"""
        print(f"\nLoading Whisper-{self.model_size} model...")
        
        model_name = f"openai/whisper-{self.model_size}"
        
        # Load processor
        processor = WhisperProcessor.from_pretrained(
            model_name,
            language="Sinhala",  # Use Sinhala as base (closest to Vedda)
            task="transcribe"
        )
        
        # Load model
        model = WhisperForConditionalGeneration.from_pretrained(model_name)
        model.config.forced_decoder_ids = None
        model.config.suppress_tokens = []
        
        # Move to device
        model = model.to(self.device)
        
        print(f"✅ Model loaded: {model_name}")
        print(f"📊 Parameters: {model.num_parameters() / 1e6:.1f}M")
        
        return model, processor
    
    def prepare_dataset(self, dataset, processor):
        """Prepare dataset for training"""
        def prepare_example(batch):
            # Load audio
            audio = batch["audio"]
            
            # Compute input features
            input_features = processor.feature_extractor(
                audio["array"],
                sampling_rate=audio["sampling_rate"]
            ).input_features[0]
            
            # Encode transcription
            labels = processor.tokenizer(batch["transcription"]).input_ids
            
            return {
                "input_features": input_features,
                "labels": labels
            }
        
        # Apply preprocessing
        dataset = dataset.map(
            prepare_example,
            remove_columns=dataset.column_names,
            num_proc=1
        )
        
        return dataset
    
    def compute_metrics(self, pred):
        """Compute WER metric"""
        from evaluate import load
        
        wer_metric = load("wer")
        
        pred_ids = pred.predictions
        label_ids = pred.label_ids
        
        # Replace -100 with pad token id
        label_ids[label_ids == -100] = processor.tokenizer.pad_token_id
        
        # Decode predictions and labels
        pred_str = processor.tokenizer.batch_decode(pred_ids, skip_special_tokens=True)
        label_str = processor.tokenizer.batch_decode(label_ids, skip_special_tokens=True)
        
        # Compute WER
        wer = wer_metric.compute(predictions=pred_str, references=label_str)
        
        return {"wer": wer}
    
    def train(self, epochs=10, batch_size=8, learning_rate=1e-5):
        """Train model"""
        print(f"\n{'='*60}")
        print(f"🎓 TRAINING VEDDA ASR MODEL")
        print(f"{'='*60}")
        
        # Load datasets
        train_dataset, test_dataset = self.load_datasets()
        
        # Load model and processor
        model, processor = self.load_model_and_processor()
        
        # Prepare datasets
        print(f"\n⚙️  Preparing datasets...")
        train_dataset = self.prepare_dataset(train_dataset, processor)
        test_dataset = self.prepare_dataset(test_dataset, processor)
        
        # Create data collator
        data_collator = DataCollatorSpeechSeq2SeqWithPadding(
            processor=processor,
            decoder_start_token_id=model.config.decoder_start_token_id
        )
        
        # Training arguments
        training_args = Seq2SeqTrainingArguments(
            output_dir=self.output_dir,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            gradient_accumulation_steps=2,
            learning_rate=learning_rate,
            warmup_steps=50,
            num_train_epochs=epochs,
            evaluation_strategy="steps",
            eval_steps=50,
            save_steps=100,
            logging_steps=25,
            load_best_model_at_end=True,
            metric_for_best_model="wer",
            greater_is_better=False,
            push_to_hub=False,
            save_total_limit=3,
            fp16=self.device == 'cuda',  # Use mixed precision on GPU
            report_to=["tensorboard"],
            predict_with_generate=True,
            generation_max_length=225,
        )
        
        # Create trainer
        trainer = Seq2SeqTrainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=test_dataset,
            data_collator=data_collator,
            compute_metrics=self.compute_metrics,
            tokenizer=processor.feature_extractor,
        )
        
        print(f"\n🚀 Starting training...")
        print(f"   Epochs: {epochs}")
        print(f"   Batch size: {batch_size}")
        print(f"   Learning rate: {learning_rate}")
        print(f"   Device: {self.device}")
        
        # Train
        trainer.train()
        
        print(f"\n✅ Training complete!")
        
        # Save final model
        final_dir = os.path.join(self.output_dir, 'final')
        model.save_pretrained(final_dir)
        processor.save_pretrained(final_dir)
        
        print(f"\n💾 Model saved to: {final_dir}")
        print(f"📊 Next: python scripts/4_evaluate_model.py")
        
        return model, processor


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Vedda ASR Model')
    parser.add_argument('--model_size', type=str, default='small',
                       choices=['tiny', 'base', 'small', 'medium'],
                       help='Whisper model size')
    parser.add_argument('--epochs', type=int, default=10,
                       help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=8,
                       help='Training batch size')
    parser.add_argument('--learning_rate', type=float, default=1e-5,
                       help='Learning rate')
    parser.add_argument('--output_dir', type=str, default='models/whisper-vedda',
                       help='Output directory')
    
    args = parser.parse_args()
    
    try:
        trainer = VeddaASRTrainer(
            model_size=args.model_size,
            output_dir=args.output_dir
        )
        
        trainer.train(
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.learning_rate
        )
        
    except Exception as e:
        print(f"\n❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
