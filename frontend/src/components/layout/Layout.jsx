import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNav from './MobileNav';
import PropTypes from 'prop-types';

const Layout = ({ children }) => {
  const { user } = useAuthStore();
  const { 
    sidebarOpen, 
    sidebarCollapsed, 
    isMobile, 
    isTablet,
    handleResize 
  } = useUIStore();

  // Manejar cambios de tamaño de ventana
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Diferentes layouts según el dispositivo y rol
  const renderLayout = () => {
    // Layout móvil para cobradores (bottom navigation)
    if (isMobile && user?.role === 'collector') {
      return (
        <div className="min-h-screen bg-gray-50 pb-16">
          {/* Header fijo */}
          <Header isMobile={true} />
          
          {/* Contenido principal */}
          <main className="pt-16">
            {children}
          </main>

          {/* Navegación inferior */}
          <MobileNav />
        </div>
      );
    }

    // Layout móvil estándar
    if (isMobile) {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header con hamburger menu */}
          <Header isMobile={true} />
          
          {/* Sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black opacity-50" />
              <Sidebar isMobile={true} />
            </div>
          )}

          {/* Contenido principal */}
          <main className="pt-16">
            {children}
          </main>
        </div>
      );
    }

    // Layout desktop/tablet
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Contenido principal */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          {/* Header */}
          <Header />
          
          {/* Contenido */}
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    );
  };

  return renderLayout();
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;