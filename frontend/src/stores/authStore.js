// Store de autenticación - manejo de usuario actual, token, login/logout
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const API_URL = 'http://localhost:8231/api';

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
          // Obtener todos los usuarios
          const response = await fetch(`${API_URL}/users`);

          if (!response.ok) {
            throw new Error('Error de conexión con el servidor');
          }

          const data = await response.json();
          const users = data.items || data || [];

          // Buscar usuario por username
          const user = users.find(u => u.username === credentials.username);

          if (!user) {
            throw new Error('Usuario no encontrado');
          }

          // Verificar contraseña (en producción esto debería ser hash)
          if (user.password !== credentials.password) {
            throw new Error('Contraseña incorrecta');
          }

          // Verificar que el usuario esté activo
          if (!user.isActive) {
            throw new Error('Usuario inactivo. Contacte al administrador');
          }

          // Generar token simple (en producción sería JWT)
          const token = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Calcular expiración de sesión (24 horas por defecto)
          const expiresIn = 24 * 60 * 60 * 1000; // 24 horas en ms
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
            error: error.message || 'Error de conexión',
            user: null,
            token: null,
            isAuthenticated: false
          });

          throw error;
        }
      },

      logout: async () => {
        // Simplemente limpiar el estado local
        // No hay necesidad de llamar al servidor con JSON Server
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
          sessionExpiry: null
        });
      },

      validateToken: async () => {
        const { token, sessionExpiry, user } = get();

        if (!token || !user) {
          return false;
        }

        // Verificar expiración local
        if (sessionExpiry && new Date(sessionExpiry) <= new Date()) {
          get().logout();
          return false;
        }

        // Con JSON Server, solo verificamos la expiración local
        // En producción, esto haría una llamada al servidor para validar el JWT

        set({
          isAuthenticated: true,
          loading: false,
          error: null
        });

        return true;
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
