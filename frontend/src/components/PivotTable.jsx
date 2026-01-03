import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import scanService from '../services/scanService';

function PivotTable() {
  const { scanName } = useParams();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    assetName: 'all',
    projet: 'all',
    type: 'all'
  });

  useEffect(() => {
    loadPivotData();
  }, [scanName]);

  const loadPivotData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await scanService.getPivotData(scanName);
      setAssets(data);
    } catch (err) {
      console.error('Erreur chargement Pivot:', err);
      setError('Erreur lors du chargement des données Pivot');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({
      assetName: 'all',
      projet: 'all',
      type: 'all'
    });
  };

  const filterOptions = useMemo(() => {
    return {
      assetNames: ['all', ...new Set(assets.map(a => a.name).filter(Boolean))].sort(),
      projets: ['all', ...new Set(assets.map(a => a.rawData?.projet).filter(Boolean))].sort(),
      types: ['all', ...new Set(assets.map(a => a.rawData?.type).filter(Boolean))].sort()
    };
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (filters.assetName !== 'all' && asset.name !== filters.assetName) return false;
      if (filters.projet !== 'all' && asset.rawData?.projet !== filters.projet) return false;
      if (filters.type !== 'all' && asset.rawData?.type !== filters.type) return false;
      return true;
    });
  }, [assets, filters]);

  const stats = useMemo(() => {
    const projets = new Set(filteredAssets.map(a => a.rawData?.projet).filter(Boolean));
    const types = new Set(filteredAssets.map(a => a.rawData?.type).filter(Boolean));
    
    return {
      totalAssets: filteredAssets.length,
      totalProjets: projets.size,
      totalTypes: types.size
    };
  }, [filteredAssets]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500 text-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <p>Chargement des données Pivot...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">❌ Erreur</h2>
        <p className="text-slate-600 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/assets')} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour aux actifs
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <span 
          className="hover:text-blue-600 cursor-pointer transition-colors" 
          onClick={() => navigate('/')}
        >
          🏠 Accueil
        </span>
        <span className="text-slate-300">›</span>
        <span 
          className="hover:text-blue-600 cursor-pointer transition-colors" 
          onClick={() => navigate('/assets')}
        >
          Scans
        </span>
        <span className="text-slate-300">›</span>
        <span className="font-medium text-slate-900">{scanName}</span>
      </div>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">📊 Scan Pivot: {scanName}</h1>
            <p className="text-slate-500 mt-1">
              Données importées depuis fichier Excel
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="text-3xl">📦</div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Total Assets</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalAssets}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="text-3xl">🏢</div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Projets</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalProjets}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="text-3xl">🏷️</div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Types</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalTypes}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span>🔍</span> Filtres
          </h3>
          <button 
            onClick={resetFilters} 
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Réinitialiser
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset</label>
            <select
              value={filters.assetName}
              onChange={(e) => handleFilterChange('assetName', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-700"
            >
              {filterOptions.assetNames.map(name => (
                <option key={name} value={name}>
                  {name === 'all' ? 'Tous les assets' : name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projet</label>
            <select
              value={filters.projet}
              onChange={(e) => handleFilterChange('projet', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-700"
            >
              {filterOptions.projets.map(projet => (
                <option key={projet} value={projet}>
                  {projet === 'all' ? 'Tous les projets' : projet}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-700"
            >
              {filterOptions.types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'Tous les types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span>📊</span> Données Pivot
          </h3>
          <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            {filteredAssets.length} ligne{filteredAssets.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Asset Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Projet</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date Revue</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[300px]">Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Techno CPE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Techno sans CPE</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Version</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">CVEs ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Vulns ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Type CVSS</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">CVSS</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">CWE-ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Vecteur CVSS</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Source Origin</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Réf. Bulletin</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[250px]">Commentaire Supply Chain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="17" className="px-6 py-12 text-center text-slate-500">
                    Aucune donnée disponible
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {asset.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.projet || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.dateRevue || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.type || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                      <div className="line-clamp-2" title={asset.description}>
                        {asset.description || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.technologieCPE || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.technologieSansCPE || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {asset.packageVersion || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.cvesId || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.vulnsId || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.typeCVSS || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.cvss || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.cweId || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.vecteurCVSS || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.sourceOrigin || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 whitespace-nowrap">
                      {asset.rawData?.referenceBulletin || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900">
                      <div className="line-clamp-2" title={asset.rawData?.commentaireSupplyChain}>
                        {asset.rawData?.commentaireSupplyChain || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PivotTable;
