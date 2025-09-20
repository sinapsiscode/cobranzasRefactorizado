// Store de autenticación - manejo de usuario actual, token, login/logout
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiService from '../services/apiService.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      sessionExpiry: null,

      // Acciones
      login: async (credentials) => {
        set({ loading: true, error: null });
        
        try {
          const response = await apiService.login(credentials);
          const { user, token, expiresIn } = response.data;
          
          const sessionExpiry = new Date(Date.now() + expiresIn);
          
          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null,
            sessionExpiry: sessionExpiry.toISOString()
          });
          
          return { success: true, user };
        } catch (error) {
          set({ 
            loading: false, 
            error: error.error || 'Error de conexión',
            user: null,
            token: null,
            isAuthenticated: false
          });
          
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        
        try {
          const { token } = get();
          if (token) {
            await apiService.logout();
          }
        } catch (error) {
          // Ignorar errores de logout
          console.warn('Error during logout:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            sessionExpiry: null
          });
        }
      },

      validateToken: async () => {
        const { token, sessionExpiry } = get();
        
        if (!token) {
          return false;
        }
        
        // Verificar expiración local
        if (sessionExpiry && new Date(sessionExpiry) <= new Date()) {
          get().logout();
          return false;
        }
        
        set({ loading: true });
        
        try {
          const response = await apiService.validateToken();
          const { user } = response.data;
          
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          
          return true;
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            sessionExpiry: null
          });
          
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }));
      },

      // Helpers
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      hasAnyRole: (roles) => {
        const { user } = get();
        return roles.includes(user?.role);
      },

      isSubAdmin: () => {
        const { user } = get();
        return user?.role === 'subadmin';
      },

      isAdminOrSubAdmin: () => {
        const { user } = get();
        return ['admin', 'subadmin'].includes(user?.role);
      },

      isSessionValid: () => {
        const { token, sessionExpiry } = get();
        
        if (!token || !sessionExpiry) {
          return false;
        }
        
        return new Date(sessionExpiry) > new Date();
      },

      getRemainingSessionTime: () => {
        const { sessionExpiry } = get();
        
        if (!sessionExpiry) {
          return 0;
        }
        
        const remaining = new Date(sessionExpiry) - new Date();
        return Math.max(0, remaining);
      }
    }),
    {
      name: 'tv-cable-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry
      })
    }
  )
);