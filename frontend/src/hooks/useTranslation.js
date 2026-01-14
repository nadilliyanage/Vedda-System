import { useState } from "react";
import axios from "axios";
import { SERVICE_URLS } from "../constants/languages";

export const useTranslation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const translate = async (inputText, sourceLanguage, targetLanguage) => {
    if (!inputText.trim()) {
      setError("Please enter text to translate");
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${SERVICE_URLS.TRANSLATOR}/api/translate`,
        {
          text: inputText,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          include_ipa: true,
        }
      );

      return {
        translatedText: response.data.translated_text,
        translationMethods: response.data.methods_used || [],
        targetIpaTranscription:
          response.data.target_ipa || response.data.ipa_transcription || "",
        sourceIpaTranscription: response.data.source_ipa || "",
        targetSinglish: response.data.target_romanization || "",
        sourceSinglish: response.data.source_romanization || "",
        bridgeTranslation: response.data.bridge_translation || "",
        confidence: response.data.confidence || null,
        sinhalaWordsDetected: response.data.sinhala_words_detected,
        note: response.data.note,
      };
    } catch (err) {
      setError("Translation failed. Please try again.");
      console.error("Translation error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    translate,
    loading,
    error,
    setError,
  };
};
