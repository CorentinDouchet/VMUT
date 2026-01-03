import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cveService from '../services/cveService';
import CVSSCalculator from './CVSSCalculator';

function CVEDetail() {
  const { cveId } = useParams();
  const navigate = useNavigate();
  const [cve, setCve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCVEDetails();
  }, [cveId]);

  const fetchCVEDetails = async () => {
    setLoading(true);
    try {
      const data = await cveService.getCveDetails(cveId);
      setCve(data);
    } catch (error) {
      console.error('Erreur:', error);
      setCve(null);
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
      'NONE': '#64748b'
    };
    return colors[severity] || '#64748b';
  };

  const parseCPE = (cpeString) => {
    if (!cpeString) return null;
    const parts = cpeString.split(':');
    return {
      vendor: parts[3] || '',
      product: parts[4] || '',
      version: parts[5] || '',
      update: parts[6] || '',
      edition: parts[7] || ''
    };
  };

  const parseReferences = (refsString) => {
    try {
      return JSON.parse(refsString || '[]');
    } catch {
      return [];
    }
  };

  const parseCPECriteria = (criteriaString) => {
    try {
      const parsed = JSON.parse(criteriaString || '[]');
      if (!Array.isArray(parsed)) return [];
      
      // Check if it's the NVD 2.0 format with nodes/cpeMatch structure
      if (parsed.length > 0 && parsed[0].nodes) {
        const cpeList = [];
        parsed.forEach(config => {
          if (config.nodes && Array.isArray(config.nodes)) {
            config.nodes.forEach(node => {
              if (node.cpeMatch && Array.isArray(node.cpeMatch)) {
                node.cpeMatch.forEach(match => {
                  if (match.criteria) {
                    cpeList.push(match.criteria);
                  }
                });
              }
            });
          }
        });
        return cpeList;
      }
      
      // Otherwise assume it's already a simple array of CPE strings
      return parsed;
    } catch {
      return [];
    }
  };

  const extractCWE = (description) => {
    const cweMatch = description?.match(/CWE-\d+/g);
    return cweMatch || [];
  };

  const parseCWEs = (cweString) => {
    try {
      return JSON.parse(cweString || '[]');
    } catch {
      return [];
    }
  };

  const parseChangeHistory = (historyString) => {
    try {
      return JSON.parse(historyString || '[]');
    } catch {
      return [];
    }
  };

  const parseVectorString = (vector) => {
    if (!vector) return {};
    const parts = vector.split('/');
    const metrics = {};
    parts.forEach(part => {
      const [key, value] = part.split(':');
      if (key && value) {
        metrics[key] = value;
      }
    });
    return metrics;
  };

  const getMetricLabel = (key, value) => {
    const labels = {
      'CVSS': { '3.0': 'CVSS v3.0', '3.1': 'CVSS v3.1', '4.0': 'CVSS v4.0' },
      'AV': { 'N': 'Network', 'A': 'Adjacent', 'L': 'Local', 'P': 'Physical' },
      'AC': { 'L': 'Low', 'H': 'High' },
      'PR': { 'N': 'None', 'L': 'Low', 'H': 'High' },
      'UI': { 'N': 'None', 'R': 'Required', 'P': 'Passive', 'A': 'Active' },
      'S': { 'U': 'Unchanged', 'C': 'Changed' },
      'C': { 'N': 'None', 'L': 'Low', 'H': 'High' },
      'I': { 'N': 'None', 'L': 'Low', 'H': 'High' },
      'A': { 'N': 'None', 'L': 'Low', 'H': 'High' }
    };
    return labels[key]?.[value] || value;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des détails...</p>
      </div>
    );
  }

  if (!cve) {
    return (
      <div className="error-container">
        <h2>❌ CVE non trouvée</h2>
        <button className="btn btn-primary" onClick={() => navigate('/encyclopedia')}>
          Retour à l'encyclopédie
        </button>
      </div>
    );
  }

  const vector = parseVectorString(cve.vectorString);
  const references = parseReferences(cve.cveReferences);
  const cpeCriteria = parseCPECriteria(cve.cpeCriteria);
  const cwes = parseCWEs(cve.cwes);
  const changeHistory = parseChangeHistory(cve.changeHistory);

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
      {/* Quick Info Sidebar - Style NIST */}
      <div className="lg:col-start-2 lg:row-start-1 lg:row-span-5 h-fit sticky top-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3 mb-4">QUICK INFO</div>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">CVE ID</div>
              <div className="text-sm font-medium text-slate-900">
                <a href={`https://cve.org/CVERecord?id=${cve.cveId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {cve.cveId}
                </a>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">NVD Published Date</div>
              <div className="text-sm text-slate-700">
                {new Date(cve.published).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
              </div>
            </div>
            {cve.lastModified && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">NVD Last Modified</div>
                <div className="text-sm text-slate-700">
                  {new Date(cve.lastModified).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </div>
              </div>
            )}
            {cve.assigner && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Source</div>
                <div className="text-sm text-slate-700 break-words">{cve.assigner}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-start-1 lg:row-start-1">
        <div className="flex items-center text-sm text-slate-500 mb-2">
          <span className="hover:text-slate-900 cursor-pointer flex items-center gap-1" onClick={() => navigate('/')}>🏠 Accueil</span>
          <span className="mx-2">›</span>
          <span className="hover:text-slate-900 cursor-pointer" onClick={() => navigate('/encyclopedia')}>Encyclopédie CVE</span>
          <span className="mx-2">›</span>
          <span className="font-medium text-slate-900">{cveId}</span>
        </div>
      </div>

      <div className="lg:col-start-1 lg:row-start-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{cve.cveId}</h1>
            <p className="text-slate-500">
              Publié le {new Date(cve.published).toLocaleDateString('fr-FR')} 
              {cve.lastModified && ` • Modifié le ${new Date(cve.lastModified).toLocaleDateString('fr-FR')}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => navigate('/encyclopedia')}
            >
              ← Retour
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
              onClick={() => setShowCalculator(true)}
            >
              🧮 Calculateur CVSS
            </button>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="lg:col-start-1 lg:row-start-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: getSeverityColor(cve.baseSeverity) }}></div>
          <div className="text-sm font-medium text-slate-500 mb-1">Sévérité</div>
          <div className="text-xl font-bold" style={{ color: getSeverityColor(cve.baseSeverity) }}>
            {cve.baseSeverity || 'N/A'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Score CVSS</div>
          <div className="text-xl font-bold text-slate-900">{cve.baseScore || 'N/A'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Version CVSS</div>
          <div className="text-xl font-bold text-slate-900">{cve.cvssVersion || 'N/A'}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500 mb-1">Statut</div>
          <div className="text-lg font-bold text-slate-900">{cve.vulnStatus || 'N/A'}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="lg:col-start-1 lg:row-start-4">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            <button 
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              📋 Vue d'ensemble
            </button>
            <button 
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cvss' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('cvss')}
            >
              📊 CVSS Details
            </button>
            <button 
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'cpe' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('cpe')}
            >
              💻 Produits affectés
            </button>
            <button 
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'references' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('references')}
            >
              🔗 Références ({references.length})
            </button>
            {cwes.length > 0 && (
              <button 
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'cwe' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => setActiveTab('cwe')}
              >
                ⚠️ Weakness Enumeration ({cwes.length})
              </button>
            )}
            {changeHistory.length > 0 && (
              <button 
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'history' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
                onClick={() => setActiveTab('history')}
              >
                📜 Change History ({changeHistory.length})
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="lg:col-start-1 lg:row-start-5">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800">📝 Description</h3>
              </div>
              <div className="p-6">
                <p className="text-slate-700 leading-relaxed">{cve.description || 'Aucune description disponible'}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800">ℹ️ Informations</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-500">CVE ID:</span>
                    <span className="text-base text-slate-900">{cve.cveId}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-500">Source:</span>
                    <span className="text-base text-slate-900">{cve.sourceIdentifier || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-500">Publié:</span>
                    <span className="text-base text-slate-900">
                      {new Date(cve.published).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {cve.lastModified && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-500">Dernière modification:</span>
                      <span className="text-base text-slate-900">
                        {new Date(cve.lastModified).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-500">Statut:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 w-fit">{cve.vulnStatus || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cvss' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800">📊 CVSS {cve.cvssVersion} Vector</h3>
              </div>
              <div className="p-6">
                <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm text-slate-700 mb-6 break-all border border-slate-200">
                  <code>{cve.vectorString || 'N/A'}</code>
                </div>

                {Object.keys(vector).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Breakdown des métriques</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(vector).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-700">{key}:</span>
                          <span className="text-slate-600">{getMetricLabel(key, value)}</span>
                          <span className="text-slate-400 text-xs">({value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">Base Score:</span>
                    <span className="text-2xl font-bold" style={{ color: getSeverityColor(cve.baseSeverity) }}>
                      {cve.baseScore}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: getSeverityColor(cve.baseSeverity) }}>
                      {cve.baseSeverity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cpe' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800">💻 Configurations de produits affectés (CPE)</h3>
              </div>
              <div className="p-6">
                {cpeCriteria.length > 0 ? (
                  <div className="space-y-3">
                    {cpeCriteria.map((cpe, index) => {
                      const parsed = parseCPE(cpe);
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                          <div className="text-2xl">💾</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm text-slate-700 mb-2 break-all">{cpe}</div>
                            {parsed && (
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 font-medium">Vendor: {parsed.vendor}</span>
                                <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 font-medium">Product: {parsed.product}</span>
                                {parsed.version !== '*' && (
                                  <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 font-medium">Version: {parsed.version}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-center py-8">Aucune configuration CPE disponible</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'references' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800">🔗 References to Advisories, Solutions, and Tools</h3>
                <p className="text-sm text-slate-500 mt-1">
                  By selecting these links, you will be leaving this site. We have provided these links because they may have information of interest.
                </p>
              </div>
              <div className="overflow-x-auto">
                {references.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">URL</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {references.map((ref, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm">
                            <a 
                              href={ref.url || ref} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {ref.url || ref}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {ref.source || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {ref.tags && ref.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {ref.tags.map((tag, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">{tag}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-slate-500 italic text-center py-8">Aucune référence externe disponible</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cwe' && cwes.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800">⚠️ Weakness Enumeration</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CWE ID</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CWE Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cwes.map((cwe, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <a 
                            href={`https://cwe.mitre.org/data/definitions/${cwe.id?.replace('CWE-', '') || cwe}.html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {cwe.id || cwe}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {cwe.description || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {cwe.source || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && changeHistory.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="font-bold text-lg text-slate-800">📜 Change History</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {changeHistory.length} change record{changeHistory.length > 1 ? 's' : ''} found
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action / Description</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {changeHistory.map((change, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                          {new Date(change.date || change.created).toLocaleDateString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {change.action || change.description || 'Modified'}
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {change.type || 'Update'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCalculator && (
        <CVSSCalculator
          vulnerability={{
            cveId: cve.cveId,
            baseScore: cve.baseScore,
            baseSeverity: cve.baseSeverity,
            cvssVersion: cve.cvssVersion,
            vectorString: cve.vectorString
          }}
          onClose={() => setShowCalculator(false)}
          onSave={() => {}}
        />
      )}
    </div>
  );
}

export default CVEDetail;
