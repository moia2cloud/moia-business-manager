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
