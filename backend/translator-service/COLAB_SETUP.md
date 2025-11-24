# Google Colab Setup for Vedda Translator Service

## Step 1: Install Dependencies

```python
# Install required packages
!pip install flask flask-cors tensorflow numpy requests -q

print("✅ All dependencies installed")
```

## Step 2: Create Fixed keras_translator.py

**IMPORTANT:** Use this corrected version to fix tokenizer loading errors:

```python
# Create the fixed keras_translator.py file
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
        """Load tokenizer from JSON file - FIXED VERSION"""
        try:
            with open(tokenizer_path, 'r', encoding='utf-8') as f:
                tokenizer_data = json.load(f)
                # Convert dict to JSON string for tokenizer_from_json
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

print("✅ Fixed keras_translator.py created successfully")
```

## Step 2b: Upload Model Files

Now upload your trained model and tokenizer files:

```python
from google.colab import files

print("📁 Please upload the following model files:")
print("  - vedda_sinhala_model.keras")
print("  - sinhala_vedda_model.keras")
print("  - vedda_tokenizer.json")
print("  - sinhala_tokenizer.json")
print("  - vedda_tokenizer_sv.json")
print("  - sinhala_tokenizer_sv.json")

uploaded = files.upload()
print(f"✅ Uploaded {len(uploaded)} files")
```

## Step 3: Complete Flask App with CORS

```python
import json
import re
import urllib.parse
from datetime import datetime
import os
import threading

import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# Try to import Keras translator (optional)
try:
    from keras_translator import KerasTranslator
    KERAS_AVAILABLE = True
except Exception as e:
    print(f"⚠️ Keras translator not available: {e}")
    KERAS_AVAILABLE = False
    KerasTranslator = None

app = Flask(__name__)

# Enable CORS for all routes and origins
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

# Add explicit CORS headers to every response
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

# Handle preflight OPTIONS requests
@app.route('/api/translate', methods=['OPTIONS'])
def translate_options():
    response = jsonify({'status': 'ok'})
    return response

# Service URLs (not used in Colab standalone mode)
DICTIONARY_SERVICE_URL = 'http://localhost:5002'
HISTORY_SERVICE_URL = 'http://localhost:5003'

# Google Translate API configuration
GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"


class VeddaTranslator:
    def __init__(self):
        # Initialize Keras neural translator if available
        self.keras_translator = None
        if KERAS_AVAILABLE:
            try:
                model_dir = os.getcwd()  # Use current directory in Colab
                self.keras_translator = KerasTranslator(model_dir)
                if self.keras_translator.is_available():
                    print("✅ Neural translation models loaded and ready")
                else:
                    print("⚠️ Neural translation models failed to load")
                    self.keras_translator = None
            except Exception as e:
                print(f"⚠️ Failed to initialize Keras translator: {e}")
                self.keras_translator = None

        self.supported_languages = {
            'vedda': 'vedda',
            'sinhala': 'si',
            'english': 'en',
            'tamil': 'ta',
            'hindi': 'hi',
            'chinese': 'zh',
            'japanese': 'ja',
            'korean': 'ko',
            'french': 'fr',
            'german': 'de',
            'spanish': 'es',
        }

    def google_translate(self, text, source_lang, target_lang, include_ipa=False):
        """Use Google Translate API for translation with optional IPA"""
        try:
            source_code = self.supported_languages.get(source_lang, source_lang)
            target_code = self.supported_languages.get(target_lang, target_lang)

            if target_code == 'vedda':
                target_code = 'si'
            elif source_code == 'vedda':
                source_code = 'si'

            params = {
                'client': 'gtx',
                'sl': source_code,
                'tl': target_code,
                'dt': ['t', 'rm'] if include_ipa else ['t'],
                'q': text
            }

            response = requests.get(GOOGLE_TRANSLATE_URL, params=params, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if result and len(result) > 0 and len(result[0]) > 0:
                    translated_text = result[0][0][0]

                    if include_ipa:
                        source_ipa = ''
                        target_ipa = ''

                        try:
                            if len(result) > 0 and len(result[0]) > 0 and len(result[0][0]) > 3:
                                source_ipa = result[0][0][3] or ''
                        except:
                            pass

                        try:
                            for item in result:
                                if isinstance(item, list) and len(item) > 0:
                                    if isinstance(item[0], str) and item[0] not in [translated_text, text]:
                                        target_ipa = item[0]
                                        break
                        except:
                            pass

                        return {
                            'text': translated_text,
                            'source_ipa': source_ipa,
                            'target_ipa': target_ipa
                        }

                    return translated_text
            return None

        except Exception as e:
            print(f"Google Translate error: {e}")
            return None

    def translate_vedda_to_other(self, text, target_language):
        """Translate Vedda to any language via Sinhala bridge"""

        # Try neural translation (Vedda → Sinhala)
        sinhala_text = None
        neural_used = False

        if self.keras_translator and self.keras_translator.is_available():
            try:
                neural_result = self.keras_translator.translate_vedda_to_sinhala(text)
                if neural_result and neural_result.get('success'):
                    sinhala_text = neural_result['translated_text']
                    neural_used = True
                    print(f"✅ Neural: '{text}' → '{sinhala_text}'")
            except Exception as e:
                print(f"⚠️ Neural translation failed: {e}")

        # Fallback: assume Vedda text is similar to Sinhala
        if not sinhala_text:
            sinhala_text = text

        # Translate Sinhala to target language
        target_ipa = ''
        if target_language == 'sinhala':
            final_text = sinhala_text
            confidence = 0.9 if neural_used else 0.7
        else:
            translate_result = self.google_translate(sinhala_text, 'sinhala', target_language, include_ipa=True)
            if translate_result:
                if isinstance(translate_result, dict):
                    final_text = translate_result.get('text', sinhala_text)
                    target_ipa = translate_result.get('target_ipa', '')
                else:
                    final_text = translate_result
                confidence = 0.85 if neural_used else 0.6
            else:
                final_text = sinhala_text
                confidence = 0.5

        methods_used = ['neural_model', 'google', 'sinhala_bridge'] if neural_used else ['google', 'sinhala_bridge']

        return {
            'translated_text': final_text,
            'confidence': confidence,
            'method': 'vedda_via_sinhala',
            'source_ipa': '',
            'target_ipa': target_ipa,
            'bridge_translation': sinhala_text,
            'methods_used': methods_used,
            'note': f'Translated via Sinhala{" using neural model" if neural_used else ""}'
        }

    def translate_text(self, text, source_language, target_language):
        """Main translation method"""
        if not text.strip():
            return {
                'translated_text': '',
                'confidence': 0,
                'method': 'none',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': []
            }

        # Vedda as source
        if source_language == 'vedda':
            return self.translate_vedda_to_other(text, target_language)

        # Direct translation for non-Vedda
        result = self.google_translate(text, source_language, target_language, include_ipa=True)
        if result:
            if isinstance(result, dict):
                return {
                    'translated_text': result.get('text', text),
                    'confidence': 0.85,
                    'method': 'google_direct',
                    'source_ipa': result.get('source_ipa', ''),
                    'target_ipa': result.get('target_ipa', ''),
                    'bridge_translation': '',
                    'methods_used': ['google']
                }
            else:
                return {
                    'translated_text': result,
                    'confidence': 0.85,
                    'method': 'google_direct',
                    'source_ipa': '',
                    'target_ipa': '',
                    'bridge_translation': '',
                    'methods_used': ['google']
                }
        else:
            return {
                'translated_text': text,
                'confidence': 0.1,
                'method': 'fallback',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': ['fallback'],
                'note': 'Translation failed'
            }


# Initialize translator
translator = VeddaTranslator()


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'translator-service',
        'timestamp': datetime.now().isoformat(),
        'neural_models': translator.keras_translator is not None and translator.keras_translator.is_available()
    })


@app.route('/api/translate', methods=['POST'])
def translate():
    """Main translation endpoint"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    text = data.get('text', '').strip()
    source_language = data.get('source_language', 'english').lower()
    target_language = data.get('target_language', 'vedda').lower()

    if not text:
        return jsonify({'error': 'Text is required'}), 400

    # Perform translation
    result = translator.translate_text(text, source_language, target_language)

    return jsonify({
        'success': True,
        'input_text': text,
        'translated_text': result['translated_text'],
        'source_language': source_language,
        'target_language': target_language,
        'confidence': result['confidence'],
        'translation_method': result['method'],
        'methods_used': result.get('methods_used', []),
        'source_ipa': result.get('source_ipa', ''),
        'target_ipa': result.get('target_ipa', ''),
        'bridge_translation': result.get('bridge_translation', ''),
        'note': result.get('note', '')
    })


@app.route('/api/languages', methods=['GET'])
def get_languages():
    """Get supported languages"""
    return jsonify({
        'supported_languages': translator.supported_languages,
        'total_count': len(translator.supported_languages)
    })


# Run Flask in a separate thread
def run_flask():
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)

print("Starting Flask server in a separate thread...")
flask_thread = threading.Thread(target=run_flask, daemon=True)
flask_thread.start()

import time
time.sleep(3)  # Give Flask time to start

print("Flask server started. It might take a moment to be fully ready.")
print("Flask server should be running on http://0.0.0.0:5000")
print("You can connect to this using ngrok or similar services for external access.")
```

