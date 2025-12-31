import axios from 'axios';

const API_URL = import.meta.env.VITE_ARTIFACT_SERVICE_URL || 'http://localhost:5010/api/artifacts';

// Create axios instance
const artifactAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
artifactAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get all artifacts with pagination and filters
export const getArtifacts = async (params = {}) => {
  const response = await artifactAPI.get('/', { params });
  return response.data;
};

// Get single artifact by ID
export const getArtifactById = async (id) => {
  const response = await artifactAPI.get(`/${id}`);
  return response.data;
};

// Create artifact (manual entry - no image)
export const createArtifact = async (artifactData) => {
  const response = await artifactAPI.post('/', artifactData);
  return response.data;
};

// Create artifact with image
export const createArtifactWithImage = async (formData) => {
  const response = await axios.post(`${API_URL}/with-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

// Upload single image
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await axios.post(`${API_URL}/upload/single`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  return response.data;
};

// Update artifact
export const updateArtifact = async (id, artifactData) => {
  const response = await artifactAPI.put(`/${id}`, artifactData);
  return response.data;
};

// Delete artifact
export const deleteArtifact = async (id) => {
  const response = await artifactAPI.delete(`/${id}`);
  return response.data;
};

// Get artifacts by category
export const getArtifactsByCategory = async (category) => {
  const response = await artifactAPI.get(`/category/${category}`);
  return response.data;
};

// AI auto-generate metadata (placeholder for future implementation)
export const generateMetadata = async (imageUrl) => {
  try {
    const response = await artifactAPI.post('/generate-metadata', { imageUrl });
    // Backend returns data nested in response.data.data
    const metadata = response.data.data;
    return {
      name: metadata.suggestedName,
      description: metadata.suggestedDescription,
      category: metadata.suggestedCategory,
      tags: metadata.suggestedTags,
      estimatedAge: metadata.estimatedAge
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    throw new Error(error.response?.data?.message || 'Failed to generate metadata');
  }
};

export default {
  getArtifacts,
  getArtifactById,
  createArtifact,
  createArtifactWithImage,
  uploadImage,
  updateArtifact,
  deleteArtifact,
  getArtifactsByCategory,
  generateMetadata,
};
