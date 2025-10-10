// Store para datos extendidos del cliente
import { create } from 'zustand';
import { clientExtendedSchema, getEffectiveCost } from '../schemas/clientExtended';

const API_URL = '/api';

export const useClientExtendedStore = create((set, get) => ({
  // Estado
  extendedData: {},  // { clientId: extendedDataObject }
  loading: false,
  error: null,

  // Cargar datos extendidos desde la API
  fetchExtendedData: async (clientId = null) => {
    set({ loading: true, error: null });

    try {
      const url = clientId
        ? `${API_URL}/client-extended?clientId=${clientId}`
        : `${API_URL}/client-extended`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch extended data: ${response.statusText}`);
      }

      const dataArray = await response.json();

      // Convertir array de API a objeto { clientId: data }
      const extendedDataObj = {};
      dataArray.forEach(item => {
        extendedDataObj[item.clientId] = item;
      });

      if (clientId) {
        // Si es un clientId específico, actualizar solo ese
        set(state => ({
          extendedData: {
            ...state.extendedData,
            ...extendedDataObj
          },
          loading: false
        }));
      } else {
        // Si es fetch completo, reemplazar todo
        set({
          extendedData: extendedDataObj,
          loading: false
        });
      }

      return extendedDataObj;
    } catch (error) {
      console.error('Error fetching extended data:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Acciones CRUD
  getExtendedData: (clientId) => {
    const { extendedData } = get();
    return extendedData[clientId] || null;
  },

  setExtendedData: async (clientId, data) => {
    set({ loading: true, error: null });

    try {
      const payload = {
        ...clientExtendedSchema,
        ...data,
        clientId,
        id: data.id || clientExtendedSchema.id(),
        createdAt: data.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/client-extended`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to create extended data: ${response.statusText}`);
      }

      const savedData = await response.json();

      set(state => ({
        extendedData: {
          ...state.extendedData,
          [clientId]: savedData
        },
        loading: false
      }));

      return savedData;
    } catch (error) {
      console.error('Error creating extended data:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateExtendedData: async (clientId, updates) => {
    set({ loading: true, error: null });

    try {
      const payload = {
        ...updates,
        lastModified: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/client-extended/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to update extended data: ${response.statusText}`);
      }

      const updatedData = await response.json();

      set(state => ({
        extendedData: {
          ...state.extendedData,
          [clientId]: updatedData
        },
        loading: false
      }));

      return updatedData;
    } catch (error) {
      console.error('Error updating extended data:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteExtendedData: async (clientId) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/client-extended/${clientId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete extended data: ${response.statusText}`);
      }

      set(state => {
        const newData = { ...state.extendedData };
        delete newData[clientId];
        return { extendedData: newData, loading: false };
      });
    } catch (error) {
      console.error('Error deleting extended data:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Importación masiva
  bulkSetExtendedData: async (dataArray) => {
    set({ loading: true, error: null });

    try {
      const payload = dataArray.map(data => ({
        ...clientExtendedSchema,
        ...data,
        id: data.id || clientExtendedSchema.id(),
        createdAt: data.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString()
      }));

      const response = await fetch(`${API_URL}/client-extended/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk import extended data: ${response.statusText}`);
      }

      const savedDataArray = await response.json();

      // Convertir array a objeto para el estado
      const newExtendedData = {};
      savedDataArray.forEach(data => {
        newExtendedData[data.clientId] = data;
      });

      set(state => ({
        extendedData: {
          ...state.extendedData,
          ...newExtendedData
        },
        loading: false
      }));

      return savedDataArray;
    } catch (error) {
      console.error('Error bulk importing extended data:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
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
  }
}));
