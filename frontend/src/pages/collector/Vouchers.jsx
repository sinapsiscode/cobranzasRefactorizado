import React, { useEffect, useState } from 'react';
import { useVoucherStore } from '../../stores/voucherStore';
import { useClientStore } from '../../stores/clientStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { 
  Upload, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  X, 
  Check, 
  ImageIcon, 
  MessageSquare,
  FileText,
  User
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CollectorVouchers = () => {
  const { user } = useAuthStore();
  const { vouchers, fetchAllVouchers, reviewVoucher, isLoading: vouchersLoading } = useVoucherStore();
  const { clients, fetchClients } = useClientStore();
  const { success, error: showError } = useNotificationStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // pending | approved | rejected | all
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    fetchAllVouchers();
    fetchClients();
  }, []);

  // Filtrar vouchers
  const getFilteredVouchers = () => {
    let filtered = vouchers;
    
    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.status === filterStatus);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(v => {
        const client = clients.find(c => c.id === v.clientId);
        return client?.fullName.toLowerCase().includes(search) ||
               v.operationNumber.includes(search) ||
               client?.phone?.includes(search);
      });
    }
    
    return filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  };

  const filteredVouchers = getFilteredVouchers();

  const handleVoucherReview = (voucher) => {
    setSelectedVoucher(voucher);
    setShowVoucherModal(true);
  };

  const handleVoucherApproval = async (status, comments = '') => {
    try {
      await reviewVoucher(selectedVoucher.id, status, user?.alias || user?.fullName || 'Cobrador', comments);
      
      success(status === 'approved' ? 'Voucher aprobado' : 'Voucher rechazado');
      setShowVoucherModal(false);
      setSelectedVoucher(null);
    } catch (error) {
      showError('Error al revisar voucher');
    }
  };

  const getClient = (clientId) => {
    return clients.find(c => c.id === clientId);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4 text-yellow-600" />,
      approved: <CheckCircle className="h-4 w-4 text-green-600" />,
      rejected: <X className="h-4 w-4 text-red-600" />
    };
    return icons[status] || null;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Vouchers de Pago</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Revisar vouchers subidos por los clientes
          </p>
          <span className="text-sm font-medium text-primary">
            {user?.alias || user?.fullName}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, N° operación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filtros de estado */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Pendientes ({vouchers.filter(v => v.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Aprobados ({vouchers.filter(v => v.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de vouchers */}
      {vouchersLoading() ? (
        <LoadingSpinner text="Cargando vouchers..." />
      ) : filteredVouchers.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No hay vouchers"
          description={filterStatus === 'pending' ? "No hay vouchers pendientes de revisión" : "No se encontraron vouchers"}
        />
      ) : (
        <div className="space-y-3">
          {filteredVouchers.map((voucher) => {
            const client = getClient(voucher.clientId);
            
            return (
              <div key={voucher.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {client?.fullName || 'Cliente desconocido'}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-500">
                          N° Op: {voucher.operationNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(voucher.uploadDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(voucher.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(voucher.status)}`}>
                        {voucher.status === 'pending' ? 'Pendiente' : 
                         voucher.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                  </div>

                  {/* Detalles del voucher */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Monto</p>
                        <p className="font-bold text-primary text-lg">S/ {voucher.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Fecha de Pago</p>
                        <p className="font-medium text-gray-900">{formatDate(voucher.paymentDate)}</p>
                      </div>
                    </div>
                    
                    {/* Método de pago */}
                    {voucher.paymentMethod && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">Método de Pago</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          voucher.paymentMethod === 'yape' ? 'bg-purple-100 text-purple-800' :
                          voucher.paymentMethod === 'plin' ? 'bg-green-100 text-green-800' :
                          voucher.paymentMethod === 'efectivo' ? 'bg-yellow-100 text-yellow-800' :
                          voucher.paymentMethod.includes('bank') || ['bcp', 'bbva', 'scotiabank'].includes(voucher.paymentMethod) 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {voucher.paymentMethod === 'yape' ? '📱 Yape' :
                           voucher.paymentMethod === 'plin' ? '💚 Plin' :
                           voucher.paymentMethod === 'bcp' ? '🏦 BCP' :
                           voucher.paymentMethod === 'bbva' ? '🏦 BBVA' :
                           voucher.paymentMethod === 'interbank' ? '🏦 Interbank' :
                           voucher.paymentMethod === 'scotiabank' ? '🏦 Scotiabank' :
                           voucher.paymentMethod === 'efectivo' ? '💵 Efectivo' :
                           voucher.paymentMethod === 'otro' ? '💳 Otro' :
                           voucher.paymentMethod.charAt(0).toUpperCase() + voucher.paymentMethod.slice(1)}
                        </span>
                      </div>
                    )}
                    
                    {/* Periodo de pago */}
                    {voucher.paymentPeriod && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-600 mb-1">Periodo(s) de Pago</p>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const formatPeriod = (period) => {
                              try {
                                if (period.includes(' a ')) {
                                  const months = period.split(' a ');
                                  return months.map(month => {
                                    const [year, monthNum] = month.split('-');
                                    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                                    return date.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });
                                  });
                                } else {
                                  const [year, monthNum] = period.split('-');
                                  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                                  return [date.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })];
                                }
                              } catch {
                                return [period];
                              }
                            };
                            
                            const periods = formatPeriod(voucher.paymentPeriod);
                            return periods.map((period, idx) => (
                              <span key={idx} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                {period}
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1">Archivo</p>
                      <div className="flex items-center text-sm text-gray-900">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {voucher.fileName}
                        <span className="ml-2 text-xs text-gray-500">
                          ({(voucher.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información de revisión */}
                  {voucher.reviewedBy && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600 font-medium">
                          Revisado por: {voucher.reviewedBy}
                        </span>
                        <span className="text-xs text-blue-600">
                          {formatDate(voucher.reviewDate)}
                        </span>
                      </div>
                      {voucher.reviewComments && (
                        <p className="text-sm text-blue-900 mt-1">{voucher.reviewComments}</p>
                      )}
                    </div>
                  )}

                  {/* Acciones */}
                  <button
                    onClick={() => handleVoucherReview(voucher)}
                    className="w-full bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Revisar Voucher
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de revisión de voucher */}
      {showVoucherModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Revisar Voucher
                </h3>
                <button 
                  onClick={() => setShowVoucherModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cliente */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600 mb-1">Cliente</p>
                <p className="font-semibold text-gray-900">
                  {getClient(selectedVoucher.clientId)?.fullName || 'Cliente desconocido'}
                </p>
              </div>

              {/* Detalles del voucher */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">N° Operación:</span>
                  <span className="font-mono font-bold">{selectedVoucher.operationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monto:</span>
                  <span className="font-bold text-primary">S/ {selectedVoucher.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fecha de Pago:</span>
                  <span className="font-medium">{formatDate(selectedVoucher.paymentDate)}</span>
                </div>
                {selectedVoucher.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Método:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedVoucher.paymentMethod === 'yape' ? 'bg-purple-100 text-purple-800' :
                      selectedVoucher.paymentMethod === 'plin' ? 'bg-green-100 text-green-800' :
                      selectedVoucher.paymentMethod === 'efectivo' ? 'bg-yellow-100 text-yellow-800' :
                      selectedVoucher.paymentMethod.includes('bank') || ['bcp', 'bbva', 'scotiabank'].includes(selectedVoucher.paymentMethod) 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedVoucher.paymentMethod === 'yape' ? '📱 Yape' :
                       selectedVoucher.paymentMethod === 'plin' ? '💚 Plin' :
                       selectedVoucher.paymentMethod === 'bcp' ? '🏦 BCP' :
                       selectedVoucher.paymentMethod === 'bbva' ? '🏦 BBVA' :
                       selectedVoucher.paymentMethod === 'interbank' ? '🏦 Interbank' :
                       selectedVoucher.paymentMethod === 'scotiabank' ? '🏦 Scotiabank' :
                       selectedVoucher.paymentMethod === 'efectivo' ? '💵 Efectivo' :
                       selectedVoucher.paymentMethod === 'otro' ? '💳 Otro' :
                       selectedVoucher.paymentMethod.charAt(0).toUpperCase() + selectedVoucher.paymentMethod.slice(1)}
                    </span>
                  </div>
                )}
                {selectedVoucher.paymentPeriod && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Periodo(s):</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {(() => {
                        const formatPeriod = (period) => {
                          try {
                            if (period.includes(' a ')) {
                              const months = period.split(' a ');
                              return months.map(month => {
                                const [year, monthNum] = month.split('-');
                                const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                                return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
                              });
                            } else {
                              const [year, monthNum] = period.split('-');
                              const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                              return [date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })];
                            }
                          } catch {
                            return [period];
                          }
                        };
                        
                        const periods = formatPeriod(selectedVoucher.paymentPeriod);
                        return periods.map((period, idx) => (
                          <span key={idx} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {period}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Archivo:</span>
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedVoucher.fileData;
                      link.download = selectedVoucher.fileName;
                      link.click();
                    }}
                    className="text-primary font-medium text-sm hover:underline"
                  >
                    Ver {selectedVoucher.fileName}
                  </button>
                </div>
              </div>

              {selectedVoucher.comments && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-600 mb-1">Comentarios del cliente</p>
                  <p className="text-blue-900">{selectedVoucher.comments}</p>
                </div>
              )}

              {/* Acciones de revisión (solo para vouchers pendientes) */}
              {selectedVoucher.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentarios de revisión (opcional)
                    </label>
                    <textarea 
                      id="reviewComments"
                      placeholder="Agregar comentarios..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      rows="2"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const comments = document.getElementById('reviewComments').value;
                        handleVoucherApproval('approved', comments);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => {
                        const comments = document.getElementById('reviewComments').value;
                        handleVoucherApproval('rejected', comments);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rechazar
                    </button>
                  </div>
                </div>
              )}

              {/* Estado ya revisado */}
              {selectedVoucher.status !== 'pending' && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(selectedVoucher.status)}
                      <span className="ml-2 font-medium">
                        {selectedVoucher.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {selectedVoucher.reviewedBy}
                    </span>
                  </div>
                  {selectedVoucher.reviewComments && (
                    <p className="text-sm text-yellow-900 mt-2">{selectedVoucher.reviewComments}</p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorVouchers;