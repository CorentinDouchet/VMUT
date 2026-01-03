import api from './api.js';

export const adminService = {
  // Import CVE data
  importCves: (formData) => api.post('/admin/import-cves', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  // Get import statistics
  getImportStats: () => api.get('/admin/import-stats'),

  // Build CPE index
  buildCpeIndex: () => api.post('/admin/build-cpe-index')
};

export default adminService;
