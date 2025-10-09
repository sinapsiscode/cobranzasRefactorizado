import { apiClient } from './client';

/**
 * API de Gestión de Caja (CashBox)
 */
export const cashBoxApi = {
  /**
   * Obtener todas las solicitudes de caja
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Array>}
   */
  getAllRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/cashBoxRequests?${queryString}` : '/cashBoxRequests';
    return apiClient.get(endpoint);
  },

  /**
   * Obtener solicitud por ID
   * @param {string} id - ID de la solicitud
   * @returns {Promise<Object>}
   */
  getRequestById: async (id) => {
    return apiClient.get(`/cashBoxRequests/${id}`);
  },

  /**
   * Crear solicitud de caja
   * @param {Object} requestData - Datos de la solicitud
   * @returns {Promise<Object>}
   */
  createRequest: async (requestData) => {
    return apiClient.post('/cashbox/request', requestData);
  },

  /**
   * Aprobar solicitud de caja
   * @param {string} id - ID de la solicitud
   * @param {Object} approvalData - Datos de aprobación
   * @returns {Promise<Object>}
   */
  approveRequest: async (id, approvalData) => {
    return apiClient.patch(`/cashbox/request/${id}`, {
      ...approvalData,
      status: 'approved'
    });
  },

  /**
   * Rechazar solicitud de caja
   * @param {string} id - ID de la solicitud
   * @param {string} reason - Razón del rechazo
   * @returns {Promise<Object>}
   */
  rejectRequest: async (id, reason) => {
    return apiClient.patch(`/cashbox/request/${id}`, {
      status: 'rejected',
      rejectionReason: reason
    });
  },

  /**
   * Obtener solicitudes pendientes
   * @returns {Promise<Array>}
   */
  getPendingRequests: async () => {
    return apiClient.get('/cashBoxRequests?status=pending');
  },

  /**
   * Obtener solicitudes por cobrador
   * @param {string} collectorId - ID del cobrador
   * @returns {Promise<Array>}
   */
  getByCollector: async (collectorId) => {
    return apiClient.get(`/cashBoxRequests?collectorId=${collectorId}`);
  },

  /**
   * Obtener solicitudes por fecha
   * @param {string} date - Fecha (YYYY-MM-DD)
   * @returns {Promise<Array>}
   */
  getByDate: async (date) => {
    return apiClient.get(`/cashBoxRequests?workDate=${date}`);
  },

  /**
   * Cerrar caja (registrar cierre)
   * @param {string} id - ID de la solicitud
   * @param {Object} closureData - Datos de cierre
   * @returns {Promise<Object>}
   */
  closeCashBox: async (id, closureData) => {
    return apiClient.patch(`/cashBoxRequests/${id}`, {
      ...closureData,
      status: 'closed',
      closedAt: new Date().toISOString()
    });
  }
};

export default cashBoxApi;
