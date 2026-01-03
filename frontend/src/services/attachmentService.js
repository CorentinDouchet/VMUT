import api from './api';

const attachmentService = {
  // POST /api/cvss/vulnerability/{id}/attachments - Upload un fichier
  uploadAttachment: (vulnerabilityId, file, uploadedBy, description = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', uploadedBy);
    if (description) {
      formData.append('description', description);
    }
    
    return api.post(`/cvss/vulnerability/${vulnerabilityId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  // GET /api/cvss/vulnerability/{id}/attachments - Liste des pièces jointes
  getAttachments: (vulnerabilityId) => 
    api.get(`/cvss/vulnerability/${vulnerabilityId}/attachments`),
  
  // GET /api/cvss/attachments/{attachmentId}/download - Télécharger un fichier
  downloadAttachment: (attachmentId) => {
    return api.get(`/cvss/attachments/${attachmentId}/download`, {
      responseType: 'blob'
    });
  },
  
  // DELETE /api/cvss/attachments/{attachmentId} - Supprimer un fichier
  deleteAttachment: (attachmentId) => 
    api.delete(`/cvss/attachments/${attachmentId}`),
};

export default attachmentService;