## Step 4: Set up ngrok tunnel

**First, get your ngrok authtoken:**

1. Go to https://dashboard.ngrok.com/signup and create a free account
2. Go to https://dashboard.ngrok.com/get-started/your-authtoken
3. Copy your authtoken

**Then run this code:**

```python
# Install pyngrok
!pip install pyngrok -q

from pyngrok import ngrok, conf

# Set your ngrok authtoken (replace YOUR_AUTHTOKEN_HERE with your actual token)
ngrok.set_auth_token("YOUR_AUTHTOKEN_HERE")

# Kill existing tunnels
ngrok.kill()

# Create public tunnel to Flask server
public_url = ngrok.connect(5000)
print(f"\n{'='*60}")
print(f"🌐 PUBLIC TRANSLATOR SERVICE URL:")
print(f"   {public_url}")
print(f"{'='*60}\n")
print(f"📋 Copy this URL and update your frontend .env file:")
print(f"   VITE_TRANSLATOR_SERVICE_URL={public_url}\n")
```

**Note:** Replace `YOUR_AUTHTOKEN_HERE` with your actual ngrok authtoken from the dashboard.

## Step 5: Test the service

```python
import requests

# Test endpoint
url = f'{public_url}/api/translate'

# Test translation
payload = {
    'text': 'මේ කැකුලෝ',
    'source_language': 'vedda',
    'target_language': 'english'
}

response = requests.post(url, json=payload)
print("Response:", response.json())
```

## ✅ Your service is now running!

Copy the ngrok URL and update it in your local frontend `.env` file, then restart the frontend.
