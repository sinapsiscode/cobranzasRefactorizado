/**
 * CashBox Store - REFACTORIZADO para usar API REST
 *
 * Store más complejo que maneja:
 * - Solicitudes de caja
 * - Aprobación/Rechazo por SubAdmin
 * - Registro de transacciones
 * - Cierre de caja
 * - Cálculos de efectivo y digital
 */

import { create } from 'zustand';
import { cashBoxApi } from '../services/api';

export const useCashBoxStore = create((set, get) => ({
  // Estado
  requests: [],
  currentRequest: null,
  pendingRequests: [],
  isLoading: false,
  error: null,

  // ============================================
  // ACCIONES - Solicitudes de Caja
  // ============================================

  /**
   * Obtener todas las solicitudes
   */
  fetchRequests: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const requests = await cashBoxApi.getAllRequests(params);

      set({
        requests,
        isLoading: false,
        error: null
      });

      return { success: true, data: requests };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar solicitudes'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener solicitud por ID
   */
  fetchRequestById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const request = await cashBoxApi.getRequestById(id);

      set({
        currentRequest: request,
        isLoading: false,
        error: null
      });

      return { success: true, data: request };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar solicitud'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Crear nueva solicitud de caja (Cobrador)
   */
  createRequest: async (requestData) => {
    set({ isLoading: true, error: null });

    try {
      const newRequest = await cashBoxApi.createRequest(requestData);

      set((state) => ({
        requests: [...state.requests, newRequest],
        currentRequest: newRequest,
        isLoading: false,
        error: null
      }));

      return { success: true, data: newRequest };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al crear solicitud'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Aprobar solicitud (SubAdmin)
   */
  approveRequest: async (id, approvalData) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await cashBoxApi.approveRequest(id, approvalData);

      set((state) => ({
        requests: state.requests.map((req) =>
          req.id === id ? updated : req
        ),
        pendingRequests: state.pendingRequests.filter((req) => req.id !== id),
        currentRequest: state.currentRequest?.id === id ? updated : state.currentRequest,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updated };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al aprobar solicitud'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Rechazar solicitud (SubAdmin)
   */
  rejectRequest: async (id, reason) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await cashBoxApi.rejectRequest(id, reason);

      set((state) => ({
        requests: state.requests.map((req) =>
          req.id === id ? updated : req
        ),
        pendingRequests: state.pendingRequests.filter((req) => req.id !== id),
        currentRequest: state.currentRequest?.id === id ? updated : state.currentRequest,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updated };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al rechazar solicitud'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener solicitudes pendientes (SubAdmin)
   */
  fetchPendingRequests: async () => {
    set({ isLoading: true, error: null });

    try {
      const requests = await cashBoxApi.getPendingRequests();

      set({
        pendingRequests: requests,
        isLoading: false,
        error: null
      });

      return { success: true, data: requests };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar solicitudes pendientes'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener solicitudes por cobrador
   */
  fetchByCollector: async (collectorId) => {
    set({ isLoading: true, error: null });

    try {
      const requests = await cashBoxApi.getByCollector(collectorId);

      set({
        requests,
        isLoading: false,
        error: null
      });

      return { success: true, data: requests };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar solicitudes del cobrador'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener solicitudes por fecha
   */
  fetchByDate: async (date) => {
    set({ isLoading: true, error: null });

    try {
      const requests = await cashBoxApi.getByDate(date);

      set({
        requests,
        isLoading: false,
        error: null
      });

      return { success: true, data: requests };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar solicitudes por fecha'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Cerrar caja (Cobrador al final del día)
   */
  closeCashBox: async (id, closureData) => {
    set({ isLoading: true, error: null });

    try {
      const updated = await cashBoxApi.closeCashBox(id, closureData);

      set((state) => ({
        requests: state.requests.map((req) =>
          req.id === id ? updated : req
        ),
        currentRequest: state.currentRequest?.id === id ? updated : state.currentRequest,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updated };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cerrar caja'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  // ============================================
  // HELPERS - Cálculos y Validaciones
  // ============================================

  /**
   * Calcular totales de caja
   */
  calculateTotals: (request) => {
    if (!request) return null;

    const initial = request.approvedInitialCash || request.requestedInitialCash;
    const transactions = request.transactions || [];

    // Calcular efectivo
    const cashIn = transactions
      .filter((t) => t.type === 'cash' && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const cashOut = transactions
      .filter((t) => t.type === 'cash' && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalCash = (initial.efectivo || 0) + cashIn - cashOut;

    // Calcular digital
    const digitalIn = transactions
      .filter((t) => ['yape', 'plin', 'transferencia'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDigital = (initial.digital?.yape || 0) +
                        (initial.digital?.plin || 0) +
                        (initial.digital?.transferencia || 0) +
                        (initial.digital?.otros || 0) +
                        digitalIn;

    return {
      initialCash: initial.efectivo || 0,
      initialDigital: (initial.digital?.yape || 0) +
                     (initial.digital?.plin || 0) +
                     (initial.digital?.transferencia || 0) +
                     (initial.digital?.otros || 0),
      cashIn,
      cashOut,
      digitalIn,
      totalCash,
      totalDigital,
      grandTotal: totalCash + totalDigital
    };
  },

  /**
   * Validar si puede cerrar caja
   */
  canCloseCashBox: (request) => {
    if (!request) return false;

    // Solo puede cerrar si está aprobada y no está cerrada
    return request.status === 'approved' && !request.closedAt;
  },

  /**
   * Obtener resumen del día
   */
  getDaySummary: (requests) => {
    const dayRequests = requests.filter(
      (req) => req.workDate === new Date().toISOString().split('T')[0]
    );

    const approved = dayRequests.filter((req) => req.status === 'approved');
    const pending = dayRequests.filter((req) => req.status === 'pending');
    const closed = dayRequests.filter((req) => req.status === 'closed');

    return {
      total: dayRequests.length,
      approved: approved.length,
      pending: pending.length,
      closed: closed.length,
      rejected: dayRequests.filter((req) => req.status === 'rejected').length
    };
  },

  /**
   * Limpiar solicitud actual
   */
  clearCurrentRequest: () => {
    set({ currentRequest: null });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  }
}));

export default useCashBoxStore;
