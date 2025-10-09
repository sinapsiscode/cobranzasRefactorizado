/**
 * Payment Methods API Service
 *
 * Maneja todas las operaciones relacionadas con métodos de pago
 */

import { apiClient } from './client';

export const paymentMethodsApi = {
  /**
   * Obtener todos los métodos de pago
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/paymentMethods?${queryString}` : '/paymentMethods';
    return apiClient.get(endpoint);
  },

  /**
   * Obtener método de pago por ID
   */
  getById: async (id) => {
    return apiClient.get(`/paymentMethods/${id}`);
  },

  /**
   * Crear nuevo método de pago
   */
  create: async (methodData) => {
    return apiClient.post('/paymentMethods', methodData);
  },

  /**
   * Actualizar método de pago completo
   */
  update: async (id, methodData) => {
    return apiClient.put(`/paymentMethods/${id}`, methodData);
  },

  /**
   * Actualizar método de pago parcialmente
   */
  patch: async (id, updates) => {
    return apiClient.patch(`/paymentMethods/${id}`, updates);
  },

  /**
   * Eliminar método de pago
   */
  delete: async (id) => {
    return apiClient.delete(`/paymentMethods/${id}`);
  },

  /**
   * Obtener solo métodos activos
   */
  getActive: async () => {
    return apiClient.get('/paymentMethods?isActive=true');
  },

  /**
   * Activar/Desactivar método de pago
   */
  toggleActive: async (id, isActive) => {
    return apiClient.patch(`/paymentMethods/${id}`, { isActive });
  },

  /**
   * Obtener métodos por tipo (cash, digital, bank)
   */
  getByType: async (type) => {
    return apiClient.get(`/paymentMethods?type=${type}`);
  }
};

export default paymentMethodsApi;
