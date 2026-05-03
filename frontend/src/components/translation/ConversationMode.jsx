import { useState, useRef, useEffect } from "react";
import { HiX, HiMicrophone, HiVolumeUp } from "react-icons/hi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useTranslation } from "../../hooks/useTranslation";
import { generateSpeech } from "../../utils/ttsUtils";
import { SpeechRecorder } from "../../utils/sttUtils";

const ConversationMode = ({ sourceLanguage, targetLanguage, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(sourceLanguage);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputLanguage, setManualInputLanguage] =
    useState(sourceLanguage);
  const messagesEndRef = useRef(null);

  const { translate, loading } = useTranslation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSpeak = async (text, language) => {
    if (!text.trim()) return;

    // Cancel any ongoing browser speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    try {
      await generateSpeech(text, language);
    } catch (error) {
      console.error("TTS failed:", error.message);
    }
  };

  const handleMicrophoneClick = (language) => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome or Edge.",
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Map language codes
    const languageMap = {
      english: "en-US",
      sinhala: "si-LK",
      tamil: "ta-IN",
      vedda: "si-LK",
      hindi: "hi-IN",
      french: "fr-FR",
      german: "de-DE",
      spanish: "es-ES",
      chinese: "zh-CN",
      japanese: "ja-JP",
      korean: "ko-KR",
    };

    recognition.lang = languageMap[language] || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setActiveLanguage(language);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
        .replace(/\.+$/, "")
        .trim();

      // Add original message
      const userMessage = {
        id: Date.now(),
        text: transcript,
        language: language,
        type: "user",
        isSource: language === sourceLanguage,
      };

      setMessages((prev) => [...prev, userMessage]);

      // Translate
      const targetLang =
        language === sourceLanguage ? targetLanguage : sourceLanguage;

      try {
        const result = await translate(transcript, language, targetLang);

        if (result && result.translatedText) {
          // Add translated message
          const translatedMessage = {
            id: Date.now() + 1,
            text: result.translatedText,
            language: targetLang,
            type: "translated",
            isSource: targetLang === sourceLanguage,
            confidence: result.confidence,
          };

          setMessages((prev) => [...prev, translatedMessage]);

          // Auto-speak translation after a short delay
          setTimeout(() => {
            handleSpeak(result.translatedText, targetLang);
          }, 300);
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    };

    recognition.onerror = async (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        alert(
          "Microphone access denied. Please allow microphone access in your browser settings.",
        );
      } else if (event.error === "no-speech") {
        // Don't alert for no-speech, just silently fail
        console.log("No speech detected");
      } else if (event.error === "network") {
        // Browser speech API failed with network error — fall back to backend STT
        console.warn("Browser speech recognition network error — falling back to backend STT");
        await handleBackendSTT(language);
      } else if (event.error === "audio-capture") {
        alert("No microphone found. Please ensure a microphone is connected.");
      } else if (event.error !== "aborted") {
        alert(`Speech recognition error: ${event.error}. Please try again.`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsRecording(false);
      // Fall back to backend STT
      handleBackendSTT(language);
    }
  };

  /**
   * Fallback: use backend STT service (MediaRecorder + server-side Whisper)
   */
  const handleBackendSTT = async (language) => {
    const recorder = new SpeechRecorder();

    setIsRecording(true);
    setActiveLanguage(language);

    recorder.onResult = async (result) => {
      setIsRecording(false);
      recorder.cleanup();

      if (!result?.text) return;

      const transcript = result.text.replace(/\.+$/, "").trim();

      const userMessage = {
        id: Date.now(),
        text: transcript,
        language: language,
        type: "user",
        isSource: language === sourceLanguage,
      };
      setMessages((prev) => [...prev, userMessage]);

      const targetLang =
        language === sourceLanguage ? targetLanguage : sourceLanguage;

      try {
        const translation = await translate(transcript, language, targetLang);
        if (translation?.translatedText) {
          const translatedMessage = {
            id: Date.now() + 1,
            text: translation.translatedText,
            language: targetLang,
            type: "translated",
            isSource: targetLang === sourceLanguage,
            confidence: translation.confidence,
          };
          setMessages((prev) => [...prev, translatedMessage]);
          setTimeout(() => handleSpeak(translation.translatedText, targetLang), 300);
        }
      } catch (err) {
        console.error("Translation error:", err);
      }
    };

    recorder.onError = (err) => {
      setIsRecording(false);
      recorder.cleanup();
      console.error("Backend STT error:", err);
      alert("Speech recognition failed. Please try typing your message instead.");
    };

    try {
      await recorder.initialize(language);
      await recorder.startRecording();

      // Auto-stop after 6 seconds
      setTimeout(() => {
        if (recorder.isRecording) {
          recorder.stopRecording();
        }
      }, 6000);
    } catch (err) {
      setIsRecording(false);
      recorder.cleanup();
      console.error("Failed to start backend STT:", err);
      alert("Could not access microphone. Please check your browser permissions.");
    }
  };


  const getLanguageLabel = (lang) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const handleManualSubmit = async (language) => {
    if (!manualInput.trim()) return;

    // Add original message
    const userMessage = {
      id: Date.now(),
      text: manualInput,
      language: language,
      type: "user",
      isSource: language === sourceLanguage,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Translate
    const targetLang =
      language === sourceLanguage ? targetLanguage : sourceLanguage;

    try {
      const result = await translate(manualInput, language, targetLang);

      if (result && result.translatedText) {
        // Add translated message
        const translatedMessage = {
          id: Date.now() + 1,
          text: result.translatedText,
          language: targetLang,
          type: "translated",
          isSource: targetLang === sourceLanguage,
          confidence: result.confidence,
        };

        setMessages((prev) => [...prev, translatedMessage]);

        // Auto-speak translation
        setTimeout(() => {
          handleSpeak(result.translatedText, targetLang);
        }, 300);
      }
    } catch (error) {
      console.error("Translation error:", error);
    }

    // Clear input and close modal
    setManualInput("");
    setShowManualInput(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "rgba(20,14,4,0.82)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 md:p-6 shadow-sm"
          style={{
            background: "rgba(255, 248, 230, 0.14)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderBottom: "1px solid rgba(200, 165, 90, 0.28)",
          }}
        >
          <div className="flex items-center space-x-2 md:space-x-4">
            <h2
              className="text-lg md:text-xl font-semibold"
              style={{ color: "rgba(255,248,230,0.92)" }}
            >
              Conversation Mode
            </h2>
            <div
              className="flex items-center space-x-2 text-xs md:text-sm"
              style={{ color: "rgba(212,180,131,0.80)" }}
            >
              <span
                className="px-2 md:px-3 py-1 rounded-full"
                style={{
                  background: "rgba(154,111,42,0.28)",
                  color: "#d4b483",
                  border: "1px solid rgba(200,165,90,0.30)",
                }}
              >
                {getLanguageLabel(sourceLanguage)}
              </span>
              <span className="hidden sm:inline">↔</span>
              <span
                className="px-2 md:px-3 py-1 rounded-full"
                style={{
                  background: "rgba(60,130,80,0.28)",
                  color: "#7fcf9a",
                  border: "1px solid rgba(60,160,80,0.30)",
                }}
              >
                {getLanguageLabel(targetLanguage)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: "rgba(212,180,131,0.80)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(200,165,90,0.20)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <HiX className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4"
          style={{ background: "rgba(20,14,4,0.40)" }}
        >
          {messages.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-full"
              style={{ color: "rgba(212,180,131,0.55)" }}
            >
              <HiMicrophone className="w-12 h-12 md:w-16 md:h-16 mb-4" />
              <p className="text-sm md:text-lg text-center px-4">
                Tap a microphone to start conversation
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isSource ? "justify-start" : "justify-end"}`}
              >
                <div
                  className="max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-lg p-3 md:p-4"
                  style={{
                    background: message.isSource
                      ? "rgba(154,111,42,0.30)"
                      : "rgba(60,130,80,0.28)",
                    border: message.isSource
                      ? "1px solid rgba(200,165,90,0.35)"
                      : "1px solid rgba(60,160,80,0.30)",
                    color: message.isSource ? "#f5e9c8" : "#c8f0d8",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-semibold uppercase"
                      style={{ opacity: 0.75 }}
                    >
                      {getLanguageLabel(message.language)}
                    </span>
                    <button
                      onClick={() =>
                        handleSpeak(message.text, message.language)
                      }
                      className="p-1 rounded-full transition-colors ml-2"
                      style={{ opacity: 0.75 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.75";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <HiVolumeUp className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm md:text-base break-words">
                    {message.text}
                  </p>
                  {message.type === "translated" && message.confidence && (
                    <div className="mt-2 text-xs" style={{ opacity: 0.65 }}>
                      Confidence: {(message.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Control Panel */}
        <div
          className="p-3 md:p-6 shadow-lg"
          style={{
            background: "rgba(255, 248, 230, 0.12)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            borderTop: "1px solid rgba(200, 165, 90, 0.28)",
          }}
        >
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {/* Source Language Controls */}
            <div className="space-y-2">
              <button
                onClick={() => handleMicrophoneClick(sourceLanguage)}
                disabled={
                  loading || (isRecording && activeLanguage !== sourceLanguage)
                }
                className={`w-full relative flex flex-col items-center justify-center p-4 md:p-6 rounded-lg transition-all ${
                  loading || (isRecording && activeLanguage !== sourceLanguage)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                style={{
                  background:
                    isRecording && activeLanguage === sourceLanguage
                      ? "rgba(220, 38, 38, 0.70)"
                      : "rgba(154, 111, 42, 0.55)",
                  border: "1px solid rgba(200,165,90,0.40)",
                  color: "rgba(255,248,230,0.95)",
                  transform:
                    isRecording && activeLanguage === sourceLanguage
                      ? "scale(1.04)"
                      : "scale(1)",
                  boxShadow:
                    isRecording && activeLanguage === sourceLanguage
                      ? "0 6px 24px rgba(220,38,38,0.35)"
                      : "0 2px 8px rgba(0,0,0,0.20)",
                }}
              >
                {loading && activeLanguage === sourceLanguage ? (
                  <AiOutlineLoading3Quarters className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
                ) : (
                  <HiMicrophone
                    className={`w-8 h-8 md:w-12 md:h-12 ${isRecording && activeLanguage === sourceLanguage ? "animate-pulse" : ""}`}
                  />
                )}
                <span className="mt-1 md:mt-2 font-semibold text-xs md:text-base">
                  {getLanguageLabel(sourceLanguage)}
                </span>
                {isRecording && activeLanguage === sourceLanguage && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setManualInputLanguage(sourceLanguage);
                  setShowManualInput(true);
                }}
                className="w-full px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
                style={{
                  background: "rgba(154,111,42,0.22)",
                  border: "1px solid rgba(200,165,90,0.30)",
                  color: "#d4b483",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(154,111,42,0.38)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(154,111,42,0.22)")
                }
              >
                Type instead
              </button>
            </div>

            {/* Target Language Controls */}
            <div className="space-y-2">
              <button
                onClick={() => handleMicrophoneClick(targetLanguage)}
                disabled={
                  loading || (isRecording && activeLanguage !== targetLanguage)
                }
                className={`w-full relative flex flex-col items-center justify-center p-4 md:p-6 rounded-lg transition-all ${
                  loading || (isRecording && activeLanguage !== targetLanguage)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                style={{
                  background:
                    isRecording && activeLanguage === targetLanguage
                      ? "rgba(220, 38, 38, 0.70)"
                      : "rgba(40, 130, 80, 0.55)",
                  border: "1px solid rgba(60,160,90,0.40)",
                  color: "rgba(255,248,230,0.95)",
                  transform:
                    isRecording && activeLanguage === targetLanguage
                      ? "scale(1.04)"
                      : "scale(1)",
                  boxShadow:
                    isRecording && activeLanguage === targetLanguage
                      ? "0 6px 24px rgba(220,38,38,0.35)"
                      : "0 2px 8px rgba(0,0,0,0.20)",
                }}
              >
                {loading && activeLanguage === targetLanguage ? (
                  <AiOutlineLoading3Quarters className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
                ) : (
                  <HiMicrophone
                    className={`w-8 h-8 md:w-12 md:h-12 ${isRecording && activeLanguage === targetLanguage ? "animate-pulse" : ""}`}
                  />
                )}
                <span className="mt-1 md:mt-2 font-semibold text-xs md:text-base">
                  {getLanguageLabel(targetLanguage)}
                </span>
                {isRecording && activeLanguage === targetLanguage && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setManualInputLanguage(targetLanguage);
                  setShowManualInput(true);
                }}
                className="w-full px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
                style={{
                  background: "rgba(40,130,80,0.22)",
                  border: "1px solid rgba(60,160,90,0.30)",
                  color: "#7fcf9a",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(40,130,80,0.38)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(40,130,80,0.22)")
                }
              >
                Type instead
              </button>
            </div>
          </div>

          {isRecording && (
            <div
              className="mt-3 md:mt-4 text-center text-xs md:text-sm"
              style={{ color: "rgba(212,180,131,0.75)" }}
            >
              Listening... Speak now
            </div>
          )}
        </div>
      </div>

      {/* Manual Input Modal */}
      {showManualInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.60)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            className="rounded-xl shadow-2xl w-full max-w-md p-4 md:p-6"
            style={{
              background: "rgba(255, 248, 230, 0.88)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(200, 165, 90, 0.35)",
            }}
          >
            <h3
              className="text-base md:text-lg font-semibold mb-3 md:mb-4"
              style={{ color: "#2d1f07" }}
            >
              Type in {getLanguageLabel(manualInputLanguage)}
            </h3>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={`Type your message in ${getLanguageLabel(manualInputLanguage)}...`}
              className="textarea-field h-32 text-sm md:text-base"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleManualSubmit(manualInputLanguage)}
                disabled={!manualInput.trim() || loading}
                className="flex-1 btn-blue disabled:opacity-50 text-sm md:text-base"
              >
                {loading ? "Translating..." : "Send"}
              </button>
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setManualInput("");
                }}
                className="flex-1 btn-secondary text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationMode;
