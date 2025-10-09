import { apiClient } from './client';

/**
 * API de Servicios (Planes)
 */
export const servicesApi = {
  /**
   * Obtener todos los servicios/planes
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    return apiClient.get('/services');
  },

  /**
   * Obtener servicio por ID
   * @param {string} id - ID del servicio
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return apiClient.get(`/services/${id}`);
  },

  /**
   * Crear nuevo servicio
   * @param {Object} serviceData - Datos del servicio
   * @returns {Promise<Object>}
   */
  create: async (serviceData) => {
    return apiClient.post('/services', serviceData);
  },

  /**
   * Actualizar servicio
   * @param {string} id - ID del servicio
   * @param {Object} serviceData - Datos actualizados
   * @returns {Promise<Object>}
   */
  update: async (id, serviceData) => {
    return apiClient.put(`/services/${id}`, serviceData);
  },

  /**
   * Actualizar parcialmente un servicio
   * @param {string} id - ID del servicio
   * @param {Object} partialData - Datos parciales
   * @returns {Promise<Object>}
   */
  patch: async (id, partialData) => {
    return apiClient.patch(`/services/${id}`, partialData);
  },

  /**
   * Eliminar servicio
   * @param {string} id - ID del servicio
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    return apiClient.delete(`/services/${id}`);
  },

  /**
   * Obtener servicios activos
   * @returns {Promise<Array>}
   */
  getActive: async () => {
    return apiClient.get('/services?isActive=true');
  }
};

export default servicesApi;
