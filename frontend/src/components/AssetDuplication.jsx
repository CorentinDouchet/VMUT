import React, { useState } from 'react';
import { assetService } from '../services/assetService';

/**
 * Modal de duplication d'asset
 * STB_REQ_0140: Versioning et duplication d'assets
 */
const AssetDuplication = ({ asset, onClose, onSuccess }) => {
  const [newName, setNewName] = useState(`${asset.name}_copie`);
  const [newDescription, setNewDescription] = useState(asset.description || '');
  const [copyVulnerabilities, setCopyVulnerabilities] = useState(true);
  const [copyJustifications, setCopyJustifications] = useState(true);
  const [copyAttachments, setCopyAttachments] = useState(false);
  const [createAsVersion, setCreateAsVersion] = useState(true);
  const [copyGroup, setCopyGroup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDuplicate = async () => {
    if (!newName || newName.trim() === '') {
      setError('Le nom du nouvel asset est requis');
      return;
    }

    if (newName === asset.name) {
      setError('Le nom doit être différent de l\'asset original');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const request = {
        newName: newName.trim(),
        newDescription: newDescription.trim(),
        copyVulnerabilities,
        copyJustifications: copyVulnerabilities && copyJustifications,
        copyAttachments: copyVulnerabilities && copyJustifications && copyAttachments,
        createAsVersion,
        copyGroup
      };

      const result = await assetService.duplicate(asset.id, request);

      alert(`✅ ${result.summary}\n\n` +
            `📦 Asset: ${result.newAssetName}\n` +
            `🔢 Vulnérabilités: ${result.copiedVulnerabilities}\n` +
            `📝 Justifications: ${result.copiedJustifications}\n` +
            `📎 Pièces jointes: ${result.copiedAttachments}\n` +
            `${result.isVersion ? '🔄 Créé comme nouvelle version' : '📋 Créé comme copie indépendante'}`
      );

      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      console.error('Erreur lors de la duplication:', err);
      setError(err.response?.data?.message || 'Erreur lors de la duplication de l\'asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">📋 Dupliquer un asset</h2>
              <p className="text-sm text-slate-600 mt-1">
                Source: <span className="font-semibold text-purple-600">{asset.name}</span>
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Configuration de base */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nom du nouvel asset *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Nom du nouvel asset"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                placeholder="Description du nouvel asset"
              />
            </div>
          </div>

          {/* Options de duplication */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Options de copie</h3>
            <div className="space-y-3">
              {/* Copier vulnérabilités */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={copyVulnerabilities}
                  onChange={(e) => {
                    setCopyVulnerabilities(e.target.checked);
                    if (!e.target.checked) {
                      setCopyJustifications(false);
                      setCopyAttachments(false);
                    }
                  }}
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600">
                    📦 Copier les vulnérabilités
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Copie tous les packages scannés et leurs CVE associées
                  </p>
                </div>
              </label>

              {/* Copier justifications (dépend de copyVulnerabilities) */}
              <label className={`flex items-start gap-3 cursor-pointer group ml-6 ${!copyVulnerabilities ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={copyJustifications}
                  onChange={(e) => {
                    setCopyJustifications(e.target.checked);
                    if (!e.target.checked) {
                      setCopyAttachments(false);
                    }
                  }}
                  disabled={!copyVulnerabilities}
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600">
                    📝 Copier les justifications
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Copie les commentaires analyste, validateur et les scores ajustés
                  </p>
                </div>
              </label>

              {/* Copier pièces jointes (dépend de copyJustifications) */}
              <label className={`flex items-start gap-3 cursor-pointer group ml-12 ${!copyJustifications ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={copyAttachments}
                  onChange={(e) => setCopyAttachments(e.target.checked)}
                  disabled={!copyJustifications}
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600">
                    📎 Copier les pièces jointes
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Copie les fichiers PDF, images et documents attachés
                  </p>
                </div>
              </label>

              {/* Versioning */}
              <div className="border-t border-slate-200 my-3"></div>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={createAsVersion}
                  onChange={(e) => setCreateAsVersion(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600">
                    🔄 Créer comme nouvelle version
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Lie le nouvel asset à l'original (traçabilité de l'évolution)
                  </p>
                </div>
              </label>

              {/* Copier groupe */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={copyGroup}
                  onChange={(e) => setCopyGroup(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-purple-600">
                    👥 Conserver le même groupe
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Assigne le nouvel asset au même groupe que l'original
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Info box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">À propos du versioning</p>
                <p className="text-xs text-blue-700 mt-1">
                  Le versioning permet de tracer l'évolution d'un asset dans le temps. 
                  Un lien vers l'asset original sera conservé, et un numéro de version sera automatiquement incrémenté.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              onClick={handleDuplicate}
              disabled={loading || !newName}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Duplication en cours...</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Dupliquer l'asset</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetDuplication;
