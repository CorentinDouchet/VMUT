import api from './api';

export const exportService = {
  // POST /api/export/vulnerabilities - Export dynamique multi-format
  exportVulnerabilities: async (payload) => {
    const response = await api.post('/export/vulnerabilities', payload, {
      responseType: 'blob'
    });

    const disposition = response.headers['content-disposition'];
    const fileName = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '') || `export.${payload.format?.toLowerCase() || 'csv'}`
      : `export.${payload.format?.toLowerCase() || 'csv'}`;

    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // GET /api/export/word/{scanName} - Export Word
  exportWord: async (scanName) => {
    const response = await api.get(`/export/word/${scanName}`, {
      responseType: 'blob'
    });
    
    // Télécharger automatiquement
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${scanName}_report.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  // GET /api/export/csv/{scanName} - Export CSV
  exportCsv: async (scanName) => {
    const response = await api.get(`/export/csv/${scanName}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${scanName}_vulnerabilities.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  // Template management
  listTemplates: async () => {
    return await api.get('/export/templates');
  },
  
  uploadTemplate: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post('/export/templates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  deleteTemplate: async (filename) => {
    return await api.delete(`/export/templates/${filename}`);
  },
  
  downloadTemplate: async (filename) => {
    const response = await api.get(`/export/templates/${filename}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default exportService;