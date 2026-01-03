import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dashboardService from '../services/dashboardService';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const severityPalette = {
    CRITICAL: '#f44336',
    HIGH: '#ff9800',
    MEDIUM: '#ffc107',
    LOW: '#8bc34a',
  };

  const severityData = useMemo(() => stats?.severityDistribution || [], [stats]);

  const totalFindings = useMemo(() => stats ? stats.totalCVEs || 0 : 0, [stats]);
  const totalAssets = useMemo(() => stats ? (stats.totalPackages || 0) : 0, [stats]);

  const card = (title, value, subtitle, color) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-center shadow-sm">
      <div className="text-sm uppercase tracking-wide text-slate-500 mb-1">{title}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-slate-500 text-sm mt-1">{subtitle}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 bg-white">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md">
          <p className="text-red-600 text-lg font-medium flex items-center justify-center gap-2">
            <span>❌</span> Erreur lors du chargement des données
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord global</h1>
          <p className="text-slate-500 text-sm">Consolidé sur tous les assets</p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col items-start justify-center shadow-sm">
          <div className="text-sm uppercase tracking-wide text-slate-500">Score global</div>
          <div className="text-4xl font-black text-red-500 mt-2">{stats.criticalCount || 0}</div>
          <div className="text-lg font-semibold text-red-500">critique</div>
          <div className="text-slate-500 text-xs mt-2">Basé sur les vulnérabilités consolidées</div>
        </div>
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-lg p-4 flex flex-col shadow-sm">
          <div className="text-sm uppercase tracking-wide text-slate-500 mb-1">Vulnérabilités ouvertes (toutes sévérités)</div>
          <div className="text-4xl font-bold text-slate-900">{totalFindings.toLocaleString()} vulnérabilités</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {card('Critique', stats.criticalCount || 0, '', severityPalette.CRITICAL)}
            {card('Élevé', stats.highCount || 0, '', severityPalette.HIGH)}
            {card('Moyen', stats.mediumCount || 0, '', severityPalette.MEDIUM)}
            {card('Faible', stats.lowCount || 0, '', severityPalette.LOW)}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="text-sm uppercase tracking-wide text-slate-500 mb-2">Répartition</div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={severityData.map(s => ({ name: s.severity, value: s.count }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={severityPalette[entry.severity] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm uppercase tracking-wide text-slate-500 mb-3">Vue d'ensemble des actifs</div>
          <div className="text-4xl font-bold text-slate-900">{totalAssets}</div>
          <div className="text-slate-500 text-sm mt-1">assets concernés</div>
          <div className="mt-4 space-y-2">
            {card('Exploits connus', stats.exploitsAvailable || 0, 'vulnérabilités avec exploit', '#f97316')}
            {card('CVE uniques', stats.uniqueCVEs || 0, 'couverture globale', '#38bdf8')}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col h-96">
          <div className="text-sm uppercase tracking-wide text-slate-500 mb-3">Top packages vulnérables</div>
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {(stats.topPackages || []).map((pkg, idx) => (
              <div key={`${pkg.packageName}-${pkg.version}-${idx}`} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <div className="w-7 h-7 flex items-center justify-center bg-white rounded-full text-xs text-slate-700 border border-slate-200">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-slate-900">{pkg.packageName || 'N/A'}</div>
                  <div className="text-xs text-slate-500 font-mono truncate">v{pkg.version || 'n/a'}</div>
                </div>
                <div className="text-xs font-semibold text-red-500">{pkg.cveCount} CVE</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm uppercase tracking-wide text-slate-500 mb-3">Vulnérabilités par version CVSS</div>
          <div className="space-y-2">
            {(stats.cvssVersions || []).map((cv, idx) => (
              <div key={`${cv.version}-${idx}`} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <div className="text-slate-900 font-semibold">{cv.version || 'N/A'}</div>
                <div className="text-slate-600 text-sm">{cv.count} vulnérabilités</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col">
          <div className="text-sm uppercase tracking-wide text-slate-500 mb-3">Tendance (12 derniers mois)</div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={stats.monthlyTrend || []}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Critical Assets */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="text-sm uppercase tracking-wide text-slate-500 mb-4">Top 10 des actifs les plus critiques</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-medium">Actif</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Vulnérabilités ouvertes</th>
                <th className="pb-3 font-medium w-1/3">Répartition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats.topAssets || []).map((asset, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 font-medium text-slate-900">{asset.assetName}</td>
                  <td className="py-3 font-bold text-red-500">{asset.score}</td>
                  <td className="py-3 text-slate-600">{asset.total}</td>
                  <td className="py-3">
                    <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
                      <div style={{ width: `${asset.total > 0 ? (asset.critical / asset.total) * 100 : 0}%`, backgroundColor: severityPalette.CRITICAL }} title={`Critique: ${asset.critical}`} />
                      <div style={{ width: `${asset.total > 0 ? (asset.high / asset.total) * 100 : 0}%`, backgroundColor: severityPalette.HIGH }} title={`Élevé: ${asset.high}`} />
                      <div style={{ width: `${asset.total > 0 ? (asset.medium / asset.total) * 100 : 0}%`, backgroundColor: severityPalette.MEDIUM }} title={`Moyen: ${asset.medium}`} />
                      <div style={{ width: `${asset.total > 0 ? (asset.low / asset.total) * 100 : 0}%`, backgroundColor: severityPalette.LOW }} title={`Faible: ${asset.low}`} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!stats.topAssets || stats.topAssets.length === 0) && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-slate-500 italic">Aucun actif trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
