import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Printer, ArrowRight, Trash2, Banknote, CreditCard, Landmark } from 'lucide-react';
import useStore from '../store/useStore';

const InvoiceDetails = () => {
  const { id } = useParams();
  const { invoices, clients, projects, payments, addPayment, deletePayment, companySettings } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Cash', reference: '', notes: '' });
  
  // State for printing a specific receipt
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);

  const invoice = invoices.find(i => i.id === id);
  if (!invoice) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>الفاتورة غير موجودة</div>;

  const client = clients.find(c => c.id === invoice.clientId);
  const project = projects.find(p => p.id === invoice.projectId);
  
  const invoicePayments = payments.filter(p => p.invoiceId === id);
  const totalPaid = invoicePayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.max(0, invoice.total - totalPaid);

  const getStatus = () => {
    if (remaining === 0) return { label: 'Paid', color: 'badge-success' };
    if (totalPaid > 0) return { label: 'Partially Paid', color: 'badge-info' };
    return { label: 'Pending', color: 'badge-warning' };
  };

  const status = getStatus();

  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!newPayment.amount || Number(newPayment.amount) <= 0) return;
    
    addPayment({
      ...newPayment,
      amount: Number(newPayment.amount),
      invoiceId: id
    });
    
    setNewPayment({ amount: '', date: new Date().toISOString().split('T')[0], method: 'Cash', reference: '', notes: '' });
    setIsModalOpen(false);
  };

  const triggerPrintReceipt = (payment) => {
    setReceiptToPrint(payment);
    setIsPrintingInvoice(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const triggerPrintInvoice = () => {
    setReceiptToPrint(null);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="print-reset gap-print-reset" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Hide the main content during print */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to={`/clients/${client?.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '0.5rem' }}>
              <ArrowRight size={16} /> عودة لملف العميل
            </Link>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              فاتورة #{invoice.invoiceNo}
              <span className={`badge ${status.color}`} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>{status.label}</span>
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>{client?.name} {project ? ` - مشروع: ${project.title}` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={triggerPrintInvoice} title="عرض وطباعة الفاتورة">
              <Printer size={20} /> عرض / طباعة (PDF)
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} disabled={remaining === 0}>
              <Plus size={20} /> تسجيل دفعة جديدة
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>إجمالي الفاتورة</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{invoice.total.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>المبلغ المدفوع</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{totalPaid.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>الرصيد المتبقي</span>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: remaining > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{remaining.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
          </div>
        </div>

        {/* Payments Ledger */}
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Banknote size={20} /> سجل الدفعات (Payment Ledger)
          </h2>
          
          {invoicePayments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              لم يتم تسجيل أي دفعات لهذه الفاتورة بعد.
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>التاريخ</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>المبلغ</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>طريقة الدفع</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>المرجع / ملاحظات</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicePayments.sort((a, b) => new Date(b.date) - new Date(a.date)).map(payment => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{payment.date}</td>
                      <td style={{ padding: '1rem', color: 'var(--success)', fontWeight: 700 }}>
                        {Number(payment.amount).toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="badge badge-info" style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                          {payment.method === 'Cash' && <Banknote size={14} />}
                          {payment.method === 'Bank Transfer' && <Landmark size={14} />}
                          {payment.method === 'CliQ' && <CreditCard size={14} />}
                          {payment.method}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {payment.reference && <strong>#{payment.reference} </strong>}
                        {payment.notes}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => triggerPrintReceipt(payment)}>
                            <Printer size={16} /> سند قبض
                          </button>
                          <button className="btn btn-danger" style={{ padding: '0.4rem 0.6rem' }} onClick={() => { if(window.confirm('حذف هذه الدفعة؟')) deletePayment(payment.id) }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 800 }}>تسجيل دفعة</h2>
            <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>المبلغ (JOD)</label>
                  <input required type="number" step="0.01" max={remaining} value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} />
                  {Number(newPayment.amount) === remaining ? (
                    <small style={{ color: 'var(--success)', display: 'inline-block', marginTop: '0.25rem', fontWeight: 700, padding: '0.2rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                      سيتم سداد الفاتورة بالكامل ✔️
                    </small>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <small 
                        style={{ color: 'var(--success)', cursor: 'pointer', display: 'inline-block', fontWeight: 600, padding: '0.2rem 0.5rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', border: '1px solid var(--success)' }}
                        onClick={() => setNewPayment({...newPayment, amount: remaining})}
                        title="اضغط لإدخال كامل المبلغ المتبقي"
                      >
                        إدراج كامل المتبقي ({remaining} JOD)
                      </small>
                      {Number(newPayment.amount) > 0 && (
                        <small style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                          المتبقي بعد الدفعة: {Math.max(0, remaining - Number(newPayment.amount))} JOD
                        </small>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>التاريخ</label>
                  <input required type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>طريقة الدفع</label>
                <select value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})}>
                  <option value="Cash">كاش (Cash)</option>
                  <option value="Bank Transfer">حوالة بنكية (Bank Transfer)</option>
                  <option value="CliQ">كليك (CliQ)</option>
                  <option value="Check">شيك (Check)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>رقم المرجع / الإيصال (اختياري)</label>
                <input type="text" value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} placeholder="مثال: رقم الحوالة أو الشيك" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>ملاحظات (اختياري)</label>
                <textarea rows="2" value={newPayment.notes} onChange={e => setNewPayment({...newPayment, notes: e.target.value})}></textarea>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الدفعة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT LAYOUT: Payment Receipt (سند قبض) */}
      {receiptToPrint && (
        <div className="print-only print-receipt">
          <div style={{ padding: '2rem', border: '2px solid var(--border-color)', borderRadius: '12px', maxWidth: '600px', margin: '0 auto', fontFamily: 'var(--font-ar)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <img src="/moia logo.png" alt="MOIA Logo" style={{ width: '120px', height: 'auto', marginBottom: '10px' }} />
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.2rem' }}>{companySettings.name}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>سند قبض</h1>
                <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-muted)' }}>PAYMENT RECEIPT</h2>
                <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>رقم السند: #{receiptToPrint.id.slice(-6)}</div>
                <div style={{ color: 'var(--text-muted)' }}>التاريخ: {receiptToPrint.date}</div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem', lineHeight: '1.8' }}>
              <div style={{ display: 'flex', marginBottom: '1rem' }}>
                <div style={{ width: '150px', fontWeight: 700 }}>استلمنا من المكرم:</div>
                <div style={{ flex: 1, borderBottom: '1px dashed #ccc', fontWeight: 600 }}>{client?.name} {client?.company ? `(${client.company})` : ''}</div>
              </div>
              <div style={{ display: 'flex', marginBottom: '1rem' }}>
                <div style={{ width: '150px', fontWeight: 700 }}>مبلغاً وقدره:</div>
                <div style={{ flex: 1, borderBottom: '1px dashed #ccc', fontWeight: 600 }}>
                  {Number(receiptToPrint.amount).toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                </div>
              </div>
              <div style={{ display: 'flex', marginBottom: '1rem' }}>
                <div style={{ width: '150px', fontWeight: 700 }}>طريقة الدفع:</div>
                <div style={{ flex: 1, borderBottom: '1px dashed #ccc' }}>
                  {receiptToPrint.method} {receiptToPrint.reference ? `(مرجع: ${receiptToPrint.reference})` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', marginBottom: '1rem' }}>
                <div style={{ width: '150px', fontWeight: 700 }}>وذلك عن:</div>
                <div style={{ flex: 1, borderBottom: '1px dashed #ccc' }}>
                  دفعة من حساب فاتورة رقم ({invoice.invoiceNo})
                  {project ? ` - مشروع ${project.title}` : ''}
                  {receiptToPrint.notes ? ` - ${receiptToPrint.notes}` : ''}
                </div>
              </div>
            </div>

            {/* Balances Box */}
            <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '2rem' }}>
              <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>إجمالي الفاتورة</div>
                <div style={{ fontWeight: 700 }}>{invoice.total.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>المبلغ المدفوع</div>
                <div style={{ fontWeight: 700, color: 'var(--success)' }}>{Number(receiptToPrint.amount).toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</div>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>الرصيد المتبقي للفاتورة</div>
                <div style={{ fontWeight: 700, color: 'var(--danger)' }}>
                  {remaining.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', padding: '0 2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #000', width: '150px', paddingTop: '0.5rem', fontWeight: 600 }}>توقيع المستلم</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #000', width: '150px', paddingTop: '0.5rem', fontWeight: 600 }}>ختم الشركة</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* INVOICE PREVIEW & PRINT LAYOUT */}
      <div className="card mt-print-reset" style={{ overflowX: 'auto' }}>
        <h2 className="no-print" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          معاينة الفاتورة
        </h2>
        <div className="invoice-paper" style={{ minWidth: '800px', backgroundColor: '#fff', border: '1px solid #ddd', margin: '0 auto', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="invoice-inner-padding" style={{ backgroundColor: '#fff', color: '#000', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ textAlign: 'left' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0, letterSpacing: '2px' }}>INVOICE</h1>
                <div style={{ color: '#666', marginTop: '0.5rem' }}>#{invoice.invoiceNo}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <img src="/moia logo.png" alt="MOIA Logo" style={{ width: '180px', height: 'auto', marginBottom: '15px' }} />
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{companySettings.address}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{companySettings.email} | {companySettings.phone}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', textAlign: 'left', flexDirection: 'row-reverse' }}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', direction: 'ltr', textAlign: 'left' }}>BILL TO:</div>
                {client && (
                  <div style={{ fontSize: '1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', textAlign: 'left', direction: 'ltr' }}>
                    {invoice.clientCompanyDisplay !== undefined ? (
                      <>
                        {invoice.clientCompanyDisplay && <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{invoice.clientCompanyDisplay}</div>}
                        {invoice.clientNameDisplay && <div>{invoice.clientNameDisplay}</div>}
                        {invoice.clientAddressDisplay && <div style={{ color: '#666', fontSize: '1rem' }}>{invoice.clientAddressDisplay}</div>}
                        {invoice.clientPhoneDisplay && <div style={{ color: '#666', fontSize: '1rem' }}>{invoice.clientPhoneDisplay}</div>}
                        {invoice.clientEmailDisplay && <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>{invoice.clientEmailDisplay}</div>}
                      </>
                    ) : (
                      <>
                        <div style={{ fontWeight: 700 }}>{client.company || client.name}</div>
                        <div>{client.company ? client.name : ''}</div>
                        <div style={{ color: '#666' }}>{client.email}</div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', direction: 'ltr' }}>
                  <span style={{ fontWeight: 600 }}>Date:</span>
                  <span>{invoice.date}</span>
                </div>
                {invoice.dueDate && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', direction: 'ltr' }}>
                    <span style={{ fontWeight: 600 }}>Due Date:</span>
                    <span>{invoice.dueDate}</span>
                  </div>
                )}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                  <th style={{ padding: '0.75rem' }}>Description</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', width: '100px' }}>Qty</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', width: '120px' }}>Rate (JOD)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', width: '120px' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee', fontWeight: 600 }}>
                    <td style={{ padding: '0.75rem' }}>{item.desc}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{Number(item.rate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                      {(item.qty * item.rate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
              <div style={{ width: '300px' }}>
                {Number(invoice.discount) > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: '#666' }}>
                      <span>Subtotal:</span>
                      <span>{(invoice.total + Number(invoice.discount)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} JOD</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', color: 'var(--danger)' }}>
                      <span>Discount:</span>
                      <span>- {Number(invoice.discount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} JOD</span>
                    </div>
                  </>
                )}
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontWeight: 700, fontSize: '1.2rem', borderTop: '2px solid var(--primary)', marginTop: Number(invoice.discount) > 0 ? '0.5rem' : '0', direction: 'ltr' }}>
                  <span>Total:</span>
                  <span style={{ color: 'var(--primary)' }}>{invoice.total.toLocaleString('en-US', { style: 'currency', currency: 'JOD', minimumFractionDigits: 0, maximumFractionDigits: 3 })}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--accent)', textAlign: 'left' }}>
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
    </div>
  );
};

export default InvoiceDetails;
