// API configuration utility
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const apiEndpoints = {
  news: `${API_BASE_URL}/news`,
  vacancies: `${API_BASE_URL}/vacancies`,
  applications: `${API_BASE_URL}/applications`,
};

export default API_BASE_URL;
