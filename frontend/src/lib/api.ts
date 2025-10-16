import Axios from 'axios';
import type { ApiError } from './types';

// Create axios instance
const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const api = Axios.create({
  baseURL: base,
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
    // Backend returns errors in format: { error: { code, message, details } }
    const errorData = error?.response?.data?.error || {};
    const apiError: ApiError = {
      message: errorData.message || error?.message || 'An unexpected error occurred',
      code: errorData.code,
      details: errorData.details || error?.response?.data,
    };

    return Promise.reject(apiError);
  }
);

export default api;
