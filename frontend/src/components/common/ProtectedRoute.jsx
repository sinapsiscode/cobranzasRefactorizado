import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuthStore();

  // Mostrar loading mientras se valida la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar rol requerido
  if (requiredRole) {
    // Si requiredRole es un array, verificar si el usuario tiene alguno de los roles
    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!rolesArray.includes(user.role)) {
      // Redirigir a la página apropiada según su rol
      const defaultRoutes = {
        subadmin: '/subadmin/dashboard',
        admin: '/admin/dashboard',
        collector: '/collector/dashboard',
        client: '/client/dashboard'
      };
      
      return <Navigate to={defaultRoutes[user.role] || '/login'} replace />;
    }
  }

  // Si todo está bien, renderizar los children
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOfType([
    PropTypes.oneOf(['subadmin', 'admin', 'collector', 'client']),
    PropTypes.arrayOf(PropTypes.oneOf(['subadmin', 'admin', 'collector', 'client']))
  ])
};

export default ProtectedRoute;