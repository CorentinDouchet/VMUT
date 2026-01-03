import axios from 'axios';

// URL de ton backend Spring Boot
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Intercepteur de requête
api.interceptors.request.use(
  config => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    
    // Add JWT token to all requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Intercepteur de réponse
api.interceptors.response.use(
  response => {
    console.log(`✅ ${response.config.url} - ${response.status}`);
    return response.data;
  },
  error => {
    console.error(`❌ ${error.config?.url} - ${error.response?.status}`);
    
    // Si le token est expiré (401 ou 403), déconnecter l'utilisateur
    if (error.response?.status === 401 || error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || '';
      if (errorMessage.includes('expiré') || errorMessage.includes('expired') || error.response?.status === 401) {
        console.warn('⚠️ Token expiré - Déconnexion automatique');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function for fetch with authentication
export const authenticatedFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};

export default api;