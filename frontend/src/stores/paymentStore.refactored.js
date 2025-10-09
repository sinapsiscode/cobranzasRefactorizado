/**
 * Payment Store - REFACTORIZADO para usar API REST
 */

import { create } from 'zustand';
import { paymentsApi } from '../services/api';

export const usePaymentStore = create((set, get) => ({
  // Estado
  payments: [],
  currentPayment: null,
  monthlyDebts: [],
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    month: null,
    year: null,
    clientId: null
  },

  // ============================================
  // ACCIONES - Refactorizadas para usar API
  // ============================================

  /**
   * Obtener todos los pagos
   */
  fetchPayments: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const payments = await paymentsApi.getAll(params);

      set({
        payments,
        isLoading: false,
        error: null
      });

      return { success: true, data: payments };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar pagos'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener pago por ID
   */
  fetchPaymentById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const payment = await paymentsApi.getById(id);

      set({
        currentPayment: payment,
        isLoading: false,
        error: null
      });

      return { success: true, data: payment };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Crear nuevo pago
   */
  createPayment: async (paymentData) => {
    set({ isLoading: true, error: null });

    try {
      const newPayment = await paymentsApi.create(paymentData);

      set((state) => ({
        payments: [...state.payments, newPayment],
        isLoading: false,
        error: null
      }));

      return { success: true, data: newPayment };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al crear pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar pago
   */
  updatePayment: async (id, paymentData) => {
    set({ isLoading: true, error: null });

    try {
      const updatedPayment = await paymentsApi.update(id, paymentData);

      set((state) => ({
        payments: state.payments.map((payment) =>
          payment.id === id ? updatedPayment : payment
        ),
        currentPayment:
          state.currentPayment?.id === id ? updatedPayment : state.currentPayment,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updatedPayment };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al actualizar pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar estado de pago
   */
  updatePaymentStatus: async (id, statusData) => {
    set({ isLoading: true, error: null });

    try {
      const updatedPayment = await paymentsApi.updateStatus(id, statusData);

      set((state) => ({
        payments: state.payments.map((payment) =>
          payment.id === id ? updatedPayment : payment
        ),
        isLoading: false,
        error: null
      }));

      return { success: true, data: updatedPayment };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al actualizar estado del pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Marcar pago como pagado
   */
  markAsPaid: async (id, collectorId, paymentMethod = 'cash') => {
    return get().updatePaymentStatus(id, {
      status: 'paid',
      paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      collectorId
    });
  },

  /**
   * Marcar pago como cobrado (pendiente de validación)
   */
  markAsCollected: async (id, collectorId, paymentMethod) => {
    return get().updatePaymentStatus(id, {
      status: 'collected',
      paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      collectorId
    });
  },

  /**
   * Eliminar pago
   */
  deletePayment: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await paymentsApi.delete(id);

      set((state) => ({
        payments: state.payments.filter((payment) => payment.id !== id),
        currentPayment: state.currentPayment?.id === id ? null : state.currentPayment,
        isLoading: false,
        error: null
      }));

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al eliminar pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener deudas mensuales
   */
  fetchMonthlyDebts: async () => {
    set({ isLoading: true, error: null });

    try {
      const monthlyDebts = await paymentsApi.getMonthlyDebts();

      set({
        monthlyDebts,
        isLoading: false,
        error: null
      });

      return { success: true, data: monthlyDebts };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar deudas mensuales'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener pagos vencidos
   */
  fetchOverduePayments: async () => {
    set({ isLoading: true, error: null });

    try {
      const payments = await paymentsApi.getAll({ status: 'overdue' });

      set({
        payments,
        isLoading: false,
        error: null
      });

      return { success: true, data: payments };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar pagos vencidos'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener pagos pendientes
   */
  fetchPendingPayments: async () => {
    set({ isLoading: true, error: null });

    try {
      const payments = await paymentsApi.getAll({ status: 'pending' });

      set({
        payments,
        isLoading: false,
        error: null
      });

      return { success: true, data: payments };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar pagos pendientes'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar filtros
   */
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  /**
   * Limpiar pago actual
   */
  clearCurrentPayment: () => {
    set({ currentPayment: null });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Obtener pagos filtrados (local)
   */
  getFilteredPayments: () => {
    const { payments, filters } = get();

    return payments.filter((payment) => {
      // Filtro por estado
      if (filters.status !== 'all' && payment.status !== filters.status) {
        return false;
      }

      // Filtro por mes
      if (filters.month && payment.month !== filters.month) {
        return false;
      }

      // Filtro por año
      if (filters.year && payment.year !== filters.year) {
        return false;
      }

      // Filtro por cliente
      if (filters.clientId && payment.clientId !== filters.clientId) {
        return false;
      }

      return true;
    });
  },

  /**
   * Calcular totales
   */
  calculateTotals: () => {
    const { payments } = get();

    const totals = {
      total: payments.length,
      paid: payments.filter((p) => p.status === 'paid').length,
      pending: payments.filter((p) => p.status === 'pending').length,
      overdue: payments.filter((p) => p.status === 'overdue').length,
      collected: payments.filter((p) => p.status === 'collected').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments
        .filter((p) => p.status === 'pending' || p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0)
    };

    return totals;
  },

  // ============================================
  // MÉTODOS AVANZADOS
  // ============================================

  /**
   * Agrupar pagos por mes
   */
  groupPaymentsByMonth: () => {
    const { payments } = get();
    const grouped = {};

    payments.forEach((payment) => {
      const monthKey = payment.month;
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthKey,
          payments: [],
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0
        };
      }

      grouped[monthKey].payments.push(payment);
      grouped[monthKey].total += payment.amount;

      if (payment.status === 'paid') {
        grouped[monthKey].paid += payment.amount;
      } else if (payment.status === 'pending') {
        grouped[monthKey].pending += payment.amount;
      } else if (payment.status === 'overdue') {
        grouped[monthKey].overdue += payment.amount;
      }
    });

    return Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
  },

  /**
   * Agrupar pagos por cliente
   */
  groupPaymentsByClient: () => {
    const { payments } = get();
    const grouped = {};

    payments.forEach((payment) => {
      const clientId = payment.clientId;
      if (!grouped[clientId]) {
        grouped[clientId] = {
          clientId,
          clientName: payment.clientName || 'Cliente',
          payments: [],
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0
        };
      }

      grouped[clientId].payments.push(payment);
      grouped[clientId].total += payment.amount;

      if (payment.status === 'paid') {
        grouped[clientId].paid += payment.amount;
      } else if (payment.status === 'pending') {
        grouped[clientId].pending += payment.amount;
      } else if (payment.status === 'overdue') {
        grouped[clientId].overdue += payment.amount;
      }
    });

    return Object.values(grouped);
  },

  /**
   * Obtener pagos por rango de fechas
   */
  getPaymentsByDateRange: (startDate, endDate) => {
    const { payments } = get();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return payments.filter((payment) => {
      const dueDate = new Date(payment.dueDate);
      return dueDate >= start && dueDate <= end;
    });
  },

  /**
   * Obtener pagos del mes actual
   */
  getCurrentMonthPayments: () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const { payments } = get();
    return payments.filter((p) => p.month === currentMonth);
  },

  /**
   * Calcular tasa de cobranza (porcentaje de pagos completados)
   */
  calculateCollectionRate: () => {
    const { payments } = get();
    if (payments.length === 0) return 0;

    const paidCount = payments.filter((p) => p.status === 'paid').length;
    return ((paidCount / payments.length) * 100).toFixed(2);
  },

  /**
   * Obtener estadísticas por método de pago
   */
  getPaymentMethodStats: () => {
    const { payments } = get();
    const paidPayments = payments.filter((p) => p.status === 'paid');

    const stats = {};
    paidPayments.forEach((payment) => {
      const method = payment.paymentMethod || 'Sin especificar';
      if (!stats[method]) {
        stats[method] = {
          method,
          count: 0,
          total: 0
        };
      }
      stats[method].count++;
      stats[method].total += payment.amount;
    });

    return Object.values(stats);
  },

  /**
   * Obtener pagos próximos a vencer (próximos 7 días)
   */
  getUpcomingPayments: () => {
    const { payments } = get();
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return payments.filter((payment) => {
      if (payment.status !== 'pending') return false;
      const dueDate = new Date(payment.dueDate);
      return dueDate >= today && dueDate <= nextWeek;
    });
  },

  /**
   * Obtener pagos más vencidos (ordenados por antigüedad)
   */
  getMostOverduePayments: (limit = 10) => {
    const { payments } = get();
    const overduePayments = payments.filter((p) => p.status === 'overdue');

    return overduePayments
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, limit);
  },

  /**
   * Obtener deuda total por cliente
   */
  getClientDebt: (clientId) => {
    const { payments } = get();
    return payments
      .filter((p) => p.clientId === clientId && (p.status === 'pending' || p.status === 'overdue'))
      .reduce((sum, p) => sum + p.amount, 0);
  },

  /**
   * Verificar si cliente tiene pagos pendientes
   */
  clientHasPendingPayments: (clientId) => {
    const { payments } = get();
    return payments.some(
      (p) => p.clientId === clientId && (p.status === 'pending' || p.status === 'overdue')
    );
  },

  /**
   * Obtener historial de pagos del cliente ordenado
   */
  getClientPaymentHistory: (clientId) => {
    const { payments } = get();
    return payments
      .filter((p) => p.clientId === clientId)
      .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
  }
}));

export default usePaymentStore;
