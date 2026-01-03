import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import assetService from '../services/assetService';
import cweService from '../services/cweService';
import vulnerabilityService from '../services/vulnerabilityService';
import cvssService from '../services/cvssService';
import attachmentService from '../services/attachmentService';
import CVSSCalculator from './CVSSCalculator';
import CommentsModal from './CommentsModal';
import logger from '../utils/logger';

// ============================================================================
// COLUMN CONFIGURATION - Centralized column metadata
// ============================================================================
const COLUMN_DEFINITIONS = {
  checkbox: {
    id: 'checkbox',
    label: '',
    defaultWidth: 40,
    minWidth: 40,
    maxWidth: 40,
    resizable: false,
    draggable: false,
    sortable: false,
    filterable: false,
    render: (vuln, handlers) => (
      <input
        type="checkbox"
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
        checked={handlers.selectedCVEs.includes(vuln.id)}
        onChange={() => handlers.handleCheckboxChange(vuln.id)}
      />
    ),
  },
  scanneur: {
    id: 'scanneur',
    label: 'SCANNEUR',
    defaultWidth: 150,
    minWidth: 120,
    maxWidth: 250,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'select', // 'select', 'text', 'number', 'date', 'multiselect', 'custom'
      options: [], // Will be populated dynamically
    },
    render: (vuln) => (
      <span className="truncate block" title={vuln.scanName || '-'} style={{ cursor: 'default', userSelect: 'none' }}>
        {vuln.scanName || '-'}
      </span>
    ),
    exportKey: 'scanName',
  },
  cve: {
    id: 'cve',
    label: 'VULNÉRABILITÉ (CVE)',
    defaultWidth: 160,
    minWidth: 120,
    maxWidth: 250,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'text',
      placeholder: 'Filtrer CVE...',
      debounce: 500,
    },
    render: (vuln, handlers) => (
      <a
        href={`https://nvd.nist.gov/vuln/detail/${vuln.cveId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
      >
        {vuln.cveId || 'N/A'}
      </a>
    ),
    exportKey: 'cveId',
  },
  date: {
    id: 'date',
    label: 'DATE DE PUBLICATION',
    defaultWidth: 140,
    minWidth: 110,
    maxWidth: 180,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'date',
      mode: 'range', // 'single', 'range'
    },
    render: (vuln) => {
      if (!vuln.publishedDate) return '-';
      const date = new Date(vuln.publishedDate);
      return date.toLocaleDateString('fr-FR');
    },
    exportKey: 'publishedDate',
  },
  description: {
    id: 'description',
    label: 'CVE DESCRIPTION',
    defaultWidth: 300,
    minWidth: 200,
    maxWidth: 600,
    resizable: true,
    draggable: true,
    sortable: false,
    filterable: {
      type: 'text',
      placeholder: 'Rechercher...',
      debounce: 500,
    },
    render: (vuln) => (
      <span title={vuln.cveDescription || '-'} className="line-clamp-2" style={{ cursor: 'default', userSelect: 'none' }}>
        {vuln.cveDescription || '-'}
      </span>
    ),
    exportKey: 'cveDescription',
  },
  cvss: {
    id: 'cvss',
    label: 'CVSS',
    defaultWidth: 90,
    minWidth: 70,
    maxWidth: 120,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'select',
      options: [], // Populated dynamically
    },
    render: (vuln) => (
      <span className="truncate block" title={vuln.cvssVersion || '-'} style={{ cursor: 'default', userSelect: 'none' }}>
        {vuln.cvssVersion || '-'}
      </span>
    ),
    exportKey: 'cvssVersion',
  },
  score: {
    id: 'score',
    label: 'SCORE',
    defaultWidth: 90,
    minWidth: 70,
    maxWidth: 120,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'number',
      mode: 'range', // 'exact', 'range', 'gt', 'lt'
      min: 0,
      max: 10,
      step: 0.1,
    },
    render: (vuln, handlers) => {
      const score = vuln.baseScore || 0;
      const severity = vuln.baseSeverity || 'LOW';
      return (
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: handlers.getSeverityColor(severity),
            }}
          />
          <span className="font-medium truncate" title={score}>{score}</span>
        </div>
      );
    },
    exportKey: 'baseScore',
  },
  technology: {
    id: 'technology',
    label: 'TECHNOLOGIE',
    defaultWidth: 160,
    minWidth: 120,
    maxWidth: 250,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'multiselect',
      placeholder: 'Sélectionner...',
      options: [],
    },
    render: (vuln) => (
      <span className="truncate block" title={vuln.packageName || '-'}>
        {vuln.packageName || '-'}
      </span>
    ),
    exportKey: 'packageName',
  },
  version: {
    id: 'version',
    label: 'VERSION',
    defaultWidth: 110,
    minWidth: 80,
    maxWidth: 150,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'text',
      placeholder: 'Version...',
      debounce: 300,
    },
    render: (vuln) => (
      <span className="truncate block" title={vuln.packageVersion || '-'}>
        {vuln.packageVersion || '-'}
      </span>
    ),
    exportKey: 'packageVersion',
  },
  cwe: {
    id: 'cwe',
    label: 'CWE',
    defaultWidth: 100,
    minWidth: 80,
    maxWidth: 150,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'multiselect',
      options: [],
    },
    render: (vuln) => (
      <span className="truncate block" title={vuln.singleCwe || vuln.cwe || '-'}>
        {vuln.singleCwe || vuln.cwe || '-'}
      </span>
    ),
    exportKey: 'cwe',
  },
  cweDesc: {
    id: 'cweDesc',
    label: 'CWE DESCRIPTION',
    defaultWidth: 300,
    minWidth: 200,
    maxWidth: 500,
    resizable: true,
    draggable: true,
    sortable: false,
    filterable: {
      type: 'text',
      placeholder: 'Rechercher...',
      debounce: 500,
    },
    render: (vuln, handlers) => {
      const cweId = vuln.singleCwe || '';
      const description = handlers.cweDescriptions[cweId.trim()] || '-';
      return <span title={description} className="line-clamp-2">{description}</span>;
    },
    exportKey: 'cweDescription',
  },
  attackType: {
    id: 'attackType',
    label: "TYPE D'ATTAQUE",
    defaultWidth: 200,
    minWidth: 150,
    maxWidth: 300,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'multiselect',
      options: [],
    },
    render: (vuln, handlers) => {
      const cweId = vuln.singleCwe || '';
      const name = handlers.cweNames[cweId.trim()] || '-';
      return <span title={name} className="truncate block">{name}</span>;
    },
    exportKey: 'attackType',
  },
  vectorBase: {
    id: 'vectorBase',
    label: 'VECTEUR CVSS BASE',
    defaultWidth: 250,
    minWidth: 180,
    maxWidth: 400,
    resizable: true,
    draggable: true,
    sortable: false,
    filterable: {
      type: 'text',
      placeholder: 'Rechercher vecteur...',
      debounce: 500,
    },
    render: (vuln) => (
      <span 
        className="font-mono text-xs truncate block"
        title={vuln.vectorString || '-'}
      >
        {vuln.vectorString || '-'}
      </span>
    ),
    exportKey: 'vectorString',
  },
  used: {
    id: 'used',
    label: 'UTILISÉ',
    defaultWidth: 120,
    minWidth: 100,
    maxWidth: 180,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'select',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'Oui', label: 'Oui' },
        { value: 'Non', label: 'Non' },
      ],
    },
    render: (vuln, handlers) => (
      <select
        value={vuln.validityStatus || 'Oui'}
        onChange={(e) => handlers.handleValidityChange(vuln.id, e.target.value)}
        style={{
          width: '100%',
          padding: '4px 8px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontFamily: 'inherit',
          fontSize: '14px',
          backgroundColor: 'white',
          cursor: 'pointer',
        }}
      >
        <option value="Oui">Oui</option>
        <option value="Non">Non</option>
      </select>
    ),
    exportKey: 'validityStatus',
  },
  comment: {
    id: 'comment',
    label: 'COMMENTAIRE',
    defaultWidth: 300,
    minWidth: 200,
    maxWidth: 500,
    resizable: true,
    draggable: true,
    sortable: false,
    filterable: {
      type: 'select',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'with', label: 'Avec commentaire' },
        { value: 'without', label: 'Sans commentaire' },
      ],
    },
    render: (vuln, handlers) => {
      const attachments = handlers.attachmentsByVuln[vuln.id] || [];
      
      // Charger les attachments au premier affichage
      if (handlers.attachmentsByVuln[vuln.id] === undefined) {
        handlers.fetchAttachmentsForVuln(vuln.id);
      }
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-start', pointerEvents: 'auto' }}>
            <textarea
              className="inline-comment-textarea"
              value={vuln.commentsAnalyst || ''}
              placeholder="Ajouter un commentaire..."
              onChange={(e) => {
                handlers.handleCommentChange(vuln.id, e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onBlur={(e) => handlers.handleCommentSave(vuln.id, e.target.value)}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              rows={1}
              style={{
                flex: 1,
                minHeight: '30px',
                resize: 'none',
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px',
                lineHeight: '1.4',
                overflow: 'hidden',
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf,.txt,.png,.jpg,.jpeg,.docx,.doc';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handlers.handleUploadAttachment(vuln.id, file);
                  }
                };
                input.click();
              }}
              style={{
                width: '28px',
                height: '28px',
                minWidth: '28px',
                padding: '0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
              title="Ajouter une pièce jointe"
            >
              +
            </button>
          </div>
          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px', pointerEvents: 'auto' }}>
              {attachments.map(attachment => (
                <div
                  key={attachment.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlers.handleDownloadAttachment(attachment.id, attachment.filename);
                    }}
                    style={{
                      fontSize: '12px',
                      color: '#3b82f6',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flex: 1,
                    }}
                    title={attachment.description || attachment.filename}
                  >
                    📎 {attachment.filename}
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Supprimer la pièce jointe "${attachment.filename}" ?`)) {
                        handlers.handleDeleteAttachment(vuln.id, attachment.id);
                      }
                    }}
                    style={{
                      width: '18px',
                      height: '18px',
                      minWidth: '18px',
                      padding: '0',
                      border: '1px solid #ef4444',
                      borderRadius: '3px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                      lineHeight: '1',
                    }}
                    title="Supprimer la pièce jointe"
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    },
  },
  rssiStatus: {
    id: 'rssiStatus',
    label: 'STATUT RSSI',
    defaultWidth: 180,
    minWidth: 150,
    maxWidth: 250,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'select',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'A traiter', label: 'A traiter' },
        { value: 'En cours de traitement', label: 'En cours de traitement' },
        { value: 'Traité', label: 'Traité' },
      ],
    },
    render: (vuln, handlers) => {
      const getStatusColor = (status) => {
        switch(status) {
          case 'Traité': return '#10b981';
          case 'En cours de traitement': return '#f59e0b';
          case 'A traiter': return '#ef4444';
          default: return '#94a3b8';
        }
      };

      return (
        <select
          value={vuln.rssiStatus || 'A traiter'}
          onChange={(e) => handlers.handleRssiStatusChange(vuln.id, e.target.value)}
          style={{
            width: '100%',
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: '14px',
            backgroundColor: getStatusColor(vuln.rssiStatus || 'A traiter'),
            color: 'white',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <option value="A traiter">A traiter</option>
          <option value="En cours de traitement">En cours de traitement</option>
          <option value="Traité">Traité</option>
        </select>
      );
    },
    exportKey: 'rssiStatus',
  },
  metierStatus: {
    id: 'metierStatus',
    label: 'STATUT MÉTIER',
    defaultWidth: 180,
    minWidth: 150,
    maxWidth: 250,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'select',
      options: [
        { value: 'all', label: 'Tous' },
        { value: 'A traiter', label: 'A traiter' },
        { value: 'En cours de traitement', label: 'En cours de traitement' },
        { value: 'Traité', label: 'Traité' },
      ],
    },
    render: (vuln, handlers) => {
      const getStatusColor = (status) => {
        switch(status) {
          case 'Traité': return '#10b981';
          case 'En cours de traitement': return '#f59e0b';
          case 'A traiter': return '#ef4444';
          default: return '#94a3b8';
        }
      };

      return (
        <select
          value={vuln.metierStatus || 'A traiter'}
          onChange={(e) => handlers.handleMetierStatusChange(vuln.id, e.target.value)}
          style={{
            width: '100%',
            padding: '4px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: '14px',
            backgroundColor: getStatusColor(vuln.metierStatus || 'A traiter'),
            color: 'white',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          <option value="A traiter">A traiter</option>
          <option value="En cours de traitement">En cours de traitement</option>
          <option value="Traité">Traité</option>
        </select>
      );
    },
    exportKey: 'metierStatus',
  },
  vectorEnv: {
    id: 'vectorEnv',
    label: 'VECTEUR CVSS BASE + ENV',
    defaultWidth: 250,
    minWidth: 180,
    maxWidth: 400,
    resizable: true,
    draggable: true,
    sortable: false,
    filterable: {
      type: 'text',
      placeholder: 'Rechercher vecteur...',
      debounce: 500,
    },
    render: (vuln) => (
      <span
        className="cvss-vector-text"
        title={vuln.modifiedVector || ''}
        style={{
          display: 'block',
          maxWidth: '250px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
        }}
      >
        {vuln.modifiedVector || '-'}
      </span>
    ),
    exportKey: 'modifiedVector',
  },
  scoreContext: {
    id: 'scoreContext',
    label: 'SCORE CVSS CONTEXTUALISÉ',
    defaultWidth: 140,
    minWidth: 110,
    maxWidth: 180,
    resizable: true,
    draggable: true,
    sortable: true,
    filterable: {
      type: 'number',
      min: 0,
      max: 10,
    },
    render: (vuln) => {
      if (vuln.modifiedScore) {
        return (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 max-w-full"
            title="Score modifié"
          >
            <span className="truncate">{vuln.modifiedScore}</span> <span className="flex-shrink-0 ml-1">✏️</span>
          </span>
        );
      }
      return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">-</span>;
    },
    exportKey: 'modifiedScore',
  },
  calculator: {
    id: 'calculator',
    label: 'CALCULATRICE',
    defaultWidth: 120,
    minWidth: 100,
    maxWidth: 150,
    resizable: true,
    draggable: true,
    sortable: false,
    filterable: false,
    render: (vuln, handlers) => (
      <div className="action-buttons">
        <button
          className="btn-icon"
          title="Calculateur CVSS"
          onClick={() => {
            handlers.setSelectedVuln(vuln);
            handlers.setShowCalculator(true);
          }}
        >
          🧮
        </button>
      </div>
    ),
  },
};

// ============================================================================
// COMPONENT
// ============================================================================
function ConsolidatedVulnerabilities() {
  const { assetName } = useParams();
  const navigate = useNavigate();
  
  // Data state
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cweDescriptions, setCweDescriptions] = useState({});
  const [cweNames, setCweNames] = useState({});
  const [attachmentsByVuln, setAttachmentsByVuln] = useState({});
  
  // UI state
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedCVEs, setSelectedCVEs] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  
  // Table configuration state
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem(`consolidatedVulns_columnOrder_${assetName}`);
    return saved ? JSON.parse(saved) : Object.keys(COLUMN_DEFINITIONS);
  });
  
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem(`consolidatedVulns_columnWidths_${assetName}`);
    if (saved) return JSON.parse(saved);
    
    const defaults = {};
    Object.entries(COLUMN_DEFINITIONS).forEach(([key, def]) => {
      defaults[key] = def.defaultWidth;
    });
    return defaults;
  });
  
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`consolidatedVulns_visibleColumns_${assetName}`);
    return saved ? JSON.parse(saved) : Object.keys(COLUMN_DEFINITIONS);
  });
  
  // Drag & drop state
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  
  // Resize state
  const [resizingColumn, setResizingColumn] = useState(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({});
  const [tempFilters, setTempFilters] = useState({});
  const debounceTimers = useRef({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // ============================================================================
  // PERSISTENCE - Save configuration to localStorage
  // ============================================================================
  useEffect(() => {
    localStorage.setItem(`consolidatedVulns_columnOrder_${assetName}`, JSON.stringify(columnOrder));
  }, [columnOrder, assetName]);

  useEffect(() => {
    localStorage.setItem(`consolidatedVulns_columnWidths_${assetName}`, JSON.stringify(columnWidths));
  }, [columnWidths, assetName]);

  useEffect(() => {
    localStorage.setItem(`consolidatedVulns_visibleColumns_${assetName}`, JSON.stringify(visibleColumns));
  }, [visibleColumns, assetName]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  useEffect(() => {
    if (assetName) {
      fetchVulnerabilities();
    }
  }, [assetName]);

  const fetchVulnerabilities = async () => {
    setLoading(true);
    try {
      const data = await assetService.getVulnerabilitiesSummary(assetName);
      const vulns = Array.isArray(data) ? data : (data.data || []);
      setVulnerabilities(vulns);
      setSelectedCVEs([]);
      
      // Fetch CWE descriptions
      const uniqueCwes = [...new Set(
        vulns
          .map(v => v.cwe)
          .filter(Boolean)
          .flatMap(cwe => cwe.split(', '))
          .map(cwe => cwe.trim())
          .filter(cweId => cweId && cweId !== '-')
      )];
      
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
        }
        return { cweId, name: '', description: '' };
      });
      
      const cweResults = await Promise.all(cwePromises);
      const newCweDescriptions = {};
      const newCweNames = {};
      cweResults.forEach(({ cweId, name, description }) => {
        if (description) newCweDescriptions[cweId] = description;
        if (name) newCweNames[cweId] = name;
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

  // ============================================================================
  // DRAG & DROP HANDLERS
  // ============================================================================
  const handleDragStart = useCallback((e, columnId) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create custom drag image showing the entire column
    const columnIndex = columnOrder.indexOf(columnId);
    const headerCell = e.currentTarget;
    const table = headerCell.closest('table');
    const allRows = table.querySelectorAll('tbody tr');
    
    // Create a ghost element that looks like the entire column
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    ghost.style.left = '-9999px';
    ghost.style.width = `${columnWidths[columnId]}px`;
    ghost.style.background = 'white';
    ghost.style.border = '2px solid #3b82f6';
    ghost.style.borderRadius = '8px';
    ghost.style.padding = '8px';
    ghost.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    ghost.style.opacity = '0.95';
    ghost.style.zIndex = '9999';
    
    // Add header content
    const ghostHeader = document.createElement('div');
    ghostHeader.style.fontWeight = 'bold';
    ghostHeader.style.padding = '8px';
    ghostHeader.style.background = '#f1f5f9';
    ghostHeader.style.borderRadius = '4px';
    ghostHeader.style.marginBottom = '8px';
    ghostHeader.textContent = COLUMN_DEFINITIONS[columnId].label;
    ghost.appendChild(ghostHeader);
    
    // Add sample cells (first 3 rows)
    const sampleRows = Math.min(3, allRows.length);
    for (let i = 0; i < sampleRows; i++) {
      const cells = allRows[i].querySelectorAll('td');
      const cellContent = cells[columnIndex]?.textContent || '';
      const ghostCell = document.createElement('div');
      ghostCell.style.padding = '6px 8px';
      ghostCell.style.borderBottom = '1px solid #e2e8f0';
      ghostCell.style.fontSize = '0.875rem';
      ghostCell.style.overflow = 'hidden';
      ghostCell.style.textOverflow = 'ellipsis';
      ghostCell.style.whiteSpace = 'nowrap';
      ghostCell.textContent = cellContent.substring(0, 30) + (cellContent.length > 30 ? '...' : '');
      ghost.appendChild(ghostCell);
    }
    
    // Add "..." indicator if more rows
    if (allRows.length > sampleRows) {
      const moreIndicator = document.createElement('div');
      moreIndicator.style.padding = '6px 8px';
      moreIndicator.style.color = '#64748b';
      moreIndicator.style.fontStyle = 'italic';
      moreIndicator.style.textAlign = 'center';
      moreIndicator.textContent = `+${allRows.length - sampleRows} lignes...`;
      ghost.appendChild(moreIndicator);
    }
    
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 20, 20);
    
    // Clean up ghost element after drag starts
    setTimeout(() => {
      document.body.removeChild(ghost);
    }, 0);
  }, [columnOrder, columnWidths]);

  const handleDragOver = useCallback((e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (columnId !== draggedColumn) {
      setDragOverColumn(columnId);
    }
  }, [draggedColumn]);

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedColumn || draggedColumn === targetColumnId) {
      handleDragEnd();
      return;
    }

    setColumnOrder(prevOrder => {
      const newOrder = [...prevOrder];
      const draggedIndex = newOrder.indexOf(draggedColumn);
      const targetIndex = newOrder.indexOf(targetColumnId);
      
      // Remove dragged column
      newOrder.splice(draggedIndex, 1);
      // Insert at new position
      newOrder.splice(targetIndex, 0, draggedColumn);
      
      return newOrder;
    });

    handleDragEnd();
  }, [draggedColumn, handleDragEnd]);

  // ============================================================================
  // RESIZE HANDLERS
  // ============================================================================
  const handleResizeStart = useCallback((e, columnId) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnId);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnId]);
  }, [columnWidths]);

  const handleResizeMove = useCallback((e) => {
    if (!resizingColumn) return;
    
    const delta = e.clientX - resizeStartX;
    const newWidth = Math.max(
      COLUMN_DEFINITIONS[resizingColumn].minWidth,
      Math.min(
        COLUMN_DEFINITIONS[resizingColumn].maxWidth,
        resizeStartWidth + delta
      )
    );
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  // ============================================================================
  // FILTER HANDLERS
  // ============================================================================
  const handleFilterChange = useCallback((columnId, value) => {
    const columnDef = COLUMN_DEFINITIONS[columnId];
    
    if (columnDef.filterable?.type === 'text' && columnDef.filterable.debounce) {
      setTempFilters(prev => ({ ...prev, [columnId]: value }));
      
      if (debounceTimers.current[columnId]) {
        clearTimeout(debounceTimers.current[columnId]);
      }
      
      debounceTimers.current[columnId] = setTimeout(() => {
        setFilters(prev => ({ ...prev, [columnId]: value }));
      }, columnDef.filterable.debounce);
    } else {
      setFilters(prev => ({ ...prev, [columnId]: value }));
    }
  }, []);

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // ============================================================================
  // FILTERING LOGIC
  // ============================================================================
  const filteredVulnerabilities = useMemo(() => {
    return vulnerabilities.filter(vuln => {
      return Object.entries(filters).every(([columnId, filterValue]) => {
        if (!filterValue || filterValue === 'all') return true;
        
        const columnDef = COLUMN_DEFINITIONS[columnId];
        if (!columnDef) return true;
        
        const cellValue = vuln[columnDef.exportKey];
        
        switch (columnDef.filterable?.type) {
          case 'text':
            return cellValue?.toString().toLowerCase().includes(filterValue.toLowerCase());
          
          case 'select':
            return cellValue === filterValue;
          
          case 'multiselect':
            if (Array.isArray(filterValue) && filterValue.length > 0) {
              return filterValue.some(val => cellValue?.toString().includes(val));
            }
            return true;
          
          case 'number':
            // Implement range filtering
            if (columnDef.filterable.mode === 'range' && typeof filterValue === 'object') {
              const numValue = parseFloat(cellValue);
              if (filterValue.min !== undefined && numValue < filterValue.min) return false;
              if (filterValue.max !== undefined && numValue > filterValue.max) return false;
            }
            return true;
          
          default:
            return true;
        }
      });
    });
  }, [vulnerabilities, filters]);

  // ============================================================================
  // PAGINATION
  // ============================================================================
  const paginatedVulnerabilities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVulnerabilities.slice(startIndex, endIndex);
  }, [filteredVulnerabilities, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVulnerabilities.length / itemsPerPage);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  const getSeverityColor = (severity) => {
    const colors = {
      'CRITICAL': '#dc2626',
      'HIGH': '#f97316',
      'MEDIUM': '#eab308',
      'LOW': '#84cc16',
    };
    return colors[severity] || '#64748b';
  };

  const getJustificationStatus = (vuln) => {
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
      const comments = vuln.comments
        ? (typeof vuln.comments === 'string'
            ? JSON.parse(vuln.comments)
            : vuln.comments)
        : [];

      return Array.isArray(comments) ? comments.length : 0;
    } catch (err) {
      return 0;
    }
  };

  const handleCheckboxChange = (vulnId) => {
    setSelectedCVEs((prev) =>
      prev.includes(vulnId)
        ? prev.filter((id) => id !== vulnId)
        : [...prev, vulnId]
    );
  };

  const handleBulkComment = () => {
    setBulkMode(true);
    setShowComments(true);
  };

  const fetchAttachmentsForVuln = async (vulnId) => {
    if (attachmentsByVuln[vulnId]) return; // Déjà chargé
    
    try {
      const attachments = await attachmentService.getAttachments(vulnId);
      setAttachmentsByVuln(prev => ({
        ...prev,
        [vulnId]: Array.isArray(attachments) ? attachments : []
      }));
    } catch (error) {
      logger.debug('No attachments for vulnerability:', vulnId);
      setAttachmentsByVuln(prev => ({
        ...prev,
        [vulnId]: []
      }));
    }
  };

  const handleCommentChange = (vulnId, newComment) => {
    setVulnerabilities(prev => 
      prev.map(v => v.id === vulnId ? { ...v, commentsAnalyst: newComment } : v)
    );
  };

  const handleCommentSave = async (vulnId, comment) => {
    try {
      
      await vulnerabilityService.updateCommentAnalyst(vulnId, comment);
      
      console.log(`✅ Commentaire sauvegardé pour la vulnérabilité ${vulnId}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du commentaire:', error);
      // Recharger seulement les vulnérabilités de cet asset
      fetchVulnerabilities();
    }
  };

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

  const handleValidityChange = async (vulnId, newStatus) => {
    try {
      setVulnerabilities(prev =>
        prev.map(v => v.id === vulnId ? { ...v, validityStatus: newStatus } : v)
      );

      await api.patch(`/vulnerabilities/${vulnId}/validity-status`, {
        validityStatus: newStatus
      });

      console.log(`✅ Statut "Utilisé" mis à jour pour la vulnérabilité ${vulnId}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      fetchVulnerabilities();
    }
  };

  const handleRssiStatusChange = async (vulnId, newStatus) => {
    try {
      setVulnerabilities(prev =>
        prev.map(v => v.id === vulnId ? { ...v, rssiStatus: newStatus } : v)
      );

      await api.patch(`/vulnerabilities/${vulnId}/rssi-status`, {
        rssiStatus: newStatus
      });

      console.log(`✅ Statut RSSI mis à jour pour la vulnérabilité ${vulnId}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut RSSI:', error);
      fetchVulnerabilities();
    }
  };

  const handleMetierStatusChange = async (vulnId, newStatus) => {
    try {
      setVulnerabilities(prev =>
        prev.map(v => v.id === vulnId ? { ...v, metierStatus: newStatus } : v)
      );

      await api.patch(`/vulnerabilities/${vulnId}/metier-status`, {
        metierStatus: newStatus
      });

      console.log(`✅ Statut Métier mis à jour pour la vulnérabilité ${vulnId}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut métier:', error);
      fetchVulnerabilities();
    }
  };

  const handlers = {
    getSeverityColor,
    cweDescriptions,
    cweNames,
    selectedCVEs,
    attachmentsByVuln,
    fetchAttachmentsForVuln,
    handleCheckboxChange,
    getCommentCount,
    handleBulkComment,
    handleCommentChange,
    handleCommentSave,
    handleValidityChange,
    handleRssiStatusChange,
    handleMetierStatusChange,
    setSelectedVuln,
    setBulkMode,
    setShowComments,
    setShowCalculator,
    handleDownloadAttachment: async (attachmentId, filename) => {
      try {
        const response = await attachmentService.downloadAttachment(attachmentId);
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        alert('Erreur lors du téléchargement de la pièce jointe');
      }
    },
    handleUploadAttachment: async (vulnId, file) => {
      // Validation de la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (max 10MB)');
        return;
      }
      
      // Validation du type de fichier
      const allowedTypes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                           'application/msword'];
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|txt|png|jpe?g|docx?|doc)$/i)) {
        alert('Type de fichier non autorisé. Formats acceptés: PDF, TXT, PNG, JPG, DOCX, DOC');
        return;
      }
      
      try {
        const uploadedBy = 'User'; // TODO: récupérer l'utilisateur connecté
        await attachmentService.uploadAttachment(vulnId, file, uploadedBy, '');
        
        // Recharger les attachments pour cette vulnérabilité
        const attachments = await attachmentService.getAttachments(vulnId);
        setAttachmentsByVuln(prev => ({
          ...prev,
          [vulnId]: Array.isArray(attachments) ? attachments : []
        }));
        
        console.log('✅ Pièce jointe ajoutée avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        alert('Erreur lors de l\'ajout de la pièce jointe');
      }
    },
    handleDeleteAttachment: async (vulnId, attachmentId) => {
      try {
        await attachmentService.deleteAttachment(attachmentId);
        
        // Recharger les attachments pour cette vulnérabilité
        const attachments = await attachmentService.getAttachments(vulnId);
        setAttachmentsByVuln(prev => ({
          ...prev,
          [vulnId]: Array.isArray(attachments) ? attachments : []
        }));
        
        console.log('✅ Pièce jointe supprimée avec succès');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la pièce jointe');
      }
    },
  };

  // ============================================================================
  // RENDER FILTER COMPONENT
  // ============================================================================
  const renderFilter = (columnId) => {
    const columnDef = COLUMN_DEFINITIONS[columnId];
    if (!columnDef.filterable) return null;

    const filterConfig = columnDef.filterable;
    const currentValue = tempFilters[columnId] ?? filters[columnId] ?? '';

    switch (filterConfig.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={filterConfig.placeholder || 'Filtrer...'}
            value={currentValue}
            onChange={(e) => handleFilterChange(columnId, e.target.value)}
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        );

      case 'select':
        const options = filterConfig.options.length > 0 
          ? filterConfig.options 
          : ['all', ...new Set(vulnerabilities.map(v => v[columnDef.exportKey]).filter(Boolean))];
        
        return (
          <select
            value={currentValue}
            onChange={(e) => handleFilterChange(columnId, e.target.value)}
            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="all">Tous</option>
            {options.filter(opt => opt !== 'all').map(option => {
              // Handle both string options and {value, label} objects
              const optValue = typeof option === 'object' ? option.value : option;
              const optLabel = typeof option === 'object' ? option.label : option;
              return (
                <option key={optValue} value={optValue}>{optLabel}</option>
              );
            })}
          </select>
        );

      case 'number':
        if (filterConfig.mode === 'range') {
          return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                placeholder="Min"
                min={filterConfig.min}
                max={filterConfig.max}
                step={filterConfig.step}
                value={currentValue?.min ?? ''}
                onChange={(e) => handleFilterChange(columnId, {
                  ...currentValue,
                  min: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="w-16 px-1 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                min={filterConfig.min}
                max={filterConfig.max}
                step={filterConfig.step}
                value={currentValue?.max ?? ''}
                onChange={(e) => handleFilterChange(columnId, {
                  ...currentValue,
                  max: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="w-16 px-1 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500 text-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Chargement des vulnérabilités consolidées...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 sticky top-0 bg-white z-20 py-4 border-b border-slate-200 shadow-sm">
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => navigate('/assets')} 
            className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-2 text-sm w-fit"
          >
            ← Retour aux Assets
          </button>
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-slate-900 m-0">
              Vulnérabilités Consolidées - {assetName}
            </h1>
            
            {/* Stats in Header */}
            <div className="flex items-center gap-4 border-l border-slate-200 pl-4">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 leading-none">{filteredVulnerabilities.length}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Vulnérabilités</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 leading-none">{new Set(filteredVulnerabilities.map(v => v.cveId)).size}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">CVE Uniques</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/vulnerabilities-export/${assetName}`)}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 font-medium flex items-center gap-2 text-sm transition-colors"
          >
            Aller à l'export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)]">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse text-left relative">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr>
                {columnOrder
                  .filter(colId => visibleColumns.includes(colId))
                  .map(columnId => {
                    const columnDef = COLUMN_DEFINITIONS[columnId];
                    const isDragging = draggedColumn === columnId;
                    const isDragOver = dragOverColumn === columnId;

                    return (
                      <th
                        key={columnId}
                        draggable={columnDef.draggable}
                        onDragStart={(e) => handleDragStart(e, columnId)}
                        onDragOver={(e) => handleDragOver(e, columnId)}
                        onDrop={(e) => handleDrop(e, columnId)}
                        onDragEnd={handleDragEnd}
                        style={{
                          width: `${columnWidths[columnId]}px`,
                          minWidth: `${columnDef.minWidth}px`,
                          maxWidth: `${columnDef.maxWidth}px`,
                        }}
                        className={`
                          bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider relative select-none
                          ${isDragging ? 'opacity-50' : ''}
                          ${isDragOver ? 'border-l-4 border-blue-500' : ''}
                          ${resizingColumn === columnId ? 'bg-slate-100' : ''}
                        `}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            {columnDef.draggable && <span className="cursor-move text-slate-400 hover:text-slate-600">⋮⋮</span>}
                            <span>{columnDef.label}</span>
                          </div>
                          {columnDef.filterable && (
                            <div className="mt-1">
                              {renderFilter(columnId)}
                            </div>
                          )}
                        </div>
                        
                        {columnDef.resizable && (
                          <div
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 transition-colors"
                            onMouseDown={(e) => handleResizeStart(e, columnId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </th>
                    );
                  })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(() => {
                // Expand vulnerabilities - one row per CWE (like CyberwatchTable)
                const expandedRows = [];
                paginatedVulnerabilities.forEach((vuln, idx) => {
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

                return expandedRows.map((vuln, idx) => (
                  <tr key={vuln.rowKey || idx} className="hover:bg-slate-50 transition-colors">
                    {columnOrder
                      .filter(colId => visibleColumns.includes(colId))
                      .map((columnId, colIdx) => {
                        const columnDef = COLUMN_DEFINITIONS[columnId];
                        const isDraggedColumn = draggedColumn === columnId;
                        
                        return (
                          <td
                            key={columnId}
                            className={`
                              px-4 py-3 text-sm text-slate-700 border-b border-slate-100 whitespace-nowrap
                              ${isDraggedColumn ? 'bg-blue-50 opacity-50' : ''}
                            `}
                            style={{
                              width: `${columnWidths[columnId]}px`,
                              minWidth: `${columnDef.minWidth}px`,
                              maxWidth: `${columnDef.maxWidth}px`,
                              cursor: 'default',
                              userSelect: 'none',
                            }}
                          >
                            {typeof columnDef.render === 'function'
                              ? columnDef.render(vuln, handlers)
                              : vuln[columnDef.exportKey] || '-'}
                          </td>
                        );
                      })}
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="text-sm text-slate-600">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="px-3 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
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

      {showComments && (
        <CommentsModal
          vulnerability={selectedVuln}
          selectedCVEs={selectedCVEs}
          bulkMode={bulkMode}
          onClose={() => {
            setShowComments(false);
            setBulkMode(false);
            setSelectedCVEs([]);
            fetchVulnerabilities();
          }}
        />
      )}
    </div>
  );
}

export default ConsolidatedVulnerabilities;
export { COLUMN_DEFINITIONS };
