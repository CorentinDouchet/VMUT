import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Plus, Search, Trash2, Edit, TrendingUp, Package, Database, Target } from 'lucide-react';
import api from '../services/api';

const CpeMapping = () => {
  const [mappings, setMappings] = useState([]);
  const [unmappedPackages, setUnmappedPackages] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [activeTab, setActiveTab] = useState('mappings'); // mappings, unmapped, statistics
  
  const [formData, setFormData] = useState({
    packageName: '',
    packageVersion: '',
    cpeUri: '',
    vendor: '',
    product: '',
    confidenceLevel: 'HIGH',
    notes: ''
  });

  const API_BASE = '/api/cpe-mappings';

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'mappings') {
        await loadMappings();
      } else if (activeTab === 'unmapped') {
        await loadUnmappedPackages();
      } else if (activeTab === 'statistics') {
        await loadStatistics();
      }
    } catch (err) {
      setError(err.message);
      // Réinitialiser les données en cas d'erreur
      if (activeTab === 'mappings') {
        setMappings([]);
      } else if (activeTab === 'unmapped') {
        setUnmappedPackages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMappings = async () => {
    const response = await api.get('/cpe-mappings');
    setMappings(response);
  };

  const loadUnmappedPackages = async () => {
    const response = await api.get('/cpe-mappings/unmapped');
    setUnmappedPackages(response.unmappedPackages || []);
  };

  const loadStatistics = async () => {
    const response = await api.get('/cpe-mappings/statistics');
    setStatistics(response);
  };

  const searchMappings = async () => {
    if (!searchTerm.trim()) {
      await loadMappings();
      return;
    }
    const response = await api.get(`/cpe-mappings/search?query=${encodeURIComponent(searchTerm)}`);
    setMappings(response);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMapping) {
        await api.put(`/cpe-mappings/${editingMapping.id}`, formData);
      } else {
        await api.post('/cpe-mappings', formData);
      }
      
      setShowCreateForm(false);
      setEditingMapping(null);
      resetForm();
      await loadMappings();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (mapping) => {
    setEditingMapping(mapping);
    setFormData({
      packageName: mapping.packageName,
      packageVersion: mapping.packageVersion || '',
      cpeUri: mapping.cpeUri,
      vendor: mapping.vendor,
      product: mapping.product,
      confidenceLevel: mapping.confidenceLevel,
      notes: mapping.notes || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mapping ?')) return;
    
    try {
      await api.delete(`/cpe-mappings/${id}`);
      await loadMappings();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      packageName: '',
      packageVersion: '',
      cpeUri: '',
      vendor: '',
      product: '',
      confidenceLevel: 'HIGH',
      notes: ''
    });
  };

  const createMappingFromUnmapped = (pkg) => {
    setFormData({
      ...formData,
      packageName: pkg.packageName,
      packageVersion: pkg.packageVersion || ''
    });
    setActiveTab('mappings');
    setShowCreateForm(true);
  };

  const getConfidenceBadge = (level) => {
    const colors = {
      HIGH: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-orange-100 text-orange-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const renderMappingsTab = () => (
    <div className="space-y-4">
      {/* Search and Create */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un mapping (nom de package, CPE, vendor...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMappings()}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={searchMappings}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Rechercher
        </button>
        <button
          onClick={() => {
            resetForm();
            setEditingMapping(null);
            setShowCreateForm(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau Mapping
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white border-2 border-blue-500 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingMapping ? 'Modifier le Mapping' : 'Créer un Nouveau Mapping'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Package *
                </label>
                <input
                  type="text"
                  required
                  value={formData.packageName}
                  onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: spring-boot"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.packageVersion}
                  onChange={(e) => setFormData({ ...formData, packageVersion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: 2.7.0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPE URI *
              </label>
              <input
                type="text"
                required
                value={formData.cpeUri}
                onChange={(e) => setFormData({ ...formData, cpeUri: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="cpe:2.3:a:vendor:product:version:*:*:*:*:*:*:*"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: cpe:2.3:a:vendor:product:version:*:*:*:*:*:*:*
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: pivotal_software"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <input
                  type="text"
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: spring_boot"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau de Confiance *
              </label>
              <select
                value={formData.confidenceLevel}
                onChange={(e) => setFormData({ ...formData, confidenceLevel: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="HIGH">Haute - Mapping vérifié et testé</option>
                <option value="MEDIUM">Moyenne - Mapping probable</option>
                <option value="LOW">Faible - Mapping à valider</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Notes supplémentaires sur ce mapping..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingMapping(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingMapping ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mappings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confiance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mappings.map((mapping) => (
              <tr key={mapping.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-gray-900">{mapping.packageName}</div>
                    {mapping.packageVersion && (
                      <div className="text-sm text-gray-500">v{mapping.packageVersion}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-mono text-gray-900">{mapping.cpeUri}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {mapping.vendor} / {mapping.product}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getConfidenceBadge(mapping.confidenceLevel)}`}>
                    {mapping.confidenceLevel}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {mapping.usageCount || 0}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(mapping)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(mapping.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mappings.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun mapping trouvé
          </div>
        )}
      </div>
    </div>
  );

  const renderUnmappedTab = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Packages Non Mappés</h3>
            <p className="text-sm text-blue-700 mt-1">
              Ces packages n'ont pas de mapping CPE manuel et pourraient bénéficier d'une corrélation améliorée.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.isArray(unmappedPackages) && unmappedPackages.map((pkg, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {pkg.packageName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {pkg.packageVersion || 'N/A'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {pkg.scanName}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => createMappingFromUnmapped(pkg)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Créer Mapping
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {unmappedPackages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p>Tous les packages ont un mapping !</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStatisticsTab = () => {
    if (!statistics) return null;

    return (
      <div className="space-y-6">
        {/* Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mappings</p>
                <p className="text-3xl font-bold text-gray-900">{statistics.totalMappings}</p>
              </div>
              <Database className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mappings Actifs</p>
                <p className="text-3xl font-bold text-green-600">{statistics.activeMappings}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisations</p>
                <p className="text-3xl font-bold text-purple-600">{statistics.totalUsageCount}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Non Mappés</p>
                <p className="text-3xl font-bold text-orange-600">{statistics.unmappedPackages}</p>
              </div>
              <Package className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution par Niveau de Confiance</h3>
          <div className="space-y-3">
            {statistics.mappingsByConfidence && Array.isArray(statistics.mappingsByConfidence) && 
             statistics.mappingsByConfidence.map((item) => {
              const total = statistics.totalMappings;
              const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
              const colors = {
                HIGH: 'bg-green-500',
                MEDIUM: 'bg-yellow-500',
                LOW: 'bg-orange-500'
              };
              
              return (
                <div key={item.confidenceLevel}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.confidenceLevel}</span>
                    <span className="text-gray-600">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${colors[item.confidenceLevel]} h-2 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Used Mappings */}
        {statistics.mostUsedMappings && statistics.mostUsedMappings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Mappings les Plus Utilisés</h3>
            <div className="space-y-2">
              {statistics.mostUsedMappings.map((mapping, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{mapping.packageName}</span>
                    {mapping.packageVersion && (
                      <span className="text-sm text-gray-500 ml-2">v{mapping.packageVersion}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-blue-600">
                    {mapping.usageCount} utilisations
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mapping CPE Manuel</h1>
        <p className="text-gray-600">
          Gérez les correspondances manuelles entre les packages et les identifiants CPE pour améliorer la corrélation CVE
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Erreur</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('mappings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mappings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Mappings
            </div>
          </button>
          <button
            onClick={() => setActiveTab('unmapped')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'unmapped'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Non Mappés
              {unmappedPackages.length > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {unmappedPackages.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistiques
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'mappings' && renderMappingsTab()}
      {activeTab === 'unmapped' && renderUnmappedTab()}
      {activeTab === 'statistics' && renderStatisticsTab()}
    </div>
  );
};

export default CpeMapping;
