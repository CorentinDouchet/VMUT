import api from './api.js';

export const authService = {
  // POST /api/auth/login - Se connecter
  login: async (username, password) => {
    return api.post('/auth/login', { username, password });
  },

  // POST /api/auth/logout - Se déconnecter
  logout: async () => {
    return api.post('/auth/logout');
  },

  // GET /api/auth/me - Récupérer l'utilisateur connecté
  getCurrentUser: async () => {
    return api.get('/auth/me');
  }
};

export default authService;
