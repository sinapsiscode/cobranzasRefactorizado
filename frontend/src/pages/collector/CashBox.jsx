import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useCashBoxStore } from '../../stores/cashBoxStore';
import { useNotificationStore } from '../../stores/notificationStore';
import {
  Wallet,
  DollarSign,
  Plus,
  Minus,
  Calculator,
  Clock,
  AlertTriangle,
  CheckCircle,
  Receipt,
  History,
  CreditCard,
  Banknote,
  Calendar,
  Download
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { generateCashBoxReport } from '../../services/reports/pdfGenerator';

const CashBox = () => {
  const { user } = useAuthStore();
  const {
    currentCashBox,
    loading,
    error,
    openCashBox,
    addExpense,
    closeCashBox,
    loadCurrentCashBox,
    loadCashBoxHistory,
    getCurrentTotals,
    getCashDifferences,
    clearError,
    hasCurrentCashBox,
    removeExpense,
    cashBoxHistory,
    // Nuevas funciones del sistema de solicitudes
    requestCashBoxOpening,
    canCollectorOpenCashBox,
    getCollectorCurrentRequest,
    requestsLoading
  } = useCashBoxStore();
  
  const { success, error: showError, info } = useNotificationStore();
  
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [initialCash, setInitialCash] = useState({ 
    efectivo: 0, 
    digital: { yape: 0, plin: 0, transferencia: 0, otros: 0 } 
  });
  
  // Estados para el sistema de solicitudes
  const [currentRequest, setCurrentRequest] = useState(null);
  const [canOpenCashBox, setCanOpenCashBox] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [newExpense, setNewExpense] = useState({ concept: '', amount: '', description: '', serviceType: 'general' });
  const [finalCounts, setFinalCounts] = useState({ efectivo: 0, digital: 0 });

  // Cargar caja actual y verificar solicitudes al montar el componente
  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        try {
          await loadCurrentCashBox(user.id);
          await loadCashBoxHistory(user.id);
          
          // Verificar sistema de solicitudes
          const today = new Date().toISOString().split('T')[0];
          const canOpen = canCollectorOpenCashBox(user.id, today);
          const request = getCollectorCurrentRequest(user.id, today);
          
          setCanOpenCashBox(canOpen);
          setCurrentRequest(request);
          
        } catch (error) {
          console.warn('Error cargando datos de caja:', error);
        }
      };
      
      loadData();
    }
  }, [user?.id, loadCurrentCashBox, loadCashBoxHistory, canCollectorOpenCashBox, getCollectorCurrentRequest]);

  // Limpiar errores
  useEffect(() => {
    if (error) {
      showError(error);
      clearError();
    }
  }, [error, showError, clearError]);

  // Función para solicitar apertura de caja
  const handleRequestCashBox = async () => {
    if (!user) return;
    
    try {
      // Usar la fecha de mañana para crear una nueva solicitud de prueba
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const workDate = tomorrow.toISOString().split('T')[0];
      
      const collectorName = user.name || user.fullName || 'Cobrador';
      
      await requestCashBoxOpening(user.id, collectorName, workDate, initialCash, requestNotes);
      
      setShowRequestModal(false);
      setRequestNotes('');
      setInitialCash({ 
        efectivo: 0, 
        digital: { yape: 0, plin: 0, transferencia: 0, otros: 0 } 
      });
      
      success('Solicitud de apertura de caja enviada. Espera la aprobación del Administrador.');
      
      // Actualizar estado local
      const newRequest = getCollectorCurrentRequest(user.id, workDate);
      setCurrentRequest(newRequest);
      
    } catch (error) {
      showError(error.message);
    }
  };

  // Función modificada para abrir caja (solo si está aprobado)
  const handleOpenCashBox = async () => {
    // Verificar que tenga aprobación
    if (!canOpenCashBox) {
      showError('No tienes autorización para abrir la caja. Solicita aprobación primero.');
      return;
    }
    
    try {
      console.log('Intentando abrir caja con:', { userId: user.id, initialCash });
      
      // Usar los montos de la solicitud aprobada si están disponibles
      const cashToOpen = currentRequest?.status === 'approved' 
        ? currentRequest.requestedInitialCash 
        : initialCash;
        
      // Pasar los parámetros en el orden correcto: collectorId, serviceType, initialCash
      const result = await openCashBox(user.id, 'general', cashToOpen);
      console.log('Caja abierta:', result);
      
      setShowOpenModal(false);
      setInitialCash({ 
        efectivo: 0, 
        digital: { yape: 0, plin: 0, transferencia: 0, otros: 0 } 
      });
      success('Caja abierta exitosamente');
    } catch (error) {
      console.error('Error al abrir caja:', error);
      showError('Error al abrir la caja: ' + error.message);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.concept || !newExpense.amount) {
      showError('Complete todos los campos obligatorios');
      return;
    }

    try {
      await addExpense(newExpense);
      setShowExpenseModal(false);
      setNewExpense({ concept: '', amount: '', description: '', serviceType: 'general' });
      success('Gasto registrado exitosamente');
    } catch (error) {
      showError('Error al registrar el gasto');
    }
  };

  const handleCloseCashBox = async () => {
    try {
      // Usar los totales teóricos como valores de cierre (sin permitir modificación)
      const finalAmounts = {
        efectivo: totals?.efectivoTeorico || 0,
        digital: totals?.digitalTeorico || 0
      };
      
      // Primero cerrar la caja con los valores reales
      const closedCashBox = await closeCashBox(finalAmounts);
      
      // Preparar datos para el PDF
      const cashBoxForReport = {
        ...currentCashBox,
        status: 'cerrada',
        fechaCierre: new Date().toISOString(),
        cierreEfectivo: finalAmounts.efectivo,
        cierreDigital: finalAmounts.digital
      };
      
      // Generar y descargar el PDF
      try {
        await generateCashBoxReport(cashBoxForReport, user);
        success('Caja cerrada y reporte PDF descargado exitosamente');
      } catch (pdfError) {
        console.error('Error al generar PDF:', pdfError);
        success('Caja cerrada exitosamente (PDF no pudo generarse)');
      }
      
      setShowCloseModal(false);
      setFinalCounts({ efectivo: 0, digital: 0 });
    } catch (error) {
      showError('Error al cerrar la caja');
    }
  };

  const handleRemoveExpense = async (expenseId) => {
    if (window.confirm('¿Eliminar este gasto?')) {
      try {
        await removeExpense(expenseId);
        success('Gasto eliminado');
      } catch (error) {
        showError('Error al eliminar el gasto');
      }
    }
  };

  const totals = getCurrentTotals();
  
  // Debug: verificar montos iniciales
  useEffect(() => {
    if (currentCashBox) {
      console.log('📦 Caja actual:', currentCashBox);
      console.log('💰 Montos iniciales:', {
        efectivo: currentCashBox.cajaInicial?.efectivo,
        digital: currentCashBox.cajaInicial?.digital
      });
      console.log('📊 Totales calculados:', totals);
    }
  }, [currentCashBox, totals]);
  
  const differences = finalCounts.efectivo > 0 || finalCounts.digital > 0 
    ? getCashDifferences(finalCounts) 
    : null;

  if (loading && !currentCashBox) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Cargando caja..." />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mi Caja</h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('es-PE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {!hasCurrentCashBox() ? (
          <button
            onClick={() => setShowOpenModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Abrir Caja
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
            >
              <History className="h-4 w-4 mr-1" />
              Historial
            </button>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              <Minus className="h-4 w-4 mr-1" />
              Gasto
            </button>
            <button
              onClick={() => setShowCloseModal(true)}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              <Calculator className="h-4 w-4 mr-1" />
              Cerrar Caja
            </button>
          </div>
        )}
      </div>

      {!hasCurrentCashBox() ? (
        // No hay caja abierta
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay caja abierta</h3>
          
          {/* Sistema de solicitudes */}
          {currentRequest ? (
            // Ya hay una solicitud
            <div className="mb-6">
              {currentRequest.status === 'pending' && (
                <>
                  <p className="text-yellow-600 mb-4">
                    ⏳ Solicitud pendiente de aprobación
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-yellow-800 mb-2">Estado de tu solicitud:</h4>
                    <p className="text-sm text-yellow-700">
                      Tu solicitud de apertura de caja está siendo revisada por el Administrador.
                      Te notificaremos cuando sea aprobada o si requiere ajustes.
                    </p>
                  </div>
                </>
              )}
              
              {currentRequest.status === 'approved' && (
                <>
                  <p className="text-green-600 mb-4">
                    ✅ Solicitud aprobada - Puedes abrir tu caja
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
                    <h4 className="font-medium text-green-800 mb-2">Montos aprobados:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Efectivo:</span>
                        <span className="ml-2 font-semibold">S/ {currentRequest.requestedInitialCash?.efectivo?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Digital:</span>
                        <span className="ml-2 font-semibold">
                          S/ {(
                            (currentRequest.requestedInitialCash?.digital?.yape || 0) +
                            (currentRequest.requestedInitialCash?.digital?.plin || 0) +
                            (currentRequest.requestedInitialCash?.digital?.transferencia || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenCashBox}
                    className="flex items-center mx-auto px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Abrir Caja del Día
                  </button>
                </>
              )}
              
              {currentRequest.status === 'rejected' && (
                <>
                  <p className="text-red-600 mb-4">
                    ❌ Solicitud rechazada
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mb-4">
                    <h4 className="font-medium text-red-800 mb-2">Razón del rechazo:</h4>
                    <p className="text-sm text-red-700">{currentRequest.rejectionReason}</p>
                  </div>
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva Solicitud
                  </button>
                </>
              )}
            </div>
          ) : (
            // No hay solicitud, debe crear una
            <>
              <p className="text-gray-600 mb-6">
                Solicita apertura de caja al Administrador para comenzar a trabajar
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                Solicitar Apertura
              </button>
            </>
          )}
          
          <div className="mt-4">
            <button
              onClick={() => {
                localStorage.removeItem(`tv-cable:cashbox:caja-${new Date().toISOString().split('T')[0]}-${user.id}`);
                window.location.reload();
              }}
              className="flex items-center mx-auto px-4 py-2 bg-red-100 text-red-600 rounded-md text-sm font-medium hover:bg-red-200"
            >
              Limpiar caja del día
            </button>
          </div>
        </div>
      ) : (
        // Caja abierta - Dashboard
        <>
          {/* Resumen de totales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Banknote className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Efectivo</p>
                  <p className="text-lg font-semibold text-gray-900">
                    S/ {totals?.efectivoTeorico.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Digital</p>
                  <p className="text-lg font-semibold text-gray-900">
                    S/ {totals?.digitalTeorico.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Plus className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Ingresos</p>
                  <p className="text-lg font-semibold text-gray-900">
                    S/ {totals?.totalIngresos.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <Minus className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Gastos</p>
                  <p className="text-lg font-semibold text-gray-900">
                    S/ {totals?.totalGastos.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Movimientos del día */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Ingresos */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Plus className="h-5 w-5 text-green-600 mr-2" />
                  Ingresos del Día ({currentCashBox.ingresos.length})
                </h3>
              </div>
              <div className="p-6">
                {currentCashBox.ingresos.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay ingresos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {currentCashBox.ingresos.map((ingreso, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{ingreso.clientName}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(ingreso.time).toLocaleTimeString('es-PE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {
                              ingreso.method === 'efectivo' ? '💵 Efectivo' :
                              ingreso.method === 'yape' ? '📱 Yape' :
                              ingreso.method === 'plin' ? '📱 Plin' :
                              ingreso.method === 'transferencia' ? '🏦 Transferencia' :
                              ingreso.method === 'otros' ? '📲 Otros' : '📱 Digital'
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            +S/ {ingreso.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Gastos */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Minus className="h-5 w-5 text-red-600 mr-2" />
                  Gastos del Día ({currentCashBox.gastos.length})
                </h3>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </button>
              </div>
              <div className="p-6">
                {currentCashBox.gastos.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay gastos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {currentCashBox.gastos.map((gasto) => (
                      <div key={gasto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{gasto.concept}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(gasto.time).toLocaleTimeString('es-PE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {gasto.description && (
                            <p className="text-xs text-gray-500">{gasto.description}</p>
                          )}
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <p className="font-semibold text-red-600">
                            -S/ {gasto.amount.toFixed(2)}
                          </p>
                          <button
                            onClick={() => handleRemoveExpense(gasto.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estado de la caja */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-blue-900">Estado de la Caja</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-blue-600">Inicial Efectivo:</p>
                <p className="font-semibold">S/ {currentCashBox.cajaInicial.efectivo.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-600">Inicial Digital:</p>
                <p className="font-semibold">S/ {totals?.inicialDigital?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-blue-600">Total Teórico:</p>
                <p className="font-semibold">S/ {totals?.totalTeorico.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-blue-600">Abierta desde:</p>
                <p className="font-semibold">
                  {new Date(currentCashBox.fechaApertura).toLocaleTimeString('es-PE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Abrir Caja */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Abrir Caja del Día</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💵 Efectivo Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={initialCash.efectivo}
                  onChange={(e) => setInitialCash(prev => ({ ...prev, efectivo: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📱 Montos Digitales Iniciales
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Yape</label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialCash.digital.yape}
                      onChange={(e) => setInitialCash(prev => ({ 
                        ...prev, 
                        digital: { ...prev.digital, yape: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Plin</label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialCash.digital.plin}
                      onChange={(e) => setInitialCash(prev => ({ 
                        ...prev, 
                        digital: { ...prev.digital, plin: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Transferencia</label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialCash.digital.transferencia}
                      onChange={(e) => setInitialCash(prev => ({ 
                        ...prev, 
                        digital: { ...prev.digital, transferencia: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Otros</label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialCash.digital.otros}
                      onChange={(e) => setInitialCash(prev => ({ 
                        ...prev, 
                        digital: { ...prev.digital, otros: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total Digital: S/ {(initialCash.digital.yape + initialCash.digital.plin + initialCash.digital.transferencia + initialCash.digital.otros).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowOpenModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleOpenCashBox}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Abrir Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Gasto */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Gasto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Servicio *
                </label>
                <select
                  value={newExpense.serviceType}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, serviceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">🏢 General (Operativo)</option>
                  <option value="internet">🌐 Internet</option>
                  <option value="cable">📺 Cable</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Seleccione a qué servicio corresponde este gasto
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto *
                </label>
                <select
                  value={newExpense.concept}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, concept: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar concepto...</option>
                  {newExpense.serviceType === 'general' ? (
                    <>
                      <option value="Pasajes">Pasajes</option>
                      <option value="Combustible">Combustible</option>
                      <option value="Alimentación">Alimentación</option>
                      <option value="Telefono">Teléfono/Comunicación</option>
                      <option value="Papelería">Papelería/Oficina</option>
                      <option value="Otros">Otros Gastos Operativos</option>
                    </>
                  ) : newExpense.serviceType === 'internet' ? (
                    <>
                      <option value="Cable UTP">Cable UTP</option>
                      <option value="Conectores RJ45">Conectores RJ45</option>
                      <option value="Router">Router/Modem</option>
                      <option value="Antena">Antena</option>
                      <option value="Herramientas">Herramientas</option>
                      <option value="Instalación">Materiales de Instalación</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Otros">Otros - Internet</option>
                    </>
                  ) : (
                    <>
                      <option value="Cable Coaxial">Cable Coaxial</option>
                      <option value="Conectores">Conectores F</option>
                      <option value="Decodificador">Decodificador</option>
                      <option value="Control Remoto">Control Remoto</option>
                      <option value="Splitter">Splitter</option>
                      <option value="Instalación">Materiales de Instalación</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Otros">Otros - Cable</option>
                    </>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalles adicionales..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Caja */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Cierre de Caja</h3>
            
            <div className="space-y-4">
              {/* Resumen del día */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Resumen del Día</h4>
                
                {/* Montos iniciales */}
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Montos Iniciales:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Efectivo: </span>
                      <span className="font-semibold">S/ {(currentCashBox?.cajaInicial?.efectivo || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Digital: </span>
                      <span className="font-semibold">S/ {Object.values(currentCashBox?.cajaInicial?.digital || {}).reduce((sum, val) => sum + val, 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Movimientos del día */}
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Movimientos:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ingresos:</span>
                      <span className="font-semibold text-green-600">+ S/ {(currentCashBox?.ingresos?.reduce((sum, i) => sum + i.monto, 0) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gastos:</span>
                      <span className="font-semibold text-red-600">- S/ {(currentCashBox?.gastos?.reduce((sum, g) => sum + g.monto, 0) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Totales finales */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Totales Finales:</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Efectivo:</p>
                      <p className="font-bold text-lg">S/ {totals?.efectivoTeorico.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Digital:</p>
                      <p className="font-bold text-lg">S/ {totals?.digitalTeorico.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="flex justify-between">
                      <span className="font-medium">Total General:</span>
                      <span className="font-bold text-lg text-blue-600">S/ {((totals?.efectivoTeorico || 0) + (totals?.digitalTeorico || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje informativo */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Al cerrar la caja se generará automáticamente un reporte PDF con todos los detalles del día.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseCashBox}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Cerrar y Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Cajas */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <History className="h-5 w-5 mr-2" />
                Historial de Cajas
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {cashBoxHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No hay historial de cajas</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {cashBoxHistory.map((box) => {
                    const boxTotals = {
                      inicialEfectivo: box.cajaInicial.efectivo,
                      inicialDigital: typeof box.cajaInicial.digital === 'object'
                        ? Object.values(box.cajaInicial.digital).reduce((sum, val) => sum + val, 0)
                        : box.cajaInicial.digital,
                      ingresosEfectivo: box.ingresos.filter(i => i.method === 'efectivo').reduce((sum, i) => sum + i.amount, 0),
                      ingresosDigital: box.ingresos.filter(i => ['yape', 'plin', 'transferencia', 'otros', 'digital'].includes(i.method)).reduce((sum, i) => sum + i.amount, 0),
                      totalGastos: box.gastos.reduce((sum, g) => sum + g.amount, 0)
                    };
                    
                    const efectivoTeorico = boxTotals.inicialEfectivo + boxTotals.ingresosEfectivo - boxTotals.totalGastos;
                    const digitalTeorico = boxTotals.inicialDigital + boxTotals.ingresosDigital;
                    
                    const diffEfectivo = box.cierreEfectivo - efectivoTeorico;
                    const diffDigital = box.cierreDigital - digitalTeorico;
                    const totalDiff = diffEfectivo + diffDigital;
                    
                    return (
                      <div key={box.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(box.date).toLocaleDateString('es-PE', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(box.fechaApertura).toLocaleTimeString('es-PE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} - {new Date(box.fechaCierre).toLocaleTimeString('es-PE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            totalDiff === 0 
                              ? 'bg-green-100 text-green-800' 
                              : Math.abs(totalDiff) <= 5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}>
                            {totalDiff === 0 ? 'Cuadrada' : `${totalDiff > 0 ? '+' : ''}S/ ${totalDiff.toFixed(2)}`}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Ingresos:</p>
                            <p className="font-medium">S/ {(boxTotals.ingresosEfectivo + boxTotals.ingresosDigital).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{box.ingresos.length} pagos</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Gastos:</p>
                            <p className="font-medium">S/ {boxTotals.totalGastos.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{box.gastos.length} gastos</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Total Final:</p>
                            <p className="font-medium">S/ {(box.cierreEfectivo + box.cierreDigital).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              E: S/ {box.cierreEfectivo.toFixed(2)} | D: S/ {box.cierreDigital.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Solicitar Apertura de Caja */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitar Apertura de Caja</h3>
            
            <div className="space-y-4">
              {/* Efectivo inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💵 Efectivo Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={initialCash.efectivo}
                  onChange={(e) => setInitialCash({
                    ...initialCash,
                    efectivo: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Montos digitales */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📱 Yape
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialCash.digital.yape}
                    onChange={(e) => setInitialCash({
                      ...initialCash,
                      digital: { ...initialCash.digital, yape: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💳 Plin
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialCash.digital.plin}
                    onChange={(e) => setInitialCash({
                      ...initialCash,
                      digital: { ...initialCash.digital, plin: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🏦 Transferencia
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialCash.digital.transferencia}
                    onChange={(e) => setInitialCash({
                      ...initialCash,
                      digital: { ...initialCash.digital, transferencia: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💰 Otros
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialCash.digital.otros}
                    onChange={(e) => setInitialCash({
                      ...initialCash,
                      digital: { ...initialCash.digital, otros: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Notas adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📝 Notas (opcional)
                </label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="Información adicional para el Administrador..."
                />
              </div>

              {/* Total calculado */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">Total Inicial:</span>
                  <span className="text-lg font-semibold text-blue-900">
                    S/ {(
                      initialCash.efectivo + 
                      initialCash.digital.yape + 
                      initialCash.digital.plin + 
                      initialCash.digital.transferencia + 
                      initialCash.digital.otros
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestCashBox}
                disabled={requestsLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {requestsLoading ? 'Enviando...' : 'Solicitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashBox;