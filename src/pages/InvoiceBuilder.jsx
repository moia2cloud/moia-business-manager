import { useState } from 'react';
import { Plus, Printer, Trash2, Save, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import useStore from '../store/useStore';

const InvoiceBuilder = () => {
  const { clients, projects, addInvoice, companySettings } = useStore();
  const location = useLocation();
  const prefill = location.state || {};

  // Find prefilled projects if any
  const initialPrefilledItems = (prefill.prefillProjects || []).map((pId, idx) => {
    const p = projects.find(proj => proj.id === pId);
    return {
      id: Date.now() + idx,
      desc: p ? p.title + (p.campaign && p.campaign !== 'عام' ? ` - ${p.campaign}` : '') : '',
      qty: 1,
      rate: p ? (Number(p.budget) || 0) : 0,
      projectId: pId
    };
  });

  const defaultItems = prefill.prefillAmount 
      ? [{ id: 1, desc: `مشروع: ${prefill.prefillTitle}`, qty: 1, rate: Number(prefill.prefillAmount) }]
      : [{ id: 1, desc: '', qty: 1, rate: 0 }];

  const [isSaved, setIsSaved] = useState(false);
  const [showPrintWarning, setShowPrintWarning] = useState(false);
  const initialClient = prefill.prefillClientId ? clients.find(c => c.id === prefill.prefillClientId) : null;
  const [invoice, setInvoice] = useState({
    clientId: prefill.prefillClientId || '',
    clientNameDisplay: initialClient ? initialClient.name : '',
    clientCompanyDisplay: initialClient ? (initialClient.company || initialClient.name) : '',
    clientAddressDisplay: initialClient ? (initialClient.address || '') : '',
    clientPhoneDisplay: initialClient ? (initialClient.phone || '') : '',
    clientEmailDisplay: initialClient ? (initialClient.email || '') : '',
    invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: initialPrefilledItems.length > 0 ? initialPrefilledItems : defaultItems,
    discount: 0,
    status: 'Pending'
  });

  const addItem = () => setInvoice(prev => ({ ...prev, items: [...prev.items, { id: Date.now(), desc: '', qty: 1, rate: 0 }] }));
  const removeItem = (id) => setInvoice(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  
  const updateItem = (id, field, value) => setInvoice(prev => ({
    ...prev,
    items: prev.items.map(i => {
      // If we are updating a specific field, we keep the rest, but if we change desc, maybe we don't clear projectId unless explicitly done.
      return i.id === id ? { ...i, [field]: value } : i;
    })
  }));

  const subtotal = invoice.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const discount = Number(invoice.discount) || 0;
  const total = subtotal - discount;

  const handleSave = () => {
    if (isSaved) return;

    if (!invoice.clientId) {
      alert("الرجاء اختيار العميل");
      return;
    }
    
    // Save invoice
    addInvoice({ ...invoice, total });
    
    // Auto-update linked projects to Delivered
    const updateProject = useStore.getState().updateProject;
    let updatedTasksCount = 0;
    invoice.items.forEach(item => {
      if (item.projectId) {
        updateProject(item.projectId, { status: 'Delivered' });
        updatedTasksCount++;
      }
    });

    if (updatedTasksCount > 0) {
      alert(`تم حفظ الفاتورة بنجاح وتحويل حالة (${updatedTasksCount}) مهام مرتبطة إلى (تم التسليم)`);
    } else {
      alert("تم حفظ الفاتورة بنجاح في النظام");
    }
    
    setIsSaved(true);
  };

  const selectedClient = clients.find(c => c.id === invoice.clientId);
  const clientProjects = projects.filter(p => p.clientId === invoice.clientId);

  const getUnbilledProjects = () => {
    const currentItemProjectIds = invoice.items.map(i => i.projectId).filter(Boolean);
    const allInvoices = useStore.getState().invoices;
    return clientProjects.filter(p => {
      if (currentItemProjectIds.includes(p.id)) return false; // Already added to THIS invoice
      // Check if it's in ANY saved invoice
      const isAlreadyInvoiced = allInvoices.some(inv => 
        inv.projectId === p.id || (inv.items && inv.items.some(i => i.projectId === p.id))
      );
      if (isAlreadyInvoiced) return false;
      return true;
    });
  };

  const unbilledProjects = getUnbilledProjects();

  const handleServiceSelect = (itemId, serviceId) => {
    if (!serviceId) return;
    const srv = useStore.getState().services.find(s => s.id === serviceId);
    if (srv) {
      updateItem(itemId, 'desc', srv.title + (srv.desc ? ` - ${srv.desc}` : ''));
      updateItem(itemId, 'rate', srv.rate);
      updateItem(itemId, 'projectId', null); // clear if it was a project
    }
  };

  const handleProjectSelect = (itemId, projectId) => {
    if (!projectId) return;
    const p = clientProjects.find(p => p.id === projectId);
    if (p) {
      updateItem(itemId, 'desc', p.title + (p.campaign && p.campaign !== 'عام' ? ` - ${p.campaign}` : ''));
      updateItem(itemId, 'rate', p.budget || 0);
      updateItem(itemId, 'projectId', p.id);
    }
  };

  return (
    <div className="print-reset" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="no-print">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>إصدار فاتورة جديدة</h1>
          <p style={{ color: 'var(--text-muted)' }}>قم بتعبئة التفاصيل وحفظ أو طباعة الفاتورة</p>
        </div>
      </header>

      <div className="invoice-builder-layout" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div className="invoice-actions no-print" style={{ flex: '1 1 250px', minWidth: '250px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '2rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>الإجراءات</h3>
            <button 
              className={`btn ${isSaved ? 'btn-success' : 'btn-secondary'}`} 
              style={{ width: '100%', justifyContent: 'center', opacity: isSaved ? 0.8 : 1 }} 
              onClick={handleSave}
              disabled={isSaved}
            >
              <Save size={20} /> {isSaved ? 'تم الحفظ ✔️' : 'حفظ في النظام'}
            </button>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
              if (!isSaved) {
                setShowPrintWarning(true);
              } else {
                window.print();
              }
            }}>
              <Printer size={20} /> طباعة / PDF
            </button>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem', lineHeight: 1.5 }}>
              💡 احفظ الفاتورة في النظام قبل طباعتها لتتمكن من متابعة دفعاتها لاحقاً.
            </div>
          </div>
        </div>

        {/* A4 Print Sheet Simulation */}
        <div style={{ flex: '3 1 600px', overflowX: 'auto', paddingBottom: '1rem' }}>
          <div className="card print-sheet invoice-sheet" style={{ 
            minWidth: '800px',
            backgroundColor: '#fff', 
            color: '#000',
            padding: '3rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            minHeight: '1056px' // approx A4 height ratio
          }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0, letterSpacing: '2px' }}>INVOICE</h1>
            <div style={{ color: '#666', marginTop: '0.5rem' }}>#{invoice.invoiceNo}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <img src="/moia logo.png" alt="MOIA Logo" style={{ width: '180px', height: 'auto', marginBottom: '15px' }} />
            <div style={{ color: '#666', fontSize: '0.9rem' }}>{companySettings.address}</div>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>{companySettings.email} | {companySettings.phone}</div>
          </div>
        </div>

        {/* Info row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', flexDirection: 'row-reverse' }}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', direction: 'ltr', textAlign: 'left' }}>BILL TO:</div>
            <select className="no-print" style={{ marginBottom: '1rem', width: '100%' }} value={invoice.clientId} onChange={e => {
              const cid = e.target.value;
              const cl = clients.find(c => c.id === cid);
              setInvoice({
                ...invoice, 
                clientId: cid,
                clientNameDisplay: cl ? cl.name : '',
                clientCompanyDisplay: cl ? (cl.company || cl.name) : '',
                clientAddressDisplay: cl ? (cl.address || '') : '',
                clientPhoneDisplay: cl ? (cl.phone || '') : '',
                clientEmailDisplay: cl ? (cl.email || '') : ''
              });
            }}>
              <option value="">-- اختر العميل --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company ? `${c.company} (${c.name})` : c.name}</option>)}
            </select>

            {selectedClient && (
              <div style={{ fontSize: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start', width: '100%', textAlign: 'left', direction: 'ltr' }}>
                <div className="no-print" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    style={{ fontWeight: 800, fontSize: '1.4rem', border: 'none', borderBottom: '1px dashed #ccc', background: 'transparent', padding: '0.2rem 0', outline: 'none', color: 'var(--primary)', width: '100%', fontFamily: 'inherit', textAlign: 'left' }} 
                    value={invoice.clientCompanyDisplay} 
                    onChange={e => setInvoice({...invoice, clientCompanyDisplay: e.target.value})} 
                    placeholder="الاسم الرئيسي للفاتورة (الشركة)"
                  />
                  {invoice.clientCompanyDisplay && <button onClick={() => setInvoice({...invoice, clientCompanyDisplay: ''})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.2rem' }}><X size={16} /></button>}
                </div>
                {invoice.clientCompanyDisplay && <span className="print-only" style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{invoice.clientCompanyDisplay}</span>}

                <div className="no-print" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    style={{ fontSize: '1.1rem', border: 'none', borderBottom: '1px dashed #ccc', background: 'transparent', padding: '0.2rem 0', outline: 'none', color: 'var(--text-main)', width: '100%', fontFamily: 'inherit', textAlign: 'left' }} 
                    value={invoice.clientNameDisplay} 
                    onChange={e => setInvoice({...invoice, clientNameDisplay: e.target.value})} 
                    placeholder="مسؤول التواصل (اختياري)"
                  />
                  {invoice.clientNameDisplay && <button onClick={() => setInvoice({...invoice, clientNameDisplay: ''})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.2rem' }}><X size={16} /></button>}
                </div>
                {invoice.clientNameDisplay && <span className="print-only" style={{ fontSize: '1.1rem' }}>{invoice.clientNameDisplay}</span>}

                <div className="no-print" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem', direction: 'ltr' }}>
                  <input 
                    type="text" 
                    dir="auto"
                    style={{ fontSize: '1rem', border: 'none', borderBottom: '1px dashed #ccc', background: 'transparent', padding: '0.2rem 0', outline: 'none', color: 'var(--text-muted)', width: '100%', fontFamily: 'inherit', textAlign: 'left' }} 
                    value={invoice.clientAddressDisplay} 
                    onChange={e => setInvoice({...invoice, clientAddressDisplay: e.target.value})} 
                    placeholder="عنوان الشركة (اختياري)"
                  />
                  {invoice.clientAddressDisplay && <button onClick={() => setInvoice({...invoice, clientAddressDisplay: ''})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.2rem' }}><X size={16} /></button>}
                </div>
                {invoice.clientAddressDisplay && <span className="print-only" style={{ fontSize: '1rem', color: '#666' }}>{invoice.clientAddressDisplay}</span>}

                <div className="no-print" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem', direction: 'ltr' }}>
                  <input 
                    type="text" 
                    dir="auto"
                    style={{ fontSize: '1rem', border: 'none', borderBottom: '1px dashed #ccc', background: 'transparent', padding: '0.2rem 0', outline: 'none', color: 'var(--text-muted)', width: '100%', fontFamily: 'inherit', textAlign: 'left' }} 
                    value={invoice.clientPhoneDisplay} 
                    onChange={e => setInvoice({...invoice, clientPhoneDisplay: e.target.value})} 
                    placeholder="رقم الهاتف (اختياري)"
                  />
                  {invoice.clientPhoneDisplay && <button onClick={() => setInvoice({...invoice, clientPhoneDisplay: ''})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.2rem' }}><X size={16} /></button>}
                </div>
                {invoice.clientPhoneDisplay && <span className="print-only" style={{ fontSize: '1rem', color: '#666' }}>{invoice.clientPhoneDisplay}</span>}

                <div className="no-print" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="email" 
                    style={{ fontSize: '0.9rem', border: 'none', borderBottom: '1px dashed #ccc', background: 'transparent', padding: '0.2rem 0', outline: 'none', color: '#666', width: '100%', fontFamily: 'inherit', textAlign: 'left' }} 
                    value={invoice.clientEmailDisplay} 
                    onChange={e => setInvoice({...invoice, clientEmailDisplay: e.target.value})} 
                    placeholder="البريد الإلكتروني (اختياري)"
                  />
                  {invoice.clientEmailDisplay && <button onClick={() => setInvoice({...invoice, clientEmailDisplay: ''})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.2rem' }}><X size={16} /></button>}
                </div>
                {invoice.clientEmailDisplay && <div className="print-only" style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>{invoice.clientEmailDisplay}</div>}
              </div>
            )}
          </div>
          
          <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', direction: 'ltr' }}>
              <span style={{ fontWeight: 600 }}>Date:</span>
              <span className="print-only">{invoice.date}</span>
              <input type="date" className="no-print" style={{ width: '150px' }} value={invoice.date} onChange={e => setInvoice({...invoice, date: e.target.value})} />
            </div>
            <div className={invoice.dueDate ? "" : "no-print"} style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', direction: 'ltr' }}>
              <span style={{ fontWeight: 600 }}>Due Date:</span>
              {invoice.dueDate && <span className="print-only">{invoice.dueDate}</span>}
              <input type="date" className="no-print" style={{ width: '150px' }} value={invoice.dueDate} onChange={e => setInvoice({...invoice, dueDate: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', width: '100px' }}>Qty</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', width: '120px' }}>Rate (JOD)</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', width: '120px' }}>Amount</th>
              <th className="no-print" style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee', fontWeight: 600 }}>
                <td style={{ padding: '0.75rem' }}>
                  <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select 
                      onChange={(e) => handleServiceSelect(item.id, e.target.value)}
                      style={{ padding: '0.25rem', fontSize: '0.8rem', flex: 1 }}
                    >
                      <option value="">-- جاهز --</option>
                      {useStore.getState().services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                    {invoice.clientId && (
                      <select 
                        onChange={(e) => handleProjectSelect(item.id, e.target.value)}
                        style={{ padding: '0.25rem', fontSize: '0.8rem', flex: 1, borderColor: 'var(--accent)' }}
                      >
                        <option value="">-- سحب مهمة --</option>
                        {unbilledProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    )}
                  </div>
                  <input type="text" className="no-print" style={{ width: '100%', border: 'none', background: 'transparent' }} placeholder="أو اكتب وصف البند هنا..." value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} />
                  <span className="print-only">{item.desc}</span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <input type="number" min="1" className="no-print" style={{ width: '60px', textAlign: 'center', border: 'none', background: 'transparent' }} value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                  <span className="print-only">{item.qty}</span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                   <input type="number" className="no-print" style={{ width: '80px', textAlign: 'right', border: 'none', background: 'transparent' }} value={item.rate} onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
                   <span className="print-only">{item.rate}</span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                  {(item.qty * item.rate).toFixed(2)}
                </td>
                <td className="no-print" style={{ textAlign: 'center' }}>
                  <button onClick={() => removeItem(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <button className="btn btn-secondary no-print" style={{ width: '100%', marginBottom: '2rem' }} onClick={addItem}>
          <Plus size={16} /> Add Item
        </button>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
          <div style={{ width: '300px' }}>
             {invoice.showDiscount || discount > 0 ? (
               <>
                 {/* Subtotal */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: 'var(--text-main)' }}>
                  <span>Subtotal:</span>
                  <span>{subtotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} JOD</span>
                </div>

                {/* Discount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', color: 'var(--danger)' }}>
                  <span>Discount:</span>
                  <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <input 
                      type="number" 
                      min="0"
                      style={{ width: '80px', textAlign: 'right', border: '1px dashed #ccc', background: 'transparent', padding: '0.2rem', outline: 'none' }} 
                      value={invoice.discount || ''} 
                      onChange={e => setInvoice({...invoice, discount: e.target.value})} 
                      placeholder="0"
                      autoFocus
                    />
                    <button onClick={() => setInvoice({...invoice, discount: 0, showDiscount: false})} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.2rem', display: 'flex' }} title="إلغاء الخصم">
                      <X size={16} />
                    </button>
                  </div>
                  <span className="print-only">
                    {discount > 0 ? `- ${discount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} JOD` : '0 JOD'}
                  </span>
                </div>
               </>
             ) : (
               <div className="no-print" style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
                 <button onClick={() => setInvoice({...invoice, showDiscount: true})} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                   + إضافة خصم (Add Discount)
                 </button>
               </div>
             )}

             <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, fontSize: '1.2rem', borderTop: '2px solid var(--primary)', marginTop: (invoice.showDiscount || discount > 0) ? '0.5rem' : '0', direction: 'ltr' }}>
              <span>Total:</span>
              <span style={{ color: 'var(--primary)' }}>{total.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Payment Information</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem', color: '#475569' }}>
            <div><strong>Bank:</strong> {companySettings.bankName}</div>
            <div><strong>Account Name:</strong> {companySettings.accountName}</div>
            <div><strong>Alias / CliQ:</strong> {companySettings.paymentAlias}</div>
          </div>
        </div>

      </div>
      </div>
      </div>
      
      {/* Custom Print Warning Modal */}
      {showPrintWarning && (
        <div className="no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', margin: '1rem', textAlign: 'center', padding: '2rem' }}>
            <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem auto' }}>
              <Printer size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 800 }}>تنبيه قبل الطباعة!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
              لم تقم بحفظ هذه الفاتورة في النظام بعد. من الأفضل حفظ الفاتورة أولاً لتتمكن من تتبع الدفعات الخاصة بها لاحقاً. هل أنت متأكد أنك تريد الاستمرار في الطباعة كمسودة؟
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowPrintWarning(false)}>إلغاء الطباعة</button>
              <button className="btn btn-warning" onClick={() => {
                setShowPrintWarning(false);
                setTimeout(() => window.print(), 100);
              }}>
                استمرار وطباعة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InvoiceBuilder;
