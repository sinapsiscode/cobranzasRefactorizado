/**
 * Dashboard Store - REFACTORIZADO para usar API REST
 *
 * Maneja todas las métricas, estadísticas y datos de gráficos del dashboard
 */

import { create } from 'zustand';
import { dashboardApi } from '../services/api';

export const useDashboardStore = create((set, get) => ({
  // Estado
  stats: null,
  collectionChart: [],
  paymentStatusChart: [],
  collectorStats: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  // ============================================
  // ACCIONES - Métricas del Dashboard
  // ============================================

  /**
   * Obtener estadísticas generales del dashboard
   */
  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });

    try {
      const stats = await dashboardApi.getStats();

      set({
        stats,
        lastUpdated: new Date().toISOString(),
        isLoading: false,
        error: null
      });

      return { success: true, data: stats };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar estadísticas del dashboard'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener datos para gráfico de cobranza
   */
  fetchCollectionChart: async (months = 6) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/stats/collection-chart?months=${months}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar datos del gráfico de cobranza');
      }

      const chartData = await response.json();

      set({
        collectionChart: chartData,
        isLoading: false,
        error: null
      });

      return { success: true, data: chartData };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar gráfico de cobranza'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener datos para gráfico de estados de pago
   */
  fetchPaymentStatusChart: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/stats/payment-status-chart`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar datos del gráfico de estados');
      }

      const chartData = await response.json();

      set({
        paymentStatusChart: chartData,
        isLoading: false,
        error: null
      });

      return { success: true, data: chartData };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar gráfico de estados'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Obtener estadísticas de un cobrador específico
   */
  fetchCollectorStats: async (collectorId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/stats/collector/${collectorId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas del cobrador');
      }

      const stats = await response.json();

      set({
        collectorStats: stats,
        isLoading: false,
        error: null
      });

      return { success: true, data: stats };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Error al cargar estadísticas del cobrador'
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Refrescar todos los datos del dashboard
   */
  refreshDashboard: async (options = {}) => {
    const { includeCharts = true, collectorId = null } = options;

    try {
      // Cargar estadísticas principales
      await get().fetchDashboardStats();

      // Cargar gráficos si se solicita
      if (includeCharts) {
        await Promise.all([
          get().fetchCollectionChart(),
          get().fetchPaymentStatusChart()
        ]);
      }

      // Cargar estadísticas de cobrador si se proporciona ID
      if (collectorId) {
        await get().fetchCollectorStats(collectorId);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Error al refrescar dashboard'
      };
    }
  },

  // ============================================
  // GETTERS Y UTILIDADES
  // ============================================

  /**
   * Verificar si los datos necesitan actualización
   */
  needsRefresh: (maxAgeMinutes = 5) => {
    const { lastUpdated } = get();
    if (!lastUpdated) return true;

    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMinutes = (now - updated) / 1000 / 60;

    return diffMinutes >= maxAgeMinutes;
  },

  /**
   * Obtener resumen rápido de estadísticas
   */
  getQuickStats: () => {
    const { stats } = get();
    if (!stats) return null;

    return {
      totalClients: stats.totalClients || 0,
      activeClients: stats.activeClients || 0,
      totalCollected: stats.totalCollected || 0,
      pendingAmount: stats.pendingAmount || 0,
      overduePayments: stats.overduePayments || 0,
      collectionRate: stats.collectionRate || 0
    };
  },

  /**
   * Obtener datos formateados para gráfico de cobranza
   */
  getFormattedCollectionChart: () => {
    const { collectionChart } = get();
    if (!collectionChart || collectionChart.length === 0) return [];

    return collectionChart.map((item) => ({
      ...item,
      monthLabel: formatMonthLabel(item.month)
    }));
  },

  /**
   * Obtener datos formateados para gráfico de estados
   */
  getFormattedPaymentStatusChart: () => {
    const { paymentStatusChart } = get();
    if (!paymentStatusChart || paymentStatusChart.length === 0) return [];

    const statusLabels = {
      paid: 'Pagado',
      pending: 'Pendiente',
      overdue: 'Vencido',
      collected: 'Cobrado'
    };

    return paymentStatusChart.map((item) => ({
      ...item,
      statusLabel: statusLabels[item.status] || item.status
    }));
  },

  /**
   * Calcular tendencia de cobranza (comparar último mes vs mes anterior)
   */
  getCollectionTrend: () => {
    const { collectionChart } = get();
    if (!collectionChart || collectionChart.length < 2) return null;

    const lastMonth = collectionChart[collectionChart.length - 1];
    const previousMonth = collectionChart[collectionChart.length - 2];

    const change = lastMonth.collected - previousMonth.collected;
    const percentChange = previousMonth.collected > 0
      ? ((change / previousMonth.collected) * 100).toFixed(2)
      : 0;

    return {
      current: lastMonth.collected,
      previous: previousMonth.collected,
      change,
      percentChange: parseFloat(percentChange),
      isPositive: change >= 0
    };
  },

  /**
   * Obtener resumen de performance del cobrador
   */
  getCollectorPerformance: () => {
    const { collectorStats } = get();
    if (!collectorStats) return null;

    return {
      totalCollected: collectorStats.totalCollected || 0,
      totalPayments: collectorStats.totalPayments || 0,
      averagePayment: collectorStats.averagePayment || 0,
      successRate: collectorStats.successRate || 0,
      assignedClients: collectorStats.assignedClients || 0
    };
  },

  /**
   * Limpiar estadísticas del cobrador
   */
  clearCollectorStats: () => {
    set({ collectorStats: null });
  },

  /**
   * Limpiar todos los datos
   */
  clearAll: () => {
    set({
      stats: null,
      collectionChart: [],
      paymentStatusChart: [],
      collectorStats: null,
      lastUpdated: null
    });
  },

  /**
   * Limpiar error
   */
  clearError: () => {
    set({ error: null });
  }
}));

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Formatear etiqueta de mes para gráficos
 */
function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-');
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export default useDashboardStore;
