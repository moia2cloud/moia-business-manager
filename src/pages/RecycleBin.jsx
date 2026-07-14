import { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import useStore from '../store/useStore';

const RecycleBin = () => {
  const { 
    clients, restoreClient, hardDeleteClient,
    projects, restoreProject, hardDeleteProject,
    expenses, restoreExpense, hardDeleteExpense,
    invoices, restoreInvoice, hardDeleteInvoice 
  } = useStore();

  const [activeTab, setActiveTab] = useState('clients');

  const deletedClients = clients.filter(c => c.isDeleted);
  const deletedProjects = projects.filter(p => p.isDeleted);
  const deletedExpenses = expenses.filter(e => e.isDeleted);
  const deletedInvoices = invoices.filter(i => i.isDeleted);

  const renderTable = (items, columns, renderRow) => {
    if (items.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Trash2 size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>سلة المهملات فارغة</h3>
          <p>لا يوجد عناصر محذوفة في هذا القسم.</p>
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
              {columns.map((col, idx) => <th key={idx} style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => renderRow(item))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trash2 size={28} /> سلة المهملات
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>استرجاع البيانات المحذوفة أو حذفها بشكل نهائي.</p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('clients')} style={{ padding: '0.5rem 1rem', fontWeight: 700, color: activeTab === 'clients' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'clients' ? '3px solid var(--primary)' : 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
          العملاء ({deletedClients.length})
        </button>
        <button onClick={() => setActiveTab('projects')} style={{ padding: '0.5rem 1rem', fontWeight: 700, color: activeTab === 'projects' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'projects' ? '3px solid var(--primary)' : 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
          المشاريع ({deletedProjects.length})
        </button>
        <button onClick={() => setActiveTab('invoices')} style={{ padding: '0.5rem 1rem', fontWeight: 700, color: activeTab === 'invoices' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'invoices' ? '3px solid var(--primary)' : 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
          الفواتير ({deletedInvoices.length})
        </button>
        <button onClick={() => setActiveTab('expenses')} style={{ padding: '0.5rem 1rem', fontWeight: 700, color: activeTab === 'expenses' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'expenses' ? '3px solid var(--primary)' : 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
          المصاريف ({deletedExpenses.length})
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {activeTab === 'clients' && renderTable(
          deletedClients,
          ['الاسم', 'تاريخ الحذف', 'إجراءات'],
          (client) => (
            <tr key={client.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem', fontWeight: 600 }}>{client.name}</td>
              <td style={{ padding: '1rem' }}>{client.deletedAt ? new Date(client.deletedAt).toLocaleString() : '-'}</td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => restoreClient(client.id)}><RotateCcw size={16} /> استرجاع</button>
                  <button className="btn btn-danger" onClick={() => { if(window.confirm('حذف نهائي لا يمكن التراجع عنه! متأكد؟')) hardDeleteClient(client.id); }}><Trash2 size={16} /> حذف نهائي</button>
                </div>
              </td>
            </tr>
          )
        )}

        {activeTab === 'projects' && renderTable(
          deletedProjects,
          ['اسم المشروع', 'العميل', 'تاريخ الحذف', 'إجراءات'],
          (project) => {
            const client = clients.find(c => c.id === project.clientId);
            return (
              <tr key={project.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{project.title}</td>
                <td style={{ padding: '1rem' }}>{client ? client.name : '-'}</td>
                <td style={{ padding: '1rem' }}>{project.deletedAt ? new Date(project.deletedAt).toLocaleString() : '-'}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => restoreProject(project.id)}><RotateCcw size={16} /> استرجاع</button>
                    <button className="btn btn-danger" onClick={() => { if(window.confirm('حذف نهائي لا يمكن التراجع عنه! متأكد؟')) hardDeleteProject(project.id); }}><Trash2 size={16} /> حذف نهائي</button>
                  </div>
                </td>
              </tr>
            );
          }
        )}

        {activeTab === 'invoices' && renderTable(
          deletedInvoices,
          ['رقم الفاتورة', 'المبلغ', 'تاريخ الحذف', 'إجراءات'],
          (invoice) => (
            <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem', fontWeight: 600 }}>{invoice.invoiceNo}</td>
              <td style={{ padding: '1rem' }}>{invoice.total}</td>
              <td style={{ padding: '1rem' }}>{invoice.deletedAt ? new Date(invoice.deletedAt).toLocaleString() : '-'}</td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => restoreInvoice(invoice.id)}><RotateCcw size={16} /> استرجاع</button>
                  <button className="btn btn-danger" onClick={() => { if(window.confirm('حذف نهائي لا يمكن التراجع عنه! متأكد؟')) hardDeleteInvoice(invoice.id); }}><Trash2 size={16} /> حذف نهائي</button>
                </div>
              </td>
            </tr>
          )
        )}

        {activeTab === 'expenses' && renderTable(
          deletedExpenses,
          ['البيان', 'المبلغ', 'تاريخ الحذف', 'إجراءات'],
          (expense) => (
            <tr key={expense.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '1rem', fontWeight: 600 }}>{expense.title}</td>
              <td style={{ padding: '1rem' }}>{expense.amount}</td>
              <td style={{ padding: '1rem' }}>{expense.deletedAt ? new Date(expense.deletedAt).toLocaleString() : '-'}</td>
              <td style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => restoreExpense(expense.id)}><RotateCcw size={16} /> استرجاع</button>
                  <button className="btn btn-danger" onClick={() => { if(window.confirm('حذف نهائي لا يمكن التراجع عنه! متأكد؟')) hardDeleteExpense(expense.id); }}><Trash2 size={16} /> حذف نهائي</button>
                </div>
              </td>
            </tr>
          )
        )}
      </div>
    </div>
  );
};

export default RecycleBin;
