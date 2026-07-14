import { useState } from 'react';
import { TrendingUp, Wallet, Receipt, CreditCard, Activity, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';

const StatCard = ({ title, amount, icon, colorClass, subtitle }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</h3>
      <div className={`badge ${colorClass}`} style={{ padding: '0.5rem', borderRadius: '12px' }}>
        {icon}
      </div>
    </div>
    <div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
        {amount.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        {subtitle}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [period, setPeriod] = useState('this_month');
  
  const invoices = useStore(state => state.invoices).filter(i => !i.isDeleted);
  const expenses = useStore(state => state.expenses).filter(e => !e.isDeleted);
  const projects = useStore(state => state.projects).filter(p => !p.isDeleted);
  const payments = useStore(state => state.payments);

  const getFilteredData = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const isDateInPeriod = (dateStr) => {
      if (period === 'all') return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (period === 'this_month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      if (period === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
        return d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth;
      }
      if (period === 'this_year') return d.getFullYear() === currentYear;
      return true;
    };

    const filteredInvoices = invoices.filter(i => isDateInPeriod(i.date));
    const filteredExpenses = expenses.filter(e => isDateInPeriod(e.date));
    // Only include payments that have a valid invoice
    const filteredPayments = payments.filter(p => isDateInPeriod(p.date) && invoices.some(inv => inv.id === p.invoiceId));

    // Revenue is actual cash received in this period
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Pending is the remaining unpaid balance of invoices created in this period
    const totalPending = filteredInvoices.reduce((sum, inv) => {
      const invPayments = payments.filter(p => p.invoiceId === inv.id);
      const invPaid = invPayments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = Math.max(0, Number(inv.total) - invPaid);
      return sum + remaining;
    }, 0);

    const totalExpenses = filteredExpenses
      .reduce((sum, exp) => sum + Number(exp.amount), 0);

    const getProjectPaymentStatus = (projectId) => {
      const invoice = invoices.find(inv => 
        inv.projectId === projectId || (inv.items && inv.items.some(item => item.projectId === projectId))
      );
      return { invoiceId: invoice ? invoice.id : null };
    };

    const filteredProjects = projects.filter(p => isDateInPeriod(p.deadline));
    const totalUnbilled = filteredProjects
      .filter(p => p.status === 'Delivered' && getProjectPaymentStatus(p.id).invoiceId === null)
      .reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

    return {
      totalRevenue,
      totalPending,
      totalExpenses,
      totalUnbilled,
      netProfit: totalRevenue - totalExpenses
    };
  };

  const finances = getFilteredData();
  const activeProjects = projects.filter(p => p.status !== 'Delivered').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>لوحة القيادة</h1>
          <p style={{ color: 'var(--text-muted)' }}>نظرة عامة على الأداء المالي والمشاريع</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Calendar size={18} color="var(--text-muted)" />
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            style={{ border: 'none', background: 'transparent', fontWeight: 600, color: 'var(--primary)', padding: '0.25rem 1rem' }}
          >
            <option value="this_month">هذا الشهر</option>
            <option value="last_month">الشهر الماضي</option>
            <option value="this_year">هذا العام</option>
            <option value="all">كل الأوقات (إلى الأبد)</option>
          </select>
        </div>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          title="الأرباح الصافية" 
          amount={finances.netProfit} 
          icon={<lord-icon src="/icons/wired-outline-3499-line-chart-markers-hover-slide.json" trigger="hover" colors="primary:#10B981,secondary:#0C1E5B" style={{ width: '32px', height: '32px' }}></lord-icon>} 
          colorClass="badge-success"
          subtitle="الإيرادات ناقص المصاريف"
        />
        <StatCard 
          title="إيرادات غير مفوترة" 
          amount={finances.totalUnbilled} 
          icon={<lord-icon src="/icons/wired-outline-421-wallet-purse-hover-pinch.json" trigger="hover" colors="primary:#10B981,secondary:#0C1E5B" style={{ width: '32px', height: '32px' }}></lord-icon>} 
          colorClass="badge-success"
          subtitle="أعمال جاهزة للفوترة"
        />
        <StatCard 
          title="الإيرادات (المدفوعة)" 
          amount={finances.totalRevenue} 
          icon={<lord-icon src="/icons/wired-outline-2367-loan-hover-pinch.json" trigger="hover" colors="primary:#3B82F6,secondary:#0C1E5B" style={{ width: '32px', height: '32px' }}></lord-icon>} 
          colorClass="badge-info"
          subtitle="إجمالي الفواتير المحصلة"
        />
        <StatCard 
          title="ديون مستحقة لك" 
          amount={finances.totalPending} 
          icon={<lord-icon src="/icons/wired-outline-421-wallet-purse-hover-pinch.json" trigger="hover" colors="primary:#F59E0B,secondary:#0C1E5B" style={{ width: '32px', height: '32px' }}></lord-icon>} 
          colorClass="badge-warning"
          subtitle="فواتير بانتظار الدفع أو متأخرة"
        />
        <StatCard 
          title="المصاريف" 
          amount={finances.totalExpenses} 
          icon={<lord-icon src="/icons/wired-outline-2915-spending-money-hover-pinch.json" trigger="hover" colors="primary:#EF4444,secondary:#0C1E5B" style={{ width: '32px', height: '32px' }}></lord-icon>} 
          colorClass="badge-danger"
          subtitle="إجمالي الإنفاق"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Quick Actions / Activity */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Activity size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>إحصائيات سريعة</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>مشاريع نشطة</span>
              <span className="badge badge-info">{activeProjects} مشروع</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>إجمالي العملاء</span>
              <span className="badge badge-success">{useStore(state => state.clients.length)} عميل</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
              <span style={{ fontWeight: 600 }}>فواتير مسجلة</span>
              <span className="badge badge-warning">{useStore(state => state.invoices.length)} فاتورة</span>
            </div>
          </div>
        </div>

        {/* Brand Banner */}
        <div className="card" style={{ 
          background: 'var(--primary)', 
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.5rem'
        }}>
          <img src="/moia-media-icon.png" alt="MOIA Icon" style={{ width: '80px', height: 'auto', objectFit: 'contain', marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-en)' }}>MOIA Media</h3>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Business Manager System</p>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Receipt size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>أحدث الدفعات المستلمة</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>التاريخ</th>
                <th style={{ padding: '1rem' }}>العميل / الفاتورة</th>
                <th style={{ padding: '1rem' }}>طريقة الدفع</th>
                <th style={{ padding: '1rem' }}>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {[...payments].filter(p => invoices.some(inv => inv.id === p.invoiceId)).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map(payment => {
                const invoice = invoices.find(i => i.id === payment.invoiceId);
                const client = invoice ? useStore.getState().clients.find(c => c.id === invoice.clientId) : null;
                return (
                  <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{payment.date}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>
                        {client ? <Link to={`/clients/${client.id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-link">{client.name}</Link> : 'عميل غير معروف'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {invoice ? <Link to={`/invoices/${invoice.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }} className="hover-link">فاتورة #{invoice.invoiceNo}</Link> : 'فاتورة #محذوفة'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-info">{payment.method}</span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--success)' }}>
                      {Number(payment.amount).toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </td>
                  </tr>
                );
              })}
              {payments.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد أي دفعات مسجلة في النظام.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
