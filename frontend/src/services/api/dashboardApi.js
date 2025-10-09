import { apiClient } from './client';

/**
 * API de Dashboard y Estadísticas
 */
export const dashboardApi = {
  /**
   * Obtener estadísticas generales del dashboard
   * @returns {Promise<Object>}
   */
  getStats: async () => {
    return apiClient.get('/stats/dashboard');
  },

  /**
   * Obtener métricas de cobranza
   * @param {Object} params - Parámetros (startDate, endDate, etc.)
   * @returns {Promise<Object>}
   */
  getCollectionMetrics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/stats/collection?${queryString}` : '/stats/collection';
    return apiClient.get(endpoint);
  },

  /**
   * Obtener resumen de pagos por mes
   * @param {number} year - Año
   * @param {number} month - Mes (1-12)
   * @returns {Promise<Object>}
   */
  getMonthlyPaymentSummary: async (year, month) => {
    const payments = await apiClient.get(`/payments?year=${year}&month=${String(month).padStart(2, '0')}`);

    const summary = {
      total: payments.length,
      paid: payments.filter(p => p.status === 'paid').length,
      pending: payments.filter(p => p.status === 'pending').length,
      overdue: payments.filter(p => p.status === 'overdue').length,
      collected: payments.filter(p => p.status === 'collected').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      collectedAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
    };

    return summary;
  },

  /**
   * Obtener estadísticas por cobrador
   * @param {string} collectorId - ID del cobrador
   * @param {Object} params - Parámetros de fecha
   * @returns {Promise<Object>}
   */
  getCollectorStats: async (collectorId, params = {}) => {
    const payments = await apiClient.get(`/payments?collectorId=${collectorId}`);

    const stats = {
      totalCollections: payments.filter(p => p.status === 'paid').length,
      totalAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pendingCollections: payments.filter(p => p.status === 'collected').length,
      clients: [...new Set(payments.map(p => p.clientId))].length
    };

    return stats;
  },

  /**
   * Obtener tasa de morosidad
   * @returns {Promise<Object>}
   */
  getOverdueRate: async () => {
    const payments = await apiClient.get('/payments');

    const totalPayments = payments.length;
    const overduePayments = payments.filter(p => p.status === 'overdue').length;
    const overdueRate = totalPayments > 0 ? (overduePayments / totalPayments * 100) : 0;

    return {
      totalPayments,
      overduePayments,
      overdueRate: parseFloat(overdueRate.toFixed(2))
    };
  },

  /**
   * Obtener resumen de clientes
   * @returns {Promise<Object>}
   */
  getClientsSummary: async () => {
    const clients = await apiClient.get('/clients');

    const summary = {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      debt: clients.filter(c => c.status === 'debt').length,
      suspended: clients.filter(c => c.status === 'suspended').length,
      paused: clients.filter(c => c.status === 'paused').length,
      terminated: clients.filter(c => c.status === 'terminated').length
    };

    return summary;
  },

  /**
   * Obtener historial de cobranza (últimos N meses)
   * @param {number} months - Número de meses
   * @returns {Promise<Array>}
   */
  getCollectionHistory: async (months = 6) => {
    const payments = await apiClient.get('/payments');
    const now = new Date();
    const history = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      const monthPayments = payments.filter(p => p.month === monthKey);
      const collected = monthPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      history.push({
        month: monthKey,
        monthName: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        collected,
        payments: monthPayments.length,
        paid: monthPayments.filter(p => p.status === 'paid').length
      });
    }

    return history;
  }
};

export default dashboardApi;
