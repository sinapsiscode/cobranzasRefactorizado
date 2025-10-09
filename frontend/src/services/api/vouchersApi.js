/**
 * Vouchers API Service
 *
 * Maneja todas las operaciones relacionadas con comprobantes de pago
 */

import { apiClient } from './client';

export const vouchersApi = {
  /**
   * Obtener todos los vouchers
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/vouchers?${queryString}` : '/vouchers';
    return apiClient.get(endpoint);
  },

  /**
   * Obtener voucher por ID
   */
  getById: async (id) => {
    return apiClient.get(`/vouchers/${id}`);
  },

  /**
   * Crear nuevo voucher
   */
  create: async (voucherData) => {
    return apiClient.post('/vouchers', voucherData);
  },

  /**
   * Actualizar voucher completo
   */
  update: async (id, voucherData) => {
    return apiClient.put(`/vouchers/${id}`, voucherData);
  },

  /**
   * Actualizar voucher parcialmente
   */
  patch: async (id, updates) => {
    return apiClient.patch(`/vouchers/${id}`, updates);
  },

  /**
   * Eliminar voucher
   */
  delete: async (id) => {
    return apiClient.delete(`/vouchers/${id}`);
  },

  /**
   * Obtener vouchers pendientes
   */
  getPending: async () => {
    return apiClient.get('/vouchers?status=pending');
  },

  /**
   * Obtener vouchers por cliente
   */
  getByClient: async (clientId) => {
    return apiClient.get(`/vouchers?clientId=${clientId}`);
  },

  /**
   * Obtener vouchers por pago
   */
  getByPayment: async (paymentId) => {
    return apiClient.get(`/vouchers?paymentId=${paymentId}`);
  },

  /**
   * Validar voucher (aprobar/rechazar)
   */
  validate: async (id, validationData) => {
    return apiClient.patch(`/vouchers/${id}`, {
      ...validationData,
      validatedAt: new Date().toISOString()
    });
  }
};

export default vouchersApi;
