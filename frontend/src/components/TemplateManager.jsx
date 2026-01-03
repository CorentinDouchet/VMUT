import React, { useState, useEffect } from 'react';
import exportService from '../services/exportService';

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await exportService.listTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
      alert('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.docx')) {
        alert('Seuls les fichiers .docx sont acceptés');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      await exportService.uploadTemplate(selectedFile);
      alert('Template uploadé avec succès');
      setSelectedFile(null);
      // Reset file input
      document.getElementById('file-input').value = '';
      loadTemplates();
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload du template');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le template "${filename}" ?`)) {
      return;
    }

    try {
      await exportService.deleteTemplate(filename);
      alert('Template supprimé avec succès');
      loadTemplates();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du template');
    }
  };

  const handleDownload = async (filename) => {
    try {
      await exportService.downloadTemplate(filename);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement du template');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Gestion des templates d'export</h1>
        <p className="text-slate-500">
          Gérez les templates Word (.docx) pour personnaliser vos rapports d'export
        </p>
      </div>

      {/* Section d'upload */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Ajouter un template</h2>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-900 mb-2">Placeholders supportés</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Métadonnées :</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code className="bg-blue-100 px-1 rounded">{'{{export_date}}'}</code> - Date de génération</li>
              <li><code className="bg-blue-100 px-1 rounded">{'{{export_id}}'}</code> - Identifiant unique</li>
              <li><code className="bg-blue-100 px-1 rounded">{'{{author}}'}</code> - Auteur de l'export</li>
              <li><code className="bg-blue-100 px-1 rounded">{'{{scope}}'}</code> - Périmètre analysé</li>
              <li><code className="bg-blue-100 px-1 rounded">{'{{cve_version}}'}</code> - Version de la base CVE</li>
              <li><code className="bg-blue-100 px-1 rounded">{'{{asset_name}}'}</code> - Nom de l'asset</li>
              <li><code className="bg-blue-100 px-1 rounded">{'{{total_vulnerabilities}}'}</code> - Nombre total de CVE</li>
            </ul>
            <p className="mt-3"><strong>Tableaux dynamiques :</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code className="bg-blue-100 px-1 rounded">{'{{vuln_table}}'}</code> - Tableau des vulnérabilités</li>
              <li><code className="bg-blue-100 px-1 rounded">{'{{summary_stats}}'}</code> - Tableau de statistiques</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fichier template (.docx)
            </label>
            <input
              id="file-input"
              type="file"
              accept=".docx"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {selectedFile && (
              <p className="text-sm text-slate-600 mt-2">
                📎 {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Upload...' : 'Uploader'}
          </button>
        </div>
      </div>

      {/* Liste des templates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">
            Templates disponibles ({templates.length})
          </h2>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-lg mb-2">📭 Aucun template disponible</p>
            <p className="text-sm">Uploadez votre premier template pour commencer</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {templates.map((template) => (
              <div
                key={template.name}
                className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <h3 className="font-medium text-slate-900">{template.name}</h3>
                      <p className="text-sm text-slate-500">
                        {formatFileSize(template.size)} • 
                        Modifié le {formatDate(template.lastModified)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(template.name)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Télécharger"
                  >
                    📥 Télécharger
                  </button>
                  <button
                    onClick={() => handleDelete(template.name)}
                    className="px-3 py-1.5 text-sm border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateManager;
