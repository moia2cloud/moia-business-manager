import { useState } from 'react';
import { Plus, Wallet, Trash2, Repeat, Pencil } from 'lucide-react';
import useStore from '../store/useStore';

const Expenses = () => {
  const { 
    expenses, 
    recurringExpenses, 
    addExpense, 
    updateExpense,
    deleteExpense, 
    addRecurringExpense, 
    updateRecurringExpense,
    deleteRecurringExpense 
  } = useStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('regular');

  // null means creating new, otherwise it holds the ID being edited
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingRecurringId, setEditingRecurringId] = useState(null);

  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'Equipment', date: new Date().toISOString().split('T')[0] });
  const [newRecurring, setNewRecurring] = useState({ title: '', amount: '', category: 'Software', frequency: 'monthly', nextDueDate: new Date().toISOString().split('T')[0] });

  // Open modals
  const openExpenseModal = (expense = null) => {
    if (expense) {
      setEditingExpenseId(expense.id);
      setNewExpense(expense);
    } else {
      setEditingExpenseId(null);
      setNewExpense({ title: '', amount: '', category: 'Equipment', date: new Date().toISOString().split('T')[0] });
    }
    setIsModalOpen(true);
  };

  const openRecurringModal = (recurring = null) => {
    if (recurring) {
      setEditingRecurringId(recurring.id);
      setNewRecurring(recurring);
    } else {
      setEditingRecurringId(null);
      setNewRecurring({ title: '', amount: '', category: 'Software', frequency: 'monthly', nextDueDate: new Date().toISOString().split('T')[0] });
    }
    setIsRecurringModalOpen(true);
  };

  // Handlers
  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    
    if (editingExpenseId) {
      updateExpense(editingExpenseId, { ...newExpense, amount: Number(newExpense.amount) });
    } else {
      addExpense({ ...newExpense, amount: Number(newExpense.amount), isAuto: false });
    }
    setIsModalOpen(false);
  };

  const handleSaveRecurring = (e) => {
    e.preventDefault();
    if (!newRecurring.title || !newRecurring.amount) return;
    
    if (editingRecurringId) {
      updateRecurringExpense(editingRecurringId, { ...newRecurring, amount: Number(newRecurring.amount) });
    } else {
      addRecurringExpense({ ...newRecurring, amount: Number(newRecurring.amount) });
    }
    setIsRecurringModalOpen(false);
  };

  const activeExpenses = expenses.filter(e => !e.isDeleted);
  const totalExpenses = activeExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>المصاريف</h1>
          <p style={{ color: 'var(--text-muted)' }}>تتبع المدفوعات والالتزامات الثابتة</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => openRecurringModal()}>
            <Repeat size={20} /> إضافة التزام متكرر
          </button>
          <button className="btn btn-primary" onClick={() => openExpenseModal()}>
            <Plus size={20} /> مصروف لمرة واحدة
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('regular')}
          style={{ padding: '0.5rem 1rem', fontWeight: 700, color: activeTab === 'regular' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'regular' ? '3px solid var(--primary)' : 'none' }}
        >
          سجل المصاريف الفعلي
        </button>
        <button 
          onClick={() => setActiveTab('recurring')}
          style={{ padding: '0.5rem 1rem', fontWeight: 700, color: activeTab === 'recurring' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'recurring' ? '3px solid var(--primary)' : 'none' }}
        >
          الالتزامات والاشتراكات
        </button>
      </div>

      {activeTab === 'regular' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>إجمالي المصاريف المسجلة:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
          </div>
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>التاريخ</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>البيان / الوصف</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>التصنيف</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>نوع التسجيل</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>المبلغ</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {activeExpenses.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>لا توجد مصاريف مسجلة.</td></tr>
              ) : (
                activeExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{exp.date}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{exp.title}</td>
                    <td style={{ padding: '1rem' }}><span className="badge badge-info">{exp.category}</span></td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {exp.isAuto ? 'تلقائي (اشتراك)' : 'يدوي'}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--danger)' }}>
                      {exp.amount.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => openExpenseModal(exp)} style={{ color: 'var(--info)', padding: '0.5rem' }}>
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => { if(window.confirm('حذف هذا المصروف؟')) deleteExpense(exp.id); }} style={{ color: 'var(--danger)', padding: '0.5rem' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === 'recurring' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', backgroundColor: '#f0fdf4', borderBottom: '1px solid var(--border-color)', color: 'var(--success)' }}>
            <strong>نظام ذكي:</strong> هذه الالتزامات سيتم تسجيلها كمصاريف تلقائياً في يوم استحقاقها بمجرد فتحك للتطبيق!
          </div>
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>اسم الالتزام / الاشتراك</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>التصنيف</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>التكرار</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>المبلغ الثابت</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>تاريخ الدفعة القادمة</th>
                <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {recurringExpenses.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>لا توجد التزامات متكررة مسجلة.</td></tr>
              ) : (
                recurringExpenses.map(rec => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{rec.title}</td>
                    <td style={{ padding: '1rem' }}><span className="badge badge-info">{rec.category}</span></td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {rec.frequency === 'monthly' ? 'شهري' : 'سنوي'}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--danger)' }}>
                      {rec.amount.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--warning)' }}>{rec.nextDueDate}</td>
                    <td style={{ padding: '1rem' }}>
                       <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => openRecurringModal(rec)} style={{ color: 'var(--info)', padding: '0.5rem' }}>
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => { if(window.confirm('إلغاء هذا الالتزام المتكرر؟')) deleteRecurringExpense(rec.id); }} style={{ color: 'var(--danger)', padding: '0.5rem' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 800 }}>
              {editingExpenseId ? 'تعديل المصروف' : 'مصروف لمرة واحدة'}
            </h2>
            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>البيان (الوصف)</label>
                <input required type="text" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} placeholder="مثال: شراء عدسة جديدة" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>التصنيف</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                  <option value="Equipment">معدات تصوير</option>
                  <option value="Software">اشتراكات لمرة واحدة</option>
                  <option value="Freelancers">رواتب ومستقلين</option>
                  <option value="Marketing">تسويق وإعلانات</option>
                  <option value="Office">مكتب وضيافة</option>
                  <option value="Other">أخرى</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>المبلغ (JOD)</label>
                <input required type="number" step="0.01" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>التاريخ</label>
                <input required type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recurring Modal */}
      {isRecurringModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 800 }}>
              {editingRecurringId ? 'تعديل الالتزام' : 'التزام متكرر جديد'}
            </h2>
            <form onSubmit={handleSaveRecurring} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم الاشتراك / الالتزام</label>
                <input required type="text" value={newRecurring.title} onChange={e => setNewRecurring({...newRecurring, title: e.target.value})} placeholder="مثال: إيجار المكتب" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>التصنيف</label>
                <select value={newRecurring.category} onChange={e => setNewRecurring({...newRecurring, category: e.target.value})}>
                  <option value="Software">اشتراكات برامج (Adobe/Envato)</option>
                  <option value="Office">إيجار أو فواتير شهرية</option>
                  <option value="Freelancers">رواتب موظفين</option>
                  <option value="Other">أخرى</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>التكرار (Frequency)</label>
                <select value={newRecurring.frequency} onChange={e => setNewRecurring({...newRecurring, frequency: e.target.value})}>
                  <option value="monthly">شهرياً (كل شهر)</option>
                  <option value="yearly">سنوياً (كل سنة)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>المبلغ (JOD)</label>
                <input required type="number" step="0.01" value={newRecurring.amount} onChange={e => setNewRecurring({...newRecurring, amount: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>تاريخ الدفعة القادمة</label>
                <input required type="date" value={newRecurring.nextDueDate} onChange={e => setNewRecurring({...newRecurring, nextDueDate: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsRecurringModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
