/**
 * Client Store - REFACTORIZADO para usar API REST
 *
 * Este archivo muestra cómo refactorizar el clientStore existente
 * para consumir datos desde el backend JSON Server
 */

import { create } from 'zustand';
import { clientsApi } from '../services/api';

export const useClientStore = create((set, get) => ({
  // Estado
  clients: [],
  currentClient: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    status: 'all',
    servicePlan: 'all'
  },

  // ============================================
  // ACCIONES - Refactorizadas para usar API
  // ============================================

  /**
   * Obtener todos los clientes desde la API
   */
  fetchClients: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      // Petición GET al backend
      const clients = await clientsApi.getAll(params);

      set({
        clients,
        isLoading: false,
        error: null
      });

      return { success: true, data: clients };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar clientes'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener cliente por ID
   */
  fetchClientById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const client = await clientsApi.getById(id);

      set({
        currentClient: client,
        isLoading: false,
        error: null
      });

      return { success: true, data: client };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar cliente'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Crear nuevo cliente
   */
  createClient: async (clientData) => {
    set({ isLoading: true, error: null });

    try {
      // Petición POST al backend
      const newClient = await clientsApi.create(clientData);

      // Actualizar lista local
      set((state) => ({
        clients: [...state.clients, newClient],
        isLoading: false,
        error: null
      }));

      return { success: true, data: newClient };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al crear cliente'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar cliente existente
   */
  updateClient: async (id, clientData) => {
    set({ isLoading: true, error: null });

    try {
      // Petición PUT al backend
      const updatedClient = await clientsApi.update(id, clientData);

      // Actualizar lista local
      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === id ? updatedClient : client
        ),
        currentClient:
          state.currentClient?.id === id ? updatedClient : state.currentClient,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updatedClient };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al actualizar cliente'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Eliminar cliente
   */
  deleteClient: async (id) => {
    set({ isLoading: true, error: null });

    try {
      // Petición DELETE al backend
      await clientsApi.delete(id);

      // Actualizar lista local
      set((state) => ({
        clients: state.clients.filter((client) => client.id !== id),
        currentClient: state.currentClient?.id === id ? null : state.currentClient,
        isLoading: false,
        error: null
      }));

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al eliminar cliente'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener clientes con deudas
   */
  fetchClientsWithDebts: async () => {
    set({ isLoading: true, error: null });

    try {
      const clients = await clientsApi.getWithDebts();

      set({
        clients,
        isLoading: false,
        error: null
      });

      return { success: true, data: clients };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar clientes con deudas'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener pagos de un cliente
   */
  fetchClientPayments: async (clientId) => {
    set({ isLoading: true, error: null });

    try {
      const payments = await clientsApi.getPayments(clientId);

      return { success: true, data: payments };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar pagos del cliente'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar filtros
   */
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  /**
   * Limpiar cliente actual
   */
  clearCurrentClient: () => {
    set({ currentClient: null });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Obtener clientes filtrados (local)
   */
  getFilteredClients: () => {
    const { clients, filters } = get();

    return clients.filter((client) => {
      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          client.fullName?.toLowerCase().includes(searchLower) ||
          client.dni?.includes(filters.search) ||
          client.phone?.includes(filters.search);

        if (!matchesSearch) return false;
      }

      // Filtro por estado
      if (filters.status !== 'all' && client.status !== filters.status) {
        return false;
      }

      // Filtro por plan
      if (filters.servicePlan !== 'all' && client.servicePlan !== filters.servicePlan) {
        return false;
      }

      return true;
    });
  },

  // ============================================
  // MÉTODOS AVANZADOS - Funcionalidades Faltantes
  // ============================================

  /**
   * Cambiar estado del cliente con historial
   */
  changeClientStatus: async (clientId, newStatus, reason, adminId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/clients/${clientId}/change-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ newStatus, reason, adminId })
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado del cliente');
      }

      const updatedClient = await response.json();

      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId ? updatedClient : client
        ),
        currentClient: state.currentClient?.id === clientId ? updatedClient : state.currentClient,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updatedClient };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cambiar estado del cliente'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar último acceso del cliente
   */
  updateClientLastLogin: async (clientId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/clients/${clientId}/last-login`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al actualizar último acceso');
      }

      const updatedClient = await response.json();

      set((state) => ({
        clients: state.clients.map((client) =>
          client.id === clientId ? updatedClient : client
        ),
        currentClient: state.currentClient?.id === clientId ? updatedClient : state.currentClient
      }));

      return { success: true, data: updatedClient };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Verificar bajas automáticas (pausados >30 días)
   */
  checkAutomaticTerminations: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/clients/check-automatic-terminations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al verificar bajas automáticas');
      }

      const eligibleClients = await response.json();

      set({
        isLoading: false,
        error: null
      });

      return { success: true, data: eligibleClients };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al verificar bajas automáticas'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Validar DNI único
   */
  validateDniUnique: async (dni, excludeId = null) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/clients/validate-dni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ dni, excludeId })
      });

      if (!response.ok) {
        throw new Error('Error al validar DNI');
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Verificar si cliente puede ser eliminado
   */
  canDelete: async (clientId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/clients/${clientId}/can-delete`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al verificar si se puede eliminar');
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener clientes por barrio
   */
  fetchClientsByNeighborhood: async (neighborhood) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/clients/by-neighborhood/${encodeURIComponent(neighborhood)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener clientes por barrio');
      }

      const clients = await response.json();

      set({
        clients,
        isLoading: false,
        error: null
      });

      return { success: true, data: clients };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al obtener clientes por barrio'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener barrios con deudores
   */
  fetchNeighborhoodsWithDebtors: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/neighborhoods/with-debtors`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener barrios con deudores');
      }

      const neighborhoods = await response.json();

      set({
        isLoading: false,
        error: null
      });

      return { success: true, data: neighborhoods };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al obtener barrios con deudores'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  // ============================================
  // GETTERS ESPECÍFICOS
  // ============================================

  /**
   * Obtener clientes por estado
   */
  getClientsByStatus: (status) => {
    const { clients } = get();
    return clients.filter((c) => c.status === status);
  },

  /**
   * Obtener clientes activos
   */
  getActiveClients: () => {
    return get().getClientsByStatus('active');
  },

  /**
   * Obtener clientes pausados
   */
  getPausedClients: () => {
    return get().getClientsByStatus('paused');
  },

  /**
   * Obtener clientes dados de baja
   */
  getTerminatedClients: () => {
    return get().getClientsByStatus('terminated');
  },

  /**
   * Obtener clientes por barrio (local)
   */
  getClientsByNeighborhood: (neighborhood) => {
    const { clients } = get();
    return clients.filter((c) => c.neighborhood === neighborhood);
  }
}));

export default useClientStore;
