import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentStore } from '../../stores/paymentStore';
import { useClientStore } from '../../stores/clientStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import {
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Plus,
  FileText,
  Settings,
  Eye,
  Upload,
  Database,
  Download,
  Calendar,
  RefreshCw,
  Zap
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { loadSimulationData } from '../../services/mock/seeder';
import { 
  exportDashboardToExcel, 
  exportClientsToExcel, 
  exportPaymentsToExcel, 
  exportMetricsToExcel 
} from '../../utils/excelExport';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import PaymentRegistrationModal from '../../components/common/PaymentRegistrationModal';
import {
  getPaymentServiceStats,
  runManualPaymentCheck,
  forceMonthEndClosure
} from '../../services/automation/paymentStatusService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    metrics,
    chartData,
    fetchDashboardMetrics,
    fetchCollectionChart,
    fetchPaymentStatusChart,
    isLoading
  } = usePaymentStore();
  
  const { fetchClients, getClientsCount, clients } = useClientStore();
  const { info, success, error: showError } = useNotificationStore();
  const { openModal } = useUIStore();
  const { payments } = usePaymentStore();
  
  // Determinar si es subadmin para aplicar filtros
  const isSubAdmin = user?.role === 'subadmin';
  
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Estados para panel de automatización
  const [automationStats, setAutomationStats] = useState(null);
  const [runningAutomation, setRunningAutomation] = useState(false);
  
  // Función para filtrar datos de los últimos 3 meses
  const filterLastThreeMonths = (data) => {
    if (!isSubAdmin || !data) return data;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    if (Array.isArray(data)) {
      return data.filter(item => {
        const itemDate = new Date(item.date || item.createdAt || item.paymentDate);
        return itemDate >= threeMonthsAgo;
      });
    }
    return data;
  };
  
  // Filtrar métricas para subadmin
  const getFilteredMetrics = () => {
    if (!isSubAdmin) return metrics;
    
    // Para subadmin, recalcular métricas solo con datos de los últimos 3 meses
    const filteredPayments = filterLastThreeMonths(payments);
    const filteredClients = filterLastThreeMonths(clients);
    
    return {
      ...metrics,
      totalRecaudado: filteredPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      pagosPendientes: filteredPayments?.filter(p => p.status === 'pending').length || 0,
      clientesActivos: filteredClients?.filter(c => c.status === 'active').length || 0
    };
  };

  // Cerrar menú de exportación al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.relative')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Para subadmin, solo cargar datos de los últimos 3 meses
        const monthsToLoad = isSubAdmin ? 3 : 6;
        
        await Promise.all([
          fetchDashboardMetrics(),
          fetchCollectionChart(monthsToLoad),
          fetchPaymentStatusChart(),
          fetchClients()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Notificar al usuario sobre el error
        if (error?.status === 404) {
          info('Error al cargar algunos datos. Por favor, intente refrescar la página.');
        } else {
          info('Error temporal al cargar el dashboard. Intente nuevamente en unos momentos.');
        }
      }
    };

    loadDashboardData();
  }, [fetchDashboardMetrics, fetchCollectionChart, fetchPaymentStatusChart, fetchClients, info, isSubAdmin]);

  // Refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const monthsToLoad = isSubAdmin ? 3 : 6;
      
      await Promise.all([
        fetchDashboardMetrics(),
        fetchCollectionChart(monthsToLoad),
        fetchPaymentStatusChart()
      ]);
      info('Dashboard actualizado');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Funciones para accesos rápidos
  const handleNewClient = () => {
    navigate('/admin/clients');
    success('Redirigiendo a gestión de clientes');
  };

  const handleNewPayment = () => {
    setShowPaymentModal(true);
  };

  const handleGenerateReport = () => {
    navigate('/admin/reports');
    success('Redirigiendo a generador de reportes');
  };

  const handleSettings = () => {
    navigate('/admin/settings');
    success('Redirigiendo a configuración');
  };

  const handleLoadSimulation = async () => {
    if (window.confirm('¿Cargar datos de simulación? Esto reemplazará todos los datos actuales.')) {
      setRefreshing(true);
      try {
        const result = await loadSimulationData();
        if (result) {
          // Refrescar todos los datos del dashboard
          await Promise.all([
            fetchDashboardMetrics(),
            fetchCollectionChart(6),
            fetchPaymentStatusChart(),
            fetchClients()
          ]);
          success('Datos de simulación cargados exitosamente');
        } else {
          showError('Error al cargar datos de simulación');
        }
      } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar datos de simulación');
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Cargar estadísticas del servicio de automatización
  const loadAutomationStats = () => {
    try {
      const stats = getPaymentServiceStats();
      setAutomationStats(stats);
    } catch (error) {
      console.error('Error loading automation stats:', error);
    }
  };

  // Ejecutar verificación manual de pagos
  const handleRunManualCheck = async () => {
    if (window.confirm('¿Ejecutar verificación manual de estados de pagos?')) {
      setRunningAutomation(true);
      try {
        await runManualPaymentCheck();
        loadAutomationStats();
        await fetchPayments();
        success('Verificación manual ejecutada exitosamente');
      } catch (error) {
        console.error('Error:', error);
        showError('Error al ejecutar verificación manual');
      } finally {
        setRunningAutomation(false);
      }
    }
  };

  // Forzar cierre de mes
  const handleForceMonthEndClosure = async () => {
    if (window.confirm('⚠️ ¿Forzar cierre de mes? Esto actualizará todos los pagos pendientes del mes actual a estado "Mora".\n\nEsta acción normalmente se ejecuta automáticamente el último día del mes.')) {
      setRunningAutomation(true);
      try {
        const result = await forceMonthEndClosure();
        loadAutomationStats();
        await fetchPayments();
        success(`Cierre de mes completado: ${result.moraCount} pagos marcados como Mora, ${result.canceladoCount} pagos cancelados`);
      } catch (error) {
        console.error('Error:', error);
        showError('Error al ejecutar cierre de mes');
      } finally {
        setRunningAutomation(false);
      }
    }
  };

  // Cargar stats al montar el componente
  useEffect(() => {
    loadAutomationStats();
    const interval = setInterval(loadAutomationStats, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  // Exportar dashboard a Excel
  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      await exportDashboardToExcel(metrics, clients, payments);
      success('Dashboard exportado exitosamente a Excel');
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      showError(`Error al exportar: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Exportaciones específicas
  const handleExportClients = async () => {
    setExporting(true);
    try {
      await exportClientsToExcel(clients);
      success('Lista de clientes exportada a Excel');
    } catch (error) {
      console.error('Error exporting clients:', error);
      showError(`Error al exportar clientes: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPayments = async () => {
    setExporting(true);
    try {
      await exportPaymentsToExcel(payments);
      success('Lista de pagos exportada a Excel');
    } catch (error) {
      console.error('Error exporting payments:', error);
      showError(`Error al exportar pagos: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportMetrics = async () => {
    setExporting(true);
    try {
      await exportMetricsToExcel(metrics);
      success('Métricas exportadas a Excel');
    } catch (error) {
      console.error('Error exporting metrics:', error);
      showError(`Error al exportar métricas: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Obtener métricas filtradas
  const displayMetrics = getFilteredMetrics();
  
  // Los datos del gráfico ya vienen filtrados desde el store con el parámetro monthsToLoad
  // No necesitamos filtrarlos aquí porque ya se solicitan solo 3 meses para subadmin
  const displayChartData = chartData;
  
  // Datos para gráfico circular
  const pieData = displayChartData.paymentStatus?.map((item, index) => ({
    name: getStatusLabel(item.name),
    value: item.value,
    percentage: item.percentage,
    color: getStatusColor(item.name)
  })) || [];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

  if (isLoading() && !displayMetrics.totalCollected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard {isSubAdmin ? 'Administrador' : 'Súper administrador'}
          </h1>
          <p className="text-gray-600">
            {isSubAdmin ? 'Resumen de los últimos 3 meses' : 'Resumen general del sistema de cobranzas'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleNewPayment}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pago
          </button>
          <button
            onClick={handleExportToExcel}
            disabled={exporting}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
          <button
            onClick={handleLoadSimulation}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Database className="h-4 w-4 mr-2" />
            Cargar Simulación
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <TrendingUp className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={isSubAdmin ? "Recaudado (3 meses)" : "Total Recaudado"}
          value={`S/ ${displayMetrics.totalCollected?.toLocaleString() || displayMetrics.totalRecaudado?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="green"
          trend="up"
          trendValue="+12.5%"
          loading={isLoading()}
          onClick={() => navigate('/admin/reports')}
        />
        
        <StatCard
          title="Pagos Pendientes"
          value={displayMetrics.pendingPayments || displayMetrics.pagosPendientes || 0}
          icon={AlertTriangle}
          color="yellow"
          loading={isLoading()}
          onClick={() => navigate('/admin/payments')}
        />
        
        <StatCard
          title="Tasa de Morosidad"
          value={`${displayMetrics.overdueRate || 0}%`}
          icon={AlertTriangle}
          color="red"
          trend="down"
          trendValue="-2.1%"
          loading={isLoading()}
          onClick={() => navigate('/admin/payments')}
        />
        
        <StatCard
          title="Clientes Activos"
          value={displayMetrics.currentClients || displayMetrics.clientesActivos || 0}
          icon={Users}
          color="blue"
          loading={isLoading()}
          onClick={() => navigate('/admin/clients')}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de barras - Cobranza últimos 6 meses */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isSubAdmin ? 'Cobranza Últimos 3 Meses' : 'Cobranza Últimos 6 Meses'}
            </h3>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver detalle
            </button>
          </div>
          
          {displayChartData.collection?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={displayChartData.collection}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: '#666' }} />
                <YAxis tick={{ fill: '#666' }} />
                <Tooltip 
                  formatter={(value) => [`S/ ${value.toLocaleString()}`, 'Monto']}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="Sin datos de cobranza"
              description="No hay datos disponibles para mostrar el gráfico"
              size="small"
            />
          )}
        </div>

        {/* Gráfico circular - Estado de pagos actual */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Estado de Pagos Actual
            </h3>
            <button
              onClick={() => navigate('/admin/payments')}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors sm:text-sm"
            >
              Ver detalle
            </button>
          </div>
          
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} (${pieData.find(p => p.name === name)?.percentage}%)`, 'Cantidad']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="Sin datos de estado"
              description="No hay datos disponibles para mostrar el gráfico"
              size="small"
            />
          )}
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 sm:px-6 sm:py-4">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            Actividad Reciente
          </h3>
        </div>

        <div className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Elementos de actividad simulados */}
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 sm:text-sm">
                  <strong>Carlos García</strong> registró pago de S/ 80.00
                </span>
                <div className="text-xs text-gray-400 mt-1 sm:inline sm:ml-2 sm:mt-0">hace 5 min</div>
              </div>
            </div>

            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 sm:text-sm">
                  <strong>Ana Martínez</strong> subió voucher de pago
                </span>
                <div className="text-xs text-gray-400 mt-1 sm:inline sm:ml-2 sm:mt-0">hace 15 min</div>
              </div>
            </div>

            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 sm:text-sm">
                  <strong>Sistema</strong> envió recordatorio de pago a 15 clientes
                </span>
                <div className="text-xs text-gray-400 mt-1 sm:inline sm:ml-2 sm:mt-0">hace 1 hora</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-6">
            <button
              onClick={() => navigate('/admin/payments')}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors sm:text-sm"
            >
              Ver toda la actividad →
            </button>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 sm:px-6 sm:py-4">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            Accesos Rápidos
          </h3>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
            
            <button
              onClick={handleNewClient}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group sm:p-4"
            >
              <Plus className="h-6 w-6 text-blue-600 mr-2 group-hover:scale-110 transition-transform sm:h-8 sm:w-8 sm:mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-900 sm:text-base">Nuevo Cliente</p>
                <p className="text-xs text-gray-500 sm:text-sm">Agregar cliente</p>
              </div>
            </button>
            
            <button
              onClick={handleGenerateReport}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-all duration-200 group sm:p-4"
            >
              <FileText className="h-6 w-6 text-orange-600 mr-2 group-hover:scale-110 transition-transform sm:h-8 sm:w-8 sm:mr-3" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 group-hover:text-orange-900 sm:text-base">Generar Reporte</p>
                <p className="text-xs text-gray-500 sm:text-sm">Crear informe</p>
              </div>
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-all duration-200 group w-full sm:p-4"
              >
                <Download className="h-6 w-6 text-purple-600 mr-2 group-hover:scale-110 transition-transform sm:h-8 sm:w-8 sm:mr-3" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-purple-900">Exportar Datos</p>
                  <p className="text-sm text-gray-500">Generar archivos Excel</p>
                </div>
                <div className={`transform transition-transform ${showExportMenu ? 'rotate-180' : ''}`}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </button>

              {showExportMenu && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        handleExportToExcel();
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2 text-green-600" />
                      Dashboard Completo
                    </button>
                    <button
                      onClick={() => {
                        handleExportClients();
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center"
                    >
                      <Users className="h-4 w-4 mr-2 text-blue-600" />
                      Lista de Clientes
                    </button>
                    <button
                      onClick={() => {
                        handleExportPayments();
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center"
                    >
                      <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                      Lista de Pagos
                    </button>
                    <button
                      onClick={() => {
                        handleExportMetrics();
                        setShowExportMenu(false);
                      }}
                      disabled={exporting}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center"
                    >
                      <TrendingUp className="h-4 w-4 mr-2 text-purple-600" />
                      Métricas
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleSettings}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group"
            >
              <Settings className="h-8 w-8 text-gray-600 mr-3 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <p className="font-medium text-gray-900 group-hover:text-gray-700">Configuración</p>
                <p className="text-sm text-gray-500">Ajustar sistema</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Automatización de Pagos */}
      {user?.role === 'superadmin' && automationStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="h-6 w-6 text-yellow-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Automatización de Pagos</h2>
            </div>
            <div className="flex items-center">
              {automationStats.isRunning ? (
                <span className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse mr-2"></div>
                  Activo
                </span>
              ) : (
                <span className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Inactivo
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700">Mes Actual</span>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-900">{automationStats.currentMonth}</p>
            </div>

            <div className={`rounded-lg p-4 ${
              automationStats.isLastDayOfMonth ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Último Día del Mes</span>
                <AlertTriangle className={`h-4 w-4 ${
                  automationStats.isLastDayOfMonth ? 'text-red-600' : 'text-gray-400'
                }`} />
              </div>
              <p className={`text-lg font-bold ${
                automationStats.isLastDayOfMonth ? 'text-red-900' : 'text-gray-900'
              }`}>
                {automationStats.isLastDayOfMonth ? 'SÍ - Cierre programado' : 'No'}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-700">Última Verificación</span>
                <RefreshCw className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-purple-900">
                {automationStats.lastCheck
                  ? new Date(automationStats.lastCheck).toLocaleString('es-ES')
                  : 'Nunca'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRunManualCheck}
              disabled={runningAutomation}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${runningAutomation ? 'animate-spin' : ''}`} />
              {runningAutomation ? 'Ejecutando...' : 'Verificación Manual'}
            </button>

            <button
              onClick={handleForceMonthEndClosure}
              disabled={runningAutomation}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Forzar Cierre de Mes
            </button>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Información:</strong> El sistema verifica automáticamente cada 6 horas si hay pagos vencidos.
              El último día de cada mes, se ejecuta el cierre automático marcando pagos pendientes como "Mora".
            </p>
          </div>
        </div>
      )}

      {/* Modal de registro de pagos */}
      <PaymentRegistrationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
};

// Helper functions
const getStatusLabel = (status) => {
  const labels = {
    paid: 'Pagados',
    pending: 'Pendientes',
    overdue: 'Vencidos',
    partial: 'Parciales'
  };
  return labels[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    paid: '#10B981',
    pending: '#F59E0B',
    overdue: '#EF4444',
    partial: '#06B6D4'
  };
  return colors[status] || '#6B7280';
};

export default AdminDashboard;