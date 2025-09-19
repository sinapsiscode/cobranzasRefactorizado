import React, { useState } from 'react';
import { MapPin, Phone, User, AlertTriangle, Eye, X, ChevronRight } from 'lucide-react';

const DelinquentsByNeighborhoodReport = ({ reportData, onClose }) => {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);

  if (!reportData) return null;

  const { summary, neighborhoods } = reportData;

  const formatCurrency = (amount) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-yellow-100 text-yellow-800',
      debt: 'bg-red-100 text-red-800',
      terminated: 'bg-gray-100 text-gray-800',
      paused: 'bg-blue-100 text-blue-800',
      suspended: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Activo',
      debt: 'Moroso',
      terminated: 'Terminado',
      paused: 'Pausado',
      suspended: 'Suspendido'
    };
    return labels[status] || status;
  };

  if (selectedNeighborhood) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header del detalle */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center">
              <button 
                onClick={() => setSelectedNeighborhood(null)}
                className="mr-3 p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 transform rotate-180" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-red-600" />
                  {selectedNeighborhood.neighborhood}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedNeighborhood.clientsCount} clientes morosos • {formatCurrency(selectedNeighborhood.totalDebt)} en deudas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Lista de clientes morosos */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6">
              <div className="space-y-4">
                {selectedNeighborhood.clients.map((client, index) => (
                  <div
                    key={client.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Información del cliente */}
                      <div className="md:col-span-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-500" />
                              {client.fullName}
                            </h3>
                            <p className="text-sm text-gray-600">{client.address}</p>
                            <p className="text-xs text-gray-500">DNI: {client.dni}</p>
                          </div>
                        </div>

                        {/* Información de contacto */}
                        <div className="mt-3 flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-1" />
                            {client.phone}
                          </div>
                        </div>
                      </div>

                      {/* Estado y deuda */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Estado:</span>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                              {getStatusLabel(client.status)}
                            </span>
                            <span className="text-sm text-gray-600">
                              Tel: {client.phone}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Deuda total:</span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(client.debt)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Vencidos:</span>
                            <span>{client.overduePayments}</span>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Pendientes:</span>
                            <span>{client.pendingPayments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reporte de Morosos por Barrios</h2>
            <p className="text-sm text-gray-600">
              {summary.totalDelinquentClients} clientes morosos en {summary.totalNeighborhoods} barrios
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Estadísticas resumen */}
        <div className="p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.totalNeighborhoods}</div>
              <div className="text-sm text-gray-600">Barrios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.totalDelinquentClients}</div>
              <div className="text-sm text-gray-600">Morosos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalDebt)}</div>
              <div className="text-sm text-gray-600">Deuda Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.averageDebtPerNeighborhood)}</div>
              <div className="text-sm text-gray-600">Promedio/Barrio</div>
            </div>
          </div>
        </div>

        {/* Lista de barrios */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            <div className="grid gap-4">
              {neighborhoods.map((neighborhood, index) => (
                <div
                  key={neighborhood.neighborhood}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedNeighborhood(neighborhood)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <MapPin className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{neighborhood.neighborhood}</h3>
                        <p className="text-sm text-gray-600">
                          {neighborhood.clientsCount} cliente{neighborhood.clientsCount !== 1 ? 's' : ''} moroso{neighborhood.clientsCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-600">
                          {formatCurrency(neighborhood.totalDebt)}
                        </div>
                        <div className="text-xs text-gray-500">deuda total</div>
                      </div>
                      
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso visual */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Nivel de morosidad</span>
                      <span>{((neighborhood.clientsCount / summary.totalDelinquentClients) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(neighborhood.clientsCount / Math.max(...neighborhoods.map(n => n.clientsCount))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelinquentsByNeighborhoodReport;