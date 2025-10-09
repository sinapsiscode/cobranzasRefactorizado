/**
 * Auth Store - REFACTORIZADO para usar API REST
 *
 * Este archivo muestra cómo refactorizar el authStore existente
 * para consumir datos desde el backend JSON Server en lugar de localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ============================================
      // ACCIONES - Refactorizadas para usar API
      // ============================================

      /**
       * Login - Ahora hace petición HTTP al backend
       */
      login: async (username, password) => {
        set({ isLoading: true, error: null });

        try {
          // Llamada a la API REST en lugar de consultar localStorage
          const response = await authApi.login(username, password);

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Error al iniciar sesión'
          });

          return {
            success: false,
            error: error.message || 'Credenciales inválidas'
          };
        }
      },

      /**
       * Logout - Ahora hace petición HTTP al backend
       */
      logout: async () => {
        try {
          // Notificar al backend del logout
          await authApi.logout();
        } catch (error) {
          console.error('Error en logout:', error);
          // Continuar con logout local aunque falle el servidor
        }

        // Limpiar estado local
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      /**
       * Verificar token - Valida con el backend
       */
      verifyToken: async () => {
        const { token } = get();

        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        set({ isLoading: true });

        try {
          // Verificar token con el backend
          const response = await authApi.verify();

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          });

          return true;
        } catch (error) {
          console.error('Token inválido:', error);

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });

          return false;
        }
      },

      /**
       * Limpiar error
       */
      clearError: () => set({ error: null }),

      /**
       * Verificar permiso por rol
       */
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      /**
       * Verificar si tiene uno de varios roles
       */
      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.role);
      },

      /**
       * Verificar si es administrador
       */
      isAdmin: () => {
        return get().hasRole('admin');
      },

      /**
       * Verificar si es sub-administrador
       */
      isSubAdmin: () => {
        return get().hasRole('subadmin');
      },

      /**
       * Verificar si es cobrador
       */
      isCollector: () => {
        return get().hasRole('collector');
      },

      /**
       * Verificar si es cliente
       */
      isClient: () => {
        return get().hasRole('client');
      },

      /**
       * Verificar si tiene permisos administrativos
       */
      hasAdminAccess: () => {
        return get().hasAnyRole(['admin', 'subadmin']);
      },

      /**
       * Obtener información del usuario actual
       */
      getCurrentUser: () => {
        return get().user;
      },

      /**
       * Obtener ID del usuario actual
       */
      getCurrentUserId: () => {
        return get().user?.id;
      },

      /**
       * Verificar si la sesión es válida
       */
      isSessionValid: () => {
        const { token, isAuthenticated } = get();
        return !!(token && isAuthenticated);
      },

      /**
       * Obtener token actual
       */
      getToken: () => {
        return get().token;
      }
    }),
    {
      name: 'tv-cable-auth', // Nombre en localStorage
      partialize: (state) => ({
        // Solo persistir estos campos
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
