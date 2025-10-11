import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../constants/languages";

export const useTranslationHistory = () => {
  const [translationHistory, setTranslationHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/history`);
      setTranslationHistory(response.data.history.slice(0, 5)); // Show last 5
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    translationHistory,
    fetchHistory,
  };
};
