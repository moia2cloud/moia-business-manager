import { useState, useEffect, useRef } from 'react';
import { Save, Building2, CreditCard, Download, UploadCloud, RotateCcw, Upload, AlertTriangle } from 'lucide-react';
import useStore from '../store/useStore';
import ConfirmSliderModal from '../components/ConfirmSliderModal';

const Settings = () => {
  const { companySettings, updateCompanySettings } = useStore();
  const [settings, setSettings] = useState(companySettings);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasDataRollback, setHasDataRollback] = useState(false);
  const [hasSystemRollback, setHasSystemRollback] = useState(false);
  const fileInputRef = useRef(null);
  const restoreDataInputRef = useRef(null);
  
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  // Sync state if store updates externally
  useEffect(() => {
    setSettings(companySettings);
    // Check if there is a data rollback available
    if (localStorage.getItem('moia-business-rollback')) {
      setHasDataRollback(true);
    }
    
    // Check if there is a system rollback available
    const checkSystemRollback = async () => {
      try {
        const token = localStorage.getItem('moia_token');
        const res = await fetch('http://localhost:3001/api/check-rollback', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHasSystemRollback(data.hasRollback);
        }
      } catch (err) {
        console.error('Failed to check rollback status', err);
      }
    };
    checkSystemRollback();
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

  const executeRestoreData = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target.result;
        JSON.parse(jsonData); // validate json
        
        // Take rollback snapshot
        const currentData = localStorage.getItem('moia-business-storage');
        if (currentData) {
          localStorage.setItem('moia-business-rollback', currentData);
          setHasDataRollback(true);
        }

        // Apply new data
        localStorage.setItem('moia-business-storage', jsonData);
        alert('تمت استعادة البيانات بنجاح! سيتم تحديث الصفحة.');
        window.location.reload();
      } catch (err) {
        alert('الملف المرفوع تالف أو غير صالح.');
      }
    };
    reader.readAsText(file);
    if (restoreDataInputRef.current) restoreDataInputRef.current.value = '';
  };

  const handleRestoreData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('الرجاء اختيار ملف .json صالح');
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'استعادة البيانات',
      description: 'هذه العملية ستستبدل بياناتك الحالية بالبيانات المرفوعة. لا تقلق، سيتم حفظ نسخة احتياطية فورية قبل الاستبدال.',
      onConfirm: () => executeRestoreData(file),
      onCancel: () => { if (restoreDataInputRef.current) restoreDataInputRef.current.value = ''; }
    });
  };

  const executeUndoRestore = () => {
    const rollbackData = localStorage.getItem('moia-business-rollback');
    if (rollbackData) {
      localStorage.setItem('moia-business-storage', rollbackData);
      localStorage.removeItem('moia-business-rollback');
      alert('تم التراجع عن الاستعادة بنجاح. سيتم تحديث الصفحة.');
      window.location.reload();
    }
  };

  const handleUndoRestore = () => {
    setModalConfig({
      isOpen: true,
      title: 'التراجع عن الاستعادة',
      description: 'هل أنت متأكد من رغبتك في التراجع واستعادة بياناتك السابقة؟',
      onConfirm: executeUndoRestore,
      onCancel: () => {}
    });
  };

  const executeUpdate = async (file) => {
    setIsUpdating(true);
    const formData = new FormData();
    formData.append('updateFile', file);

    try {
      const token = localStorage.getItem('moia_token');
      const response = await fetch('http://localhost:3001/api/update', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('تم رفع وتثبيت التحديث بنجاح! سيتم إعادة تحميل الصفحة الآن.');
        setTimeout(() => { window.location.reload(); }, 3000); 
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

  const handleUpdate = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.zip')) {
      alert('الرجاء اختيار ملف zip يحتوي على التحديثات');
      return;
    }

    setModalConfig({
      isOpen: true,
      title: 'تثبيت التحديث',
      description: 'أنت على وشك تثبيت تحديث جديد للنظام. سيقوم النظام بإنشاء نقطة استعادة تلقائية قبل التحديث تحسباً لأي طارئ. قد يتوقف النظام لثوانٍ معدودة.',
      onConfirm: () => executeUpdate(file),
      onCancel: () => { if (fileInputRef.current) fileInputRef.current.value = ''; }
    });
  };

  const executeSystemRollback = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('moia_token');
      const response = await fetch('http://localhost:3001/api/rollback', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (response.ok) {
        alert('تم استرجاع النظام السابق بنجاح! سيتم إعادة تحميل الصفحة...');
        setTimeout(() => { window.location.reload(); }, 3000);
      } else {
        alert('خطأ: ' + result.error);
        setIsUpdating(false);
      }
    } catch (err) {
      console.error('Rollback error:', err);
      alert('فشل الاتصال بالسيرفر أثناء الاسترجاع.');
      setIsUpdating(false);
    }
  };

  const handleSystemRollback = () => {
    setModalConfig({
      isOpen: true,
      title: 'تنبيه خطير: استرجاع النظام',
      description: 'هذه العملية ستعيد النظام بأكمله إلى آخر نسخة سابقة (Rollback) وتمسح التحديث الأخير. تأكد من أنك تريد القيام بذلك.',
      onConfirm: executeSystemRollback,
      onCancel: () => {}
    });
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

        {/* Data & Backup */}
        <div className="card" style={{ border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <Save size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>إدارة البيانات</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={handleBackup}>
              <Download size={20} /> تنزيل نسخة احتياطية
            </button>
            
            <input 
              type="file" 
              accept=".json" 
              ref={restoreDataInputRef}
              onChange={handleRestoreData}
              style={{ display: 'none' }} 
              id="restore-upload"
            />
            <label 
              htmlFor="restore-upload" 
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Upload size={20} /> رفع نسخة احتياطية (استعادة)
            </label>

            {hasDataRollback && (
              <button type="button" onClick={handleUndoRestore} style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                <RotateCcw size={20} /> تراجع عن آخر استعادة
              </button>
            )}
          </div>
        </div>

        {/* System Update & Rollback */}
        <div className="card" style={{ border: '1px solid var(--border)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>
            <UploadCloud size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>تحديث النظام وحمايته (OTA)</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            يمكنك رفع ملف التحديث هنا. سيتم حفظ نسخة احتياطية من النظام القديم تلقائياً قبل التحديث.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
              {isUpdating ? 'جاري التنفيذ...' : 'اختر التحديث (.zip)'}
            </label>

            {hasSystemRollback && (
              <button type="button" onClick={handleSystemRollback} disabled={isUpdating} style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: isUpdating ? 'wait' : 'pointer' }}>
                <AlertTriangle size={20} /> التراجع عن آخر تحديث (System Rollback)
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Save size={20} /> حفظ الإعدادات الأساسية
          </button>
        </div>

      </form>
      
      <ConfirmSliderModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        description={modalConfig.description}
        sliderText={modalConfig.sliderText || "اسحب للتأكيد"}
        onConfirm={() => {
          modalConfig.onConfirm();
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        }}
        onClose={() => {
          if (modalConfig.onCancel) modalConfig.onCancel();
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};

export default Settings;
