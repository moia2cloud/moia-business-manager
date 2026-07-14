import { useState } from 'react';
import { Plus, Users, Building, Mail, Phone, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import ImageCropper from '../components/ImageCropper';

const Clients = () => {
  const { clients, addClient, updateClient, deleteClient, invoices } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '', address: '', image: '' });
  const [editingClientId, setEditingClientId] = useState(null);
  const [cropImageSrc, setCropImageSrc] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCropImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newClient.name) return;
    if (editingClientId) {
      updateClient(editingClientId, newClient);
    } else {
      addClient(newClient);
    }
    setNewClient({ name: '', company: '', email: '', phone: '', address: '', image: '' });
    setIsModalOpen(false);
    setEditingClientId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="responsive-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>العملاء</h1>
          <p style={{ color: 'var(--text-muted)' }}>إدارة جهات الاتصال الخاصة بك</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => {
            setEditingClientId(null);
            setNewClient({ name: '', company: '', email: '', phone: '', address: '', image: '' });
            setIsModalOpen(true);
          }}>
            <Plus size={20} /> إضافة عميل
          </button>
        </div>
      </header>

      {/* Clients Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {clients.filter(c => !c.isDeleted).length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem' }}>
            <Users size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>لا يوجد عملاء</h3>
            <p style={{ color: 'var(--text-muted)' }}>أضف أول عميل لك للبدء بإصدار الفواتير له.</p>
          </div>
        ) : (
          clients.filter(c => !c.isDeleted).map(client => {
            const clientInvoices = invoices.filter(inv => inv.clientId === client.id && !inv.isDeleted);
            const totalBilled = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);

            return (
              <div key={client.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', marginTop: '3rem', paddingTop: '3.5rem', alignItems: 'center', textAlign: 'center' }}>
                {/* Floating Center Avatar */}
                <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10 }}>
                  {client.image ? (
                    <img src={client.image} alt={client.company || client.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{(client.company || client.name).charAt(0)}</span>
                  )}
                </div>

                {/* Top Corner Actions */}
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => {
                    setEditingClientId(client.id);
                    setNewClient({ name: client.name, company: client.company || '', email: client.email || '', phone: client.phone || '', address: client.address || '', image: client.image || '' });
                    setIsModalOpen(true);
                  }} style={{ color: 'var(--primary)', background: 'var(--bg-input)', padding: '0.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if(window.confirm('حذف هذا العميل؟')) deleteClient(client.id) }} style={{ color: 'var(--danger)', background: 'var(--bg-input)', padding: '0.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Info */}
                <div style={{ width: '100%' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>{client.company || client.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Users size={16} /> {client.company ? client.name : 'عميل فردي'}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', width: '100%', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} color="var(--text-muted)" /> {client.email || '-'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={16} color="var(--text-muted)" /> {client.phone || '-'}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الفواتير</div>
                    <div style={{ fontWeight: 700 }}>{clientInvoices.length} فواتير</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي التعاملات</div>
                    <div style={{ fontWeight: 800, color: 'var(--success)' }}>
                      {totalBilled.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </div>
                  </div>
                </div>

                <Link to={`/clients/${client.id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  عرض ملف العميل <ExternalLink size={16} />
                </Link>
              </div>
            );
          })
        )}
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 800 }}>{editingClientId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--border-color)', flexShrink: 0 }}>
                  {newClient.image ? <img src={newClient.image} alt="Client" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={24} color="var(--text-muted)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>صورة / شعار العميل</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '0.4rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم العميل / مسؤول التواصل</label>
                <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="مثال: أحمد عبدالله" />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم الشركة الممثلة</label>
                <input type="text" value={newClient.company} onChange={e => setNewClient({...newClient, company: e.target.value})} placeholder="مثال: مستشفى الرويال" />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>البريد الإلكتروني</label>
                  <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>رقم الهاتف</label>
                  <input type="text" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>عنوان الشركة (للفواتير)</label>
                <input type="text" value={newClient.address || ''} onChange={e => setNewClient({...newClient, address: e.target.value})} placeholder="مثال: عمان، شارع مكة..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">{editingClientId ? 'حفظ التعديلات' : 'حفظ العميل'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper 
          imageSrc={cropImageSrc} 
          onCropComplete={(croppedImage) => {
            setNewClient({ ...newClient, image: croppedImage });
            setCropImageSrc(null);
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  );
};

export default Clients;
