import React, { useState, useEffect, useRef } from "react";
import { VeddaSTT } from "../../utils/veddaSTT";
import "./VeddaSpeechInput.css";

const VeddaSpeechInput = ({ onResult, onError, disabled = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState(null);
  const [dictionaryStats, setDictionaryStats] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const veddaSTTRef = useRef(null);
  const recordingTimeoutRef = useRef(null);

  useEffect(() => {
    // Check if Vedda STT is supported
    setIsSupported(VeddaSTT.isSupported());

    // Initialize Vedda STT
    const initVeddaSTT = async () => {
      try {
        const veddaSTT = new VeddaSTT();
        await veddaSTT.initialize();

        veddaSTT.onStart = () => {
          setIsRecording(true);
          setError(null);
          console.log("Vedda STT started");
        };

        veddaSTT.onResult = (result) => {
          console.log("Vedda STT result:", result);
          setIsRecording(false);
          setIsProcessing(false);
          setLastResult(result);

          if (onResult) {
            onResult(result);
          }
        };

        veddaSTT.onError = (error, shouldRetry, errorType) => {
          console.error("Vedda STT error:", error);
          setIsRecording(false);
          setIsProcessing(false);
          setError(error.message);

          if (onError) {
            onError(error, shouldRetry, errorType);
          }
        };

        veddaSTT.onEnd = () => {
          setIsRecording(false);
          setIsProcessing(false);
          console.log("Vedda STT ended");
        };

        veddaSTTRef.current = veddaSTT;
      } catch (error) {
        console.error("Failed to initialize Vedda STT:", error);
        setError("Failed to initialize Vedda speech recognition");
        setIsSupported(false);
      }
    };

    const loadStats = async () => {
      try {
        const veddaSTT = new VeddaSTT();
        const stats = await veddaSTT.getDictionaryStats();
        setDictionaryStats(stats);
      } catch (error) {
        console.error("Failed to load dictionary stats:", error);
      }
    };

    initVeddaSTT();
    loadStats();

    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, [onResult, onError]);

  const startRecording = () => {
    if (!veddaSTTRef.current || disabled || isRecording) {
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      veddaSTTRef.current.start();

      // Set timeout for maximum recording duration (30 seconds)
      recordingTimeoutRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
          setError("Recording timed out. Please try again.");
        }
      }, 30000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setError("Failed to start recording: " + error.message);
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (veddaSTTRef.current) {
      veddaSTTRef.current.stop();
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  };

  const testProcessor = async () => {
    if (!veddaSTTRef.current) return;

    try {
      setIsProcessing(true);
      const result = await veddaSTTRef.current.testProcessor(
        "ළමයි ගෙදර ඉන්නවා"
      );
      setLastResult(result);
      console.log("Test result:", result);
      setIsProcessing(false);
    } catch (error) {
      console.error("Test failed:", error);
      setError("Test failed: " + error.message);
      setIsProcessing(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="vedda-speech-input unsupported">
        <div className="error-message">
          <span className="icon">⚠️</span>
          <p>
            Vedda speech recognition is not supported in this browser or
            requires internet connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vedda-speech-input">
      <div className="speech-controls">
        <button
          className={`record-button ${isRecording ? "recording" : ""} ${
            isProcessing ? "processing" : ""
          }`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
          title="Click to start/stop Vedda speech recognition"
        >
          <span className="icon">
            {isProcessing ? "⏳" : isRecording ? "⏹️" : "🎤"}
          </span>
          <span className="text">
            {isProcessing
              ? "Processing..."
              : isRecording
              ? "Stop Recording"
              : "Start Vedda STT"}
          </span>
        </button>

        <button
          className="test-button"
          onClick={testProcessor}
          disabled={disabled || isProcessing || isRecording}
          title="Test Vedda STT processor with sample text"
        >
          <span className="icon">🧪</span>
          <span className="text">Test</span>
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span className="icon">❌</span>
          <p>{error}</p>
        </div>
      )}

      {lastResult && (
        <div className="last-result">
          <h4>Last Result:</h4>
          <div className="result-details">
            <p>
              <strong>Vedda Text:</strong> {lastResult.text}
            </p>
            {lastResult.original_sinhala &&
              lastResult.original_sinhala !== lastResult.text && (
                <p>
                  <strong>Original Sinhala:</strong>{" "}
                  {lastResult.original_sinhala}
                </p>
              )}
            <p>
              <strong>Confidence:</strong>{" "}
              {(lastResult.confidence * 100).toFixed(1)}%
            </p>
            <p>
              <strong>Method:</strong> {lastResult.method}
            </p>
            {lastResult.matched_words !== undefined && (
              <p>
                <strong>Matched Words:</strong> {lastResult.matched_words}/
                {lastResult.total_words}
              </p>
            )}
          </div>

          {lastResult.word_details && lastResult.word_details.length > 0 && (
            <div className="word-details">
              <h5>Word Mapping:</h5>
              <div className="word-mappings">
                {lastResult.word_details.map((detail, index) => (
                  <div key={index} className={`word-mapping ${detail.method}`}>
                    <span className="sinhala">{detail.sinhala}</span>
                    <span className="arrow">→</span>
                    <span className="vedda">{detail.vedda}</span>
                    <span className="method">({detail.method})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {dictionaryStats && (
        <div className="dictionary-stats">
          <h4>Dictionary Status:</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="label">Total Entries:</span>
              <span className="value">
                {dictionaryStats.stats?.total_entries || 0}
              </span>
            </div>
            <div className="stat-item">
              <span className="label">Sinhala Mappings:</span>
              <span className="value">
                {dictionaryStats.stats?.sinhala_mappings || 0}
              </span>
            </div>
            <div className="stat-item">
              <span className="label">Phonetic Patterns:</span>
              <span className="value">
                {dictionaryStats.stats?.phonetic_patterns || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="usage-instructions">
        <h4>How Vedda STT Works:</h4>
        <ol>
          <li>🎤 Click &ldquo;Start Vedda STT&rdquo; to begin recording</li>
          <li>🗣️ Speak in Vedda language (uses Sinhala script)</li>
          <li>⚡ Speech is converted to Sinhala first</li>
          <li>🔄 Sinhala text is mapped to Vedda using dictionary</li>
          <li>✅ Final Vedda text is returned with confidence score</li>
        </ol>
        <p>
          <strong>Note:</strong> This system works best with words that exist in
          the Vedda dictionary.
        </p>
      </div>
    </div>
  );
};

export default VeddaSpeechInput;
