import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import {
  Menu,
  LogOut
} from 'lucide-react';
import PropTypes from 'prop-types';

const Header = ({ isMobile = false }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { setSidebarOpen } = useUIStore();

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