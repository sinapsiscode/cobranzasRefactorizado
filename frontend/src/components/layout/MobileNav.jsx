import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useVoucherStore } from '../../stores/voucherStore';
import { LayoutDashboard, Users, Upload, CheckCircle, DollarSign } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { getPendingPayments } = usePaymentStore();
  const { getVouchersByStatus } = useVoucherStore();

  // Solo mostrar para cobradores
  if (user?.role !== 'collector') {
    return null;
  }

  const pendingCount = getPendingPayments().length;
  const pendingVouchers = getVouchersByStatus('pending').length;

  const navigation = [
    {
      name: 'Dashboard',
      href: '/collector/dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Cobros',
      href: '/collector/payments',
      icon: DollarSign,
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      name: 'Vouchers',
      href: '/collector/vouchers',
      icon: Upload,
      badge: pendingVouchers > 0 ? pendingVouchers : null
    },
    {
      name: 'Mi Caja',
      href: '/collector/cash-box',
      icon: CheckCircle,
      badge: null
    }
  ];

  const isActiveRoute = (href) => {
    return location.pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
      <div className="grid grid-cols-4 h-16">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex flex-col items-center justify-center space-y-1 p-2 relative
                ${isActive
                  ? 'text-primary bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
                }
                ${item.isAction ? 'bg-primary text-white hover:bg-blue-600' : ''}
                transition-colors touch-friendly
              `}
            >
              {/* Badge de notificación */}
              {item.badge && (
                <span className="absolute top-1 right-1/2 translate-x-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}

              <Icon className={`
                h-5 w-5 
                ${item.isAction ? 'text-white' : ''}
              `} />
              
              <span className={`
                text-xs font-medium
                ${item.isAction ? 'text-white' : ''}
              `}>
                {item.name}
              </span>

              {/* Indicador activo */}
              {isActive && !item.isAction && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Resumen del día (sticky) */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Hoy: 
          </span>
          <div className="flex space-x-4">
            <span className="text-green-600 font-medium">
              3 cobrados
            </span>
            <span className="text-orange-600 font-medium">
              {pendingCount} pendientes
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;