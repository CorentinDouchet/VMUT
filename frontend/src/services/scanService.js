import api from './api';

export const scanService = {
  // GET /api/assets/scans - Liste des scans
  getScans: () => api.get('/assets/scans'),
  
  // GET /api/assets/{scanName} - Assets d'un scan
  getAssetsByScan: (scanName, page = 1, limit = 50) => 
    api.get(`/assets/${scanName}`, { params: { page, limit } }),
  
  // POST /api/scan-import/upload - Upload un scan
  uploadScan: (file, scanName, runMatching = true) => {
    const formData = new FormData();
    formData.append('scanFile', file);
    if (scanName) formData.append('scanName', scanName);
    formData.append('runMatching', runMatching);
    
    return api.post('/scan-import/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // POST /api/scan-import/{scanName}/match - Lancer le matching
  runMatching: (scanName) => api.post(`/scan-import/${scanName}/match`),

  // POST /api/scan-import/upload-pivot - Upload un scan Pivot
  uploadPivotScan: (file, relatedAssetName) => {
    const formData = new FormData();
    formData.append('file', file);
    if (relatedAssetName) formData.append('relatedAssetName', relatedAssetName);
    
    return api.post('/scan-import/upload-pivot', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // GET /api/scan-import/{scanName}/xml-report - Récupérer les CVE d'un rapport XML
  getXmlReport: (scanName) => api.get(`/scan-import/${scanName}/xml-report`),

  // GET /api/scan-import/history - Historique des imports
  getImportHistory: (limit = 50) => api.get('/scan-import/history', { params: { limit } }),

  // GET /api/scan-import/{id}/logs - Logs d'un import
  getImportLogs: (importId) => api.get(`/scan-import/${importId}/logs`),

  // GET /api/scan-import/stats - Statistiques d'imports
  getImportStats: () => api.get('/scan-import/stats'),

  // GET /api/scan-import/pivot/{scanName}/data - Récupérer les données d'un scan Pivot
  getPivotData: (scanName) => api.get(`/scan-import/pivot/${scanName}/data`),
};

export default scanService;