// Text-to-Speech API utilities using backend service

const TTS_API_BASE = import.meta.env.VITE_TTS_URL || "http://localhost:5006";

/**
 * Generate speech from text using backend TTS service
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code
 * @returns {Promise<void>}
 */
export const generateSpeechFromBackend = async (text, language) => {
  try {
    if (!text?.trim()) {
      throw new Error("Text is required for TTS");
    }

    console.log(
      `Backend TTS request: ${language} - "${text.substring(0, 50)}..."`
    );

    const response = await fetch(`${TTS_API_BASE}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        language: language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `TTS service error: ${response.status}`
      );
    }

    // Get audio blob from response
    const audioBlob = await response.blob();

    // Create audio URL and play
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    // Play the audio
    await audio.play();

    // Clean up URL after playing
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(audioUrl);
    });

    return audio;
  } catch (error) {
    console.error("Backend TTS error:", error);
    throw error;
  }
};

/**
 * Fallback to browser TTS with enhanced language support
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code
 * @returns {Promise<void>}
 */
export const generateSpeechFromBrowser = async (text, language) => {
  return new Promise((resolve, reject) => {
    if (!text?.trim()) {
      reject(new Error("Text is required for TTS"));
      return;
    }

    // Cancel any ongoing speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const getVoices = () => {
      return new Promise((voiceResolve) => {
        let voices = speechSynthesis.getVoices();
        if (voices.length) {
          voiceResolve(voices);
        } else {
          speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices();
            voiceResolve(voices);
          };
        }
      });
    };

    getVoices().then((voices) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Enhanced language mapping with multiple fallbacks
      const speechLanguageMap = {
        english: ["en-US", "en-GB", "en-AU", "en"],
        sinhala: ["si-LK", "si", "ta-IN", "hi-IN", "en-US"], // Tamil/Hindi as closer fallbacks
        vedda: ["si-LK", "si", "ta-IN", "hi-IN", "en-US"],
        tamil: ["ta-IN", "ta-LK", "ta", "si-LK", "hi-IN", "en-US"],
        hindi: ["hi-IN", "hi", "ta-IN", "en-US"],
        chinese: ["zh-CN", "zh-TW", "zh-HK", "zh", "en-US"],
        japanese: ["ja-JP", "ja", "en-US"],
        korean: ["ko-KR", "ko", "en-US"],
        french: ["fr-FR", "fr-CA", "fr-BE", "fr", "en-US"],
        german: ["de-DE", "de-AT", "de-CH", "de", "en-US"],
        spanish: ["es-ES", "es-MX", "es-AR", "es-US", "es", "en-US"],
        italian: ["it-IT", "it-CH", "it", "en-US"],
        portuguese: ["pt-BR", "pt-PT", "pt", "en-US"],
        russian: ["ru-RU", "ru", "en-US"],
        arabic: ["ar-SA", "ar-EG", "ar-AE", "ar", "en-US"],
        dutch: ["nl-NL", "nl-BE", "nl", "en-US"],
        thai: ["th-TH", "th", "en-US"],
        vietnamese: ["vi-VN", "vi", "en-US"],
        turkish: ["tr-TR", "tr", "en-US"],
      };

      // Find the best available voice
      const preferredLangs = speechLanguageMap[language] || ["en-US"];
      let selectedVoice = null;
      let selectedLang = "en-US";

      for (const lang of preferredLangs) {
        const voice = voices.find((v) => v.lang.startsWith(lang));
        if (voice) {
          selectedVoice = voice;
          selectedLang = lang;
          break;
        }
      }

      // Set utterance properties
      utterance.voice = selectedVoice;
      utterance.lang = selectedLang;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        console.log(
          `Browser TTS completed: ${
            selectedVoice?.name || "default"
          } (${selectedLang})`
        );
        resolve();
      };

      utterance.onerror = (event) => {
        console.error("Browser TTS error:", event.error);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      console.log(
        `Browser TTS: ${
          selectedVoice?.name || "default"
        } (${selectedLang}) for ${language}`
      );
      speechSynthesis.speak(utterance);
    });
  });
};

/**
 * Main TTS function with backend-first approach and browser fallback
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code
 * @returns {Promise<void>}
 */
export const generateSpeech = async (text, language) => {
  try {
    // First try backend TTS (better language support)
    await generateSpeechFromBackend(text, language);
  } catch (backendError) {
    console.warn(
      "Backend TTS failed, falling back to browser TTS:",
      backendError.message
    );

    try {
      // Fallback to browser TTS
      await generateSpeechFromBrowser(text, language);
    } catch (browserError) {
      console.error("Both TTS methods failed:", browserError.message);
      throw new Error("Text-to-speech is currently unavailable");
    }
  }
};

/**
 * Check if TTS service is available
 * @returns {Promise<boolean>}
 */
export const checkTTSService = async () => {
  try {
    const response = await fetch(`${TTS_API_BASE}/health`, {
      method: "GET",
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.warn("TTS service health check failed:", error.message);
    return false;
  }
};

/**
 * Get supported languages from TTS service
 * @returns {Promise<string[]>}
 */
export const getSupportedLanguages = async () => {
  try {
    const response = await fetch(`${TTS_API_BASE}/api/tts/supported-languages`);
    if (response.ok) {
      const data = await response.json();
      return data.supported_languages || [];
    }
  } catch (error) {
    console.warn("Failed to get supported languages:", error.message);
  }

  // Fallback list
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
  ];
};
