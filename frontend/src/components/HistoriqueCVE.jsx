// components/HistoriqueCVE.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import historyService from '../services/historyService';
import assetService from '../services/assetService';
import attachmentService from '../services/attachmentService';
import vulnerabilityService from '../services/vulnerabilityService';

function HistoriqueCVE() {
  const navigate = useNavigate();
  const [cves, setCves] = useState([]);
  const [stats, setStats] = useState(null);
  const [years, setYears] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCVE, setSelectedCVE] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [attachmentsByVuln, setAttachmentsByVuln] = useState({});

  const [filters, setFilters] = useState({
    cveId: '',
    packageName: '',
    severity: 'all',
    year: 'all',
    assetId: 'all'
  });

  useEffect(() => {
    fetchStats();
    fetchYears();
    fetchAssets();
  }, []);

  useEffect(() => {
    fetchCVEs();
  }, [page, filters]);

  const fetchStats = async () => {
    try {
      const data = await historyService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchYears = async () => {
    try {
      const data = await historyService.getYears();
      setYears(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur:', error);
      setYears([]);
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await assetService.getAll();
      console.log('Assets loaded:', data); // Debug
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement assets:', error);
      setAssets([]);
    }
  };

  const fetchCVEs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
      });

      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          // Convert assetId to number if it's the assetId key
          const value = key === 'assetId' ? parseInt(filters[key]) : filters[key];
          params.append(key, value);
        }
      });

      console.log('Fetching with params:', params.toString()); // Debug
      console.log('Filters state:', filters); // Debug
      const data = await historyService.getCves(Object.fromEntries(params));
      console.log('CVEs received:', data); // Debug
      
      // Handle PageResponse format from Java backend
      const cvesList = data.data || data.content || [];
      setCves(cvesList);
      setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
      
      // Charger les pièces jointes pour chaque CVE
      // Note: On charge les pièces jointes depuis vulnerability_results via le cveId
      const attachmentsMap = {};
      await Promise.all(
        cvesList.map(async (cve) => {
          if (cve.cveId) {
            try {
              // Chercher les vulnerability_results pour ce CVE
              const vulnResults = await vulnerabilityService.getByCve(cve.cveId);
              const allAttachments = [];
              
              // Pour chaque vulnerability_result, récupérer ses pièces jointes
              if (Array.isArray(vulnResults)) {
                for (const vuln of vulnResults) {
                  try {
                    const attachments = await attachmentService.getAttachments(vuln.id);
                    if (Array.isArray(attachments)) {
                      allAttachments.push(...attachments);
                    }
                  } catch (err) {
                    // Ignore si pas d'attachments
                  }
                }
              }
              
              attachmentsMap[cve.cveId] = allAttachments;
            } catch (error) {
              attachmentsMap[cve.cveId] = [];
            }
          }
        })
      );
      setAttachmentsByVuln(attachmentsMap);
    } catch (error) {
      console.error('Erreur:', error);
      setCves([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
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

  const resetFilters = () => {
    setFilters({
      cveId: '',
      packageName: '',
      severity: 'all',
      year: 'all',
      assetId: 'all'
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== 'all');

  const handleViewComments = (cve) => {
    setSelectedCVE(cve);
    setShowComments(true);
  };

  if (loading && !cves.length) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>
          Actifs
        </span>
        <span className="text-slate-400">›</span>
        <span className="font-medium text-slate-900">Historique des justifications</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historique</h1>
        </div>
        <div className="flex gap-2">
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm" 
            onClick={() => {
              fetchStats();
              fetchCVEs();
              fetchYears();
            }}
            disabled={loading}
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span> {loading ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">📊</div>
              <div className="text-sm font-medium text-slate-500">Total Justifiées</div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{parseInt(stats.total).toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">🔴</div>
              <div className="text-sm font-medium text-red-600">Critical</div>
            </div>
            <div className="text-2xl font-bold text-red-700">{parseInt(stats.critical).toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">🟠</div>
              <div className="text-sm font-medium text-orange-600">High</div>
            </div>
            <div className="text-2xl font-bold text-orange-700">{parseInt(stats.high).toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">🟡</div>
              <div className="text-sm font-medium text-yellow-600">Medium</div>
            </div>
            <div className="text-2xl font-bold text-yellow-700">{parseInt(stats.medium).toLocaleString()}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">🟢</div>
              <div className="text-sm font-medium text-green-600">Low</div>
            </div>
            <div className="text-2xl font-bold text-green-700">{parseInt(stats.low).toLocaleString()}</div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg mb-6 border border-blue-100">
          <span className="font-medium flex items-center gap-2">🔍 Filtres actifs</span>
          <button className="text-sm hover:underline text-blue-600 hover:text-blue-800" onClick={resetFilters}>
            ✕ Réinitialiser tous les filtres
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="text-sm font-medium text-slate-700">Filtrer par asset:</label>
        <select
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-[250px] text-sm"
          value={filters.assetId}
          onChange={(e) => setFilters({ ...filters, assetId: e.target.value })}
        >
          <option value="all">Tous les assets</option>
          {Array.isArray(assets) && assets.map(asset => {
            console.log('Asset in dropdown:', asset); // Debug
            return (
              <option key={asset.id} value={asset.id}>
                {asset.nom || asset.name || asset.assetName || `Asset #${asset.id}`}
              </option>
            );
          })}
        </select>
        <span className="text-sm text-slate-500">
          {cves.length} résultat{cves.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-900">CVE Justifiées</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">ASSET</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px]">CVE-ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[110px]">DATE PUB.</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[300px]">DESCRIPTION</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[90px]">SÉVÉRITÉ</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[80px]">SCORE</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[90px]">VERSION</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px]">CWE</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[250px]">VECTEUR</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[300px]">COMMENTAIRE</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[110px]">DATE COMMENT.</th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2">
                  <input
                    type="text"
                    placeholder="🔍 CVE-ID..."
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.cveId}
                    onChange={(e) => setFilters({ ...filters, cveId: e.target.value })}
                  />
                </th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2">
                  <select
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  >
                    <option value="all">Toutes</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2"></th>
                <th className="px-6 py-2">
                  <select
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  >
                    <option value="all">Toutes</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p>Chargement...</p>
                    </div>
                  </td>
                </tr>
              ) : cves.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="text-4xl">📜</div>
                      <p className="font-medium text-slate-900">Aucune CVE commentée trouvée</p>
                      <small className="text-slate-500">Les CVE apparaîtront ici dès qu'un commentaire sera ajouté</small>
                    </div>
                  </td>
                </tr>
              ) : (
                cves.map((cve) => (
                  <tr key={cve.id} className="hover:bg-slate-50 transition-colors">
                    {/* Asset */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 max-w-[150px] truncate block" title={cve.assetName || '-'}>
                        {cve.assetName || '-'}
                      </span>
                    </td>
                    
                    {/* CVE ID */}
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      <a
                        href={`https://nvd.nist.gov/vuln/detail/${cve.cveId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {cve.cveId || 'N/A'}
                      </a>
                    </td>
                    
                    {/* Date Publication */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {cve.publishedDate ? new Date(cve.publishedDate).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    
                    {/* Description */}
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={cve.cveDescription || '-'}>
                      {cve.cveDescription || '-'}
                    </td>
                    
                    {/* Sévérité */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getSeverityColor(cve.baseSeverity) }}
                      >
                        {cve.baseSeverity || '-'}
                      </span>
                    </td>
                    
                    {/* Score */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                        {cve.baseScore || '-'}
                      </span>
                    </td>
                    
                    {/* Version CVSS */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{cve.versionCvss || '-'}</td>
                    
                    {/* CWE */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cve.cwe ? (
                        cve.cwe.split(', ').slice(0, 2).map((c, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 mr-1 border border-indigo-100">
                            {c}
                          </span>
                        ))
                      ) : '-'}
                    </td>
                    
                    {/* Vecteur */}
                    <td style={{ minWidth: '250px', maxWidth: '300px' }}>
                      <span 
                        title={cve.vectorString || '-'} 
                        style={{ 
                          fontFamily: 'monospace', 
                          fontSize: '0.75rem',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cve.vectorString || '-'}
                      </span>
                    </td>
                    
                    {/* Commentaire */}
                    <td className="px-6 py-4">
                      <div className="max-h-20 overflow-y-auto text-xs p-2 bg-slate-50 rounded border border-slate-200">
                        {(() => {
                          if (!cve.commentsAnalyst) return '-';
                          
                          // If it's an array of comment objects
                          if (Array.isArray(cve.commentsAnalyst)) {
                            return cve.commentsAnalyst.map((c, i) => (
                              <div key={i} className="mb-2 last:mb-0">
                                <div className="text-slate-500 text-[10px] mb-0.5">
                                  {c.author} - {new Date(c.timestamp).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-slate-700">{c.text}</div>
                              </div>
                            ));
                          }
                          
                          // If it's a string
                          return cve.commentsAnalyst;
                        })()}
                        
                        {/* Pièces jointes */}
                        {attachmentsByVuln[cve.cveId] && attachmentsByVuln[cve.cveId].length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <div className="text-[10px] text-slate-500 mb-1">Pièces jointes:</div>
                            {attachmentsByVuln[cve.cveId].map(attachment => (
                              <a
                                key={attachment.id}
                                href="#"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  try {
                                    const response = await attachmentService.downloadAttachment(attachment.id);
                                    const url = window.URL.createObjectURL(new Blob([response]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', attachment.filename);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    window.URL.revokeObjectURL(url);
                                  } catch (error) {
                                    console.error('Erreur téléchargement:', error);
                                  }
                                }}
                                className="block text-blue-600 hover:text-blue-800 hover:underline text-[11px] mt-1"
                                title={attachment.description || attachment.filename}
                              >
                                📎 {attachment.filename}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Date Commentaire */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {cve.justifiedDate ? new Date(cve.justifiedDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              ◀ Précédent
            </button>
            <span className="text-sm text-slate-600 font-medium">
              Page {page} sur {totalPages}
            </span>
            <button
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page === totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Suivant ▶
            </button>
          </div>
        )}
      </div>

      {/* Modal Commentaires */}
      {showComments && selectedCVE && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowComments(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-start bg-slate-50 rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">💬 Commentaires de Justification</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedCVE.cveId} - {selectedCVE.packageName} v{selectedCVE.packageVersion}
                </p>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={() => setShowComments(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Commentaires Analyste */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">👨‍💻 Espace Analyste</h3>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    {selectedCVE.commentsAnalyst ? selectedCVE.commentsAnalyst.length : 0} commentaire(s)
                  </span>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2">
                  {(() => {
                    try {
                      const comments = selectedCVE.commentsAnalyst || [];
                      
                      return comments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          Aucun commentaire
                        </div>
                      ) : (
                        comments.map((comment, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <strong className="text-sm text-slate-900">{comment.author}</strong>
                              <span className="text-xs text-slate-500">
                                {new Date(comment.timestamp).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap">{comment.text}</div>
                          </div>
                        ))
                      );
                    } catch (e) {
                      return <p className="text-red-500 text-sm">Erreur de chargement</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Commentaires Validateur */}
              <div className="flex flex-col h-full border-l border-slate-100 pl-6 md:border-l-0 md:pl-0">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">✅ Espace Validateur</h3>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    {selectedCVE.commentsValidator ? selectedCVE.commentsValidator.length : 0} commentaire(s)
                  </span>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] pr-2">
                  {(() => {
                    try {
                      const comments = selectedCVE.commentsValidator || [];
                      
                      return comments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                          Aucun commentaire
                        </div>
                      ) : (
                        comments.map((comment, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <strong className="text-sm text-slate-900">{comment.author}</strong>
                              <span className="text-xs text-slate-500">
                                {new Date(comment.timestamp).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap">{comment.text}</div>
                          </div>
                        ))
                      );
                    } catch (e) {
                      return <p className="text-red-500 text-sm">Erreur de chargement</p>;
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
              <button 
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm" 
                onClick={() => setShowComments(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoriqueCVE;