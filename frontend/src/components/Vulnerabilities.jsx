import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import assetService from '../services/assetService';
import vulnerabilityService from '../services/vulnerabilityService';
import cweService from '../services/cweService';
import cvssService from '../services/cvssService';
import CVSSCalculator from './CVSSCalculator';
import CommentsModal from './CommentsModal';
import logger from '../utils/logger';
import EncyclopedieCVE from './EncyclopedieCVE';

function Vulnerabilities() {
  const { scanName } = useParams();
  const navigate = useNavigate();
  
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedCVEs, setSelectedCVEs] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [scanInfo, setScanInfo] = useState(null);
  const [cweDescriptions, setCweDescriptions] = useState({});
  const [cweNames, setCweNames] = useState({});
  
  const [filters, setFilters] = useState({
    cve: 'all',
    technology: 'all',
    action: 'all',
    cwe: 'all',
    scoreOriginal: 'all',
    scoreAjuste: 'all',
    severity: 'all',
    version: 'all',
    cpe: 'all',
    exploit: 'all',
    validite: 'all',
    justification: 'all',
    commentStatus: 'all',
    rssiStatus: 'all',
    dateSort: 'all'
  });
  
  // Filtres temporaires pour la saisie utilisateur (avant debounce)
  const [tempFilters, setTempFilters] = useState({
    cve: 'all',
    technology: 'all',
    action: 'all',
    cwe: 'all',
    cpe: 'all'
  });
  
  const debounceTimers = useRef({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    if (scanName) {
      fetchScanInfo();
      fetchVulnerabilities();
    }
  }, [scanName]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fonction pour gérer les changements de filtre avec debounce
  const handleFilterChange = (filterName, value) => {
    const textFilters = ['cve', 'technology', 'action', 'cwe', 'cpe'];
    
    if (textFilters.includes(filterName)) {
      // Mise à jour immédiate du champ de saisie
      setTempFilters(prev => ({ ...prev, [filterName]: value }));
      
      // Annuler le timer précédent
      if (debounceTimers.current[filterName]) {
        clearTimeout(debounceTimers.current[filterName]);
      }
      
      // Créer un nouveau timer
      debounceTimers.current[filterName] = setTimeout(() => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
      }, 500); // 500ms de délai
    } else {
      // Pour les filtres non-texte (select), mise à jour immédiate
      setFilters(prev => ({ ...prev, [filterName]: value }));
    }
  };

  // Nettoyage des timers au démontage
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const fetchScanInfo = async () => {
    try {
      const data = await assetService.getAllScans();
      const scan = data.find(s => s.scanName === scanName);
      setScanInfo(scan);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchVulnerabilities = async () => {
    setLoading(true);
    try {
      const data = await vulnerabilityService.getByScan(scanName);
      // Handle both array and PageResponse formats
      const vulns = Array.isArray(data) ? data : (data.data || []);
      setVulnerabilities(vulns);
      setSelectedCVEs([]);
      
      // Preload CWE descriptions
      const uniqueCwes = [...new Set(
        vulns
          .map(v => v.cwe)
          .filter(Boolean)
          .flatMap(cwe => cwe.split(', '))
          .map(cwe => cwe.trim())
          .filter(cweId => cweId && cweId !== '-')
      )];
      
      // Fetch all CWE descriptions in parallel
      const cwePromises = uniqueCwes.map(async (cweId) => {
        try {
          const data = await cweService.getById(cweId);
          return { 
            cweId, 
            name: data.name || '', 
            description: data.description || '' 
          };
        } catch (error) {
          logger.debug('CWE description not available:', cweId);
          return { cweId, name: '', description: '' };
        }
      });
      
      const cweResults = await Promise.all(cwePromises);
      const newCweDescriptions = {};
      const newCweNames = {};
      cweResults.forEach(({ cweId, name, description }) => {
        if (description) {
          newCweDescriptions[cweId] = description;
        }
        if (name) {
          newCweNames[cweId] = name;
        }
      });
      setCweDescriptions(prev => ({ ...prev, ...newCweDescriptions }));
      setCweNames(prev => ({ ...prev, ...newCweNames }));
    } catch (error) {
      console.error('Erreur:', error);
      setVulnerabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    window.open(`http://localhost:8080/api/export/csv/${scanName}`, '_blank');
  };

  const downloadWord = () => {
    window.open(`http://localhost:8080/api/export/word/${scanName}`, '_blank');
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

  const extractPureCPE = (technologies) => {
    if (!technologies) return '';
    // Extract CPE from parentheses: "something (cpe:2.3:a:vendor:product:version)"
    const match = technologies.match(/\(([^)]+)\)/);
    const cpe = match ? match[1] : technologies;
    
    // Extract product name from CPE format: cpe:2.3:a:vendor:product:version
    // Split by ':' and get the 5th element (index 4) which is the product name
    const parts = cpe.split(':');
    if (parts.length >= 5) {
      return parts[4]; // Returns just "firefox", "libaom", etc.
    }
    return cpe;
  };

  const getCweDescription = async (cweId) => {
    if (!cweId || cweId === '-') return '';
    if (cweDescriptions[cweId]) return cweDescriptions[cweId];
    
    try {
      // Try to get from backend if available
      const data = await cweService.getById(cweId);
      const description = data.description || '';
      setCweDescriptions(prev => ({ ...prev, [cweId]: description }));
      return description;
    } catch (error) {
      console.log('CWE description not available:', cweId);
    }
    return '';
  };

  const getJustificationStatus = (vuln) => {
    // Use backend-calculated rssiStatus if available
    if (vuln.rssiStatus === 'Traité') {
      return { status: 'complete', label: 'Traité', icon: '✅', color: '#10b981' };
    } else {
      return { status: 'pending', label: 'Non traité', icon: '⏳', color: '#94a3b8' };
    }
  };

  const getJustifiedBy = (vuln) => {
    return vuln.rssiStatus || 'Non traité';
  };

  const getCommentCount = (vuln) => {
    try {
      const comments = vuln.comments ? 
        (typeof vuln.comments === 'string' ? 
          JSON.parse(vuln.comments) : vuln.comments) : [];
      
      return Array.isArray(comments) ? comments.length : 0;
    } catch (err) {
      return 0;
    }
  };

  const filterOptions = useMemo(() => {
    return {
      cves: ['all', ...new Set(vulnerabilities.map(v => v.cveId).filter(Boolean))].sort(),
      technologies: ['all', ...new Set(vulnerabilities.map(v => v.packageName).filter(Boolean))].sort(),
      actions: ['all', ...new Set(vulnerabilities.map(v => v.packageVersion).filter(Boolean))].sort(),
      cwes: ['all', ...new Set(
        vulnerabilities
          .map(v => v.cwe)
          .filter(Boolean)
          .flatMap(cwe => cwe.split(', '))
      )].sort(),
      scoresOriginal: ['all', ...new Set(vulnerabilities.map(v => v.baseScore).filter(Boolean))].sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return parseFloat(b) - parseFloat(a);
      }),
      scoresAjuste: ['all', ...new Set(vulnerabilities.map(v => v.modifiedScore).filter(Boolean))].sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return parseFloat(b) - parseFloat(a);
      }),
      severities: ['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      versions: ['all', ...new Set(vulnerabilities.map(v => v.cvssVersion).filter(Boolean))].sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return a.localeCompare(b);
      }),
      cpes: ['all', ...new Set(
        vulnerabilities
          .map(v => extractPureCPE(v.affectedTechnologies))
          .filter(Boolean)
      )].sort(),
      exploits: ['all', 'Oui', 'Non'],
      validites: ['all', ...new Set(vulnerabilities.map(v => v.validityStatus).filter(Boolean))].sort(),
      justifications: ['all', 'complete', 'validated', 'analyzed', 'pending'],
      justifiedBy: ['all', 'Analyste', 'Validateur']
    };
  }, [vulnerabilities]);

  const filteredVulnerabilities = useMemo(() => {
    let filtered = vulnerabilities.filter(vuln => {
      if (filters.cve !== 'all' && vuln.cveId !== filters.cve) return false;
      if (filters.technology !== 'all' && vuln.packageName !== filters.technology) return false;
      if (filters.action !== 'all' && vuln.packageVersion !== filters.action) return false;
      if (filters.cwe !== 'all' && !vuln.cwe?.includes(filters.cwe)) return false;
      if (filters.scoreOriginal !== 'all' && vuln.baseScore != filters.scoreOriginal) return false;
      if (filters.scoreAjuste !== 'all' && vuln.modifiedScore != filters.scoreAjuste) return false;
      if (filters.severity !== 'all' && vuln.baseSeverity !== filters.severity) return false;
      if (filters.version !== 'all' && vuln.cvssVersion !== filters.version) return false;
      
      if (filters.cpe !== 'all') {
        const pureCPE = extractPureCPE(vuln.affectedTechnologies);
        if (pureCPE !== filters.cpe) return false;
      }
      
      if (filters.exploit !== 'all') {
        const exploitValue = vuln.exploitPocAvailable ? 'Oui' : 'Non';
        if (exploitValue !== filters.exploit) return false;
      }
      if (filters.validite !== 'all' && vuln.validityStatus !== filters.validite) return false;
      
      if (filters.justification !== 'all') {
        const status = getJustificationStatus(vuln);
        if (status.status !== filters.justification) return false;
      }
      
      if (filters.rssiStatus !== 'all' && vuln.rssiStatus !== filters.rssiStatus) return false;
      
      if (filters.commentStatus !== 'all') {
        try {
          const comments = vuln.comments ? 
            (typeof vuln.comments === 'string' ? 
              JSON.parse(vuln.comments) : 
              vuln.comments) : [];
          
          const hasComments = Array.isArray(comments) && comments.length > 0;
          
          if (filters.commentStatus === 'with' && !hasComments) return false;
          if (filters.commentStatus === 'without' && hasComments) return false;
        } catch (e) {
          // En cas d'erreur de parsing, traiter comme "without"
          if (filters.commentStatus === 'with') return false;
        }
      }
      
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
  }, [vulnerabilities, filters]);

  // Calculate total rows after CWE expansion
  const totalExpandedRows = useMemo(() => {
    return filteredVulnerabilities.reduce((total, vuln) => {
      const cweCount = vuln.cwe?.split(', ').length || 1;
      return total + cweCount;
    }, 0);
  }, [filteredVulnerabilities]);

  const handleSaveScore = async (scoreData) => {
    try {
      await cvssService.updateScore(selectedVuln.id, {
        score: scoreData.score,
        vector: scoreData.vector,
        severity: scoreData.severity,
        modifiedBy: 'User'
      });
      
      setShowCalculator(false);
      fetchVulnerabilities();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde du score');
    }
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedVuln(null);
    setBulkMode(false);
    setSelectedCVEs([]);
    fetchVulnerabilities();
  };

  const handleCheckboxChange = (vulnId) => {
    setSelectedCVEs(prev => {
      if (prev.includes(vulnId)) {
        return prev.filter(id => id !== vulnId);
      } else {
        return [...prev, vulnId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCVEs.length === filteredVulnerabilities.length) {
      setSelectedCVEs([]);
    } else {
      setSelectedCVEs(filteredVulnerabilities.map(v => v.id));
    }
  };

  const handleBulkComment = () => {
    if (selectedCVEs.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins une CVE');
      return;
    }
    
    const bulkVuln = {
      id: 'bulk',
      vulnerabilite: `${selectedCVEs.length} CVE sélectionnées`,
      package_name: 'Multiple',
      package_version: '',
      comments: []
    };
    
    setSelectedVuln(bulkVuln);
    setBulkMode(true);
    setShowComments(true);
  };

  const resetFilters = () => {
    setFilters({
      cve: 'all',
      technology: 'all',
      action: 'all',
      cwe: 'all',
      scoreOriginal: 'all',
      scoreAjuste: 'all',
      severity: 'all',
      version: 'all',
      cpe: 'all',
      exploit: 'all',
      validite: 'all',
      justification: 'all',
      commentStatus: 'all',
      rssiStatus: 'all',
      dateSort: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== 'all');

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span 
          className="hover:text-blue-600 cursor-pointer transition-colors" 
          onClick={() => navigate('/assets')}
        >
          Actifs
        </span>
        <span className="text-slate-400">›</span>
        <span 
          className="hover:text-blue-600 cursor-pointer transition-colors" 
          onClick={() => navigate('/assets')}
        >
          Scans
        </span>
        <span className="text-slate-400">›</span>
        <span className="font-medium text-slate-900">{scanName}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">Résultats des Vulnérabilités</h1>
          </div>
          <p className="text-slate-500">
            {scanInfo ? (
              <>
                {scanInfo.hostname} • {scanInfo.os_name} {scanInfo.os_version} • {scanName}
              </>
            ) : (
              'Analyse complète CVE • CPE • CWE'
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm" 
            onClick={() => navigate('/assets')}
          >
            <span>◀️</span> Retour aux actifs
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow flex items-center gap-2" 
            onClick={downloadWord}
          >
            <span></span> Export Word
          </button>
          <button 
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm" 
            onClick={downloadExcel}
          >
            <span></span> Export Excel
          </button>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
          <span className="text-blue-700 font-medium flex items-center gap-2">
            🔍 Filtres actifs
          </span>
          <button 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors" 
            onClick={resetFilters}
          >
            ✕ Réinitialiser tous les filtres
          </button>
        </div>
      )}

      {selectedCVEs.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-6 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">{selectedCVEs.length}</span>
            <span className="font-medium">CVE sélectionnée{selectedCVEs.length > 1 ? 's' : ''}</span>
          </div>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex items-center gap-3">
            <button 
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
              onClick={() => setSelectedCVEs([])}
            >
              ✕ Désélectionner tout
            </button>
            <button 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              onClick={handleBulkComment}
            >
              💬 Commenter toutes les sélectionnées
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">Vulnérabilités</h3>
          <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            {totalExpandedRows} ligne{totalExpandedRows > 1 ? 's' : ''} ({filteredVulnerabilities.length} CVE)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Ligne des en-têtes */}
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap w-10 min-w-[40px]">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedCVEs.length === filteredVulnerabilities.length && filteredVulnerabilities.length > 0}
                    onChange={handleSelectAll}
                    title="Tout sélectionner"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">SCANNEUR</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">VULNÉRABILITÉ (CVE)</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">DATE DE PUBLICATION</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">CVE DESCRIPTION</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">CVSS</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">SCORE CVSS D'ORIGINE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">TECHNOLOGIE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">VERSION</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">CWE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">CWE DESCRIPTION</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">TYPE D'ATTAQUE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">UTILISÉ</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">VECTEUR CVSS BASE</th>
              </tr>
              
              {/* Ligne des filtres */}
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2"></th>
                
                {/* SCANNEUR */}
                <th className="px-4 py-2">
                  {/* Pas de filtre */}
                </th>
                
                {/* VULNÉRABILITÉ (CVE) */}
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={tempFilters.cve}
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
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.scoreOriginal}
                    onChange={(e) => handleFilterChange('scoreOriginal', e.target.value)}
                  >
                    <option value="all">Tous</option>
                    {filterOptions.scoresOriginal.slice(1).map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </th>
                
                {/* TECHNOLOGIE */}
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={tempFilters.cpe}
                    onChange={(e) => handleFilterChange('cpe', e.target.value)}
                  >
                    <option value="all">Tous ({filterOptions.cpes.length - 1})</option>
                    {filterOptions.cpes.slice(1).map(cpe => (
                      <option key={cpe} value={cpe} title={cpe}>
                        {cpe?.substring(0, 40)}...
                      </option>
                    ))}
                  </select>
                </th>
                
                {/* VERSION */}
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={filters.version}
                    onChange={(e) => handleFilterChange('version', e.target.value)}
                  >
                    <option value="all">Toutes</option>
                    {filterOptions.versions.slice(1).map(version => (
                      <option key={version} value={version}>{version}</option>
                    ))}
                  </select>
                </th>
                                {/* OBSOLESCENCE */}
                <th className="px-4 py-2">
                  {/* Pas de filtre pour l'instant */}
                </th>
                                {/* CWE */}
                <th className="px-4 py-2">
                  <select 
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    value={tempFilters.cwe}
                    onChange={(e) => handleFilterChange('cwe', e.target.value)}
                  >
                    <option value="all">Tous ({filterOptions.cwes.length - 1})</option>
                    {filterOptions.cwes.slice(1).map(cwe => (
                      <option key={cwe} value={cwe}>{cwe}</option>
                    ))}
                  </select>
                </th>
                
                {/* CWE DESCRIPTION */}
                <th className="px-4 py-2">
                  <input 
                    type="text"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Filtrer..."
                  />
                </th>
                
                {/* TYPE D'ATTAQUE */}
                <th className="px-4 py-2">
                  <input 
                    type="text"
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Filtrer..."
                  />
                </th>
                
                {/* UTILISÉ */}
                <th className="px-4 py-2">
                  {/* Pas de filtre */}
                </th>
                
                {/* VECTEUR CVSS BASE */}
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVulnerabilities.length === 0 ? (
                <tr>
                  <td colSpan="14" className="px-6 py-12 text-center text-slate-500">
                    {hasActiveFilters ? 'Aucune vulnérabilité ne correspond aux filtres' : 'Aucune vulnérabilité trouvée'}
                  </td>
                </tr>
              ) : (
                (() => {
                  // FIRST: Expand vulnerabilities - one row per CWE
                  const expandedRows = [];
                  filteredVulnerabilities.forEach((vuln, idx) => {
                    const cwes = vuln.cwe?.split(', ') || [''];
                    cwes.forEach((cwe, cweIdx) => {
                      expandedRows.push({ 
                        ...vuln, 
                        singleCwe: cwe.trim(), 
                        isFirstCwe: cweIdx === 0, 
                        rowKey: `${vuln.id}-${idx}-${cweIdx}` 
                      });
                    });
                  });
                  
                  // THEN: Apply pagination to expanded rows
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedRows = expandedRows.slice(startIndex, endIndex);
                  
                  return paginatedRows.map((vuln) => {
                  const justificationStatus = getJustificationStatus(vuln);
                  const justifiedBy = getJustifiedBy(vuln);
                  
                  return (
                    <tr 
                      key={vuln.rowKey}
                      className={selectedCVEs.includes(vuln.id) ? 'bg-blue-50' : 'hover:bg-slate-50 transition-colors'}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedCVEs.includes(vuln.id)}
                          onChange={() => handleCheckboxChange(vuln.id)}
                        />
                      </td>
                      
                      {/* SCANNEUR (Cyberwatch) */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span className="font-medium text-slate-700">
                          Cyberwatch
                        </span>
                      </td>
                      
                      {/* VULNÉRABILITÉ (CVE) */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100 font-mono font-medium text-blue-600">
                        <a 
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/cve/${vuln.cveId}`);
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          {vuln.cveId}
                        </a>
                      </td>
                      
                      {/* DATE DE PUBLICATION */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">{vuln.publishedDate ? new Date(vuln.publishedDate).toLocaleDateString('fr-FR') : 'N/A'}</td>
                      
                      {/* CVE DESCRIPTION */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span 
                          className="block max-w-[300px] truncate" 
                          title={vuln.cveDescription}
                        >
                          {vuln.cveDescription || '-'}
                        </span>
                      </td>
                      
                      {/* CVSS (Sévérité) */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getSeverityColor(vuln.baseSeverity) }}
                        >
                          {vuln.baseSeverity}
                        </span>
                      </td>
                      
                      {/* SCORE CVSS D'ORIGINE */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {vuln.baseScore}
                        </span>
                      </td>
                      
                      {/* TECHNOLOGIE (CPE parsé) */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span 
                          className="font-mono text-xs text-slate-600 truncate block max-w-[200px]" 
                          title={vuln.affectedTechnologies}
                        >
                          {extractPureCPE(vuln.affectedTechnologies) || vuln.packageName}
                        </span>
                      </td>
                      
                      {/* VERSION */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">{vuln.cvssVersion}</td>
                      
                      {/* CWE */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{vuln.singleCwe}</span>
                      </td>
                      
                      {/* CWE DESCRIPTION */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span 
                          className="block max-w-[200px] truncate text-xs"
                          title={cweDescriptions[vuln.singleCwe] || ''}
                        >
                          {cweDescriptions[vuln.singleCwe] || '-'}
                        </span>
                      </td>
                      
                      {/* TYPE D'ATTAQUE */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span 
                          className="block max-w-[150px] truncate text-xs text-slate-600"
                          title={cweNames[vuln.singleCwe] || 'Non disponible'}
                        >
                          {cweNames[vuln.singleCwe] || '-'}
                        </span>
                      </td>
                      
                      {/* UTILISÉ (Oui/Non) */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vuln.validityStatus === 'Non' 
                            ? 'bg-slate-100 text-slate-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {vuln.validityStatus ? vuln.validityStatus : 'Oui'}
                        </span>
                      </td>
                      
                      {/* VECTEUR CVSS BASE */}
                      <td className="px-4 py-3 text-sm text-slate-900 border-b border-slate-100">
                        <span 
                          className="block max-w-[150px] truncate text-xs font-mono text-slate-500"
                          title={vuln.vectorString}
                        >
                          {vuln.vectorString || '-'}
                        </span>
                      </td>
                      
                    </tr>
                  );
                });
              })()
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredVulnerabilities.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Lignes par page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span className="text-sm text-slate-500 ml-4">
                {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalExpandedRows)} sur {totalExpandedRows}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md border ${currentPage === 1 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-600 cursor-pointer'} transition-colors`}
              >
                ⏮️
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md border ${currentPage === 1 ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-600 cursor-pointer'} transition-colors`}
              >
                ◀️
              </button>
              <span className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-700">
                Page {currentPage} / {Math.ceil(totalExpandedRows / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalExpandedRows / itemsPerPage)}
                className={`p-2 rounded-md border ${currentPage >= Math.ceil(totalExpandedRows / itemsPerPage) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-600 cursor-pointer'} transition-colors`}
              >
                ▶️
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(totalExpandedRows / itemsPerPage))}
                disabled={currentPage >= Math.ceil(totalExpandedRows / itemsPerPage)}
                className={`p-2 rounded-md border ${currentPage >= Math.ceil(filteredVulnerabilities.length / itemsPerPage) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-600 cursor-pointer'} transition-colors`}
              >
                ⏭️
              </button>
            </div>
          </div>
        )}
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
          selectedCVEs={selectedCVEs}
          bulkMode={bulkMode}
          onClose={handleCloseComments}
        />
      )}
    </div>
  );
}

export default Vulnerabilities;