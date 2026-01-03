import api from './api.js';

export const dashboardService = {
  // Get dashboard statistics
  getStats: () => api.get('/dashboard/stats')
};

export default dashboardService;
