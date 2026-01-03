import api from './api';

const securityDefaultsService = {
  /**
   * Récupère tous les défauts de sécurité
   */
  getAllDefaults: async () => {
    try {
      return await api.get('/security-defaults');
    } catch (error) {
      console.error('Erreur lors de la récupération des défauts de sécurité:', error);
      throw error;
    }
  },

  /**
   * Récupère les détails d'un défaut spécifique
   */
  getDefaultDetails: async (reference) => {
    try {
      return await api.get(`/security-defaults/${reference}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération du défaut ${reference}:`, error);
      throw error;
    }
  },

  /**
   * Recherche des défauts avec filtres
   */
  searchDefaults: async (searchTerm, severity, status) => {
    try {
      const params = {};
      if (searchTerm) params.searchTerm = searchTerm;
      if (severity) params.severity = severity;
      if (status) params.status = status;

      return await api.get('/security-defaults/search', { params });
    } catch (error) {
      console.error('Erreur lors de la recherche de défauts:', error);
      throw error;
    }
  },

  /**
   * Récupère les statistiques des défauts de sécurité
   */
  getStats: async () => {
    try {
      return await api.get('/security-defaults/stats');
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
};

export default securityDefaultsService;
