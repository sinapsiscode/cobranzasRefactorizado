/**
 * Monthly Debt Store - REFACTORIZADO para usar API REST
 */

import { create } from 'zustand';
import { paymentsApi, clientsApi } from '../services/api';

export const useMonthlyDebtStore = create((set, get) => ({
  // Estado
  debts: [],
  isLoading: false,
  error: null,
  filters: {
    month: null,
    year: null,
    status: 'all'
  },

  /**
   * Obtener todas las deudas mensuales
   */
  fetchDebts: async () => {
    set({ isLoading: true, error: null });

    try {
      const debts = await paymentsApi.getMonthlyDebts();

      set({
        debts,
        isLoading: false,
        error: null
      });

      return { success: true, data: debts };
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
   * Obtener deudas por cliente
   */
  fetchDebtsByClient: async (clientId) => {
    set({ isLoading: true, error: null });

    try {
      // Obtener pagos del cliente
      const payments = await clientsApi.getPayments(clientId);

      // Filtrar solo los vencidos/pendientes
      const debts = payments
        .filter((p) => p.status === 'overdue' || p.status === 'pending')
        .map((payment) => {
          const dueDate = new Date(payment.dueDate);
          const today = new Date();
          const daysOverdue = Math.floor(
            (today - dueDate) / (1000 * 60 * 60 * 24)
          );

          return {
            id: `debt-${payment.id}`,
            clientId: payment.clientId,
            paymentId: payment.id,
            month: payment.month,
            year: payment.year,
            amount: payment.amount,
            dueDate: payment.dueDate,
            status: payment.status,
            daysOverdue: daysOverdue > 0 ? daysOverdue : 0
          };
        });

      set({
        debts,
        isLoading: false,
        error: null
      });

      return { success: true, data: debts };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar deudas del cliente'
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
   * Limpiar filtros
   */
  clearFilters: () => {
    set({
      filters: {
        month: null,
        year: null,
        status: 'all'
      }
    });
  },

  /**
   * Obtener deudas filtradas
   */
  getFilteredDebts: () => {
    const { debts, filters } = get();

    return debts.filter((debt) => {
      // Filtro por mes
      if (filters.month && debt.month !== filters.month) {
        return false;
      }

      // Filtro por año
      if (filters.year && debt.year !== filters.year) {
        return false;
      }

      // Filtro por estado
      if (filters.status !== 'all' && debt.status !== filters.status) {
        return false;
      }

      return true;
    });
  },

  /**
   * Calcular totales de deudas
   */
  calculateTotals: () => {
    const { debts } = get();

    return {
      total: debts.length,
      totalAmount: debts.reduce((sum, debt) => sum + debt.amount, 0),
      overdue: debts.filter((d) => d.status === 'overdue').length,
      pending: debts.filter((d) => d.status === 'pending').length
    };
  },

  /**
   * Obtener deudas agrupadas por mes
   */
  getDebtsByMonth: () => {
    const { debts } = get();
    const grouped = {};

    debts.forEach((debt) => {
      const key = debt.month;
      if (!grouped[key]) {
        grouped[key] = {
          month: key,
          debts: [],
          total: 0,
          count: 0
        };
      }

      grouped[key].debts.push(debt);
      grouped[key].total += debt.amount;
      grouped[key].count += 1;
    });

    return Object.values(grouped);
  },

  /**
   * Obtener deudas agrupadas por cliente
   */
  getDebtsByClient: () => {
    const { debts } = get();
    const grouped = {};

    debts.forEach((debt) => {
      const key = debt.clientId;
      if (!grouped[key]) {
        grouped[key] = {
          clientId: key,
          clientName: debt.clientName,
          debts: [],
          total: 0,
          count: 0
        };
      }

      grouped[key].debts.push(debt);
      grouped[key].total += debt.amount;
      grouped[key].count += 1;
    });

    return Object.values(grouped);
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  }
}));

export default useMonthlyDebtStore;
