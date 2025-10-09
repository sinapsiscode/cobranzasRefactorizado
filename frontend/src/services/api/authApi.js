import { apiClient } from './client';

/**
 * API de autenticación
 */
export const authApi = {
  /**
   * Login de usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<{user, token}>}
   */
  login: async (username, password) => {
    return apiClient.post('/auth/login', { username, password });
  },

  /**
   * Logout de usuario
   * @returns {Promise<{message}>}
   */
  logout: async () => {
    return apiClient.post('/auth/logout');
  },

  /**
   * Verificar token de autenticación
   * @returns {Promise<{user}>}
   */
  verify: async () => {
    return apiClient.get('/auth/verify');
  }
};

export default authApi;
