import axios from 'axios';

const getAPIUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
  }
  return 'https://band-manager-s9tm.onrender.com/api';
};

const api = axios.create({
  baseURL: getAPIUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor tự động thêm Bearer token vào header cho mỗi request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
