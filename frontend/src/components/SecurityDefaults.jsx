import React, { useState, useEffect } from 'react';
import securityDefaultsService from '../services/securityDefaultsService';

const SecurityDefaults = () => {
  const [defaults, setDefaults] = useState([]);
  const [filteredDefaults, setFilteredDefaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadDefaults();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, severityFilter, statusFilter, defaults]);

  const loadDefaults = async () => {
    try {
      setLoading(true);
      const data = await securityDefaultsService.getAllDefaults();
      setDefaults(data);
      setFilteredDefaults(data);
    } catch (error) {
      console.error('Erreur lors du chargement des défauts de sécurité:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...defaults];

    if (searchTerm) {
      filtered = filtered.filter(
        item =>
          item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter) {
      filtered = filtered.filter(item => item.severity === severityFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredDefaults(filtered);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSeverityFilter('');
    setStatusFilter('');
  };

  const getSeverityBadgeClass = (severity) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (severity?.toLowerCase()) {
      case 'critique':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      case 'élevée':
      case 'elevee':
        return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-200`;
      case 'moyenne':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      case 'faible':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
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
        <div className="header-content">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">📚 Encyclopédie des défauts de sécurité</h1>
          <p className="text-slate-500">Base de connaissances des vulnérabilités et défauts de sécurité</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">🔍 Rechercher</label>
            <input
              type="text"
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Filtrer les résultats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Sévérité</label>
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="">Toutes</option>
              <option value="CRITIQUE">Critique</option>
              <option value="ÉLEVÉE">Élevée</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="FAIBLE">Faible</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Statut</label>
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="ACTIVE">Active</option>
              <option value="PATCHED">Corrigée</option>
              <option value="WONT_FIX">Ne sera pas corrigée</option>
            </select>
          </div>

          <button 
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors" 
            onClick={resetFilters}
          >
            🔄 Réinitialiser
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Référence</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sévérité</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actifs</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mis à jour le</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDefaults.length === 0 ? (
                <tr key="no-data">
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Aucun défaut de sécurité trouvé
                  </td>
                </tr>
              ) : (
                filteredDefaults.map((item) => (
                  <tr key={item.id || item.reference} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-blue-600">
                        <span className="hover:underline cursor-pointer">{item.reference}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-medium">
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getSeverityBadgeClass(item.severity)}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {item.affectedAssets || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{item.lastUpdate}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Voir les détails">
                          🔍
                        </button>
                        <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors" title="Plus d'informations">
                          ℹ️
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
            {filteredDefaults.length} défaut{filteredDefaults.length > 1 ? 's' : ''} affiché{filteredDefaults.length > 1 ? 's' : ''}
            {defaults.length !== filteredDefaults.length && ` sur ${defaults.length}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityDefaults;
