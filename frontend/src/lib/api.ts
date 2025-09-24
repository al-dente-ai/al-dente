import Axios from 'axios';
import type { ApiError } from './types';

// Create axios instance
const api = Axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('app:accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized
    if (error?.response?.status === 401) {
      localStorage.removeItem('app:accessToken');
      localStorage.removeItem('app:auth');
      window.location.assign('/login');
      return Promise.reject(error);
    }

    // Normalize error format
    const apiError: ApiError = {
      message: error?.response?.data?.message || error?.message || 'An unexpected error occurred',
      code: error?.response?.data?.code,
      details: error?.response?.data,
    };

    return Promise.reject(apiError);
  }
);

export default api;
