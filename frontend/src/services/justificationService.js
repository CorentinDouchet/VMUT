import api from './api';

/**
 * Service pour la réutilisation des justifications entre actifs
 * STB_REQ_0150
 */
const justificationService = {
  /**
   * Récupère toutes les justifications d'un actif
   */
  getJustificationsByAsset: async (assetId) => {
    return await api.get(`/justifications/asset/${assetId}`);
  },

  /**
   * Recherche des justifications par CVE
   */
  searchJustificationsByCve: async (cveId) => {
    return await api.get(`/justifications/search?cveId=${cveId}`);
  },

  /**
   * Copie des justifications d'un actif source vers un actif cible
   */
  copyJustifications: async (request) => {
    return await api.post('/justifications/copy', request);
  },

  /**
   * Suggère des justifications réutilisables pour un actif
   */
  suggestJustifications: async (assetId) => {
    return await api.get(`/justifications/suggest/${assetId}`);
  }
};

export default justificationService;
