import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterCompanyPage } from './pages/auth/RegisterCompanyPage';

// Tenant Pages
import { CompanyDashboardPage } from './pages/dashboard/CompanyDashboardPage';
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { ServicesPage } from './pages/services/ServicesPage';
import { ProfessionalsPage } from './pages/professionals/ProfessionalsPage';
import { AvailabilityPage } from './pages/availability/AvailabilityPage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { SubscriptionPage } from './pages/subscription/SubscriptionPage';
import { CompanySettingsPage } from './pages/settings/CompanySettingsPage';
import { CouponsPage } from './pages/coupons/CouponsPage';
import { WaitlistPage } from './pages/waitlist/WaitlistPage';
import { ReviewsPage } from './pages/reviews/ReviewsPage';

// Super Admin Pages
import { SuperAdminDashboardPage } from './pages/admin/SuperAdminDashboardPage';
import { SuperAdminCompaniesPage } from './pages/admin/SuperAdminCompaniesPage';
import { SuperAdminPlansPage } from './pages/admin/SuperAdminPlansPage';
import { SuperAdminUsersPage } from './pages/admin/SuperAdminUsersPage';

// Public Customer Pages
import { PublicBookingPage } from './pages/public/PublicBookingPage';
import { AppointmentTrackingPage } from './pages/public/AppointmentTrackingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

import { ThemeProvider } from './contexts/ThemeContext';

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
        {/* Rotas Públicas de Acesso */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterCompanyPage />} />

        {/* Rotas Públicas do Cliente (Sem login) */}
        <Route path="/empresa/:companySlug" element={<PublicBookingPage />} />
        <Route
          path="/empresa/:companySlug/profissional/:professionalSlug"
          element={<PublicBookingPage />}
        />
        <Route path="/agendamento/:code" element={<AppointmentTrackingPage />} />
        <Route path="/tracking/:code" element={<AppointmentTrackingPage />} />

        {/* Rotas Protegidas do Tenant (Painel da Empresa) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<CompanyDashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="professionals" element={<ProfessionalsPage />} />
          <Route path="availability" element={<AvailabilityPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="waitlist" element={<WaitlistPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="settings" element={<CompanySettingsPage />} />
        </Route>

        {/* Rotas Protegidas do Super Admin */}
        <Route
          path="/admin"
          element={
            <SuperAdminRoute>
              <SuperAdminLayout />
            </SuperAdminRoute>
          }
        >
          <Route index element={<SuperAdminDashboardPage />} />
          <Route path="companies" element={<SuperAdminCompaniesPage />} />
          <Route path="plans" element={<SuperAdminPlansPage />} />
          <Route path="users" element={<SuperAdminUsersPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
  );
}

export default App;

