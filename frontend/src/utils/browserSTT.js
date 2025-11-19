// Simplified Speech-to-Text using browser Web Speech API

/**
 * Browser-based Speech Recognition class
 */
export class BrowserSpeechRecognition {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.language = "english";
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
  }

  /**
   * Check if browser supports speech recognition
   */
  static isSupported() {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  }

  /**
   * Initialize speech recognition
   */
  initialize(language = "english") {
    if (!BrowserSpeechRecognition.isSupported()) {
      throw new Error("Speech recognition not supported in this browser");
    }

    this.language = language;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Language mapping for browser STT
    const browserLanguageMap = {
      english: "en-US",
      sinhala: "si-LK",
      tamil: "ta-IN",
      hindi: "hi-IN",
      chinese: "zh-CN",
      japanese: "ja-JP",
      korean: "ko-KR",
      french: "fr-FR",
      german: "de-DE",
      spanish: "es-ES",
      italian: "it-IT",
      portuguese: "pt-BR",
      russian: "ru-RU",
      arabic: "ar-SA",
      dutch: "nl-NL",
      thai: "th-TH",
      vietnamese: "vi-VN",
      turkish: "tr-TR",
      vedda: "si-LK",
    };

    // Configure recognition
    this.recognition.lang = browserLanguageMap[language] || "en-US";
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isRecording = true;
      console.log(
        `Speech recognition started for ${language} (${this.recognition.lang})`
      );

      if (this.onStart) {
        this.onStart();
      }
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence || 0.9;

      console.log(
        `Speech recognized: "${transcript}" (confidence: ${confidence})`
      );

      if (this.onResult) {
        this.onResult({
          success: true,
          text: transcript,
          confidence: confidence,
          language: this.language,
          method: "browser_speech_api",
        });
      }
    };

    this.recognition.onerror = (event) => {
      this.isRecording = false;
      console.error("Speech recognition error:", event.error);

      let errorMessage = "Speech recognition failed";
      let shouldRetry = false;

      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected. Please try speaking again.";
          shouldRetry = true;
          break;
        case "audio-capture":
          errorMessage =
            "Microphone not accessible. Please check your microphone.";
          break;
        case "not-allowed":
          errorMessage =
            "Microphone permission denied. Please allow microphone access.";
          break;
        case "network":
          errorMessage =
            "Network error. Please check your internet connection and try again.";
          shouldRetry = true;
          break;
        case "service-not-allowed":
          errorMessage = "Speech service not allowed. Please try again.";
          shouldRetry = true;
          break;
        case "language-not-supported":
          errorMessage = `Language ${this.language} not supported. Trying English...`;
          shouldRetry = true;
          break;
        case "aborted":
          errorMessage = "Speech recognition was stopped.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}. Please try again.`;
          shouldRetry = true;
      }

      if (this.onError) {
        this.onError(new Error(errorMessage), shouldRetry, event.error);
      }
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      console.log("Speech recognition ended");

      if (this.onEnd) {
        this.onEnd();
      }
    };
  }

  /**
   * Start speech recognition
   */
  start() {
    if (!this.recognition) {
      throw new Error("Speech recognition not initialized");
    }

    if (this.isRecording) {
      console.warn("Speech recognition already in progress");
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      throw error;
    }
  }

  /**
   * Retry with English fallback
   */
  retryWithEnglish() {
    if (this.language !== "english" && this.recognition) {
      console.log("Retrying speech recognition with English fallback");
      this.recognition.lang = "en-US";
      try {
        this.recognition.start();
        return true;
      } catch (error) {
        console.error("English fallback also failed:", error);
        return false;
      }
    }
    return false;
  }

  /**
   * Stop speech recognition
   */
  stop() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }

  /**
   * Abort speech recognition
   */
  abort() {
    if (this.recognition) {
      this.recognition.abort();
      this.isRecording = false;
    }
  }
}

/**
 * Simple function to record speech and get transcription
 */
export const recordSpeech = (language = "english") => {
  return new Promise((resolve, reject) => {
    if (!BrowserSpeechRecognition.isSupported()) {
      reject(new Error("Speech recognition not supported in this browser"));
      return;
    }

    const speechRec = new BrowserSpeechRecognition();

    speechRec.onResult = (result) => {
      resolve(result);
    };

    speechRec.onError = (error) => {
      reject(error);
    };

    try {
      speechRec.initialize(language);
      speechRec.start();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Check if speech recognition is supported
 */
export const isSpeechRecognitionSupported = () => {
  return BrowserSpeechRecognition.isSupported();
};

/**
 * Get supported languages (approximate list based on browser capabilities)
 */
export const getSupportedSpeechLanguages = () => {
  return [
    "english",
    "sinhala",
    "tamil",
    "hindi",
    "chinese",
    "japanese",
    "korean",
    "french",
    "german",
    "spanish",
    "italian",
    "portuguese",
    "russian",
    "arabic",
    "dutch",
    "thai",
    "vietnamese",
    "turkish",
  ];
};
