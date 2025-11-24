# Fixed keras_translator.py for Google Colab
# Copy this entire code into a Colab cell and run it

keras_translator_code = '''
"""
Keras-based Vedda-Sinhala Neural Translation Module
"""
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.text import tokenizer_from_json


class KerasTranslator:
    def __init__(self, model_dir='./'):
        self.model_dir = model_dir
        self.models_loaded = False
        
        # Model and tokenizer paths
        self.vedda_sinhala_model_path = os.path.join(model_dir, 'vedda_sinhala_model.keras')
        self.sinhala_vedda_model_path = os.path.join(model_dir, 'sinhala_vedda_model.keras')
        self.vedda_tokenizer_path = os.path.join(model_dir, 'vedda_tokenizer.json')
        self.sinhala_tokenizer_path = os.path.join(model_dir, 'sinhala_tokenizer.json')
        self.vedda_tokenizer_sv_path = os.path.join(model_dir, 'vedda_tokenizer_sv.json')
        self.sinhala_tokenizer_sv_path = os.path.join(model_dir, 'sinhala_tokenizer_sv.json')
        
        self.vedda_sinhala_model = None
        self.sinhala_vedda_model = None
        self.vedda_tokenizer = None
        self.sinhala_tokenizer = None
        self.vedda_tokenizer_sv = None
        self.sinhala_tokenizer_sv = None
        
        self.vs_encoder_model = None
        self.vs_decoder_model = None
        self.sv_encoder_model = None
        self.sv_decoder_model = None
        
        self.max_sequence_length = 20
        self.latent_dim = 256
        
        self.load_models()
    
    def load_tokenizer(self, tokenizer_path):
        """Load tokenizer from JSON file"""
        try:
            with open(tokenizer_path, 'r', encoding='utf-8') as f:
                tokenizer_data = json.load(f)
                # Convert dict to JSON string if needed
                if isinstance(tokenizer_data, dict):
                    tokenizer_json = json.dumps(tokenizer_data)
                else:
                    tokenizer_json = tokenizer_data
                return tokenizer_from_json(tokenizer_json)
        except Exception as e:
            print(f"Failed to load tokenizer from {tokenizer_path}: {e}")
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
            
            print("✅ All tokenizers loaded")
            
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
        """Build encoder and decoder inference models"""
        # Encoder
        encoder_inputs = training_model.input[0]
        encoder_outputs, state_h, state_c = training_model.layers[2].output
        encoder_states = [state_h, state_c]
        encoder_model = keras.Model(encoder_inputs, encoder_states)
        
        # Decoder
        decoder_inputs = training_model.input[1]
        decoder_state_input_h = keras.Input(shape=(self.latent_dim,))
        decoder_state_input_c = keras.Input(shape=(self.latent_dim,))
        decoder_states_inputs = [decoder_state_input_h, decoder_state_input_c]
        
        decoder_embedding = training_model.layers[3]
        decoder_lstm = training_model.layers[4]
        decoder_dense = training_model.layers[5]
        
        decoder_embeddings = decoder_embedding(decoder_inputs)
        decoder_outputs, state_h, state_c = decoder_lstm(
            decoder_embeddings, initial_state=decoder_states_inputs
        )
        decoder_states = [state_h, state_c]
        decoder_outputs = decoder_dense(decoder_outputs)
        
        decoder_model = keras.Model(
            [decoder_inputs] + decoder_states_inputs,
            [decoder_outputs] + decoder_states
        )
        
        return encoder_model, decoder_model
    
    def decode_sequence(self, input_seq, encoder_model, decoder_model, target_tokenizer):
        """Decode sequence using inference models"""
        states_value = encoder_model.predict(input_seq, verbose=0)
        
        target_seq = np.zeros((1, 1))
        target_seq[0, 0] = target_tokenizer.word_index.get('startseq', 1)
        
        reverse_target_word_index = {v: k for k, v in target_tokenizer.word_index.items()}
        
        stop_condition = False
        decoded_sentence = ''
        max_iterations = self.max_sequence_length
        
        while not stop_condition and max_iterations > 0:
            output_tokens, h, c = decoder_model.predict(
                [target_seq] + states_value, verbose=0
            )
            
            sampled_token_index = np.argmax(output_tokens[0, -1, :])
            sampled_word = reverse_target_word_index.get(sampled_token_index, '')
            
            if sampled_word == 'endseq' or sampled_word == '':
                stop_condition = True
            else:
                decoded_sentence += sampled_word + ' '
            
            target_seq = np.zeros((1, 1))
            target_seq[0, 0] = sampled_token_index
            states_value = [h, c]
            max_iterations -= 1
        
        return decoded_sentence.strip()
    
    def preprocess_text(self, text):
        """Preprocess text"""
        text = text.strip().lower()
        text = 'startseq ' + text + ' endseq'
        return text
    
    def translate_vedda_to_sinhala(self, vedda_text):
        """Translate Vedda to Sinhala"""
        if not self.models_loaded or not self.vs_encoder_model:
            return None
        
        try:
            processed_text = self.preprocess_text(vedda_text)
            input_seq = self.vedda_tokenizer.texts_to_sequences([processed_text])
            input_seq = keras.preprocessing.sequence.pad_sequences(
                input_seq, maxlen=self.max_sequence_length, padding='post'
            )
            
            translated_text = self.decode_sequence(
                input_seq, self.vs_encoder_model, self.vs_decoder_model, self.sinhala_tokenizer
            )
            
            return {
                'success': True,
                'translated_text': translated_text,
                'method': 'neural_vedda_to_sinhala',
                'confidence': 0.85
            }
        except Exception as e:
            print(f"Neural translation error: {e}")
            return None
    
    def translate_sinhala_to_vedda(self, sinhala_text):
        """Translate Sinhala to Vedda"""
        if not self.models_loaded or not self.sv_encoder_model:
            return None
        
        try:
            processed_text = self.preprocess_text(sinhala_text)
            input_seq = self.sinhala_tokenizer_sv.texts_to_sequences([processed_text])
            input_seq = keras.preprocessing.sequence.pad_sequences(
                input_seq, maxlen=self.max_sequence_length, padding='post'
            )
            
            translated_text = self.decode_sequence(
                input_seq, self.sv_encoder_model, self.sv_decoder_model, self.vedda_tokenizer_sv
            )
            
            return {
                'success': True,
                'translated_text': translated_text,
                'method': 'neural_sinhala_to_vedda',
                'confidence': 0.85
            }
        except Exception as e:
            print(f"Neural translation error: {e}")
            return None
    
    def is_available(self):
        return self.models_loaded
'''

# Write to file
with open('keras_translator.py', 'w', encoding='utf-8') as f:
    f.write(keras_translator_code)

print("✅ keras_translator.py created successfully")
