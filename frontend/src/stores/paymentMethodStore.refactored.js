/**
 * Payment Method Store - REFACTORIZADO para usar API REST
 */

import { create } from 'zustand';
import { apiClient } from '../services/api';

export const usePaymentMethodStore = create((set, get) => ({
  // Estado
  paymentMethods: [],
  currentMethod: null,
  isLoading: false,
  error: null,

  /**
   * Obtener todos los métodos de pago
   */
  fetchPaymentMethods: async () => {
    set({ isLoading: true, error: null });

    try {
      const paymentMethods = await apiClient.get('/paymentMethods');

      set({
        paymentMethods,
        isLoading: false,
        error: null
      });

      return { success: true, data: paymentMethods };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar métodos de pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener método de pago por ID
   */
  fetchMethodById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const method = await apiClient.get(`/paymentMethods/${id}`);

      set({
        currentMethod: method,
        isLoading: false,
        error: null
      });

      return { success: true, data: method };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar método de pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Crear nuevo método de pago
   */
  createPaymentMethod: async (methodData) => {
    set({ isLoading: true, error: null });

    try {
      const newMethod = await apiClient.post('/paymentMethods', methodData);

      set((state) => ({
        paymentMethods: [...state.paymentMethods, newMethod],
        isLoading: false,
        error: null
      }));

      return { success: true, data: newMethod };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al crear método de pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar método de pago
   */
  updatePaymentMethod: async (id, methodData) => {
    set({ isLoading: true, error: null });

    try {
      const updatedMethod = await apiClient.put(`/paymentMethods/${id}`, methodData);

      set((state) => ({
        paymentMethods: state.paymentMethods.map((method) =>
          method.id === id ? updatedMethod : method
        ),
        currentMethod:
          state.currentMethod?.id === id ? updatedMethod : state.currentMethod,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updatedMethod };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al actualizar método de pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Eliminar método de pago
   */
  deletePaymentMethod: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await apiClient.delete(`/paymentMethods/${id}`);

      set((state) => ({
        paymentMethods: state.paymentMethods.filter((method) => method.id !== id),
        currentMethod: state.currentMethod?.id === id ? null : state.currentMethod,
        isLoading: false,
        error: null
      }));

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al eliminar método de pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener métodos activos
   */
  getActiveMethods: () => {
    const { paymentMethods } = get();
    return paymentMethods.filter((method) => method.isActive);
  },

  /**
   * Activar/Desactivar método
   */
  toggleMethodActive: async (id, isActive) => {
    set({ isLoading: true, error: null });

    try {
      const updatedMethod = await apiClient.patch(`/paymentMethods/${id}`, { isActive });

      set((state) => ({
        paymentMethods: state.paymentMethods.map((method) =>
          method.id === id ? updatedMethod : method
        ),
        isLoading: false,
        error: null
      }));

      return { success: true, data: updatedMethod };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cambiar estado del método'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Limpiar método actual
   */
  clearCurrentMethod: () => {
    set({ currentMethod: null });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  }
}));

export default usePaymentMethodStore;
