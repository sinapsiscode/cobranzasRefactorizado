import React from 'react';
import { Clock, User, AlertTriangle, CheckCircle, Pause, XCircle, RotateCcw, MessageCircle } from 'lucide-react';
import { getStatusLabel, getStatusColor } from '../../services/mock/schemas/client';

const ClientHistory = ({ client, onClose }) => {
  // Función helper para abrir WhatsApp
  const openWhatsApp = (phone) => {
    if (!phone) return;
    
    // Limpiar el número: quitar espacios, guiones y caracteres especiales
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Si no empieza con código de país, agregar 51 (Perú)
    const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    
    // Abrir en nueva ventana
    window.open(whatsappUrl, '_blank');
  };

  // Función para obtener el ícono del estado
  const getStatusIcon = (status) => {
    const icons = {
      active: <CheckCircle className="h-4 w-4 text-green-600" />,
      terminated: <XCircle className="h-4 w-4 text-gray-600" />,
      debt: <AlertTriangle className="h-4 w-4 text-red-600" />,
      paused: <Pause className="h-4 w-4 text-yellow-600" />,
      suspended: <Clock className="h-4 w-4 text-orange-600" />
    };
    return icons[status] || <Clock className="h-4 w-4 text-gray-600" />;
  };

  // Función para obtener el nombre del usuario que hizo el cambio
  const getChangedByName = (changedBy) => {
    if (!changedBy) return 'Sistema';
    if (changedBy === 'system') return 'Sistema Automático';
    if (changedBy.includes('admin')) return 'Súper administrador';
    if (changedBy.includes('subadmin')) return 'Administrador';
    return 'Usuario';
  };

  // Función para determinar si un cambio es baja o reactivación
  const getChangeType = (fromStatus, toStatus) => {
    if (toStatus === 'terminated') return 'baja';
    if (fromStatus === 'terminated' && toStatus === 'active') return 'reactivacion';
    if ((fromStatus === 'suspended' || fromStatus === 'debt' || fromStatus === 'paused') && toStatus === 'active') return 'reactivacion';
    return 'cambio';
  };

  // Crear línea de tiempo completa incluyendo la creación
  const timelineEvents = [
    {
      id: 'created',
      date: client.createdAt || client.installationDate,
      fromStatus: null,
      toStatus: 'active',
      reason: 'Cliente creado en el sistema',
      changedBy: 'system',
      isCreation: true
    },
    ...client.statusHistory || []
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Filtrar eventos importantes (bajas y reactivaciones)
  const importantEvents = timelineEvents.filter(event => {
    const changeType = getChangeType(event.fromStatus, event.toStatus);
    return event.isCreation || changeType === 'baja' || changeType === 'reactivacion';
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Historial de Cliente
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Línea de tiempo de estados para {client.fullName}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">DNI:</span>
              <span className="ml-2 text-gray-900">{client.dni}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Teléfono:</span>
              {client.phone ? (
                <button
                  onClick={() => openWhatsApp(client.phone)}
                  className="ml-2 inline-flex items-center space-x-1 text-green-600 hover:text-green-800 transition-colors"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{client.phone}</span>
                </button>
              ) : (
                <span className="ml-2 text-gray-400">No especificado</span>
              )}
            </div>
            <div>
              <span className="font-medium text-gray-700">Estado Actual:</span>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status || 'active')}`}>
                {getStatusLabel(client.status || 'active')}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Eventos de la timeline */}
            <div className="space-y-6">
              {timelineEvents.map((event, index) => {
                const changeType = getChangeType(event.fromStatus, event.toStatus);
                const isImportant = event.isCreation || changeType === 'baja' || changeType === 'reactivacion';
                
                return (
                  <div key={event.id || index} className={`relative flex items-start ${!isImportant ? 'opacity-60' : ''}`}>
                    {/* Punto en la línea */}
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 
                      ${isImportant ? 'bg-white border-blue-500' : 'bg-gray-100 border-gray-300'}`}>
                      {event.isCreation ? (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      ) : (
                        getStatusIcon(event.toStatus)
                      )}
                    </div>

                    {/* Contenido del evento */}
                    <div className="ml-4 flex-1">
                      <div className={`p-4 rounded-lg border ${isImportant ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        {/* Fecha y tipo de cambio */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {event.isCreation ? (
                              <span className="text-sm font-semibold text-blue-700">Cliente Registrado</span>
                            ) : changeType === 'baja' ? (
                              <span className="text-sm font-semibold text-red-700 flex items-center">
                                <XCircle className="h-4 w-4 mr-1" />
                                Cliente dado de Baja
                              </span>
                            ) : changeType === 'reactivacion' ? (
                              <span className="text-sm font-semibold text-green-700 flex items-center">
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Cliente Reactivado
                              </span>
                            ) : (
                              <span className="text-sm font-semibold text-gray-700">
                                Cambio de Estado
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(event.date).toLocaleDateString('es-PE', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Detalles del cambio */}
                        <div className="space-y-2">
                          {!event.isCreation && (
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="text-gray-600">Estado:</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.fromStatus)}`}>
                                {getStatusLabel(event.fromStatus)}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.toStatus)}`}>
                                {getStatusLabel(event.toStatus)}
                              </span>
                            </div>
                          )}

                          {event.reason && (
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">Motivo:</span>
                              <span className="ml-1">{event.reason}</span>
                            </div>
                          )}

                          <div className="flex items-center text-xs text-gray-500">
                            <User className="h-3 w-3 mr-1" />
                            <span>Realizado por: {getChangedByName(event.changedBy)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen de bajas y reactivaciones */}
          {importantEvents.length > 1 && (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Resumen de Estados Importantes</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                {importantEvents.filter(e => !e.isCreation).map((event, index) => {
                  const changeType = getChangeType(event.fromStatus, event.toStatus);
                  if (changeType === 'baja' || changeType === 'reactivacion') {
                    return (
                      <div key={index}>
                        • {changeType === 'baja' ? 'Baja' : 'Reactivación'} el{' '}
                        {new Date(event.date).toLocaleDateString('es-PE')}
                        {event.reason && ` - ${event.reason}`}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientHistory;