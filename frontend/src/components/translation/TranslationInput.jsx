import { HiVolumeUp, HiMicrophone, HiCamera, HiX } from "react-icons/hi";
import { LANGUAGES } from "../../constants/languages";
import { generateSpeech } from "../../utils/ttsUtils";
import SpeechInput from "../speech/SpeechInput";

const TranslationInput = ({
  inputText,
  sourceLanguage,
  sourceIpaTranscription,
  sourceSinglish,
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

    // Cancel any ongoing browser speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    try {
      await generateSpeech(inputText, sourceLanguage);
    } catch (error) {
      console.error("TTS failed:", error.message);
      // You could add a toast notification here in the future
    }
  };

  // Speech-to-Text functionality
  const handleSpeechTranscription = (transcribedText, result) => {
    if (transcribedText.trim()) {
      // If there's existing text, append with a space
      const newText = inputText.trim()
        ? `${inputText.trim()} ${transcribedText.trim()}`
        : transcribedText.trim();

      onInputChange(newText);
      console.log(
        "Speech transcribed:",
        transcribedText,
        "Method:",
        result.method
      );
    }
  };

  const handleSpeechError = (error) => {
    console.error("Speech recognition error:", error.message);
    // You could add a toast notification here in the future
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

      {/* Source Language Pronunciation Display */}
      {(sourceIpaTranscription || sourceSinglish) && inputText && (
        <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-200 space-y-3">
          <p className="text-sm font-medium text-blue-700 mb-2 flex items-center">
            <span className="mr-2">🔊</span>
            {LANGUAGES.find((l) => l.code === sourceLanguage)?.name ||
              sourceLanguage}{" "}
            Pronunciation
          </p>

          {/* Singlish - Only for Vedda/Sinhala */}
          {sourceSinglish &&
            (sourceLanguage === "vedda" || sourceLanguage === "sinhala") && (
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Singlish
                </p>
                <p className="text-lg text-gray-800 font-medium tracking-wide leading-relaxed break-words">
                  {sourceSinglish}
                </p>
              </div>
            )}

          {/* IPA - For all languages */}
          {sourceIpaTranscription && (
            <div className="bg-white p-3 rounded border border-blue-100">
              <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                IPA (International Phonetic Alphabet)
              </p>
              <p
                className="text-lg text-blue-800 font-normal tracking-wide leading-relaxed break-words"
                style={{
                  fontFamily:
                    '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
                }}
              >
                /{sourceIpaTranscription}/
              </p>
            </div>
          )}
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

          <SpeechInput
            language={sourceLanguage}
            onTranscription={handleSpeechTranscription}
            onError={handleSpeechError}
            className="relative"
          />
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
