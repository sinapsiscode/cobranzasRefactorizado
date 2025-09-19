import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  DollarSign,
  Eye,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { useCashBoxStore } from '../../stores/cashBoxStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { getStatusLabel, getStatusColor } from '../../services/mock/schemas/cashBoxRequest';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const CashBoxRequestsPanel = () => {
  const { 
    pendingRequests,
    cashBoxRequests,
    requestsLoading,
    loadPendingRequests,
    approveCashBoxRequest: approveRequest,
    rejectCashBoxRequest: rejectRequest,
    loadSimulationData,
    error
  } = useCashBoxStore();
  
  const { user } = useAuthStore();
  const { success, error: showError } = useNotificationStore();
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, all

  useEffect(() => {
    console.log('🔍 Cargando solicitudes pendientes...');
    loadPendingRequests();
    
    // Cargar datos de simulación
    loadSimulationData();
    
    // También cargar todas las solicitudes
    const stored = localStorage.getItem('tv-cable:cashbox-requests');
    console.log('📦 Solicitudes en localStorage:', stored);
    
    if (stored) {
      const requests = JSON.parse(stored);
      console.log('📋 Total de solicitudes:', requests.length);
      console.log('⏳ Solicitudes pendientes:', requests.filter(r => r.status === 'pending').length);
    }
  }, []);

  // Filtrar solicitudes de los últimos 3 meses
  const filterLastThreeMonths = (requests) => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return requests.filter(request => {
      const requestDate = new Date(request.requestDate || request.workDate);
      return requestDate >= threeMonthsAgo;
    });
  };

  const handleApprove = async (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedRequest || !user) return;
    
    try {
      await approveRequest(selectedRequest.id, user.id);
      success(`Solicitud de ${selectedRequest.collectorName} aprobada exitosamente`);
      setShowApprovalModal(false);
      setSelectedRequest(null);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleReject = async (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const confirmRejection = async () => {
    if (!selectedRequest || !user || !rejectionReason.trim()) {
      showError('Debe proporcionar una razón para el rechazo');
      return;
    }
    
    try {
      await rejectRequest(selectedRequest.id, rejectionReason.trim(), user.id);
      success(`Solicitud de ${selectedRequest.collectorName} rechazada`);
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (err) {
      showError(err.message);
    }
  };

  const formatCurrency = (amount) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const displayRequests = filterLastThreeMonths(
    filter === 'pending' ? pendingRequests : cashBoxRequests
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Solicitudes de Caja</h2>
          <p className="text-gray-600">Aprobar o rechazar solicitudes de apertura de cajas</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={async () => {
              try {
                console.log('🔄 Cargando datos de simulación...');
                const result = await loadSimulationData();
                console.log('📊 Resultado carga simulación:', result);
                
                if (result) {
                  success('Datos de demostración cargados correctamente');
                } else {
                  showError('Error al cargar datos de demostración');
                }
              } catch (error) {
                console.error('❌ Error:', error);
                showError('Error al cargar datos de demostración');
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Cargar Demo</span>
          </button>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="pending">Pendientes</option>
            <option value="all">Todas</option>
          </select>
          
          {pendingRequests.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {pendingRequests.length} pendientes
            </span>
          )}
        </div>
      </div>

      {/* Lista de Solicitudes */}
      {requestsLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="large" text="Cargando solicitudes..." />
        </div>
      ) : displayRequests.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No hay solicitudes"
          description={filter === 'pending' ? "No hay solicitudes pendientes de aprobación" : "No se encontraron solicitudes"}
        />
      ) : (
        <div className="space-y-4">
          {displayRequests.map(request => (
            <div key={request.id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header de la solicitud */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{request.collectorName}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Para el {formatDate(request.workDate)}
                      </span>
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>

                  {/* Detalles de montos iniciales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Efectivo</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(request.requestedInitialCash.efectivo)}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">Yape</div>
                      <div className="text-lg font-semibold text-blue-900">
                        {formatCurrency(request.requestedInitialCash.digital.yape)}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600">Plin</div>
                      <div className="text-lg font-semibold text-green-900">
                        {formatCurrency(request.requestedInitialCash.digital.plin)}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600">Transfer.</div>
                      <div className="text-lg font-semibold text-purple-900">
                        {formatCurrency(request.requestedInitialCash.digital.transferencia)}
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  {request.notes && (
                    <div className="flex items-start space-x-2 mb-4">
                      <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
                      <div>
                        <div className="text-sm font-medium text-gray-700">Notas:</div>
                        <div className="text-sm text-gray-600">{request.notes}</div>
                      </div>
                    </div>
                  )}

                  {/* Información de solicitud */}
                  <div className="flex items-center space-x-6 text-xs text-gray-500">
                    <span>Solicitado: {formatDate(request.requestDate)} a las {formatTime(request.requestDate)}</span>
                    {request.status === 'approved' && request.approvalDate && (
                      <span>Aprobado: {formatDate(request.approvalDate)}</span>
                    )}
                    {request.status === 'rejected' && (
                      <span className="text-red-600">Razón: {request.rejectionReason}</span>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                {request.status === 'pending' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApprove(request)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Aprobar</span>
                    </button>
                    
                    <button
                      onClick={() => handleReject(request)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Aprobación */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Aprobar Solicitud?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Se aprobará la solicitud de apertura de caja para <strong>{selectedRequest.collectorName}</strong> 
                el día {formatDate(selectedRequest.workDate)}.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmApproval}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Rechazar Solicitud?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Se rechazará la solicitud de <strong>{selectedRequest.collectorName}</strong>.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del rechazo *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explica por qué se rechaza la solicitud..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRejection}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashBoxRequestsPanel;