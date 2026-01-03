import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import correctiveActionService from '../services/correctiveActionService';

function ActionsCorrectives() {
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    severity: 'all',
    category: 'all',
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'priority',
    direction: 'desc'
  });

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const data = await correctiveActionService.getAll();
      setActions(data);
    } catch (error) {
      console.error('Erreur chargement actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      'CRITICAL': <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">CRITIQUE</span>,
      'HIGH': <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">ÉLEVÉE</span>,
      'MEDIUM': <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">MOYENNE</span>,
      'LOW': <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lime-100 text-lime-800">FAIBLE</span>,
    };
    return badges[severity] || <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">UNKNOWN</span>;
  };

  const getFilteredAndSortedActions = () => {
    let filtered = [...actions];

    // Filtres
    if (filters.search) {
      filtered = filtered.filter(action =>
        action.technology.toLowerCase().includes(filters.search.toLowerCase()) ||
        action.currentVersion.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.severity !== 'all') {
      filtered = filtered.filter(action => action.maxSeverity === filters.severity);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(action => action.category === filters.category);
    }

    // Tri
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'priority') {
        const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        aVal = priorityOrder[a.maxSeverity] || 0;
        bVal = priorityOrder[b.maxSeverity] || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredActions = getFilteredAndSortedActions();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Chargement des actions correctives...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-200">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">🔧 Actions Correctives</h1>
          <p className="text-sm text-slate-500">
            Mises à jour recommandées pour corriger les vulnérabilités détectées
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col items-center bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-2xl font-bold text-blue-600 mb-1">{actions.length}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Mises à jour disponibles</span>
          </div>
          <div className="flex flex-col items-center bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-2xl font-bold text-blue-600 mb-1">
              {actions.reduce((sum, a) => sum + a.cveCount, 0)}
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">CVE corrigées</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4 mb-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm items-end">
        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <input
            type="text"
            placeholder="🔍 Rechercher technologie ou version..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Criticité :</label>
          <select
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
          >
            <option value="all">Toutes</option>
            <option value="CRITICAL">Critique</option>
            <option value="HIGH">Élevée</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="LOW">Faible</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Catégorie :</label>
          <select
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="all">Toutes</option>
            <option value="OS">Système d'exploitation</option>
            <option value="Application">Application</option>
            <option value="Library">Bibliothèque</option>
            <option value="Framework">Framework</option>
            <option value="System">Système</option>
          </select>
        </div>

        <button 
          className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
          onClick={() => setFilters({ search: '', severity: 'all', category: 'all' })}
        >
          ↺ Réinitialiser
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th onClick={() => handleSort('category')} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Catégorie {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('technology')} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Technologie {sortConfig.key === 'technology' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('currentVersion')} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Version actuelle {sortConfig.key === 'currentVersion' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('targetVersion')} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Version cible {sortConfig.key === 'targetVersion' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Obsolescence</th>
                <th onClick={() => handleSort('priority')} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Criticité {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('cveCount')} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  CVE {sortConfig.key === 'cveCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('affectedAssets')} className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none">
                  Actifs {sortConfig.key === 'affectedAssets' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">État</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-slate-500">
                    Aucune action corrective trouvée
                  </td>
                </tr>
              ) : (
                filteredActions.map((action, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-700">{action.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <strong className="text-sm font-medium text-slate-900">{action.technology}</strong>
                        {action.description && (
                          <small className="text-xs text-slate-500 mt-0.5">{action.description}</small>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                        {action.currentVersion}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 font-mono">
                        {action.targetVersion}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {action.isObsolete ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 w-fit">
                            ⚠️ Obsolète
                          </span>
                          {action.endOfSupport && (
                            <span className="text-xs text-slate-500" title="Fin de support">
                              📅 Support: {action.endOfSupport}
                            </span>
                          )}
                          {action.endOfLife && (
                            <span className="text-xs text-slate-500" title="Fin de vie">
                              ⏰ Fin de vie: {action.endOfLife}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          ✓ Supporté
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getSeverityBadge(action.maxSeverity)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                        {action.cveCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {action.affectedAssets}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        action.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' :
                        action.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {action.status === 'available' && '✓ Disponible'}
                        {action.status === 'pending' && '⏳ En attente'}
                        {action.status === 'applied' && '✅ Appliqué'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les CVE"
                          onClick={() => navigate(`/vulnerabilities?package=${action.technology}`)}
                        >
                          🔍
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les actifs"
                          onClick={() => navigate(`/assets?package=${action.technology}`)}
                        >
                          🖥️
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
          <p className="text-sm text-slate-600">
            {filteredActions.length} action(s) affichée(s) sur {actions.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ActionsCorrectives;
