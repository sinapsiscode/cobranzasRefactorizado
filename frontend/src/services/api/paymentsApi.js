import { apiClient } from './client';

/**
 * API de pagos
 */
export const paymentsApi = {
  /**
   * Obtener todos los pagos
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments?${queryString}` : '/payments';
    return apiClient.get(endpoint);
  },

  /**
   * Obtener pago por ID
   * @param {string} id - ID del pago
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return apiClient.get(`/payments/${id}`);
  },

  /**
   * Crear nuevo pago
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>}
   */
  create: async (paymentData) => {
    return apiClient.post('/payments', paymentData);
  },

  /**
   * Actualizar pago
   * @param {string} id - ID del pago
   * @param {Object} paymentData - Datos actualizados
   * @returns {Promise<Object>}
   */
  update: async (id, paymentData) => {
    return apiClient.put(`/payments/${id}`, paymentData);
  },

  /**
   * Actualizar estado de pago
   * @param {string} id - ID del pago
   * @param {Object} statusData - Datos de estado (status, paymentMethod, paymentDate, collectorId)
   * @returns {Promise<Object>}
   */
  updateStatus: async (id, statusData) => {
    return apiClient.patch(`/payments/${id}/status`, statusData);
  },

  /**
   * Eliminar pago
   * @param {string} id - ID del pago
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    return apiClient.delete(`/payments/${id}`);
  },

  /**
   * Obtener deudas mensuales
   * @returns {Promise<Array>}
   */
  getMonthlyDebts: async () => {
    return apiClient.get('/monthly-debts');
  }
};

export default paymentsApi;
