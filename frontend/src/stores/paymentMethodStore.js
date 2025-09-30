// Store para gestionar configuración de métodos de pago
import { create } from 'zustand';
import { mockServer } from '../services/mock/server.js';

export const usePaymentMethodStore = create((set, get) => ({
  // Estado
  paymentMethods: {
    cash: {
      enabled: false,
      paymentPoints: [],
      instructions: 'Acércate a uno de nuestros puntos de pago durante los horarios indicados'
    },
    bank_transfer: {
      enabled: false,
      accounts: [],
      instructions: 'Realiza la transferencia bancaria y sube el voucher de confirmación'
    },
    yape: {
      enabled: false,
      phoneNumber: '',
      qrCode: null,
      holderName: '',
      instructions: 'Realiza la transferencia y sube el voucher de confirmación'
    },
    plin: {
      enabled: false,
      phoneNumber: '',
      qrCode: null,
      holderName: '',
      instructions: 'Realiza la transferencia y sube el voucher de confirmación'
    }
  },
  loading: false,
  error: null,
  lastSync: null,

  // Acciones CRUD
  fetchPaymentMethods: async () => {
    set({ loading: true, error: null });

    try {
      const response = await mockServer.getPaymentMethods();
      const paymentMethods = response.data;

      set({
        paymentMethods,
        loading: false,
        error: null,
        lastSync: new Date().toISOString()
      });

      return paymentMethods;
    } catch (error) {
      console.warn('Error cargando métodos de pago:', error);
      set({
        loading: false,
        error: error.error || 'Error al cargar métodos de pago'
      });

      return get().paymentMethods;
    }
  },

  updatePaymentMethod: async (methodType, methodData) => {
    set({ loading: true, error: null });

    try {
      const response = await mockServer.updatePaymentMethod(methodType, methodData);
      const updatedMethod = response.data;

      set(state => ({
        paymentMethods: {
          ...state.paymentMethods,
          [methodType]: updatedMethod
        },
        loading: false,
        error: null
      }));

      return updatedMethod;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al actualizar método de pago'
      });

      throw error;
    }
  },

  uploadQRCode: async (methodType, file) => {
    set({ loading: true, error: null });

    try {
      const response = await mockServer.uploadQRCode(methodType, file);
      const qrCodeUrl = response.data.url;

      // Actualizar el QR en el método correspondiente
      set(state => ({
        paymentMethods: {
          ...state.paymentMethods,
          [methodType]: {
            ...state.paymentMethods[methodType],
            qrCode: qrCodeUrl
          }
        },
        loading: false,
        error: null
      }));

      return qrCodeUrl;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al subir código QR'
      });

      throw error;
    }
  },

  addBankAccount: async (accountData) => {
    const { paymentMethods } = get();
    const currentAccounts = paymentMethods.bankTransfer.accounts || [];

    const newAccount = {
      id: Date.now().toString(),
      ...accountData,
      createdAt: new Date().toISOString()
    };

    const updatedAccounts = [...currentAccounts, newAccount];

    try {
      await get().updatePaymentMethod('bankTransfer', {
        ...paymentMethods.bankTransfer,
        accounts: updatedAccounts
      });

      return newAccount;
    } catch (error) {
      throw error;
    }
  },

  removeBankAccount: async (accountId) => {
    const { paymentMethods } = get();
    const currentAccounts = paymentMethods.bankTransfer.accounts || [];

    const updatedAccounts = currentAccounts.filter(acc => acc.id !== accountId);

    try {
      await get().updatePaymentMethod('bankTransfer', {
        ...paymentMethods.bankTransfer,
        accounts: updatedAccounts
      });

      return true;
    } catch (error) {
      throw error;
    }
  },

  addPaymentPoint: async (pointData) => {
    const { paymentMethods } = get();
    const currentPoints = paymentMethods.cash.paymentPoints || [];

    const newPoint = {
      id: Date.now().toString(),
      ...pointData,
      createdAt: new Date().toISOString()
    };

    const updatedPoints = [...currentPoints, newPoint];

    try {
      await get().updatePaymentMethod('cash', {
        ...paymentMethods.cash,
        paymentPoints: updatedPoints
      });

      return newPoint;
    } catch (error) {
      throw error;
    }
  },

  removePaymentPoint: async (pointId) => {
    const { paymentMethods } = get();
    const currentPoints = paymentMethods.cash.paymentPoints || [];

    const updatedPoints = currentPoints.filter(point => point.id !== pointId);

    try {
      await get().updatePaymentMethod('cash', {
        ...paymentMethods.cash,
        paymentPoints: updatedPoints
      });

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Getters/Selectors
  getEnabledMethods: () => {
    const { paymentMethods } = get();
    return Object.entries(paymentMethods)
      .filter(([_, method]) => method.enabled)
      .reduce((acc, [key, method]) => {
        acc[key] = method;
        return acc;
      }, {});
  },

  getMethodByType: (methodType) => {
    const { paymentMethods } = get();
    return paymentMethods[methodType] || null;
  },

  isMethodEnabled: (methodType) => {
    const { paymentMethods } = get();
    return paymentMethods[methodType]?.enabled || false;
  },

  // Utilitarios
  clearError: () => {
    set({ error: null });
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
    return timeDiff > 10 * 60 * 1000; // 10 minutos
  }
}));