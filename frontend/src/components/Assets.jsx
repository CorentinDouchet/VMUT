import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import assetService from '../services/assetService';
import groupService from '../services/groupService';
import GroupSelector from './GroupSelector';
import JustificationReuse from './JustificationReuse';
import AssetDuplication from './AssetDuplication';
import { usePermissions } from './RoleBasedAccess';

function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', description: '' });
  const [stats, setStats] = useState(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState(null);
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false);
  const [assetToAssign, setAssetToAssign] = useState(null);
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [targetAsset, setTargetAsset] = useState(null);
  const [showDuplicationModal, setShowDuplicationModal] = useState(false);
  const [assetToDuplicate, setAssetToDuplicate] = useState(null);
  const navigate = useNavigate();
  const { canEdit, canAdmin } = usePermissions();

  useEffect(() => {
    fetchAssets();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await assetService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await assetService.getAll();
      setAssets(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await assetService.create(newAsset);
      setShowCreateModal(false);
      setNewAsset({ name: '', description: '' });
      fetchAssets();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de l\'asset');
    }
  };

  const handleDeleteAsset = async (id, name, e) => {
    e.stopPropagation();
    if (!confirm(`Voulez-vous vraiment supprimer l'asset "${name}" ?`)) return;
    try {
      await assetService.delete(id);
      fetchAssets();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression de l\'asset');
    }
  };

  const handleOpenJustificationModal = (asset, e) => {
    e.stopPropagation();
    setTargetAsset(asset);
    setShowJustificationModal(true);
  };

  const handleJustificationSuccess = () => {
    fetchAssets();
  };
  
  const handleOpenDuplicationModal = (asset, e) => {
    e.stopPropagation();
    setAssetToDuplicate(asset);
    setShowDuplicationModal(true);
  };
  
  const handleDuplicationSuccess = () => {
    fetchAssets();
  };

  const handleAssetClick = (asset) => {
    navigate(`/assets/${asset.name}`);
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  // Calculer les statistiques basées sur les assets
  const osStats = assets.reduce((acc, asset) => {
    const os = asset.osName || 'Inconnu';
    if (!acc[os]) {
      acc[os] = {
        name: os,
        version: asset.osVersion || '',
        count: 0
      };
    }
    acc[os].count++;
    return acc;
  }, {});

  const osArray = Object.values(osStats);

  // Filtrer les assets par groupe
  const filteredAssets = selectedGroupFilter === 'all' || !selectedGroupFilter
    ? assets
    : assets.filter(asset => asset.assetGroup?.id === selectedGroupFilter);

  const handleAssignGroup = async (assetId, groupId) => {
    try {
      await groupService.assignAsset(groupId, assetId);
      fetchAssets();
      setShowAssignGroupModal(false);
      setAssetToAssign(null);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'assignation du groupe');
    }
  };

  const openAssignGroupModal = (asset, e) => {
    e.stopPropagation();
    setAssetToAssign(asset);
    setShowAssignGroupModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span className="flex items-center gap-2 transition-colors hover:text-blue-600 cursor-pointer">Actifs</span>
        <span className="text-slate-400">›</span>
        <span className="flex items-center gap-2 transition-colors hover:text-blue-600 cursor-pointer font-medium text-slate-700">Assets</span>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight m-0">Gestion des Assets</h1>
            <p className="text-slate-500 text-[15px] mt-1">
              Créez et gérez vos assets pour y associer des scans
            </p>
          </div>
        </div>
      </div>

      {/* Mini Tables Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Catégorie */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
          <h3 className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 border-b border-slate-200 m-0">Catégorie</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="py-3 px-4 text-sm font-medium text-slate-500 flex items-center gap-2">Assets manuels</td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right">{assets.length}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Système d'exploitation */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
          <h3 className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 border-b border-slate-200 m-0">Système d'exploitation</h3>
          <table className="w-full border-collapse">
            <tbody>
              {osArray.slice(0, 3).map((os, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4 text-sm font-medium text-slate-500 flex items-center gap-2">{os.name}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right">{os.count}</td>
                </tr>
              ))}
              {osArray.length === 0 && (
                <tr>
                  <td className="py-3 px-4 text-sm font-medium text-slate-500 flex items-center gap-2">Aucun OS détecté</td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right">0</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Criticité */}
        {stats && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
            <h3 className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 border-b border-slate-200 m-0">Criticité</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4 text-sm font-medium text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block bg-red-600"></span>
                    Critique
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right">{stats.criticalCount || 0}</td>
                </tr>
                <tr className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4 text-sm font-medium text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block bg-orange-500"></span>
                    Élevée
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right">{stats.highCount || 0}</td>
                </tr>
                <tr className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4 text-sm font-medium text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block bg-yellow-500"></span>
                    Moyenne
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right">{stats.mediumCount || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Type */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
          <h3 className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 border-b border-slate-200 m-0">Type</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="py-3 px-4 text-sm font-medium text-slate-500 flex items-center gap-2">MANUAL</td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right">{assets.filter(a => a.type === 'MANUAL').length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 m-0">Liste des Assets</h3>
          <div className="flex gap-3 items-center">
            <div style={{ width: '250px', marginRight: '15px' }}>
              <GroupSelector 
                value={selectedGroupFilter}
                onChange={(groupId) => setSelectedGroupFilter(groupId)}
                placeholder="Filtrer par groupe"
                includeAll={true}
              />
            </div>
            <span className="text-sm text-slate-500 font-medium">
              {filteredAssets.length} asset{filteredAssets.length > 1 ? 's' : ''}
            </span>
            <button className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500" onClick={() => setShowCreateModal(true)}>
              <span>➕</span> Créer un Asset
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 bg-slate-50 whitespace-nowrap">Nom</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 bg-slate-50 whitespace-nowrap">Groupe</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 bg-slate-50 whitespace-nowrap">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 bg-slate-50 whitespace-nowrap">Hostname</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 bg-slate-50 whitespace-nowrap">Système d'exploitation</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 bg-slate-50 whitespace-nowrap">Version</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 bg-slate-50 whitespace-nowrap">Date de création</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-500 border-b-2 border-slate-200 bg-slate-50 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500 italic">
                    Aucun asset trouvé. Créez votre premier asset.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr 
                    key={asset.id} 
                    className="border-b border-slate-200 transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleAssetClick(asset)}
                  >
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-medium text-slate-900 truncate block max-w-[200px]" title={asset.name}>{asset.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {asset.assetGroup?.name || 'Non classé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-mono text-xs text-slate-500 truncate block max-w-[300px]" title={asset.description || '-'}>{asset.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-mono text-xs text-slate-500 truncate block max-w-[150px]" title={asset.hostname || '-'}>{asset.hostname || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {asset.osName || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="text-slate-500 truncate block max-w-[100px]" title={asset.osVersion || '-'}>{asset.osVersion || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="text-slate-500">
                        {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex gap-2">
                        <button 
                          className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssetClick(asset);
                          }}
                        >
                          Gérer
                        </button>
                        {(canEdit || canAdmin) && (
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 border border-slate-300 text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500"
                            onClick={(e) => openAssignGroupModal(asset, e)}
                            title="Assigner au groupe"
                          >
                            Groupe
                          </button>
                        )}
                        {(canEdit || canAdmin) && (
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 border border-emerald-300 text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500"
                            onClick={(e) => handleOpenJustificationModal(asset, e)}
                            title="Réutiliser des justifications"
                          >
                            🔄 Justif.
                          </button>
                        )}
                        {(canEdit || canAdmin) && (
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 border border-purple-300 text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer bg-purple-50 text-purple-700 hover:bg-purple-100 focus:ring-purple-500"
                            onClick={(e) => handleOpenDuplicationModal(asset, e)}
                            title="Dupliquer cet asset"
                          >
                            📋 Dupliquer
                          </button>
                        )}
                        {asset.type === 'MANUAL' && (
                          <button
                            className="inline-flex items-center justify-center px-2.5 py-1.5 border border-slate-300 text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500"
                            onClick={(e) => handleDeleteAsset(asset.id, asset.name, e)}
                            title="Supprimer"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Créer un nouvel Asset</h2>
            <form onSubmit={handleCreateAsset}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'asset *</label>
                <input
                  type="text"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="Ex: Serveur Production, PC-01, etc."
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  placeholder="Description de l'asset (optionnel)"
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignGroupModal && assetToAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowAssignGroupModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Assigner l'asset au groupe</h2>
            <div className="mb-4 text-sm text-slate-600">
              <p className="mb-2">Asset: <strong className="text-slate-900">{assetToAssign.name}</strong></p>
              <p>Groupe actuel: <strong className="text-slate-900">{assetToAssign.assetGroup?.name || 'Non classé'}</strong></p>
            </div>
            <div className="mb-4 mt-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau groupe</label>
              <GroupSelector 
                value={null}
                onChange={(groupId) => {
                  if (groupId) {
                    handleAssignGroup(assetToAssign.id, groupId);
                  }
                }}
                placeholder="Sélectionner un groupe"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setShowAssignGroupModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de réutilisation des justifications */}
      {showJustificationModal && targetAsset && (
        <JustificationReuse
          targetAsset={targetAsset}
          onClose={() => {
            setShowJustificationModal(false);
            setTargetAsset(null);
          }}
          onSuccess={handleJustificationSuccess}
        />
      )}
      
      {/* Modal de duplication d'asset */}
      {showDuplicationModal && assetToDuplicate && (
        <AssetDuplication
          asset={assetToDuplicate}
          onClose={() => {
            setShowDuplicationModal(false);
            setAssetToDuplicate(null);
          }}
          onSuccess={handleDuplicationSuccess}
        />
      )}
    </div>
  );
}

export default Assets;
