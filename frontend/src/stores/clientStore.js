// Store de clientes - lista, CRUD, filtros
import { create } from 'zustand';

const API_URL = 'http://localhost:8231/api';

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
        page: customFilters.page || pagination.page,
        limit: customFilters.limit || pagination.limit,
        ...customFilters
      };

      // Construir query string
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      const response = await fetch(`${API_URL}/clients?${queryParams.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al cargar clientes' }));
        throw new Error(errorData.error || errorData.message || 'Error al cargar clientes');
      }

      const data = await response.json();
      const { items, pagination: paginationData } = data;

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
        error: error.message || 'Error al cargar clientes',
        clients: []
      });

      throw error;
    }
  },

  fetchClient: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/clients/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al cargar cliente' }));
        throw new Error(errorData.error || errorData.message || 'Error al cargar cliente');
      }

      const data = await response.json();
      const client = data.data || data;

      set({
        currentClient: client,
        loading: false,
        error: null
      });

      return client;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Error al cargar cliente',
        currentClient: null
      });

      throw error;
    }
  },

  createClient: async (clientData) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al crear cliente' }));
        throw new Error(errorData.error || errorData.message || 'Error al crear cliente');
      }

      const data = await response.json();
      const newClient = data.data || data;

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
        error: error.message || 'Error al crear cliente'
      });

      throw error;
    }
  },

  updateClient: async (id, updates) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/clients/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al actualizar cliente' }));
        throw new Error(errorData.error || errorData.message || 'Error al actualizar cliente');
      }

      const data = await response.json();
      const updatedClient = data.data || data;

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
        error: error.message || 'Error al actualizar cliente'
      });

      throw error;
    }
  },

  deleteClient: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/clients/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al eliminar cliente' }));
        throw new Error(errorData.error || errorData.message || 'Error al eliminar cliente');
      }

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
        error: error.message || 'Error al eliminar cliente'
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

      const requestBody = {
        status: newStatus,
        reason: reason,
        adminId: adminId
      };

      const response = await fetch(`${API_URL}/clients/${clientId}/change-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al cambiar estado del cliente' }));
        throw new Error(errorData.error || errorData.message || 'Error al cambiar estado del cliente');
      }

      const data = await response.json();
      const updatedClient = data.data || data;

      // Actualizar lista local
      set(state => ({
        clients: state.clients.map(c =>
          c.id === clientId ? updatedClient : c
        ),
        currentClient: state.currentClient?.id === clientId ? updatedClient : state.currentClient,
        loading: false,
        error: null
      }));

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
