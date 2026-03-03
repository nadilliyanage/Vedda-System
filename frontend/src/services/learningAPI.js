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

// ========== Categories API ==========
export const categoriesAPI = {
  getAll: () => axios.get(`${API_BASE}/api/learn/admin/categories`),
  
  getById: (id) => axios.get(`${API_BASE}/api/learn/admin/categories/${id}`),
  
  create: (data) => axios.post(`${API_BASE}/api/learn/admin/categories`, data),
  
  update: (id, data) => axios.put(`${API_BASE}/api/learn/admin/categories/${id}`, data),
  
  delete: (id) => axios.delete(`${API_BASE}/api/learn/admin/categories/${id}`)
};

// ========== Lessons API ==========
export const lessonsAPI = {
  getAll: () => axios.get(`${API_BASE}/api/learn/admin/lessons`),
  
  getById: (id) => axios.get(`${API_BASE}/api/learn/admin/lessons/${id}`),
  
  create: (data) => axios.post(`${API_BASE}/api/learn/admin/lessons`, data),
  
  update: (id, data) => axios.put(`${API_BASE}/api/learn/admin/lessons/${id}`, data),
  
  delete: (id) => axios.delete(`${API_BASE}/api/learn/admin/lessons/${id}`),

  userDashboard: (userId) => axios.get(`${API_BASE}/api/learn/user-dashboard/${userId}`),
};

export const userStatAPI = {
  userDashboard: (userId) => axios.get(`${API_BASE}/api/learn/user-dashboard?user_id=${userId}`),
  getLeaderboard: (userId) => axios.get(`${API_BASE}/api/learn/leaderboard?user_id=${userId}`),
};

// ========== Exercises API ==========
export const exercisesAPI = {
  getAll: () => axios.get(`${API_BASE}/api/learn/admin/exercises`),
  
  getById: (id) => axios.get(`${API_BASE}/api/learn/admin/exercises/${id}`),
  
  create: (data) => axios.post(`${API_BASE}/api/learn/admin/exercises`, data),
  
  update: (id, data) => axios.put(`${API_BASE}/api/learn/admin/exercises/${id}`, data),
  
  delete: (id) => axios.delete(`${API_BASE}/api/learn/admin/exercises/${id}`),

  submitAnswer: (data) => axios.post(`${API_BASE}/api/learn/ai/submit-answer`, data),

  startExercise: (data) => axios.post(`${API_BASE}/api/learn/lesson-progress`, data),

  generatePersonalized: (userId) => axios.post(`${API_BASE}/api/learn/ai/generate-personalized-exercise`, { user_id: userId })
};

// ========== Challenges API ==========
export const challengesAPI = {
  getAll: (userId) => axios.get(`${API_BASE}/api/learn/admin/challenges`, {
    params: userId ? { user_id: userId } : {}
  }),
  
  getById: (id) => axios.get(`${API_BASE}/api/learn/admin/challenges/${id}`),
  
  create: (data) => axios.post(`${API_BASE}/api/learn/admin/challenges`, data),
  
  update: (id, data) => axios.put(`${API_BASE}/api/learn/admin/challenges/${id}`, data),
  
  delete: (id) => axios.delete(`${API_BASE}/api/learn/admin/challenges/${id}`)
};

// ========== Quiz/Challenge Gameplay API ==========
export const quizAPI = {
  getNextChallenge: (type) => 
    axios.get(`${API_BASE}/api/learn/next-challenge`, { params: { type } }),
  
  submitAnswer: (data) => 
    axios.post(`${API_BASE}/api/learn/submit`, data)
};


// Default export with all APIs
export default {
  categories: categoriesAPI,
  lessons: lessonsAPI,
  exercises: exercisesAPI,
  challenges: challengesAPI,
  quiz: quizAPI
};
