import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAlertStore = create(
  persist(
    (set, get) => ({
      // Estado
      alerts: [],
      
      // Acciones
      createCashBoxClosingAlert: (collectors = [], message = null, createdBy = null) => {
        const alertId = Date.now().toString();
        const defaultMessage = 'Recordatorio: Es hora de cerrar tu caja semanal. Por favor, procede a cerrar tu caja y envía el reporte correspondiente.';
        
        const newAlert = {
          id: alertId,
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

        set(state => ({
          alerts: [...state.alerts, newAlert]
        }));

        return alertId;
      },

      acknowledgeAlert: (alertId, collectorId) => {
        set(state => ({
          alerts: state.alerts.map(alert =>
            alert.id === alertId
              ? {
                  ...alert,
                  acknowledged: {
                    ...alert.acknowledged,
                    [collectorId]: new Date().toISOString()
                  }
                }
              : alert
          )
        }));
      },

      dismissAlert: (alertId, collectorId = null) => {
        if (collectorId) {
          // Solo marcar como reconocida para un cobrador específico
          get().acknowledgeAlert(alertId, collectorId);
        } else {
          // Eliminar la alerta completamente (solo admin)
          set(state => ({
            alerts: state.alerts.filter(alert => alert.id !== alertId)
          }));
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

      clearOldAlerts: (daysOld = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        set(state => ({
          alerts: state.alerts.filter(alert => {
            const alertDate = new Date(alert.createdAt);
            return alertDate > cutoffDate || alert.isActive;
          })
        }));
      },

      // Marcar alerta como inactiva (para historial)
      deactivateAlert: (alertId) => {
        set(state => ({
          alerts: state.alerts.map(alert =>
            alert.id === alertId
              ? { ...alert, isActive: false }
              : alert
          )
        }));
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
      clearAllAlerts: () => {
        set({ alerts: [] });
      }
    }),
    {
      name: 'alert-storage',
      getStorage: () => localStorage,
    }
  )
);