/**
 * Client Extended Store - REFACTORIZADO para usar API REST
 *
 * Maneja datos extendidos de clientes que no están en el store básico:
 * - Historial de pagos completo
 * - Información de instalación detallada
 * - Estadísticas y métricas del cliente
 * - Historial de cambios de estado
 */

import { create } from 'zustand';
import { clientsApi, paymentsApi } from '../services/api';

export const useClientExtendedStore = create((set, get) => ({
  // Estado
  clientDetails: null,
  paymentHistory: [],
  installationInfo: null,
  clientStats: null,
  isLoading: false,
  error: null,

  // ============================================
  // ACCIONES - Datos Extendidos
  // ============================================

  /**
   * Obtener detalles completos del cliente
   * Combina información de cliente + pagos + estadísticas
   */
  fetchClientDetails: async (clientId) => {
    set({ isLoading: true, error: null });

    try {
      // Obtener cliente básico
      const client = await clientsApi.getById(clientId);

      // Obtener historial de pagos
      const payments = await clientsApi.getPayments(clientId);

      // Calcular estadísticas
      const stats = get().calculateClientStats(client, payments);

      // Obtener info de instalación
      const installationInfo = get().getInstallationInfo(client);

      set({
        clientDetails: client,
        paymentHistory: payments,
        clientStats: stats,
        installationInfo,
        isLoading: false,
        error: null
      });

      return {
        success: true,
        data: {
          client,
          payments,
          stats,
          installationInfo
        }
      };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar detalles del cliente'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Actualizar datos extendidos del cliente
   */
  updateClientExtended: async (clientId, extendedData) => {
    set({ isLoading: true, error: null });

    try {
      // Actualizar cliente con datos extendidos
      const updated = await clientsApi.patch(clientId, extendedData);

      set((state) => ({
        clientDetails: state.clientDetails?.id === clientId ? updated : state.clientDetails,
        isLoading: false,
        error: null
      }));

      return { success: true, data: updated };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al actualizar datos extendidos'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Refrescar historial de pagos
   */
  refreshPaymentHistory: async (clientId) => {
    set({ isLoading: true, error: null });

    try {
      const payments = await clientsApi.getPayments(clientId);

      // Recalcular estadísticas
      const client = get().clientDetails;
      if (client) {
        const stats = get().calculateClientStats(client, payments);
        set({ clientStats: stats });
      }

      set({
        paymentHistory: payments,
        isLoading: false,
        error: null
      });

      return { success: true, data: payments };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al refrescar historial'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  // ============================================
  // HELPERS Y CÁLCULOS
  // ============================================

  /**
   * Calcular estadísticas del cliente
   */
  calculateClientStats: (client, payments) => {
    const totalPayments = payments.length;
    const paidPayments = payments.filter((p) => p.status === 'paid');
    const overduePayments = payments.filter((p) => p.status === 'overdue');
    const pendingPayments = payments.filter((p) => p.status === 'pending');

    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDebt = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    // Calcular tasa de cumplimiento
    const onTimePayments = paidPayments.filter((p) => {
      if (!p.paymentDate || !p.dueDate) return false;
      return new Date(p.paymentDate) <= new Date(p.dueDate);
    }).length;

    const complianceRate =
      paidPayments.length > 0
        ? ((onTimePayments / paidPayments.length) * 100).toFixed(2)
        : 0;

    // Calcular meses como cliente
    const installDate = new Date(client.installationDate);
    const today = new Date();
    const monthsAsClient = Math.floor(
      (today - installDate) / (1000 * 60 * 60 * 24 * 30)
    );

    return {
      totalPayments,
      paidCount: paidPayments.length,
      overdueCount: overduePayments.length,
      pendingCount: pendingPayments.length,
      totalPaid,
      totalDebt,
      totalPending,
      complianceRate: parseFloat(complianceRate),
      monthsAsClient,
      averagePayment: paidPayments.length > 0 ? totalPaid / paidPayments.length : 0,
      lastPaymentDate:
        paidPayments.length > 0
          ? paidPayments[paidPayments.length - 1].paymentDate
          : null
    };
  },

  /**
   * Obtener información detallada de instalación
   */
  getInstallationInfo: (client) => {
    const installDate = new Date(client.installationDate);
    const today = new Date();

    const daysAsClient = Math.floor((today - installDate) / (1000 * 60 * 60 * 24));
    const monthsAsClient = Math.floor(daysAsClient / 30);
    const yearsAsClient = Math.floor(monthsAsClient / 12);

    return {
      installationDate: client.installationDate,
      daysAsClient,
      monthsAsClient,
      yearsAsClient,
      servicePlan: client.servicePlan,
      serviceType: client.serviceType,
      services: client.services || [],
      preferredPaymentDay: client.preferredPaymentDay,
      paymentDueDays: client.paymentDueDays,
      address: client.address,
      neighborhood: client.neighborhood
    };
  },

  /**
   * Obtener historial de estado del cliente
   */
  getStatusHistory: () => {
    const { clientDetails } = get();
    if (!clientDetails) return [];

    return clientDetails.statusHistory || [];
  },

  /**
   * Obtener último cambio de estado
   */
  getLastStatusChange: () => {
    const history = get().getStatusHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  },

  /**
   * Verificar si cliente ha sido reactivado
   */
  hasBeenReactivated: () => {
    const { clientDetails } = get();
    if (!clientDetails) return false;

    return !!clientDetails.reactivationDate;
  },

  /**
   * Obtener meses con pagos vencidos
   */
  getOverdueMonths: () => {
    const { paymentHistory } = get();
    return paymentHistory
      .filter((p) => p.status === 'overdue')
      .map((p) => ({
        month: p.month,
        amount: p.amount,
        dueDate: p.dueDate,
        daysOverdue: Math.floor(
          (new Date() - new Date(p.dueDate)) / (1000 * 60 * 60 * 24)
        )
      }))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  /**
   * Obtener proyección de próximo pago
   */
  getNextPaymentProjection: () => {
    const { clientDetails, paymentHistory } = get();
    if (!clientDetails) return null;

    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, clientDetails.preferredPaymentDay);

    // Verificar si ya existe un pago para el próximo mes
    const nextMonthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    const existingPayment = paymentHistory.find((p) => p.month === nextMonthKey);

    if (existingPayment) {
      return {
        exists: true,
        payment: existingPayment
      };
    }

    // Obtener precio del plan
    const planPrices = { basic: 50, standard: 80, premium: 120 };
    const amount = planPrices[clientDetails.servicePlan] || 0;

    return {
      exists: false,
      projectedDate: nextMonth.toISOString().split('T')[0],
      projectedAmount: amount,
      month: nextMonthKey
    };
  },

  /**
   * Calcular valor total del cliente (LTV - Lifetime Value)
   */
  calculateLifetimeValue: () => {
    const { clientStats } = get();
    if (!clientStats) return 0;

    return clientStats.totalPaid;
  },

  /**
   * Obtener resumen financiero
   */
  getFinancialSummary: () => {
    const { clientStats, paymentHistory } = get();
    if (!clientStats) return null;

    const lastSixMonths = paymentHistory
      .filter((p) => {
        const paymentDate = new Date(p.dueDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return paymentDate >= sixMonthsAgo;
      })
      .reduce((sum, p) => (p.status === 'paid' ? sum + p.amount : sum), 0);

    return {
      totalPaid: clientStats.totalPaid,
      currentDebt: clientStats.totalDebt,
      pendingAmount: clientStats.totalPending,
      lastSixMonthsRevenue: lastSixMonths,
      averageMonthlyPayment: clientStats.averagePayment,
      lifetimeValue: get().calculateLifetimeValue()
    };
  },

  /**
   * Limpiar datos del cliente
   */
  clearClientDetails: () => {
    set({
      clientDetails: null,
      paymentHistory: [],
      installationInfo: null,
      clientStats: null
    });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  }
}));

export default useClientExtendedStore;
