import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import vulnerabilityService from '../services/vulnerabilityService';
import cvssService from '../services/cvssService';
import scanService from '../services/scanService';
import CVSSCalculator from './CVSSCalculator';
import CommentsModal from './CommentsModal';

function XmlReport() {
  const { scanName } = useParams();
  const navigate = useNavigate();
  const [cves, setCves] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]); // VulnerabilityResult from DB
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [filters, setFilters] = useState({
    cve: 'all',
    technology: 'all',
    severity: 'all',
    dateSort: 'all'
  });

  useEffect(() => {
    loadXmlReport();
    loadVulnerabilities();
  }, [scanName]);

  const loadVulnerabilities = async () => {
    try {
      const data = await vulnerabilityService.getByScan(scanName);
      setVulnerabilities(data);
    } catch (err) {
      console.error('Erreur chargement vulnérabilités:', err);
    }
  };

  const loadXmlReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scanService.getXmlReport(scanName);
      if (response.success) {
        setCves(response.cves);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Erreur chargement XML:', err);
      setError('Erreur lors du chargement du rapport XML');
    } finally {
      setLoading(false);
    }
  };

  const formatEpss = (score) => {
    if (!score) return '-';
    return `${(score * 100).toFixed(4)}%`;
  };

  const getSeverityClass = (severity) => {
    const score = parseFloat(severity);
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  };

  const getSeverityLabel = (severity) => {
    if (!severity) return '-';
    const score = parseFloat(severity);
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    return 'LOW';
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({
      cve: 'all',
      technology: 'all',
      severity: 'all',
      dateSort: 'all'
    });
  };

  const filterOptions = useMemo(() => {
    return {
      cves: ['all', ...new Set(cves.map(v => v.cveId).filter(Boolean))].sort(),
      technologies: ['all', ...new Set(cves.map(v => v.affectedPackage).filter(Boolean))].sort(),
      severities: ['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    };
  }, [cves]);

  const filteredCves = useMemo(() => {
    let filtered = cves.filter(cve => {
      if (filters.cve !== 'all' && cve.cveId !== filters.cve) return false;
      if (filters.technology !== 'all' && cve.affectedPackage !== filters.technology) return false;
      if (filters.severity !== 'all' && getSeverityLabel(cve.severity) !== filters.severity) return false;
      return true;
    });

    if (filters.dateSort === 'recent') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
        return dateB - dateA;
      });
    } else if (filters.dateSort === 'old') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date(0);
        const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date(0);
        return dateA - dateB;
      });
    }

    return filtered;
  }, [cves, filters]);

  const hasActiveFilters = Object.values(filters).some(v => v !== 'all');

  // Find VulnerabilityResult for a CVE ID
  const findVulnerability = (cveId) => {
    return vulnerabilities.find(v => v.cveId === cveId);
  };

  const handleSaveScore = async (scoreData) => {
    try {
      if (!selectedVuln || !selectedVuln.id) {
        alert('❌ Erreur: Vulnérabilité invalide');
        return;
      }

      await cvssService.updateScore(selectedVuln.id, {
        score: scoreData.score,
        vector: scoreData.vector,
        severity: scoreData.severity,
        modifiedBy: 'User'
      });
      
      setShowCalculator(false);
      setSelectedVuln(null);
      loadVulnerabilities();
      
      console.log('✅ Score CVSS sauvegardé:', scoreData);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde du score');
    }
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedVuln(null);
    loadVulnerabilities();
  };

  const getCommentCount = (cveId) => {
    const vuln = findVulnerability(cveId);
    if (!vuln || !vuln.comments) return 0;
    
    try {
      const comments = typeof vuln.comments === 'string' ? 
        JSON.parse(vuln.comments) : vuln.comments;
      return Array.isArray(comments) ? comments.length : 0;
    } catch (err) {
      return 0;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement du rapport XML...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>❌ Erreur</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/assets')}>
            ← Retour aux actifs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span 
          className="hover:text-blue-600 cursor-pointer transition-colors" 
          onClick={() => navigate('/assets')}
        >
          Actifs
        </span>
        <span className="text-slate-400">›</span>
        <span className="text-slate-900 font-medium">Scans OpenVAS</span>
        <span className="text-slate-400">›</span>
        <span className="text-slate-900 font-medium">{scanName}</span>
      </div>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 m-0">Rapport OpenVAS</h1>
            <p className="text-slate-500 mt-1">
              Tableau des vulnérabilités • {scanName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 transition-colors" 
              onClick={() => navigate('/assets')}
            >
              <span>◀️</span> Retour aux actifs
            </button>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
          <span className="text-blue-700 font-medium flex items-center gap-2">
            🔍 Filtres actifs
          </span>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-transparent border-none cursor-pointer" onClick={resetFilters}>
            ✕ Réinitialiser tous les filtres
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 m-0">Vulnérabilités</h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            {filteredCves.length} ligne{filteredCves.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              {/* Ligne des en-têtes */}
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-[60px]">SCAN</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-[110px]">CVE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-[85px]">DATE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[150px] max-w-[200px]">DESCRIPTION</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-[80px]">CVSS</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-[60px]">SCORE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-[75px]">EPSS</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-[75px]">PERCENTILE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-[300px]">TECHNOLOGIE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap min-w-[180px]">VECTEUR</th>
              </tr>
              
              {/* Ligne des filtres */}
              <tr className="bg-slate-50 border-b border-slate-200">
                {/* SCANNEUR */}
                <th className="px-4 py-2">
                  {/* Pas de filtre */}
                </th>
                
                {/* VULNÉRABILITÉ (CVE) */}
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.cve}
                    onChange={(e) => handleFilterChange('cve', e.target.value)}
                  >
                    <option value="all">Toutes ({filterOptions.cves.length - 1})</option>
                    {filterOptions.cves.slice(1).map(cve => (
                      <option key={cve} value={cve}>{cve}</option>
                    ))}
                  </select>
                </th>
                
                {/* DATE DE PUBLICATION */}
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.dateSort}
                    onChange={(e) => handleFilterChange('dateSort', e.target.value)}
                  >
                    <option value="all">Toutes</option>
                    <option value="recent">📅 Récentes</option>
                    <option value="old">📆 Anciennes</option>
                  </select>
                </th>
                
                {/* CVE DESCRIPTION */}
                <th className="px-4 py-2">
                  <input 
                    type="text"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Filtrer..."
                  />
                </th>
                
                {/* CVSS (Sévérité) */}
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                  >
                    <option value="all">Toutes</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </th>
                
                {/* SCORE CVSS D'ORIGINE */}
                <th className="px-4 py-2"></th>
                
                {/* EPSS SCORE */}
                <th className="px-4 py-2"></th>
                
                {/* EPSS PERCENTILE */}
                <th className="px-4 py-2"></th>
                
                {/* TECHNOLOGIE */}
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.technology}
                    onChange={(e) => handleFilterChange('technology', e.target.value)}
                  >
                    <option value="all">Tous ({filterOptions.technologies.length - 1})</option>
                    {filterOptions.technologies.slice(1).map(tech => (
                      <option key={tech} value={tech}>
                        {tech?.substring(0, 40)}{tech?.length > 40 ? '...' : ''}
                      </option>
                    ))}
                  </select>
                </th>
                
                {/* VECTEUR CVSS BASE */}
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCves.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-slate-500 italic">
                    {hasActiveFilters ? 'Aucune vulnérabilité ne correspond aux filtres' : 'Aucune CVE trouvée dans ce rapport'}
                  </td>
                </tr>
              ) : (
                filteredCves.map((cve, index) => (
                  <tr key={`${cve.cveId}-${index}`} className="hover:bg-slate-50 transition-colors">
                    {/* SCANNEUR */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">OpenVAS</span>
                    </td>
                    
                    {/* VULNÉRABILITÉ (CVE) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a 
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/cve/${cve.cveId}`);
                        }}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {cve.cveId}
                      </a>
                    </td>
                    
                    {/* DATE DE PUBLICATION */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                      {cve.publishDate ? 
                        new Date(cve.publishDate).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : (cve.publishedDate ? 
                        new Date(cve.publishedDate).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : '-')}
                    </td>
                    
                    {/* CVE DESCRIPTION */}
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-xs">
                      <div className="truncate" title={cve.description}>
                        {cve.description ? 
                          (cve.description.length > 100 ? 
                            cve.description.substring(0, 100) + '...' : 
                            cve.description) 
                          : '-'}
                      </div>
                    </td>
                    
                    {/* CVSS (Sévérité) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cve.severity ? (
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ 
                            backgroundColor: (() => {
                              const score = parseFloat(cve.severity);
                              if (score >= 9.0) return '#dc2626';
                              if (score >= 7.0) return '#f97316';
                              if (score >= 4.0) return '#eab308';
                              return '#84cc16';
                            })()
                          }}
                        >
                          {getSeverityLabel(cve.severity)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    
                    {/* SCORE CVSS D'ORIGINE */}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                      {cve.severity ? (
                        parseFloat(cve.severity).toFixed(1)
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    
                    {/* EPSS SCORE */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {formatEpss(cve.epssScore)}
                    </td>
                    
                    {/* EPSS PERCENTILE */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {cve.epssPercentile ? `${(cve.epssPercentile * 100).toFixed(2)}%` : '-'}
                    </td>
                    
                    {/* TECHNOLOGIE */}
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-[300px]">
                      <div className="truncate" title={cve.affectedPackage}>
                        {cve.affectedPackage || '-'}
                      </div>
                    </td>
                    
                    {/* VECTEUR CVSS BASE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 inline-block max-w-[200px] truncate" title={cve.cvssVector}>
                        {cve.cvssVector || '-'}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCalculator && selectedVuln && (
        <CVSSCalculator
          vulnerability={selectedVuln}
          onSave={handleSaveScore}
          onClose={() => {
            setShowCalculator(false);
            setSelectedVuln(null);
          }}
        />
      )}

      {showComments && selectedVuln && (
        <CommentsModal
          vulnerability={selectedVuln}
          selectedCVEs={[]}
          bulkMode={false}
          onClose={handleCloseComments}
        />
      )}
    </div>
  );
}

export default XmlReport;
