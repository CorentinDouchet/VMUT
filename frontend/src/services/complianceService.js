import api from './api.js';

export const complianceService = {
  // Get compliance rules
  getRules: () => api.get('/compliance/rules'),

  // Get compliance statistics
  getStats: () => api.get('/compliance/stats')
};

export default complianceService;
