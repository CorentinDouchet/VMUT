import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import scanService from '../services/scanService';

function OpenVASUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [searchParams] = useSearchParams();
  const assetName = searchParams.get('assetName'); // Récupérer le nom de l'asset depuis l'URL
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.xml')) {
        alert('⚠️ Veuillez sélectionner un fichier XML');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier XML');
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    
    // Ajouter le nom de l'asset si disponible
    if (assetName) {
      formData.append('relatedAssetName', assetName);
    }

    try {
      const data = await scanService.uploadOpenVAS(formData);
      setResult(data);
      
      if (data.success) {
        alert(`✅ Import réussi!\n\n` +
              `📊 ${data.totalCves} CVEs trouvées\n` +
              `💾 ${data.imported} vulnérabilités importées\n` +
              `🔍 ${data.enriched} enrichies depuis la base CVE`);
        
        console.log('📊 Résultats import OpenVAS:', data);
        
        // Naviguer vers la page des vulnérabilités
        setTimeout(() => {
          navigate('/vulnerabilities');
        }, 1000);
      } else {
        alert(`❌ Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`❌ Erreur lors de l'upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    document.getElementById('openvas-file-input').value = '';
  };

  return (
    <div className="upload-container">
      <div className="breadcrumb">
        <span className="breadcrumb-item clickable" onClick={() => navigate('/assets')}>
          Actifs
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-item">Import OpenVAS</span>
      </div>

      <div className="content-header">
        <div className="page-title-section">
          <div>
            <h1 className="page-title">📤 Import OpenVAS</h1>
            <p className="page-subtitle">
              Importer un rapport XML OpenVAS et créer les vulnérabilités dans la base
            </p>
          </div>
        </div>
      </div>

      <div className="upload-section" style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        <div className="upload-card">
          <div className="card-header">
            <h2 className="card-title">
              📄 Sélectionner un fichier XML OpenVAS
            </h2>
          </div>
          <div className="card-body">
            <input
              id="openvas-file-input"
              type="file"
              accept=".xml"
              onChange={handleFileChange}
              className="file-input"
              disabled={uploading}
            />

            {file && (
              <div className="file-info" style={{ marginTop: '1rem' }}>
                <div className="file-details">
                  <p><strong>Fichier :</strong> {file.name}</p>
                  <p><strong>Taille :</strong> {(file.size / 1024).toFixed(2)} Ko</p>
                </div>
              </div>
            )}

            <div className="button-group" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {uploading ? '⏳ Upload en cours...' : '📤 Importer'}
              </button>
              
              {file && !uploading && (
                <button
                  onClick={handleReset}
                  className="btn btn-secondary"
                >
                  🔄 Réinitialiser
                </button>
              )}
            </div>

            {result && (
              <div className={`result-box ${result.success ? 'success' : 'error'}`} style={{ marginTop: '1.5rem' }}>
                <h3 className="result-title">
                  {result.success ? '✅ Import réussi' : '❌ Erreur'}
                </h3>
                
                {result.success ? (
                  <div className="result-stats">
                    <div className="stat-item">
                      <span className="stat-label">CVEs trouvées :</span>
                      <span className="stat-value">{result.totalCves}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Vulnérabilités importées :</span>
                      <span className="stat-value">{result.imported}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Enrichies :</span>
                      <span className="stat-value">{result.enriched}</span>
                    </div>
                    {result.scanName && (
                      <div className="stat-item">
                        <span className="stat-label">Nom du scan :</span>
                        <span className="stat-value">{result.scanName}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="error-message">{result.message}</p>
                )}

                {result.success && result.scanName && (
                  <button
                    onClick={() => navigate(`/xml-report/${result.scanName}`)}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    📊 Voir le rapport
                  </button>
                )}
              </div>
            )}

            {uploading && (
              <div className="progress-indicator" style={{ marginTop: '1.5rem' }}>
                <div className="spinner"></div>
                <p>Traitement en cours...</p>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}

export default OpenVASUpload;
