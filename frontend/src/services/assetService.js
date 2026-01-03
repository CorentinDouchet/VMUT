import api from './api.js';

export const assetService = {
  // Get all assets
  getAll: () => api.get('/assets'),

  // Get asset by ID
  getById: (id) => api.get(`/assets/${id}`),

  // Get asset by name
  getByName: (name) => api.get(`/assets/name/${name}`),

  // Get asset by IP
  getByIp: (ip) => api.get(`/assets/ip/${ip}`),

  // Get vulnerabilities summary for an asset
  getVulnerabilitiesSummary: (assetName) => api.get(`/assets/name/${assetName}/vulnerabilities/summary`),

  // Refresh vulnerabilities for an asset
  refreshVulnerabilities: (assetName) => api.post(`/assets/name/${assetName}/vulnerabilities/refresh`),

  // Get all scans for an asset
  getScans: (assetName) => api.get(`/assets/name/${assetName}/scans`),

  // Get OpenVAS scans for an asset by name
  getOpenVASScans: (assetName) => api.get(`/assets/name/${assetName}/scans/openvas`),

  // Get OpenVAS scans for an asset by ID
  getOpenVASScansByAssetId: (assetId) => api.get(`/assets/${assetId}/scans/openvas`),

  // Get all OpenVAS scans for all assets
  getAllOpenVASScans: () => api.get('/assets/scans/openvas'),

  // Get Pivot scans for an asset
  getPivotScans: (assetName) => api.get(`/assets/name/${assetName}/scans/pivot`),

  // Get all scans (Cyberwatch)
  getAllScans: () => api.get('/assets/scans'),

  // Get scan statistics
  getScanStats: (scanName) => api.get(`/assets/scans/${scanName}/stats`),

  // Get asset statistics
  getStats: () => api.get('/assets/stats'),

  // Create a new asset
  create: (assetData) => api.post('/assets', assetData),

  // Delete an asset
  delete: (id) => api.delete(`/assets/${id}`),
  
  // Duplicate an asset (STB_REQ_0140)
  duplicate: (id, request) => api.post(`/assets/${id}/duplicate`, request),
  
  // Get asset hierarchy (STB_REQ_0130)
  getHierarchy: (id) => api.get(`/assets/${id}/hierarchy`),
  
  // Get all asset hierarchies (STB_REQ_0130)
  getAllHierarchies: () => api.get('/assets/hierarchies'),
  
  // Assign sub-asset (STB_REQ_0130)
  assignSubAsset: (parentId, subAssetId) => api.post(`/assets/${parentId}/sub-assets/${subAssetId}`),
  
  // Remove sub-asset (STB_REQ_0130)
  removeSubAsset: (parentId, subAssetId) => api.delete(`/assets/${parentId}/sub-assets/${subAssetId}`),

  // Assign asset to group
  assignToGroup: (groupId, assetId) => api.post(`/groups/${groupId}/assets/${assetId}`),

  // Remove asset from group
  removeFromGroup: (groupId, assetId) => api.delete(`/groups/${groupId}/assets/${assetId}`)
};

export default assetService;
