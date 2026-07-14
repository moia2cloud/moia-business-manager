import { useState } from 'react';
import { Plus, FolderKanban, Clock, CheckCircle2, CircleDashed, AlertCircle, XCircle, Trash2, Siren } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

const Projects = () => {
  const navigate = useNavigate();
  const { projects, addProject, updateProject, deleteProject, clients, addClient } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', clientId: '', status: 'Planning', priority: 'Normal', budget: 0, deadline: '' });
  const [clientFilter, setClientFilter] = useState('');
  const [period, setPeriod] = useState('this_month');
  const [sortByPriority, setSortByPriority] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [quickClientName, setQuickClientName] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newProject.title) return;
    addProject(newProject);
    setNewProject({ title: '', clientId: '', status: 'Planning', priority: 'Normal', budget: 0, deadline: '' });
    setIsModalOpen(false);
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Urgent': return { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--danger)', label: 'عاجل (Urgent)' };
      case 'Low': return { bg: 'rgba(100, 116, 139, 0.1)', text: 'var(--text-muted)', label: 'منخفض (Low)' };
      default: return { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--info)', label: 'عادي (Normal)' };
    }
  };

  const columns = [
    { id: 'Planning', title: 'تخطيط (Planning)', color: 'var(--warning)', icon: <Clock size={18} /> },
    { id: 'Pending', title: 'قيد العمل (Pending)', color: 'var(--info)', icon: <CircleDashed size={18} /> },
    { id: 'Delivered', title: 'تم التسليم (Delivered)', color: 'var(--success)', icon: <CheckCircle2 size={18} /> },
    { id: 'Cancelled', title: 'ملغى (Cancelled)', color: 'var(--danger)', icon: <XCircle size={18} /> },
  ];

  // Map old statuses if any and filter out deleted ones
  const normalizedProjects = projects.filter(p => !p.isDeleted).map(p => ({
    ...p,
    status: p.status === 'In Progress' ? 'Pending' : p.status
  }));

  const isDateInPeriod = (dateStr) => {
    if (period === 'all') return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (period === 'this_month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (period === 'last_month') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth;
    }
    if (period === 'this_year') return d.getFullYear() === currentYear;
    return true;
  };

  const filteredProjects = normalizedProjects.filter(p => {
    const clientMatch = clientFilter === '' || p.clientId === clientFilter;
    if (!clientMatch) return false;
    
    // Always show active tasks regardless of the selected period
    if (p.status === 'Planning' || p.status === 'Pending') return true;
    
    // Filter completed/cancelled tasks by the selected period
    return isDateInPeriod(p.deadline);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>المشاريع والمهام (Kanban)</h1>
          <p style={{ color: 'var(--text-muted)' }}>إدارة المهام ومراحل العمل لجميع العملاء</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', fontWeight: 600, color: 'var(--primary)' }}
          >
            <option value="this_month">هذا الشهر</option>
            <option value="last_month">الشهر الماضي</option>
            <option value="this_year">هذا العام</option>
            <option value="all">كل الأوقات</option>
          </select>
          <select 
            value={clientFilter} 
            onChange={e => setClientFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}
          >
            <option value="">-- جميع العملاء --</option>
            {clients.filter(c => !c.isDeleted).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button 
            className="btn" 
            style={{ 
              backgroundColor: sortByPriority ? 'var(--danger)' : 'transparent', 
              color: sortByPriority ? 'white' : 'var(--danger)', 
              border: '2px solid var(--danger)',
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700
            }}
            onClick={() => setSortByPriority(!sortByPriority)}
            title="ترتيب المهام حسب الأهمية (عاجل أولاً)"
          >
            <Siren size={20} />
            {sortByPriority ? 'الأولوية مفعلة' : 'الأولوية'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> مهمة جديدة
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        overflowX: 'auto', 
        paddingBottom: '1rem',
        minHeight: '60vh',
        alignItems: 'flex-start'
      }}>
        {columns.map(col => {
          let colProjects = filteredProjects.filter(p => p.status === col.id);
          if (sortByPriority) {
            const priorityWeight = { 'Urgent': 3, 'Normal': 2, 'Low': 1 };
            colProjects.sort((a, b) => (priorityWeight[b.priority || 'Normal'] || 2) - (priorityWeight[a.priority || 'Normal'] || 2));
          }
          return (
            <div key={col.id} style={{ 
              flex: '0 0 320px', 
              backgroundColor: 'rgba(0,0,0,0.02)', 
              borderRadius: '12px', 
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              borderTop: `4px solid ${col.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: col.color }}>{col.icon}</span>
                  {col.title}
                </h3>
                <span style={{ backgroundColor: 'var(--bg-card)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}>
                  {colProjects.length}
                </span>
              </div>

              {colProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: '8px' }}>
                  لا توجد مهام
                </div>
              ) : (
                colProjects.map(project => {
                  const client = clients.find(c => c.id === project.clientId);
                  const pStyle = getPriorityStyle(project.priority || 'Normal');
                  
                  return (
                    <div key={project.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: `4px solid ${pStyle.text}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>{project.title}</h4>
                        {/* Priority Selector */}
                        <select 
                          value={project.priority || 'Normal'}
                          onChange={(e) => updateProject(project.id, { priority: e.target.value })}
                          style={{ 
                            padding: '0.15rem 0.4rem', 
                            fontSize: '0.75rem', 
                            borderRadius: '4px', 
                            border: 'none', 
                            backgroundColor: pStyle.bg, 
                            color: pStyle.text, 
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Urgent">عاجل</option>
                          <option value="Normal">عادي</option>
                          <option value="Low">منخفض</option>
                        </select>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div>
                          <strong>العميل: </strong>
                          {client ? (
                            <Link to={`/clients/${client.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                              {client.name}
                            </Link>
                          ) : 'عام'}
                        </div>
                        {project.campaign && project.campaign !== 'عام' && (
                          <div><strong>الحدث: </strong>{project.campaign}</div>
                        )}
                        <div><strong>التاريخ: </strong>{project.deadline || '-'}</div>
                      </div>

                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <select 
                          value={project.status}
                          onChange={(e) => updateProject(project.id, { status: e.target.value })}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}
                        >
                          <option value="Planning">تخطيط (Planning)</option>
                          <option value="Pending">قيد العمل (Pending)</option>
                          <option value="Delivered">تم التسليم (Delivered)</option>
                          <option value="Cancelled">ملغى (Cancelled)</option>
                        </select>
                        <button className="btn btn-danger" style={{ padding: '0.4rem', flexShrink: 0 }} onClick={() => { if(window.confirm('حذف المهمة؟')) deleteProject(project.id) }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Add Project Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 800 }}>مهمة / مشروع جديد</h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم المهمة</label>
                <input required type="text" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="مثال: فيديو ترويجي" />
              </div>
              
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <span>العميل</span>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingClient(!isAddingClient)} 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    {isAddingClient ? 'إلغاء الإضافة' : '+ إضافة عميل سريع'}
                  </button>
                </label>
                {isAddingClient ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="اسم العميل الجديد..." 
                      value={quickClientName} 
                      onChange={e => setQuickClientName(e.target.value)} 
                      style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }} 
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => {
                        if (!quickClientName.trim()) return;
                        const newId = Date.now().toString();
                        addClient({ id: newId, name: quickClientName, company: '', email: '', phone: '', notes: '' });
                        setNewProject({...newProject, clientId: newId});
                        setQuickClientName('');
                        setIsAddingClient(false);
                      }}
                    >
                      حفظ
                    </button>
                  </div>
                ) : (
                  <select value={newProject.clientId} onChange={e => setNewProject({...newProject, clientId: e.target.value})}>
                    <option value="">-- اختر العميل (اختياري) --</option>
                    {clients.filter(c => !c.isDeleted).map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `- ${c.company}` : ''}</option>)}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>الأولوية</label>
                  <select value={newProject.priority} onChange={e => setNewProject({...newProject, priority: e.target.value})}>
                    <option value="Normal">عادي (Normal)</option>
                    <option value="Urgent">عاجل (Urgent)</option>
                    <option value="Low">منخفض (Low)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>الحالة</label>
                  <select value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                    <option value="Planning">تخطيط (Planning)</option>
                    <option value="Pending">قيد العمل (Pending)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>الميزانية (JOD)</label>
                  <input type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>التاريخ / موعد التسليم</label>
                  <input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
