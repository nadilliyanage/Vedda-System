import { useState, useRef, useEffect } from "react";
import { HiMicrophone, HiStop } from "react-icons/hi";
import {
  BrowserSpeechRecognition,
  isSpeechRecognitionSupported,
} from "../../utils/browserSTT";

const SpeechInput = ({
  language = "english",
  onTranscription,
  onError,
  disabled = false,
  className = "",
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  const recorderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if (!isSpeechRecognitionSupported()) {
      setError("Speech recognition not supported in this browser");
    }

    // Cleanup on unmount
    return () => {
      if (recorderRef.current) {
        recorderRef.current.abort();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError("");

      // Check if online
      if (!navigator.onLine) {
        setError(
          "No internet connection. Speech recognition requires internet access."
        );
        return;
      }

      setIsRecording(true);
      setRecordingTime(0);

      // Create new speech recognition instance
      recorderRef.current = new BrowserSpeechRecognition();

      // Set up event handlers
      recorderRef.current.onResult = (result) => {
        setIsProcessing(false);
        setIsRecording(false);

        if (result.success && result.text) {
          if (onTranscription) {
            onTranscription(result.text, result);
          }
        } else {
          const errorMsg = result.error || "Could not understand the audio";
          setError(errorMsg);
          if (onError) {
            onError(new Error(errorMsg));
          }
        }

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      recorderRef.current.onError = (err, shouldRetry, errorType) => {
        setIsProcessing(false);
        setIsRecording(false);

        // For network errors, try English fallback
        if (shouldRetry && errorType === "network" && language !== "english") {
          console.log("Network error, trying English fallback...");
          setError("Network error, trying English...");

          setTimeout(() => {
            try {
              recorderRef.current.initialize("english");
              recorderRef.current.start();
              setIsRecording(true);
              setError("");
            } catch (fallbackError) {
              setError(
                "Speech recognition unavailable. Please check your internet connection."
              );
              if (onError) {
                onError(new Error("Speech recognition service unavailable"));
              }
            }
          }, 1000);
        } else {
          // For network errors, offer manual input option
          if (errorType === "network") {
            setError("Network error. Click microphone again or type manually.");
          } else {
            setError(err.message);
          }

          if (onError) {
            onError(err);
          }
        }

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      recorderRef.current.onStart = () => {
        // Start timer when recognition actually starts
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      };

      recorderRef.current.onEnd = () => {
        setIsProcessing(false);
        setIsRecording(false);

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      // Initialize and start recording
      recorderRef.current.initialize(language);
      recorderRef.current.start();
    } catch (err) {
      setIsRecording(false);
      setError(err.message);
      if (onError) {
        onError(err);
      }
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Microphone Button */}
      <button
        onClick={handleMicrophoneClick}
        disabled={disabled || isProcessing || !isSpeechRecognitionSupported()}
        className={`
          flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
          ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : "bg-gray-100 hover:bg-gray-200 text-gray-600"
          }
          ${
            disabled || isProcessing || !isSpeechRecognitionSupported()
              ? "opacity-50 cursor-not-allowed"
              : "hover:scale-110"
          }
          ${error ? "ring-2 ring-red-300" : ""}
        `}
        title={
          !isSpeechRecognitionSupported()
            ? "Speech recognition not supported"
            : isRecording
            ? "Stop recording"
            : "Start voice input"
        }
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : isRecording ? (
          <HiStop className="w-5 h-5" />
        ) : (
          <HiMicrophone className="w-5 h-5" />
        )}
      </button>

      {/* Recording Status */}
      {isRecording && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          Recording {formatTime(recordingTime)}
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          Processing...
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-2 py-1 rounded text-xs whitespace-nowrap max-w-48 text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default SpeechInput;
