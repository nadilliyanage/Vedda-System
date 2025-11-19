// Speech-to-Text utilities with real-time recording capabilities

const STT_API_BASE = import.meta.env.VITE_TTS_URL || 'http://localhost:5007';

/**
 * Real-time speech recording class
 */
export class SpeechRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.isRecording = false;
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    this.language = 'english';
  }

  /**
   * Initialize the recorder
   */
  async initialize(language = 'english') {
    this.language = language;
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access not supported by this browser');
    }

    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      console.log('Microphone access granted');
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      throw new Error('Microphone access denied. Please allow microphone access and try again.');
    }
  }

  /**
   * Start recording
   */
  async startRecording() {
    if (!this.stream) {
      await this.initialize(this.language);
    }

    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    this.audioChunks = [];
    
    // Create MediaRecorder
    const options = {
      mimeType: 'audio/webm;codecs=opus'
    };
    
    // Fallback for Safari and other browsers
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = '';
        }
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream, options);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      console.log('Recording stopped, processing audio...');
      await this.processRecording();
    };

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      if (this.onError) {
        this.onError(new Error(`Recording error: ${event.error}`));
      }
    };

    // Start recording
    this.mediaRecorder.start(100); // Collect data every 100ms
    this.isRecording = true;
    
    console.log(`Started recording in ${this.language}`);
    
    if (this.onStart) {
      this.onStart();
    }
  }

  /**
   * Stop recording and process
   */
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('Not currently recording');
      return;
    }

    this.mediaRecorder.stop();
    this.isRecording = false;
    
    console.log('Stopping recording...');
  }

  /**
   * Process the recorded audio
   */
  async processRecording() {
    if (this.audioChunks.length === 0) {
      if (this.onError) {
        this.onError(new Error('No audio data recorded'));
      }
      return;
    }

    try {
      // First try browser Web Speech API (more reliable)
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        await this.processBrowserSTT();
      } else {
        // Fallback to backend service
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        });
        
        console.log(`Processing ${audioBlob.size} bytes of audio`);
        const wavBlob = await this.convertToWav(audioBlob);
        const result = await this.sendToSTTService(wavBlob);
        
        if (this.onResult) {
          this.onResult(result);
        }
      }
      
      if (this.onEnd) {
        this.onEnd();
      }
      
    } catch (error) {
      console.error('Error processing recording:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Use browser Web Speech API for STT
   */
  async processBrowserSTT() {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Language mapping for browser STT
      const browserLanguageMap = {
        'english': 'en-US',
        'sinhala': 'si-LK',
        'tamil': 'ta-IN',
        'hindi': 'hi-IN',
        'chinese': 'zh-CN',
        'japanese': 'ja-JP',
        'korean': 'ko-KR',
        'french': 'fr-FR',
        'german': 'de-DE',
        'spanish': 'es-ES',
        'italian': 'it-IT',
        'portuguese': 'pt-BR',
        'russian': 'ru-RU',
        'arabic': 'ar-SA',
        'dutch': 'nl-NL',
        'thai': 'th-TH',
        'vietnamese': 'vi-VN',
        'turkish': 'tr-TR',
        'vedda': 'si-LK'
      };

      recognition.lang = browserLanguageMap[this.language] || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log(`Browser STT result: "${transcript}" (confidence: ${confidence})`);
        
        if (this.onResult) {
          this.onResult({
            success: true,
            text: transcript,
            confidence: confidence,
            language: this.language,
            method: 'browser_stt'
          });
        }
        resolve();
      };

      recognition.onerror = (event) => {
        console.error('Browser STT error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      recognition.onend = () => {
        console.log('Browser STT ended');
      };

      // Convert recorded audio blob to audio element and play silently for recognition
      const audioBlob = new Blob(this.audioChunks, { 
        type: this.mediaRecorder?.mimeType || 'audio/webm' 
      });
      
      // Instead of using recorded audio, start a new recognition session
      // This is because browser STT works better with live audio
      recognition.start();
    });
  }

  /**
   * Convert audio blob to WAV format
   */
  async convertToWav(audioBlob) {
    // For now, return the original blob
    // In a production app, you might want to convert to WAV
    // using libraries like lamejs or similar
    return audioBlob;
  }

  /**
   * Send audio to STT service
   */
  async sendToSTTService(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('language', this.language);

    const response = await fetch(`${STT_API_BASE}/api/stt`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `STT service error: ${response.status}`);
    }

    return result;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }
}

/**
 * Simple STT function for one-time recording
 */
export const recordAndTranscribe = async (language = 'english', duration = 5000) => {
  return new Promise((resolve, reject) => {
    const recorder = new SpeechRecorder();
    
    recorder.onResult = (result) => {
      recorder.cleanup();
      resolve(result);
    };
    
    recorder.onError = (error) => {
      recorder.cleanup();
      reject(error);
    };
    
    // Start recording
    recorder.initialize(language)
      .then(() => recorder.startRecording())
      .catch(reject);
    
    // Auto-stop after duration
    setTimeout(() => {
      if (recorder.isRecording) {
        recorder.stopRecording();
      }
    }, duration);
  });
};

/**
 * Check if STT service is available
 */
export const checkSTTService = async () => {
  try {
    const response = await fetch(`${STT_API_BASE}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.warn('STT service health check failed:', error.message);
    return false;
  }
};

/**
 * Get supported languages for STT
 */
export const getSTTSupportedLanguages = async () => {
  try {
    const response = await fetch(`${STT_API_BASE}/api/stt/supported-languages`);
    if (response.ok) {
      const data = await response.json();
      return data.supported_languages || [];
    }
  } catch (error) {
    console.warn('Failed to get STT supported languages:', error.message);
  }
  
  // Fallback list
  return ['english', 'sinhala', 'tamil', 'hindi', 'chinese', 'japanese', 'korean', 'french', 'german', 'spanish', 'italian', 'portuguese', 'russian', 'arabic'];
};