import axios from "axios";

// API base URL for 3D model service
const API_BASE_URL = import.meta.env.VITE_3D_MODEL_API_URL || "http://localhost:5008/api/3d-models";

/**
 * Fetch all Vedda words from the 3D model service.
 * @param {Object} params - Optional query params (word_type, search, limit, skip)
 * @returns {Promise<{success: boolean, data: Array, metadata?: Object, error?: string}>}
 */
export const getAllWords = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/words`, { params });
    // The backend returns: { success, data: [words], metadata }
    return response.data;
  } catch (error) {
    // Prefer backend error message if available
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw { success: false, error: error.message };
  }
};

/**
 * Fetch a single Vedda word by ID
 * @param {string} id
 * @returns {Promise<{success: boolean, data: Object, error?: string}>}
 */
export const getWordById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/words/${id}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw { success: false, error: error.message };
  }
};

