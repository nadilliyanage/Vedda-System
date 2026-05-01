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
  onEnterTranslate,
  loading,
}) => {
  const handleKeyDown = (e) => {
    // Enter without Shift triggers translation
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !loading && onEnterTranslate) {
        onEnterTranslate();
      }
    }
  };
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
        result.method,
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
      <p className="text-sm font-semibold mb-3" style={{ color: "#8c7040" }}>
        {getLanguageNative(sourceLanguage)}
      </p>

      {/* Input Text Area Container */}
      <div className="flex-grow relative">
        <textarea
          rows={8}
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type in ${getLanguageName(sourceLanguage)}`}
          className="textarea-field h-full text-lg leading-relaxed resize-none"
          maxLength={5000}
        />

        {inputText && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-1 rounded-full transition-colors duration-200"
            style={{ color: "rgba(92,74,30,0.6)", background: "transparent" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(200,165,90,0.20)";
              e.currentTarget.style.color = "#5c4a1e";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(92,74,30,0.6)";
            }}
          >
            <HiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Source Language Pronunciation Display */}
      {(sourceIpaTranscription || sourceSinglish) && inputText && (
        <div
          className="p-4 rounded-lg mt-4 space-y-3"
          style={{
            background: "rgba(200, 165, 90, 0.14)",
            border: "1px solid rgba(200, 165, 90, 0.32)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <p
            className="text-sm font-semibold mb-2 flex items-center"
            style={{ color: "#5c4a1e" }}
          >
            <span className="mr-2">🔊</span>
            {LANGUAGES.find((l) => l.code === sourceLanguage)?.name ||
              sourceLanguage}{" "}
            Pronunciation
          </p>

          {/* Singlish - Only for Vedda/Sinhala */}
          {sourceSinglish &&
            (sourceLanguage === "vedda" || sourceLanguage === "sinhala") && (
              <div
                className="p-3 rounded"
                style={{
                  background: "rgba(255, 248, 230, 0.55)",
                  border: "1px solid rgba(200, 165, 90, 0.25)",
                }}
              >
                <p
                  className="text-xs font-semibold mb-1 uppercase tracking-wide"
                  style={{ color: "#8c7040" }}
                >
                  Singlish
                </p>
                <p
                  className="text-lg font-medium tracking-wide leading-relaxed break-words"
                  style={{ color: "#2d1f07" }}
                >
                  {sourceSinglish}
                </p>
              </div>
            )}

          {/* IPA - For all languages */}
          {sourceIpaTranscription && (
            <div
              className="p-3 rounded"
              style={{
                background: "rgba(255, 248, 230, 0.55)",
                border: "1px solid rgba(200, 165, 90, 0.25)",
              }}
            >
              <p
                className="text-xs font-semibold mb-1 uppercase tracking-wide"
                style={{ color: "#8c7040" }}
              >
                IPA (International Phonetic Alphabet)
              </p>
              <p
                className="text-lg font-normal tracking-wide leading-relaxed break-words"
                style={{
                  color: "#5c3a10",
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
            className="p-2 rounded-lg transition-colors duration-200"
            style={{
              color: inputText.trim() ? "#9a6f2a" : "rgba(140,112,64,0.45)",
              cursor: inputText.trim() ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (inputText.trim())
                e.currentTarget.style.background = "rgba(200,165,90,0.18)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
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
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ color: "rgba(140,112,64,0.45)", cursor: "not-allowed" }}
            disabled
          >
            <HiCamera className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <p className="text-sm" style={{ color: "#8c7040" }}>
            {inputText.length}/5000
          </p>
          <p className="text-xs" style={{ color: "rgba(140,112,64,0.50)" }}>
            Press Enter to translate
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranslationInput;
