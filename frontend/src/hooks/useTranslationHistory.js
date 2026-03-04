import { useState, useEffect } from "react";

const STORAGE_KEY = "vedda_translation_history";
const MAX_HISTORY = 5;

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (history) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const useTranslationHistory = () => {
  const [translationHistory, setTranslationHistory] = useState([]);

  const fetchHistory = () => {
    setTranslationHistory(loadFromStorage());
  };

  const addToHistory = ({
    input_text,
    output_text,
    source_language,
    target_language,
  }) => {
    const current = loadFromStorage();
    const newItem = {
      id: Date.now().toString(),
      input_text,
      output_text,
      source_language,
      target_language,
      created_at: new Date().toISOString(),
    };
    const updated = [newItem, ...current].slice(0, MAX_HISTORY);
    saveToStorage(updated);
    setTranslationHistory(updated);
  };

  const deleteHistoryItem = (id) => {
    const current = loadFromStorage();
    const updated = current.filter((item) => item.id !== id);
    saveToStorage(updated);
    setTranslationHistory(updated);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    translationHistory,
    fetchHistory,
    addToHistory,
    deleteHistoryItem,
  };
};
