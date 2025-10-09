/**
 * Service Store - REFACTORIZADO para usar API REST
 */

import { create } from 'zustand';
import { servicesApi } from '../services/api';

export const useServiceStore = create((set, get) => ({
  // Estado
  services: [],
  currentService: null,
  isLoading: false,
  error: null,

  // ============================================
  // ACCIONES - Refactorizadas para usar API
  // ============================================

  /**
   * Obtener todos los servicios
   */
  fetchServices: async () => {
    set({ isLoading: true, error: null });

    try {
      const services = await servicesApi.getAll();

      set({
        services,
        isLoading: false,
        error: null
      });

      return { success: true, data: services };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar servicios'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener servicio por ID
   */
  fetchServiceById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const service = await servicesApi.getById(id);

      set({
        currentService: service,
        isLoading: false,
        error: null
      });

      return { success: true, data: service };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar servicio'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Crear nuevo servicio
   */
  createService: async (serviceData) => {
    set({ isLoading: true, error: null });

    try {
      const newService = await servicesApi.create(serviceData);

      set((state) => ({
        services: [...state.services, newService],
        isLoading: false,
        error: null
      }));

      return { success: true, data: newService };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al crear servicio'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar servicio
   */
  updateService: async (id, serviceData) => {
    set({ isLoading: true, error: null });

    try {
      const updatedService = await servicesApi.update(id, serviceData);

      set((state) => ({
        services: state.services.map((service) =>
          service.id === id ? updatedService : service
        ),
        currentService:
          state.currentService?.id === id ? updatedService : state.currentService,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updatedService };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al actualizar servicio'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Eliminar servicio
   */
  deleteService: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await servicesApi.delete(id);

      set((state) => ({
        services: state.services.filter((service) => service.id !== id),
        currentService: state.currentService?.id === id ? null : state.currentService,
        isLoading: false,
        error: null
      }));

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al eliminar servicio'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener servicios activos
   */
  fetchActiveServices: async () => {
    set({ isLoading: true, error: null });

    try {
      const services = await servicesApi.getActive();

      set({
        services,
        isLoading: false,
        error: null
      });

      return { success: true, data: services };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar servicios activos'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Activar/Desactivar servicio
   */
  toggleServiceActive: async (id, isActive) => {
    set({ isLoading: true, error: null });

    try {
      const updatedService = await servicesApi.patch(id, { isActive });

      set((state) => ({
        services: state.services.map((service) =>
          service.id === id ? updatedService : service
        ),
        isLoading: false,
        error: null
      }));

      return { success: true, data: updatedService };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cambiar estado del servicio'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Limpiar servicio actual
   */
  clearCurrentService: () => {
    set({ currentService: null });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Obtener servicio por tipo (helper local)
   */
  getServiceByType: (type) => {
    const { services } = get();
    return services.find((service) => service.type === type);
  },

  /**
   * Obtener precio por tipo de plan
   */
  getPriceByPlan: (planType) => {
    const service = get().getServiceByType(planType);
    return service?.price || 0;
  }
}));

export default useServiceStore;
