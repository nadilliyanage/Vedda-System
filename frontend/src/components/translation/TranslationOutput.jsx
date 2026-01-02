import { HiVolumeUp, HiClipboardCopy, HiShare } from "react-icons/hi";
import { LANGUAGES } from "../../constants/languages";
import { generateSpeech } from "../../utils/ttsUtils";

// Loading skeleton component
const Skeleton = ({ width = "100%", height = "1.5rem" }) => (
  <div
    className="animate-pulse bg-gray-200 rounded"
    style={{ width, height }}
  />
);

const TranslationOutput = ({
  outputText,
  targetLanguage,
  loading,
  error,
  sourceIpaTranscription,
  targetIpaTranscription,
  confidence,
  translationMethods = [],
  onCopyOutput,
}) => {
  const getLanguageNative = (code) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? lang.native : code;
  };

  // Text-to-Speech functionality for output
  const handleOutputTextToSpeech = async () => {
    if (!outputText.trim()) return;

    // Cancel any ongoing browser speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    try {
      await generateSpeech(outputText, targetLanguage);
    } catch (error) {
      console.error("TTS failed:", error.message);
      // You could add a toast notification here in the future
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      // Current translator service method names
      case "google":
      case "google_translate":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "dictionary":
      case "english_to_vedda_direct":
      case "vedda_direct":
        return "bg-green-100 text-green-800 border-green-200";
      case "phrase_match":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "fallback":
      case "english_to_sinhala_fallback":
      case "bridge_via_english":
      case "vedda_fallback":
      case "vedda_to_english_to_target":
      case "source_to_english_to_vedda":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "sinhala_bridge":
      case "english_to_sinhala_google":
      case "sinhala_to_target":
      case "sinhala_passthrough":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "sinhala_word":
      case "vedda_as_sinhala_batch":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "unknown":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      // Current translator service method names
      case "google":
        return "Google Translator";
      case "dictionary":
        return "Vedda Dictionary";
      case "phrase_match":
        return "Phrase Match";
      case "fallback":
        return "Fallback Translation";
      case "sinhala_bridge":
        return "Sinhala Bridge";
      // Detailed method names
      case "english_to_vedda_direct":
        return "English → Vedda Direct";
      case "english_to_sinhala_fallback":
        return "English → Sinhala (Fallback)";
      case "english_to_sinhala_google":
        return "English → Sinhala (Google)";
      case "bridge_via_english":
        return "Via English Bridge";
      case "google_translate":
        return "Google Translator";
      case "sinhala_word":
        return "Sinhala Dictionary";
      case "sinhala_to_target":
        return "Sinhala → Target";
      case "vedda_as_sinhala_batch":
        return "Vedda as Sinhala (Batch)";
      case "unknown":
        return "Unknown Word";
      // Legacy methods
      case "vedda_direct":
        return "Vedda Dictionary";
      case "vedda_fallback":
        return "Sinhala Fallback";
      case "sinhala_passthrough":
        return "Sinhala Word";
      case "vedda_to_english_to_target":
        return "Via English Bridge";
      case "source_to_english_to_vedda":
        return "Via English Bridge";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Output Language Label */}
      <p className="text-sm text-gray-600 mb-3">
        {getLanguageNative(targetLanguage)}
      </p>

      {/* Loading State */}
      {loading && (
        <div className="flex-grow flex flex-col gap-2">
          <Skeleton width="80%" height="1.875rem" />
          <Skeleton width="60%" height="1.875rem" />
          <Skeleton width="90%" height="1.875rem" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Translation Output */}
      {outputText && !loading && (
        <div className="flex-grow">
          <p className="text-lg leading-relaxed mb-4 min-h-[100px]">
            {outputText}
          </p>

          {/* IPA Transcriptions */}
          {targetIpaTranscription && (
            <div className="bg-gray-50 p-6 rounded-lg mb-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-3">
                Pronunciations (IPA)
              </p>

              <div className="bg-white p-4 rounded border border-blue-100">
                <p className="text-xs font-medium text-blue-600 mb-1">
                  {LANGUAGES.find((l) => l.code === targetLanguage)?.name ||
                    targetLanguage}
                </p>
                <p
                  className="text-lg text-blue-700 font-normal tracking-wide leading-relaxed break-words"
                  style={{
                    fontFamily:
                      '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
                  }}
                >
                  /{targetIpaTranscription}/
                </p>
              </div>
            </div>
          )}

          {/* Confidence Score */}
          {confidence && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Translation Confidence: {Math.round(confidence * 100)}%
              </p>
            </div>
          )}

          {/* Translation Methods */}
          {translationMethods.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Translation methods:</p>
              <div className="flex flex-wrap gap-2">
                {[...new Set(translationMethods)].map((method, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 text-xs font-medium rounded border ${getMethodColor(
                      method
                    )}`}
                  >
                    {getMethodLabel(method)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!outputText && !loading && !error && (
        <div className="flex-grow flex items-center justify-center text-gray-500">
          <p>Click translate to see results</p>
        </div>
      )}

      {/* Output Actions */}
      {outputText && (
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <button
              onClick={handleOutputTextToSpeech}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Listen to pronunciation"
            >
              <HiVolumeUp className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              onClick={onCopyOutput}
            >
              <HiClipboardCopy className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              disabled
            >
              <HiShare className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationOutput;
