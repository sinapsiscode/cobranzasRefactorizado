// Store de pagos - pagos, vouchers, estadísticas
import { create } from 'zustand';
import { mockServer } from '../services/mock/server.js';

export const usePaymentStore = create((set, get) => ({
  // Estado
  payments: [],
  currentPayment: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  },
  filters: {
    clientId: '',
    status: '',
    month: '',
    year: '',
    collectorId: '',
    sortBy: 'dueDate',
    sortOrder: 'desc'
  },
  metrics: {
    totalCollected: 0,
    pendingPayments: 0,
    overdueRate: 0,
    currentClients: 0,
    totalPayments: 0
  },
  chartData: {
    collection: [],
    paymentStatus: []
  },
  lastSync: null,

  // Acciones CRUD
  fetchPayments: async (customFilters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const { filters, pagination } = get();
      const params = {
        ...filters,
        ...customFilters,
        page: pagination.page,
        limit: pagination.limit
      };
      
      const response = await mockServer.getPayments(params);
      const { items, pagination: paginationData } = response.data;

      // LOG PARA VERIFICAR LOS PAGOS
      console.log('=== PAGOS CARGADOS EN EL STORE ===');
      console.log('Total de pagos:', items.length);
      const client1Payments = items.filter(p => p.clientId === 'client-1');
      console.log('Pagos de client-1:', client1Payments.length);
      const overdueClient1 = client1Payments.filter(p => p.status === 'overdue');
      console.log('Pagos OVERDUE de client-1:', overdueClient1.length);
      console.log('Detalle pagos overdue:', overdueClient1);

      set({
        payments: items,
        pagination: paginationData,
        loading: false,
        error: null,
        lastSync: new Date().toISOString()
      });
      
      return items;
    } catch (error) {
      console.warn('Error cargando pagos:', error);
      set({
        loading: false,
        error: error.error || 'Error al cargar pagos',
        payments: []
      });
      
      // No lanzar el error para no interrumpir otros componentes
      return [];
    }
  },

  createPayment: async (paymentData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await mockServer.createPayment(paymentData);
      const newPayment = response.data;
      
      // Actualizar lista local
      set(state => ({
        payments: [newPayment, ...state.payments],
        loading: false,
        error: null
      }));
      
      // Refrescar datos y métricas
      await Promise.all([
        get().fetchPayments(),
        get().fetchDashboardMetrics()
      ]);
      
      return newPayment;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al crear pago'
      });
      
      throw error;
    }
  },

  updatePayment: async (id, updates) => {
    set({ loading: true, error: null });
    
    try {
      const response = await mockServer.updatePayment(id, updates);
      const updatedPayment = response.data;
      
      // Actualizar lista local
      set(state => ({
        payments: state.payments.map(payment =>
          payment.id === id ? updatedPayment : payment
        ),
        currentPayment: state.currentPayment?.id === id ? updatedPayment : state.currentPayment,
        loading: false,
        error: null
      }));
      
      // Refrescar métricas
      await get().fetchDashboardMetrics();
      
      return updatedPayment;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al actualizar pago'
      });
      
      throw error;
    }
  },

  // Funciones específicas de validación
  collectPayment: async (id, collectorId, paymentMethod, voucher = null) => {
    const updates = {
      status: 'collected',
      collectorId,
      paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      voucher: voucher ? {
        name: voucher.name,
        type: voucher.type,
        size: voucher.size,
        data: voucher, // Store the file object for later processing
        uploadedAt: new Date().toISOString()
      } : null
    };
    
    const updatedPayment = await get().updatePayment(id, updates);
    
    // Generar nota de pago automáticamente cuando se cobra
    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { usePaymentReceiptStore } = await import('./paymentReceiptStore.js');
      const { useClientStore } = await import('./clientStore.js');
      const { useAuthStore } = await import('./authStore.js');
      
      const receiptStore = usePaymentReceiptStore.getState();
      const clientStore = useClientStore.getState();
      const authStore = useAuthStore.getState();
      
      // Obtener datos necesarios
      const client = clientStore.clients.find(c => c.id === updatedPayment.clientId);
      const collector = authStore.user; // El usuario actual es el cobrador
      
      if (client && collector) {
        await receiptStore.generateReceipt(
          updatedPayment,
          client,
          collector,
          null // serviceData se obtiene del cliente
        );
      }
    } catch (error) {
      console.warn('Error generando nota de pago:', error);
      // No interrumpir el flujo principal si falla la generación del recibo
    }
    
    return updatedPayment;
  },

  validatePayment: async (id, validatedBy, validationComments = '') => {
    set({ loading: true, error: null });
    
    try {
      const updates = {
        status: 'validated',
        validatedBy,
        validatedDate: new Date().toISOString(),
        validationComments
      };
      
      const updatedPayment = await get().updatePayment(id, updates);
      
      // Actualizar la caja unificada con el monto del pago
      try {
        const { useCashBoxStore } = await import('./cashBoxStore.js');
        const cashBoxStore = useCashBoxStore.getState();
        
        if (cashBoxStore.currentCashBox) {
          await cashBoxStore.addTransaction({
            type: 'income',
            amount: updatedPayment.amount,
            description: `Pago validado - ${updatedPayment.clientId}`,
            paymentId: id
          });
        }
      } catch (error) {
        console.warn('Error actualizando caja:', error);
      }
      
      return updatedPayment;
    } catch (error) {
      set({ error: 'Error al validar pago' });
      throw error;
    }
  },

  finalizePayment: async (id) => {
    const updates = { status: 'paid' };
    return await get().updatePayment(id, updates);
  },

  // Filtros específicos para validación
  getCollectedPayments: () => {
    const { payments } = get();
    return payments.filter(p => p.status === 'collected');
  },

  getValidatedPayments: () => {
    const { payments } = get();
    return payments.filter(p => p.status === 'validated');
  },

  getPendingValidationPayments: () => {
    const { payments } = get();
    return payments.filter(p => p.status === 'collected'); // Collected payments need validation
  },

  getPendingValidationCount: () => {
    const { payments } = get();
    return payments.filter(p => p.status === 'collected').length;
  },

  // Métricas y estadísticas
  fetchDashboardMetrics: async (params = {}) => {
    try {
      const response = await mockServer.getDashboardMetrics(params);
      const metrics = response.data;
      
      set({ metrics });
      
      return metrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Retornar métricas vacías en lugar de lanzar error
      const emptyMetrics = {
        totalCollected: 0,
        pendingPayments: 0,
        overdueRate: 0,
        currentClients: 0,
        monthlyGrowth: 0,
        successfulCollections: 0
      };
      set({ metrics: emptyMetrics });
      return emptyMetrics;
    }
  },

  fetchCollectionChart: async (months = 6) => {
    try {
      const response = await mockServer.getCollectionChart(months);
      const chartData = response.data;
      
      set(state => ({
        chartData: { ...state.chartData, collection: chartData }
      }));
      
      return chartData;
    } catch (error) {
      console.error('Error fetching collection chart:', error);
      // Retornar datos vacíos en lugar de lanzar error
      const emptyData = [];
      set(state => ({ 
        chartData: { ...state.chartData, collection: emptyData }
      }));
      return emptyData;
    }
  },

  fetchPaymentStatusChart: async () => {
    try {
      const response = await mockServer.getPaymentStatusChart();
      const chartData = response.data;
      
      set(state => ({
        chartData: { ...state.chartData, paymentStatus: chartData }
      }));
      
      return chartData;
    } catch (error) {
      console.error('Error fetching payment status chart:', error);
      // Retornar datos vacíos en lugar de lanzar error
      const emptyData = [];
      set(state => ({ 
        chartData: { ...state.chartData, paymentStatus: emptyData }
      }));
      return emptyData;
    }
  },

  // Gestión de filtros
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }
    }));
    
    get().fetchPayments();
  },

  clearFilters: () => {
    set({
      filters: {
        clientId: '',
        status: '',
        month: '',
        year: '',
        collectorId: '',
        sortBy: 'dueDate',
        sortOrder: 'desc'
      },
      pagination: { ...get().pagination, page: 1 }
    });
    
    get().fetchPayments();
  },

  // Paginación
  setPage: (page) => {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
    
    get().fetchPayments();
  },

  setPageSize: (limit) => {
    set(state => ({
      pagination: { ...state.pagination, limit, page: 1 }
    }));
    
    get().fetchPayments();
  },

  // Utilitarios
  clearError: () => {
    set({ error: null });
  },

  clearCurrentPayment: () => {
    set({ currentPayment: null });
  },

  // Getters/Selectors
  getPaymentById: (id) => {
    const { payments } = get();
    return payments.find(payment => payment.id === id) || null;
  },

  getPaymentsByClient: (clientId) => {
    const { payments } = get();
    return payments.filter(payment => payment.clientId === clientId);
  },

  getPaymentsByStatus: (status) => {
    const { payments } = get();
    return payments.filter(payment => payment.status === status);
  },

  getPendingPayments: () => {
    const { payments } = get();
    return payments.filter(payment => ['pending', 'overdue'].includes(payment.status));
  },

  getOverduePayments: () => {
    const { payments } = get();
    return payments.filter(payment => payment.status === 'overdue');
  },

  getTotalCollected: (startDate = null, endDate = null) => {
    const { payments } = get();
    
    return payments
      .filter(payment => {
        if (payment.status !== 'paid') return false;
        if (startDate && payment.paymentDate < startDate) return false;
        if (endDate && payment.paymentDate > endDate) return false;
        return true;
      })
      .reduce((total, payment) => total + payment.amount, 0);
  },

  getCollectionByPeriod: (period = 'month') => {
    const { payments } = get();
    const paidPayments = payments.filter(p => p.status === 'paid');
    
    const grouped = paidPayments.reduce((acc, payment) => {
      const key = period === 'month' ? payment.month : payment.year.toString();
      acc[key] = (acc[key] || 0) + payment.amount;
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([key, value]) => ({
      period: key,
      amount: value
    }));
  },

  isLoading: () => {
    const { loading } = get();
    return loading;
  },

  hasError: () => {
    const { error } = get();
    return !!error;
  },

  needsRefresh: () => {
    const { lastSync } = get();
    if (!lastSync) return true;
    
    const timeDiff = Date.now() - new Date(lastSync).getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutos
  }
}));