import api from './api';

export const historyService = {
  // POST /api/history/cve - Ajouter une CVE à l'historique
  addToHistory: (data) => api.post('/history/cve', data),
  
  // GET /api/history/cves - Liste des CVE justifiées
  getJustifiedCves: (params) => api.get('/history/cves', { params }),
  getCves: (params) => api.get('/history/cves', { params }),
  
  // GET /api/history/stats - Statistiques historique
  getStats: () => api.get('/history/stats'),
  
  // GET /api/history/years - Années disponibles
  getYears: () => api.get('/history/years'),
};

export default historyService;