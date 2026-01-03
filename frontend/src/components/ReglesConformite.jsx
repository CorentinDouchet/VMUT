import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import complianceService from '../services/complianceService';

function ReglesConformite() {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    level: 'all',
    framework: 'all',
    status: 'all',
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchRules();
    loadStats();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await complianceService.getRules();
      setRules(data);
    } catch (error) {
      console.error('Erreur chargement règles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await complianceService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const getLevelBadge = (level) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    const badges = {
      'CRITIQUE': <span className={`${baseClasses} bg-red-100 text-red-800 border border-red-200`}>CRITIQUE</span>,
      'ÉLEVÉE': <span className={`${baseClasses} bg-orange-100 text-orange-800 border border-orange-200`}>ÉLEVÉE</span>,
      'MOYENNE': <span className={`${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`}>MOYENNE</span>,
      'FAIBLE': <span className={`${baseClasses} bg-green-100 text-green-800 border border-green-200`}>FAIBLE</span>,
    };
    return badges[level] || <span className={`${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`}>UNKNOWN</span>;
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit";
    const badges = {
      'compliant': <span className={`${baseClasses} bg-green-50 text-green-700 border border-green-100`}>✓ Conforme</span>,
      'non-compliant': <span className={`${baseClasses} bg-red-50 text-red-700 border border-red-100`}>✗ Non conforme</span>,
      'partial': <span className={`${baseClasses} bg-yellow-50 text-yellow-700 border border-yellow-100`}>◐ Partiel</span>,
      'not-checked': <span className={`${baseClasses} bg-slate-100 text-slate-500 border border-slate-200`}>? Non vérifié</span>,
    };
    return badges[status] || badges['not-checked'];
  };

  const getFrameworkIcon = (framework) => {
    const icons = {
      'CIS': '🛡️',
      'NIST': '📋',
      'ISO': '🔐',
      'PCI-DSS': '💳',
      'GDPR': '🇪🇺',
      'HIPAA': '🏥',
    };
    return icons[framework] || '📄';
  };

  const getFilteredRules = () => {
    let filtered = [...rules];

    if (filters.search) {
      filtered = filtered.filter(rule =>
        rule.reference.toLowerCase().includes(filters.search.toLowerCase()) ||
        rule.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        rule.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.level !== 'all') {
      filtered = filtered.filter(rule => rule.level === filters.level);
    }

    if (filters.framework !== 'all') {
      filtered = filtered.filter(rule => rule.framework === filters.framework);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(rule => rule.status === filters.status);
    }

    return filtered;
  };

  const filteredRules = getFilteredRules();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        <div className="loading">Chargement des règles de conformité...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">📋 Règles de Conformité</h1>
          <p className="text-slate-500">
            Standards et benchmarks de sécurité pour vos systèmes
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="text-2xl bg-blue-50 p-3 rounded-lg">📊</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalRules || 0}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Règles totales</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="text-2xl bg-green-50 p-3 rounded-lg">✅</div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-slate-900">{stats.compliantCount || 0}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conformes</div>
              <div className="text-xs font-bold text-green-600 mt-1">
                {stats.complianceRate ? `${stats.complianceRate}%` : '0%'}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="text-2xl bg-red-50 p-3 rounded-lg">❌</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.nonCompliantCount || 0}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Non conformes</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="text-2xl bg-yellow-50 p-3 rounded-lg">⚠️</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.partialCount || 0}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Partielles</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="text-2xl bg-slate-50 p-3 rounded-lg">❓</div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.notCheckedCount || 0}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Non vérifiées</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2 flex flex-col gap-1">
            <input
              type="text"
              placeholder="🔍 Rechercher une règle..."
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Niveau :</label>
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            >
              <option value="all">Tous</option>
              <option value="CRITIQUE">Critique</option>
              <option value="ÉLEVÉE">Élevée</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="FAIBLE">Faible</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Référentiel :</label>
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              value={filters.framework}
              onChange={(e) => setFilters({ ...filters, framework: e.target.value })}
            >
              <option value="all">Tous</option>
              <option value="CIS">CIS Benchmarks</option>
              <option value="NIST">NIST</option>
              <option value="ISO">ISO 27001</option>
              <option value="PCI-DSS">PCI-DSS</option>
              <option value="GDPR">GDPR</option>
              <option value="HIPAA">HIPAA</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">État :</label>
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">Tous</option>
              <option value="compliant">Conforme</option>
              <option value="non-compliant">Non conforme</option>
              <option value="partial">Partiel</option>
              <option value="not-checked">Non vérifié</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex-1" 
              onClick={() => setFilters({ search: '', level: 'all', framework: 'all', status: 'all' })}
              title="Réinitialiser"
            >
              ↺
            </button>

            <button 
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex-1" 
              onClick={loadStats}
              title="Vérifier la conformité"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Règle</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Référentiel</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Niveau</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">État</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dernière vérif.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRules.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{rule.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="font-medium text-slate-900">{rule.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{rule.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                      {rule.framework}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelBadge(rule.level)}`}>
                      {rule.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(rule.status)}`}>
                      {rule.status === 'compliant' ? 'Conforme' : 
                       rule.status === 'non-compliant' ? 'Non conforme' :
                       rule.status === 'partial' ? 'Partiel' : 'Non vérifié'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{rule.lastCheck}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredRules.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            Aucune règle trouvée correspondant aux critères.
          </div>
        )}
      </div>

      <div className="table-footer">
        <p className="results-count">
          {filteredRules.length} règle(s) affichée(s) sur {rules.length}
        </p>
      </div>

      {/* Légende */}
      <div className="legend-section">
        <h3>📌 Référentiels de conformité</h3>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="legend-icon">🛡️</span>
            <div>
              <strong>CIS Benchmarks</strong>
              <p>Configurations de sécurité consensus pour systèmes et applications</p>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-icon">📋</span>
            <div>
              <strong>NIST</strong>
              <p>Framework de cybersécurité du National Institute of Standards</p>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🔐</span>
            <div>
              <strong>ISO 27001</strong>
              <p>Norme internationale de gestion de la sécurité de l'information</p>
            </div>
          </div>
          <div className="legend-item">
            <span className="legend-icon">💳</span>
            <div>
              <strong>PCI-DSS</strong>
              <p>Standard de sécurité pour les données de cartes bancaires</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReglesConformite;
