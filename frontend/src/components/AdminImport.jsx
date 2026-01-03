import React, { useState } from 'react';
import adminService from '../services/adminService';
import '../EncyclopedieCVE.css';

function AdminImport() {
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    // Charger les statistiques au montage du composant
    React.useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await adminService.getImportStats();
            setStats(data);
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const handleImport = async () => {
        if (!window.confirm('⚠️ L\'import peut prendre 10-30 minutes. Continuer ?')) {
            return;
        }

        setImporting(true);
        setImportResult(null);
        setError(null);

        try {
            const data = await adminService.importCves();
            setImportResult(data);
            
            // Recharger les stats après import
            loadStats();

        } catch (err) {
            console.error('Import error:', err);
            setError(err.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Import CVE</h1>
            </div>

            {/* Statistiques actuelles */}
            {stats && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="text-2xl font-bold text-slate-700">
                                {stats.totalCves?.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-slate-500 mt-1">Total CVE</div>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="text-2xl font-bold text-emerald-600">
                                {stats.totalCpeIndex?.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-emerald-600 mt-1">CPE Index</div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                            <div className="text-2xl font-bold text-red-600">
                                {stats.critical?.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-red-600 mt-1">Critical</div>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="text-2xl font-bold text-orange-600">
                                {stats.high?.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-orange-600 mt-1">High</div>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                            <div className="text-2xl font-bold text-yellow-600">
                                {stats.medium?.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-yellow-600 mt-1">Medium</div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.low?.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-blue-600 mt-1">Low</div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.availableFiles}
                            </div>
                            <div className="text-sm font-medium text-purple-600 mt-1">Fichiers JSON</div>
                        </div>
                    </div>
                    
                    {stats.totalCpeIndex === 0 && stats.totalCves > 0 && (
                        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg flex items-start gap-3">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <strong className="block text-yellow-800 font-semibold">Attention : L'index CPE est vide !</strong>
                                <p className="text-yellow-700 text-sm mt-1">Le matching CVE ne fonctionnera pas. Cliquez sur "Lancer l'import CVE" pour reconstruire l'index.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bouton d'import */}
            <div className="mb-8">
                <button 
                    onClick={handleImport}
                    disabled={importing}
                    className={`w-full max-w-md px-8 py-4 text-lg font-bold text-white rounded-xl shadow-sm transition-all ${
                        importing 
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                >
                    {importing ? (
                        <span className="flex items-center justify-center gap-3">
                            <span className="animate-spin">⏳</span> Import en cours...
                        </span>
                    ) : (
                        'Lancer l\'import'
                    )}
                </button>

                {importing && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 flex items-center gap-3 animate-pulse">
                        <span>ℹ️</span>
                        <strong>Import en cours... Cela peut prendre 10-30 minutes. Ne fermez pas cette page.</strong>
                    </div>
                )}
            </div>

            {/* Résultat de l'import */}
            {importResult && (
                <div className={`p-6 rounded-xl border-2 mb-6 ${
                    importResult.success 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-red-50 border-red-500'
                }`}>
                    <h3 className={`text-xl font-bold mb-4 ${
                        importResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                        {importResult.success ? '✅ Import Réussi' : '❌ Import Échoué'}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-black/5">
                            <span className="font-medium opacity-70">Fichiers traités:</span>
                            <span className="font-bold">{importResult.filesProcessed}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-black/5">
                            <span className="font-medium opacity-70">CVE importées:</span>
                            <span className="font-bold">{importResult.totalImported?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-black/5">
                            <span className="font-medium opacity-70">CVE skippées (déjà présentes):</span>
                            <span className="font-bold">{importResult.totalSkipped?.toLocaleString()}</span>
                        </div>
                        
                        {importResult.processedFiles && importResult.processedFiles.length > 0 && (
                            <div className="mt-4">
                                <strong className="block mb-2 opacity-90">Fichiers:</strong>
                                <ul className="list-disc pl-5 space-y-1 opacity-80">
                                    {importResult.processedFiles.map((file, idx) => (
                                        <li key={idx}>{file}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {importResult.errors && importResult.errors.length > 0 && (
                            <div className="mt-4 p-4 bg-white/50 rounded-lg border border-red-200">
                                <strong className="block text-red-700 mb-2">Erreurs:</strong>
                                <ul className="list-disc pl-5 space-y-1 text-red-600">
                                    {importResult.errors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Erreur */}
            {error && (
                <div className="p-6 bg-red-50 border-2 border-red-500 rounded-xl text-red-800">
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <span>❌</span> Erreur
                    </h3>
                    <p className="font-medium">{error}</p>
                </div>
            )}
        </div>
    );
}

export default AdminImport;
