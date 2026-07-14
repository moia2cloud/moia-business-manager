import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, Receipt, CreditCard, Plus, ListPlus, Trash2, Edit2, Check, X } from 'lucide-react';
import useStore from '../store/useStore';
import { useState } from 'react';

// A small helper to generate a consistent color based on a string (for campaign colors)
const getCampaignColor = (name) => {
  if (name === 'عام') return 'var(--text-muted)';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  return colors[Math.abs(hash) % colors.length];
};

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'invoices'
  const [sortBy, setSortBy] = useState('campaign'); // 'campaign' or 'date'
  const [selectedForInvoice, setSelectedForInvoice] = useState([]); // Array of project IDs
  const [editingCampaign, setEditingCampaign] = useState(null); // null or { oldName, newName, newColor }
  const [editingProjectId, setEditingProjectId] = useState(null); // project id being edited
  
  const handleSaveCampaignEdit = () => {
    if (!editingCampaign || !editingCampaign.newName.trim()) return;
    const campaignProjectsToUpdate = projects.filter(p => (p.campaign || 'عام') === editingCampaign.oldName && p.clientId?.toString() === id?.toString());
    campaignProjectsToUpdate.forEach(p => {
      updateProject(p.id, { 
        campaign: editingCampaign.newName.trim(), 
        color: editingCampaign.newColor 
      });
    });
    setEditingCampaign(null);
  };
  
  // Fast Entry State
  const [fastEntry, setFastEntry] = useState({ title: '', campaign: '', date: '', budget: '', notes: '', color: '#3B82F6' });
  const [addingToCampaign, setAddingToCampaign] = useState(null);
  
  // Filters
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  const client = useStore(state => state.clients).find(c => c.id?.toString() === id?.toString());
  const projects = useStore(state => state.projects).filter(p => p.clientId?.toString() === id?.toString() && !p.isDeleted);
  const invoices = useStore(state => state.invoices).filter(i => i.clientId?.toString() === id?.toString() && !i.isDeleted);
  const payments = useStore(state => state.payments);
  const addProject = useStore(state => state.addProject);
  const updateProject = useStore(state => state.updateProject);
  const deleteProject = useStore(state => state.deleteProject);
  const deleteInvoice = useStore(state => state.deleteInvoice);

  if (!client) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>العميل غير موجود</h2>
        <button className="btn btn-primary" onClick={() => navigate('/clients')}>العودة لقائمة العملاء</button>
      </div>
    );
  }

  const totalInvoiced = invoices.reduce((sum, inv) => {
    const invPayments = payments.filter(p => p.invoiceId === inv.id);
    const paid = invPayments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + paid;
  }, 0);
  
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalDue = Math.max(0, totalBilled - totalInvoiced);

  const unbilledRevenue = projects
    .filter(p => p.status === 'Delivered' && getProjectPaymentStatus(p.id).invoiceId === null)
    .reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  const uniqueCampaigns = Array.from(new Set(projects.map(p => p.campaign || 'عام')));

  // Group projects by campaign and apply filters
  const groupedProjects = projects
    .filter(p => {
      if (dateFilter.from && p.deadline < dateFilter.from) return false;
      if (dateFilter.to && p.deadline > dateFilter.to) return false;
      return true;
    })
    .sort((a, b) => new Date(a.deadline || '2099-01-01') - new Date(b.deadline || '2099-01-01'))
    .reduce((acc, p) => {
      const camp = p.campaign || 'عام';
      if (!acc[camp]) acc[camp] = [];
      acc[camp].push(p);
      return acc;
    }, {});

  const handleFastAdd = () => {
    if (!fastEntry.title) return;
    
    let finalCampaign = (fastEntry.campaign || 'عام').trim();
    let finalColor = fastEntry.color;
    
    // Case-insensitive match to avoid duplicate groups and fix coloring
    const existingMatch = projects.find(p => (p.campaign || 'عام').toLowerCase() === finalCampaign.toLowerCase());
    if (existingMatch) {
      finalCampaign = existingMatch.campaign || 'عام';
      // Auto-fix the color to match the group if they didn't explicitly change it from default
      if (finalColor === '#3B82F6' || !finalColor) {
         finalColor = existingMatch.color || finalColor;
      }
    }

    if (editingProjectId) {
      updateProject(editingProjectId, {
        title: fastEntry.title,
        campaign: finalCampaign,
        deadline: fastEntry.date,
        budget: fastEntry.budget === '' ? '' : Number(fastEntry.budget),
        description: fastEntry.notes,
        color: finalColor
      });
      setEditingProjectId(null);
    } else {
      addProject({
        clientId: client.id,
        title: fastEntry.title,
        campaign: finalCampaign,
        deadline: fastEntry.date,
        budget: fastEntry.budget === '' ? '' : Number(fastEntry.budget),
        description: fastEntry.notes,
        color: finalColor,
        status: 'Pending',
        progress: 0
      });
    }
    
    // Keep campaign, date and color, clear title, budget, and notes for rapid sequential entry
    setFastEntry({ ...fastEntry, title: '', budget: '', notes: '' });
    
    // Only scroll to bottom if NOT inline adding
    if (!addingToCampaign) {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleEditClick = (p) => {
    setEditingProjectId(p.id);
    setFastEntry({
      title: p.title,
      campaign: p.campaign || '',
      date: p.deadline || '',
      budget: p.budget === null || p.budget === undefined ? '' : p.budget,
      notes: p.description || '',
      color: p.color || getCampaignColor(p.campaign || 'عام')
    });
  };

  const handleCampaignChange = (e) => {
    const val = e.target.value;
    // Auto-detect color from existing projects (case-insensitive)
    const existing = projects.find(p => (p.campaign || 'عام').toLowerCase() === val.toLowerCase() && p.color);
    setFastEntry({ ...fastEntry, campaign: val, color: existing ? existing.color : fastEntry.color });
  };

  const getProjectColor = (p) => p.color || getCampaignColor(p.campaign || 'عام');

  function getProjectPaymentStatus(projectId) {
    // Find an invoice that includes this project
    const invoice = invoices.find(inv => 
      inv.projectId === projectId || (inv.items && inv.items.some(item => item.projectId === projectId))
    );
    
    if (!invoice) return { label: 'غير مفوتر', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)', invoiceId: null };

    const invPayments = payments.filter(p => p.invoiceId === invoice.id);
    const totalPaid = invPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Math.max(0, invoice.total - totalPaid);

    if (totalPaid === 0) return { label: 'مفوتر - غير مدفوع', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)', invoiceId: invoice.id };
    if (remaining === 0) return { label: 'تم الدفع', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)', invoiceId: invoice.id };
    return { label: `دفع جزئي`, color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.1)', invoiceId: invoice.id };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFastAdd();
    }
  };

  const toggleSelectForInvoice = (pId) => {
    setSelectedForInvoice(prev => 
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const unbilledProjects = projects.filter(p => getProjectPaymentStatus(p.id).invoiceId === null);
  const allUnbilledIds = unbilledProjects.map(p => p.id);
  const isAllSelected = allUnbilledIds.length > 0 && allUnbilledIds.every(id => selectedForInvoice.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedForInvoice([]);
    } else {
      setSelectedForInvoice(allUnbilledIds);
    }
  };

  const toggleSelectCampaign = (campaignProjects) => {
    const unbilledInCampaign = campaignProjects.filter(p => getProjectPaymentStatus(p.id).invoiceId === null).map(p => p.id);
    if (unbilledInCampaign.length === 0) return;
    
    const isAllCampaignSelected = unbilledInCampaign.every(id => selectedForInvoice.includes(id));
    if (isAllCampaignSelected) {
      setSelectedForInvoice(prev => prev.filter(id => !unbilledInCampaign.includes(id)));
    } else {
      setSelectedForInvoice(prev => Array.from(new Set([...prev, ...unbilledInCampaign])));
    }
  };

  const isCampaignAllSelected = (campaignProjects) => {
    const unbilled = campaignProjects.filter(p => getProjectPaymentStatus(p.id).invoiceId === null);
    if (unbilled.length === 0) return false;
    return unbilled.every(p => selectedForInvoice.includes(p.id));
  };

  const handleCreateBulkInvoice = () => {
    navigate('/invoice-builder', { 
      state: { 
        prefillClientId: client.id, 
        prefillProjects: selectedForInvoice 
      } 
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/clients')} style={{ color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--bg-input)' }}>
          <ArrowRight size={24} />
        </button>
        <div style={{ width: '60px', height: '60px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border-color)' }}>
          {client.image ? (
            <img src={client.image} alt={client.company || client.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{(client.company || client.name).charAt(0)}</span>
          )}
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{client.company || client.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{client.company ? client.name : 'عميل فردي'} | {client.email}</p>
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي المهام/المشاريع</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--info)' }}>{projects.length}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>إيرادات غير مفوترة (جاهزة)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)' }}>
            {unbilledRevenue.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>الأموال المحصلة</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
            {totalInvoiced.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>ديون متأخرة</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>
            {totalDue.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('projects')}
          style={{ padding: '0.75rem 1.5rem', fontWeight: 700, display: 'flex', gap: '0.5rem', alignItems: 'center', color: activeTab === 'projects' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'projects' ? '3px solid var(--primary)' : 'none' }}
        >
          <Briefcase size={18} /> المشاريع (Excel Mode)
        </button>
        <button 
          onClick={() => setActiveTab('invoices')}
          style={{ padding: '0.75rem 1.5rem', fontWeight: 700, display: 'flex', gap: '0.5rem', alignItems: 'center', color: activeTab === 'invoices' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'invoices' ? '3px solid var(--primary)' : 'none' }}
        >
          <Receipt size={18} /> الفواتير
        </button>
      </div>

      {/* Content */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'projects' && (
          <div style={{ padding: '1rem' }}>
            {/* FAST DATA ENTRY FORM (Spreadsheet row) */}
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--primary)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                <ListPlus size={20} />
                <strong style={{ fontSize: '1.1rem' }}>
                  {editingProjectId ? 'تعديل المهمة (اضغط Enter للحفظ)' : 'الإدخال السريع للمهام (اكتب واضغط Enter)'}
                </strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="الحدث / الحملة (مثال: WOMEN LABEL)" 
                  style={{ flex: 1, minWidth: '150px' }}
                  value={fastEntry.campaign}
                  onChange={handleCampaignChange}
                  onKeyDown={handleKeyDown}
                />
                <input 
                  type="text" 
                  placeholder="المهمة (مثال: مونتاج فيديو)" 
                  style={{ flex: 2, minWidth: '200px' }}
                  value={fastEntry.title}
                  onChange={e => setFastEntry({...fastEntry, title: e.target.value})}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <input 
                  type="date" 
                  style={{ flex: 1, minWidth: '130px' }}
                  value={fastEntry.date}
                  onChange={e => setFastEntry({...fastEntry, date: e.target.value})}
                  onKeyDown={handleKeyDown}
                />
                <input 
                  type="number" 
                  placeholder="السعر (اختياري)" 
                  style={{ flex: 1, minWidth: '100px' }}
                  value={fastEntry.budget}
                  onChange={e => setFastEntry({...fastEntry, budget: e.target.value})}
                  onKeyDown={handleKeyDown}
                />
                <input 
                  type="text" 
                  placeholder="ملاحظات" 
                  style={{ flex: 2, minWidth: '150px' }}
                  value={fastEntry.notes}
                  onChange={e => setFastEntry({...fastEntry, notes: e.target.value})}
                  onKeyDown={handleKeyDown}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>اللون:</label>
                  <input 
                    type="color" 
                    value={fastEntry.color}
                    onChange={e => setFastEntry({...fastEntry, color: e.target.value})}
                    style={{ border: 'none', background: 'transparent', width: '30px', height: '30px', cursor: 'pointer', padding: 0 }}
                    title="اختر لون الحملة"
                  />
                </div>
                {editingProjectId ? (
                  <>
                    <button className="btn btn-success" onClick={handleFastAdd} style={{ padding: '0.5rem 1rem' }} title="حفظ التعديل">
                      <Check size={20} />
                    </button>
                    <button className="btn btn-danger" onClick={() => { setEditingProjectId(null); setFastEntry({ ...fastEntry, title: '', budget: '', notes: '' }); }} style={{ padding: '0.5rem 1rem' }} title="إلغاء التعديل">
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={handleFastAdd} style={{ padding: '0.5rem 1rem' }}>
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Filters & Sorting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>تصفية حسب التاريخ:</span>
                <input type="date" value={dateFilter.from} onChange={e => setDateFilter({...dateFilter, from: e.target.value})} style={{ padding: '0.25rem 0.5rem' }} />
                <span>إلى</span>
                <input type="date" value={dateFilter.to} onChange={e => setDateFilter({...dateFilter, to: e.target.value})} style={{ padding: '0.25rem 0.5rem' }} />
                {(dateFilter.from || dateFilter.to) && (
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => setDateFilter({ from: '', to: '' })}>مسح التصفية</button>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--bg-input)', padding: '0.25rem', borderRadius: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setSortBy('campaign')} 
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: sortBy === 'campaign' ? 'var(--primary)' : 'transparent', color: sortBy === 'campaign' ? 'white' : 'var(--text-muted)' }}
                >
                  تجميع بالحدث (Grouped)
                </button>
                <button 
                  onClick={() => setSortBy('date')} 
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: sortBy === 'date' ? 'var(--primary)' : 'transparent', color: sortBy === 'date' ? 'white' : 'var(--text-muted)' }}
                >
                  ترتيب بالزمن (Chronological)
                </button>
                <button 
                  onClick={() => setSortBy('payment')} 
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: sortBy === 'payment' ? 'var(--primary)' : 'transparent', color: sortBy === 'payment' ? 'white' : 'var(--text-muted)' }}
                >
                  فرز حسب حالة الدفع
                </button>
              </div>
            </div>
            
            {/* EXCEL-LIKE TABLE */}
            
            {selectedForInvoice.length > 0 && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                    تم تحديد ({selectedForInvoice.length}) مهام جاهزة للفوترة
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)' }}>
                    الإجمالي المتوقع: {
                      projects
                        .filter(p => selectedForInvoice.includes(p.id))
                        .reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
                        .toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })
                    }
                  </span>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={handleCreateBulkInvoice}
                >
                  <Receipt size={18} />
                  إصدار فاتورة مجمعة
                </button>
              </div>
            )}
            
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem', width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        title="تحديد كل المهام"
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '1rem' }}>المهمة (Column 1)</th>
                    <th style={{ padding: '1rem' }}>التاريخ</th>
                    <th style={{ padding: '1rem' }}>ملاحظات</th>
                    <th style={{ padding: '1rem' }}>السعر</th>
                    <th style={{ padding: '1rem' }}>حالة المشروع</th>
                    <th style={{ padding: '1rem' }}>حالة الدفع</th>
                    <th style={{ padding: '1rem', width: '50px' }}></th>
                  </tr>
                </thead>
                {Object.keys(groupedProjects).length === 0 ? (
                  <tbody>
                    <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لم تقم بإضافة أي مهام لهذا العميل بعد. استخدم شريط الإدخال السريع بالأعلى!</td></tr>
                  </tbody>
                ) : sortBy === 'campaign' ? (
                  // GROUPED BY CAMPAIGN VIEW
                  Object.entries(groupedProjects).map(([campaign, campaignProjects]) => {
                    const campaignColor = getProjectColor(campaignProjects[0]);
                    return (
                      <tbody key={campaign}>
                        {/* Campaign Header Row (Colored) */}
                        <tr>
                          <td colSpan="8" style={{ 
                            padding: '0.5rem 1rem', 
                            backgroundColor: campaignColor, 
                            color: 'white', 
                            fontWeight: 800,
                            fontSize: '1.1rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <input 
                                  type="checkbox"
                                  checked={isCampaignAllSelected(campaignProjects)}
                                  onChange={() => toggleSelectCampaign(campaignProjects)}
                                  title={`تحديد كل المهام في ${campaign}`}
                                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                />
                                {editingCampaign?.oldName === campaign ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                    <input 
                                      type="text" 
                                      value={editingCampaign.newName}
                                      onChange={e => setEditingCampaign({...editingCampaign, newName: e.target.value})}
                                      style={{ padding: '0.3rem', borderRadius: '4px', border: 'none', color: 'black', minWidth: '200px', fontWeight: 700 }}
                                      autoFocus
                                    />
                                    <input 
                                      type="color" 
                                      value={editingCampaign.newColor}
                                      onChange={e => setEditingCampaign({...editingCampaign, newColor: e.target.value})}
                                      style={{ border: 'none', background: 'transparent', width: '24px', height: '24px', cursor: 'pointer', padding: 0 }}
                                    />
                                    <button onClick={handleSaveCampaignEdit} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><Check size={18} /></button>
                                    <button onClick={() => setEditingCampaign(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
                                  </div>
                                ) : (
                                  <>
                                    <span style={{ whiteSpace: 'nowrap' }}>{campaign}</span>
                                    <button 
                                      onClick={() => setEditingCampaign({ oldName: campaign, newName: campaign, newColor: campaignColor })}
                                      title="تعديل اسم ولون الحدث"
                                      style={{ 
                                        background: 'rgba(255,255,255,0.2)', 
                                        border: 'none', 
                                        color: 'white', 
                                        borderRadius: '4px', 
                                        padding: '0.3rem', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  setAddingToCampaign(campaign);
                                  setFastEntry({ ...fastEntry, campaign, color: campaignColor, title: '' });
                                }}
                                style={{ 
                                  background: 'rgba(255,255,255,0.2)', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '4px', 
                                  padding: '0.2rem 0.5rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.9rem'
                                }}
                              >
                                <Plus size={16} /> أضف مهمة هنا
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Inline Add Task Row for this campaign */}
                        {addingToCampaign === campaign && (
                          <tr style={{ borderBottom: '2px solid var(--primary)', backgroundColor: 'var(--bg-input)' }}>
                            <td style={{ padding: '0.75rem 1rem' }}></td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="text" value={fastEntry.title} onChange={e => setFastEntry({...fastEntry, title: e.target.value})} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black', fontWeight: 600 }} placeholder="اسم المهمة (واضغط Enter)" autoFocus />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="date" value={fastEntry.date} onChange={e => setFastEntry({...fastEntry, date: e.target.value})} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="text" value={fastEntry.notes} onChange={e => setFastEntry({...fastEntry, notes: e.target.value})} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} placeholder="ملاحظات" />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="number" value={fastEntry.budget} onChange={e => setFastEntry({...fastEntry, budget: e.target.value})} onKeyDown={handleKeyDown} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} placeholder="السعر" />
                            </td>
                            <td colSpan="2" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                              ستضاف لحدث ({campaign})
                            </td>
                            <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                              <button onClick={handleFastAdd} className="btn btn-success" style={{ padding: '0.3rem 0.5rem' }} title="حفظ"><Check size={16} /></button>
                              <button onClick={() => { setAddingToCampaign(null); setFastEntry({ ...fastEntry, title: '', budget: '', notes: '' }); }} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem' }} title="إلغاء"><X size={16} /></button>
                            </td>
                          </tr>
                        )}
                        {/* Tasks under this campaign */}
                        {campaignProjects.map(p => {
                          const pStatus = getProjectPaymentStatus(p.id);
                          const isBilled = pStatus.invoiceId !== null;
                          if (editingProjectId === p.id) {
                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                                <td style={{ padding: '0.75rem 1rem' }}></td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <input type="text" value={fastEntry.title} onChange={e => setFastEntry({...fastEntry, title: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '0.2rem', color: 'black' }} placeholder="المهمة" autoFocus />
                                  <input type="text" value={fastEntry.campaign} onChange={e => setFastEntry({...fastEntry, campaign: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'black' }} placeholder="الحدث" />
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <input type="date" value={fastEntry.date} onChange={e => setFastEntry({...fastEntry, date: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} />
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <input type="text" value={fastEntry.notes} onChange={e => setFastEntry({...fastEntry, notes: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} placeholder="ملاحظات" />
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <input type="number" value={fastEntry.budget} onChange={e => setFastEntry({...fastEntry, budget: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} placeholder="السعر" />
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <div style={{ opacity: 0.5, fontSize: '0.8rem', color: 'black' }}>تعديل...</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}></td>
                                <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={handleFastAdd} className="btn btn-success" style={{ padding: '0.3rem 0.5rem' }} title="حفظ"><Check size={16} /></button>
                                  <button onClick={() => { setEditingProjectId(null); setFastEntry({ title: '', campaign: '', date: '', budget: '', notes: '', color: '#3B82F6' }); }} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem' }} title="إلغاء"><X size={16} /></button>
                                </td>
                              </tr>
                            );
                          }
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
                              <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedForInvoice.includes(p.id)}
                                  onChange={() => toggleSelectForInvoice(p.id)}
                                  disabled={isBilled}
                                  title={isBilled ? "تمت فوترة هذه المهمة مسبقاً" : "تحديد للفوترة"}
                                  style={{ transform: 'scale(1.2)', cursor: isBilled ? 'not-allowed' : 'pointer' }}
                                />
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{p.title}</td>
                              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{p.deadline || '-'}</td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{p.description || '-'}</td>
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: p.budget === '' || p.budget == null ? 'var(--warning)' : 'inherit' }}>
                              {p.budget === '' || p.budget == null ? 'لم يحدد' : Number(p.budget).toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <select 
                                value={p.status}
                                onChange={(e) => updateProject(p.id, { status: e.target.value })}
                                style={{ 
                                  padding: '0.25rem 0.5rem', 
                                  borderRadius: '4px', 
                                  border: '1px solid var(--border-color)',
                                  fontWeight: 600,
                                  backgroundColor: p.status === 'Delivered' ? 'var(--success)' : p.status === 'Planning' ? 'var(--info)' : 'var(--bg-input)',
                                  color: p.status === 'Delivered' || p.status === 'Planning' ? 'white' : 'inherit'
                                }}
                              >
                                <option value="Pending">قيد العمل (Pending)</option>
                                <option value="Planning">تخطيط (Planning)</option>
                                <option value="Delivered">تم التسليم (Delivered)</option>
                                <option value="Cancelled">ملغى (Cancelled)</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              {(() => {
                                const pStatus = getProjectPaymentStatus(p.id);
                                return (
                                  <div 
                                    onClick={() => pStatus.invoiceId && navigate(`/invoices/${pStatus.invoiceId}`)}
                                    style={{ 
                                      display: 'inline-block',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '4px',
                                      backgroundColor: pStatus.bg,
                                      color: pStatus.color,
                                      fontWeight: 700,
                                      fontSize: '0.85rem',
                                      cursor: pStatus.invoiceId ? 'pointer' : 'default',
                                      border: `1px solid ${pStatus.color}`
                                    }}
                                  >
                                    {pStatus.label}
                                  </div>
                                );
                              })()}
                            </td>
                            <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={() => handleEditClick(p)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--info)', cursor: 'pointer', display: 'flex', padding: '0.3rem', borderRadius: '4px' }}
                                className="hover-bg-info-light"
                                title="تعديل المهمة"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) deleteProject(p.id); }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', padding: '0.3rem', borderRadius: '4px' }}
                                className="hover-bg-danger-light"
                                title="حذف المهمة"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    );
                  })
                ) : (
                  // FLAT CHRONOLOGICAL OR PAYMENT VIEW (Colored Rows)
                  <tbody>
                    {Object.values(groupedProjects).flat().sort((a,b) => {
                      if (sortBy === 'payment') {
                        const statusA = getProjectPaymentStatus(a.id);
                        const statusB = getProjectPaymentStatus(b.id);
                        const scoreA = statusA.isPaid ? 3 : (statusA.invoiceId ? 2 : 1);
                        const scoreB = statusB.isPaid ? 3 : (statusB.invoiceId ? 2 : 1);
                        if (scoreA !== scoreB) return scoreA - scoreB;
                        // fallback to chronological
                        return new Date(a.deadline||'2099') - new Date(b.deadline||'2099');
                      }
                      // Default Chronological
                      return new Date(a.deadline||'2099') - new Date(b.deadline||'2099');
                    }).map(p => {
                      const rowColor = getProjectColor(p);
                      const pStatus = getProjectPaymentStatus(p.id);
                      const isBilled = pStatus.invoiceId !== null;
                      if (editingProjectId === p.id) {
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255, 255, 255, 0.9)', color: 'black' }}>
                            <td style={{ padding: '0.75rem 1rem' }}></td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="text" value={fastEntry.title} onChange={e => setFastEntry({...fastEntry, title: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', marginBottom: '0.2rem', color: 'black' }} placeholder="المهمة" autoFocus />
                              <input type="text" value={fastEntry.campaign} onChange={e => setFastEntry({...fastEntry, campaign: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'black' }} placeholder="الحدث" />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="date" value={fastEntry.date} onChange={e => setFastEntry({...fastEntry, date: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="text" value={fastEntry.notes} onChange={e => setFastEntry({...fastEntry, notes: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} placeholder="ملاحظات" />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <input type="number" value={fastEntry.budget} onChange={e => setFastEntry({...fastEntry, budget: e.target.value})} style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'black' }} placeholder="السعر" />
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ opacity: 0.5, fontSize: '0.8rem', color: 'black' }}>تعديل...</div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem' }}></td>
                            <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                              <button onClick={handleFastAdd} className="btn btn-success" style={{ padding: '0.3rem 0.5rem' }} title="حفظ"><Check size={16} /></button>
                              <button onClick={() => { setEditingProjectId(null); setFastEntry({ title: '', campaign: '', date: '', budget: '', notes: '', color: '#3B82F6' }); }} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem' }} title="إلغاء"><X size={16} /></button>
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', backgroundColor: rowColor, color: 'white' }}>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedForInvoice.includes(p.id)}
                              onChange={() => toggleSelectForInvoice(p.id)}
                              disabled={isBilled}
                              title={isBilled ? "تمت فوترة هذه المهمة مسبقاً" : "تحديد للفوترة"}
                              style={{ transform: 'scale(1.2)', cursor: isBilled ? 'not-allowed' : 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span>{p.title}</span>
                                <select 
                                  value={p.campaign || 'عام'}
                                  onChange={(e) => {
                                    const newCampaign = e.target.value;
                                    const existing = projects.find(proj => (proj.campaign || 'عام').toLowerCase() === newCampaign.toLowerCase());
                                    const newColor = existing ? (existing.color || getCampaignColor(newCampaign)) : getCampaignColor(newCampaign);
                                    updateProject(p.id, { campaign: newCampaign, color: newColor });
                                  }}
                                  style={{ 
                                    background: 'rgba(255,255,255,0.2)', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    padding: '0.1rem 0.3rem', 
                                    fontSize: '0.75rem', 
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    width: 'fit-content'
                                  }}
                                  title="تغيير الحدث التابع له هذه المهمة"
                                >
                                  {uniqueCampaigns.map(c => <option key={c} value={c} style={{ color: 'black' }}>{c}</option>)}
                                </select>
                              </div>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>{p.deadline || '-'}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{p.description || '-'}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>
                            {p.budget === '' || p.budget == null ? 'لم يحدد' : Number(p.budget).toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <select 
                              value={p.status}
                              onChange={(e) => updateProject(p.id, { status: e.target.value })}
                              style={{ 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '4px', 
                                border: 'none',
                                fontWeight: 700,
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                color: 'black'
                              }}
                            >
                              <option value="Pending">قيد العمل (Pending)</option>
                              <option value="Planning">تخطيط (Planning)</option>
                              <option value="Delivered">تم التسليم (Delivered)</option>
                              <option value="Cancelled">ملغى (Cancelled)</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            {(() => {
                              return (
                                <div 
                                  onClick={() => pStatus.invoiceId && navigate(`/invoices/${pStatus.invoiceId}`)}
                                  style={{ 
                                    display: 'inline-block',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(255,255,255,0.9)',
                                    color: pStatus.color, // uses the color var but works fine on white
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: pStatus.invoiceId ? 'pointer' : 'default'
                                  }}
                                >
                                  {pStatus.label}
                                </div>
                              );
                            })()}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleEditClick(p)}
                              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '0.3rem', borderRadius: '4px', opacity: 0.8 }}
                              title="تعديل المهمة"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) deleteProject(p.id); }}
                              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '0.3rem', borderRadius: '4px', opacity: 0.8 }}
                              title="حذف المهمة"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                )}
              </table>
            </div>


          </div>
        )}
        
        {activeTab === 'invoices' && (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>رقم الفاتورة</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>التاريخ</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>المشروع المرتبط</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>الإجمالي</th>
                  <th style={{ padding: '1rem', fontWeight: 600 }}>الحالة</th>
                  <th style={{ padding: '1rem', fontWeight: 600, width: '50px' }}></th>
                </tr>
              </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد فواتير مسجلة لهذا العميل</td></tr>
              ) : (
                invoices.map(inv => {
                  // Legacy logic for old invoices that had `projectId`
                  const legacyProject = inv.projectId ? projects.find(p => p.id === inv.projectId) : null;
                  
                  // New logic: find projects linked via line items
                  const linkedProjectIds = inv.items?.map(i => i.projectId).filter(Boolean) || [];
                  const linkedProjects = projects.filter(p => linkedProjectIds.includes(p.id));
                  
                  let projectTitle = 'فاتورة عامة';
                  if (linkedProjects.length > 0) {
                    projectTitle = linkedProjects.map(p => p.title).join(' + ');
                  } else if (legacyProject) {
                    projectTitle = legacyProject.title;
                  }

                  const invPayments = payments.filter(p => p.invoiceId === inv.id);
                  const totalPaid = invPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                  const remaining = Math.max(0, inv.total - totalPaid);
                  
                  let statusBadge = { label: 'Pending', color: 'badge-warning' };
                  if (remaining === 0) statusBadge = { label: 'Paid', color: 'badge-success' };
                  else if (totalPaid > 0) statusBadge = { label: 'Partially Paid', color: 'badge-info' };

                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)} className="hover-row">
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>#{inv.invoiceNo}</td>
                      <td style={{ padding: '1rem' }}>{inv.date}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{projectTitle}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{(Number(inv.total) || 0).toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                      <td style={{ padding: '1rem' }}><span className={`badge ${statusBadge.color}`}>{statusBadge.label}</span></td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(window.confirm('هل أنت متأكد من حذف هذه الفاتورة بالكامل؟')) deleteInvoice(inv.id); 
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfile;
