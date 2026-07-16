import { useState, useEffect, useRef } from 'react';
import { Save, Building2, CreditCard, Download, UploadCloud } from 'lucide-react';
import useStore from '../store/useStore';

const Settings = () => {
  const { companySettings, updateCompanySettings } = useStore();
  const [settings, setSettings] = useState(companySettings);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state if store updates externally
  useEffect(() => {
    setSettings(companySettings);
  }, [companySettings]);

  const handleSave = (e) => {
    e.preventDefault();
    updateCompanySettings(settings);
    alert('تم حفظ الإعدادات بنجاح');
  };

  const handleBackup = () => {
    const data = localStorage.getItem('moia-business-storage');
    if (!data) return alert('لا يوجد بيانات لنسخها احتياطياً');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moia_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
      alert('الرجاء اختيار ملف zip يحتوي على التحديثات');
      return;
    }

    const confirmUpdate = window.confirm('هل أنت متأكد من رغبتك في تثبيت هذا التحديث؟ قد يتوقف النظام لعدة ثواني أثناء العملية.');
    if (!confirmUpdate) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUpdating(true);
    const formData = new FormData();
    formData.append('updateFile', file);

    try {
      const token = localStorage.getItem('moia_token');
      const response = await fetch('http://localhost:3001/api/update', { // Note: using relative path in production
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('تم رفع وتثبيت التحديث بنجاح! سيتم إعادة تحميل الصفحة الآن.');
        setTimeout(() => {
          window.location.reload();
        }, 3000); // Give server 3 seconds to restart
      } else {
        alert('حدث خطأ أثناء التحديث: ' + result.error);
        setIsUpdating(false);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('فشل الاتصال بالسيرفر أثناء التحديث.');
      setIsUpdating(false);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <header>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>الإعدادات</h1>
        <p style={{ color: 'var(--text-muted)' }}>إدارة معلومات شركتك وحساباتك البنكية والتحديثات</p>
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

        {/* System Update */}
        <div className="card" style={{ border: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <UploadCloud size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>تحديث النظام (OTA Update)</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            يمكنك رفع ملف التحديث بصيغة <strong style={{color: 'var(--text)'}}>.zip</strong> هنا. سيقوم السيرفر بفك الضغط وتحديث نفسه تلقائياً دون الحاجة للتدخل اليدوي.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input 
              type="file" 
              accept=".zip" 
              ref={fileInputRef}
              onChange={handleUpdate}
              style={{ display: 'none' }} 
              id="update-upload"
            />
            <label 
              htmlFor="update-upload" 
              className={`btn btn-secondary ${isUpdating ? 'disabled' : ''}`}
              style={{ padding: '0.75rem 1.5rem', cursor: isUpdating ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px dashed var(--primary)' }}
            >
              <UploadCloud size={20} />
              {isUpdating ? 'جاري رفع وتثبيت التحديث...' : 'اختر ملف التحديث (.zip)'}
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={handleBackup}>
            <Download size={20} /> تنزيل نسخة احتياطية
          </button>
          <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Save size={20} /> حفظ الإعدادات
          </button>
        </div>

      </form>
    </div>
  );
};

export default Settings;
