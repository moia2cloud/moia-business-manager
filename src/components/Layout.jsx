import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/moia-media.png" alt="MOIA Media Logo" style={{ width: '100px', height: 'auto', objectFit: 'contain' }} />
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ color: 'white', padding: '0.5rem', background: 'transparent' }}
        >
          <Menu size={28} />
        </button>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, width: '100%', position: 'relative' }}>
        {/* Sidebar Overlay */}
        <div 
          className={`sidebar-overlay no-print ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
        
        <main className="main-area-container print-main-area main-content-padding" style={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          height: '100%',
          position: 'relative',
          width: '100%'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
