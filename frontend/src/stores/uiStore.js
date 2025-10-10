// Store de UI - loading, modales, sidebar
// Migrated to use JSON Server API for user preferences persistence
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = '/api';

export const useUIStore = create(
  persist(
    (set, get) => ({
      // Estado general de UI
      loading: false,
      globalLoading: false,
      sidebarOpen: true,
      sidebarCollapsed: false,

      // Modales
      modals: {
        clientForm: false,
        paymentForm: false,
        confirmDelete: false,
        imagePreview: false,
        reportPreview: false
      },

      // Datos de modales
      modalData: {
        clientForm: null,
        paymentForm: null,
        confirmDelete: null,
        imagePreview: null,
        reportPreview: null
      },

      // Tema y preferencias (persistentes)
      theme: 'light',
      fontSize: 'medium',
      language: 'es',

      // Layout y responsive
      isMobile: false,
      isTablet: false,
      screenSize: 'desktop',

      // Estados de páginas
      currentPage: 'dashboard',
      breadcrumbs: [],

      // Búsqueda global
      globalSearch: {
        isOpen: false,
        query: '',
        results: [],
        loading: false
      },

      // Configuraciones de usuario (persistentes)
      preferences: {
        defaultPageSize: 25,
        autoRefresh: false,
        refreshInterval: 30000, // 30 segundos
        notifications: true,
        sounds: false,
        compactMode: false
      },

      // Estados de backend sync
      preferencesLoading: false,
      preferencesSaving: false,
      preferencesError: null,
      lastSyncedUserId: null,

      // ==================== BACKEND SYNC METHODS ====================

      /**
       * Load user preferences from backend
       * @param {string} userId - ID of the user
       * @returns {Promise<void>}
       */
      loadUserPreferences: async (userId) => {
        if (!userId) {
          console.warn('loadUserPreferences called without userId');
          return;
        }

        set({ preferencesLoading: true, preferencesError: null });

        try {
          const response = await fetch(`${API_URL}/user-preferences/${userId}`);

          if (!response.ok) {
            // If preferences don't exist (404), use defaults
            if (response.status === 404) {
              console.log('No preferences found for user, using defaults');
              set({
                preferencesLoading: false,
                lastSyncedUserId: userId
              });
              return;
            }
            throw new Error(`Failed to load preferences: ${response.status}`);
          }

          const data = await response.json();

          // Update state with backend preferences
          set({
            theme: data.theme || 'light',
            fontSize: data.fontSize || 'medium',
            language: data.language || 'es',
            sidebarCollapsed: data.sidebarCollapsed || false,
            preferences: {
              defaultPageSize: data.preferences?.defaultPageSize || 25,
              autoRefresh: data.preferences?.autoRefresh || false,
              refreshInterval: data.preferences?.refreshInterval || 30000,
              notifications: data.preferences?.notifications !== false, // default true
              sounds: data.preferences?.sounds || false,
              compactMode: data.preferences?.compactMode || false
            },
            preferencesLoading: false,
            preferencesError: null,
            lastSyncedUserId: userId
          });

          // Apply theme to document
          document.documentElement.className = data.theme || 'light';

        } catch (error) {
          console.error('Error loading user preferences:', error);
          set({
            preferencesLoading: false,
            preferencesError: error.message
          });
        }
      },

      /**
       * Save user preferences to backend
       * @param {string} userId - ID of the user
       * @returns {Promise<boolean>} - Success status
       */
      saveUserPreferences: async (userId) => {
        if (!userId) {
          console.warn('saveUserPreferences called without userId');
          return false;
        }

        const state = get();
        set({ preferencesSaving: true, preferencesError: null });

        try {
          // Prepare preferences payload
          const payload = {
            userId,
            theme: state.theme,
            fontSize: state.fontSize,
            language: state.language,
            sidebarCollapsed: state.sidebarCollapsed,
            preferences: state.preferences,
            updatedAt: new Date().toISOString()
          };

          // Try to update existing preferences first
          let response = await fetch(`${API_URL}/user-preferences/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          // If not found, create new preferences
          if (response.status === 404) {
            response = await fetch(`${API_URL}/user-preferences`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...payload,
                id: userId, // Use userId as ID for easier lookup
                createdAt: new Date().toISOString()
              })
            });
          }

          if (!response.ok) {
            throw new Error(`Failed to save preferences: ${response.status}`);
          }

          set({
            preferencesSaving: false,
            preferencesError: null,
            lastSyncedUserId: userId
          });

          return true;

        } catch (error) {
          console.error('Error saving user preferences:', error);
          set({
            preferencesSaving: false,
            preferencesError: error.message
          });
          return false;
        }
      },

      /**
       * Auto-save helper - saves to backend if userId is available
       * @param {string|null} userId - Optional userId for auto-save
       */
      autoSave: async (userId) => {
        if (userId) {
          await get().saveUserPreferences(userId);
        }
      },

      // ==================== ACCIONES GENERALES ====================

      setLoading: (loading) => {
        set({ loading });
      },

      setGlobalLoading: (globalLoading) => {
        set({ globalLoading });
      },

      // ==================== GESTIÓN DE SIDEBAR ====================

      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleSidebarCollapse: async (userId = null) => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
        await get().autoSave(userId);
      },

      setSidebarCollapsed: async (collapsed, userId = null) => {
        set({ sidebarCollapsed: collapsed });
        await get().autoSave(userId);
      },

      // ==================== GESTIÓN DE MODALES ====================

      openModal: (modalName, data = null) => {
        set(state => ({
          modals: { ...state.modals, [modalName]: true },
          modalData: { ...state.modalData, [modalName]: data }
        }));
      },

      closeModal: (modalName) => {
        set(state => ({
          modals: { ...state.modals, [modalName]: false },
          modalData: { ...state.modalData, [modalName]: null }
        }));
      },

      closeAllModals: () => {
        set(state => {
          const modals = {};
          const modalData = {};

          Object.keys(state.modals).forEach(key => {
            modals[key] = false;
            modalData[key] = null;
          });

          return { modals, modalData };
        });
      },

      // ==================== TEMA ====================

      setTheme: async (theme, userId = null) => {
        set({ theme });
        // Aplicar clase al documento
        document.documentElement.className = theme;
        await get().autoSave(userId);
      },

      toggleTheme: async (userId = null) => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        await get().setTheme(newTheme, userId);
      },

      setFontSize: async (fontSize, userId = null) => {
        set({ fontSize });
        await get().autoSave(userId);
      },

      setLanguage: async (language, userId = null) => {
        set({ language });
        await get().autoSave(userId);
      },

      // ==================== RESPONSIVE ====================

      setScreenSize: (size) => {
        const isMobile = size === 'mobile';
        const isTablet = size === 'tablet';

        set({
          screenSize: size,
          isMobile,
          isTablet,
          sidebarOpen: !isMobile, // Cerrar sidebar en móvil por defecto
          sidebarCollapsed: isMobile // Colapsar en móvil
        });
      },

      // ==================== NAVEGACIÓN Y BREADCRUMBS ====================

      setCurrentPage: (page) => {
        set({ currentPage: page });
      },

      setBreadcrumbs: (breadcrumbs) => {
        set({ breadcrumbs });
      },

      addBreadcrumb: (breadcrumb) => {
        set(state => ({
          breadcrumbs: [...state.breadcrumbs, breadcrumb]
        }));
      },

      // ==================== BÚSQUEDA GLOBAL ====================

      toggleGlobalSearch: () => {
        set(state => ({
          globalSearch: {
            ...state.globalSearch,
            isOpen: !state.globalSearch.isOpen,
            query: state.globalSearch.isOpen ? '' : state.globalSearch.query
          }
        }));
      },

      setGlobalSearchQuery: (query) => {
        set(state => ({
          globalSearch: { ...state.globalSearch, query }
        }));
      },

      setGlobalSearchResults: (results) => {
        set(state => ({
          globalSearch: { ...state.globalSearch, results }
        }));
      },

      setGlobalSearchLoading: (loading) => {
        set(state => ({
          globalSearch: { ...state.globalSearch, loading }
        }));
      },

      // ==================== PREFERENCIAS ====================

      updatePreferences: async (newPreferences, userId = null) => {
        set(state => ({
          preferences: { ...state.preferences, ...newPreferences }
        }));
        await get().autoSave(userId);
      },

      resetPreferences: async (userId = null) => {
        set({
          preferences: {
            defaultPageSize: 25,
            autoRefresh: false,
            refreshInterval: 30000,
            notifications: true,
            sounds: false,
            compactMode: false
          }
        });
        await get().autoSave(userId);
      },

      // ==================== UTILIDADES ====================

      isModalOpen: (modalName) => {
        const { modals } = get();
        return modals[modalName] || false;
      },

      getModalData: (modalName) => {
        const { modalData } = get();
        return modalData[modalName] || null;
      },

      hasAnyModalOpen: () => {
        const { modals } = get();
        return Object.values(modals).some(isOpen => isOpen);
      },

      // ==================== ESTADOS ESPECÍFICOS DE UI ====================

      setTableLoading: (loading) => {
        set(state => ({
          loading: { ...state.loading, table: loading }
        }));
      },

      setFormLoading: (loading) => {
        set(state => ({
          loading: { ...state.loading, form: loading }
        }));
      },

      // ==================== RESIZE HANDLING ====================

      handleResize: () => {
        const width = window.innerWidth;
        let size = 'desktop';

        if (width < 640) {
          size = 'mobile';
        } else if (width < 1024) {
          size = 'tablet';
        }

        get().setScreenSize(size);
      },

      // ==================== INICIALIZACIÓN ====================

      /**
       * Initialize UI store
       * @param {string|null} userId - Optional userId to load preferences from backend
       */
      initialize: async (userId = null) => {
        // Load preferences from backend if userId provided
        if (userId) {
          await get().loadUserPreferences(userId);
        }

        // Detectar tamaño inicial
        get().handleResize();

        // Agregar listener de resize
        window.addEventListener('resize', get().handleResize);

        // Aplicar tema inicial (already applied in loadUserPreferences if userId provided)
        if (!userId) {
          get().setTheme(get().theme);
        }
      },

      /**
       * Cleanup on unmount
       */
      cleanup: () => {
        window.removeEventListener('resize', get().handleResize);
      }
    }),
    {
      name: 'tv-cable-ui',
      partialize: (state) => ({
        // Only persist these fields to LocalStorage as fallback/cache
        theme: state.theme,
        fontSize: state.fontSize,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        preferences: state.preferences
      })
    }
  )
);
