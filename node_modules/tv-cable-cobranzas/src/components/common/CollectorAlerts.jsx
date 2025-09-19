import React, { useEffect } from 'react';
import { useAlertStore } from '../../stores/alertStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { Bell, X, CheckCircle, Clock } from 'lucide-react';

const CollectorAlerts = () => {
  const { user } = useAuthStore();
  const { success } = useNotificationStore();
  const { 
    getActiveAlertsForCollector, 
    acknowledgeAlert, 
    dismissAlert 
  } = useAlertStore();

  // Solo mostrar para cobradores
  if (!user || user.role !== 'collector') {
    return null;
  }

  const alerts = getActiveAlertsForCollector(user.id);

  const handleAcknowledge = (alertId) => {
    acknowledgeAlert(alertId, user.id);
    success('Recordatorio confirmado');
  };

  const handleDismiss = (alertId) => {
    dismissAlert(alertId, user.id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {alerts.map((alert, index) => (
          <div key={alert.id} className={`${index > 0 ? 'border-t' : ''}`}>
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Bell className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {alert.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(alert.createdAt)}
                    </div>
                  </div>
                </div>
                
                {/* Badge de prioridad */}
                {alert.priority === 'high' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Alta prioridad
                  </span>
                )}
              </div>

              {/* Mensaje */}
              <div className="mb-6">
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                  <p className="text-gray-800 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Información importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Este recordatorio es enviado semanalmente</li>
                    <li>Debes cerrar tu caja antes del final del día</li>
                    <li>Envía el reporte correspondiente a tu supervisor</li>
                  </ul>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Entendido, procederé
                </button>
                
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  title="Cerrar recordatorio"
                >
                  <X className="h-4 w-4 mr-1" />
                  <span className="text-sm">Cerrar</span>
                </button>
              </div>

              {/* Footer con información del remitente */}
              {alert.createdBy && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Recordatorio enviado por administración
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectorAlerts;