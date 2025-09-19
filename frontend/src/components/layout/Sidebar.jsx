import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { usePaymentStore } from '../../stores/paymentStore';
import NotificationBadge from '../common/NotificationBadge';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  Wallet,
  Wrench,
  Shield,
  Database,
  Calendar
} from 'lucide-react';
import PropTypes from 'prop-types';

const Sidebar = ({ isMobile = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdminOrSubAdmin } = useAuthStore();
  const { 
    sidebarOpen, 
    sidebarCollapsed, 
    setSidebarOpen, 
    toggleSidebarCollapse 
  } = useUIStore();
  const { getPendingValidationCount, fetchPayments } = usePaymentStore();

  // Obtener conteo de pagos pendientes por validar
  const pendingValidationCount = getPendingValidationCount();

  // Cargar pagos al montar el componente para Admin/SubAdmin
  useEffect(() => {
    if (isAdminOrSubAdmin()) {
      fetchPayments();
    }
  }, [isAdminOrSubAdmin, fetchPayments]);

  // Configuración de navegación por rol
  const getNavigation = () => {
    switch (user?.role) {
      case 'subadmin':
        return [
          { name: 'Dashboard', href: '/subadmin/dashboard', icon: LayoutDashboard },
          { name: 'Clientes', href: '/subadmin/clients', icon: Users },
          { name: 'Datos Extendidos', href: '/subadmin/extended-data', icon: Database },
          { name: 'Deudas Mensuales', href: '/subadmin/monthly-debts', icon: Calendar },
          { name: 'Cobradores', href: '/subadmin/collectors', icon: UserCheck },
          { name: 'Pagos', href: '/subadmin/payments', icon: CreditCard },
          { name: 'Gestión de Cajas', href: '/subadmin/cashboxes', icon: Wallet },
          { name: 'Reportes', href: '/subadmin/reports', icon: FileText },
          { name: 'Configuración', href: '/subadmin/settings', icon: Settings },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Clientes', href: '/admin/clients', icon: Users },
          { name: 'Datos Extendidos', href: '/admin/extended-data', icon: Database },
          { name: 'Deudas Mensuales', href: '/admin/monthly-debts', icon: Calendar },
          { name: 'Cobradores', href: '/admin/collectors', icon: UserCheck },
          { name: 'Usuarios', href: '/admin/users', icon: Shield },
          { name: 'Pagos', href: '/admin/payments', icon: CreditCard },
          { name: 'Gestión de Cajas', href: '/admin/cashboxes', icon: Wallet },
          { name: 'Servicios', href: '/admin/services', icon: Wrench },
          { name: 'Backups', href: '/admin/backups', icon: Shield },
          { name: 'Reportes', href: '/admin/reports', icon: FileText },
          { name: 'Configuración', href: '/admin/settings', icon: Settings },
        ];
      case 'collector':
        return [
          { name: 'Dashboard', href: '/collector/dashboard', icon: LayoutDashboard },
          { name: 'Clientes', href: '/collector/clients', icon: Users },
          { name: 'Pagos', href: '/collector/payments', icon: CreditCard },
          { name: 'Mi Caja', href: '/collector/cash-box', icon: Wallet },
        ];
      case 'client':
        return [
          { name: 'Mi Cuenta', href: '/client/dashboard', icon: LayoutDashboard },
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const isActiveRoute = (href) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 bg-white shadow-lg transition-transform duration-300 ease-in-out
        ${isMobile
          ? `z-50 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `z-30 transition-all ${sidebarCollapsed ? 'w-16' : 'w-64'}`
        }
      `}>
        
        {/* Header del sidebar */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-gray-200 sm:px-4">
          <img
            src="/logo.png"
            alt="Wasi Fibra TV Logo"
            className={`object-contain ${
              isMobile ? 'w-12 h-12' : sidebarCollapsed ? 'w-10 h-10 mx-auto' : 'w-14 h-14'
            } sm:w-16 sm:h-16`}
          />

          {/* Botones de control */}
          {isMobile ? (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 sm:p-2"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            !sidebarCollapsed && (
              <button
                onClick={toggleSidebarCollapse}
                className="p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 sm:p-2"
                aria-label="Contraer menú"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )
          )}
        </div>

        {/* Información del usuario */}
        {(isMobile || !sidebarCollapsed) && (
          <div className="px-3 py-3 border-b border-gray-200 sm:px-4 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 sm:w-10 sm:h-10">
                <span className="text-xs font-medium text-gray-600 sm:text-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate sm:text-sm">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto sm:px-4 sm:py-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            const isPaymentsItem = item.name === 'Pagos';
            const showNotification = isPaymentsItem && isAdminOrSubAdmin() && pendingValidationCount > 0;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2.5 text-xs font-medium rounded-md transition-colors relative sm:text-sm sm:py-2
                  ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }
                  ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}
                `}
                title={sidebarCollapsed ? item.name : ''}
              >
                <div className="relative flex-shrink-0">
                  <Icon className={`
                    flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5
                    ${isActive ? 'text-white' : 'text-gray-500'}
                    ${(!sidebarCollapsed || isMobile) ? 'mr-2 sm:mr-3' : ''}
                  `} />
                  {showNotification && sidebarCollapsed && (
                    <NotificationBadge 
                      count={pendingValidationCount}
                      size="small"
                    />
                  )}
                </div>
                {(isMobile || !sidebarCollapsed) && (
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{item.name}</span>
                    {showNotification && (
                      <span className="ml-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse sm:ml-2">
                        {pendingValidationCount > 99 ? '99+' : pendingValidationCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Botón de logout */}
        <div className="px-2 py-3 border-t border-gray-200 sm:px-4 sm:py-4">
          <button
            onClick={handleLogout}
            className={`
              group flex items-center w-full px-2 py-2.5 text-xs font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-100 transition-colors sm:text-sm sm:py-2
              ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}
            `}
            title={sidebarCollapsed && !isMobile ? 'Cerrar Sesión' : ''}
          >
            <LogOut className={`
              flex-shrink-0 h-4 w-4 text-gray-500 sm:h-5 sm:w-5
              ${(!sidebarCollapsed || isMobile) ? 'mr-2 sm:mr-3' : ''}
            `} />
            {(isMobile || !sidebarCollapsed) && 'Cerrar Sesión'}
          </button>
        </div>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  isMobile: PropTypes.bool
};

export default Sidebar;