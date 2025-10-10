import { create } from 'zustand';

const API_URL = '/api';

export const useAlertStore = create((set, get) => ({
  // Estado
  alerts: [],
  loading: false,
  error: null,

  // Cargar alertas desde la API
  fetchAlerts: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/notifications`);

      if (!response.ok) {
        throw new Error('Error al cargar alertas');
      }

      const alerts = await response.json();

      set({
        alerts: alerts.filter(a => a.type === 'cash_box_closing' || a.type === 'alert'),
        loading: false
      });

      return alerts;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Acciones
  createCashBoxClosingAlert: async (collectors = [], message = null, createdBy = null) => {
    set({ loading: true, error: null });

    try {
      const defaultMessage = 'Recordatorio: Es hora de cerrar tu caja semanal. Por favor, procede a cerrar tu caja y envía el reporte correspondiente.';

      const newAlert = {
        type: 'cash_box_closing',
        title: 'Recordatorio de Cierre de Caja',
        message: message || defaultMessage,
        targetCollectors: collectors, // Array de IDs de cobradores
        createdBy: createdBy,
        createdAt: new Date().toISOString(),
        isActive: true,
        acknowledged: {}, // Objeto con collectorId: timestamp de acknowledgment
        priority: 'high',
        persistent: true, // No se cierra automáticamente
        autoClose: false,
      };

      const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAlert)
      });

      if (!response.ok) {
        throw new Error('Error al crear alerta');
      }

      const savedAlert = await response.json();

      set(state => ({
        alerts: [...state.alerts, savedAlert],
        loading: false
      }));

      return savedAlert.id;
    } catch (error) {
      console.error('Error creating alert:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  acknowledgeAlert: async (alertId, collectorId) => {
    set({ loading: true, error: null });

    try {
      const alert = get().alerts.find(a => a.id === alertId);

      if (!alert) {
        throw new Error('Alerta no encontrada');
      }

      const updatedAcknowledged = {
        ...alert.acknowledged,
        [collectorId]: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/notifications/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acknowledged: updatedAcknowledged
        })
      });

      if (!response.ok) {
        throw new Error('Error al reconocer alerta');
      }

      const updatedAlert = await response.json();

      set(state => ({
        alerts: state.alerts.map(a =>
          a.id === alertId ? updatedAlert : a
        ),
        loading: false
      }));

      return updatedAlert;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  dismissAlert: async (alertId, collectorId = null) => {
    if (collectorId) {
      // Solo marcar como reconocida para un cobrador específico
      return get().acknowledgeAlert(alertId, collectorId);
    } else {
      // Eliminar la alerta completamente (solo admin)
      set({ loading: true, error: null });

      try {
        const response = await fetch(`${API_URL}/notifications/${alertId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Error al eliminar alerta');
        }

        set(state => ({
          alerts: state.alerts.filter(alert => alert.id !== alertId),
          loading: false
        }));
      } catch (error) {
        console.error('Error dismissing alert:', error);
        set({ error: error.message, loading: false });
        throw error;
      }
    }
  },

  getActiveAlertsForCollector: (collectorId) => {
    const { alerts } = get();
    return alerts.filter(alert =>
      alert.isActive &&
      (alert.targetCollectors.includes(collectorId) || alert.targetCollectors.length === 0) &&
      !alert.acknowledged[collectorId]
    );
  },

  getAllActiveAlerts: () => {
    const { alerts } = get();
    return alerts.filter(alert => alert.isActive);
  },

  getAlertsHistory: () => {
    const { alerts } = get();
    return alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  clearOldAlerts: async (daysOld = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { alerts } = get();
    const alertsToDelete = alerts.filter(alert => {
      const alertDate = new Date(alert.createdAt);
      return alertDate <= cutoffDate && !alert.isActive;
    });

    try {
      // Eliminar alertas antiguas del backend
      await Promise.all(
        alertsToDelete.map(alert =>
          fetch(`${API_URL}/notifications/${alert.id}`, { method: 'DELETE' })
        )
      );

      // Actualizar estado local
      set(state => ({
        alerts: state.alerts.filter(alert => {
          const alertDate = new Date(alert.createdAt);
          return alertDate > cutoffDate || alert.isActive;
        })
      }));
    } catch (error) {
      console.error('Error clearing old alerts:', error);
    }
  },

  // Marcar alerta como inactiva (para historial)
  deactivateAlert: async (alertId) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/notifications/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: false
        })
      });

      if (!response.ok) {
        throw new Error('Error al desactivar alerta');
      }

      const updatedAlert = await response.json();

      set(state => ({
        alerts: state.alerts.map(alert =>
          alert.id === alertId ? updatedAlert : alert
        ),
        loading: false
      }));

      return updatedAlert;
    } catch (error) {
      console.error('Error deactivating alert:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Obtener estadísticas de una alerta
  getAlertStats: (alertId) => {
    const { alerts } = get();
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) return null;

    const totalCollectors = alert.targetCollectors.length;
    const acknowledgedCollectors = Object.keys(alert.acknowledged).length;
    const pendingCollectors = totalCollectors - acknowledgedCollectors;

    return {
      total: totalCollectors,
      acknowledged: acknowledgedCollectors,
      pending: pendingCollectors,
      acknowledgmentRate: totalCollectors > 0 ? (acknowledgedCollectors / totalCollectors) * 100 : 0
    };
  },

  // Limpiar todas las alertas (solo para admin)
  clearAllAlerts: async () => {
    set({ loading: true, error: null });

    try {
      const { alerts } = get();

      // Eliminar todas las alertas del backend
      await Promise.all(
        alerts.map(alert =>
          fetch(`${API_URL}/notifications/${alert.id}`, { method: 'DELETE' })
        )
      );

      set({ alerts: [], loading: false });
    } catch (error) {
      console.error('Error clearing all alerts:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  }
}));
