import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function Layout({ children, currentView, setCurrentView }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar 
        isOpen={sidebarOpen} 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />
      <main className={`flex-1 min-w-0 mt-16 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[calc(100vh-64px)] ${sidebarOpen ? 'ml-[280px]' : 'ml-0'} max-lg:ml-0`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;