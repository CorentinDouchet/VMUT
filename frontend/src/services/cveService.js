import api from './api';

export const cveService = {
  // GET /api/cves/list - Liste des CVE avec filtres
  getCves: (params) => api.get('/cves/list', { params }),
  getList: (params) => api.get('/cves/list', { params }),
  
  // GET /api/cves/{cveId} - Détails d'une CVE
  getCveDetails: (cveId) => api.get(`/cves/${cveId}`),
  
  // GET /api/cves/stats - Statistiques
  getStats: (year) => api.get('/cves/stats', { params: { year } }),
  
  // GET /api/cves/years - Années disponibles
  getYears: () => api.get('/cves/years'),
  
  // GET /api/cves/scores - Scores disponibles
  getScores: () => api.get('/cves/scores'),
  
  // GET /api/cves/cvss-versions - Versions CVSS
  getCvssVersions: () => api.get('/cves/cvss-versions'),
};

export default cveService;