import api from './api.js';

export const auditService = {
  // Get audit logs with filters
  getLogs: (params = {}) => api.get('/audit/logs', { params }),

  // Get audit statistics
  getStats: () => api.get('/audit/stats'),

  // Export audit logs
  exportLogs: (params = {}) => api.get('/audit/export', {
      params,
      responseType: 'blob'
    })
};

export default auditService;
