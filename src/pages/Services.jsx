import { useState } from 'react';
import { Plus, Tag, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';

const Services = () => {
  const { services, addService, deleteService } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newService, setNewService] = useState({ title: '', desc: '', rate: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newService.title || !newService.rate) return;
    addService({ ...newService, rate: Number(newService.rate) });
    setNewService({ title: '', desc: '', rate: '' });
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>الخدمات والأسعار</h1>
          <p style={{ color: 'var(--text-muted)' }}>إدارة قائمة خدماتك لتسهيل إصدار الفواتير</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> خدمة جديدة
        </button>
      </header>

      {/* Services List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>اسم الخدمة</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>الوصف الافتراضي</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>السعر (JOD)</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  لا يوجد خدمات معرفة مسبقاً.
                </td>
              </tr>
            ) : (
              services.map(srv => (
                <tr key={srv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Tag size={16} color="var(--primary)" /> {srv.title}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{srv.desc || '-'}</td>
                  <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--accent-hover)' }}>
                    {srv.rate.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => { if(window.confirm('حذف هذه الخدمة؟')) deleteService(srv.id); }}
                      style={{ color: 'var(--danger)', padding: '0.5rem' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Service Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 800 }}>إضافة خدمة / منتج</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم الخدمة</label>
                <input required type="text" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} placeholder="مثال: تصوير وتغطية مؤتمر" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>الوصف (يظهر في الفاتورة)</label>
                <textarea value={newService.desc} onChange={e => setNewService({...newService, desc: e.target.value})} placeholder="تفاصيل تظهر تحت اسم الخدمة في الفاتورة..." rows="2"></textarea>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>السعر الافتراضي (JOD)</label>
                <input required type="number" step="0.01" value={newService.rate} onChange={e => setNewService({...newService, rate: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الخدمة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
