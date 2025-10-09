/**
 * Notification Store - REFACTORIZADO para usar API REST
 */

import { create } from 'zustand';
import { notificationsApi } from '../services/api';

export const useNotificationStore = create((set, get) => ({
  // Estado
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  /**
   * Obtener todas las notificaciones del usuario
   */
  fetchNotifications: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      const notifications = await notificationsApi.getByUser(userId);

      const unreadCount = notifications.filter((n) => !n.isRead).length;

      set({
        notifications,
        unreadCount,
        isLoading: false,
        error: null
      });

      return { success: true, data: notifications };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar notificaciones'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener notificaciones no leídas
   */
  fetchUnreadNotifications: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      const notifications = await notificationsApi.getUnread(userId);

      set({
        notifications,
        unreadCount: notifications.length,
        isLoading: false,
        error: null
      });

      return { success: true, data: notifications };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar notificaciones no leídas'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Crear nueva notificación
   */
  createNotification: async (notificationData) => {
    set({ isLoading: true, error: null });

    try {
      const newNotification = await notificationsApi.create(notificationData);

      set((state) => ({
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        isLoading: false,
        error: null
      }));

      return { success: true, data: newNotification };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al crear notificación'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Marcar notificación como leída
   */
  markAsRead: async (id) => {
    try {
      const updated = await notificationsApi.markAsRead(id);

      set((state) => ({
        notifications: state.notifications.map((notif) =>
          notif.id === id ? updated : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));

      return { success: true, data: updated };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Marcar todas como leídas
   */
  markAllAsRead: async (userId) => {
    set({ isLoading: true, error: null });

    try {
      await notificationsApi.markAllAsRead(userId);

      set((state) => ({
        notifications: state.notifications.map((notif) => ({
          ...notif,
          isRead: true
        })),
        unreadCount: 0,
        isLoading: false,
        error: null
      }));

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al marcar todas como leídas'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Eliminar notificación
   */
  deleteNotification: async (id) => {
    try {
      await notificationsApi.delete(id);

      set((state) => {
        const notification = state.notifications.find((n) => n.id === id);
        const wasUnread = notification && !notification.isRead;

        return {
          notifications: state.notifications.filter((notif) => notif.id !== id),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
        };
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar contador de no leídas
   */
  updateUnreadCount: async (userId) => {
    try {
      const count = await notificationsApi.getUnreadCount(userId);
      set({ unreadCount: count });
      return count;
    } catch (error) {
      console.error('Error al actualizar contador:', error);
      return 0;
    }
  },

  /**
   * Obtener notificaciones por tipo
   */
  fetchByType: async (userId, type) => {
    set({ isLoading: true, error: null });

    try {
      const notifications = await notificationsApi.getByType(userId, type);

      set({
        notifications,
        isLoading: false,
        error: null
      });

      return { success: true, data: notifications };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar notificaciones por tipo'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Limpiar notificaciones
   */
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  }
}));

export default useNotificationStore;
