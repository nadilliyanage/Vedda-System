import axios from "axios";

// Dictionary service runs on port 5002 (not 5003)
const DICTIONARY_API_URL =
  import.meta.env.VITE_DICTIONARY_SERVICE_URL || "http://localhost:5002";

/**
 * Translate a single word
 * @param {string} word - Word to translate
 * @param {string} source - Source language (vedda, english, sinhala)
 * @param {string} target - Target language (vedda, english, sinhala)
 * @returns {Promise<Object>} Translation result
 */
export const translateWord = async (word, source, target) => {
  try {
    const response = await axios.get(
      `${DICTIONARY_API_URL}/api/dictionary/translate`,
      {
        params: { word, source, target },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Translation error:", error.response?.data || error.message);
    throw error.response?.data || { error: "Failed to translate word" };
  }
};

/**
 * Search dictionary
 * @param {string} query - Search query
 * @param {string} sourceLanguage - Source language filter
 * @param {string} targetLanguage - Target language filter
 * @returns {Promise<Array>} Search results
 */
/**
 * Get random words from dictionary
 * @param {number} count - Number of random words to get
 * @param {string|null} wordType - Optional word type filter
 * @returns {Promise<Array>} Random words
 */
export const getRandomWords = async (count = 5, wordType = null) => {
  try {
    const params = { count };
    if (wordType) params.type = wordType;
    const response = await axios.get(
      `${DICTIONARY_API_URL}/api/dictionary/random`,
      { params },
    );
    return response.data.words || [];
  } catch (error) {
    console.error("Random words error:", error);
    throw error.response?.data || { error: "Failed to get random words" };
  }
};

export const searchDictionary = async (
  query,
  sourceLanguage = "all",
  targetLanguage = "all",
) => {
  try {
    const response = await axios.get(
      `${DICTIONARY_API_URL}/api/dictionary/search`,
      {
        params: { q: query, source: sourceLanguage, target: targetLanguage },
      },
    );
    return response.data.results || [];
  } catch (error) {
    console.error("Dictionary search error:", error);
    throw error.response?.data || { error: "Failed to search dictionary" };
  }
};
