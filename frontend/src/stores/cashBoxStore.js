// Store de caja diaria para cobradores
import { create } from 'zustand';
import {
  createCashBoxRequest,
  approveCashBoxRequest as approveRequestSchema,
  rejectCashBoxRequest as rejectRequestSchema,
  RequestStatus
} from '../schemas/cashBoxRequest';

const API_URL = '/api';

export const useCashBoxStore = create((set, get) => ({
  // Estado
  currentCashBox: null,
  cashBoxHistory: [],
  loading: false,
  error: null,

  // Estado de solicitudes de caja
  cashBoxRequests: [],
  pendingRequests: [],
  currentRequest: null,
  requestsLoading: false,

  // Acciones principales
  openCashBox: async (collectorId, serviceType = 'internet', initialCash = { efectivo: 0, digital: { yape: 0, plin: 0, transferencia: 0, otros: 0 } }) => {
    set({ loading: true, error: null });

    try {
      console.log('🔄 Abriendo caja para:', collectorId, 'con montos:', initialCash);

      if (!collectorId) {
        throw new Error('ID de cobrador requerido');
      }

      const today = new Date().toISOString().split('T')[0];
      const cashBoxId = `caja-${serviceType}-${today}-${collectorId}`;

      console.log('📦 Verificando caja existente:', cashBoxId);

      // NOTE: For now, cash boxes are kept in memory/state since backend endpoints aren't ready
      // When backend adds cash box endpoints, replace this with API calls
      const { currentCashBox } = get();
      if (currentCashBox && currentCashBox.id === cashBoxId) {
        console.log('⚠️ Ya existe una caja para hoy');

        // Si está cerrada, permitir crear una nueva
        if (currentCashBox.status === 'cerrada') {
          console.log('📝 Caja anterior estaba cerrada, creando nueva');
        } else {
          console.log('✅ Cargando caja existente');
          set({ loading: false });
          return currentCashBox;
        }
      }

      // Validar montos iniciales
      if (!initialCash || typeof initialCash !== 'object') {
        throw new Error('Montos iniciales inválidos');
      }

      // Crear nueva caja
      const newCashBox = {
        id: cashBoxId,
        collectorId,
        serviceType, // Tipo de servicio (internet/cable)
        date: today,
        status: 'abierta',
        cajaInicial: {
          efectivo: Number(initialCash.efectivo) || 0,
          digital: {
            yape: Number(initialCash.digital?.yape) || 0,
            plin: Number(initialCash.digital?.plin) || 0,
            transferencia: Number(initialCash.digital?.transferencia) || 0,
            otros: Number(initialCash.digital?.otros) || 0
          }
        },
        ingresos: [],
        gastos: [],
        cierreEfectivo: null,
        cierreDigital: null,
        fechaCierre: null,
        fechaApertura: new Date().toISOString()
      };

      console.log('💾 Guardando nueva caja:', newCashBox);

      // Keep in memory/state for now
      console.log('✅ Caja creada exitosamente');
      set({ currentCashBox: newCashBox, loading: false });
      return newCashBox;

    } catch (error) {
      console.error('❌ Error al abrir caja:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Registrar ingreso por pago
  addPaymentIncome: async (paymentData) => {
    const { currentCashBox } = get();
    if (!currentCashBox || currentCashBox.status !== 'abierta') {
      throw new Error('No hay caja abierta');
    }

    try {
      const newIncome = {
        id: `income-${Date.now()}`,
        paymentId: paymentData.paymentId,
        clientName: paymentData.clientName,
        clientId: paymentData.clientId,
        amount: paymentData.amount,
        method: paymentData.method, // 'efectivo', 'yape', 'plin', 'transferencia', 'otros'
        time: new Date().toISOString(),
        concept: 'Pago de cliente'
      };

      const updatedCashBox = {
        ...currentCashBox,
        ingresos: [...currentCashBox.ingresos, newIncome]
      };

      // Keep in memory/state
      set({ currentCashBox: updatedCashBox });

      return newIncome;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Registrar gasto
  addExpense: async (expenseData) => {
    const { currentCashBox } = get();
    if (!currentCashBox || currentCashBox.status !== 'abierta') {
      throw new Error('No hay caja abierta');
    }

    try {
      const newExpense = {
        id: `expense-${Date.now()}`,
        concept: expenseData.concept,
        amount: parseFloat(expenseData.amount),
        time: new Date().toISOString(),
        description: expenseData.description || '',
        receipt: expenseData.receipt || null
      };

      const updatedCashBox = {
        ...currentCashBox,
        gastos: [...currentCashBox.gastos, newExpense]
      };

      // Keep in memory/state
      set({ currentCashBox: updatedCashBox });

      return newExpense;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Cuadrar y cerrar caja
  closeCashBox: async (finalCounts) => {
    const { currentCashBox } = get();
    if (!currentCashBox || currentCashBox.status !== 'abierta') {
      throw new Error('No hay caja abierta para cerrar');
    }

    try {
      const closedCashBox = {
        ...currentCashBox,
        status: 'cerrada',
        cierreEfectivo: parseFloat(finalCounts.efectivo),
        cierreDigital: parseFloat(finalCounts.digital),
        fechaCierre: new Date().toISOString()
      };

      // Agregar al historial
      const history = get().cashBoxHistory;
      const updatedHistory = [closedCashBox, ...history];
      set({
        currentCashBox: null,
        cashBoxHistory: updatedHistory
      });

      return closedCashBox;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Cargar caja actual del día
  loadCurrentCashBox: async (collectorId) => {
    set({ loading: true, error: null });

    try {
      // NOTE: For now, cash boxes are kept in memory/state
      // Return the current cash box if it exists for this collector
      const { currentCashBox } = get();
      const today = new Date().toISOString().split('T')[0];

      if (currentCashBox &&
          currentCashBox.collectorId === collectorId &&
          currentCashBox.date === today &&
          currentCashBox.status === 'abierta') {
        set({ loading: false });
        return currentCashBox;
      }

      set({ currentCashBox: null, loading: false });
      return null;
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Cargar historial de cajas
  loadCashBoxHistory: async (collectorId) => {
    try {
      // NOTE: For now, cash boxes history is kept in memory/state
      const { cashBoxHistory } = get();
      const collectorHistory = cashBoxHistory.filter(box => box.collectorId === collectorId);
      return collectorHistory;
    } catch (error) {
      set({ error: error.message });
      return [];
    }
  },

  // Calcular totales de la caja actual
  getCurrentTotals: () => {
    const { currentCashBox } = get();
    if (!currentCashBox) return null;

    const inicialEfectivo = currentCashBox.cajaInicial.efectivo;
    const inicialDigital = typeof currentCashBox.cajaInicial.digital === 'object'
      ? Object.values(currentCashBox.cajaInicial.digital).reduce((sum, val) => sum + val, 0)
      : currentCashBox.cajaInicial.digital;

    const ingresosEfectivo = currentCashBox.ingresos
      .filter(i => i.method === 'efectivo')
      .reduce((sum, i) => sum + i.amount, 0);

    // Separar ingresos por tipo digital
    const ingresosYape = currentCashBox.ingresos
      .filter(i => i.method === 'yape')
      .reduce((sum, i) => sum + i.amount, 0);

    const ingresosPlin = currentCashBox.ingresos
      .filter(i => i.method === 'plin')
      .reduce((sum, i) => sum + i.amount, 0);

    const ingresosTransferencia = currentCashBox.ingresos
      .filter(i => i.method === 'transferencia')
      .reduce((sum, i) => sum + i.amount, 0);

    const ingresosOtros = currentCashBox.ingresos
      .filter(i => i.method === 'otros')
      .reduce((sum, i) => sum + i.amount, 0);

    const ingresosDigital = ingresosYape + ingresosPlin + ingresosTransferencia + ingresosOtros;

    const totalGastos = currentCashBox.gastos
      .reduce((sum, g) => sum + g.amount, 0);

    const efectivoTeorico = inicialEfectivo + ingresosEfectivo - totalGastos;
    const digitalTeorico = inicialDigital + ingresosDigital;

    return {
      inicialEfectivo,
      inicialDigital,
      ingresosEfectivo,
      ingresosDigital,
      ingresosYape,
      ingresosPlin,
      ingresosTransferencia,
      ingresosOtros,
      totalGastos,
      efectivoTeorico,
      digitalTeorico,
      totalTeorico: efectivoTeorico + digitalTeorico,
      totalIngresos: ingresosEfectivo + ingresosDigital,
      // Detalles de digital inicial
      digitalInicial: currentCashBox.cajaInicial.digital
    };
  },

  // Verificar diferencias en el cuadre
  getCashDifferences: (finalCounts) => {
    const totals = get().getCurrentTotals();
    if (!totals || !finalCounts) return null;

    const diffEfectivo = (finalCounts.efectivo || 0) - totals.efectivoTeorico;
    const diffDigital = (finalCounts.digital || 0) - totals.digitalTeorico;

    return {
      efectivo: {
        teorico: totals.efectivoTeorico,
        real: finalCounts.efectivo || 0,
        diferencia: diffEfectivo
      },
      digital: {
        teorico: totals.digitalTeorico,
        real: finalCounts.digital || 0,
        diferencia: diffDigital
      },
      totalDiferencia: diffEfectivo + diffDigital
    };
  },

  // Utilidades
  clearError: () => set({ error: null }),

  isLoading: () => get().loading,

  hasCurrentCashBox: () => {
    const { currentCashBox } = get();

    // Verificar en memoria
    if (currentCashBox && currentCashBox.status === 'abierta') {
      return true;
    }

    return false;
  },

  // Eliminar gasto
  removeExpense: async (expenseId) => {
    const { currentCashBox } = get();
    if (!currentCashBox) return;

    const updatedCashBox = {
      ...currentCashBox,
      gastos: currentCashBox.gastos.filter(g => g.id !== expenseId)
    };

    set({ currentCashBox: updatedCashBox });
  },

  // ============= SISTEMA DE SOLICITUDES DE CAJA =============

  // Crear solicitud de apertura de caja (COBRADOR)
  requestCashBoxOpening: async (collectorId, collectorName, workDate, requestedInitialCash, notes = '') => {
    set({ requestsLoading: true, error: null });

    try {
      // Verificar si ya tiene una solicitud pendiente para ese día
      const response = await fetch(`${API_URL}/cashBoxRequests`);
      if (!response.ok) {
        throw new Error('Error al cargar solicitudes');
      }

      const requests = await response.json();
      const existingRequest = requests.find(r =>
        r.collectorId === collectorId &&
        r.workDate === workDate &&
        r.status === RequestStatus.PENDING
      );

      if (existingRequest) {
        throw new Error('Ya tienes una solicitud pendiente para esta fecha');
      }

      // Crear nueva solicitud usando el schema helper
      const newRequestData = createCashBoxRequest(collectorId, collectorName, workDate, requestedInitialCash, notes);

      // Enviar al backend
      const createResponse = await fetch(`${API_URL}/cashbox/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectorId,
          requestedInitialCash,
          notes,
          collectorName,
          workDate
        })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.message || 'Error al crear solicitud');
      }

      const newRequest = await createResponse.json();

      // Actualizar estado
      const allRequests = [...requests, newRequest];
      set({
        cashBoxRequests: allRequests,
        currentRequest: newRequest,
        requestsLoading: false
      });

      // Actualizar solicitudes pendientes
      get().loadPendingRequests();

      return newRequest;

    } catch (error) {
      set({ requestsLoading: false, error: error.message });
      throw error;
    }
  },

  // Cargar solicitudes de caja (TODAS)
  loadCashBoxRequests: async () => {
    try {
      const response = await fetch(`${API_URL}/cashBoxRequests`);
      if (!response.ok) {
        throw new Error('Error al cargar solicitudes');
      }

      const requests = await response.json();
      set({ cashBoxRequests: requests });
      return requests;
    } catch (error) {
      console.error('Error loading cash box requests:', error);
      set({ cashBoxRequests: [] });
      return [];
    }
  },

  // Cargar solicitudes pendientes (SUB-ADMIN)
  loadPendingRequests: async () => {
    try {
      const requests = await get().loadCashBoxRequests();
      const pending = requests.filter(r => r.status === 'pending');
      console.log('🔍 Total requests:', requests.length);
      console.log('⏳ Pending requests:', pending.length);
      set({ pendingRequests: pending });
      return pending;
    } catch (error) {
      console.error('Error loading pending requests:', error);
      set({ pendingRequests: [] });
      return [];
    }
  },

  // Aprobar solicitud de caja (SUB-ADMIN)
  approveCashBoxRequest: async (requestId, approvedBy) => {
    set({ requestsLoading: true, error: null });

    try {
      const requests = await get().loadCashBoxRequests();
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        throw new Error('Solicitud no encontrada');
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new Error('La solicitud ya fue procesada');
      }

      // Aprobar solicitud en el backend
      const response = await fetch(`${API_URL}/cashbox/request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          approvedInitialCash: request.requestedInitialCash,
          approvedBy
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al aprobar solicitud');
      }

      const approvedRequest = await response.json();

      // Actualizar estado local
      const updatedRequests = requests.map(r =>
        r.id === requestId ? approvedRequest : r
      );

      set({
        cashBoxRequests: updatedRequests,
        requestsLoading: false
      });

      // Actualizar solicitudes pendientes
      get().loadPendingRequests();

      return approvedRequest;

    } catch (error) {
      set({ requestsLoading: false, error: error.message });
      throw error;
    }
  },

  // Rechazar solicitud de caja (SUB-ADMIN)
  rejectCashBoxRequest: async (requestId, rejectionReason, rejectedBy) => {
    set({ requestsLoading: true, error: null });

    try {
      const requests = await get().loadCashBoxRequests();
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        throw new Error('Solicitud no encontrada');
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new Error('La solicitud ya fue procesada');
      }

      // Rechazar solicitud en el backend
      const response = await fetch(`${API_URL}/cashbox/request/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          approvedBy: rejectedBy,
          rejectionReason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al rechazar solicitud');
      }

      const rejectedRequest = await response.json();

      // Actualizar estado local
      const updatedRequests = requests.map(r =>
        r.id === requestId ? rejectedRequest : r
      );

      set({
        cashBoxRequests: updatedRequests,
        requestsLoading: false
      });

      // Actualizar solicitudes pendientes
      get().loadPendingRequests();

      return rejectedRequest;

    } catch (error) {
      set({ requestsLoading: false, error: error.message });
      throw error;
    }
  },

  // Verificar si cobrador puede abrir caja (tiene solicitud aprobada)
  canCollectorOpenCashBox: async (collectorId, workDate) => {
    try {
      const requests = await get().loadCashBoxRequests();
      const approvedRequest = requests.find(r =>
        r.collectorId === collectorId &&
        r.workDate === workDate &&
        r.status === RequestStatus.APPROVED
      );
      return !!approvedRequest;
    } catch (error) {
      console.error('Error checking cash box permission:', error);
      return false;
    }
  },

  // Obtener solicitud actual del cobrador
  getCollectorCurrentRequest: async (collectorId, workDate) => {
    try {
      const requests = await get().loadCashBoxRequests();
      return requests.find(r =>
        r.collectorId === collectorId &&
        r.workDate === workDate
      ) || null;
    } catch (error) {
      console.error('Error getting collector request:', error);
      return null;
    }
  },

  // Obtener todas las cajas abiertas (SUB-ADMIN)
  getAllOpenCashBoxes: () => {
    // NOTE: For now, cash boxes are kept in memory/state
    // When backend adds cash box endpoints, replace this with API call
    const { currentCashBox } = get();
    const today = new Date().toISOString().split('T')[0];

    if (currentCashBox && currentCashBox.status === 'abierta' && currentCashBox.date === today) {
      return [currentCashBox];
    }

    return [];
  },

  // Obtener historial de cajas (SUB-ADMIN)
  getAllCashBoxHistory: (startDate = null, endDate = null) => {
    // NOTE: For now, cash boxes are kept in memory/state
    const { cashBoxHistory } = get();

    return cashBoxHistory.filter(cashBox => {
      if (startDate && cashBox.date < startDate) return false;
      if (endDate && cashBox.date > endDate) return false;
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Cerrar caja específica (SUB-ADMIN)
  closeCashBoxById: async (cashBoxId, finalCounts, closedBy) => {
    try {
      const { currentCashBox } = get();

      if (!currentCashBox || currentCashBox.id !== cashBoxId) {
        throw new Error('Caja no encontrada');
      }

      if (currentCashBox.status !== 'abierta') {
        throw new Error('La caja no está abierta');
      }

      const updatedCashBox = {
        ...currentCashBox,
        status: 'cerrada',
        cierreEfectivo: finalCounts.efectivo || 0,
        cierreDigital: finalCounts.digital || 0,
        fechaCierre: new Date().toISOString(),
        cerradoPor: closedBy
      };

      // Actualizar historial
      const history = get().cashBoxHistory;
      const updatedHistory = [updatedCashBox, ...history];

      set({
        currentCashBox: updatedCashBox,
        cashBoxHistory: updatedHistory
      });

      return updatedCashBox;

    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Función para cargar datos de simulación
  loadSimulationData: async () => {
    try {
      // NOTE: This function was for localStorage simulation data
      // For now, we'll keep it but it won't do anything since we're using API
      console.log('⚠️ loadSimulationData is deprecated - using API data instead');

      // Load requests from API
      await get().loadCashBoxRequests();
      await get().loadPendingRequests();

      return true;
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar datos de simulación:', error);
      return false;
    }
  },

  // Funciones específicas para cajas por tipo de servicio
  getCashBoxesByServiceType: (serviceType) => {
    const { cashBoxHistory } = get();
    return cashBoxHistory.filter(cashBox => cashBox.serviceType === serviceType);
  },

  getInternetCashBoxes: () => {
    return get().getCashBoxesByServiceType('internet');
  },

  getCableCashBoxes: () => {
    return get().getCashBoxesByServiceType('cable');
  },

  // Obtener caja activa por tipo de servicio y cobrador
  getCurrentCashBoxByType: (collectorId, serviceType) => {
    const { currentCashBox } = get();
    const today = new Date().toISOString().split('T')[0];

    if (currentCashBox &&
        currentCashBox.collectorId === collectorId &&
        currentCashBox.serviceType === serviceType &&
        currentCashBox.date === today &&
        currentCashBox.status === 'abierta') {
      return currentCashBox;
    }

    return null;
  },

  // Función para obtener todas las cajas activas del día por tipo
  getAllActiveCashBoxes: (date = null) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const activeCashBoxes = { internet: [], cable: [] };

    const { currentCashBox } = get();

    if (currentCashBox && currentCashBox.date === targetDate && currentCashBox.status === 'abierta') {
      if (currentCashBox.serviceType === 'internet') {
        activeCashBoxes.internet.push(currentCashBox);
      } else if (currentCashBox.serviceType === 'cable') {
        activeCashBoxes.cable.push(currentCashBox);
      }
    }

    return activeCashBoxes;
  }
}));
