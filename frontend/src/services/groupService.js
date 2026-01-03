import api from './api.js';

export const groupService = {
  // Get all groups
  getAll: () => api.get('/groups'),

  // Get group by ID
  getById: (groupId) => api.get(`/groups/${groupId}`),

  // Get users in a group
  getGroupUsers: (groupId) => api.get(`/groups/${groupId}/users`),

  // Create a new group
  create: (groupData) => api.post('/groups', groupData),

  // Update a group
  update: (groupId, groupData) => api.put(`/groups/${groupId}`, groupData),

  // Delete a group
  delete: (groupId) => api.delete(`/groups/${groupId}`),

  // Add user to group
  addUser: (groupId, userId) => api.post(`/groups/${groupId}/users/${userId}`),

  // Remove user from group
  removeUser: (groupId, userId) => api.delete(`/groups/${groupId}/users/${userId}`),

  // Assign asset to group
  assignAsset: (groupId, assetId) => api.post(`/groups/${groupId}/assets/${assetId}`),

  // Remove asset from group
  removeAsset: (groupId, assetId) => api.delete(`/groups/${groupId}/assets/${assetId}`)
};

export default groupService;
