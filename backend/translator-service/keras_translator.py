"""
Keras-based Vedda-Sinhala Neural Translation Module
Loads trained seq2seq models and provides translation functionality
"""
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.text import tokenizer_from_json


class KerasTranslator:
    """Neural translation using trained Keras seq2seq models"""
    
    def __init__(self, model_dir='./'):
        """
        Initialize the Keras translator with pre-trained models
        
        Args:
            model_dir: Directory containing model files
        """
        self.model_dir = model_dir
        self.models_loaded = False
        
        # Model and tokenizer paths
        self.vedda_sinhala_model_path = os.path.join(model_dir, 'vedda_sinhala_model.keras')
        self.sinhala_vedda_model_path = os.path.join(model_dir, 'sinhala_vedda_model.keras')
        self.vedda_tokenizer_path = os.path.join(model_dir, 'vedda_tokenizer.json')
        self.sinhala_tokenizer_path = os.path.join(model_dir, 'sinhala_tokenizer.json')
        self.vedda_tokenizer_sv_path = os.path.join(model_dir, 'vedda_tokenizer_sv.json')
        self.sinhala_tokenizer_sv_path = os.path.join(model_dir, 'sinhala_tokenizer_sv.json')
        
        # Models and tokenizers
        self.vedda_sinhala_model = None
        self.sinhala_vedda_model = None
        self.vedda_tokenizer = None
        self.sinhala_tokenizer = None
        self.vedda_tokenizer_sv = None
        self.sinhala_tokenizer_sv = None
        
        # Inference models
        self.vs_encoder_model = None
        self.vs_decoder_model = None
        self.sv_encoder_model = None
        self.sv_decoder_model = None
        
        # Configuration
        self.max_sequence_length = 20
        self.latent_dim = 256
        
        # Try to load models
        self.load_models()
    
    def load_tokenizer(self, tokenizer_path):
        """Load tokenizer from JSON file"""
        try:
            with open(tokenizer_path, 'r', encoding='utf-8') as f:
                tokenizer_data = json.load(f)
                # If it's a dict, convert to JSON string for tokenizer_from_json
                if isinstance(tokenizer_data, dict):
                    tokenizer_json = json.dumps(tokenizer_data)
                else:
                    tokenizer_json = tokenizer_data
                return tokenizer_from_json(tokenizer_json)
        except Exception as e:
            print(f"Failed to load tokenizer from {tokenizer_path}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def load_models(self):
        """Load all trained models and tokenizers"""
        try:
            print("🔄 Loading Keras translation models...")
            
            # Load tokenizers
            self.vedda_tokenizer = self.load_tokenizer(self.vedda_tokenizer_path)
            self.sinhala_tokenizer = self.load_tokenizer(self.sinhala_tokenizer_path)
            self.vedda_tokenizer_sv = self.load_tokenizer(self.vedda_tokenizer_sv_path)
            self.sinhala_tokenizer_sv = self.load_tokenizer(self.sinhala_tokenizer_sv_path)
            
            if not all([self.vedda_tokenizer, self.sinhala_tokenizer, 
                       self.vedda_tokenizer_sv, self.sinhala_tokenizer_sv]):
                print("⚠️ Some tokenizers failed to load")
                return False
            
            # Load training models
            if os.path.exists(self.vedda_sinhala_model_path):
                self.vedda_sinhala_model = keras.models.load_model(self.vedda_sinhala_model_path)
                print("✅ Loaded Vedda→Sinhala model")
            
            if os.path.exists(self.sinhala_vedda_model_path):
                self.sinhala_vedda_model = keras.models.load_model(self.sinhala_vedda_model_path)
                print("✅ Loaded Sinhala→Vedda model")
            
            # Build inference models
            if self.vedda_sinhala_model:
                self.vs_encoder_model, self.vs_decoder_model = self.build_inference_models(
                    self.vedda_sinhala_model, 
                    len(self.sinhala_tokenizer.word_index) + 1
                )
                print("✅ Built Vedda→Sinhala inference models")
            
            if self.sinhala_vedda_model:
                self.sv_encoder_model, self.sv_decoder_model = self.build_inference_models(
                    self.sinhala_vedda_model,
                    len(self.vedda_tokenizer_sv.word_index) + 1
                )
                print("✅ Built Sinhala→Vedda inference models")
            
            self.models_loaded = True
            print("✅ All Keras models loaded successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to load Keras models: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def build_inference_models(self, training_model, target_vocab_size):
        """
        Build encoder and decoder inference models from training model
        
        Args:
            training_model: The trained seq2seq model
            target_vocab_size: Size of target vocabulary
            
        Returns:
            encoder_model, decoder_model
        """
        # Find the encoder LSTM layer by iterating through layers
        encoder_lstm = None
        encoder_embedding = None
        decoder_embedding = None
        decoder_lstm = None
        decoder_dense = None
        
        for layer in training_model.layers:
            if 'embedding' in layer.name and encoder_embedding is None:
                encoder_embedding = layer
            elif 'embedding' in layer.name and encoder_embedding is not None:
                decoder_embedding = layer
            elif 'lstm' in layer.name and encoder_lstm is None:
                encoder_lstm = layer
            elif 'lstm' in layer.name and encoder_lstm is not None:
                decoder_lstm = layer
            elif 'dense' in layer.name:
                decoder_dense = layer
        
        # Encoder inference model
        encoder_inputs = training_model.input[0]
        encoder_outputs = encoder_lstm(encoder_embedding(encoder_inputs))
        
        # encoder_outputs is a list: [output, state_h, state_c]
        # We only need the states for the decoder
        encoder_model = keras.Model(encoder_inputs, encoder_outputs[1:])
        
        # Decoder inference model
        decoder_inputs = training_model.input[1]
        decoder_state_input_h = keras.Input(shape=(self.latent_dim,), name='decoder_state_h')
        decoder_state_input_c = keras.Input(shape=(self.latent_dim,), name='decoder_state_c')
        decoder_states_inputs = [decoder_state_input_h, decoder_state_input_c]
        
        # Build decoder inference
        decoder_embeddings = decoder_embedding(decoder_inputs)
        decoder_outputs = decoder_lstm(
            decoder_embeddings, initial_state=decoder_states_inputs
        )
        # decoder_outputs is [output, state_h, state_c]
        decoder_output = decoder_outputs[0]
        decoder_states = list(decoder_outputs[1:])  # Convert to list
        
        decoder_output = decoder_dense(decoder_output)
        
        decoder_model = keras.Model(
            [decoder_inputs] + decoder_states_inputs,
            [decoder_output] + decoder_states
        )
        
        return encoder_model, decoder_model
    
    def decode_sequence(self, input_seq, encoder_model, decoder_model, target_tokenizer):
        """
        Decode an input sequence using encoder-decoder inference models
        
        Args:
            input_seq: Encoded input sequence
            encoder_model: Encoder inference model
            decoder_model: Decoder inference model
            target_tokenizer: Target language tokenizer
            
        Returns:
            Decoded text string
        """
        # Encode the input
        states_value = encoder_model.predict(input_seq, verbose=0)
        
        # Convert to list if it's a tuple
        if isinstance(states_value, tuple):
            states_value = list(states_value)
        elif not isinstance(states_value, list):
            states_value = [states_value]
        
        # Generate empty target sequence of length 1
        target_seq = np.zeros((1, 1))
        # Populate the first character of target sequence with the start character
        target_seq[0, 0] = target_tokenizer.word_index.get('startseq', 1)
        
        # Reverse word index for target tokenizer
        reverse_target_word_index = {v: k for k, v in target_tokenizer.word_index.items()}
        
        # Sampling loop for a batch of sequences
        stop_condition = False
        decoded_sentence = ''
        max_iterations = self.max_sequence_length
        
        while not stop_condition and max_iterations > 0:
            output_tokens, h, c = decoder_model.predict(
                [target_seq] + states_value, verbose=0
            )
            
            # Sample a token
            sampled_token_index = np.argmax(output_tokens[0, -1, :])
            sampled_word = reverse_target_word_index.get(sampled_token_index, '')
            
            if sampled_word == 'endseq' or sampled_word == '':
                stop_condition = True
            else:
                decoded_sentence += sampled_word + ' '
            
            # Update the target sequence
            target_seq = np.zeros((1, 1))
            target_seq[0, 0] = sampled_token_index
            
            # Update states
            states_value = [h, c]
            max_iterations -= 1
        
        return decoded_sentence.strip()
    
    def preprocess_text(self, text):
        """Clean and preprocess input text"""
        text = text.strip().lower()
        # Add start and end tokens
        text = 'startseq ' + text + ' endseq'
        return text
    
    def translate_vedda_to_sinhala(self, vedda_text):
        """
        Translate Vedda text to Sinhala using neural model
        
        Args:
            vedda_text: Input Vedda text
            
        Returns:
            dict with translation result
        """
        if not self.models_loaded or not self.vs_encoder_model:
            return None
        
        try:
            # Preprocess
            processed_text = self.preprocess_text(vedda_text)
            
            # Tokenize and pad
            input_seq = self.vedda_tokenizer.texts_to_sequences([processed_text])
            input_seq = keras.preprocessing.sequence.pad_sequences(
                input_seq, maxlen=self.max_sequence_length, padding='post'
            )
            
            # Decode
            translated_text = self.decode_sequence(
                input_seq,
                self.vs_encoder_model,
                self.vs_decoder_model,
                self.sinhala_tokenizer
            )
            
            return {
                'success': True,
                'translated_text': translated_text,
                'method': 'neural_vedda_to_sinhala',
                'confidence': 0.85
            }
            
        except Exception as e:
            print(f"Neural translation error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def translate_sinhala_to_vedda(self, sinhala_text):
        """
        Translate Sinhala text to Vedda using neural model
        
        Args:
            sinhala_text: Input Sinhala text
            
        Returns:
            dict with translation result
        """
        if not self.models_loaded or not self.sv_encoder_model:
            return None
        
        try:
            # Preprocess
            processed_text = self.preprocess_text(sinhala_text)
            
            # Tokenize and pad
            input_seq = self.sinhala_tokenizer_sv.texts_to_sequences([processed_text])
            input_seq = keras.preprocessing.sequence.pad_sequences(
                input_seq, maxlen=self.max_sequence_length, padding='post'
            )
            
            # Decode
            translated_text = self.decode_sequence(
                input_seq,
                self.sv_encoder_model,
                self.sv_decoder_model,
                self.vedda_tokenizer_sv
            )
            
            return {
                'success': True,
                'translated_text': translated_text,
                'method': 'neural_sinhala_to_vedda',
                'confidence': 0.85
            }
            
        except Exception as e:
            print(f"Neural translation error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def is_available(self):
        """Check if neural translation is available"""
        return self.models_loaded
