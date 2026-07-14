import { Navigate, Outlet } from 'react-router-dom';
import useStore from '../store/useStore';
import { useEffect, useState } from 'react';

const ProtectedRoute = () => {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isHydratedFromBackend = useStore((state) => state.isHydratedFromBackend);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('moia_token');
      if (!token) {
        setIsValidating(false);
        setIsAuthenticated(false);
        return;
      }

      // If already hydrated in this session, don't re-fetch from server
      if (isHydratedFromBackend) {
        setIsAuthenticated(true);
        setIsValidating(false);
        return;
      }

      try {
        const res = await fetch('/api/store', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const storeData = await res.json();
          
          // Sync backend data to store if it exists
          if (Object.keys(storeData).length > 0) {
            useStore.setState(storeData);
          }
          
          useStore.setState({ isHydratedFromBackend: true });
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('moia_token');
        }
      } catch (err) {
        console.error(err);
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    checkAuth();
  }, [isHydratedFromBackend]);

  if (isValidating) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
