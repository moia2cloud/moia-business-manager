import { useState } from 'react';
import { Lock, LogIn, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('moia_token', data.token);
        
        // After login, we fetch the state from the backend
        const storeRes = await fetch('/api/store', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        
        if (storeRes.ok) {
          const storeData = await storeRes.json();
          
          // If the backend has state, inject it into Zustand
          if (Object.keys(storeData).length > 0) {
            useStore.setState(storeData);
          }
          
          // Signal to the SyncProvider that we are authenticated
          useStore.setState({ isHydratedFromBackend: true });
          navigate('/');
        } else {
          setError('Failed to load store data');
        }
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-main)',
      padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <img src="/moia logo.png" alt="MOIA Logo" style={{ width: '180px', height: 'auto', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>تسجيل الدخول</h1>
          <p style={{ color: 'var(--text-muted)' }}>أدخل بياناتك للوصول لنظام إدارة الأعمال</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}>
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'right' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم المستخدم</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}
              placeholder="مثال: admin"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', paddingRight: '2.5rem' }}
                placeholder="********"
              />
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem', justifyContent: 'center' }}
            disabled={isLoading}
          >
            {isLoading ? 'جاري التحقق...' : <><LogIn size={20} /> دخول للنظام</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
