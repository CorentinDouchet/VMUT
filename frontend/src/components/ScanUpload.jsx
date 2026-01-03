import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import scanService from '../services/scanService';
import logger from '../utils/logger';

function ScanUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [runMatching, setRunMatching] = useState(true);
  const [results, setResults] = useState(null);
  const [searchParams] = useSearchParams();
  const assetName = searchParams.get('assetName'); // Récupérer le nom de l'asset depuis l'URL

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);
    setResults(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('scanFiles', file);
    });
    formData.append('runMatching', runMatching); // ← Nouveau
    
    // Ajouter le nom de l'asset si disponible
    if (assetName) {
      formData.append('relatedAssetName', assetName);
    }

    try {
      const data = await scanService.uploadMultiple(formData);
      setResults(data);
      
      if (response.ok) {
        const message = runMatching 
          ? `✅ ${data.message} - ${data.totalCVEs || 0} CVE trouvées`
          : `✅ ${data.message}`;
        alert(message);
        
        // Log détaillé des résultats
        console.log('📊 Résultats complets:', data);
        if (data.results && data.results.length > 0) {
          data.results.forEach(r => {
            console.log(`  - ${r.fileName}: ${r.imported} packages importés`);
            if (r.matching) {
              console.log(`    → ${r.matching.totalCVEs || 0} CVE trouvées`);
              if (r.matching.error) {
                console.error(`    ⚠️ Erreur matching: ${r.matching.error}`);
              }
            }
          });
        }
        
        setFiles([]);
      } else {
        alert(`❌ Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📤 Import de Scans</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Sélectionner des fichiers .txt (format Cyberwatch) :
        </label>
        <input
          type="file"
          multiple
          accept=".txt"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ marginBottom: '10px' }}
        />
        {files.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>{files.length} fichier(s) sélectionné(s):</strong>
            <ul>
              {Array.from(files).map((file, idx) => (
                <li key={idx}>{file.name} ({(file.size / 1024).toFixed(2)} KB)</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={runMatching}
            onChange={(e) => setRunMatching(e.target.checked)}
            disabled={uploading}
          />
          {' '}Lancer le matching CVE automatiquement
        </label>
      </div>

      <button 
        onClick={handleUpload}
        disabled={uploading || files.length === 0}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: uploading ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: uploading || files.length === 0 ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {uploading ? '⏳ Upload en cours...' : '📤 Uploader les scans'}
      </button>

      {results && results.results && (
        <div className="results-section" style={{ marginTop: '30px' }}>
          <h3>📊 Résultats de l'import</h3>
          
          {results.message && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '20px',
              backgroundColor: '#e7f3ff',
              borderLeft: '4px solid #2196F3',
              borderRadius: '4px'
            }}>
              <strong>{results.message}</strong>
              {results.totalCVEs !== undefined && (
                <div style={{ marginTop: '5px' }}>
                  🔍 Total CVE trouvées : <strong>{results.totalCVEs}</strong>
                </div>
              )}
            </div>
          )}
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Fichier</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Statut</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Nom du scan</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Packages importés</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>CVE trouvées</th>
              </tr>
            </thead>
            <tbody>
              {results.results.map((result, idx) => (
                <tr key={idx} style={{ backgroundColor: result.success ? '#f9fff9' : '#fff5f5' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {result.fileName || 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {result.success ? '✅ Succès' : '❌ Échec'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {result.scanName || 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {result.imported !== undefined ? result.imported : '-'}
                    {result.total && ` / ${result.total}`}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {result.matching && result.matching.totalCVEs !== undefined 
                      ? result.matching.totalCVEs 
                      : '-'}
                    {result.matching && result.matching.error && (
                      <div style={{ color: '#d32f2f', fontSize: '0.85em', marginTop: '5px' }}>
                        ⚠️ {result.matching.error}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ScanUpload;