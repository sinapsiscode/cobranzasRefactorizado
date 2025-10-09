import React, { useState, useEffect } from 'react';
import { useClientStore } from '../../stores/clientStore';
import { useMonthlyDebtStore } from '../../stores/monthlyDebtStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { calculateServicePrice, getBasePrices } from '../../services/basePricingService';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Download
} from 'lucide-react';
import { getMonthName, getDebtStatusLabel, getDebtStatusColor } from '../../services/mock/schemas/monthlyDebt';
import { exportMonthlyDebtMatrixToExcel } from '../../utils/excelExport';

const MonthlyDebts = () => {
  const { clients, fetchClients } = useClientStore();
  const { 
    getClientDebts, 
    getClientSummary, 
    getGlobalStats, 
    updateDebt,
    registerPayment 
  } = useMonthlyDebtStore();
  const { createPayment } = usePaymentStore();
  const { user } = useAuthStore();
  const { success, error: showError } = useNotificationStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterNeighborhood, setFilterNeighborhood] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'matrix'
  
  // Estados para modales
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentDetailModal, setShowPaymentDetailModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'efectivo',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });
  
  // Estado para forzar re-render cuando cambien los precios
  const [priceUpdateTrigger, setPriceUpdateTrigger] = useState(0);
  
  useEffect(() => {
    fetchClients();
  }, []);
  
  // Escuchar cambios en precios base para actualización en tiempo real
  useEffect(() => {
    const handlePricesUpdated = () => {
      setPriceUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('basePricesUpdated', handlePricesUpdated);
    
    return () => {
      window.removeEventListener('basePricesUpdated', handlePricesUpdated);
    };
  }, []);
  
  const globalStats = getGlobalStats();
  
  // Obtener lista única de barrios
  const uniqueNeighborhoods = [...new Set(clients
    .map(client => client.neighborhood)
    .filter(neighborhood => neighborhood && neighborhood.trim() !== '')
  )].sort();
  
  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const summary = getClientSummary(client.id);
    const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.dni?.includes(searchTerm);
    
    const matchesStatus = !filterStatus || (
      filterStatus === 'owing' ? summary.monthsOwed > 0 :
      filterStatus === 'current' ? summary.monthsOwed === 0 :
      true
    );

    const matchesNeighborhood = !filterNeighborhood || 
                               client.neighborhood === filterNeighborhood;
    
    return matchesSearch && matchesStatus && matchesNeighborhood;
  });
  
  // Generar meses del año seleccionado
  const monthsOfYear = Array.from({length: 12}, (_, i) => ({
    month: i + 1,
    name: getMonthName(i + 1),
    shortName: getMonthName(i + 1).substring(0, 3)
  }));
  
  // Manejar clic en celda de matriz
  const handleCellClick = (client, monthDebt, month) => {
    if (monthDebt && monthDebt.status === 'paid') {
      // Mostrar detalles del pago
      setSelectedClient(client);
      setSelectedDebt(monthDebt);
      setShowPaymentDetailModal(true);
    } else if (monthDebt && (monthDebt.status === 'overdue' || monthDebt.status === 'pending')) {
      // Registrar pago para deuda
      setSelectedClient(client);
      setSelectedDebt(monthDebt);
      // Calcular monto basado en el servicio del cliente y precios actualizados
      const clientServicePrice = client.serviceType ? 
        calculateServicePrice(client.serviceType, client.servicePlan || 'standard') :
        monthDebt.amountDue || 0;
      
      setPaymentFormData({
        amount: clientServicePrice.toString(),
        paymentMethod: 'efectivo',
        description: `Pago ${getMonthName(month)} ${selectedYear} - ${client.fullName}`,
        paymentDate: new Date().toISOString().split('T')[0]
      });
      setShowPaymentModal(true);
    }
  };

  // Manejar cambios en formulario de pago
  const handlePaymentFormChange = (field, value) => {
    setPaymentFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Procesar pago desde matriz
  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    try {
      // Crear pago en el sistema
      const newPayment = {
        clientId: selectedClient.id,
        amount: parseFloat(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod,
        description: paymentFormData.description,
        paymentDate: paymentFormData.paymentDate,
        dueDate: paymentFormData.paymentDate,
        status: 'collected',
        collectorId: user?.id,
        registeredBy: user?.id,
        registeredAt: new Date().toISOString(),
        debtId: selectedDebt?.id // Vincular con la deuda específica
      };

      await createPayment(newPayment);

      // Actualizar estado de la deuda
      if (selectedDebt) {
        await updateDebt(selectedDebt.id, { 
          status: 'paid',
          amountPaid: parseFloat(paymentFormData.amount),
          paymentDate: paymentFormData.paymentDate
        });
      }

      success(`Pago registrado exitosamente para ${selectedClient.fullName}`);
      setShowPaymentModal(false);
      setSelectedClient(null);
      setSelectedDebt(null);
    } catch (error) {
      console.error('Error registrando pago:', error);
      showError('Error al registrar el pago. Intente nuevamente.');
    }
  };

  // Función para exportar matriz mensual a Excel
  const handleExportMatrix = async () => {
    try {
      await exportMonthlyDebtMatrixToExcel(
        filteredClients,
        selectedYear,
        getClientDebts,
        getClientSummary
      );
      success('Matriz mensual exportada exitosamente');
    } catch (error) {
      console.error('Error exportando matriz:', error);
      showError('Error al exportar la matriz. Intente nuevamente.');
    }
  };

  // Obtener detalles del pago (simulado por ahora)
  const getPaymentDetails = (debt) => {
    return {
      amount: debt.amountPaid || debt.amountDue,
      paymentDate: debt.paymentDate || debt.dueDate,
      paymentMethod: 'efectivo', // Por ahora fijo
      description: `Pago ${getMonthName(debt.month)} ${debt.year}`,
      collectorName: 'Sistema' // Por ahora fijo
    };
  };

  // Función auxiliar para obtener color de celda mejorado
  const getCellColorClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500 text-white hover:bg-green-600 cursor-pointer';
      case 'overdue':
        return 'bg-red-500 text-white hover:bg-red-600 cursor-pointer';
      case 'partial':
        return 'bg-yellow-500 text-white hover:bg-yellow-600 cursor-pointer';
      case 'pending':
        return 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  // Manejar pago
  const handlePayment = async (debtId, amount) => {
    try {
      registerPayment(debtId, amount);
      success('Pago registrado correctamente');
    } catch (error) {
      showError('Error al registrar el pago');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deudas Mensuales</h1>
        <p className="text-gray-600 mt-2">
          Gestión de deudas y pagos mensuales por cliente
        </p>
      </div>

      {/* Estadísticas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deudas</p>
              <p className="text-2xl font-bold text-red-600">{globalStats.totalDebts}</p>
            </div>
            <Calendar className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monto Adeudado</p>
              <p className="text-2xl font-bold text-red-600">S/. {globalStats.totalOwed?.toFixed(0)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa Cobranza</p>
              <p className="text-2xl font-bold text-green-600">{globalStats.collectionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-orange-600">{globalStats.overdue}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            
            {/* Filtros de la izquierda */}
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              
              {/* Filtro por estado */}
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Todos los estados</option>
                <option value="owing">Con deudas</option>
                <option value="current">Al día</option>
              </select>

              {/* Filtro por barrio */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select 
                  value={filterNeighborhood}
                  onChange={(e) => setFilterNeighborhood(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-w-40"
                >
                  <option value="">Todos los barrios</option>
                  {uniqueNeighborhoods.map(neighborhood => (
                    <option key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Selector de año */}
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
            
            {/* Controles de la derecha */}
            <div className="flex items-center space-x-2">
              {/* Indicador de filtros activos */}
              {(searchTerm || filterStatus || filterNeighborhood) && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Filtros activos:</span>
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Búsqueda: {searchTerm}
                    </span>
                  )}
                  {filterStatus && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Estado: {filterStatus === 'owing' ? 'Con deudas' : 'Al día'}
                    </span>
                  )}
                  {filterNeighborhood && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      📍 {filterNeighborhood}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('');
                      setFilterNeighborhood('');
                    }}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'summary' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Resumen
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'matrix' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Matriz Mensual
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vista Resumen */}
      {viewMode === 'summary' && (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meses Adeudados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deuda Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deuda Más Antigua
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => {
                  const summary = getClientSummary(client.id);
                  
                  return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {client.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            DNI: {client.dni}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          summary.monthsOwed > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {summary.monthsOwed} meses
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          summary.balance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          S/. {summary.balance?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {summary.oldestDebt || '-'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {summary.lastPayment ? 
                          new Date(summary.lastPayment).toLocaleDateString('es-PE') : 
                          'Sin pagos'
                        }
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {summary.monthsOwed > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Con deuda
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Al día
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles mensuales"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredClients.length === 0 && (
            <div className="p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron clientes con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vista Matriz Mensual */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {/* Header con botón de exportar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Matriz Mensual de Deudas - {selectedYear}
              </h3>
              <button
                onClick={handleExportMatrix}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Exportar a Excel
              </button>
            </div>
          </div>

          {/* Info sobre filtros aplicados */}
          {(filterNeighborhood || filterStatus || searchTerm) && (
            <div className="px-6 py-3 bg-gray-50 border-b">
              <p className="text-sm text-gray-600">
                Mostrando <strong>{filteredClients.length}</strong> de <strong>{clients.length}</strong> clientes
                {filterNeighborhood && (
                  <span> en <strong>📍 {filterNeighborhood}</strong></span>
                )}
                {filterStatus && (
                  <span> con estado <strong>{filterStatus === 'owing' ? 'Con deudas' : 'Al día'}</strong></span>
                )}
                {searchTerm && (
                  <span> que coinciden con <strong>"{searchTerm}"</strong></span>
                )}
              </p>
            </div>
          )}
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Cliente
                </th>
                {monthsOfYear.map(month => (
                  <th key={month.month} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-20">
                    {month.shortName}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.slice(0, 20).map((client) => { // Limitamos a 20 para performance
                const debts = getClientDebts(client.id);
                const summary = getClientSummary(client.id);
                
                return (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-6 py-4 whitespace-nowrap border-r">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {client.dni}
                        </div>
                      </div>
                    </td>
                    
                    {monthsOfYear.map(month => {
                      const monthDebt = debts.find(d => d.year === selectedYear && d.month === month.month);
                      
                      return (
                        <td key={month.month} className="px-2 py-4 text-center">
                          {monthDebt ? (
                            <button
                              onClick={() => handleCellClick(client, monthDebt, month.month)}
                              className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${getCellColorClass(monthDebt.status)}`}
                              title={
                                monthDebt.status === 'paid' 
                                  ? `✅ Pagado: S/. ${monthDebt.amountPaid || monthDebt.amountDue} - Click para ver detalles`
                                  : `⚠️ ${getDebtStatusLabel(monthDebt.status)}: S/. ${monthDebt.amountDue} - Click para pagar`
                              }
                            >
                              {monthDebt.status === 'paid' ? '✓' : 
                               monthDebt.status === 'overdue' ? '!' :
                               monthDebt.status === 'partial' ? '~' : '○'}
                            </button>
                          ) : (
                            <div className="w-10 h-10 mx-auto rounded-lg bg-gray-50 opacity-30"></div>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="px-4 py-4 text-center">
                      <span className={`text-sm font-semibold ${
                        summary.balance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        S/. {summary.balance?.toFixed(0) || '0'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Leyenda actualizada */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-lg mr-2 flex items-center justify-center text-white font-bold">✓</div>
                <span className="font-medium">Pagado (Click para ver detalles)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded-lg mr-2 flex items-center justify-center text-white font-bold">!</div>
                <span className="font-medium">En Deuda (Click para pagar)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-orange-500 rounded-lg mr-2 flex items-center justify-center text-white font-bold">○</div>
                <span className="font-medium">Pendiente (Click para pagar)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-yellow-500 rounded-lg mr-2 flex items-center justify-center text-white font-bold">~</div>
                <span className="font-medium">Pago Parcial (Click para completar)</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              💡 <strong>Interactiva:</strong> Haz clic en cualquier celda para registrar pagos o ver detalles
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar pago (celdas rojas/naranjas) */}
      {showPaymentModal && selectedClient && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Registrar Pago
                </h3>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Información del cliente y deuda */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-900 mb-2">{selectedClient.fullName}</h4>
                <div className="text-sm space-y-1">
                  <p className="text-red-700">DNI: {selectedClient.dni}</p>
                  <p className="text-red-700">
                    Mes: <strong>{getMonthName(selectedDebt.month)} {selectedDebt.year}</strong>
                  </p>
                  <p className="text-red-700">
                    Monto adeudado: <strong>S/ {selectedDebt.amountDue}</strong>
                  </p>
                  <p className="text-red-600 text-xs">
                    Estado: {getDebtStatusLabel(selectedDebt.status)}
                  </p>
                </div>
              </div>

              {/* Formulario de pago */}
              <form onSubmit={handleSubmitPayment}>
                <div className="space-y-4">
                  {/* Monto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto (S/) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={paymentFormData.amount}
                      onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Método de pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago *
                    </label>
                    <select
                      value={paymentFormData.paymentMethod}
                      onChange={(e) => handlePaymentFormChange('paymentMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="yape">Yape</option>
                      <option value="plin">Plin</option>
                    </select>
                  </div>

                  {/* Fecha de pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Pago *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentFormData.paymentDate}
                      onChange={(e) => handlePaymentFormChange('paymentDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={paymentFormData.description}
                      onChange={(e) => handlePaymentFormChange('description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descripción del pago..."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Registrar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de pago (celdas verdes) */}
      {showPaymentDetailModal && selectedClient && selectedDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Pago
                </h3>
                <button 
                  onClick={() => setShowPaymentDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Información del cliente */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-900">Pago Completado</h4>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-green-800"><strong>Cliente:</strong> {selectedClient.fullName}</p>
                  <p className="text-green-700">DNI: {selectedClient.dni}</p>
                  <p className="text-green-700">
                    Período: <strong>{getMonthName(selectedDebt.month)} {selectedDebt.year}</strong>
                  </p>
                </div>
              </div>

              {/* Detalles del pago */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Monto Pagado:</span>
                  <span className="font-semibold text-green-600">
                    S/ {getPaymentDetails(selectedDebt).amount}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Fecha de Pago:</span>
                  <span className="font-medium">
                    {new Date(getPaymentDetails(selectedDebt).paymentDate).toLocaleDateString('es-PE')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Método de Pago:</span>
                  <span className="font-medium capitalize">
                    {getPaymentDetails(selectedDebt).paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Cobrador:</span>
                  <span className="font-medium">
                    {getPaymentDetails(selectedDebt).collectorName}
                  </span>
                </div>
                {getPaymentDetails(selectedDebt).description && (
                  <div className="py-2">
                    <span className="text-gray-600 block mb-1">Descripción:</span>
                    <span className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                      {getPaymentDetails(selectedDebt).description}
                    </span>
                  </div>
                )}
              </div>

              {/* Botón de cerrar */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPaymentDetailModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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

export default MonthlyDebts;