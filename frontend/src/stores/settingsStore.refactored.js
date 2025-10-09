/**
 * Settings Store - REFACTORIZADO para usar API REST
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../services/api';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Estado
      settings: null,
      isLoading: false,
      error: null,

      /**
       * Obtener configuración del sistema
       */
      fetchSettings: async () => {
        set({ isLoading: true, error: null });

        try {
          const settings = await apiClient.get('/settings');

          set({
            settings,
            isLoading: false,
            error: null
          });

          return { success: true, data: settings };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message || 'Error al cargar configuración'
          });

          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Actualizar configuración
       */
      updateSettings: async (settingsData) => {
        set({ isLoading: true, error: null });

        try {
          const updated = await apiClient.patch('/settings', settingsData);

          set({
            settings: updated,
            isLoading: false,
            error: null
          });

          return { success: true, data: updated };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message || 'Error al actualizar configuración'
          });

          return {
            success: false,
            error: error.message
          };
        }
      },

      /**
       * Limpiar error
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Obtener valor específico de configuración
       */
      getSetting: (key) => {
        const { settings } = get();
        return settings?.[key];
      }
    }),
    {
      name: 'tv-cable-settings',
      partialize: (state) => ({
        settings: state.settings
      })
    }
  )
);

export default useSettingsStore;
