import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import exportService from '../services/exportService';
import { COLUMN_DEFINITIONS } from './ConsolidatedVulnerabilities_enhanced';

function VulnerabilitiesExport() {
  const { assetName } = useParams();
  const navigate = useNavigate();

  const exportableColumns = useMemo(
    () => Object.keys(COLUMN_DEFINITIONS).filter((col) => COLUMN_DEFINITIONS[col].exportKey),
    []
  );

  const [exportFormat, setExportFormat] = useState('EXCEL');
  const [exportColumns, setExportColumns] = useState(exportableColumns);
  const [exportTemplate, setExportTemplate] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await exportService.listTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Erreur chargement templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const toggleExportColumn = (columnId) => {
    setExportColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((c) => c !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExport = async () => {
    setError(null);
    setSuccess('');
    setExporting(true);
    try {
      await exportService.exportVulnerabilities({
        assetName,
        format: exportFormat,
        columns: exportColumns,
        filters: {},
        templateName: exportTemplate || null,
        scopeDescription: `Asset ${assetName}`
      });
      setSuccess('Export lancé. Vérifiez votre téléchargement.');
    } catch (err) {
      console.error('Erreur export', err);
      setError("L'export a échoué. Vérifiez le backend ou les paramètres.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => navigate(`/vulnerabilities-consolidated/${assetName}`)} 
            className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-2 text-sm w-fit"
          >
            ← Retour aux vulnérabilités consolidées
          </button>
          <h1 className="text-2xl font-bold text-slate-900 m-0">
            Export des vulnérabilités - {assetName}
          </h1>
          <p className="text-slate-500 text-sm m-0">
            Choisissez le format, les colonnes et (optionnel) un modèle DOCX avant d’exporter.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="EXCEL">Excel (XLSX)</option>
            <option value="CSV">CSV</option>
            <option value="DOCX">Word (DOCX)</option>
            <option value="PDF">PDF</option>
          </select>
          
          {exportFormat === 'DOCX' && (
            <div className="flex gap-2 items-center">
              <select
                value={exportTemplate}
                onChange={(e) => setExportTemplate(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64"
                disabled={loadingTemplates}
              >
                <option value="">Sans template (par défaut)</option>
                {templates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => navigate('/admin/templates')}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                title="Gérer les templates"
              >
                ⚙️
              </button>
            </div>
          )}
          
          <button
            onClick={handleExport}
            disabled={exporting || !assetName}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-medium flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
          >
            {exporting ? 'Export...' : '📊 Exporter'}
          </button>
        </div>

        <div>
          <p className="text-xs uppercase text-slate-400 font-semibold mb-2">Colonnes à inclure</p>
          <div className="flex flex-wrap gap-2">
            {exportableColumns.map((colId) => (
              <label key={colId} className="flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={exportColumns.includes(colId)}
                  onChange={() => toggleExportColumn(colId)}
                />
                {COLUMN_DEFINITIONS[colId].label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </div>
    </div>
  );
}

export default VulnerabilitiesExport;

