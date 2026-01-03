import React, { useState, useEffect } from 'react';
import justificationService from '../services/justificationService';
import { assetService } from '../services/assetService';

/**
 * Modal de réutilisation des justifications entre actifs
 * STB_REQ_0150
 */
const JustificationReuse = ({ targetAsset, onClose, onSuccess }) => {
  const [sourceAssets, setSourceAssets] = useState([]);
  const [selectedSourceAsset, setSelectedSourceAsset] = useState(null);
  const [availableJustifications, setAvailableJustifications] = useState([]);
  const [selectedCves, setSelectedCves] = useState([]);
  const [copyAttachments, setCopyAttachments] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingJustifications, setLoadingJustifications] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadSourceAssets();
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (selectedSourceAsset) {
      loadJustifications();
    }
  }, [selectedSourceAsset]);

  const loadSourceAssets = async () => {
    try {
      const data = await assetService.getAll();
      // Exclure l'actif cible de la liste
      const filtered = data.filter(asset => asset.id !== targetAsset.id);
      setSourceAssets(filtered);
    } catch (error) {
      console.error('Erreur lors du chargement des actifs:', error);
    }
  };

  const loadJustifications = async () => {
    if (!selectedSourceAsset) return;
    
    try {
      setLoadingJustifications(true);
      const data = await justificationService.getJustificationsByAsset(selectedSourceAsset.id);
      setAvailableJustifications(data);
    } catch (error) {
      console.error('Erreur lors du chargement des justifications:', error);
    } finally {
      setLoadingJustifications(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const data = await justificationService.suggestJustifications(targetAsset.id);
      setSuggestions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedCves.length === availableJustifications.length) {
      setSelectedCves([]);
    } else {
      setSelectedCves(availableJustifications.map(j => j.cveId));
    }
  };

  const handleToggleCve = (cveId) => {
    setSelectedCves(prev => 
      prev.includes(cveId) 
        ? prev.filter(id => id !== cveId)
        : [...prev, cveId]
    );
  };

  const handleCopy = async () => {
    if (!selectedSourceAsset || selectedCves.length === 0) {
      alert('Veuillez sélectionner un actif source et au moins une CVE');
      return;
    }

    try {
      setLoading(true);
      const request = {
        sourceAssetId: selectedSourceAsset.id,
        targetAssetId: targetAsset.id,
        cveIds: selectedCves,
        copyAttachments,
        overwriteExisting
      };

      const result = await justificationService.copyJustifications(request);
      
      alert(`✅ Copie terminée:\n• ${result.copiedCount} justifications copiées\n• ${result.skippedCount} ignorées\n• ${result.errorCount} erreurs`);
      
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      alert('❌ Erreur lors de la copie des justifications');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#f59e0b',
      LOW: '#84cc16'
    };
    return colors[severity?.toUpperCase()] || '#64748b';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">🔄 Réutiliser des justifications</h2>
              <p className="text-sm text-slate-600 mt-1">
                Actif cible: <span className="font-semibold text-blue-600">{targetAsset.name}</span>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="flex items-center gap-2 text-blue-700 font-medium"
              >
                💡 {suggestions.length} CVE avec justifications disponibles
                <span className="text-xs">{showSuggestions ? '▼' : '▶'}</span>
              </button>
              
              {showSuggestions && (
                <div className="mt-3 space-y-2">
                  {suggestions.map(sugg => (
                    <div key={sugg.cveId} className="bg-white p-3 rounded border border-blue-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-semibold text-blue-600">{sugg.cveId}</span>
                          <p className="text-xs text-slate-600 mt-1">{sugg.previewComment}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {sugg.availableJustificationCount} disponible(s)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Dernière: {sugg.mostRecentAssetName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sélection actif source */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              1️⃣ Sélectionner l'actif source
            </label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={selectedSourceAsset?.id || ''}
              onChange={(e) => {
                const asset = sourceAssets.find(a => a.id === parseInt(e.target.value));
                setSelectedSourceAsset(asset);
                setSelectedCves([]);
              }}
            >
              <option value="">-- Choisir un actif --</option>
              {sourceAssets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.type})
                </option>
              ))}
            </select>
          </div>

          {/* Liste des justifications */}
          {selectedSourceAsset && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  2️⃣ Sélectionner les justifications à copier
                </label>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedCves.length === availableJustifications.length ? '❌ Tout désélectionner' : '✅ Tout sélectionner'}
                </button>
              </div>

              {loadingJustifications ? (
                <div className="text-center py-8 text-slate-500">
                  Chargement des justifications...
                </div>
              ) : availableJustifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                  Aucune justification disponible sur cet actif
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left w-10"></th>
                        <th className="px-4 py-2 text-left">CVE</th>
                        <th className="px-4 py-2 text-left">Package</th>
                        <th className="px-4 py-2 text-left">Sévérité</th>
                        <th className="px-4 py-2 text-left">Justification</th>
                        <th className="px-4 py-2 text-left">📎</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {availableJustifications.map(just => (
                        <tr key={just.vulnerabilityId} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedCves.includes(just.cveId)}
                              onChange={() => handleToggleCve(just.cveId)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-medium text-blue-600">{just.cveId}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {just.packageName}
                            <span className="text-xs text-slate-500 ml-1">v{just.packageVersion}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getSeverityColor(just.baseSeverity) }}
                            >
                              {just.baseSeverity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className="text-xs text-slate-600 block truncate max-w-md"
                              title={just.commentsAnalyst}
                            >
                              {just.commentsAnalyst?.substring(0, 100)}{just.commentsAnalyst?.length > 100 ? '...' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {just.attachments?.length > 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {just.attachments.length}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Options */}
          {selectedSourceAsset && availableJustifications.length > 0 && (
            <div className="mt-6 space-y-3 bg-slate-50 p-4 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyAttachments}
                  onChange={(e) => setCopyAttachments(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  📎 Copier également les pièces jointes
                </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  ♻️ Écraser les justifications existantes
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {selectedCves.length > 0 && (
                <span className="font-medium text-blue-600">
                  {selectedCves.length} CVE sélectionnée{selectedCves.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCopy}
                disabled={loading || !selectedSourceAsset || selectedCves.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Copie en cours...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Copier les justifications</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JustificationReuse;
