import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ""
  ? import.meta.env.VITE_API_URL
  : (window.location.origin.includes("localhost:5173") ? "http://localhost:8000" : window.location.origin);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization bearer tokens
api.interceptors.request.use(
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

// Response interceptor to handle session expiries (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect if session expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

// Document Handling
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDocuments = () => api.get('/documents');

export const clearDocuments = () => api.delete('/documents');

// RAG Chat
export const chatWithDocument = (question, filename = "") => {
  return api.post('/chat', { question, index_name: filename || "default" });
};

// Outlines / Summaries
export const generateSummary = (text, summaryType, filename = "") => {
  return api.post('/summary', { text, summary_type: summaryType, filename });
};

// Quiz Generator
export const generateQuiz = (text, quizType, difficulty, numQuestions, filename = "") => {
  return api.post('/quiz', {
    text,
    quiz_type: quizType,
    difficulty,
    num_questions: parseInt(numQuestions, 10),
    filename
  });
};

// Explainer
export const explainTopic = (topic, mode, filename = "") => {
  return api.post('/explain', { topic, mode, filename });
};

// Translation
export const translateText = (text, targetLang) => {
  return api.post('/translate', { text, target_lang: targetLang });
};

// Authentication APIs
export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const register = (name, email, password) => {
  return api.post('/auth/register', { name, email, password });
};

export const logout = () => {
  return api.post('/auth/logout');
};

export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (token, password) => {
  return api.post('/auth/reset-password', { token, password });
};

export const getMe = () => {
  return api.get('/auth/me');
};

export const getDashboardStats = () => {
  return api.get('/auth/dashboard-stats');
};

export const getHealth = () => api.get('/health');

export default api;
