import axios from 'axios';

const API_URL = import.meta.env.VITE_ARTIFACT_SERVICE_URL || 'http://localhost:5010/api/feedback';

// Create axios instance
const feedbackAPI = axios.create({
   baseURL: API_URL,
   headers: {
      'Content-Type': 'application/json',
   },
});

// Add auth token to requests
feedbackAPI.interceptors.request.use((config) => {
   const token = localStorage.getItem('token');
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

// Submit feedback for an artifact (any authenticated user)
export const submitFeedback = async (data) => {
   const response = await feedbackAPI.post('/', data);
   return response.data;
};

// Upload images for feedback (any authenticated user)
export const uploadFeedbackImages = async (files) => {
   const formData = new FormData();
   files.forEach((file) => formData.append('images', file));
   const response = await feedbackAPI.post('/upload-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
   });
   return response.data;
};

// Get current user's own feedback
export const getMyFeedback = async (params = {}) => {
   const response = await feedbackAPI.get('/my', { params });
   return response.data;
};

// Get all feedback (admin/elder only)
export const getAllFeedback = async (params = {}) => {
   const response = await feedbackAPI.get('/', { params });
   return response.data;
};

// Get single feedback by ID (admin/elder only)
export const getFeedbackById = async (id) => {
   const response = await feedbackAPI.get(`/${id}`);
   return response.data;
};

// Review feedback - approve or reject (admin/elder only)
export const reviewFeedback = async (id, status, reviewNote = '') => {
   const response = await feedbackAPI.put(`/${id}/review`, { status, reviewNote });
   return response.data;
};

// Get feedback statistics (admin/elder only)
export const getFeedbackStats = async () => {
   const response = await feedbackAPI.get('/stats');
   return response.data;
};

export default {
   submitFeedback,
   uploadFeedbackImages,
   getMyFeedback,
   getAllFeedback,
   getFeedbackById,
   reviewFeedback,
   getFeedbackStats,
};
