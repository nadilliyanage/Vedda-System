import axios from 'axios';

// Dictionary service runs on port 5002 (not 5003)
const DICTIONARY_API_URL = import.meta.env.VITE_DICTIONARY_SERVICE_URL || 'http://localhost:5002';

/**
 * Translate a single word
 * @param {string} word - Word to translate
 * @param {string} source - Source language (vedda, english, sinhala)
 * @param {string} target - Target language (vedda, english, sinhala)
 * @returns {Promise<Object>} Translation result
 */
export const translateWord = async (word, source, target) => {
  try {
    const response = await axios.get(`${DICTIONARY_API_URL}/api/dictionary/translate`, {
      params: { word, source, target }
    });
    return response.data;
  } catch (error) {
    console.error('Translation error:', error.response?.data || error.message);
    throw error.response?.data || { error: 'Failed to translate word' };
  }
};

/**
 * Search dictionary
 * @param {string} query - Search query
 * @param {string} sourceLanguage - Source language filter
 * @param {string} targetLanguage - Target language filter
 * @returns {Promise<Array>} Search results
 */
export const searchDictionary = async (query, sourceLanguage = 'all', targetLanguage = 'all') => {
  try {
    const response = await axios.get(`${DICTIONARY_API_URL}/api/dictionary/search`, {
      params: { q: query, source: sourceLanguage, target: targetLanguage }
    });
    return response.data.results || [];
  } catch (error) {
    console.error('Dictionary search error:', error);
    throw error.response?.data || { error: 'Failed to search dictionary' };
  }
};
