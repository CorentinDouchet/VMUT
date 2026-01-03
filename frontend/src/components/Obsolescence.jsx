import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Obsolescence = () => {
  const [technologies, setTechnologies] = useState([]);
  const [filteredTechnologies, setFilteredTechnologies] = useState([]);
  const [detectedVulnerabilities, setDetectedVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVulns, setLoadingVulns] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [obsoleteFilter, setObsoleteFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    technologyName: '',
    versionPattern: '',
    latestVersion: '',
    isObsolete: false,
    endOfSupport: '',
    endOfLife: '',
    replacementRecommendation: '',
    justification: ''
  });

  useEffect(() => {
    loadTechnologies();
    loadDetectedVulnerabilities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, obsoleteFilter, technologies]);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        technologyName: editingItem.technologyName || '',
        versionPattern: editingItem.versionPattern || '',
        latestVersion: editingItem.latestVersion || '',
        isObsolete: editingItem.isObsolete || false,
        endOfSupport: editingItem.endOfSupport || '',
        endOfLife: editingItem.endOfLife || '',
        replacementRecommendation: editingItem.replacementRecommendation || '',
        justification: editingItem.justification || ''
      });
      setShowAddModal(true);
    }
  }, [editingItem]);

  const loadTechnologies = async () => {
    try {
      setLoading(true);
      const data = await api.get('/obsolescence');
      setTechnologies(data);
      setFilteredTechnologies(data);
    } catch (error) {
      console.error('Erreur lors du chargement des technologies obsolètes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDetectedVulnerabilities = async () => {
    try {
      setLoadingVulns(true);
      const data = await api.get('/obsolescence/detected-vulnerabilities');
      setDetectedVulnerabilities(data);
    } catch (error) {
      console.error('Erreur lors du chargement des vulnérabilités obsolètes:', error);
    } finally {
      setLoadingVulns(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...technologies];

    if (searchTerm) {
      filtered = filtered.filter(
        item =>
          item.technologyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.versionPattern?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.justification?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (obsoleteFilter === 'obsolete') {
      filtered = filtered.filter(item => item.isObsolete === true);
    } else if (obsoleteFilter === 'active') {
      filtered = filtered.filter(item => item.isObsolete === false);
    }

    setFilteredTechnologies(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setObsoleteFilter('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;
    try {
      await api.delete(`/obsolescence/${id}`);
      loadTechnologies();
      loadDetectedVulnerabilities();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/obsolescence/${editingItem.id}`, formData);
      } else {
        await api.post('/obsolescence', formData);
      }
      setShowAddModal(false);
      setEditingItem(null);
      setFormData({
        technologyName: '',
        versionPattern: '',
        latestVersion: '',
        isObsolete: false,
        endOfSupport: '',
        endOfLife: '',
        replacementRecommendation: '',
        justification: ''
      });
      loadTechnologies();
      loadDetectedVulnerabilities();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const getObsoleteBadgeClass = (isObsolete) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (isObsolete) {
      return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
    } else {
      return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
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
        <div className="flex justify-between items-center">
          <div className="header-content">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Gestion de l'obsolescence technologique</h1>
            <p className="text-slate-500">Suivi des technologies obsolètes ou en fin de support</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                technologyName: '',
                versionPattern: '',
                latestVersion: '',
                isObsolete: false,
                endOfSupport: '',
                endOfLife: '',
                replacementRecommendation: '',
                justification: ''
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            <span>Ajouter une technologie</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Rechercher</label>
            <input
              type="text"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Filtrer les résultats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Statut d'obsolescence</label>
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              value={obsoleteFilter}
              onChange={(e) => setObsoleteFilter(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="obsolete">Obsolète</option>
              <option value="active">Supporté</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">&nbsp;</label>
            <button 
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors" 
              onClick={resetFilters}
            >
              🔄 Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Technologie</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fin de support</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fin de vie</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommandation</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTechnologies.length === 0 ? (
                <tr key="no-data">
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    Aucune technologie obsolète trouvée
                  </td>
                </tr>
              ) : (
                filteredTechnologies.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-medium">
                        {item.technologyName}
                      </div>
                      {item.justification && (
                        <div className="text-xs text-slate-500 mt-1 max-w-md truncate" title={item.justification}>
                          {item.justification}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {item.versionPattern || 'Toutes'}
                      </span>
                      {item.latestVersion && (
                        <div className="text-xs text-slate-400 mt-1">
                          Dernière: {item.latestVersion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={getObsoleteBadgeClass(item.isObsolete)}>
                        {item.isObsolete ? 'Obsolète' : 'Supporté'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">
                        {formatDate(item.endOfSupport)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">
                        {formatDate(item.endOfLife)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {item.replacementRecommendation || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors" 
                          title="Modifier"
                          onClick={() => setEditingItem(item)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors" 
                          title="Supprimer"
                          onClick={() => handleDelete(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            {filteredTechnologies.length} technologie{filteredTechnologies.length > 1 ? 's' : ''} affichée{filteredTechnologies.length > 1 ? 's' : ''}
            {technologies.length !== filteredTechnologies.length && ` sur ${technologies.length}`}
          </p>
        </div>
      </div>

      {/* Tableau des vulnérabilités obsolètes détectées */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900">🚫 Vulnérabilités obsolètes détectées automatiquement</h2>
          <p className="text-sm text-slate-500 mt-1">
            Liste des vulnérabilités identifiées comme affectant des technologies obsolètes
          </p>
        </div>

        {loadingVulns ? (
          <div className="p-8 text-center text-slate-500">
            <div className="loading">Chargement des vulnérabilités...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CVE</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Package</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sévérité</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Info obsolescence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detectedVulnerabilities.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500">
                        Aucune vulnérabilité obsolète détectée pour le moment
                      </td>
                    </tr>
                  ) : (
                    detectedVulnerabilities.map((vuln) => (
                      <tr key={vuln.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-medium text-blue-600">
                            {vuln.cveId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-900 font-medium">
                            {vuln.packageName}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {vuln.packageVersion}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getSeverityColor(vuln.baseSeverity) }}
                          >
                            {vuln.baseSeverity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {vuln.baseScore}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="text-sm text-slate-600 truncate block max-w-md cursor-help"
                            title={vuln.obsolescenceInfo}
                          >
                            {vuln.obsolescenceInfo || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">
                {detectedVulnerabilities.length} vulnérabilité{detectedVulnerabilities.length > 1 ? 's' : ''} obsolète{detectedVulnerabilities.length > 1 ? 's' : ''} détectée{detectedVulnerabilities.length > 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modal d'ajout/édition */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Modifier' : 'Ajouter'} une technologie
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom de la technologie *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.technologyName}
                    onChange={(e) => setFormData({ ...formData, technologyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pattern de version
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 1.*, 2.0.x"
                    value={formData.versionPattern}
                    onChange={(e) => setFormData({ ...formData, versionPattern: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Dernière version stable
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.latestVersion}
                    onChange={(e) => setFormData({ ...formData, latestVersion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Statut
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.isObsolete}
                    onChange={(e) => setFormData({ ...formData, isObsolete: e.target.value === 'true' })}
                  >
                    <option value="false">Supporté</option>
                    <option value="true">Obsolète</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fin de support
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.endOfSupport}
                    onChange={(e) => setFormData({ ...formData, endOfSupport: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fin de vie
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.endOfLife}
                    onChange={(e) => setFormData({ ...formData, endOfLife: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Recommandation de remplacement
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.replacementRecommendation}
                    onChange={(e) => setFormData({ ...formData, replacementRecommendation: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Justification
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.justification}
                    onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Obsolescence;
