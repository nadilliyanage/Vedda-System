import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// Add auth token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ========== 3D Model Words API ==========
export const modelAPI = {
  /**
   * Get all words with IPA data for lip-sync animation
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of results (default: 100)
   * @param {number} params.skip - Number to skip (default: 0)
   * @param {boolean} params.hasVeddaIpa - Filter only words with vedda_ipa
   */
  getWords: (params = {}) => {
    const { limit = 100, skip = 0, hasVeddaIpa = true } = params;
    return axios.get(`${API_BASE}/api/3d-models/words/ipa-only`, {
      params: {
        limit,
        skip,
        has_vedda_ipa: hasVeddaIpa
      }
    });
  },

  /**
   * Get words that have vedda_IPA defined
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of results (default: 100)
   * @param {number} params.skip - Number to skip (default: 0)
   */
  getWordsWithIPA: (params = {}) => {
    const { limit = 100, skip = 0 } = params;
    return axios.get(`${API_BASE}/api/3d-models/words/ipa`, {
      params: { limit, skip }
    });
  },

  /**
   * Get a specific word by ID
   * @param {string} wordId - The word ID
   */
  getWordById: (wordId) => axios.get(`${API_BASE}/api/3d-models/words/${wordId}`),

  /**
   * Get word details by Vedda word
   * @param {string} veddaWord - The Vedda word
   */
  getWordByVedda: (veddaWord) => axios.get(`${API_BASE}/api/3d-models/words/vedda/${encodeURIComponent(veddaWord)}`),

  /**
   * Search words with filters
   * @param {Object} params - Query parameters
   * @param {string} params.wordType - Filter by word type
   * @param {string} params.search - Search term
   * @param {number} params.limit - Number of results (default: 100)
   * @param {number} params.skip - Number to skip (default: 0)
   */
  searchWords: (params = {}) => {
    const { wordType, search, limit = 100, skip = 0 } = params;
    return axios.get(`${API_BASE}/api/3d-models/words`, {
      params: {
        word_type: wordType,
        search,
        limit,
        skip
      }
    });
  }
};

export default modelAPI;
