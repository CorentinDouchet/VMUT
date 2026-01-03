import api from './api.js';

export const cweService = {
  // Get CWE details by ID
  getById: (cweId) => api.get(`/cwe/${cweId}`)
};

export default cweService;
