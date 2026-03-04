import { HiVolumeUp, HiClipboardCopy, HiShare } from "react-icons/hi";
import { LANGUAGES } from "../../constants/languages";
import { generateSpeech } from "../../utils/ttsUtils";

// Loading skeleton component
const Skeleton = ({ width = "100%", height = "1.5rem" }) => (
  <div
    className="animate-pulse rounded"
    style={{ width, height, background: "rgba(200, 165, 90, 0.22)" }}
  />
);

const TranslationOutput = ({
  outputText,
  sourceLanguage,
  targetLanguage,
  loading,
  error,
  sourceIpaTranscription,
  targetIpaTranscription,
  sourceSinglish,
  targetSinglish,
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
        return (
          "px-2 py-1 text-xs font-medium rounded border" +
          " " +
          "bg-indigo-100/60 text-indigo-900 border-indigo-300/60"
        );
      case "dictionary":
      case "english_to_vedda_direct":
      case "vedda_direct":
        return (
          "px-2 py-1 text-xs font-medium rounded border" +
          " " +
          "bg-green-100/60 text-green-900 border-green-300/60"
        );
      case "phrase_match":
        return (
          "px-2 py-1 text-xs font-medium rounded border" +
          " " +
          "bg-teal-100/60 text-teal-900 border-teal-300/60"
        );
      case "fallback":
      case "english_to_sinhala_fallback":
      case "bridge_via_english":
      case "vedda_fallback":
      case "vedda_to_english_to_target":
      case "source_to_english_to_vedda":
        return (
          "px-2 py-1 text-xs font-medium rounded border" +
          " " +
          "bg-amber-100/60 text-amber-900 border-amber-300/60"
        );
      case "sinhala_bridge":
      case "english_to_sinhala_google":
      case "sinhala_to_target":
      case "sinhala_passthrough":
        return (
          "px-2 py-1 text-xs font-medium rounded border" +
          " " +
          "bg-sky-100/60 text-sky-900 border-sky-300/60"
        );
      case "sinhala_word":
      case "vedda_as_sinhala_batch":
        return (
          "px-2 py-1 text-xs font-medium rounded border" +
          " " +
          "bg-purple-100/60 text-purple-900 border-purple-300/60"
        );
      case "unknown":
        return (
          "px-2 py-1 text-xs font-medium rounded border" +
          " " +
          "bg-red-100/60 text-red-900 border-red-300/60"
        );
      default:
        return (
          "px-2 py-1 text-xs font-medium rounded border" +
          " " +
          "bg-stone-100/60 text-stone-800 border-stone-300/60"
        );
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
      <p className="text-sm font-semibold mb-3" style={{ color: "#8c7040" }}>
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
        <div
          className="px-4 py-3 rounded-lg mb-4"
          style={{
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid rgba(220, 38, 38, 0.30)",
            color: "#7f1d1d",
          }}
        >
          {error}
        </div>
      )}

      {/* Translation Output */}
      {outputText && !loading && (
        <div className="flex-grow">
          <p
            className="text-lg leading-relaxed mb-4 min-h-[100px]"
            style={{ color: "#2d1f07" }}
          >
            {outputText}
          </p>

          {/* Target Pronunciation */}
          {(targetIpaTranscription || targetSinglish) && (
            <div
              className="p-6 rounded-lg mb-4"
              style={{
                background: "rgba(200, 165, 90, 0.14)",
                border: "1px solid rgba(200, 165, 90, 0.32)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              <p
                className="text-sm font-semibold mb-4 flex items-center"
                style={{ color: "#5c4a1e" }}
              >
                <span className="mr-2">🔊</span>
                {LANGUAGES.find((l) => l.code === targetLanguage)?.name ||
                  targetLanguage}{" "}
                Pronunciation
              </p>

              <div className="space-y-3">
                {/* Target Singlish - Only for Vedda/Sinhala */}
                {targetSinglish &&
                  (targetLanguage === "vedda" ||
                    targetLanguage === "sinhala") && (
                    <div
                      className="p-4 rounded-lg shadow-sm"
                      style={{
                        background: "rgba(255, 248, 230, 0.55)",
                        border: "1px solid rgba(200, 165, 90, 0.25)",
                      }}
                    >
                      <p
                        className="text-xs font-semibold mb-2 uppercase tracking-wide"
                        style={{ color: "#8c7040" }}
                      >
                        Singlish
                      </p>
                      <p
                        className="text-base font-medium tracking-wide leading-relaxed break-words"
                        style={{ color: "#2d1f07" }}
                      >
                        {targetSinglish}
                      </p>
                    </div>
                  )}

                {/* Target IPA - For all languages */}
                {targetIpaTranscription && (
                  <div
                    className="p-4 rounded-lg shadow-sm"
                    style={{
                      background: "rgba(255, 248, 230, 0.55)",
                      border: "1px solid rgba(200, 165, 90, 0.25)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold mb-2 uppercase tracking-wide"
                      style={{ color: "#8c7040" }}
                    >
                      IPA (International Phonetic Alphabet)
                    </p>
                    <p
                      className="text-base font-normal tracking-wide leading-relaxed break-words"
                      style={{
                        color: "#5c3a10",
                        fontFamily:
                          '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
                      }}
                    >
                      /{targetIpaTranscription}/
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confidence Score */}
          {confidence && (
            <div className="mb-4">
              <p className="text-sm" style={{ color: "#8c7040" }}>
                Translation Confidence: {Math.round(confidence * 100)}%
              </p>
            </div>
          )}

          {/* Translation Methods */}
          {translationMethods.length > 0 && (
            <div className="mb-4">
              <p className="text-sm mb-2" style={{ color: "#8c7040" }}>
                Translation methods:
              </p>
              <div className="flex flex-wrap gap-2">
                {[...new Set(translationMethods)].map((method, index) => (
                  <span key={index} className={getMethodColor(method)}>
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
        <div className="flex-grow flex items-center justify-center">
          <p style={{ color: "#8c7040" }}>Click translate to see results</p>
        </div>
      )}

      {/* Output Actions */}
      {outputText && (
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <button
              onClick={handleOutputTextToSpeech}
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ color: "#9a6f2a" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(200,165,90,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              title="Listen to pronunciation"
            >
              <HiVolumeUp className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ color: "#5c4a1e" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(200,165,90,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              onClick={onCopyOutput}
            >
              <HiClipboardCopy className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-lg transition-colors duration-200"
              style={{ color: "rgba(140,112,64,0.45)", cursor: "not-allowed" }}
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
