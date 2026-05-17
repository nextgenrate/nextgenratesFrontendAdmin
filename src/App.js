import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdmin } from './context/AuthContext';
import { GlobalStyles } from './components/UI';

import LoginPage          from './pages/auth/LoginPage';
import DashboardPage      from './pages/dashboard/DashboardPage';
import RegistrationsPage  from './pages/registrations/RegistrationsPage';
import KycPage            from './pages/kyc/KycPage';
import RatesPage          from './pages/rates/RatesPage';
import PortsPage          from './pages/ports/PortsPage';          // ← NEW
import BookingsPage       from './pages/bookings/BookingsPage';
import { UsersPage, EnquiriesPage, SearchActivityPage } from './pages/misc/OtherPages';

const AnalyticsPage = React.lazy(() => import('./pages/analytics/AnalyticsPage'));

function Guard({ children }) {
  const { admin } = useAdmin();
  const location  = useLocation();
  if (!admin) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function PublicGuard({ children }) {
  const { admin } = useAdmin();
  if (admin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"           element={<PublicGuard><LoginPage /></PublicGuard>} />
      <Route path="/dashboard"       element={<Guard><DashboardPage /></Guard>} />
      <Route path="/registrations"   element={<Guard><RegistrationsPage /></Guard>} />
      <Route path="/kyc"             element={<Guard><KycPage /></Guard>} />
      <Route path="/users"           element={<Guard><UsersPage /></Guard>} />
      <Route path="/rates"           element={<Guard><RatesPage /></Guard>} />
      <Route path="/ports"           element={<Guard><PortsPage /></Guard>} />   {/* ← NEW */}
      <Route path="/bookings"        element={<Guard><BookingsPage /></Guard>} />
      <Route path="/enquiries"       element={<Guard><EnquiriesPage /></Guard>} />
      <Route path="/search-activity" element={<Guard><SearchActivityPage /></Guard>} />
      <Route path="/analytics"       element={
        <Guard>
          <React.Suspense fallback={<div style={{ padding:40, textAlign:'center', color:'#94A3B8' }}>Loading…</div>}>
            <AnalyticsPage />
          </React.Suspense>
        </Guard>
      } />
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <GlobalStyles />
        <AppRoutes />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
