import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaVolumeUp } from "react-icons/fa";

// Components
import VeddaSpeechInput from "../components/speech/VeddaSpeechInput";
import { generateSpeech } from "../utils/ttsUtils";

const VeddaSTTPage = () => {
  const navigate = useNavigate();
  const [sttResults, setSttResults] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVeddaSTTResult = (result) => {
    console.log("Vedda STT Result:", result);

    // Add timestamp to result
    const timestampedResult = {
      ...result,
      timestamp: new Date().toISOString(),
      id: Date.now(), // Simple ID for React keys
    };

    // Add to results list (keep last 10)
    setSttResults((prev) => [timestampedResult, ...prev].slice(0, 10));
  };

  const handleVeddaSTTError = (error, shouldRetry, errorType) => {
    console.error("Vedda STT Error:", error, errorType);

    const errorResult = {
      success: false,
      error: error.message,
      errorType: errorType,
      timestamp: new Date().toISOString(),
      id: Date.now(),
    };

    setSttResults((prev) => [errorResult, ...prev].slice(0, 10));
  };

  const playResultText = async (text, language = "vedda") => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      await generateSpeech(text, language);
    } catch (error) {
      console.error("Failed to play text:", error);
    } finally {
      setIsPlaying(false);
    }
  };

  const clearResults = () => {
    setSttResults([]);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getResultStatusColor = (result) => {
    if (!result.success) return "text-red-600";
    if (result.confidence > 0.8) return "text-green-600";
    if (result.confidence > 0.6) return "text-yellow-600";
    return "text-orange-600";
  };

  const getMethodBadgeColor = (method) => {
    switch (method) {
      case "vedda_stt_bridge":
        return "bg-blue-100 text-blue-800";
      case "sinhala_fallback":
        return "bg-yellow-100 text-yellow-800";
      case "browser_speech_api":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span className="font-medium">Back to Home</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                Vedda Speech-to-Text Testing
              </h1>
              <p className="text-sm text-gray-600">
                Test the Vedda language STT system with Sinhala bridge
                processing
              </p>
            </div>
            <div className="w-24"></div> {/* Spacer for layout balance */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Vedda STT Input Component */}
        <div className="mb-8">
          <VeddaSpeechInput
            onResult={handleVeddaSTTResult}
            onError={handleVeddaSTTError}
          />
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              STT Test Results ({sttResults.length})
            </h2>
            {sttResults.length > 0 && (
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Clear Results
              </button>
            )}
          </div>

          {sttResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">🎤 No STT results yet</p>
              <p className="text-sm">
                Use the Vedda STT component above to start testing
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sttResults.map((result) => (
                <div
                  key={result.id}
                  className={`border rounded-lg p-4 ${
                    result.success
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${getResultStatusColor(
                          result
                        )}`}
                      >
                        {result.success ? "✅ Success" : "❌ Error"}
                      </span>
                      {result.method && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodBadgeColor(
                            result.method
                          )}`}
                        >
                          {result.method}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(result.timestamp)}
                    </span>
                  </div>

                  {result.success ? (
                    <div className="space-y-2">
                      {/* Main Result Text */}
                      <div className="flex items-center justify-between bg-white p-3 rounded border">
                        <div>
                          <p className="font-semibold text-gray-800">
                            Vedda Text:
                          </p>
                          <p className="text-lg">{result.text}</p>
                        </div>
                        <button
                          onClick={() => playResultText(result.text)}
                          disabled={isPlaying}
                          className="p-2 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                          title="Play Vedda text"
                        >
                          <FaVolumeUp size={16} />
                        </button>
                      </div>

                      {/* Original Sinhala (if different) */}
                      {result.original_sinhala &&
                        result.original_sinhala !== result.text && (
                          <div className="bg-white p-3 rounded border">
                            <p className="font-semibold text-gray-600 text-sm">
                              Original Sinhala:
                            </p>
                            <p className="text-gray-700">
                              {result.original_sinhala}
                            </p>
                          </div>
                        )}

                      {/* Confidence and Stats */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>
                          Confidence: {(result.confidence * 100).toFixed(1)}%
                        </span>
                        {result.matched_words !== undefined && (
                          <span>
                            Matched: {result.matched_words}/{result.total_words}{" "}
                            words
                          </span>
                        )}
                      </div>

                      {/* Word Details */}
                      {result.word_details &&
                        result.word_details.length > 0 && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="font-semibold text-sm text-gray-700 mb-2">
                              Word Mappings:
                            </p>
                            <div className="space-y-1">
                              {result.word_details.map((detail, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="text-gray-600">
                                    {detail.sinhala}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-blue-600 font-medium">
                                    {detail.vedda}
                                  </span>
                                  <span
                                    className={`px-1 py-0.5 rounded text-xs ${
                                      detail.method === "direct_mapping"
                                        ? "bg-green-100 text-green-700"
                                        : detail.method === "fuzzy_matching"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {detail.method}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Notes */}
                      {result.note && (
                        <div className="bg-blue-50 p-2 rounded text-sm text-blue-700">
                          <strong>Note:</strong> {result.note}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-700">
                      <p className="font-semibold">Error:</p>
                      <p>{result.error}</p>
                      {result.errorType && (
                        <p className="text-sm mt-1">Type: {result.errorType}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            Testing Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>
              Click &ldquo;Start Vedda STT&rdquo; to begin speech recognition
            </li>
            <li>Speak clearly in Vedda language (which uses Sinhala script)</li>
            <li>
              The system will process your speech through Sinhala STT first
            </li>
            <li>Then map Sinhala words to Vedda using the dictionary</li>
            <li>Results show both the final Vedda text and original Sinhala</li>
            <li>Word mapping details show how each word was processed</li>
          </ol>

          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Try speaking words that exist in the Vedda
              dictionary like: &ldquo;කැකුලෝ ගෙදර ඉන්නවා&rdquo; (children are at
              home) or &ldquo;අම්මා කෑම කරනවා&rdquo; (mother is cooking)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeddaSTTPage;
