import React, { useState, useEffect } from 'react';
import auditService from '../services/auditService';

const Journal = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    // Filtres
    const [filters, setFilters] = useState({
        userId: '',
        actionType: '',
        actionTarget: '',
        startDate: '',
        endDate: ''
    });

    // Stats
    const [stats, setStats] = useState(null);

    const actionTypes = [
        { value: '', label: 'Tous les types' },
        { value: 'SCAN_IMPORT', label: 'Import de scan' },
        { value: 'JUSTIFICATION', label: 'Justification' },
        { value: 'CVSS_ADJUSTMENT', label: 'Ajustement CVSS' },
        { value: 'STATUS_CHANGE', label: 'Changement de statut' },
        { value: 'EXPORT', label: 'Export' },
        { value: 'DATABASE_UPDATE', label: 'Mise à jour BDD' }
    ];

    const actionTargets = [
        { value: '', label: 'Toutes les cibles' },
        { value: 'scan', label: 'Scan' },
        { value: 'cve', label: 'CVE' },
        { value: 'export', label: 'Export' },
        { value: 'database', label: 'Base de données' }
    ];

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                size: 50,
                ...filters
            };

            // Nettoyer les paramètres vides
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key];
            });

            const data = await auditService.getLogs(params);
            setLogs(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Erreur lors du chargement des logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await auditService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Erreur lors du chargement des statistiques:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(0); // Reset à la première page
    };

    const handleExport = async () => {
        try {
            const params = { ...filters };
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key];
            });

            const blob = await auditService.exportLogs(params);

            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionTypeLabel = (type) => {
        const found = actionTypes.find(at => at.value === type);
        return found ? found.label : type;
    };

    const resetFilters = () => {
        setFilters({
            userId: '',
            actionType: '',
            actionTarget: '',
            startDate: '',
            endDate: ''
        });
        setPage(0);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Journal d'audit</h1>

            {/* Statistiques */}
            {stats && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Statistiques d'activité</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Imports de scan</h4>
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-xs text-slate-400">24h</span>
                                    <p className="text-xl font-bold text-slate-900">{stats.scanImports24h}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">7j</span>
                                    <p className="text-xl font-bold text-slate-900">{stats.scanImports7d}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Justifications</h4>
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-xs text-slate-400">24h</span>
                                    <p className="text-xl font-bold text-slate-900">{stats.justifications24h}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">7j</span>
                                    <p className="text-xl font-bold text-slate-900">{stats.justifications7d}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Ajustements CVSS</h4>
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-xs text-slate-400">24h</span>
                                    <p className="text-xl font-bold text-slate-900">{stats.cvssAdjustments24h}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">7j</span>
                                    <p className="text-xl font-bold text-slate-900">{stats.cvssAdjustments7d}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Changements statut</h4>
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-xs text-slate-400">24h</span>
                                    <p className="text-xl font-bold text-slate-900">{stats.statusChanges24h}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400">7j</span>
                                    <p className="text-xl font-bold text-slate-900">{stats.statusChanges7d}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Filtres de recherche</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Utilisateur</label>
                        <input
                            type="text"
                            name="userId"
                            value={filters.userId}
                            onChange={handleFilterChange}
                            placeholder="ID utilisateur"
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Type d'action</label>
                        <select
                            name="actionType"
                            value={filters.actionType}
                            onChange={handleFilterChange}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            {actionTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Cible</label>
                        <select
                            name="actionTarget"
                            value={filters.actionTarget}
                            onChange={handleFilterChange}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            {actionTargets.map(target => (
                                <option key={target.value} value={target.value}>
                                    {target.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Date début</label>
                        <input
                            type="datetime-local"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-slate-700">Date fin</label>
                        <input
                            type="datetime-local"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        <button 
                            onClick={resetFilters} 
                            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex-1"
                        >
                            Réinitialiser
                        </button>
                        <button 
                            onClick={handleExport} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex-1"
                        >
                            Exporter CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Résultats */}
            <div className="mb-4 text-sm text-slate-500">
                <p><strong>{totalElements}</strong> entrées trouvées</p>
            </div>

            {/* Table des logs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-slate-500">Chargement...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cible</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Détails</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDate(log.actionTimestamp)}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.userId}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${log.actionType === 'SCAN_IMPORT' ? 'bg-blue-100 text-blue-800' : 
                                                  log.actionType === 'JUSTIFICATION' ? 'bg-purple-100 text-purple-800' :
                                                  log.actionType === 'CVSS_ADJUSTMENT' ? 'bg-orange-100 text-orange-800' :
                                                  log.actionType === 'STATUS_CHANGE' ? 'bg-green-100 text-green-800' :
                                                  log.actionType === 'DATABASE_UPDATE' ? 'bg-red-100 text-red-800' :
                                                  'bg-gray-100 text-gray-800'}`}>
                                                {getActionTypeLabel(log.actionType)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 truncate block max-w-[150px]" title={log.actionTarget}>{log.actionTarget}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 truncate block max-w-[300px]" title={log.actionDescription}>{log.actionDescription}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {log.actionDetails && (
                                                <details className="cursor-pointer group">
                                                    <summary className="text-blue-600 hover:text-blue-800 font-medium list-none flex items-center gap-1">
                                                        <span className="group-open:rotate-90 transition-transform">▶</span> Voir détails
                                                    </summary>
                                                    <pre className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-xs overflow-x-auto max-w-xs">{log.actionDetails}</pre>
                                                </details>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {logs.length === 0 && !loading && (
                    <div className="p-8 text-center text-slate-500">Aucune entrée trouvée</div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                    >
                        ← Précédent
                    </button>
                    <span>
                        Page {page + 1} sur {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                    >
                        Suivant →
                    </button>
                </div>
            )}
        </div>
    );
};

export default Journal;
