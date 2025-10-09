/**
 * Settings API Service
 *
 * Maneja todas las operaciones relacionadas con configuración del sistema
 */

import { apiClient } from './client';

export const settingsApi = {
  /**
   * Obtener toda la configuración
   */
  getAll: async () => {
    return apiClient.get('/settings');
  },

  /**
   * Obtener configuración por clave
   * Nota: Como settings es un objeto en db.json, este método
   * obtiene todo y filtra por clave en el cliente
   */
  getByKey: async (key) => {
    const settings = await apiClient.get('/settings');
    return settings[key];
  },

  /**
   * Actualizar configuración completa
   */
  update: async (settingsData) => {
    return apiClient.put('/settings', settingsData);
  },

  /**
   * Actualizar configuración parcialmente
   */
  patch: async (updates) => {
    return apiClient.patch('/settings', updates);
  },

  /**
   * Actualizar una configuración específica por clave
   */
  updateKey: async (key, value) => {
    return apiClient.patch('/settings', { [key]: value });
  },

  /**
   * Obtener configuraciones de la compañía
   */
  getCompanyInfo: async () => {
    const settings = await apiClient.get('/settings');
    return {
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyPhone: settings.companyPhone,
      companyEmail: settings.companyEmail
    };
  },

  /**
   * Obtener configuraciones de facturación
   */
  getBillingSettings: async () => {
    const settings = await apiClient.get('/settings');
    return {
      billingType: settings.billingType,
      defaultPaymentDueDay: settings.defaultPaymentDueDay,
      autoSuspendAfterDays: settings.autoSuspendAfterDays,
      lateFeePercentage: settings.lateFeePercentage
    };
  },

  /**
   * Actualizar información de la compañía
   */
  updateCompanyInfo: async (companyData) => {
    return apiClient.patch('/settings', companyData);
  },

  /**
   * Actualizar configuraciones de facturación
   */
  updateBillingSettings: async (billingData) => {
    return apiClient.patch('/settings', billingData);
  },

  /**
   * Resetear configuración a valores por defecto
   */
  reset: async () => {
    const defaultSettings = {
      companyName: 'TV Cable Cobranzas',
      companyAddress: 'Av. Principal 123, Lima, Perú',
      companyPhone: '+51 999 999 999',
      companyEmail: 'contacto@tvcable.com',
      billingType: 'postpaid',
      defaultPaymentDueDay: 5,
      autoSuspendAfterDays: 15,
      lateFeePercentage: 5,
      currency: 'PEN',
      timezone: 'America/Lima'
    };
    return apiClient.put('/settings', defaultSettings);
  }
};

export default settingsApi;
