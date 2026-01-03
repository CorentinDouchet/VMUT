import api from './api';

export const statsService = {
  // GET /api/stats - Statistiques globales
  getGlobalStats: () => api.get('/stats'),
  
  // GET /api/stats/trends - Tendances temporelles
  getTrends: () => api.get('/stats/trends'),
};

export default statsService;