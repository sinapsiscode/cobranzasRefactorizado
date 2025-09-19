// Store de notificaciones - cola de notificaciones
import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  // Estado
  notifications: [],
  maxNotifications: 5,

  // Acciones
  addNotification: (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      type: 'info', // info, success, warning, error
      title: '',
      message: '',
      duration: 5000, // 5 segundos por defecto
      autoClose: true,
      actions: [],
      ...notification,
      timestamp: new Date().toISOString()
    };

    set(state => {
      const notifications = [newNotification, ...state.notifications];
      
      // Limitar cantidad de notificaciones
      if (notifications.length > state.maxNotifications) {
        notifications.splice(state.maxNotifications);
      }
      
      return { notifications };
    });

    // Auto-eliminar si está habilitado
    if (newNotification.autoClose && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  updateNotification: (id, updates) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, ...updates } : n
      )
    }));
  },

  // Métodos de conveniencia
  success: (message, options = {}) => {
    return get().addNotification({
      type: 'success',
      title: 'Éxito',
      message,
      ...options
    });
  },

  error: (message, options = {}) => {
    return get().addNotification({
      type: 'error',
      title: 'Error',
      message,
      duration: 8000, // Errores duran más tiempo
      ...options
    });
  },

  warning: (message, options = {}) => {
    return get().addNotification({
      type: 'warning',
      title: 'Advertencia',
      message,
      ...options
    });
  },

  info: (message, options = {}) => {
    return get().addNotification({
      type: 'info',
      title: 'Información',
      message,
      ...options
    });
  },

  // Notificaciones específicas del negocio
  paymentCreated: (clientName, amount) => {
    return get().success(
      `Pago de S/ ${amount} registrado para ${clientName}`,
      { title: 'Pago Registrado' }
    );
  },

  paymentUpdated: (clientName) => {
    return get().success(
      `Pago actualizado para ${clientName}`,
      { title: 'Pago Actualizado' }
    );
  },

  clientCreated: (clientName) => {
    return get().success(
      `Cliente ${clientName} creado exitosamente`,
      { title: 'Cliente Creado' }
    );
  },

  clientUpdated: (clientName) => {
    return get().success(
      `Cliente ${clientName} actualizado exitosamente`,
      { title: 'Cliente Actualizado' }
    );
  },

  clientDeleted: (clientName) => {
    return get().warning(
      `Cliente ${clientName} eliminado`,
      { title: 'Cliente Eliminado' }
    );
  },

  connectionError: () => {
    return get().error(
      'Error de conexión. Verifique su conexión a internet.',
      { 
        title: 'Sin Conexión',
        duration: 10000,
        actions: [{
          label: 'Reintentar',
          action: () => window.location.reload()
        }]
      }
    );
  },

  sessionExpired: () => {
    return get().warning(
      'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
      { 
        title: 'Sesión Expirada',
        autoClose: false,
        actions: [{
          label: 'Iniciar Sesión',
          action: () => {
            // Redirigir al login
            window.location.href = '/login';
          }
        }]
      }
    );
  },

  offlineMode: () => {
    return get().info(
      'Modo offline activado. Los cambios se sincronizarán cuando recupere la conexión.',
      { 
        title: 'Modo Offline',
        duration: 8000
      }
    );
  },

  syncCompleted: (itemsCount) => {
    return get().success(
      `${itemsCount} elementos sincronizados exitosamente`,
      { 
        title: 'Sincronización Completa',
        duration: 3000
      }
    );
  },

  // Getters
  getNotificationCount: () => {
    const { notifications } = get();
    return notifications.length;
  },

  hasNotifications: () => {
    const { notifications } = get();
    return notifications.length > 0;
  },

  getNotificationsByType: (type) => {
    const { notifications } = get();
    return notifications.filter(n => n.type === type);
  },

  getUnreadCount: () => {
    const { notifications } = get();
    return notifications.filter(n => !n.read).length;
  },

  markAsRead: (id) => {
    get().updateNotification(id, { read: true });
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  }
}));