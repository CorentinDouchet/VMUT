import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import scanService from '../services/scanService';
import '../styles/ScanUpload.css';

const PivotUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const assetName = searchParams.get('assetName'); // Récupérer le nom de l'asset depuis l'URL

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    
    // Vérifier l'extension
    if (file && !file.name.endsWith('.xlsx')) {
      setError('Veuillez sélectionner un fichier Excel (.xlsx)');
      setSelectedFile(null);
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    // Ajouter le relatedAssetName si disponible
    if (assetName) {
      formData.append('relatedAssetName', assetName);
    }

    try {
      const data = await scanService.uploadPivotScan(selectedFile, assetName);
      setUploadResult(data);
      
      if (data.success) {
        // Réinitialiser le formulaire
        setSelectedFile(null);
        document.getElementById('pivot-file-input').value = '';
      }
    } catch (err) {
      console.error('Erreur upload Pivot:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'upload du fichier');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    document.getElementById('pivot-file-input').value = '';
  };

  return (
    <div className="pivot-upload-container">
      <div className="upload-card">
        <h2>Upload Scan Pivot</h2>
        <div className="upload-form">
          <div className="file-input-wrapper">
            <label htmlFor="pivot-file-input" className="file-input-label">
              Importer le scan
            </label>
            <input
              id="pivot-file-input"
              type="file"
              accept=".xlsx"
              onChange={handleFileSelect}
              disabled={uploading}
              className="file-input"
            />
          </div>

          {selectedFile && (
            <div className="selected-file">
              <span className="file-icon">📄</span>
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">
                ({(selectedFile.size / 1024).toFixed(2)} KB)
              </span>
            </div>
          )}

          <div className="upload-actions">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="btn btn-primary"
            >
              {uploading ? '⏳ Upload en cours...' : '⬆️ Importer'}
            </button>
            
            <button
              onClick={handleReset}
              disabled={uploading}
              className="btn btn-secondary"
            >
              🔄 Réinitialiser
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            <span>{error}</span>
          </div>
        )}

        {uploadResult && (
          <div className={`alert ${uploadResult.success ? 'alert-success' : 'alert-error'}`}>
            {uploadResult.success ? (
              <>
                <div className="alert-header">
                  <span className="alert-icon">✅</span>
                  <strong>Import réussi !</strong>
                </div>
                <div className="upload-stats">
                  <div className="stat">
                    <span className="stat-label">Lignes lues:</span>
                    <span className="stat-value">{uploadResult.totalRows}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Assets importés:</span>
                    <span className="stat-value stat-success">{uploadResult.imported}</span>
                  </div>
                  {uploadResult.skipped > 0 && (
                    <div className="stat">
                      <span className="stat-label">Lignes ignorées:</span>
                      <span className="stat-value stat-warning">{uploadResult.skipped}</span>
                    </div>
                  )}
                </div>
                
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="errors-list">
                    <strong>⚠️ Erreurs détectées:</strong>
                    <ul>
                      {uploadResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="alert-icon">❌</span>
                <span>{uploadResult.error}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PivotUpload;
