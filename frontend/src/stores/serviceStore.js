// Store de servicios - gestión de servicios de la empresa
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  createService, 
  updateService, 
  validateService,
  ServiceDefaults 
} from '../services/mock/schemas/service.js';

export const useServiceStore = create(
  persist(
    (set, get) => ({
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
          // En una app real, esto sería una llamada a la API
          const { services } = get();
          
          // Simular latencia
          await new Promise(resolve => setTimeout(resolve, 300));
          
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
          
          // Verificar que no exista un servicio con el mismo nombre y tipo
          const { services } = get();
          const existingService = services.find(s => 
            s.name.toLowerCase() === serviceData.name.toLowerCase() && 
            s.serviceType === serviceData.serviceType &&
            s.category === serviceData.category
          );
          
          if (existingService) {
            throw new Error('Ya existe un servicio con el mismo nombre, tipo y categoría');
          }
          
          const newService = createService(serviceData, createdBy);
          
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
          
          const updatedService = updateService(existingService, updates);
          
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
        let filteredServices = [...services];
        
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
        return services.filter(service => service.serviceType === serviceType);
      },

      getActiveServices: () => {
        const { services } = get();
        return services.filter(service => service.isActive);
      },

      getAvailableServices: () => {
        const { services } = get();
        return services.filter(service => service.isActive && service.isAvailable);
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
        
        const stats = {
          total: services.length,
          active: services.filter(s => s.isActive).length,
          inactive: services.filter(s => !s.isActive).length,
          internet: services.filter(s => s.serviceType === 'internet').length,
          cable: services.filter(s => s.serviceType === 'cable').length,
          basic: services.filter(s => s.category === 'basic').length,
          standard: services.filter(s => s.category === 'standard').length,
          premium: services.filter(s => s.category === 'premium').length
        };
        
        return stats;
      },

      // Inicializar servicios por defecto
      initializeDefaultServices: () => {
        const { services } = get();
        
        if (services.length === 0) {
          const defaultServices = [
            {
              id: 'service-internet-basic',
              name: 'Internet Básico',
              description: 'Plan de internet básico para uso doméstico',
              serviceType: 'internet',
              category: 'basic',
              price: 80,
              features: {
                speed: '50 Mbps',
                bandwidth: 'Ilimitado',
                channels: 0,
                extras: ['WiFi incluido', 'Instalación gratis']
              },
              isActive: true,
              isAvailable: true,
              installationFee: 0,
              contractDuration: 12,
              createdBy: 'admin-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'service-internet-standard',
              name: 'Internet Estándar',
              description: 'Plan de internet estándar con mayor velocidad',
              serviceType: 'internet',
              category: 'standard',
              price: 120,
              features: {
                speed: '100 Mbps',
                bandwidth: 'Ilimitado',
                channels: 0,
                extras: ['WiFi incluido', 'Instalación gratis', 'Soporte técnico 24/7']
              },
              isActive: true,
              isAvailable: true,
              installationFee: 0,
              contractDuration: 12,
              createdBy: 'admin-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'service-internet-premium',
              name: 'Internet Premium',
              description: 'Plan de internet premium con máxima velocidad',
              serviceType: 'internet',
              category: 'premium',
              price: 160,
              features: {
                speed: '200 Mbps',
                bandwidth: 'Ilimitado',
                channels: 0,
                extras: ['WiFi incluido', 'Instalación gratis', 'Soporte técnico 24/7', 'IP estática']
              },
              isActive: true,
              isAvailable: true,
              installationFee: 0,
              contractDuration: 12,
              createdBy: 'admin-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'service-cable-basic',
              name: 'Cable Básico',
              description: 'Paquete básico de televisión por cable',
              serviceType: 'cable',
              category: 'basic',
              price: 80,
              features: {
                speed: '',
                bandwidth: '',
                channels: 50,
                extras: ['Decodificador incluido', 'Canales nacionales']
              },
              isActive: true,
              isAvailable: true,
              installationFee: 50,
              contractDuration: 12,
              createdBy: 'admin-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'service-cable-standard',
              name: 'Cable Estándar',
              description: 'Paquete estándar con canales HD',
              serviceType: 'cable',
              category: 'standard',
              price: 120,
              features: {
                speed: '',
                bandwidth: '',
                channels: 100,
                extras: ['Decodificador HD', 'Canales nacionales e internacionales', 'Netflix incluido']
              },
              isActive: true,
              isAvailable: true,
              installationFee: 50,
              contractDuration: 12,
              createdBy: 'admin-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'service-cable-premium',
              name: 'Cable Premium',
              description: 'Paquete premium con todos los canales',
              serviceType: 'cable',
              category: 'premium',
              price: 160,
              features: {
                speed: '',
                bandwidth: '',
                channels: 200,
                extras: ['Decodificador 4K', 'Todos los canales', 'Netflix y Prime Video', 'Grabador digital']
              },
              isActive: true,
              isAvailable: true,
              installationFee: 100,
              contractDuration: 12,
              createdBy: 'admin-1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          
          set({ services: defaultServices });
        }
      }
    }),
    {
      name: 'tv-cable-services',
      partialize: (state) => ({
        services: state.services
      })
    }
  )
);