import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('rento_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rento_token');
      localStorage.removeItem('rento_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
