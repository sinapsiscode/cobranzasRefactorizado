import { apiClient } from './client';

/**
 * API de Notificaciones
 */
export const notificationsApi = {
  /**
   * Obtener todas las notificaciones
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    return apiClient.get(endpoint);
  },

  /**
   * Obtener notificación por ID
   * @param {string} id - ID de la notificación
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return apiClient.get(`/notifications/${id}`);
  },

  /**
   * Crear nueva notificación
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Object>}
   */
  create: async (notificationData) => {
    return apiClient.post('/notifications', {
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  },

  /**
   * Marcar notificación como leída
   * @param {string} id - ID de la notificación
   * @returns {Promise<Object>}
   */
  markAsRead: async (id) => {
    return apiClient.patch(`/notifications/${id}`, {
      isRead: true,
      readAt: new Date().toISOString()
    });
  },

  /**
   * Marcar todas como leídas (por usuario)
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>}
   */
  markAllAsRead: async (userId) => {
    const notifications = await apiClient.get(`/notifications?userId=${userId}&isRead=false`);

    const updatePromises = notifications.map(notif =>
      apiClient.patch(`/notifications/${notif.id}`, {
        isRead: true,
        readAt: new Date().toISOString()
      })
    );

    return Promise.all(updatePromises);
  },

  /**
   * Eliminar notificación
   * @param {string} id - ID de la notificación
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    return apiClient.delete(`/notifications/${id}`);
  },

  /**
   * Obtener notificaciones por usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>}
   */
  getByUser: async (userId) => {
    return apiClient.get(`/notifications?userId=${userId}`);
  },

  /**
   * Obtener notificaciones no leídas
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>}
   */
  getUnread: async (userId) => {
    return apiClient.get(`/notifications?userId=${userId}&isRead=false`);
  },

  /**
   * Obtener contador de no leídas
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>}
   */
  getUnreadCount: async (userId) => {
    const unread = await apiClient.get(`/notifications?userId=${userId}&isRead=false`);
    return unread.length;
  },

  /**
   * Obtener notificaciones por tipo
   * @param {string} userId - ID del usuario
   * @param {string} type - Tipo de notificación
   * @returns {Promise<Array>}
   */
  getByType: async (userId, type) => {
    return apiClient.get(`/notifications?userId=${userId}&type=${type}`);
  }
};

export default notificationsApi;
