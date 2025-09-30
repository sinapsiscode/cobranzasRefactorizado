// Store de caja diaria para cobradores
import { create } from 'zustand';
import { 
  createCashBoxRequest, 
  approveCashBoxRequest, 
  rejectCashBoxRequest,
  RequestStatus 
} from '../services/mock/schemas/cashBoxRequest';

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
      
      // Verificar si ya existe una caja abierta para hoy
      const existingCashBox = localStorage.getItem(`tv-cable:cashbox:${cashBoxId}`);
      if (existingCashBox) {
        console.log('⚠️ Ya existe una caja para hoy');
        const cashBox = JSON.parse(existingCashBox);
        
        // Si está cerrada, permitir crear una nueva
        if (cashBox.status === 'cerrada') {
          console.log('📝 Caja anterior estaba cerrada, creando nueva');
          localStorage.removeItem(`tv-cable:cashbox:${cashBoxId}`);
        } else {
          console.log('✅ Cargando caja existente');
          set({ currentCashBox: cashBox, loading: false });
          return cashBox;
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
      
      // Guardar en localStorage
      localStorage.setItem(`tv-cable:cashbox:${cashBoxId}`, JSON.stringify(newCashBox));
      
      // Verificar que se guardó correctamente
      const saved = localStorage.getItem(`tv-cable:cashbox:${cashBoxId}`);
      if (!saved) {
        throw new Error('No se pudo guardar la caja');
      }
      
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
      
      // Guardar cambios
      localStorage.setItem(`tv-cable:cashbox:${updatedCashBox.id}`, JSON.stringify(updatedCashBox));
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
      
      // Guardar cambios
      localStorage.setItem(`tv-cable:cashbox:${updatedCashBox.id}`, JSON.stringify(updatedCashBox));
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
      
      // Guardar caja cerrada
      localStorage.setItem(`tv-cable:cashbox:${closedCashBox.id}`, JSON.stringify(closedCashBox));
      
      // Agregar al historial
      const history = get().cashBoxHistory;
      const updatedHistory = [closedCashBox, ...history];
      set({ 
        currentCashBox: null, 
        cashBoxHistory: updatedHistory 
      });
      
      // Guardar historial
      localStorage.setItem('tv-cable:cashbox-history', JSON.stringify(updatedHistory));
      
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
      const today = new Date().toISOString().split('T')[0];
      const cashBoxId = `caja-${today}-${collectorId}`;
      
      const cashBoxData = localStorage.getItem(`tv-cable:cashbox:${cashBoxId}`);
      if (cashBoxData) {
        const cashBox = JSON.parse(cashBoxData);
        set({ currentCashBox: cashBox, loading: false });
        return cashBox;
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
      const historyData = localStorage.getItem('tv-cable:cashbox-history');
      if (historyData) {
        const allHistory = JSON.parse(historyData);
        const collectorHistory = allHistory.filter(box => box.collectorId === collectorId);
        set({ cashBoxHistory: collectorHistory });
        return collectorHistory;
      }
      
      set({ cashBoxHistory: [] });
      return [];
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
    
    // Verificar en memoria primero
    if (currentCashBox && currentCashBox.status === 'abierta') {
      return true;
    }
    
    // Si no hay en memoria, verificar localStorage directamente
    try {
      // Obtener usuario actual de localStorage
      const authData = localStorage.getItem('tv-cable:auth');
      if (!authData) return false;
      
      const auth = JSON.parse(authData);
      const userId = auth.user?.id;
      if (!userId) return false;
      
      const today = new Date().toISOString().split('T')[0];
      const cashBoxId = `caja-internet-${today}-${userId}`;
      
      const cashBoxData = localStorage.getItem(`tv-cable:cashbox:${cashBoxId}`);
      if (cashBoxData) {
        const cashBox = JSON.parse(cashBoxData);
        
        // Si encontramos una caja abierta, actualizar el estado
        if (cashBox.status === 'abierta') {
          set({ currentCashBox: cashBox });
          return true;
        }
      }
    } catch (error) {
      console.warn('Error verificando caja en localStorage:', error);
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
    
    localStorage.setItem(`tv-cable:cashbox:${updatedCashBox.id}`, JSON.stringify(updatedCashBox));
    set({ currentCashBox: updatedCashBox });
  },

  // ============= SISTEMA DE SOLICITUDES DE CAJA =============
  
  // Crear solicitud de apertura de caja (COBRADOR)
  requestCashBoxOpening: async (collectorId, collectorName, workDate, requestedInitialCash, notes = '') => {
    set({ requestsLoading: true, error: null });
    
    try {
      // Verificar si ya tiene una solicitud pendiente para ese día
      const requests = get().loadCashBoxRequests();
      const existingRequest = requests.find(r => 
        r.collectorId === collectorId && 
        r.workDate === workDate && 
        r.status === RequestStatus.PENDING
      );
      
      if (existingRequest) {
        throw new Error('Ya tienes una solicitud pendiente para esta fecha');
      }
      
      // Crear nueva solicitud
      const newRequest = createCashBoxRequest(collectorId, collectorName, workDate, requestedInitialCash, notes);
      
      // Guardar solicitud
      const allRequests = [...requests, newRequest];
      localStorage.setItem('tv-cable:cashbox-requests', JSON.stringify(allRequests));
      
      // Actualizar estado
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
  loadCashBoxRequests: () => {
    const stored = localStorage.getItem('tv-cable:cashbox-requests');
    const requests = stored ? JSON.parse(stored) : [];
    set({ cashBoxRequests: requests });
    return requests;
  },
  
  // Cargar solicitudes pendientes (SUB-ADMIN)
  loadPendingRequests: () => {
    const requests = get().loadCashBoxRequests();
    const pending = requests.filter(r => r.status === 'pending');
    console.log('🔍 Total requests:', requests.length);
    console.log('⏳ Pending requests:', pending.length);
    set({ pendingRequests: pending });
    return pending;
  },
  
  // Aprobar solicitud de caja (SUB-ADMIN)
  approveCashBoxRequest: async (requestId, approvedBy) => {
    set({ requestsLoading: true, error: null });
    
    try {
      const requests = get().loadCashBoxRequests();
      const requestIndex = requests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Solicitud no encontrada');
      }
      
      const request = requests[requestIndex];
      if (request.status !== RequestStatus.PENDING) {
        throw new Error('La solicitud ya fue procesada');
      }
      
      // Aprobar solicitud
      const approvedRequest = approveCashBoxRequest(request, approvedBy);
      requests[requestIndex] = approvedRequest;
      
      // Guardar cambios
      localStorage.setItem('tv-cable:cashbox-requests', JSON.stringify(requests));
      
      // Actualizar estado
      set({
        cashBoxRequests: requests,
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
      const requests = get().loadCashBoxRequests();
      const requestIndex = requests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        throw new Error('Solicitud no encontrada');
      }
      
      const request = requests[requestIndex];
      if (request.status !== RequestStatus.PENDING) {
        throw new Error('La solicitud ya fue procesada');
      }
      
      // Rechazar solicitud
      const rejectedRequest = rejectCashBoxRequest(request, rejectionReason, rejectedBy);
      requests[requestIndex] = rejectedRequest;
      
      // Guardar cambios
      localStorage.setItem('tv-cable:cashbox-requests', JSON.stringify(requests));
      
      // Actualizar estado
      set({
        cashBoxRequests: requests,
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
  canCollectorOpenCashBox: (collectorId, workDate) => {
    const requests = get().loadCashBoxRequests();
    const approvedRequest = requests.find(r => 
      r.collectorId === collectorId && 
      r.workDate === workDate && 
      r.status === RequestStatus.APPROVED
    );
    return !!approvedRequest;
  },
  
  // Obtener solicitud actual del cobrador
  getCollectorCurrentRequest: (collectorId, workDate) => {
    const requests = get().loadCashBoxRequests();
    return requests.find(r => 
      r.collectorId === collectorId && 
      r.workDate === workDate
    ) || null;
  },
  
  // Obtener todas las cajas abiertas (SUB-ADMIN)
  getAllOpenCashBoxes: () => {
    const today = new Date().toISOString().split('T')[0];
    const allCashBoxes = [];
    
    // Buscar todas las cajas en localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tv-cable:cashbox:caja-')) {
        const cashBox = JSON.parse(localStorage.getItem(key));
        if (cashBox && cashBox.status === 'abierta' && cashBox.date === today) {
          allCashBoxes.push(cashBox);
        }
      }
    }
    
    return allCashBoxes;
  },
  
  // Obtener historial de cajas (SUB-ADMIN)
  getAllCashBoxHistory: (startDate = null, endDate = null) => {
    const allCashBoxes = [];
    
    // Buscar todas las cajas en localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tv-cable:cashbox:caja-')) {
        const cashBox = JSON.parse(localStorage.getItem(key));
        if (cashBox) {
          // Filtrar por fechas si se especifican
          if (startDate && cashBox.date < startDate) continue;
          if (endDate && cashBox.date > endDate) continue;
          
          allCashBoxes.push(cashBox);
        }
      }
    }
    
    // Ordenar por fecha descendente
    return allCashBoxes.sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  
  // Cerrar caja específica (SUB-ADMIN)
  closeCashBoxById: async (cashBoxId, finalCounts, closedBy) => {
    try {
      const stored = localStorage.getItem(`tv-cable:cashbox:${cashBoxId}`);
      if (!stored) {
        throw new Error('Caja no encontrada');
      }
      
      const cashBox = JSON.parse(stored);
      if (cashBox.status !== 'abierta') {
        throw new Error('La caja no está abierta');
      }
      
      const updatedCashBox = {
        ...cashBox,
        status: 'cerrada',
        cierreEfectivo: finalCounts.efectivo || 0,
        cierreDigital: finalCounts.digital || 0,
        fechaCierre: new Date().toISOString(),
        cerradoPor: closedBy
      };
      
      localStorage.setItem(`tv-cable:cashbox:${cashBoxId}`, JSON.stringify(updatedCashBox));
      
      // Si es la caja actual, actualizarla
      const { currentCashBox } = get();
      if (currentCashBox && currentCashBox.id === cashBoxId) {
        set({ currentCashBox: updatedCashBox });
      }
      
      return updatedCashBox;
      
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Función para cargar datos de simulación
  loadSimulationData: async () => {
    try {
      // Obtener fecha de hoy para los datos de simulación
      const today = new Date().toISOString().split('T')[0];
      
      // Datos de cajas de simulación
      const cashboxData = [
        {
          "id": `caja-general-${today}-collector-001`,
          "collectorId": "collector-001",
          "serviceType": "general",
          "date": today,
          "status": "abierta",
          "cajaInicial": {
            "efectivo": 500.00,
            "digital": {
              "yape": 200.00,
              "plin": 100.00,
              "transferencia": 50.00,
              "otros": 0
            }
          },
          "ingresos": [
            {
              "id": "income-001",
              "paymentId": "payment-001",
              "clientName": "Juan Pérez",
              "clientId": "client-001",
              "amount": 80.00,
              "method": "efectivo",
              "serviceType": "internet",
              "time": "2024-01-16T09:00:00.000Z",
              "concept": "Pago mensualidad Internet"
            },
            {
              "id": "income-002",
              "paymentId": "payment-002",
              "clientName": "María García",
              "clientId": "client-002",
              "amount": 65.00,
              "method": "yape",
              "serviceType": "cable",
              "time": "2024-01-16T09:30:00.000Z",
              "concept": "Pago mensualidad Cable"
            },
            {
              "id": "income-003",
              "paymentId": "payment-003",
              "clientName": "Carlos López",
              "clientId": "client-003",
              "amount": 120.00,
              "method": "efectivo",
              "serviceType": "duo",
              "time": "2024-01-16T10:00:00.000Z",
              "concept": "Pago mensualidad DUO"
            },
            {
              "id": "income-004-internet",
              "paymentId": "payment-004-internet",
              "clientName": "Ana Rodríguez",
              "clientId": "client-004",
              "amount": 70.00,
              "method": "transferencia",
              "serviceType": "internet",
              "time": "2024-01-16T10:30:00.000Z",
              "concept": "Pago DUO - Porción Internet"
            },
            {
              "id": "income-004-cable",
              "paymentId": "payment-004-cable",
              "clientName": "Ana Rodríguez",
              "clientId": "client-004",
              "amount": 50.00,
              "method": "transferencia",
              "serviceType": "cable",
              "time": "2024-01-16T10:30:00.000Z",
              "concept": "Pago DUO - Porción Cable"
            }
          ],
          "gastos": [
            {
              "id": "expense-001",
              "concept": "Combustible",
              "amount": 20.00,
              "serviceType": "general",
              "time": "2024-01-16T08:30:00.000Z",
              "description": "Gasolina para moto - recorrido del día"
            },
            {
              "id": "expense-002",
              "concept": "Cable UTP",
              "amount": 45.00,
              "serviceType": "internet",
              "time": "2024-01-16T11:00:00.000Z",
              "description": "100 metros de cable Cat 5e para instalación"
            },
            {
              "id": "expense-003",
              "concept": "Conectores RJ45",
              "amount": 15.00,
              "serviceType": "internet",
              "time": "2024-01-16T11:15:00.000Z",
              "description": "Bolsa de 50 conectores RJ45"
            },
            {
              "id": "expense-004",
              "concept": "Cable Coaxial",
              "amount": 30.00,
              "serviceType": "cable",
              "time": "2024-01-16T14:00:00.000Z",
              "description": "50 metros cable RG6 para extensión"
            },
            {
              "id": "expense-005",
              "concept": "Splitter",
              "amount": 25.00,
              "serviceType": "cable",
              "time": "2024-01-16T14:30:00.000Z",
              "description": "Splitter 1x4 para dividir señal"
            },
            {
              "id": "expense-006",
              "concept": "Alimentación",
              "amount": 12.00,
              "serviceType": "general",
              "time": "2024-01-16T13:00:00.000Z",
              "description": "Almuerzo del día"
            }
          ],
          "fechaApertura": "2024-01-16T08:00:00.000Z"
        },
        {
          "id": `caja-general-${today}-collector-002`,
          "collectorId": "collector-002",
          "serviceType": "general",
          "date": today,
          "status": "abierta",
          "cajaInicial": {
            "efectivo": 300.00,
            "digital": {
              "yape": 150.00,
              "plin": 80.00,
              "transferencia": 20.00,
              "otros": 0
            }
          },
          "ingresos": [
            {
              "id": "income-201",
              "paymentId": "payment-201",
              "clientName": "Roberto Silva",
              "clientId": "client-201",
              "amount": 80.00,
              "method": "efectivo",
              "serviceType": "internet",
              "time": "2024-01-16T09:15:00.000Z",
              "concept": "Pago mensualidad Internet"
            },
            {
              "id": "income-202",
              "paymentId": "payment-202",
              "clientName": "Carmen Torres",
              "clientId": "client-202",
              "amount": 80.00,
              "method": "yape",
              "serviceType": "internet",
              "time": "2024-01-16T10:45:00.000Z",
              "concept": "Pago mensualidad Internet"
            },
            {
              "id": "income-203",
              "paymentId": "payment-203",
              "clientName": "Luis Mendoza",
              "clientId": "client-203",
              "amount": 80.00,
              "method": "plin",
              "serviceType": "internet",
              "time": "2024-01-16T11:30:00.000Z",
              "concept": "Pago mensualidad Internet"
            }
          ],
          "gastos": [
            {
              "id": "expense-201",
              "concept": "Pasajes",
              "amount": 15.00,
              "serviceType": "general",
              "time": "2024-01-16T08:00:00.000Z",
              "description": "Transporte público para llegar a zona"
            },
            {
              "id": "expense-202",
              "concept": "Router",
              "amount": 120.00,
              "serviceType": "internet",
              "time": "2024-01-16T12:00:00.000Z",
              "description": "Router TP-Link para nuevo cliente"
            },
            {
              "id": "expense-203",
              "concept": "Antena",
              "amount": 85.00,
              "serviceType": "internet",
              "time": "2024-01-16T14:00:00.000Z",
              "description": "Antena WiFi exterior para mejorar señal"
            }
          ],
          "fechaApertura": "2024-01-16T08:30:00.000Z"
        }
      ];
      
      // Datos de solicitudes de simulación
      const requestsData = [
        {
          "id": `request-${today}-collector-003`,
          "collectorId": "collector-003",
          "collectorName": "Pedro González",
          "requestDate": new Date().toISOString(),
          "workDate": today,
          "status": "pending",
          "requestedInitialCash": {
            "efectivo": 400.00,
            "digital": {
              "yape": 150.00,
              "plin": 80.00,
              "transferencia": 30.00,
              "otros": 0
            }
          },
          "notes": "Necesito efectivo adicional para zona comercial. Tengo instalaciones de Cable programadas.",
          "createdAt": "2024-01-16T07:30:00.000Z",
          "updatedAt": "2024-01-16T07:30:00.000Z"
        },
        {
          "id": `request-${today}-collector-004`,
          "collectorId": "collector-004", 
          "collectorName": "Luis Mendoza",
          "requestDate": new Date().toISOString(),
          "workDate": today,
          "status": "pending",
          "requestedInitialCash": {
            "efectivo": 300.00,
            "digital": {
              "yape": 100.00,
              "plin": 50.00,
              "transferencia": 20.00,
              "otros": 0
            }
          },
          "notes": "Ruta nueva en zona residencial. Principalmente servicios de Internet.",
          "createdAt": "2024-01-16T08:00:00.000Z",
          "updatedAt": "2024-01-16T08:00:00.000Z"
        },
        {
          "id": `request-yesterday-collector-001`,
          "collectorId": "collector-001",
          "collectorName": "Juan Pérez",
          "requestDate": new Date(Date.now() - 86400000).toISOString(), // ayer
          "workDate": today,
          "status": "approved",
          "requestedInitialCash": {
            "efectivo": 500.00,
            "digital": {
              "yape": 200.00,
              "plin": 100.00,
              "transferencia": 50.00,
              "otros": 0
            }
          },
          "notes": "Solicitud para mañana. Zona mixta con instalaciones DUO.",
          "approvedBy": "subadmin-001",
          "approvalDate": "2024-01-15T19:30:00.000Z",
          "createdAt": "2024-01-15T18:00:00.000Z",
          "updatedAt": "2024-01-15T19:30:00.000Z"
        },
        {
          "id": `request-yesterday-collector-002`,
          "collectorId": "collector-002",
          "collectorName": "María García",
          "requestDate": new Date(Date.now() - 86400000).toISOString(), // ayer
          "workDate": today, 
          "status": "approved",
          "requestedInitialCash": {
            "efectivo": 300.00,
            "digital": {
              "yape": 150.00,
              "plin": 80.00,
              "transferencia": 20.00,
              "otros": 0
            }
          },
          "notes": "Ruta de Internet principalmente. Clientes de zona norte.",
          "approvedBy": "subadmin-001",
          "approvalDate": "2024-01-15T18:15:00.000Z",
          "createdAt": "2024-01-15T17:45:00.000Z",
          "updatedAt": "2024-01-15T18:15:00.000Z"
        }
      ];
      
      // Guardar cada caja en localStorage
      cashboxData.forEach(cashBox => {
        const key = `tv-cable:cashbox:${cashBox.id}`;
        localStorage.setItem(key, JSON.stringify(cashBox));
      });
      
      // Guardar solicitudes en localStorage
      localStorage.setItem('tv-cable:cashbox-requests', JSON.stringify(requestsData));
      
      // ACTUALIZAR ESTADO DEL STORE
      set({
        cashBoxRequests: requestsData,
        pendingRequests: requestsData.filter(r => r.status === 'pending')
      });
      
      console.log('✅ Datos de simulación cargados:', cashboxData.length, 'cajas y', requestsData.length, 'solicitudes');
      console.log('📊 Solicitudes pendientes cargadas:', requestsData.filter(r => r.status === 'pending').length);
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
    const today = new Date().toISOString().split('T')[0];
    const cashBoxId = `caja-${serviceType}-${today}-${collectorId}`;
    
    try {
      const stored = localStorage.getItem(`tv-cable:cashbox:${cashBoxId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error al obtener caja por tipo:', error);
      return null;
    }
  },

  // Función para obtener todas las cajas activas del día por tipo
  getAllActiveCashBoxes: (date = null) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const activeCashBoxes = { internet: [], cable: [] };
    
    try {
      // Buscar cajas en localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tv-cable:cashbox:')) {
          const cashBoxData = JSON.parse(localStorage.getItem(key));
          if (cashBoxData.date === targetDate) {
            if (cashBoxData.serviceType === 'internet') {
              activeCashBoxes.internet.push(cashBoxData);
            } else if (cashBoxData.serviceType === 'cable') {
              activeCashBoxes.cable.push(cashBoxData);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al obtener cajas activas:', error);
    }
    
    return activeCashBoxes;
  }
}));