import React, { useState, useEffect } from 'react';
import scanService from '../services/scanService';

const ImportHistory = () => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedImport, setSelectedImport] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyData, statsData] = await Promise.all([
        scanService.getImportHistory(100),
        scanService.getImportStats()
      ]);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setStats(statsData);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (importId) => {
    try {
      const logsData = await scanService.getImportLogs(importId);
      setLogs(logsData);
      setSelectedImport(importId);
    } catch (err) {
      console.error('Erreur lors du chargement des logs:', err);
      setLogs([]);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status?.toLowerCase()) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
      case 'error':
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
      case 'pending':
      case 'processing':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Historique des Imports</h1>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Imports
              </h3>
              <p className="text-2xl font-bold text-slate-900">{stats.totalImports || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Réussis
              </h3>
              <p className="text-2xl font-bold text-green-600">{stats.successfulImports || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Échoués
              </h3>
              <p className="text-2xl font-bold text-red-600">{stats.failedImports || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total CVE importées
              </h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalCvesImported || 0}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Historique</h2>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Aucun import trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Nom du Scan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    CVE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Durée
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {new Date(item.timestamp || item.date).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {item.type || 'Cyberwatch'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {item.scanName || item.fileName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={getStatusBadge(item.status)}>
                        {item.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.cvesMatched || item.totalCves || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.duration ? `${item.duration}s` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => loadLogs(item.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Voir logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900">
                Logs d'import #{selectedImport}
              </h3>
              <button
                onClick={() => setSelectedImport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {logs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Aucun log disponible</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                        </span>
                        <span className={
                          log.level === 'ERROR' ? 'text-red-600' :
                          log.level === 'WARN' ? 'text-yellow-600' :
                          'text-slate-600'
                        }>
                          [{log.level || 'INFO'}]
                        </span>
                        <span className="text-slate-900 flex-1">{log.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportHistory;
