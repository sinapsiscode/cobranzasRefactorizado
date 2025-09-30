import React, { useEffect, useState } from 'react';
import { 
  Eye, 
  Lock, 
  DollarSign, 
  Calendar, 
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wifi,
  Tv,
  Package,
  Receipt,
  CreditCard
} from 'lucide-react';
import { useCashBoxStore } from '../../stores/cashBoxStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const CashBoxSupervisor = () => {
  const { 
    getAllOpenCashBoxes,
    getAllCashBoxHistory,
    closeCashBoxById,
    loadSimulationData,
    loading,
    error
  } = useCashBoxStore();
  
  const { user } = useAuthStore();
  const { success, error: showError } = useNotificationStore();
  
  const [openCashBoxes, setOpenCashBoxes] = useState([]);
  const [cashBoxHistory, setCashBoxHistory] = useState([]);
  const [selectedCashBox, setSelectedCashBox] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [finalCounts, setFinalCounts] = useState({ efectivo: 0, digital: 0 });
  const [activeTab, setActiveTab] = useState('active'); // active, history
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsCashBox, setDetailsCashBox] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      // Cargar datos de simulación si no hay datos
      await loadSimulationData();
      
      const openBoxes = getAllOpenCashBoxes();
      const history = getAllCashBoxHistory();
      
      // Filtrar solo los últimos 3 meses
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const filteredHistory = history.filter(box => {
        const boxDate = new Date(box.date || box.fechaApertura);
        return boxDate >= threeMonthsAgo;
      });
      
      setOpenCashBoxes(openBoxes);
      setCashBoxHistory(filteredHistory);
    } catch (error) {
      showError('Error al cargar datos de cajas');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCloseCashBox = (cashBox) => {
    setSelectedCashBox(cashBox);
    setFinalCounts({ efectivo: 0, digital: 0 });
    setShowCloseModal(true);
  };

  const confirmCloseCashBox = async () => {
    if (!selectedCashBox || !user) return;
    
    try {
      await closeCashBoxById(selectedCashBox.id, finalCounts, user.id);
      success(`Caja de ${getCollectorName(selectedCashBox.collectorId)} cerrada exitosamente`);
      setShowCloseModal(false);
      setSelectedCashBox(null);
      loadData(); // Recargar datos
    } catch (err) {
      showError(err.message);
    }
  };

  const getCollectorName = (collectorId) => {
    // En un sistema real, esto buscaría el nombre en una base de datos
    const names = {
      'collector-1': 'Carlos',
      'collector-2': 'Pedro González', 
      'collector-3': 'Juan Pérez'
    };
    return names[collectorId] || collectorId;
  };

  const formatCurrency = (amount) => {
    return `S/ ${(amount || 0).toFixed(2)}`;
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

  const calculateCashBoxTotals = (cashBox) => {
    const ingresos = cashBox.ingresos?.reduce((sum, ingreso) => sum + (ingreso.amount || ingreso.monto || 0), 0) || 0;
    const gastos = cashBox.gastos?.reduce((sum, gasto) => sum + (gasto.amount || gasto.monto || 0), 0) || 0;
    const inicialEfectivo = cashBox.cajaInicial?.efectivo || 0;
    const inicialDigital = Object.values(cashBox.cajaInicial?.digital || {}).reduce((sum, val) => sum + (val || 0), 0);
    const totalInicial = inicialEfectivo + inicialDigital;
    
    // Calcular ingresos por método de pago
    const ingresosPorMetodo = {
      efectivo: 0,
      digital: 0
    };
    
    cashBox.ingresos?.forEach(ingreso => {
      const metodo = ingreso.method || 'efectivo';
      const monto = ingreso.amount || ingreso.monto || 0;
      
      if (metodo === 'efectivo') {
        ingresosPorMetodo.efectivo += monto;
      } else {
        // Yape, Plin, transferencia, etc. se consideran digitales
        ingresosPorMetodo.digital += monto;
      }
    });
    
    // Calcular montos teóricos esperados (inicial + ingresos - gastos)
    const efectivoTeorico = inicialEfectivo + ingresosPorMetodo.efectivo - gastos; // Los gastos normalmente son en efectivo
    const digitalTeorico = inicialDigital + ingresosPorMetodo.digital;
    
    // Calcular ingresos por tipo de servicio
    const ingresosPorServicio = {};
    cashBox.ingresos?.forEach(ingreso => {
      const servicio = ingreso.serviceType || 'general';
      if (!ingresosPorServicio[servicio]) {
        ingresosPorServicio[servicio] = { cantidad: 0, monto: 0 };
      }
      ingresosPorServicio[servicio].cantidad++;
      ingresosPorServicio[servicio].monto += (ingreso.amount || ingreso.monto || 0);
    });
    
    return {
      ingresos,
      gastos,
      totalInicial,
      teorico: totalInicial + ingresos - gastos,
      ingresosPorServicio,
      ingresosPorMetodo,
      efectivoTeorico,
      digitalTeorico
    };
  };
  
  const getServiceIcon = (serviceType) => {
    switch(serviceType) {
      case 'internet': return <Wifi className="h-4 w-4 text-blue-500" />;
      case 'cable': return <Tv className="h-4 w-4 text-purple-500" />;
      case 'duo': return <Package className="h-4 w-4 text-green-500" />;
      default: return <Receipt className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getServiceLabel = (serviceType) => {
    switch(serviceType) {
      case 'internet': return 'Internet';
      case 'cable': return 'Cable';
      case 'duo': return 'DUO';
      default: return 'General';
    }
  };
  
  const getServiceColor = (serviceType) => {
    switch(serviceType) {
      case 'internet': return 'bg-blue-100 text-blue-800';
      case 'cable': return 'bg-purple-100 text-purple-800';
      case 'duo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handleViewDetails = (cashBox) => {
    setDetailsCashBox(cashBox);
    setShowDetailsModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'abierta':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cerrada':
        return <Lock className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'abierta':
        return 'bg-green-100 text-green-800';
      case 'cerrada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Supervisión de Cajas</h2>
          <p className="text-gray-600">Monitorea y controla todas las cajas de los cobradores</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={async () => {
              try {
                console.log('🔄 Cargando datos de simulación...');
                const result = await loadSimulationData();
                console.log('📊 Resultado carga simulación:', result);
                
                if (result) {
                  await loadData(); // Recargar datos después de cargar simulación
                  success('Datos de demostración cargados correctamente');
                } else {
                  showError('Error al cargar datos de demostración');
                }
              } catch (error) {
                console.error('❌ Error:', error);
                showError('Error al cargar datos de demostración');
              }
            }}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Cargar Demo</span>
          </button>
          
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {refreshing ? (
              <LoadingSpinner size="small" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Resumen General - Sin mostrar totales para sub-admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500">Cajas Activas</dt>
                <dd className="text-lg font-semibold text-gray-900">{openCashBoxes.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500">Historial (Últimos 3 meses)</dt>
                <dd className="text-lg font-semibold text-gray-900">{cashBoxHistory.length}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cajas Activas ({openCashBoxes.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Historial ({cashBoxHistory.length})
          </button>
        </nav>
      </div>

      {/* Contenido de Tabs */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {refreshing ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="large" text="Cargando cajas activas..." />
            </div>
          ) : openCashBoxes.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay cajas activas"
              description="No hay cobradores con cajas abiertas en este momento"
            />
          ) : (
            openCashBoxes.map(cashBox => {
              const totals = calculateCashBoxTotals(cashBox);
              return (
                <div key={cashBox.id} className="bg-white rounded-lg shadow border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(cashBox.status)}
                          <span className="font-medium text-gray-900">
                            {getCollectorName(cashBox.collectorId)}
                          </span>
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cashBox.status)}`}>
                          {cashBox.status === 'abierta' ? 'Activa' : 'Cerrada'}
                        </span>
                        
                        <span className="text-sm text-gray-500">
                          Abierta: {formatTime(cashBox.fechaApertura)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Inicial</div>
                          <div className="text-lg font-semibold text-blue-900">
                            {formatCurrency(totals.totalInicial)}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-gray-600">Ingresos</div>
                          <div className="text-lg font-semibold text-green-900">
                            {formatCurrency(totals.ingresos)}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-sm text-gray-600">Gastos</div>
                          <div className="text-lg font-semibold text-red-900">
                            {formatCurrency(totals.gastos)}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Balance</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(totals.ingresos - totals.gastos)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Desglose por Servicio */}
                      {Object.keys(totals.ingresosPorServicio || {}).length > 0 && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Ingresos por Servicio:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(totals.ingresosPorServicio).map(([servicio, data]) => (
                              <div key={servicio} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getServiceColor(servicio)}`}>
                                {getServiceIcon(servicio)}
                                <span className="ml-1">{getServiceLabel(servicio)}: {data.cantidad} cobros - {formatCurrency(data.monto)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => handleViewDetails(cashBox)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver Detalles</span>
                      </button>
                      <button
                        onClick={() => handleCloseCashBox(cashBox)}
                        className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Cerrar Caja</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {refreshing ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="large" text="Cargando historial..." />
            </div>
          ) : cashBoxHistory.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hay historial"
              description="No se encontró historial de cajas"
            />
          ) : (
            cashBoxHistory.slice(0, 20).map(cashBox => {
              const totals = calculateCashBoxTotals(cashBox);
              const diferencia = cashBox.status === 'cerrada' ? 
                (cashBox.cierreEfectivo + cashBox.cierreDigital) - totals.teorico : 0;
              
              return (
                <div key={cashBox.id} className="bg-white rounded-lg shadow border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(cashBox.status)}
                          <span className="font-medium text-gray-900">
                            {getCollectorName(cashBox.collectorId)}
                          </span>
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cashBox.status)}`}>
                          {cashBox.status === 'abierta' ? 'Activa' : 'Cerrada'}
                        </span>
                        
                        <span className="text-sm text-gray-500">
                          {formatDate(cashBox.date)}
                        </span>
                        
                        {cashBox.status === 'cerrada' && diferencia !== 0 && (
                          <span className={`text-sm font-medium ${diferencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diferencia > 0 ? '+' : ''}{formatCurrency(diferencia)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-gray-600">Inicial</div>
                          <div className="text-lg font-semibold text-blue-900">
                            {formatCurrency(totals.totalInicial)}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-gray-600">Ingresos</div>
                          <div className="text-lg font-semibold text-green-900">
                            {formatCurrency(totals.ingresos)}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-sm text-gray-600">Gastos</div>
                          <div className="text-lg font-semibold text-red-900">
                            {formatCurrency(totals.gastos)}
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">Balance</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(totals.ingresos - totals.gastos)}
                          </div>
                        </div>
                        
                        {cashBox.status === 'cerrada' && (
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <div className="text-sm text-gray-600">Real</div>
                            <div className="text-lg font-semibold text-purple-900">
                              {formatCurrency(cashBox.cierreEfectivo + cashBox.cierreDigital)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal de Cierre de Caja */}
      {showCloseModal && selectedCashBox && (() => {
        const totals = calculateCashBoxTotals(selectedCashBox);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <div className="text-center mb-6">
                <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Cerrar Caja
                </h3>
                <p className="text-sm text-gray-600">
                  Cerrando caja de <strong>{getCollectorName(selectedCashBox.collectorId)}</strong>
                </p>
              </div>
              
              {/* Montos Esperados */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Montos Esperados
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-blue-700">Efectivo</div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(totals.efectivoTeorico)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Inicial: {formatCurrency(selectedCashBox.cajaInicial?.efectivo || 0)} + 
                      Cobros: {formatCurrency(totals.ingresosPorMetodo.efectivo)} - 
                      Gastos: {formatCurrency(totals.gastos)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-700">Yape/Digital</div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(totals.digitalTeorico)}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Inicial: {formatCurrency(Object.values(selectedCashBox.cajaInicial?.digital || {}).reduce((sum, val) => sum + (val || 0), 0))} + 
                      Cobros: {formatCurrency(totals.ingresosPorMetodo.digital)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Conteo Real */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Efectivo Real
                  </label>
                  <input
                    type="number"
                    value={finalCounts.efectivo}
                    onChange={(e) => setFinalCounts({...finalCounts, efectivo: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder={totals.efectivoTeorico.toFixed(2)}
                    min="0"
                    step="0.01"
                  />
                  {finalCounts.efectivo !== 0 && (
                    <div className={`text-sm mt-1 ${finalCounts.efectivo === totals.efectivoTeorico ? 'text-green-600' : Math.abs(finalCounts.efectivo - totals.efectivoTeorico) < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      Diferencia: {finalCounts.efectivo > totals.efectivoTeorico ? '+' : ''}{formatCurrency(finalCounts.efectivo - totals.efectivoTeorico)}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Yape/Digital Real
                  </label>
                  <input
                    type="number"
                    value={finalCounts.digital}
                    onChange={(e) => setFinalCounts({...finalCounts, digital: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder={totals.digitalTeorico.toFixed(2)}
                    min="0"
                    step="0.01"
                  />
                  {finalCounts.digital !== 0 && (
                    <div className={`text-sm mt-1 ${finalCounts.digital === totals.digitalTeorico ? 'text-green-600' : Math.abs(finalCounts.digital - totals.digitalTeorico) < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      Diferencia: {finalCounts.digital > totals.digitalTeorico ? '+' : ''}{formatCurrency(finalCounts.digital - totals.digitalTeorico)}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-600">Total Real</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(finalCounts.efectivo + finalCounts.digital)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Esperado</div>
                      <div className="text-lg font-semibold text-gray-700">
                        {formatCurrency(totals.efectivoTeorico + totals.digitalTeorico)}
                      </div>
                    </div>
                  </div>
                  {(finalCounts.efectivo + finalCounts.digital) !== 0 && (
                    <div className={`text-center text-sm mt-2 font-medium ${
                      Math.abs((finalCounts.efectivo + finalCounts.digital) - (totals.efectivoTeorico + totals.digitalTeorico)) < 1 ? 'text-green-600' : 
                      Math.abs((finalCounts.efectivo + finalCounts.digital) - (totals.efectivoTeorico + totals.digitalTeorico)) < 10 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Diferencia Total: {(finalCounts.efectivo + finalCounts.digital) > (totals.efectivoTeorico + totals.digitalTeorico) ? '+' : ''}
                      {formatCurrency((finalCounts.efectivo + finalCounts.digital) - (totals.efectivoTeorico + totals.digitalTeorico))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCloseCashBox}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Cerrar Caja
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Detalles de Caja */}
      {showDetailsModal && detailsCashBox && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles de Caja - {getCollectorName(detailsCashBox.collectorId)}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Resumen General */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Resumen General</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Fecha</p>
                    <p className="font-semibold">{formatDate(detailsCashBox.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(detailsCashBox.status)}`}>
                      {detailsCashBox.status === 'abierta' ? 'Activa' : 'Cerrada'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hora Apertura</p>
                    <p className="font-semibold">{formatTime(detailsCashBox.fechaApertura)}</p>
                  </div>
                  {detailsCashBox.fechaCierre && (
                    <div>
                      <p className="text-sm text-gray-600">Hora Cierre</p>
                      <p className="font-semibold">{formatTime(detailsCashBox.fechaCierre)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Ingresos por Servicio */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Ingresos ({detailsCashBox.ingresos?.length || 0})
                </h4>
                {detailsCashBox.ingresos && detailsCashBox.ingresos.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailsCashBox.ingresos.map((ingreso, idx) => (
                          <tr key={ingreso.id || idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTime(ingreso.time || ingreso.fecha)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ingreso.clientName || 'Cliente'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceColor(ingreso.serviceType || 'general')}`}>
                                {getServiceIcon(ingreso.serviceType || 'general')}
                                <span className="ml-1">{getServiceLabel(ingreso.serviceType || 'general')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
                                {ingreso.method || 'Efectivo'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                              {formatCurrency(ingreso.amount || ingreso.monto || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                            Total Ingresos:
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
                            {formatCurrency(detailsCashBox.ingresos.reduce((sum, i) => sum + (i.amount || i.monto || 0), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                    No hay ingresos registrados
                  </div>
                )}
              </div>

              {/* Gastos */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-red-600" />
                  Gastos ({detailsCashBox.gastos?.length || 0})
                </h4>
                {detailsCashBox.gastos && detailsCashBox.gastos.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailsCashBox.gastos.map((gasto, idx) => (
                          <tr key={gasto.id || idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTime(gasto.time || gasto.fecha)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceColor(gasto.serviceType || 'general')}`}>
                                {getServiceIcon(gasto.serviceType || 'general')}
                                <span className="ml-1">{getServiceLabel(gasto.serviceType || 'general')}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {gasto.concept || 'Gasto'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {gasto.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                              {formatCurrency(gasto.amount || gasto.monto || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                            Total Gastos:
                          </td>
                          <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
                            {formatCurrency(detailsCashBox.gastos.reduce((sum, g) => sum + (g.amount || g.monto || 0), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                    No hay gastos registrados
                  </div>
                )}
              </div>

              {/* Resumen por Tipo de Servicio */}
              {(() => {
                const totals = calculateCashBoxTotals(detailsCashBox);
                return Object.keys(totals.ingresosPorServicio || {}).length > 0 ? (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Resumen por Tipo de Servicio</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(totals.ingresosPorServicio).map(([servicio, data]) => (
                        <div key={servicio} className="bg-white rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {getServiceIcon(servicio)}
                              <span className="ml-2 font-medium text-gray-900">{getServiceLabel(servicio)}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(servicio)}`}>
                              {data.cantidad} cobros
                            </span>
                          </div>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(data.monto)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashBoxSupervisor;