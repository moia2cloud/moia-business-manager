import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import Expenses from './pages/Expenses';
import InvoiceBuilder from './pages/InvoiceBuilder';
import InvoiceDetails from './pages/InvoiceDetails';
import InvoicesList from './pages/InvoicesList';
import Settings from './pages/Settings';
import Services from './pages/Services';
import RecycleBin from './pages/RecycleBin';
import useStore from './store/useStore';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  useEffect(() => {
    const store = useStore.getState();
    const clients = store.clients;
    
    // Find original TARA Events client (by company name)
    let taraClient = clients.find(c => c.company && c.company.toUpperCase().includes('TARA'));
    if (!taraClient) taraClient = clients.find(c => c.name && c.name.toUpperCase().includes('TARA'));
    
    // Find Fiterman Pharma Jordan
    let fitermanClient = clients.find(c => c.company && c.company.toUpperCase().includes('FITERMAN'));
    if (!fitermanClient) fitermanClient = clients.find(c => c.name && c.name.toUpperCase().includes('FITERMAN'));

    let hasChanges = false;
    let newProjects = [...store.projects];

    // Only seed if they currently have no projects (to restore what was lost)
    if (newProjects.length === 0) {
      if (taraClient) {
        const taraProjects = [
          { title: 'مونتاج السنة كاملة ل Orange corner', date: '2026-02-11', notes: 'موشن جرافيك', budget: 100, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'Orange corner' },
          { title: 'تصوير كلوزينج حفل جائزة QRCE', date: '2026-02-11', notes: 'مع مونتاج', budget: 100, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'QRCE' },
          { title: 'تضامن', date: '2026-02-16', notes: 'مع مونتاج', budget: 125, status: 'Delivered', paymentStatus: 'Paid', campaign: 'تضامن' },
          { title: 'راصد WOMENLABEL - جامعه', date: '2026-03-09', notes: 'مع مونتاج', budget: 125, status: 'Delivered', paymentStatus: 'Paid', campaign: 'WOMEN LABEL' },
          { title: 'WOMEN LABEL افطار رمضان', date: '2026-03-08', notes: 'مع مونتاج', budget: 100, status: 'Delivered', paymentStatus: 'Paid', campaign: 'WOMEN LABEL' },
          { title: 'ارادة - موشن قريبا هاكثون 2026', date: '2026-04-01', notes: 'مع مونتاج', budget: 100, status: 'Delivered', paymentStatus: 'Paid', campaign: 'ارادة' },
          { title: 'مشروع ستاربكس استاد رمضان', date: '2026-01-03', notes: 'تصوير مفرق عمان اربد مع مونتاج وتسليم صور', budget: 275, status: 'Delivered', paymentStatus: 'Paid', campaign: 'ستاربكس' },
          { title: 'QRCE - تصوير 1', date: '2026-04-07', notes: '', budget: 50, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'QRCE' },
          { title: 'QRCE - تصوير 2', date: '2026-04-11', notes: '', budget: 50, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'QRCE' },
          { title: 'QRCE - تصوير 3', date: '2026-04-18', notes: '', budget: 50, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'QRCE' },
          { title: '💰💰💰💵', date: '2026-04-21', notes: 'حوالة من صهيب 200+200', budget: 400, status: 'Delivered', paymentStatus: 'Paid', campaign: 'عام' },
          { title: 'Expact جمعية البنوك', date: '2026-04-26', notes: 'تصوير مع حازم', budget: 50, status: 'Delivered', paymentStatus: 'Paid', campaign: 'جمعية البنوك' },
          { title: 'women label ppl CSO مونتاج', date: '', notes: 'مونتاج المشروع كامل', budget: 175, status: 'Delivered', paymentStatus: 'Paid', campaign: 'WOMEN LABEL' },
          { title: 'starbuks powHer', date: '', notes: '4 days مع مونتاج مقابلات وتصوير', budget: 300, status: 'Pending', paymentStatus: 'Unpaid', campaign: 'ستاربكس' },
          { title: 'هاكثون ارادة', date: '', notes: '', budget: 600, status: 'Pending', paymentStatus: 'Unpaid', campaign: 'ارادة' },
          { title: 'women label CSO (2-EU) مونتاج', date: '', notes: '', budget: 175, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'WOMEN LABEL' },
          { title: 'norway - اليات التفاعل - 28', date: '2026-07-28', notes: 'تصوير ثلاث ايام', budget: 50, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'norway' },
          { title: 'norway - اليات التفاعل - 29', date: '2026-07-29', notes: '', budget: 50, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'norway' },
          { title: 'norway - اليات التفاعل - 30', date: '2026-07-30', notes: '', budget: 50, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'norway' },
          { title: 'مونتاج ريلز راصد NORWAY', date: '2026-07-12', notes: 'مونتاج الثلاث ايام مع مونتاج ريكورد', budget: 50, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'norway' }
        ];

        taraProjects.forEach(tp => {
          newProjects.push({
            id: 'proj-' + Math.random().toString(36).substr(2, 9),
            title: tp.title,
            clientId: taraClient.id,
            deadline: tp.date,
            notes: tp.notes,
            budget: tp.budget,
            status: tp.status,
            paymentStatus: tp.paymentStatus,
            campaign: tp.campaign,
            isDeleted: false
          });
          hasChanges = true;
        });
      }

      if (fitermanClient) {
        const fitermanProjects = [
          { title: 'تصوير فيديو - تصوير ل DR. SMEER ALHELO', date: '2026-07-14', notes: '', budget: 70, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'DR. SMEER ALHELO' },
          { title: 'مونتاج ريلز عدد 5 - تصوير ل DR. SMEER ALHELO', date: '2026-07-14', notes: 'العدد 5', budget: 100, status: 'Delivered', paymentStatus: 'Unpaid', campaign: 'DR. SMEER ALHELO' }
        ];

        fitermanProjects.forEach(tp => {
          newProjects.push({
            id: 'proj-' + Math.random().toString(36).substr(2, 9),
            title: tp.title,
            clientId: fitermanClient.id,
            deadline: tp.date,
            notes: tp.notes,
            budget: tp.budget,
            status: tp.status,
            paymentStatus: tp.paymentStatus,
            campaign: tp.campaign,
            isDeleted: false
          });
          hasChanges = true;
        });
      }
    }

    if (hasChanges) {
      useStore.setState({ projects: newProjects });
    }
  }, []);

  useEffect(() => {
    useStore.getState().processRecurringExpenses();
    
    // Migrate company settings to MOIA.CC
    const settings = useStore.getState().companySettings;
    if (settings.email !== 'info@moia.cc') {
      useStore.getState().updateCompanySettings({
        ...settings,
        name: 'MOIA.CC',
        email: 'info@moia.cc'
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientProfile />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="services" element={<Services />} />
          <Route path="invoice-builder" element={<InvoiceBuilder />} />
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="invoices/:id" element={<InvoiceDetails />} />
          <Route path="settings" element={<Settings />} />
          <Route path="recycle-bin" element={<RecycleBin />} />
          </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
