/**
 * Voucher Store - REFACTORIZADO para usar API REST
 *
 * Maneja la subida y validación de comprobantes de pago
 */

import { create } from 'zustand';
import { apiClient } from '../services/api';

export const useVoucherStore = create((set, get) => ({
  // Estado
  vouchers: [],
  currentVoucher: null,
  pendingVouchers: [],
  isLoading: false,
  isUploading: false,
  error: null,
  filters: {
    status: 'all',
    clientId: null
  },

  // ============================================
  // ACCIONES - Gestión de Vouchers
  // ============================================

  /**
   * Obtener todos los vouchers
   */
  fetchVouchers: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `/vouchers?${queryString}` : '/vouchers';
      const vouchers = await apiClient.get(endpoint);

      set({
        vouchers,
        isLoading: false,
        error: null
      });

      return { success: true, data: vouchers };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar comprobantes'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener voucher por ID
   */
  fetchVoucherById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const voucher = await apiClient.get(`/vouchers/${id}`);

      set({
        currentVoucher: voucher,
        isLoading: false,
        error: null
      });

      return { success: true, data: voucher };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar comprobante'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Subir nuevo voucher (Cliente)
   */
  uploadVoucher: async (voucherData) => {
    set({ isUploading: true, error: null });

    try {
      const newVoucher = await apiClient.post('/vouchers', {
        ...voucherData,
        uploadDate: new Date().toISOString(),
        status: 'pending'
      });

      set((state) => ({
        vouchers: [newVoucher, ...state.vouchers],
        isUploading: false,
        error: null
      }));

      return { success: true, data: newVoucher };
    } catch (error) {
      set({
        isUploading: false,
        error: error.message || 'Error al subir comprobante'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Validar voucher (Admin/SubAdmin)
   */
  validateVoucher: async (id, validationData) => {
    set({ isLoading: true, error: null });

    try {
      const { status, validatedBy, comments } = validationData;

      const updated = await apiClient.patch(`/vouchers/${id}`, {
        status, // 'validated' o 'rejected'
        validatedBy,
        validatedAt: new Date().toISOString(),
        validationComments: comments
      });

      set((state) => ({
        vouchers: state.vouchers.map((voucher) =>
          voucher.id === id ? updated : voucher
        ),
        pendingVouchers: state.pendingVouchers.filter((v) => v.id !== id),
        currentVoucher: state.currentVoucher?.id === id ? updated : state.currentVoucher,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updated };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al validar comprobante'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Aprobar voucher
   */
  approveVoucher: async (id, validatedBy) => {
    return get().validateVoucher(id, {
      status: 'validated',
      validatedBy,
      comments: 'Comprobante aprobado'
    });
  },

  /**
   * Rechazar voucher
   */
  rejectVoucher: async (id, validatedBy, reason) => {
    return get().validateVoucher(id, {
      status: 'rejected',
      validatedBy,
      comments: reason || 'Comprobante rechazado'
    });
  },

  /**
   * Obtener vouchers pendientes de validación
   */
  fetchPendingVouchers: async () => {
    set({ isLoading: true, error: null });

    try {
      const vouchers = await apiClient.get('/vouchers?status=pending');

      set({
        pendingVouchers: vouchers,
        isLoading: false,
        error: null
      });

      return { success: true, data: vouchers };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar comprobantes pendientes'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener vouchers por cliente
   */
  fetchByClient: async (clientId) => {
    set({ isLoading: true, error: null });

    try {
      const vouchers = await apiClient.get(`/vouchers?clientId=${clientId}`);

      set({
        vouchers,
        isLoading: false,
        error: null
      });

      return { success: true, data: vouchers };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar comprobantes del cliente'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener vouchers por pago
   */
  fetchByPayment: async (paymentId) => {
    set({ isLoading: true, error: null });

    try {
      const vouchers = await apiClient.get(`/vouchers?paymentId=${paymentId}`);

      set({
        vouchers,
        isLoading: false,
        error: null
      });

      return { success: true, data: vouchers };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar comprobantes del pago'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Eliminar voucher
   */
  deleteVoucher: async (id) => {
    set({ isLoading: true, error: null });

    try {
      await apiClient.delete(`/vouchers/${id}`);

      set((state) => ({
        vouchers: state.vouchers.filter((voucher) => voucher.id !== id),
        currentVoucher: state.currentVoucher?.id === id ? null : state.currentVoucher,
        isLoading: false,
        error: null
      }));

      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al eliminar comprobante'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  // ============================================
  // HELPERS Y UTILIDADES
  // ============================================

  /**
   * Actualizar filtros
   */
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters }
    }));
  },

  /**
   * Obtener vouchers filtrados
   */
  getFilteredVouchers: () => {
    const { vouchers, filters } = get();

    return vouchers.filter((voucher) => {
      // Filtro por estado
      if (filters.status !== 'all' && voucher.status !== filters.status) {
        return false;
      }

      // Filtro por cliente
      if (filters.clientId && voucher.clientId !== filters.clientId) {
        return false;
      }

      return true;
    });
  },

  /**
   * Calcular estadísticas de vouchers
   */
  getStatistics: () => {
    const { vouchers } = get();

    return {
      total: vouchers.length,
      pending: vouchers.filter((v) => v.status === 'pending').length,
      validated: vouchers.filter((v) => v.status === 'validated').length,
      rejected: vouchers.filter((v) => v.status === 'rejected').length
    };
  },

  /**
   * Verificar si cliente puede subir voucher
   */
  canUploadVoucher: (clientId, paymentId) => {
    const { vouchers } = get();

    // No puede si ya tiene un voucher pendiente para este pago
    const existingVoucher = vouchers.find(
      (v) =>
        v.clientId === clientId &&
        v.paymentId === paymentId &&
        v.status === 'pending'
    );

    return !existingVoucher;
  },

  /**
   * Limpiar voucher actual
   */
  clearCurrentVoucher: () => {
    set({ currentVoucher: null });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  }
}));

export default useVoucherStore;
