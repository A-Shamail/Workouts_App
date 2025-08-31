import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.location.href = '/';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.data?.detail) {
      toast.error(error.response.data.detail);
    }
    
    return Promise.reject(error);
  }
);

// API service methods
export const authService = {
  login: (userId) => api.post('/api/auth/login', { user_id: userId }),
};

export const profileService = {
  create: (profileData) => api.post('/api/profile', profileData),
  get: (userId) => api.get(`/api/profile/${userId}`),
  update: (userId, profileData) => api.put(`/api/profile/${userId}`, profileData),
};

export const planService = {
  generate: (weekNumber) => api.post('/api/plans/generate', { week_number: weekNumber }),
  get: (planId) => api.get(`/api/plans/${planId}`),
  getCurrent: (userId) => api.get(`/api/plans/user/${userId}/current`),
};

export const logService = {
  create: (logData) => api.post('/api/logs', logData),
  getWeek: (userId, weekNumber) => api.get(`/api/logs/user/${userId}/week/${weekNumber}`),
};

export const feedbackService = {
  submit: (feedbackData) => api.post('/api/feedback', feedbackData),
};

export const adaptationService = {
  adapt: (userId, weekNumber) => api.post(`/api/adapt/${userId}/week/${weekNumber}`),
};

export const calendarService = {
  export: (planId) => api.get(`/api/export/calendar/${planId}`, { responseType: 'blob' }),
};

export default api;
