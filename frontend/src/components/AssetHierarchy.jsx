import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService } from '../services/assetService';
import { usePermissions } from './RoleBasedAccess';

/**
 * Composant pour visualiser la hiérarchie d'assets
 * STB_REQ_0130: Hiérarchie de sous-assets
 */
const AssetHierarchy = () => {
  const [hierarchies, setHierarchies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [parentAsset, setParentAsset] = useState(null);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedSubAsset, setSelectedSubAsset] = useState(null);
  const navigate = useNavigate();
  const { canEdit, canAdmin } = usePermissions();

  useEffect(() => {
    loadHierarchies();
  }, []);

  const loadHierarchies = async () => {
    try {
      setLoading(true);
      const data = await assetService.getAllHierarchies();
      setHierarchies(data);
      
      // Expand root nodes by default
      const rootIds = new Set(data.map(h => h.id));
      setExpandedNodes(rootIds);
    } catch (error) {
      console.error('Erreur lors du chargement des hiérarchies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAssets = async (parentId) => {
    try {
      const all = await assetService.getAll();
      // Filter out the parent and its descendants
      const hierarchy = await assetService.getHierarchy(parentId);
      const excludedIds = new Set([parentId, ...getDescendantIds(hierarchy)]);
      
      const available = all.filter(asset => !excludedIds.has(asset.id));
      setAvailableAssets(available);
    } catch (error) {
      console.error('Erreur lors du chargement des assets:', error);
    }
  };

  const getDescendantIds = (node) => {
    let ids = [];
    if (node.subAssets && node.subAssets.length > 0) {
      for (const sub of node.subAssets) {
        ids.push(sub.id);
        ids = ids.concat(getDescendantIds(sub));
      }
    }
    return ids;
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleOpenAssignModal = async (asset, e) => {
    e.stopPropagation();
    setParentAsset(asset);
    await loadAvailableAssets(asset.id);
    setShowAssignModal(true);
  };

  const handleAssignSubAsset = async () => {
    if (!selectedSubAsset) return;

    try {
      await assetService.assignSubAsset(parentAsset.id, selectedSubAsset);
      alert(`✅ Asset assigné comme sous-asset de ${parentAsset.name}`);
      setShowAssignModal(false);
      setParentAsset(null);
      setSelectedSubAsset(null);
      loadHierarchies();
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveSubAsset = async (parentId, subAssetId, subAssetName, e) => {
    e.stopPropagation();
    
    if (!confirm(`Retirer "${subAssetName}" des sous-assets ?`)) return;

    try {
      await assetService.removeSubAsset(parentId, subAssetId);
      alert('✅ Sous-asset retiré avec succès');
      loadHierarchies();
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      alert('❌ Erreur lors du retrait du sous-asset');
    }
  };

  const renderAssetNode = (asset) => {
    const isExpanded = expandedNodes.has(asset.id);
    const hasChildren = asset.subAssets && asset.subAssets.length > 0;
    const indent = asset.depth * 24;

    return (
      <div key={asset.id} className="border-b border-slate-100">
        <div
          className="flex items-center gap-3 py-3 px-4 hover:bg-slate-50 cursor-pointer transition-colors"
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(asset.id);
              }}
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <div className="w-6"></div>}

          {/* Asset icon */}
          <div className="text-2xl">
            {asset.depth === 0 ? '🏢' : '📦'}
          </div>

          {/* Asset info */}
          <div
            className="flex-1 flex items-center gap-3"
            onClick={() => navigate(`/assets/${asset.name}`)}
          >
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{asset.name}</div>
              {asset.description && (
                <div className="text-xs text-slate-500">{asset.description}</div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              {asset.type && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {asset.type}
                </span>
              )}
              {asset.environment && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  {asset.environment}
                </span>
              )}
              {asset.totalSubAssets > 0 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  {asset.totalSubAssets} sous-asset{asset.totalSubAssets > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {(canEdit || canAdmin) && (
            <div className="flex gap-2">
              <button
                onClick={(e) => handleOpenAssignModal(asset, e)}
                className="px-3 py-1 text-xs border border-indigo-300 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                title="Assigner un sous-asset"
              >
                ➕ Sous-asset
              </button>
              {asset.parentAssetId && (
                <button
                  onClick={(e) => handleRemoveSubAsset(asset.parentAssetId, asset.id, asset.name, e)}
                  className="px-3 py-1 text-xs border border-red-300 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors"
                  title="Retirer de son parent"
                >
                  🔓 Détacher
                </button>
              )}
            </div>
          )}
        </div>

        {/* Render children recursively */}
        {hasChildren && isExpanded && (
          <div>
            {asset.subAssets.map(subAsset => renderAssetNode(subAsset))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500">
        Chargement des hiérarchies...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Hiérarchie des Assets</h1>
        <p className="text-slate-600">
          Visualisez et gérez les relations parent-enfant entre assets
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-slate-900">{hierarchies.length}</div>
          <div className="text-sm text-slate-600">Assets racines</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-slate-900">
            {hierarchies.reduce((sum, h) => sum + h.totalSubAssets, 0)}
          </div>
          <div className="text-sm text-slate-600">Total sous-assets</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-slate-900">
            {Math.max(0, ...hierarchies.map(h => getMaxDepth(h)))}
          </div>
          <div className="text-sm text-slate-600">Profondeur maximale</div>
        </div>
      </div>

      {/* Hierarchy tree */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
          Arborescence des assets
        </div>
        {hierarchies.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun asset trouvé
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {hierarchies.map(hierarchy => renderAssetNode(hierarchy))}
          </div>
        )}
      </div>

      {/* Modal d'assignation */}
      {showAssignModal && parentAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Assigner un sous-asset</h2>
              <p className="text-sm text-slate-600 mt-1">
                Parent: <span className="font-semibold">{parentAsset.name}</span>
              </p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sélectionner un asset
              </label>
              <select
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={selectedSubAsset || ''}
                onChange={(e) => setSelectedSubAsset(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">-- Choisir un asset --</option>
                {availableAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.type})
                  </option>
                ))}
              </select>

              {availableAssets.length === 0 && (
                <p className="mt-2 text-sm text-amber-600">
                  ⚠️ Aucun asset disponible (tous les assets sont déjà dans cette hiérarchie)
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setParentAsset(null);
                  setSelectedSubAsset(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignSubAsset}
                disabled={!selectedSubAsset}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get max depth
const getMaxDepth = (node) => {
  if (!node.subAssets || node.subAssets.length === 0) {
    return node.depth;
  }
  return Math.max(node.depth, ...node.subAssets.map(getMaxDepth));
};

export default AssetHierarchy;
