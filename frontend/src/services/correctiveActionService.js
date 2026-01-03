import api from './api.js';

export const correctiveActionService = {
  // Get all corrective actions
  getAll: () => api.get('/corrective-actions')
};

export default correctiveActionService;
