import { apiClient } from './client';

/**
 * API de Usuarios (Admin, Collectors, etc.)
 */
export const usersApi = {
  /**
   * Obtener todos los usuarios
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Array>}
   */
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    return apiClient.get(endpoint);
  },

  /**
   * Obtener usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return apiClient.get(`/users/${id}`);
  },

  /**
   * Crear nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>}
   */
  create: async (userData) => {
    return apiClient.post('/users', userData);
  },

  /**
   * Actualizar usuario
   * @param {string} id - ID del usuario
   * @param {Object} userData - Datos actualizados
   * @returns {Promise<Object>}
   */
  update: async (id, userData) => {
    return apiClient.put(`/users/${id}`, userData);
  },

  /**
   * Actualizar parcialmente un usuario
   * @param {string} id - ID del usuario
   * @param {Object} partialData - Datos parciales
   * @returns {Promise<Object>}
   */
  patch: async (id, partialData) => {
    return apiClient.patch(`/users/${id}`, partialData);
  },

  /**
   * Eliminar usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    return apiClient.delete(`/users/${id}`);
  },

  /**
   * Obtener usuarios por rol
   * @param {string} role - Rol (admin, collector, client, etc.)
   * @returns {Promise<Array>}
   */
  getByRole: async (role) => {
    return apiClient.get(`/users?role=${role}`);
  },

  /**
   * Obtener cobradores activos
   * @returns {Promise<Array>}
   */
  getActiveCollectors: async () => {
    return apiClient.get('/users?role=collector&isActive=true');
  },

  /**
   * Cambiar contraseña
   * @param {string} id - ID del usuario
   * @param {Object} passwordData - { currentPassword, newPassword }
   * @returns {Promise<Object>}
   */
  changePassword: async (id, passwordData) => {
    return apiClient.patch(`/users/${id}`, {
      password: passwordData.newPassword
    });
  },

  /**
   * Activar/Desactivar usuario
   * @param {string} id - ID del usuario
   * @param {boolean} isActive - Estado activo
   * @returns {Promise<Object>}
   */
  toggleActive: async (id, isActive) => {
    return apiClient.patch(`/users/${id}`, { isActive });
  }
};

export default usersApi;
