import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const chatWithDocument = (question, filename = "") => {
  return api.post('/chat', { question, index_name: "default" });
};

export const generateSummary = (text, summaryType, filename = "") => {
  return api.post('/summary', { text, summary_type: summaryType, filename });
};

export const generateQuiz = (text, quizType, difficulty, numQuestions, filename = "") => {
  return api.post('/quiz', {
    text,
    quiz_type: quizType,
    difficulty,
    num_questions: parseInt(numQuestions, 10),
    filename
  });
};

export const explainTopic = (topic, mode, filename = "") => {
  return api.post('/explain', { topic, mode, filename });
};

export const translateText = (text, targetLang) => {
  return api.post('/translate', { text, target_lang: targetLang });
};

export const getHealth = () => api.get('/health');

export default api;
