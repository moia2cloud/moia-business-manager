import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Search, Plus, Filter, Trash2, CheckCircle2, CircleDashed, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';

const InvoicesList = () => {
  const navigate = useNavigate();
  const { invoices, clients, payments, deleteInvoice } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getInvoiceStatus = (inv) => {
    if (inv.status === 'Cancelled') return { label: 'ملغاة', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' };
    
    const invPayments = payments.filter(p => p.invoiceId === inv.id);
    const paid = invPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Math.max(0, inv.total - paid);

    if (paid === 0) return { label: 'غير مدفوعة', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)', value: 'unpaid' };
    if (remaining === 0) return { label: 'مدفوعة بالكامل', color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)', value: 'paid' };
    return { label: 'مدفوعة جزئياً', color: 'var(--info)', bg: 'rgba(59, 130, 246, 0.1)', value: 'partial' };
  };

  const filteredInvoices = invoices.filter(inv => {
    if (inv.isDeleted) return false;
    const client = clients.find(c => c.id === inv.clientId);
    const searchMatch = 
      (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client && client.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (!searchMatch) return false;

    if (statusFilter !== 'all') {
      const status = getInvoiceStatus(inv).value || 'cancelled';
      if (status !== statusFilter) return false;
    }

    return true;
  }).sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  // Calculate top summaries
  const activeInvoices = invoices.filter(i => !i.isDeleted);
  const totalInvoiced = activeInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalPaid = payments.filter(p => activeInvoices.some(i => i.id === p.invoiceId)).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = Math.max(0, totalInvoiced - totalPaid);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>جميع الفواتير</h1>
          <p style={{ color: 'var(--text-muted)' }}>إدارة واستعراض جميع الفواتير الصادرة</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/invoice-builder" className="btn btn-primary">
            <Plus size={20} /> إصدار فاتورة جديدة
          </Link>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '4px solid var(--info)' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي الفواتير الصادرة</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalInvoiced.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '4px solid var(--success)' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي المحصل (المدفوع)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
            {totalPaid.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '4px solid var(--warning)' }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي المستحق (الديون)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
            {totalPending.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="ابحث برقم الفاتورة أو اسم العميل..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 2.5rem 0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}
            >
              <option value="all">جميع الحالات</option>
              <option value="paid">مدفوعة بالكامل</option>
              <option value="partial">مدفوعة جزئياً</option>
              <option value="unpaid">غير مدفوعة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>رقم الفاتورة</th>
                <th style={{ padding: '1rem' }}>العميل</th>
                <th style={{ padding: '1rem' }}>التاريخ</th>
                <th style={{ padding: '1rem' }}>الاستحقاق</th>
                <th style={{ padding: '1rem' }}>المبلغ الإجمالي</th>
                <th style={{ padding: '1rem' }}>الحالة</th>
                <th style={{ padding: '1rem' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    لا توجد فواتير تطابق بحثك.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const client = clients.find(c => c.id === inv.clientId);
                  const status = getInvoiceStatus(inv);
                  
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>
                        <Link to={`/invoices/${inv.id}`} style={{ fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }} className="hover-link">
                          {inv.invoiceNo}
                        </Link>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>
                        {client ? <Link to={`/clients/${client.id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-link">{client.name}</Link> : 'عميل محذوف'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{inv.date}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{inv.dueDate || '-'}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>
                        {Number(inv.total).toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ backgroundColor: status.bg, color: status.color, padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => navigate(`/invoices/${inv.id}`)} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}>
                            عرض
                          </button>
                          <button 
                            onClick={() => { if(window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم حذف دفعاتها أيضاً.')) deleteInvoice(inv.id) }} 
                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem' }}
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoicesList;
