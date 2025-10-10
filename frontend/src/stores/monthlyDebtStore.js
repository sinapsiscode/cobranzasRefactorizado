// Store para deudas mensuales - Migrado a JSON Server API
import { create } from 'zustand';
import {
  monthlyDebtSchema,
  getClientDebtSummary,
  calculateDebtStatus,
  formatPeriod,
  generateMonthlyDebts
} from '../schemas/monthlyDebt';

const API_URL = '/api';

export const useMonthlyDebtStore = create((set, get) => ({
  // Estado
  debts: [],  // Array de todas las deudas
  clientDebts: {}, // { clientId: [debts] }
  loading: false,
  error: null,

  // Cargar todas las deudas desde el API
  fetchDebts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/monthly-debts`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error fetching debts: ${response.statusText}`);
      }

      const debts = await response.json();
      set({ debts, loading: false });
      return debts;
    } catch (error) {
      console.error('Error fetching monthly debts:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Obtener deudas de un cliente
  getClientDebts: (clientId) => {
    const { debts } = get();
    return debts.filter(debt => debt.clientId === clientId);
  },

  // Obtener resumen de deudas de un cliente
  getClientSummary: (clientId) => {
    const clientDebts = get().getClientDebts(clientId);
    return getClientDebtSummary(clientDebts);
  },

  // Agregar deuda individual
  addDebt: async (debtData) => {
    set({ loading: true, error: null });
    try {
      const newDebt = {
        ...monthlyDebtSchema,
        ...debtData,
        id: debtData.id || monthlyDebtSchema.id(),
        period: formatPeriod(debtData.year, debtData.month),
        status: calculateDebtStatus(debtData),
        createdAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/monthly-debts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newDebt)
      });

      if (!response.ok) {
        throw new Error(`Error adding debt: ${response.statusText}`);
      }

      const savedDebt = await response.json();

      set(state => ({
        debts: [...state.debts, savedDebt],
        loading: false
      }));

      return savedDebt;
    } catch (error) {
      console.error('Error adding debt:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Actualizar deuda
  updateDebt: async (debtId, updates) => {
    set({ loading: true, error: null });
    try {
      const { debts } = get();
      const existingDebt = debts.find(debt => debt.id === debtId);

      if (!existingDebt) {
        throw new Error('Debt not found');
      }

      const updated = {
        ...existingDebt,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      updated.status = calculateDebtStatus(updated);

      const response = await fetch(`${API_URL}/monthly-debts/${debtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updated)
      });

      if (!response.ok) {
        throw new Error(`Error updating debt: ${response.statusText}`);
      }

      const savedDebt = await response.json();

      set(state => ({
        debts: state.debts.map(debt =>
          debt.id === debtId ? savedDebt : debt
        ),
        loading: false
      }));

      return savedDebt;
    } catch (error) {
      console.error('Error updating debt:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Registrar pago
  registerPayment: async (debtId, amount, paymentDate = new Date()) => {
    set({ loading: true, error: null });
    try {
      const { debts } = get();
      const existingDebt = debts.find(debt => debt.id === debtId);

      if (!existingDebt) {
        throw new Error('Debt not found');
      }

      const amountPaid = Math.min(existingDebt.amountPaid + amount, existingDebt.amountDue);
      const updated = {
        ...existingDebt,
        amountPaid,
        paymentDate: amountPaid >= existingDebt.amountDue ? paymentDate.toISOString() : existingDebt.paymentDate,
        updatedAt: new Date().toISOString()
      };
      updated.status = calculateDebtStatus(updated);

      const response = await fetch(`${API_URL}/monthly-debts/${debtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updated)
      });

      if (!response.ok) {
        throw new Error(`Error registering payment: ${response.statusText}`);
      }

      const savedDebt = await response.json();

      set(state => ({
        debts: state.debts.map(debt =>
          debt.id === debtId ? savedDebt : debt
        ),
        loading: false
      }));

      return savedDebt;
    } catch (error) {
      console.error('Error registering payment:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Importación masiva de deudas
  bulkAddDebts: async (debtsArray) => {
    set({ loading: true, error: null });
    try {
      const newDebts = debtsArray.map(debt => ({
        ...monthlyDebtSchema,
        ...debt,
        id: debt.id || monthlyDebtSchema.id(),
        period: debt.period || formatPeriod(debt.year, debt.month),
        status: calculateDebtStatus(debt),
        createdAt: debt.createdAt || new Date().toISOString()
      }));

      // Enviar todas las deudas en batch (POST múltiples)
      const promises = newDebts.map(debt =>
        fetch(`${API_URL}/monthly-debts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(debt)
        }).then(res => {
          if (!res.ok) throw new Error(`Error adding debt: ${res.statusText}`);
          return res.json();
        })
      );

      const savedDebts = await Promise.all(promises);

      set(state => ({
        debts: [...state.debts, ...savedDebts],
        loading: false
      }));

      return savedDebts;
    } catch (error) {
      console.error('Error bulk adding debts:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Generar deudas para un cliente en un rango de meses
  generateClientDebts: async (clientId, startYear, startMonth, endYear, endMonth, amount) => {
    set({ loading: true, error: null });
    try {
      const newDebts = generateMonthlyDebts(clientId, startYear, startMonth, endYear, endMonth, amount);

      // Enviar todas las deudas generadas al servidor
      const promises = newDebts.map(debt =>
        fetch(`${API_URL}/monthly-debts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(debt)
        }).then(res => {
          if (!res.ok) throw new Error(`Error adding debt: ${res.statusText}`);
          return res.json();
        })
      );

      const savedDebts = await Promise.all(promises);

      set(state => ({
        debts: [...state.debts, ...savedDebts],
        loading: false
      }));

      return savedDebts;
    } catch (error) {
      console.error('Error generating client debts:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Obtener matriz de deudas (para vista tipo Excel)
  getDebtMatrix: (clientIds, startPeriod, endPeriod) => {
    const { debts } = get();
    const matrix = {};

    // Inicializar matriz
    clientIds.forEach(clientId => {
      matrix[clientId] = {};
    });

    // Llenar matriz con deudas
    debts.forEach(debt => {
      if (clientIds.includes(debt.clientId) &&
          debt.period >= startPeriod &&
          debt.period <= endPeriod) {
        if (!matrix[debt.clientId]) {
          matrix[debt.clientId] = {};
        }
        matrix[debt.clientId][debt.period] = {
          amount: debt.amountDue,
          paid: debt.amountPaid,
          status: debt.status
        };
      }
    });

    return matrix;
  },

  // Estadísticas globales
  getGlobalStats: () => {
    const { debts } = get();

    const stats = {
      totalDebts: debts.length,
      totalAmount: 0,
      totalPaid: 0,
      pending: 0,
      paid: 0,
      overdue: 0,
      partial: 0
    };

    debts.forEach(debt => {
      stats.totalAmount += debt.amountDue;
      stats.totalPaid += debt.amountPaid;

      switch(debt.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'paid':
          stats.paid++;
          break;
        case 'overdue':
          stats.overdue++;
          break;
        case 'partial':
          stats.partial++;
          break;
      }
    });

    stats.totalOwed = stats.totalAmount - stats.totalPaid;
    stats.collectionRate = stats.totalAmount > 0
      ? ((stats.totalPaid / stats.totalAmount) * 100).toFixed(2)
      : 0;

    return stats;
  },

  // Limpiar deudas de un cliente
  clearClientDebts: async (clientId) => {
    set({ loading: true, error: null });
    try {
      const { debts } = get();
      const clientDebts = debts.filter(debt => debt.clientId === clientId);

      // Eliminar todas las deudas del cliente del servidor
      const promises = clientDebts.map(debt =>
        fetch(`${API_URL}/monthly-debts/${debt.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => {
          if (!res.ok) throw new Error(`Error deleting debt: ${res.statusText}`);
          return res.json();
        })
      );

      await Promise.all(promises);

      set(state => ({
        debts: state.debts.filter(debt => debt.clientId !== clientId),
        loading: false
      }));
    } catch (error) {
      console.error('Error clearing client debts:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Limpiar todo
  clearAllDebts: async () => {
    set({ loading: true, error: null });
    try {
      const { debts } = get();

      // Eliminar todas las deudas del servidor
      const promises = debts.map(debt =>
        fetch(`${API_URL}/monthly-debts/${debt.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => {
          if (!res.ok) throw new Error(`Error deleting debt: ${res.statusText}`);
          return res.json();
        })
      );

      await Promise.all(promises);

      set({ debts: [], clientDebts: {}, loading: false, error: null });
    } catch (error) {
      console.error('Error clearing all debts:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
