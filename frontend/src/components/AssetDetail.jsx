import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import assetService from '../services/assetService';
import scanService from '../services/scanService';

// Composant pour afficher le lien vers les vulnérabilités consolidées
function ConsolidatedVulnerabilities({ assetName, onRefresh }) {
  const navigate = useNavigate();
  const [consolidatedInfo, setConsolidatedInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConsolidatedInfo();
  }, [assetName]);

  const fetchConsolidatedInfo = async () => {
    try {
      const data = await assetService.getVulnerabilitiesSummary(assetName);
      setConsolidatedInfo({
        totalVulnerabilities: data.totalVulnerabilities || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur chargement info consolidées:', error);
    }
  };

  const handleRefresh = async (e) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      await assetService.refreshVulnerabilities(assetName);
      await fetchConsolidatedInfo();
      if (onRefresh) onRefresh();
      alert('Vulnérabilités consolidées mises à jour avec succès');
    } catch (error) {
      console.error('Erreur refresh:', error);
      alert('Erreur lors du rafraîchissement des vulnérabilités');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-bold text-lg text-slate-800">Vulnérabilités consolidées</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date dernière mise à jour</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total vulnérabilités</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/vulnerabilities-consolidated/${assetName}`)}>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-medium text-blue-600">
                  vulnerabilite_{assetName}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                {consolidatedInfo?.lastUpdated ? 
                  new Date(consolidatedInfo.lastUpdated).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {consolidatedInfo?.totalVulnerabilities || 0}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button 
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-300 text-xs font-medium rounded shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Relancer le matching des vulnérabilités"
                  >
                    {refreshing ? '⏳ Relance...' : 'Relancer'}
                  </button>
                  <button 
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/vulnerabilities-consolidated/${assetName}`);
                    }}
                  >
                    Voir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssetDetail() {
  const { assetName } = useParams();
  const [asset, setAsset] = useState(null);
  const [scans, setScans] = useState([]);
  const [xmlScans, setXmlScans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchingResults, setMatchingResults] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAsset();
    fetchScans();
    fetchStats();
  }, [assetName]);

  const fetchAsset = async () => {
    try {
      const data = await assetService.getByName(assetName);
      setAsset(data);
    } catch (error) {
      console.error('Erreur chargement asset:', error);
      setError(error.message);
    }
  };

  const fetchScans = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer les scans Cyberwatch pour cet asset
      const cyberwatchData = await assetService.getScans(assetName);
      
      // Récupérer les scans OpenVAS pour cet asset
      let openvasData = [];
      try {
        openvasData = await assetService.getOpenVASScans(assetName);
      } catch (err) {
        console.log('Pas de scans OpenVAS');
      }
      
      // Récupérer les scans Pivot pour cet asset
      let pivotData = [];
      try {
        pivotData = await assetService.getPivotScans(assetName);
      } catch (err) {
        console.log('Pas de scans Pivot');
      }
      
      // Combiner les trois types de scans avec un type de scanneur
      const allCyberwatchScans = cyberwatchData.map(scan => ({ ...scan, scanner: 'Cyberwatch', type: 'cyberwatch' }));
      const allOpenvasScans = openvasData.map(scan => ({ ...scan, scanner: 'OpenVAS', type: 'openvas' }));
      const allPivotScans = pivotData.map(scan => ({ ...scan, scanner: 'Pivot', type: 'pivot' }));
      
      setScans([...allCyberwatchScans, ...allOpenvasScans, ...allPivotScans]);
      setXmlScans([]); // Plus besoin de séparer
    } catch (error) {
      console.error('❌ Erreur fetching scans:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await assetService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const fetchScanStats = async (scanName) => {
    try {
      return await assetService.getScanStats(scanName);
    } catch (error) {
      console.error('Erreur scan stats:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadScansWithStats = async () => {
      await fetchScans();
      // Fetch CVE count for each Cyberwatch scan
      const scansWithStats = await Promise.all(
        scans.map(async (scan) => {
          const scanStats = await fetchScanStats(scan.scanName);
          return {
            ...scan,
            cveCount: scanStats?.cveCount || 0,
            vulnCount: scanStats?.vulnCount || 0
          };
        })
      );
      if (scansWithStats.length > 0) {
        setScans(scansWithStats);
      }
      
      // Fetch CVE count for each OpenVAS scan
      const xmlScansWithStats = await Promise.all(
        xmlScans.map(async (scan) => {
          const scanStats = await fetchScanStats(scan.scanName);
          return {
            ...scan,
            cveCount: scanStats?.cveCount || 0,
            vulnCount: scanStats?.vulnCount || 0
          };
        })
      );
      if (xmlScansWithStats.length > 0) {
        setXmlScans(xmlScansWithStats);
      }
    };
    
    if ((scans.length > 0 && !scans[0].cveCount) || (xmlScans.length > 0 && !xmlScans[0].cveCount)) {
      loadScansWithStats();
    }
  }, [scans.length, xmlScans.length]);

  const osStats = scans.reduce((acc, scan) => {
    const os = scan.osName || 'Inconnu';
    if (!acc[os]) {
      acc[os] = {
        name: os,
        version: scan.osVersion || '',
        count: 0,
        scans: []
      };
    }
    acc[os].count++;
    acc[os].scans.push(scan);
    return acc;
  }, {});

  const osArray = Object.values(osStats);

  const handleScanClick = (scan) => {
    if (scan.scanner === 'OpenVAS') {
      navigate(`/xml-report/${scan.scanName}`);
    } else if (scan.scanner === 'Pivot') {
      navigate(`/pivot/${scan.scanName}`);
    } else {
      navigate(`/cyberwatch/${scan.scanName}`);
    }
  };

  const handleDeleteScan = async (scan, e) => {
    e.stopPropagation();
    if (!confirm(`Voulez-vous vraiment supprimer le scan "${scan.scanName}" ?`)) return;
    
    try {
      if (scan.type === 'openvas') {
        await scanService.deleteOpenVAS(scan.scanName);
      } else if (scan.type === 'pivot') {
        await scanService.deletePivot(scan.scanName);
      } else {
        await scanService.delete(scan.scanName);
      }
      
      alert('Scan supprimé avec succès');
      fetchScans();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du scan');
    }
  };

  const handleUploadScan = (scannerType) => {
    if (scannerType === 'cyberwatch') {
      navigate(`/upload-scan?assetName=${assetName}`);
    } else if (scannerType === 'openvas') {
      navigate(`/upload-openvas?assetName=${assetName}`);
    } else if (scannerType === 'pivot') {
      navigate(`/upload-pivot?assetName=${assetName}`);
    }
  };

  const handleViewLogs = async (scanName, e) => {
    e.stopPropagation();
    
    if (!confirm(`Lancer le matching CVE pour le scan ${scanName} ?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await scanService.match(scanName);
      
      setMatchingResults({
        ...result,
        scanName: scanName,
        timestamp: new Date().toLocaleString('fr-FR')
      });
      
      // Refresh scan stats
      await fetchScans();
      
    } catch (error) {
      console.error('Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Chargement des scans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-lg w-full text-center">
          <h2 className="text-xl font-bold text-red-700 mb-4">❌ Erreur de chargement</h2>
          <p className="text-slate-700 mb-6">Impossible de charger les scans: {error}</p>
          <button 
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
            onClick={fetchScans}
          >
            🔄 Réessayer
          </button>
          <p className="mt-4 text-sm text-red-600 bg-red-100 p-3 rounded-lg">
            Vérifiez que le serveur backend est démarré sur le port 8080
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span className="hover:text-slate-700 transition-colors">Accueil</span>
        <span className="text-slate-400">›</span>
        <span 
          className="hover:text-blue-600 transition-colors cursor-pointer" 
          onClick={() => navigate('/assets')}
        >
          Assets
        </span>
        <span className="text-slate-400">›</span>
        <span className="font-medium text-slate-900">{asset?.name || 'Chargement...'}</span>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{asset?.name || 'Chargement...'}</h1>
            <p className="text-slate-500 mt-1">
              {asset?.description || 'Vue d\'ensemble des scans'}
            </p>
          </div>
        </div>
      </div>

      {/* Mini Tables Section - Cyberwatch Style */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Catégorie */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Catégorie</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-slate-600">Serveurs</td>
                  <td className="py-2 text-sm font-medium text-slate-900 text-right">{scans.length}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Système d'exploitation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Système d'exploitation</h3>
            <table className="w-full">
              <tbody>
                {osArray.slice(0, 3).map((os, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-sm text-slate-600">{os.name}</td>
                    <td className="py-2 text-sm font-medium text-slate-900 text-right">{os.count}</td>
                  </tr>
                ))}
                {osArray.length === 0 && (
                  <tr>
                    <td className="py-2 text-sm text-slate-600">Aucun OS détecté</td>
                    <td className="py-2 text-sm font-medium text-slate-900 text-right">0</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Criticité */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Criticité</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    Critique
                  </td>
                  <td className="py-2 text-sm font-medium text-slate-900 text-right">{stats.criticalCount || 0}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Élevée
                  </td>
                  <td className="py-2 text-sm font-medium text-slate-900 text-right">{stats.highCount || 0}</td>
                </tr>
                <tr>
                  <td className="py-2 text-sm text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Moyenne
                  </td>
                  <td className="py-2 text-sm font-medium text-slate-900 text-right">{stats.mediumCount || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Groupe */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Groupe</h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="py-2 text-sm text-slate-600">Production</td>
                  <td className="py-2 text-sm font-medium text-slate-900 text-right">{scans.length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Liste des scans</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              {scans.length} scan{scans.length > 1 ? 's' : ''} disponible{scans.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Scanneur</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom du scan</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hostname</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Système d'exploitation</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Packages</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CVE</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date du scan</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(() => {
                const cyberwatchScans = scans.filter(s => s.type === 'cyberwatch');
                const openvasScans = scans.filter(s => s.type === 'openvas');
                const pivotScans = scans.filter(s => s.type === 'pivot');
                
                return (
                  <>
                    {/* Section Cyberwatch */}
                    {cyberwatchScans.length === 0 ? (
                      <tr className="bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Cyberwatch</span>
                        </td>
                        <td colSpan="7" className="px-6 py-4 text-center text-slate-400 text-sm italic">
                          Aucun scan Cyberwatch disponible
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadScan('cyberwatch');
                            }}
                            title="Importer un scan Cyberwatch"
                          >
                            + Import
                          </button>
                        </td>
                      </tr>
                    ) : (
                      cyberwatchScans.map((scan, idx) => (
                        <tr 
                          key={`cyberwatch-${idx}`}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => handleScanClick(scan)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {scan.scanner}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-slate-900">{scan.scanName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-xs text-slate-600">{scan.hostname || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                {scan.osName || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-600">{scan.osVersion || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-900">{scan.packageCount || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit" title="CVE uniques">
                                {scan.cveCount || 0} CVE
                              </span>
                              {scan.vulnCount && scan.vulnCount !== scan.cveCount && (
                                <span className="text-xs text-slate-400">
                                  ({scan.vulnCount} lignes)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-500">
                              {scan.scanDate ? new Date(scan.scanDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button 
                                className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleScanClick(scan);
                                }}
                              >
                                Résultats
                              </button>
                              <button 
                                className="inline-flex items-center justify-center px-2 py-1 border border-slate-300 text-xs font-medium rounded shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                onClick={(e) => handleViewLogs(scan.scanName, e)}
                                title="Relancer le matching"
                              >
                                Matching
                              </button>
                              <button
                                className="inline-flex items-center justify-center px-2 py-1 border border-slate-300 text-xs font-medium rounded shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                onClick={(e) => handleDeleteScan(scan, e)}
                                title="Supprimer"
                              >
                                Supprimer
                              </button>
                              <button 
                                className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUploadScan('cyberwatch');
                                }}
                                title="Importer un nouveau scan"
                              >
                                + Import
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    
                    {/* Section OpenVAS */}
                    {openvasScans.length === 0 ? (
                      <tr className="bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">OpenVAS</span>
                        </td>
                        <td colSpan="7" className="px-6 py-4 text-center text-slate-400 text-sm italic">
                          Aucun scan OpenVAS disponible
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadScan('openvas');
                            }}
                            title="Importer un scan OpenVAS"
                          >
                            + Import
                          </button>
                        </td>
                      </tr>
                    ) : (
                      openvasScans.map((scan, idx) => (
                        <tr 
                          key={`openvas-${idx}`}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => handleScanClick(scan)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {scan.scanner}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-slate-900">{scan.scanName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-xs text-slate-600">{scan.hostname || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                {scan.osName || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-600">{scan.osVersion || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-900">{scan.packageCount || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit" title="CVE uniques">
                                {scan.cveCount || 0} CVE
                              </span>
                              {scan.vulnCount && scan.vulnCount !== scan.cveCount && (
                                <span className="text-xs text-slate-400">
                                  ({scan.vulnCount} lignes)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-500">
                              {scan.scanDate ? new Date(scan.scanDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button 
                                className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleScanClick(scan);
                                }}
                              >
                                Résultats
                              </button>
                              <button
                                className="inline-flex items-center justify-center px-2 py-1 border border-slate-300 text-xs font-medium rounded shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                onClick={(e) => handleDeleteScan(scan, e)}
                                title="Supprimer"
                              >
                                Supprimer
                              </button>
                              <button 
                                className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUploadScan('openvas');
                                }}
                                title="Importer un nouveau scan"
                              >
                                + Import
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    
                    {/* Section Pivot */}
                    {pivotScans.length === 0 ? (
                      <tr className="bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Pivot</span>
                        </td>
                        <td colSpan="7" className="px-6 py-4 text-center text-slate-400 text-sm italic">
                          Aucun scan Pivot disponible
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUploadScan('pivot');
                            }}
                            title="Importer un scan Pivot"
                          >
                            + Import
                          </button>
                        </td>
                      </tr>
                    ) : (
                      pivotScans.map((scan, idx) => (
                        <tr 
                          key={`pivot-${idx}`}
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => handleScanClick(scan)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Pivot
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-slate-900">{scan.scanName}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-xs text-slate-600">{scan.hostname || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                {scan.rawData?.projet || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-600">{scan.packageVersion || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-900">-</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">-</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-slate-500">
                              {scan.scanDate ? new Date(scan.scanDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button 
                                className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleScanClick(scan);
                                }}
                              >
                                Résultats
                              </button>
                              <button
                                className="inline-flex items-center justify-center px-2 py-1 border border-slate-300 text-xs font-medium rounded shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                                onClick={(e) => handleDeleteScan(scan, e)}
                                title="Supprimer"
                              >
                                Supprimer
                              </button>
                              <button 
                                className="inline-flex items-center justify-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUploadScan('pivot');
                                }}
                                title="Importer un nouveau scan"
                              >
                                + Import
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tableau des vulnérabilités consolidées */}
      <ConsolidatedVulnerabilities 
        assetName={assetName} 
        onRefresh={() => {
          fetchScans();
          fetchStats();
        }}
      />

      {/* Résultats du matching */}
      {matchingResults && (
        <div className="mt-6 p-6 bg-green-50 border-2 border-green-500 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="m-0 text-green-700 text-lg font-bold">
              ✅ Résultats du matching - {matchingResults.scanName}
            </h3>
            <button 
              onClick={() => setMatchingResults(null)}
              className="p-2 bg-transparent border-none cursor-pointer text-xl text-green-700 hover:text-green-900"
            >×</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-slate-500 mb-1">📦 Packages analysés</div>
              <div className="text-2xl font-bold text-slate-900">
                {matchingResults.totalPackages}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-slate-500 mb-1">🚨 CVE trouvées</div>
              <div className="text-2xl font-bold text-red-600">
                {matchingResults.totalCVEs}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-slate-500 mb-1">📦 Packages vulnérables</div>
              <div className="text-2xl font-bold text-orange-500">
                {matchingResults.vulnerablePackages}
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-slate-500 mb-1">⏱️ Temps d'exécution</div>
              <div className="text-2xl font-bold text-blue-500">
                {matchingResults.elapsedSeconds}s
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500 text-right">
            {matchingResults.timestamp}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetDetail;