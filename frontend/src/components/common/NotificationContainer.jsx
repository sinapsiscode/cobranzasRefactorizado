import React from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    const iconProps = { className: 'h-5 w-5' };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'info':
      default:
        return <Info {...iconProps} />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-400',
          title: 'text-green-800',
          message: 'text-green-700',
          button: 'text-green-500 hover:text-green-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-400',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'text-red-500 hover:text-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-400',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'text-yellow-500 hover:text-yellow-600'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-400',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'text-blue-500 hover:text-blue-600'
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => {
        const colors = getColors(notification.type);
        
        return (
          <div
            key={notification.id}
            className={`${colors.bg} ${colors.border} border rounded-lg p-4 shadow-lg animate-slide-down`}
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 ${colors.icon}`}>
                {getIcon(notification.type)}
              </div>
              
              <div className="ml-3 w-0 flex-1">
                {notification.title && (
                  <p className={`text-sm font-medium ${colors.title}`}>
                    {notification.title}
                  </p>
                )}
                
                <p className={`text-sm ${colors.message} ${notification.title ? 'mt-1' : ''}`}>
                  {notification.message}
                </p>

                {/* Acciones */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-3 flex space-x-2">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.action();
                          removeNotification(notification.id);
                        }}
                        className={`text-xs font-medium ${colors.button} underline hover:no-underline`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Botón cerrar */}
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`inline-flex ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                >
                  <span className="sr-only">Cerrar</span>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Barra de progreso para auto-close */}
            {notification.autoClose && notification.duration > 0 && (
              <div className={`mt-2 h-1 ${colors.bg} rounded-full overflow-hidden`}>
                <div
                  className={`h-full bg-current opacity-30 transition-all ease-linear`}
                  style={{
                    width: '100%',
                    animation: `shrink ${notification.duration}ms linear`
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NotificationContainer;