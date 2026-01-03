import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import cveService from '../services/cveService';
import logger from '../utils/logger';

function EncyclopedieCVE() {
  const navigate = useNavigate();
  const [cves, setCves] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const isFetchingRef = useRef(false);
  
  const [filters, setFilters] = useState({
    cveId: '',
    cwe: '',
    cpe: ''
  });

  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);



  useEffect(() => {
    // Annuler le précédent appel si existe
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Attendre un peu avant de fetch pour éviter les appels multiples
    fetchTimeoutRef.current = setTimeout(() => {
      fetchCVEs();
    }, 100);
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [page, filters]);

  const fetchStats = async () => {
    try {
      const data = await cveService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchCVEs = async () => {
    // Éviter les appels multiples simultanés
    if (isFetchingRef.current) {
      return;
    }
    
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
        sortBy: 'cveId',
        sortOrder: 'desc'
      });
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });
      
      console.log('Fetching CVEs with params:', Object.fromEntries(params)); // Debug
      const data = await cveService.getList(Object.fromEntries(params));
      
      console.log('CVE Response:', data); // Debug log
      
      // Handle response format
      if (data.data && data.pagination) {
        setCves(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.warn('Unexpected response format:', data);
        setCves([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Erreur fetchCVEs:', error);
      setCves([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({...prev, [key]: value}));
    setPage(1);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': '#dc2626',
      'HIGH': '#f97316',
      'MEDIUM': '#eab308',
      'LOW': '#84cc16',
    };
    return colors[severity] || '#64748b';
  };

  const getScoreColor = (score) => {
    if (!score) return '#64748b';
    if (score >= 9.0) return '#dc2626';
    if (score >= 7.0) return '#f97316';
    if (score >= 4.0) return '#eab308';
    return '#84cc16';
  };

  return (
    <div className="p-6">
      <div className="flex items-center text-sm text-slate-500 mb-6">
        <span className="hover:text-slate-900 cursor-pointer">Encyclopédie</span>
        <span className="mx-2">›</span>
        <span className="font-medium text-slate-900">Encyclopédie</span>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Encyclopédie NVD NIST</h1>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-2xl mb-4">📊</div>
            <div className="text-sm font-medium text-slate-500 mb-1">Total CVEs</div>
            <div className="text-2xl font-bold text-slate-900">{(stats.total || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-2xl mb-4">🔴</div>
            <div className="text-sm font-medium text-slate-500 mb-1">Critical</div>
            <div className="text-2xl font-bold text-slate-900">{(stats.critical || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-2xl mb-4">🟠</div>
            <div className="text-sm font-medium text-slate-500 mb-1">High</div>
            <div className="text-2xl font-bold text-slate-900">{(stats.high || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center text-2xl mb-4">🟡</div>
            <div className="text-sm font-medium text-slate-500 mb-1">Medium</div>
            <div className="text-2xl font-bold text-slate-900">{(stats.medium || 0).toLocaleString()}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="w-12 h-12 rounded-lg bg-lime-50 text-lime-600 flex items-center justify-center text-2xl mb-4">🟢</div>
            <div className="text-sm font-medium text-slate-500 mb-1">Low</div>
            <div className="text-2xl font-bold text-slate-900">{(stats.low || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        <div 
          className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors" 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <h3 className="font-semibold text-slate-800">Filtres avancés</h3>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            {showAdvancedFilters ? '▼' : '▶'}
          </button>
        </div>
        
        {showAdvancedFilters && (
          <div className="p-6 border-t border-slate-200 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">🆔 CVE ID / Année</label>
                <input
                  type="text"
                  placeholder="ex: CVE-2025-1234 ou 2025"
                  value={filters.cveId}
                  onChange={(e) => handleFilterChange('cveId', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <small className="block text-xs text-slate-500 mt-1">
                  Entrez une année (ex: 2025) pour voir toutes les CVE de cette année
                </small>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">⚠️ CWE</label>
                <input
                  type="text"
                  placeholder="ex: CWE-79"
                  value={filters.cwe}
                  onChange={(e) => handleFilterChange('cwe', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <small className="block text-xs text-slate-500 mt-1">
                  Recherche toutes les CVE associées à ce CWE
                </small>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">🖥️ CPE (Produits affectés)</label>
                <input
                  type="text"
                  placeholder="ex: apache, tomcat"
                  value={filters.cpe}
                  onChange={(e) => handleFilterChange('cpe', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <small className="block text-xs text-slate-500 mt-1">
                  Recherche dans les produits et technologies affectés
                </small>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">Encyclopédie</h3>
          <div className="text-sm text-slate-500">
            {!loading && cves.length > 0 && (
              <span>{cves.length} résultat{cves.length > 1 ? 's' : ''} sur cette page</span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Chargement...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">CVE ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Publication</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sévérité</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Version CVSS</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">CPE</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cves.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-lg font-medium text-slate-900 mb-1">Aucune CVE trouvée</p>
                        <small className="text-slate-500">Essayez d'ajuster vos critères de recherche</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cves.map((cve) => (
                    <tr key={cve.cveId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a 
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/cve/${cve.cveId}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          {cve.cveId}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(cve.published).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cve.baseSeverity && (
                          <span 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getSeverityColor(cve.baseSeverity) }}
                          >
                            {cve.baseSeverity}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cve.baseScore ? (
                          <span 
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                            style={{ 
                              backgroundColor: getScoreColor(cve.baseScore),
                              color: 'white'
                            }}
                          >
                            {cve.baseScore}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {cve.cvssVersion || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-700" title={cve.cpeCriteria}>
                          {cve.cpeCriteria ? cve.cpeCriteria.substring(0, 50) + '...' : '-'}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">
                        {cve.description?.substring(0, 150)}
                        {cve.description?.length > 150 && '...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {cve.vulnStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <button
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              ◀ Précédent
            </button>
            <span className="text-sm text-slate-600 font-medium">
              Page {page} sur {totalPages}
            </span>
            <button
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Suivant ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EncyclopedieCVE;