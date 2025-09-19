import React, { useEffect, useState } from 'react';
import { Users, Search, MapPin, Phone, Filter, Wifi, Calendar } from 'lucide-react';
import { useClientStore } from '../../stores/clientStore';
import { usePaymentStore } from '../../stores/paymentStore';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NeighborhoodFilter from '../../components/common/NeighborhoodFilter';

const CollectorClients = () => {
  const { clients, fetchClients, getNeighborhoodsWithDebtors, isLoading } = useClientStore();
  const { payments, fetchPayments } = usePaymentStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState([]);

  useEffect(() => {
    fetchClients();
    fetchPayments();
  }, [fetchClients, fetchPayments]);

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
              <div key={client.id} className="bg-white rounded-lg shadow-sm border p-4">
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

                {/* Contacto y dirección */}
                <div className="space-y-2 text-xs text-gray-600">
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
    </div>
  );
};

export default CollectorClients;