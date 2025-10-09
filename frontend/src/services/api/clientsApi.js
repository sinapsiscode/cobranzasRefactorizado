import { apiClient } from './client';

/**
 * API de clientes
 */
export const clientsApi = {
  /**
   * Obtener todos los clientes
   * @param {Object} params - Parámetros de filtrado (page, limit, search, etc.)
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/clients?${queryString}` : '/clients';
    return apiClient.get(endpoint);
  },

  /**
   * Obtener cliente por ID
   * @param {string} id - ID del cliente
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return apiClient.get(`/clients/${id}`);
  },

  /**
   * Crear nuevo cliente
   * @param {Object} clientData - Datos del cliente
   * @returns {Promise<Object>}
   */
  create: async (clientData) => {
    return apiClient.post('/clients', clientData);
  },

  /**
   * Actualizar cliente
   * @param {string} id - ID del cliente
   * @param {Object} clientData - Datos actualizados
   * @returns {Promise<Object>}
   */
  update: async (id, clientData) => {
    return apiClient.put(`/clients/${id}`, clientData);
  },

  /**
   * Actualizar parcialmente un cliente
   * @param {string} id - ID del cliente
   * @param {Object} partialData - Datos parciales a actualizar
   * @returns {Promise<Object>}
   */
  patch: async (id, partialData) => {
    return apiClient.patch(`/clients/${id}`, partialData);
  },

  /**
   * Eliminar cliente
   * @param {string} id - ID del cliente
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    return apiClient.delete(`/clients/${id}`);
  },

  /**
   * Obtener clientes con deudas
   * @returns {Promise<Array>}
   */
  getWithDebts: async () => {
    return apiClient.get('/clients/with-debts');
  },

  /**
   * Obtener pagos de un cliente
   * @param {string} clientId - ID del cliente
   * @returns {Promise<Array>}
   */
  getPayments: async (clientId) => {
    return apiClient.get(`/clients/${clientId}/payments`);
  }
};

export default clientsApi;
