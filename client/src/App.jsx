import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import CreateDocumentPage from './pages/CreateDocumentPage';
import PreviewDocument from './pages/PreviewDocument';
import DocumentHistoryPage from './pages/DocumentHistoryPage';
import SettingsPage from './pages/SettingsPage';
import CustomersPage from './pages/CustomersPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <CurrencyProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
        <Route path="/history" element={<AppLayout><DocumentHistoryPage /></AppLayout>} />
        <Route path="/customers" element={<AppLayout><CustomersPage /></AppLayout>} />
        <Route path="/create-document" element={<AppLayout><CreateDocumentPage /></AppLayout>} />
        <Route path="/documents/:id" element={<PreviewDocument />} />
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      </CurrencyProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App
