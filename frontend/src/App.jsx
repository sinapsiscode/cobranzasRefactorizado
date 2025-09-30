import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';

// Layout Components
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ClientManagement from './pages/admin/ClientManagement';
import ImportClients from './pages/admin/ImportClients';
import ExtendedClientData from './pages/admin/ExtendedClientData';
import MonthlyDebts from './pages/admin/MonthlyDebts';
import CollectorManagement from './pages/admin/CollectorManagement';
import UserManagement from './pages/admin/UserManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import CashBoxManagement from './pages/admin/CashBoxManagement';
import ServiceManagement from './pages/admin/ServiceManagement';
import BackupManagement from './pages/admin/BackupManagement';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Analytics from './pages/admin/Analytics';
import PaymentMethodSettings from './pages/admin/PaymentMethodSettings';

// SubAdmin Pages
import SubAdminUserManagement from './pages/subadmin/UserManagement';

// Collector Pages
import CollectorDashboard from './pages/collector/Dashboard';
import CollectorClients from './pages/collector/Clients';
import CollectorVouchers from './pages/collector/Vouchers';
import CashBox from './pages/collector/CashBox';

// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import UploadVoucher from './pages/client/UploadVoucher';

// Common Components
import ErrorBoundary from './components/common/ErrorBoundary';
import NotificationContainer from './components/common/NotificationContainer';
import CollectorAlerts from './components/common/CollectorAlerts';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const { isAuthenticated, user, validateToken, loading } = useAuthStore();
  const { initialize, globalLoading } = useUIStore();

  useEffect(() => {
    // Inicializar UI store
    initialize();
    
    // Validar token si existe
    if (localStorage.getItem('tv-cable-auth')) {
      validateToken();
    }
  }, [validateToken, initialize]);

  // Mostrar loading mientras se valida token
  if (loading || globalLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
          {/* Ruta de login */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRoute(user?.role)} replace />
              ) : (
                <Login />
              )
            } 
          />

          {/* Rutas protegidas con Layout */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    {/* Rutas de SubAdministrador y Admin */}
                    <Route 
                      path="/admin/dashboard" 
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subadmin/dashboard" 
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <AdminDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/clients" 
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <ClientManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/import-clients" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <ImportClients />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/extended-data" 
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <ExtendedClientData />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/monthly-debts" 
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <MonthlyDebts />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subadmin/clients" 
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <ClientManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subadmin/extended-data" 
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <ExtendedClientData />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subadmin/monthly-debts" 
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <MonthlyDebts />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/collectors" 
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <CollectorManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <UserManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/subadmin/users"
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <SubAdminUserManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subadmin/collectors"
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <CollectorManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/admin/payments" 
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <PaymentManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subadmin/payments" 
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <PaymentManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/cashboxes" 
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <CashBoxManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subadmin/cashboxes" 
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <CashBoxManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/services" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <ServiceManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/backups" 
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <BackupManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/admin/reports"
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <Reports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/analytics"
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/payment-methods"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <PaymentMethodSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/subadmin/reports" 
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <Reports />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/settings" 
                      element={
                        <ProtectedRoute requiredRole={['admin', 'subadmin']}>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subadmin/settings" 
                      element={
                        <ProtectedRoute requiredRole="subadmin">
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Rutas de Cobrador */}
                    <Route 
                      path="/collector/dashboard" 
                      element={
                        <ProtectedRoute requiredRole="collector">
                          <CollectorDashboard />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/collector/clients" 
                      element={
                        <ProtectedRoute requiredRole="collector">
                          <CollectorClients />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/collector/vouchers" 
                      element={
                        <ProtectedRoute requiredRole="collector">
                          <CollectorVouchers />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/collector/cash-box" 
                      element={
                        <ProtectedRoute requiredRole="collector">
                          <CashBox />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Rutas de Cliente */}
                    <Route
                      path="/client/dashboard"
                      element={
                        <ProtectedRoute requiredRole="client">
                          <ClientDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/client/upload-voucher"
                      element={
                        <ProtectedRoute requiredRole="client">
                          <UploadVoucher />
                        </ProtectedRoute>
                      }
                    />

                    {/* Ruta por defecto - redirigir según rol */}
                    <Route 
                      path="/" 
                      element={<Navigate to={getDefaultRoute(user?.role)} replace />} 
                    />

                    {/* 404 - Página no encontrada */}
                    <Route 
                      path="*" 
                      element={
                        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
                          <div className="text-center">
                            <h1 className="text-9xl font-bold text-gray-200">404</h1>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                              Página no encontrada
                            </h2>
                            <p className="text-gray-600 mb-8">
                              La página que buscas no existe o fue movida.
                            </p>
                            <button
                              onClick={() => window.location.href = getDefaultRoute(user?.role)}
                              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Volver al inicio
                            </button>
                          </div>
                        </div>
                      } 
                    />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } 
          />
        </Routes>

        {/* Container de notificaciones */}
        <NotificationContainer />
        
        {/* Alertas para cobradores */}
        <CollectorAlerts />
      </div>
    </ErrorBoundary>
  );
}

// Función helper para obtener ruta por defecto según rol
function getDefaultRoute(role) {
  switch (role) {
    case 'subadmin':
      return '/subadmin/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'collector':
      return '/collector/dashboard';
    case 'client':
      return '/client/dashboard';
    default:
      return '/login';
  }
}

export default App;