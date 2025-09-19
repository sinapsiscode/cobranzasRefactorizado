// Store para datos extendidos del cliente
import { create } from 'zustand';
import { clientExtendedSchema, getEffectiveCost } from '../services/mock/schemas/clientExtended';

export const useClientExtendedStore = create((set, get) => ({
  // Estado
  extendedData: {},  // { clientId: extendedDataObject }
  loading: false,
  error: null,
  
  // Acciones CRUD
  getExtendedData: (clientId) => {
    const { extendedData } = get();
    return extendedData[clientId] || null;
  },
  
  setExtendedData: (clientId, data) => {
    set(state => ({
      extendedData: {
        ...state.extendedData,
        [clientId]: {
          ...clientExtendedSchema,
          ...data,
          clientId,
          id: data.id || clientExtendedSchema.id(),
          createdAt: data.createdAt || new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      }
    }));
  },
  
  updateExtendedData: (clientId, updates) => {
    set(state => ({
      extendedData: {
        ...state.extendedData,
        [clientId]: {
          ...state.extendedData[clientId],
          ...updates,
          lastModified: new Date().toISOString()
        }
      }
    }));
  },
  
  deleteExtendedData: (clientId) => {
    set(state => {
      const newData = { ...state.extendedData };
      delete newData[clientId];
      return { extendedData: newData };
    });
  },
  
  // Importación masiva
  bulkSetExtendedData: (dataArray) => {
    const newExtendedData = {};
    
    dataArray.forEach(data => {
      newExtendedData[data.clientId] = {
        ...clientExtendedSchema,
        ...data,
        id: data.id || clientExtendedSchema.id(),
        createdAt: data.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
    });
    
    set(state => ({
      extendedData: {
        ...state.extendedData,
        ...newExtendedData
      }
    }));
  },
  
  // Obtener costo efectivo de un cliente
  getClientEffectiveCost: (clientId, clientData) => {
    const extendedData = get().getExtendedData(clientId);
    return getEffectiveCost(clientData, extendedData);
  },
  
  // Obtener clientes por tipo de tarifa
  getClientsByTariffType: (type) => {
    const { extendedData } = get();
    return Object.values(extendedData).filter(data => data.tipoTarifa === type);
  },
  
  // Estadísticas
  getExtendedStats: () => {
    const { extendedData } = get();
    const allData = Object.values(extendedData);
    
    return {
      total: allData.length,
      standard: allData.filter(d => d.tipoTarifa === 'standard').length,
      legacy: allData.filter(d => d.tipoTarifa === 'legacy').length,
      gratuitous: allData.filter(d => d.tipoTarifa === 'gratuitous').length,
      withInstallationCost: allData.filter(d => d.costoInstalacion > 0).length,
      imported: allData.filter(d => d.importedFrom === 'excel').length
    };
  },
  
  // Limpiar store
  clearExtendedData: () => {
    set({ extendedData: {}, loading: false, error: null });
  },
  
  // Persistencia local
  saveToLocalStorage: () => {
    const { extendedData } = get();
    localStorage.setItem('tv-cable:extended-data', JSON.stringify(extendedData));
  },
  
  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem('tv-cable:extended-data');
      if (stored) {
        const extendedData = JSON.parse(stored);
        set({ extendedData });
      }
    } catch (error) {
      console.error('Error loading extended data from localStorage:', error);
    }
  }
}))