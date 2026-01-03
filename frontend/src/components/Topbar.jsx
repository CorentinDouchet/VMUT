import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-white/10 flex items-center px-6 z-[100] shadow-md">
      <div className="flex items-center gap-4">
        <button 
          className="bg-transparent border-none text-white text-2xl cursor-pointer p-2 rounded-md transition-all hover:bg-white/10" 
          onClick={onMenuToggle}
        >
          ☰
        </button>
        <div className="flex items-center gap-3 no-underline">
          <h1 className="text-white text-xl font-bold tracking-tight m-0">VMUT Gestion des vulnérabilités</h1>
        </div>
      </div>
      <div className="flex items-center gap-4 ml-auto">
        {user && (
          <>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-white font-medium text-sm">{user.fullName}</span>
              <span className="text-white font-medium text-sm">{user.username}</span>
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{user.role}</span>
            </div>
            <button 
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-sm font-medium cursor-pointer transition-all hover:bg-red-500 hover:text-white" 
              onClick={handleLogout} 
              title="Se déconnecter"
            >
              Déconnexion
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Topbar;