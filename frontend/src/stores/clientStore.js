// Store de clientes - lista, CRUD, filtros
import { create } from 'zustand';
import { mockServer } from '../services/mock/server.js';

export const useClientStore = create((set, get) => ({
  // Estado
  clients: [],
  currentClient: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  },
  filters: {
    search: '',
    status: '',
    plan: '',
    clientStatus: '', // Nuevo filtro para estados de cliente
    neighborhoods: [], // Nuevo filtro para barrios
    sortBy: 'fullName',
    sortOrder: 'asc'
  },
  lastSync: null,

  // Acciones CRUD
  fetchClients: async (customFilters = {}) => {
    set({ loading: true, error: null });
    
    try {
      const { filters, pagination } = get();
      const params = {
        ...filters,
        ...customFilters,
        page: pagination.page,
        limit: pagination.limit
      };
      
      const response = await mockServer.getClients(params);
      const { items, pagination: paginationData } = response.data;
      
      set({
        clients: items,
        pagination: paginationData,
        loading: false,
        error: null,
        lastSync: new Date().toISOString()
      });
      
      return items;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al cargar clientes',
        clients: []
      });
      
      throw error;
    }
  },

  fetchClient: async (id) => {
    set({ loading: true, error: null });
    
    try {
      const response = await mockServer.getClient(id);
      const client = response.data;
      
      set({
        currentClient: client,
        loading: false,
        error: null
      });
      
      return client;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al cargar cliente',
        currentClient: null
      });
      
      throw error;
    }
  },

  createClient: async (clientData) => {
    set({ loading: true, error: null });
    
    try {
      const response = await mockServer.createClient(clientData);
      const newClient = response.data;
      
      // Actualizar lista local
      set(state => ({
        clients: [newClient, ...state.clients],
        loading: false,
        error: null
      }));
      
      // Refrescar datos
      await get().fetchClients();
      
      return newClient;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al crear cliente'
      });
      
      throw error;
    }
  },

  updateClient: async (id, updates) => {
    set({ loading: true, error: null });
    
    try {
      const response = await mockServer.updateClient(id, updates);
      const updatedClient = response.data;
      
      // Actualizar lista local
      set(state => ({
        clients: state.clients.map(client =>
          client.id === id ? updatedClient : client
        ),
        currentClient: state.currentClient?.id === id ? updatedClient : state.currentClient,
        loading: false,
        error: null
      }));
      
      return updatedClient;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al actualizar cliente'
      });
      
      throw error;
    }
  },

  deleteClient: async (id) => {
    set({ loading: true, error: null });
    
    try {
      await mockServer.deleteClient(id);
      
      // Actualizar lista local
      set(state => ({
        clients: state.clients.filter(client => client.id !== id),
        currentClient: state.currentClient?.id === id ? null : state.currentClient,
        loading: false,
        error: null
      }));
      
      // Refrescar datos
      await get().fetchClients();
      
      return true;
    } catch (error) {
      set({
        loading: false,
        error: error.error || 'Error al eliminar cliente'
      });
      
      throw error;
    }
  },

  // Gestión de filtros
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 } // Reset a página 1
    }));
    
    // Auto-refrescar si hay cambios significativos
    if (newFilters.search !== undefined || newFilters.status !== undefined || newFilters.plan !== undefined || newFilters.neighborhoods !== undefined) {
      get().fetchClients();
    }
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        status: '',
        plan: '',
        neighborhoods: [],
        sortBy: 'fullName',
        sortOrder: 'asc'
      },
      pagination: { ...get().pagination, page: 1 }
    });
    
    get().fetchClients();
  },

  // Paginación
  setPage: (page) => {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
    
    get().fetchClients();
  },

  setPageSize: (limit) => {
    set(state => ({
      pagination: { ...state.pagination, limit, page: 1 }
    }));
    
    get().fetchClients();
  },

  // Búsqueda
  searchClients: (searchTerm) => {
    get().setFilters({ search: searchTerm });
  },

  // Utilitarios
  clearError: () => {
    set({ error: null });
  },

  clearCurrentClient: () => {
    set({ currentClient: null });
  },

  // Getters/Selectors
  getClientById: (id) => {
    const { clients } = get();
    return clients.find(client => client.id === id) || null;
  },

  getActiveClients: () => {
    const { clients } = get();
    return clients.filter(client => client.isActive);
  },

  getClientsByPlan: (plan) => {
    const { clients } = get();
    return clients.filter(client => client.servicePlan === plan);
  },

  getClientsCount: () => {
    const { pagination } = get();
    return pagination.total;
  },

  isLoading: () => {
    const { loading } = get();
    return loading;
  },

  hasError: () => {
    const { error } = get();
    return !!error;
  },

  needsRefresh: () => {
    const { lastSync } = get();
    if (!lastSync) return true;
    
    const timeDiff = Date.now() - new Date(lastSync).getTime();
    return timeDiff > 5 * 60 * 1000; // 5 minutos
  },

  // Funciones específicas para cambio de estado
  changeClientStatus: async (clientId, newStatus, reason = '', adminId = null) => {
    set({ loading: true, error: null });
    
    try {
      const client = get().clients.find(c => c.id === clientId);
      if (!client) {
        throw new Error('Cliente no encontrado');
      }

      const updates = {
        status: newStatus,
        statusReason: reason,
        statusHistory: [
          ...(client.statusHistory || []),
          {
            fromStatus: client.status || 'active',
            toStatus: newStatus,
            date: new Date().toISOString(),
            reason: reason,
            changedBy: adminId
          }
        ],
        updatedAt: new Date().toISOString()
      };

      // Lógica específica por estado
      if (newStatus === 'paused') {
        updates.pauseStartDate = new Date().toISOString();
        updates.pauseReason = reason;
      } else if (newStatus === 'terminated' && (client.status === 'paused' || client.status === 'active')) {
        updates.isArchived = true;
        updates.archivedDate = new Date().toISOString();
      }

      const updatedClient = await get().updateClient(clientId, updates);
      return updatedClient;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Error al cambiar estado del cliente'
      });
      throw error;
    }
  },

  // Funciones para automatización
  checkAutomaticTerminations: async () => {
    try {
      const clients = get().clients;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const clientsToTerminate = clients.filter(client => {
        if (client.status !== 'paused') return false;
        if (!client.pauseStartDate) return false;
        
        const pauseStart = new Date(client.pauseStartDate);
        return pauseStart <= thirtyDaysAgo;
      });

      // Procesar bajas automáticas
      const promises = clientsToTerminate.map(client =>
        get().changeClientStatus(
          client.id, 
          'terminated', 
          'Baja automática: pausa mayor a 30 días',
          'system'
        )
      );

      await Promise.all(promises);
      return clientsToTerminate.length;
    } catch (error) {
      console.error('Error en verificación automática:', error);
      return 0;
    }
  },

  // Filtros específicos por estado
  getClientsByStatus: (status) => {
    const { clients } = get();
    return clients.filter(client => (client.status || 'active') === status);
  },

  getPausedClients: () => {
    return get().getClientsByStatus('paused');
  },

  getTerminatedClients: () => {
    return get().getClientsByStatus('terminated');
  },

  getArchivedClients: () => {
    const { clients } = get();
    return clients.filter(client => client.isArchived);
  },

  // Funciones para filtrado por barrio
  getAvailableNeighborhoods: () => {
    const { clients } = get();
    // Solo incluir barrios que tienen al menos un cliente
    const neighborhoods = [...new Set(clients.map(client => client.neighborhood).filter(Boolean))];
    return neighborhoods.sort();
  },

  // Nueva función para obtener barrios con clientes deudores
  getNeighborhoodsWithDebtors: (payments = []) => {
    const { clients } = get();
    
    // Función auxiliar para determinar si un cliente tiene deuda
    const hasDebt = (clientId) => {
      const clientPayments = payments.filter(p => p.clientId === clientId);
      if (clientPayments.length === 0) return true; // sin-pagos = tiene deuda
      
      const hasOverdue = clientPayments.some(p => p.status === 'overdue');
      const hasPending = clientPayments.some(p => p.status === 'pending');
      
      return hasOverdue || hasPending;
    };
    
    // Filtrar clientes con deuda
    const clientsWithDebt = clients.filter(client => hasDebt(client.id));
    
    // Obtener barrios únicos de clientes con deuda
    const neighborhoods = [...new Set(clientsWithDebt.map(client => client.neighborhood).filter(Boolean))];
    return neighborhoods.sort();
  },

  getClientsByNeighborhood: (neighborhood) => {
    const { clients } = get();
    return clients.filter(client => client.neighborhood === neighborhood);
  },

  getClientsByNeighborhoods: (neighborhoods = []) => {
    if (!neighborhoods.length) return get().clients;
    const { clients } = get();
    return clients.filter(client => neighborhoods.includes(client.neighborhood));
  },

  setNeighborhoodFilter: (neighborhoods) => {
    get().setFilters({ neighborhoods });
  },

  clearNeighborhoodFilter: () => {
    get().setFilters({ neighborhoods: [] });
  }
}));