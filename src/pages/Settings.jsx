import { useState, useEffect } from 'react';
import { Save, Building2, CreditCard } from 'lucide-react';
import useStore from '../store/useStore';

const Settings = () => {
  const { companySettings, updateCompanySettings } = useStore();
  const [settings, setSettings] = useState(companySettings);

  // Sync state if store updates externally
  useEffect(() => {
    setSettings(companySettings);
  }, [companySettings]);

  const handleSave = (e) => {
    e.preventDefault();
    updateCompanySettings(settings);
    alert('تم حفظ الإعدادات بنجاح');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <header>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>الإعدادات</h1>
        <p style={{ color: 'var(--text-muted)' }}>إدارة معلومات شركتك وحساباتك البنكية</p>
      </header>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Company Info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <Building2 size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>معلومات الشركة</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم الشركة (Company Name)</label>
              <input required type="text" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>البريد الإلكتروني (Email)</label>
              <input type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>رقم الهاتف (Phone)</label>
              <input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>العنوان (Address)</label>
              <textarea value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} rows="2"></textarea>
            </div>
          </div>
        </div>

        {/* Banking Info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <CreditCard size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>معلومات الدفع (تظهر في الفواتير)</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم البنك (Bank Name)</label>
              <input type="text" value={settings.bankName} onChange={e => setSettings({...settings, bankName: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم الحساب (Account Name)</label>
              <input type="text" value={settings.accountName} onChange={e => setSettings({...settings, accountName: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>الاسم المستعار (CliQ / Payment Alias)</label>
              <input type="text" value={settings.paymentAlias} onChange={e => setSettings({...settings, paymentAlias: e.target.value})} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
            <Save size={20} /> حفظ الإعدادات
          </button>
        </div>

      </form>
    </div>
  );
};

export default Settings;
