import api from './api';

export const cvssService = {
  // PUT /api/cvss/vulnerability/{id}/score - Modifier le score
  updateScore: (id, data) => 
    api.put(`/cvss/vulnerability/${id}/score`, data),
  
  // DELETE /api/cvss/vulnerability/{id}/score - Réinitialiser
  resetScore: (id) => 
    api.delete(`/cvss/vulnerability/${id}/score`),
  
  // GET /api/cvss/vulnerability/{id} - Récupérer les infos CVSS d'une vulnérabilité
  getById: (id) =>
    api.get(`/cvss/vulnerability/${id}`),
  
  // POST /api/cvss/vulnerability/{id}/comment - Ajouter commentaire
  addComment: (id, comment, author, role) => 
    api.post(`/cvss/vulnerability/${id}/comment`, { comment, author, role }),
  
  // DELETE /api/cvss/vulnerability/{vulnId}/comment/{commentId}
  deleteComment: (vulnId, commentId, role) => 
    api.delete(`/cvss/vulnerability/${vulnId}/comment/${commentId}`, {
      params: { role }
    }),
  
  // POST /api/cvss/vulnerabilities/bulk-comment - Commentaire multiple
  addBulkComment: (ids, comment, author, role) => 
    api.post('/cvss/vulnerabilities/bulk-comment', { ids, comment, author, role }),
};

export default cvssService;