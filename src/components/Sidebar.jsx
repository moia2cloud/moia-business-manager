import { NavLink, useNavigate } from 'react-router-dom';
import { Settings, X, LogOut, Trash2 } from 'lucide-react';
import '../index.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const navItems = [
    { name: 'لوحة القيادة', path: '/', iconSrc: '/icons/wired-outline-3499-line-chart-markers-hover-slide.json' },
    { name: 'المشاريع', path: '/projects', iconSrc: '/icons/wired-outline-978-project-management-hover-pinch.json' },
    { name: 'العملاء', path: '/clients', iconSrc: '/icons/wired-outline-271-three-male-avatars-hover-nodding.json' },
    { name: 'الفواتير', path: '/invoices', iconSrc: '/icons/wired-outline-755-invoice-receipt-validating-ticket-hover-pinch.json' },
    { name: 'إصدار فاتورة', path: '/invoice-builder', iconSrc: '/icons/wired-outline-755-invoice-receipt-validating-ticket-hover-pinch.json' },
    { name: 'الخدمات (الأسعار)', path: '/services', iconSrc: '/icons/wired-outline-947-investment-hover-pinch.json' },
    { name: 'المصاريف', path: '/expenses', iconSrc: '/icons/wired-outline-421-wallet-purse-hover-pinch.json' },
    { name: 'سلة المهملات', path: '/recycle-bin', isTrash: true },
    { name: 'الإعدادات', path: '/settings', isLucide: true }
  ];

  return (
    <aside style={{
      width: '280px',
      backgroundColor: 'var(--bg-sidebar)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      flexShrink: 0,
      borderLeft: '1px solid var(--border-color)',
      zIndex: 50
    }} className={`no-print sidebar ${isOpen ? 'open' : ''}`}>
      
      {/* Mobile Close Button */}
      <div className="mobile-close-btn" style={{ display: 'none', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => setIsOpen(false)} style={{ color: 'white' }}>
          <X size={28} />
        </button>
      </div>

      {/* Brand Logo Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <img src="/moia-media.png" alt="MOIA Media Logo" style={{ width: '160px', height: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '4px', fontFamily: 'var(--font-en)', fontWeight: 800, marginTop: '-5px', marginLeft: '35px' }}>MANAGER</span>
      </div>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              color: isActive ? '#FFFFFF' : '#A5B4FC',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '1.05rem',
              backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
              borderRight: isActive ? '4px solid var(--accent)' : '4px solid transparent',
              transition: 'var(--transition)'
            })}
          >
            {item.isLucide ? (
              <Settings size={30} />
            ) : item.isTrash ? (
              <Trash2 size={30} />
            ) : (
              <lord-icon
                src={item.iconSrc}
                trigger="hover"
                colors="primary:#ffffff,secondary:#FFC72C"
                style={{ width: '32px', height: '32px' }}>
              </lord-icon>
            )}
            <span style={{ paddingTop: '5px' }}>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          onClick={() => {
            localStorage.removeItem('moia_token');
            navigate('/login');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', color: '#fca5a5', backgroundColor: 'transparent', border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer', transition: 'var(--transition)' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={24} />
          <span style={{ paddingTop: '5px' }}>تسجيل الخروج</span>
        </button>

        {/* Footer Area */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.75rem', color: '#64748B' }}>
          CRM & Finance System v1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
