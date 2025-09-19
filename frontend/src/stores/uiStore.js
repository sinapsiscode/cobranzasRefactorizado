// Store de UI - loading, modales, sidebar
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
      
      // Tema y preferencias
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
      
      // Configuraciones de usuario
      preferences: {
        defaultPageSize: 25,
        autoRefresh: false,
        refreshInterval: 30000, // 30 segundos
        notifications: true,
        sounds: false,
        compactMode: false
      },

      // Acciones generales
      setLoading: (loading) => {
        set({ loading });
      },

      setGlobalLoading: (globalLoading) => {
        set({ globalLoading });
      },

      // Gestión de sidebar
      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleSidebarCollapse: () => {
        set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Gestión de modales
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

      // Tema
      setTheme: (theme) => {
        set({ theme });
        // Aplicar clase al documento
        document.documentElement.className = theme;
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // Responsive
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

      // Navegación y breadcrumbs
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

      // Búsqueda global
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

      // Preferencias
      updatePreferences: (newPreferences) => {
        set(state => ({
          preferences: { ...state.preferences, ...newPreferences }
        }));
      },

      resetPreferences: () => {
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
      },

      // Utilidades
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

      // Estados específicos de UI
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

      // Método para detectar cambios de viewport
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

      // Inicialización
      initialize: () => {
        // Detectar tamaño inicial
        get().handleResize();
        
        // Agregar listener de resize
        window.addEventListener('resize', get().handleResize);
        
        // Aplicar tema inicial
        get().setTheme(get().theme);
      }
    }),
    {
      name: 'tv-cable-ui',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        preferences: state.preferences
      })
    }
  )
);