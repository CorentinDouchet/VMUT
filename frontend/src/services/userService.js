import api from './api.js';

export const userService = {
  // Get all users
  getAll: () => api.get('/users'),

  // Get user by ID
  getById: (userId) => api.get(`/users/${userId}`),

  // Get user statistics
  getStats: () => api.get('/users/stats'),

  // Search users
  search: (query) => api.get('/users/search', {
      params: { q: query }
    }),

  // Get available roles
  getRoles: () => api.get('/users/roles'),

  // Create a new user
  create: (userData) => api.post('/users', userData),

  // Update a user
  update: (userId, userData) => api.put(`/users/${userId}`, userData),

  // Toggle user active status
  toggleStatus: (userId) => api.patch(`/users/${userId}/toggle-status`),

  // Delete a user
  delete: (userId) => api.delete(`/users/${userId}`)
};

export default userService;
