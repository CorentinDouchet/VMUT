import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Sidebar({ isOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, hasAnyRole } = useAuth();

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (path === '/assets') {
      return location.pathname === '/assets' || location.pathname.startsWith('/assets/');
    }
    if (path === '/actions-correctives') {
      return location.pathname === '/actions-correctives';
    }
    if (path === '/regles-conformite') {
      return location.pathname === '/regles-conformite';
    }
    if (path === '/defauts-securite') {
      return location.pathname === '/defauts-securite';
    }
    if (path === '/admin/import-cve') {
      return location.pathname === '/admin/import-cve';
    }
    if (path === '/admin/templates') {
      return location.pathname === '/admin/templates';
    }
    if (path === '/users') {
      return location.pathname === '/users';
    }
    if (path === '/groups') {
      return location.pathname === '/groups';
    }
    if (path === '/about') {
      return location.pathname === '/about';
    }
    return location.pathname.startsWith(path);
  };

  const getItemClass = (path) => {
    const active = isActive(path);
    return `cursor-pointer px-6 py-3 flex items-center gap-3 text-[15px] transition-all border-l-[3px] select-none ${
      active 
        ? 'bg-blue-100 text-blue-500 border-l-blue-500 font-semibold' 
        : 'text-slate-500 border-transparent font-medium hover:bg-slate-100 hover:text-slate-900'
    }`;
  };

  return (
    <aside className={`fixed left-0 top-16 bottom-0 w-[280px] bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 shadow-sm ${!isOpen ? '-translate-x-full' : ''}`}>
      <div className="py-6">
        <div className="mb-8">
          <ul className="list-none">
            <li 
              className={getItemClass('/dashboard')}
              onClick={() => navigate('/dashboard')}
            >
              <span>Tableau de Bord</span>
            </li>
          </ul>

          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-6 mt-5 mb-2">Actifs</h3>
          <ul className="list-none">
            <li 
              className={getItemClass('/assets')}
              onClick={() => navigate('/assets')}
            >
              <span>Assets</span>
            </li>
            <li 
              className={getItemClass('/asset-hierarchy')}
              onClick={() => navigate('/asset-hierarchy')}
            >
              <span>Hiérarchie Assets</span>
            </li>
            <li
              className={getItemClass('/historique-cve')}
              onClick={() => navigate('/historique-cve')}
            >
              <span>Historique des justifications</span>
            </li>
            

            {hasAnyRole(['AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE']) && (
              <li
                className={getItemClass('/cpe-mapping')}
                onClick={() => navigate('/cpe-mapping')}
              >
                <span>Mapping CPE</span>
              </li>
            )}
          </ul>

          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-6 mt-5 mb-2">Encyclopédie</h3>
          <ul className="list-none">
            <li
              className={getItemClass('/encyclopedie')}
              onClick={() => navigate('/encyclopedie')}
            >
              <span>Encyclopédie CVE</span>
            </li>
          </ul>

          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-6 mt-5 mb-2">Défauts de sécurité</h3>
          
          <ul className="list-none">
            <li
              className={getItemClass('/defauts-securite')}
              onClick={() => navigate('/defauts-securite')}
            >
              <span>Obsolescence</span>
            </li>
            <li
              className={getItemClass('/actions-correctives')}
              onClick={() => navigate('/actions-correctives')}
            >
              <span>Actions correctives</span>
            </li>
            <li
              className={getItemClass('/regles-conformite')}
              onClick={() => navigate('/regles-conformite')}
            >
              <span>Règles de conformité</span>
            </li>
          </ul>

          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-6 mt-5 mb-2">Export</h3>
          <ul className="list-none">
            <li
              className={getItemClass('/admin/templates')}
              onClick={() => navigate('/admin/templates')}
            >
              <span>Templates d'export</span>
            </li>
          </ul>

          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-6 mt-5 mb-2">Import CVE</h3>
          <ul className="list-none">
            {/* Import CVE : uniquement MAINTENANCE */}
            {hasRole('MAINTENANCE') && (
              <>
                <li
                  className={getItemClass('/admin/import-cve')}
                  onClick={() => navigate('/admin/import-cve')}
                >
                  <span>Import CVE</span>
                </li>
                <li
                  className={getItemClass('/admin/import-history')}
                  onClick={() => navigate('/admin/import-history')}
                >
                  <span>Historique Imports</span>
                </li>
              </>
            )}
          </ul>

          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-6 mt-5 mb-2">Gestion utilisateurs</h3>
          <ul className="list-none">
            {hasAnyRole(['ADMINISTRATEUR', 'MAINTENANCE']) && (
              <li
                className={getItemClass('/users')}
                onClick={() => navigate('/users')}
              >
                <span>Gestion des utilisateurs</span>
              </li>
            )}
            
            {hasAnyRole(['ADMINISTRATEUR', 'MAINTENANCE']) && (
              <li
                className={getItemClass('/groups')}
                onClick={() => navigate('/groups')}
              >
                <span>Gestion des groupes</span>
              </li>
            )}
                       
            {hasRole('MAINTENANCE') && (
              <li
                className={getItemClass('/journal')}
                onClick={() => navigate('/journal')}  
              >
                <span>Journal d'audit</span>
              </li>
            )}
          </ul>

          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-6 mt-5 mb-2">Informations</h3>
          <ul className="list-none">
            <li
              className={getItemClass('/about')}
              onClick={() => navigate('/about')}
            >
              <span>À propos</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;