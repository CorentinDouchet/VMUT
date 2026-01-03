import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CyberwatchTable from './components/CyberwatchTable';
import XmlReport from './components/XmlReport';
import EncyclopedieCVE from './components/EncyclopedieCVE';
import CVEDetail from './components/CVEDetail';
import Assets from './components/Assets';
import AssetDetail from './components/AssetDetail';
import AssetHierarchy from './components/AssetHierarchy';
import ConsolidatedVulnerabilities from './components/ConsolidatedVulnerabilities_enhanced';
import Statistics from './components/Statistics';
import './styles/index.css';

import HistoriqueCVE from './components/HistoriqueCVE';
import Journal from './components/Journal';
import ScanUpload from './components/ScanUpload';
import OpenVASUpload from './components/OpenVASUpload';
import PivotUpload from './components/PivotUpload';
import PivotTable from './components/PivotTable';
import ActionsCorrectives from './components/ActionsCorrectives';
import ReglesConformite from './components/ReglesConformite';
import SecurityDefaults from './components/SecurityDefaults';
import Obsolescence from './components/Obsolescence';
import TemplateManager from './components/TemplateManager';
import AdminImport from './components/AdminImport';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import GroupManagement from './components/GroupManagement';
import ImportHistory from './components/ImportHistory';
import ProtectedRoute from './components/ProtectedRoute';
import VulnerabilitiesExport from './components/VulnerabilitiesExport';
import About from './components/About';
import CpeMapping from './components/CpeMapping';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
  }

  // Si pas connecté, afficher uniquement la page de login
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Routes accessibles à tous les utilisateurs authentifiés */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/cyberwatch/:scanName" element={<ProtectedRoute><CyberwatchTable /></ProtectedRoute>} />
        <Route path="/vulnerabilities-consolidated/:assetName" element={<ProtectedRoute><ConsolidatedVulnerabilities /></ProtectedRoute>} />
        <Route path="/vulnerabilities-export/:assetName" element={<ProtectedRoute><VulnerabilitiesExport /></ProtectedRoute>} />
        <Route path="/xml-report/:scanName" element={<ProtectedRoute><XmlReport /></ProtectedRoute>} />
        <Route path="/encyclopedie" element={<ProtectedRoute><EncyclopedieCVE /></ProtectedRoute>} />
        <Route path="/cve/:cveId" element={<ProtectedRoute><CVEDetail /></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/assets/:assetName" element={<ProtectedRoute><AssetDetail /></ProtectedRoute>} />
        <Route path="/asset-hierarchy" element={<ProtectedRoute><AssetHierarchy /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
        <Route path="/historique-cve" element={<ProtectedRoute><HistoriqueCVE /></ProtectedRoute>} />
        <Route path="/actions-correctives" element={<ProtectedRoute><ActionsCorrectives /></ProtectedRoute>} />
        <Route path="/regles-conformite" element={<ProtectedRoute><ReglesConformite /></ProtectedRoute>} />
        <Route path="/defauts-securite" element={<ProtectedRoute><Obsolescence /></ProtectedRoute>} />
        <Route path="/pivot/:scanName" element={<ProtectedRoute><PivotTable /></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
        
        {/* Routes réservées aux AUTEUR et MAINTENANCE (import de scans) */}
        <Route path="/upload-scan" element={<ProtectedRoute roles={['AUTEUR', 'MAINTENANCE']}><ScanUpload /></ProtectedRoute>} />
        <Route path="/upload-openvas" element={<ProtectedRoute roles={['AUTEUR', 'MAINTENANCE']}><OpenVASUpload /></ProtectedRoute>} />
        <Route path="/upload-pivot" element={<ProtectedRoute roles={['AUTEUR', 'MAINTENANCE']}><PivotUpload /></ProtectedRoute>} />
        
        {/* Routes réservées aux AUTEUR, ADMINISTRATEUR et MAINTENANCE (mapping CPE) */}
        <Route path="/cpe-mapping" element={<ProtectedRoute roles={['AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE']}><CpeMapping /></ProtectedRoute>} />
        
        {/* Routes réservées à MAINTENANCE uniquement */}
        <Route path="/journal" element={<ProtectedRoute roles={['MAINTENANCE']}><Journal /></ProtectedRoute>} />
        <Route path="/admin/import-cve" element={<ProtectedRoute roles={['MAINTENANCE']}><AdminImport /></ProtectedRoute>} />
        <Route path="/admin/import-history" element={<ProtectedRoute roles={['MAINTENANCE']}><ImportHistory /></ProtectedRoute>} />
        <Route path="/admin/templates" element={<ProtectedRoute roles={['AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE']}><TemplateManager /></ProtectedRoute>} />
        
        {/* Routes réservées aux ADMINISTRATEUR et MAINTENANCE (gestion utilisateurs) */}
        <Route path="/users" element={<ProtectedRoute roles={['ADMINISTRATEUR', 'MAINTENANCE']}><UserManagement /></ProtectedRoute>} />
        
        {/* Routes réservées aux ADMINISTRATEUR et MAINTENANCE (gestion groupes) */}
        <Route path="/groups" element={<ProtectedRoute roles={['ADMINISTRATEUR', 'MAINTENANCE']}><GroupManagement /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;