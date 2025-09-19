// Store para deudas mensuales
import { create } from 'zustand';
import { 
  monthlyDebtSchema, 
  getClientDebtSummary, 
  calculateDebtStatus,
  formatPeriod,
  generateMonthlyDebts 
} from '../services/mock/schemas/monthlyDebt';

export const useMonthlyDebtStore = create((set, get) => ({
  // Estado
  debts: [],  // Array de todas las deudas
  clientDebts: {}, // { clientId: [debts] }
  loading: false,
  error: null,
  
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
  addDebt: (debtData) => {
    const newDebt = {
      ...monthlyDebtSchema,
      ...debtData,
      id: debtData.id || monthlyDebtSchema.id(),
      period: formatPeriod(debtData.year, debtData.month),
      status: calculateDebtStatus(debtData),
      createdAt: new Date().toISOString()
    };
    
    set(state => ({
      debts: [...state.debts, newDebt]
    }));
    
    return newDebt;
  },
  
  // Actualizar deuda
  updateDebt: (debtId, updates) => {
    set(state => ({
      debts: state.debts.map(debt => {
        if (debt.id === debtId) {
          const updated = { ...debt, ...updates };
          updated.status = calculateDebtStatus(updated);
          updated.updatedAt = new Date().toISOString();
          return updated;
        }
        return debt;
      })
    }));
  },
  
  // Registrar pago
  registerPayment: (debtId, amount, paymentDate = new Date()) => {
    set(state => ({
      debts: state.debts.map(debt => {
        if (debt.id === debtId) {
          const amountPaid = Math.min(debt.amountPaid + amount, debt.amountDue);
          const updated = { 
            ...debt, 
            amountPaid,
            paymentDate: amountPaid >= debt.amountDue ? paymentDate.toISOString() : debt.paymentDate
          };
          updated.status = calculateDebtStatus(updated);
          updated.updatedAt = new Date().toISOString();
          return updated;
        }
        return debt;
      })
    }));
  },
  
  // Importación masiva de deudas
  bulkAddDebts: (debtsArray) => {
    const newDebts = debtsArray.map(debt => ({
      ...monthlyDebtSchema,
      ...debt,
      id: debt.id || monthlyDebtSchema.id(),
      period: debt.period || formatPeriod(debt.year, debt.month),
      status: calculateDebtStatus(debt),
      createdAt: debt.createdAt || new Date().toISOString()
    }));
    
    set(state => ({
      debts: [...state.debts, ...newDebts]
    }));
  },
  
  // Generar deudas para un cliente en un rango de meses
  generateClientDebts: (clientId, startYear, startMonth, endYear, endMonth, amount) => {
    const newDebts = generateMonthlyDebts(clientId, startYear, startMonth, endYear, endMonth, amount);
    
    set(state => ({
      debts: [...state.debts, ...newDebts]
    }));
    
    return newDebts;
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
  clearClientDebts: (clientId) => {
    set(state => ({
      debts: state.debts.filter(debt => debt.clientId !== clientId)
    }));
  },
  
  // Limpiar todo
  clearAllDebts: () => {
    set({ debts: [], clientDebts: {}, loading: false, error: null });
  },
  
  // Persistencia local
  saveToLocalStorage: () => {
    const { debts } = get();
    localStorage.setItem('tv-cable:monthly-debts', JSON.stringify(debts));
  },
  
  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem('tv-cable:monthly-debts');
      if (stored) {
        const debts = JSON.parse(stored);
        set({ debts });
      }
    } catch (error) {
      console.error('Error loading monthly debts from localStorage:', error);
    }
  }
}))