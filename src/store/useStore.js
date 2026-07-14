import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      isHydratedFromBackend: false, // Flag used by ProtectedRoute
      // State
      companySettings: {
        name: 'MOIA.CC',
        address: 'Amman, Jordan',
        email: 'info@moia.cc',
        phone: '+962 7 9000 0000',
        paymentAlias: 'MOIA',
        bankName: 'Arab Bank',
        accountName: 'Mohammad Osama'
      },
      clients: [], // { id, name, company, email, phone, notes }
      projects: [], // { id, title, clientId, status, budget, deadline }
      expenses: [], // { id, title, amount, category, date }
      recurringExpenses: [], // { id, title, amount, category, frequency (monthly/yearly), nextDueDate }
      invoices: [], // { id, invoiceNo, clientId, date, dueDate, items, total, status }
      payments: [], // { id, invoiceId, amount, date, method, reference, notes }
      services: [ // Pre-configured
        { id: 'srv-1', title: 'Video production', desc: '1 short reels', rate: 100 },
        { id: 'srv-2', title: 'Social media Design', desc: 'Post design', rate: 40 },
      ],

      // App Initialization (Run on load)
      processRecurringExpenses: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        let newExpenses = [...state.expenses];
        let updatedRecurring = [...state.recurringExpenses];
        let hasChanges = false;

        updatedRecurring = updatedRecurring.map(rec => {
          let nextDue = new Date(rec.nextDueDate);
          const currentDate = new Date(today);
          let currentRec = { ...rec };

          // While the due date is in the past or today, generate the expense
          while (nextDue <= currentDate) {
            hasChanges = true;
            // Generate expense record
            newExpenses.push({
              id: `auto-${currentRec.id}-${nextDue.getTime()}`,
              title: `${currentRec.title}`,
              amount: currentRec.amount,
              category: currentRec.category,
              date: nextDue.toISOString().split('T')[0],
              isAuto: true
            });

            // Advance the due date
            if (currentRec.frequency === 'monthly') {
              nextDue.setMonth(nextDue.getMonth() + 1);
            } else if (currentRec.frequency === 'yearly') {
              nextDue.setFullYear(nextDue.getFullYear() + 1);
            } else {
              break; // fallback to avoid infinite loop on bad data
            }
          }
          currentRec.nextDueDate = nextDue.toISOString().split('T')[0];
          return currentRec;
        });

        if (hasChanges) {
          set({ expenses: newExpenses, recurringExpenses: updatedRecurring });
        }
      },

      // Actions
      updateCompanySettings: (newSettings) => set({ companySettings: newSettings }),
      
      addClient: (client) => set((state) => ({ clients: [...state.clients, { ...client, id: client.id || Date.now().toString(), isDeleted: false }] })),
      updateClient: (id, data) => set((state) => ({ clients: state.clients.map(c => c.id === id ? { ...c, ...data } : c) })),
      deleteClient: (id) => set((state) => ({ clients: state.clients.map(c => c.id === id ? { ...c, isDeleted: true, deletedAt: new Date().toISOString() } : c) })),
      restoreClient: (id) => set((state) => ({ clients: state.clients.map(c => c.id === id ? { ...c, isDeleted: false, deletedAt: null } : c) })),
      hardDeleteClient: (id) => set((state) => ({ 
        clients: state.clients.filter(c => c.id !== id),
        projects: state.projects.map(p => p.clientId === id ? { ...p, isDeleted: true, deletedAt: new Date().toISOString() } : p),
        invoices: state.invoices.map(i => i.clientId === id ? { ...i, isDeleted: true, deletedAt: new Date().toISOString() } : i)
      })),
      
      addProject: (project) => set((state) => ({ projects: [...state.projects, { ...project, id: Date.now().toString(), isDeleted: false }] })),
      updateProject: (id, data) => set((state) => ({ projects: state.projects.map(p => p.id === id ? { ...p, ...data } : p) })),
      deleteProject: (id) => set((state) => ({ projects: state.projects.map(p => p.id === id ? { ...p, isDeleted: true, deletedAt: new Date().toISOString() } : p) })),
      restoreProject: (id) => set((state) => ({ projects: state.projects.map(p => p.id === id ? { ...p, isDeleted: false, deletedAt: null } : p) })),
      hardDeleteProject: (id) => set((state) => ({ projects: state.projects.filter(p => p.id !== id) })),
      
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, { ...expense, id: Date.now().toString(), isDeleted: false }] })),
      updateExpense: (id, data) => set((state) => ({ expenses: state.expenses.map(e => e.id === id ? { ...e, ...data } : e) })),
      deleteExpense: (id) => set((state) => ({ expenses: state.expenses.map(e => e.id === id ? { ...e, isDeleted: true, deletedAt: new Date().toISOString() } : e) })),
      restoreExpense: (id) => set((state) => ({ expenses: state.expenses.map(e => e.id === id ? { ...e, isDeleted: false, deletedAt: null } : e) })),
      hardDeleteExpense: (id) => set((state) => ({ expenses: state.expenses.filter(e => e.id !== id) })),
      
      addRecurringExpense: (recurring) => {
        set((state) => ({ recurringExpenses: [...state.recurringExpenses, { ...recurring, id: Date.now().toString() }] }));
        get().processRecurringExpenses();
      },
      updateRecurringExpense: (id, data) => {
        set((state) => ({ recurringExpenses: state.recurringExpenses.map(r => r.id === id ? { ...r, ...data } : r) }));
        get().processRecurringExpenses();
      },
      deleteRecurringExpense: (id) => set((state) => ({ recurringExpenses: state.recurringExpenses.filter(r => r.id !== id) })),

      addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, { ...invoice, id: Date.now().toString(), isDeleted: false }] })),
      updateInvoiceStatus: (id, status) => set((state) => ({ invoices: state.invoices.map(i => i.id === id ? { ...i, status } : i) })),
      deleteInvoice: (id) => set((state) => ({ invoices: state.invoices.map(i => i.id === id ? { ...i, isDeleted: true, deletedAt: new Date().toISOString() } : i) })),
      restoreInvoice: (id) => set((state) => ({ invoices: state.invoices.map(i => i.id === id ? { ...i, isDeleted: false, deletedAt: null } : i) })),
      hardDeleteInvoice: (id) => set((state) => ({ 
        invoices: state.invoices.filter(i => i.id !== id),
        payments: state.payments.filter(p => p.invoiceId !== id)
      })),

      addPayment: (payment) => set((state) => ({ payments: [...state.payments, { ...payment, id: Date.now().toString() }] })),
      deletePayment: (id) => set((state) => ({ payments: state.payments.filter(p => p.id !== id) })),

      addService: (service) => set((state) => ({ services: [...state.services, { ...service, id: Date.now().toString() }] })),
      updateService: (id, data) => set((state) => ({ services: state.services.map(s => s.id === id ? { ...s, ...data } : s) })),
      deleteService: (id) => set((state) => ({ services: state.services.filter(s => s.id !== id) })),

    }),
    {
      name: 'moia-business-storage',
    }
  )
);

// --- Backend Sync Logic ---
let syncTimeout;
useStore.subscribe((state, prevState) => {
  // Only sync if we have hydrated from the backend to avoid overwriting backend with empty state
  if (!state.isHydratedFromBackend) return;

  const token = localStorage.getItem('moia_token');
  if (!token) return;

  // Debounce the sync to avoid spamming the backend
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      // Don't send the isHydratedFromBackend flag to the backend
      const { isHydratedFromBackend, ...stateToSave } = state;
      await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stateToSave)
      });
    } catch (err) {
      console.error('Failed to sync state to backend', err);
    }
  }, 1000); // 1 second debounce
});

export default useStore;
