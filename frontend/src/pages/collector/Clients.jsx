import React, { useEffect, useState } from 'react';
import { Users, Search, MapPin, Phone, Filter, Wifi, Calendar, CreditCard, X } from 'lucide-react';
import { useClientStore } from '../../stores/clientStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useServiceStore } from '../../stores/serviceStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NeighborhoodFilter from '../../components/common/NeighborhoodFilter';

const CollectorClients = () => {
  const { clients, fetchClients, getNeighborhoodsWithDebtors, isLoading } = useClientStore();
  const { payments, fetchPayments, getOverduePayments, getPaymentsByClient, createPayment } = usePaymentStore();
  const { services, fetchServices } = useServiceStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    method: 'cash',
    amount: '',
    description: '',
    paidMonth: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchPayments();
    fetchServices();
  }, [fetchClients, fetchPayments, fetchServices]);

  // Obtener estado de pago del cliente
  const getClientPaymentStatus = (clientId) => {
    const clientPayments = payments.filter(p => p.clientId === clientId);
    if (clientPayments.length === 0) return 'sin-pagos';
    
    const hasPending = clientPayments.some(p => p.status === 'pending');
    const hasOverdue = clientPayments.some(p => p.status === 'overdue');
    
    if (hasOverdue) return 'overdue';
    if (hasPending) return 'pending';
    return 'paid';
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.dni?.includes(searchTerm) ||
                         client.phone?.includes(searchTerm);
    
    const clientStatus = getClientPaymentStatus(client.id);
    const matchesStatus = !statusFilter || clientStatus === statusFilter;
    
    const matchesNeighborhood = selectedNeighborhoods.length === 0 || 
                               selectedNeighborhoods.includes(client.neighborhood);
    
    // Si se filtra por barrio, mostrar SOLO los que tienen deuda
    const isFilteringByNeighborhood = selectedNeighborhoods.length > 0;
    const hasDebt = clientStatus === 'overdue' || clientStatus === 'pending' || clientStatus === 'sin-pagos';
    
    // Si se filtra por barrio, OBLIGATORIO que tenga deuda
    if (isFilteringByNeighborhood && !hasDebt) {
      return false;
    }
    
    return matchesSearch && matchesStatus && matchesNeighborhood;
  });

  const getStatusColor = (status) => {
    const colors = {
      'sin-pagos': 'bg-gray-100 text-gray-800',
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'sin-pagos': 'Sin Pagos',
      'paid': 'Al Día',
      'pending': 'Pendiente',
      'overdue': 'Vencido'
    };
    return texts[status] || 'Desconocido';
  };

  const getPlanInfo = (plan) => {
    const plans = {
      basic: { name: 'Básico', price: 80, speed: '50 Mbps' },
      standard: { name: 'Estándar', price: 120, speed: '100 Mbps' },
      premium: { name: 'Premium', price: 160, speed: '200 Mbps' }
    };
    return plans[plan] || { name: 'Básico', price: 80, speed: '50 Mbps' };
  };

  const handleNeighborhoodFilterChange = (neighborhoods) => {
    setSelectedNeighborhoods(neighborhoods);
  };

  const openPaymentModal = (client, specificMonth = null) => {
    setSelectedClient(client);
    const planInfo = getPlanInfo(client.servicePlan);
    setPaymentForm({
      method: 'cash',
      amount: planInfo.price.toString(),
      description: '',
      paidMonth: specificMonth || new Date().toISOString().slice(0, 7)
    });
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedClient(null);
    setPaymentForm({
      method: 'cash',
      amount: '',
      description: '',
      paidMonth: ''
    });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient || !paymentForm.amount || !paymentForm.paidMonth) {
      addNotification({
        type: 'error',
        message: 'Por favor complete todos los campos requeridos'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentData = {
        clientId: selectedClient.id,
        method: paymentForm.method,
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description || `Pago de ${paymentForm.method === 'cash' ? 'efectivo' : paymentForm.method}`,
        paidMonth: paymentForm.paidMonth,
        collectorId: user.id,
        status: 'pending'
      };

      await createPayment(paymentData);

      addNotification({
        type: 'success',
        message: 'Pago registrado exitosamente'
      });

      closePaymentModal();
      await fetchPayments();

    } catch (error) {
      console.error('Error al registrar el pago:', error);
      addNotification({
        type: 'error',
        message: 'Error al registrar el pago. Intente nuevamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientDebtInfo = (clientId) => {
    const clientPayments = getPaymentsByClient(clientId);
    const allOverduePayments = getOverduePayments();
    const overduePayments = allOverduePayments.filter(p => p.clientId === clientId);

    const paidCount = clientPayments.filter(p => p.status === 'paid').length;
    const pendingCount = clientPayments.filter(p => p.status === 'pending').length;
    const overdueCount = overduePayments.length;

    const totalDebt = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      paidCount,
      pendingCount,
      overdueCount,
      totalDebt,
      overduePayments
    };
  };

  const getClientOverdueMonths = (clientId) => {
    const clientPayments = getPaymentsByClient(clientId);
    const allOverduePayments = getOverduePayments();
    const overduePayments = allOverduePayments.filter(p => p.clientId === clientId);

    // Obtener meses únicos de pagos vencidos
    const overdueMonths = overduePayments.map(payment => {
      const date = new Date(payment.dueDate);
      return {
        monthYear: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        displayText: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        amount: payment.amount,
        dueDate: payment.dueDate
      };
    });

    // Remover duplicados y ordenar por fecha
    const uniqueMonths = overdueMonths.filter((month, index, self) =>
      index === self.findIndex(m => m.monthYear === month.monthYear)
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return uniqueMonths;
  };

  const handleMonthDoubleClick = (client, monthYear) => {
    openPaymentModal(client, monthYear);
  };

  return (
    <div className="p-4 space-y-4">
      
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {selectedNeighborhoods.length > 0 ? 'Clientes con Deudas' : 'Todos los Clientes'}
        </h1>
        <p className="text-sm text-gray-600">
          {selectedNeighborhoods.length > 0 
            ? `Clientes deudores en ${selectedNeighborhoods.join(', ')} - ${filteredClients.length} clientes`
            : `Lista completa de clientes - ${filteredClients.length} clientes`
          }
        </p>
      </div>

      {/* Filtros móviles */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col space-y-3">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Todos los estados</option>
              <option value="overdue">Vencidos</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Al Día</option>
              <option value="sin-pagos">Sin Pagos</option>
            </select>

            <NeighborhoodFilter
              onFilterChange={handleNeighborhoodFilterChange}
              selectedNeighborhoods={selectedNeighborhoods}
              availableNeighborhoods={getNeighborhoodsWithDebtors(payments)}
              className="w-full"
            />
            
            {/* Indicador de filtro por deudores cuando se filtra por barrio */}
            {selectedNeighborhoods.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
                <Filter className="h-4 w-4" />
                <span>Mostrando solo clientes con deudas del barrio seleccionado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {isLoading() ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="large" text="Cargando clientes..." />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-lg shadow">
          <EmptyState
            icon={Users}
            title="No se encontraron clientes"
            description={searchTerm || statusFilter || selectedNeighborhoods.length > 0 ? "Intenta ajustar los filtros de búsqueda" : "No hay clientes disponibles"}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const planInfo = getPlanInfo(client.servicePlan);
            const paymentStatus = getClientPaymentStatus(client.id);
            
            return (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
                onDoubleClick={() => openPaymentModal(client)}
                title="Doble click para registrar pago"
              >
                {/* Header del cliente */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{client.fullName}</h3>
                    <p className="text-xs text-gray-600">DNI: {client.dni}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paymentStatus)}`}>
                    {getStatusText(paymentStatus)}
                  </div>
                </div>

                {/* Info del plan */}
                <div className="mb-3 p-2 bg-blue-50 rounded">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Wifi className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="font-medium">{planInfo.name}</span>
                      <span className="text-gray-500 ml-1">({planInfo.speed})</span>
                    </div>
                    <span className="font-bold text-blue-600">S/ {planInfo.price}</span>
                  </div>
                </div>

                {/* Meses de deuda */}
                {(() => {
                  const overdueMonths = getClientOverdueMonths(client.id);
                  return overdueMonths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-red-700 mb-2">Meses de deuda:</p>
                      <div className="flex flex-wrap gap-1">
                        {overdueMonths.map((month, index) => (
                          <div
                            key={index}
                            className="w-12 h-8 bg-red-100 border border-red-300 rounded text-xs flex items-center justify-center cursor-pointer hover:bg-red-200 transition-colors"
                            title={`${month.displayText} - S/ ${month.amount} - Click para pagar este mes`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMonthDoubleClick(client, month.monthYear);
                            }}
                          >
                            <span className="text-red-700 font-medium text-[10px] leading-none">
                              {month.displayText.split(' ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Contacto y dirección */}
                <div className="space-y-2 text-xs text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Phone className="h-3 w-3 mr-2 text-gray-400" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-3 w-3 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{client.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                    <span>Instalado: {new Date(client.installationDate).toLocaleDateString('es-PE')}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Pago */}
      {paymentModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Registrar Pago
              </h3>
              <button
                onClick={closePaymentModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Información del cliente */}
            <div className="p-4 border-b border-gray-200">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{selectedClient.fullName}</p>
                <p className="text-gray-600">DNI: {selectedClient.dni}</p>
                <p className="text-gray-600">Plan: {getPlanInfo(selectedClient.servicePlan).name}</p>
              </div>
            </div>

            {/* Estado de deuda */}
            {(() => {
              const debtInfo = getClientDebtInfo(selectedClient.id);
              return (
                <div className="p-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-700 font-medium mb-2">📋 Estado de Deuda del Cliente</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Meses pendientes:</span>
                        <span className="font-medium text-red-700">{debtInfo.pendingCount + debtInfo.overdueCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-600">Deuda total:</span>
                        <span className="font-bold text-red-700">S/ {debtInfo.totalDebt.toFixed(2)}</span>
                      </div>
                      {debtInfo.overdueCount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Meses vencidos:</span>
                          <span className="font-medium text-red-700">{debtInfo.overdueCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formulario de pago */}
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mes de pago *
                      </label>
                      <input
                        type="month"
                        value={paymentForm.paidMonth}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, paidMonth: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Método de pago *
                      </label>
                      <select
                        value={paymentForm.method}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        required
                      >
                        <option value="cash">Efectivo</option>
                        <option value="bank_transfer">Transferencia</option>
                        <option value="yape">Yape</option>
                        <option value="plin">Plin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        rows="3"
                        placeholder="Descripción adicional del pago (opcional)"
                      />
                    </div>

                    {/* Botones */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closePaymentModal}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-primary text-white hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50"
                        disabled={isSubmitting || !paymentForm.amount || !paymentForm.paidMonth}
                      >
                        {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorClients;