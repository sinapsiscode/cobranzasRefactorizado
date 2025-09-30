import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { 
  Menu, 
  Bell, 
  Search, 
  Settings,
  User,
  LogOut
} from 'lucide-react';
import PropTypes from 'prop-types';

const Header = ({ isMobile = false }) => {
  const { user, logout } = useAuthStore();
  const { 
    setSidebarOpen, 
    toggleGlobalSearch, 
    globalSearch 
  } = useUIStore();
  const { 
    getNotificationCount, 
    getUnreadCount 
  } = useNotificationStore();

  const notificationCount = getUnreadCount();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <header className={`
      bg-white shadow-sm border-b border-gray-200 
      ${isMobile ? 'fixed top-0 left-0 right-0 z-30' : ''} 
      h-16
    `}>
      <div className="flex items-center justify-between h-full px-3 sm:px-4">
        
        {/* Lado izquierdo */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Botón hamburger para móvil */}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 sm:p-2"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Título de página */}
          <div>
            <h1 className="text-sm font-semibold text-gray-900 truncate sm:text-lg">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
        </div>

        {/* Lado derecho */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          
          {/* Búsqueda global (solo desktop) */}
          {!isMobile && (
            <button
              onClick={toggleGlobalSearch}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 relative"
              title="Buscar (Ctrl+K)"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          {/* Notificaciones */}
          <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 relative sm:p-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Perfil de usuario */}
          <div className="relative group">
            <button className="flex items-center space-x-1 p-1.5 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 sm:space-x-2 sm:p-2">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center sm:w-8 sm:h-8">
                <span className="text-xs font-medium text-gray-600 sm:text-sm">
                  {user?.fullName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              {!isMobile && (
                <span className="text-sm font-medium text-gray-700 hidden lg:block">
                  {user?.fullName?.split(' ')[0]}
                </span>
              )}
            </button>

            {/* Dropdown de perfil (solo desktop) */}
            {!isMobile && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                
                {/* Información del usuario */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                </div>

                {/* Opciones del menú */}
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <User className="h-4 w-4 mr-3" />
                    Mi Perfil
                  </button>
                  
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Settings className="h-4 w-4 mr-3" />
                    Configuración
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de búsqueda global */}
      {globalSearch.isOpen && !isMobile && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes, pagos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={globalSearch.query}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Helper para obtener el título de la página
const getPageTitle = (pathname) => {
  const titles = {
    '/admin/dashboard': 'Dashboard Súper administrador',
    '/admin/clients': 'Gestión de Clientes',
    '/admin/payments': 'Gestión de Pagos',
    '/admin/reports': 'Reportes',
    '/admin/settings': 'Configuración',
    '/collector/dashboard': 'Dashboard Cobrador',
    '/collector/clients': 'Mis Clientes',
    '/client/dashboard': 'Mi Cuenta'
  };
  
  return titles[pathname] || 'TV Cable Cobranzas';
};

Header.propTypes = {
  isMobile: PropTypes.bool
};

export default Header;