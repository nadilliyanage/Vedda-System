import { HiVolumeUp, HiMicrophone, HiCamera, HiX } from "react-icons/hi";
import { LANGUAGES } from "../../constants/languages";

const TranslationInput = ({
  inputText,
  sourceLanguage,
  sourceIpaTranscription,
  onInputChange,
  onClear,
}) => {
  const getLanguageName = (code) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? lang.name : code;
  };

  const getLanguageNative = (code) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? lang.native : code;
  };

  // Text-to-Speech functionality
  const handleTextToSpeech = async () => {
    if (!inputText.trim()) return;

    // Cancel any ongoing speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      return;
    }

    // Get available voices
    const getVoices = () => {
      return new Promise((resolve) => {
        let voices = speechSynthesis.getVoices();
        if (voices.length) {
          resolve(voices);
        } else {
          speechSynthesis.onvoiceschanged = () => {
            voices = speechSynthesis.getVoices();
            resolve(voices);
          };
        }
      });
    };

    const voices = await getVoices();
    const utterance = new SpeechSynthesisUtterance(inputText);

    // Enhanced language mapping with fallbacks
    const speechLanguageMap = {
      english: ["en-US", "en-GB", "en"],
      sinhala: ["si-LK", "si", "en-US"], // Fallback to English if Sinhala not available
      vedda: ["si-LK", "si", "en-US"], // Use Sinhala or fallback to English
      tamil: ["ta-IN", "ta", "en-US"],
      hindi: ["hi-IN", "hi", "en-US"],
      chinese: ["zh-CN", "zh-TW", "zh", "en-US"],
      japanese: ["ja-JP", "ja", "en-US"],
      korean: ["ko-KR", "ko", "en-US"],
      french: ["fr-FR", "fr-CA", "fr", "en-US"],
      german: ["de-DE", "de", "en-US"],
      spanish: ["es-ES", "es-MX", "es", "en-US"],
      italian: ["it-IT", "it", "en-US"],
      portuguese: ["pt-BR", "pt-PT", "pt", "en-US"],
      russian: ["ru-RU", "ru", "en-US"],
      arabic: ["ar-SA", "ar", "en-US"],
    };

    // Find the best available voice
    const preferredLangs = speechLanguageMap[sourceLanguage] || ["en-US"];
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

    // Enhanced error handling with user feedback
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      // You could add a toast notification here in the future
    };

    // Log what voice is being used (for debugging)
    if (selectedVoice) {
      console.log(
        `Using voice: ${selectedVoice.name} (${selectedVoice.lang}) for ${sourceLanguage}`
      );
    } else {
      console.log(
        `No specific voice found for ${sourceLanguage}, using default`
      );
    }

    speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Input Language Label */}
      <p className="text-sm text-gray-600 mb-3">
        {getLanguageNative(sourceLanguage)}
      </p>

      {/* Input Text Area Container */}
      <div className="flex-grow relative">
        <textarea
          rows={8}
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`Type in ${getLanguageName(sourceLanguage)}`}
          className="textarea-field h-full text-lg leading-relaxed resize-none"
          maxLength={5000}
        />

        {inputText && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <HiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Source Language IPA Display */}
      {sourceIpaTranscription && inputText && (
        <div className="bg-gray-50 p-4 rounded-lg mt-4 border border-gray-200">
          <p className="text-sm font-medium text-blue-600 mb-2">
            {LANGUAGES.find((l) => l.code === sourceLanguage)?.name ||
              sourceLanguage}{" "}
            pronunciation
          </p>
          <p
            className="text-xl text-blue-700 font-normal tracking-wide leading-relaxed break-words"
            style={{
              fontFamily:
                '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
            }}
          >
            /{sourceIpaTranscription}/
          </p>
        </div>
      )}

      {/* Input Actions */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <button
            onClick={handleTextToSpeech}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              inputText.trim()
                ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                : "text-gray-400 cursor-not-allowed"
            }`}
            disabled={!inputText.trim()}
            title={
              !inputText.trim()
                ? "Enter text to listen"
                : `Listen to pronunciation`
            }
          >
            <HiVolumeUp className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled
          >
            <HiMicrophone className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled
          >
            <HiCamera className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">{inputText.length}/5000</p>
      </div>
    </div>
  );
};

export default TranslationInput;
