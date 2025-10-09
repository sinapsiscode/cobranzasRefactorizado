/**
 * Exportaciones centralizadas de la API
 *
 * Este archivo centraliza todas las exportaciones de los servicios API
 * para facilitar las importaciones en los componentes y stores
 */

// Cliente HTTP base
export { apiClient, default as ApiClient } from './client';

// Configuración
export { API_CONFIG, getAuthToken, getAuthHeaders } from './config';

// APIs específicas
export { authApi } from './authApi';
export { clientsApi } from './clientsApi';
export { paymentsApi } from './paymentsApi';
export { servicesApi } from './servicesApi';
export { usersApi } from './usersApi';
export { cashBoxApi } from './cashBoxApi';
export { notificationsApi } from './notificationsApi';
export { dashboardApi } from './dashboardApi';
export { vouchersApi } from './vouchersApi';
export { paymentMethodsApi } from './paymentMethodsApi';
export { settingsApi } from './settingsApi';

// API completa (objeto con todas las APIs)
export const api = {
  auth: authApi,
  clients: clientsApi,
  payments: paymentsApi,
  services: servicesApi,
  users: usersApi,
  cashBox: cashBoxApi,
  notifications: notificationsApi,
  dashboard: dashboardApi,
  vouchers: vouchersApi,
  paymentMethods: paymentMethodsApi,
  settings: settingsApi
};

export default api;
