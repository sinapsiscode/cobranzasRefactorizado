// Store de servicios - gestión de servicios de la empresa
import { create } from 'zustand';
import {
  validateService
} from '../schemas/service.js';

const API_URL = 'http://localhost:8231/api';

export const useServiceStore = create((set, get) => ({
  // Estado
  services: [],
  currentService: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    serviceType: '',
    category: '',
    isActive: '',
    sortBy: 'name',
    sortOrder: 'asc'
  },

  // Acciones CRUD
  fetchServices: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/services`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al cargar servicios' }));
        throw new Error(errorData.error || errorData.message || 'Error al cargar servicios');
      }

      const data = await response.json();
      const services = data.items || data || [];

      set({
        services,
        loading: false,
        error: null
      });

      return services;
    } catch (error) {
      set({
        loading: false,
        error: error.message || 'Error al cargar servicios'
      });
      throw error;
    }
  },

  createService: async (serviceData, createdBy) => {
    set({ loading: true, error: null });

    try {
      // Validar datos
      const errors = validateService(serviceData);
      if (errors) {
        throw new Error(`Datos inválidos: ${Object.values(errors).join(', ')}`);
      }

      // Verificar que no exista un servicio con el mismo nombre, tipo de servicio y categoría
      const { services } = get();
      const existingService = services.find(s =>
        s.name.toLowerCase() === serviceData.name.toLowerCase() &&
        s.serviceType === serviceData.serviceType &&
        s.category === serviceData.category
      );

      if (existingService) {
        throw new Error('Ya existe un servicio con el mismo nombre, tipo de plan y categoría');
      }

      // Preparar datos para enviar al backend
      const newServiceData = {
        ...serviceData,
        createdBy: createdBy || 'admin-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newServiceData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al crear servicio' }));
        throw new Error(errorData.error || errorData.message || 'Error al crear servicio');
      }

      const data = await response.json();
      const newService = data.data || data;

      set(state => ({
        services: [...state.services, newService],
        loading: false,
        error: null
      }));

      return newService;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  updateService: async (serviceId, updates) => {
    set({ loading: true, error: null });

    try {
      const { services } = get();
      const existingService = services.find(s => s.id === serviceId);

      if (!existingService) {
        throw new Error('Servicio no encontrado');
      }

      // Validar datos actualizados
      const updatedData = { ...existingService, ...updates };
      const errors = validateService(updatedData);
      if (errors) {
        throw new Error(`Datos inválidos: ${Object.values(errors).join(', ')}`);
      }

      // Agregar timestamp de actualización
      const updatePayload = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al actualizar servicio' }));
        throw new Error(errorData.error || errorData.message || 'Error al actualizar servicio');
      }

      const data = await response.json();
      const updatedService = data.data || data;

      set(state => ({
        services: state.services.map(service =>
          service.id === serviceId ? updatedService : service
        ),
        currentService: state.currentService?.id === serviceId ? updatedService : state.currentService,
        loading: false,
        error: null
      }));

      return updatedService;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  deleteService: async (serviceId) => {
    set({ loading: true, error: null });

    try {
      const { services } = get();
      const serviceToDelete = services.find(s => s.id === serviceId);

      if (!serviceToDelete) {
        throw new Error('Servicio no encontrado');
      }

      // TODO: Verificar si hay clientes usando este servicio
      // En una app real, esto se haría con una consulta a la base de datos

      const response = await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error al eliminar servicio' }));
        throw new Error(errorData.error || errorData.message || 'Error al eliminar servicio');
      }

      set(state => ({
        services: state.services.filter(service => service.id !== serviceId),
        currentService: state.currentService?.id === serviceId ? null : state.currentService,
        loading: false,
        error: null
      }));

      return true;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Funciones de filtrado y búsqueda
  getFilteredServices: () => {
    const { services, filters } = get();
    // Asegurarse de que services es un array
    const servicesArray = Array.isArray(services) ? services : [];
    let filteredServices = [...servicesArray];

    // Aplicar filtros
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredServices = filteredServices.filter(service =>
        service.name.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.serviceType) {
      filteredServices = filteredServices.filter(service =>
        service.serviceType === filters.serviceType
      );
    }

    if (filters.category) {
      filteredServices = filteredServices.filter(service =>
        service.category === filters.category
      );
    }

    if (filters.isActive !== '') {
      const isActive = filters.isActive === 'true';
      filteredServices = filteredServices.filter(service =>
        service.isActive === isActive
      );
    }

    // Aplicar ordenamiento
    filteredServices.sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filteredServices;
  },

  getServicesByType: (serviceType) => {
    const { services } = get();
    const servicesArray = Array.isArray(services) ? services : [];
    return servicesArray.filter(service => service.serviceType === serviceType);
  },

  getActiveServices: () => {
    const { services } = get();
    const servicesArray = Array.isArray(services) ? services : [];
    return servicesArray.filter(service => service.isActive);
  },

  getAvailableServices: () => {
    const { services } = get();
    const servicesArray = Array.isArray(services) ? services : [];
    return servicesArray.filter(service => service.isActive && service.isAvailable);
  },

  // Gestión de filtros
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        search: '',
        serviceType: '',
        category: '',
        isActive: '',
        sortBy: 'name',
        sortOrder: 'asc'
      }
    });
  },

  // Gestión de servicio actual
  setCurrentService: (service) => {
    set({ currentService: service });
  },

  clearCurrentService: () => {
    set({ currentService: null });
  },

  // Gestión de errores
  clearError: () => {
    set({ error: null });
  },

  // Estadísticas
  getServiceStats: () => {
    const { services } = get();
    const servicesArray = Array.isArray(services) ? services : [];

    const stats = {
      total: servicesArray.length,
      active: servicesArray.filter(s => s.isActive).length,
      inactive: servicesArray.filter(s => !s.isActive).length,
      internet: servicesArray.filter(s => s.serviceType === 'internet').length,
      cable: servicesArray.filter(s => s.serviceType === 'cable').length,
      basic: servicesArray.filter(s => s.category === 'basic').length,
      standard: servicesArray.filter(s => s.category === 'standard').length,
      premium: servicesArray.filter(s => s.category === 'premium').length
    };

    return stats;
  },

  // Inicializar servicios por defecto (deprecated - ahora se hace desde el backend)
  initializeDefaultServices: async () => {
    // Esta función ahora simplemente llama a fetchServices
    // Los servicios por defecto deben estar en el backend (db.json)
    console.warn('initializeDefaultServices is deprecated - services should be seeded in backend');
    await get().fetchServices();
  }
}));
