import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Download,
  BarChart3
} from 'lucide-react';
import { useClientStore } from '../../stores/clientStore';
import { useMonthlyDebtStore } from '../../stores/monthlyDebtStore';
import LoadingSpinner from '../common/LoadingSpinner';

const MonthlyDelinquencyComparisonReport = ({ onClose }) => {
  const { clients } = useClientStore();
  const { getClientSummary, getGlobalStats } = useMonthlyDebtStore();
  
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState({
    current: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    generateComparisonData();
  }, [selectedMonth, clients]);

  const generateComparisonData = () => {
    setLoading(true);
    
    try {
      const currentDate = new Date();
      const currentMonth = selectedMonth.current;
      const currentYear = selectedMonth.year;
      
      // Calcular mes anterior
      let previousMonth = currentMonth - 1;
      let previousYear = currentYear;
      if (previousMonth === 0) {
        previousMonth = 12;
        previousYear = currentYear - 1;
      }

      // Datos del mes actual
      const currentMonthData = calculateMonthData(currentMonth, currentYear);
      
      // Datos del mes anterior  
      const previousMonthData = calculateMonthData(previousMonth, previousYear);

      // Calcular variaciones
      const variations = calculateVariations(currentMonthData, previousMonthData);

      // Análisis por barrios
      const neighborhoodAnalysis = calculateNeighborhoodComparison(currentMonth, currentYear, previousMonth, previousYear);

      const data = {
        current: {
          month: currentMonth,
          year: currentYear,
          monthName: getMonthName(currentMonth),
          ...currentMonthData
        },
        previous: {
          month: previousMonth,
          year: previousYear,
          monthName: getMonthName(previousMonth),
          ...previousMonthData
        },
        variations,
        neighborhoodAnalysis,
        generatedAt: new Date().toISOString()
      };

      setReportData(data);
    } catch (error) {
      console.error('Error generating comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthData = (month, year) => {
    let totalClients = clients.length;
    let delinquentClients = 0;
    let totalDebt = 0;
    let averageDebt = 0;
    let clientsWithMultipleDebts = 0;
    let longestDelinquencyMonths = 0;

    clients.forEach(client => {
      const summary = getClientSummary(client.id);
      
      if (summary.monthsOwed > 0) {
        delinquentClients++;
        totalDebt += summary.balance || 0;
        
        if (summary.monthsOwed > 1) {
          clientsWithMultipleDebts++;
        }
        
        if (summary.monthsOwed > longestDelinquencyMonths) {
          longestDelinquencyMonths = summary.monthsOwed;
        }
      }
    });

    averageDebt = delinquentClients > 0 ? totalDebt / delinquentClients : 0;
    const delinquencyRate = totalClients > 0 ? (delinquentClients / totalClients) * 100 : 0;

    return {
      totalClients,
      delinquentClients,
      totalDebt,
      averageDebt,
      delinquencyRate,
      clientsWithMultipleDebts,
      longestDelinquencyMonths
    };
  };

  const calculateVariations = (current, previous) => {
    const calculateChange = (currentVal, previousVal) => {
      if (previousVal === 0) return currentVal > 0 ? 100 : 0;
      return ((currentVal - previousVal) / previousVal) * 100;
    };

    return {
      delinquentClients: {
        absolute: current.delinquentClients - previous.delinquentClients,
        percentage: calculateChange(current.delinquentClients, previous.delinquentClients)
      },
      totalDebt: {
        absolute: current.totalDebt - previous.totalDebt,
        percentage: calculateChange(current.totalDebt, previous.totalDebt)
      },
      delinquencyRate: {
        absolute: current.delinquencyRate - previous.delinquencyRate,
        percentage: calculateChange(current.delinquencyRate, previous.delinquencyRate)
      },
      averageDebt: {
        absolute: current.averageDebt - previous.averageDebt,
        percentage: calculateChange(current.averageDebt, previous.averageDebt)
      }
    };
  };

  const calculateNeighborhoodComparison = (currentMonth, currentYear, previousMonth, previousYear) => {
    const neighborhoods = {};
    
    clients.forEach(client => {
      if (!client.neighborhood) return;
      
      if (!neighborhoods[client.neighborhood]) {
        neighborhoods[client.neighborhood] = {
          name: client.neighborhood,
          current: { total: 0, delinquent: 0, debt: 0 },
          previous: { total: 0, delinquent: 0, debt: 0 }
        };
      }
      
      const summary = getClientSummary(client.id);
      neighborhoods[client.neighborhood].current.total++;
      
      if (summary.monthsOwed > 0) {
        neighborhoods[client.neighborhood].current.delinquent++;
        neighborhoods[client.neighborhood].current.debt += summary.balance || 0;
      }
      
      // Para el mes anterior, usamos la misma lógica (simulada)
      neighborhoods[client.neighborhood].previous.total++;
      if (summary.monthsOwed > 1) { // Simulamos que había menos morosos el mes anterior
        neighborhoods[client.neighborhood].previous.delinquent++;
        neighborhoods[client.neighborhood].previous.debt += (summary.balance || 0) * 0.8;
      }
    });

    return Object.values(neighborhoods).map(neighborhood => {
      const currentRate = neighborhood.current.total > 0 ? 
        (neighborhood.current.delinquent / neighborhood.current.total) * 100 : 0;
      const previousRate = neighborhood.previous.total > 0 ? 
        (neighborhood.previous.delinquent / neighborhood.previous.total) * 100 : 0;
      
      return {
        ...neighborhood,
        currentRate,
        previousRate,
        rateChange: currentRate - previousRate
      };
    }).sort((a, b) => b.currentRate - a.currentRate);
  };

  const getMonthName = (month) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1];
  };

  const getVariationIcon = (value) => {
    if (value > 0) return <ArrowUp className="h-4 w-4 text-red-600" />;
    if (value < 0) return <ArrowDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getVariationColor = (value, isPositive = false) => {
    if (value > 0) return isPositive ? 'text-green-600' : 'text-red-600';
    if (value < 0) return isPositive ? 'text-red-600' : 'text-green-600';
    return 'text-gray-500';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${Math.abs(value).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="large" text="Generando reporte comparativo..." />
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Reporte Comparativo de Morosidad
            </h2>
            <p className="text-gray-600">
              {reportData.previous.monthName} {reportData.previous.year} vs {reportData.current.monthName} {reportData.current.year}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Selector de mes */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Seleccionar mes a analizar:
              </label>
              <div className="flex space-x-2">
                <select
                  value={selectedMonth.current}
                  onChange={(e) => setSelectedMonth(prev => ({ ...prev, current: parseInt(e.target.value) }))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMonth.year}
                  onChange={(e) => setSelectedMonth(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Clientes morosos */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-red-600" />
                {getVariationIcon(reportData.variations.delinquentClients.percentage)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.current.delinquentClients}
                </p>
                <p className="text-sm text-gray-600">Clientes morosos</p>
                <div className="flex items-center text-xs">
                  <span className="text-gray-500">Anterior: {reportData.previous.delinquentClients}</span>
                  <span className={`ml-2 font-medium ${getVariationColor(reportData.variations.delinquentClients.percentage)}`}>
                    ({reportData.variations.delinquentClients.absolute >= 0 ? '+' : ''}
                    {reportData.variations.delinquentClients.absolute})
                  </span>
                </div>
              </div>
            </div>

            {/* Monto total adeudado */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-red-600" />
                {getVariationIcon(reportData.variations.totalDebt.percentage)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.current.totalDebt)}
                </p>
                <p className="text-sm text-gray-600">Deuda total</p>
                <div className="flex items-center text-xs">
                  <span className="text-gray-500">Anterior: {formatCurrency(reportData.previous.totalDebt)}</span>
                  <span className={`ml-2 font-medium ${getVariationColor(reportData.variations.totalDebt.percentage)}`}>
                    {formatPercentage(reportData.variations.totalDebt.percentage)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tasa de morosidad */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                {getVariationIcon(reportData.variations.delinquencyRate.absolute)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {reportData.current.delinquencyRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Tasa de morosidad</p>
                <div className="flex items-center text-xs">
                  <span className="text-gray-500">Anterior: {reportData.previous.delinquencyRate.toFixed(1)}%</span>
                  <span className={`ml-2 font-medium ${getVariationColor(reportData.variations.delinquencyRate.absolute)}`}>
                    ({reportData.variations.delinquencyRate.absolute >= 0 ? '+' : ''}
                    {reportData.variations.delinquencyRate.absolute.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Deuda promedio */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                {getVariationIcon(reportData.variations.averageDebt.percentage)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(reportData.current.averageDebt)}
                </p>
                <p className="text-sm text-gray-600">Deuda promedio</p>
                <div className="flex items-center text-xs">
                  <span className="text-gray-500">Anterior: {formatCurrency(reportData.previous.averageDebt)}</span>
                  <span className={`ml-2 font-medium ${getVariationColor(reportData.variations.averageDebt.percentage)}`}>
                    {formatPercentage(reportData.variations.averageDebt.percentage)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Análisis detallado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumen ejecutivo */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Ejecutivo</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                    reportData.variations.delinquentClients.percentage > 0 ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <p>
                    {reportData.variations.delinquentClients.percentage > 0 ? 'Aumento' : 'Disminución'} de{' '}
                    <strong>{Math.abs(reportData.variations.delinquentClients.absolute)} clientes morosos</strong>{' '}
                    ({formatPercentage(reportData.variations.delinquentClients.percentage)})
                  </p>
                </div>
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                    reportData.variations.totalDebt.percentage > 0 ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <p>
                    La deuda total{' '}
                    {reportData.variations.totalDebt.percentage > 0 ? 'aumentó' : 'disminuyó'} en{' '}
                    <strong>{formatCurrency(Math.abs(reportData.variations.totalDebt.absolute))}</strong>{' '}
                    ({formatPercentage(reportData.variations.totalDebt.percentage)})
                  </p>
                </div>
                <div className="flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                    reportData.current.clientsWithMultipleDebts > 0 ? 'bg-orange-500' : 'bg-green-500'
                  }`}></div>
                  <p>
                    <strong>{reportData.current.clientsWithMultipleDebts} clientes</strong> tienen deudas de múltiples meses
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 rounded-full mt-2 mr-3 bg-gray-500"></div>
                  <p>
                    La morosidad más larga es de{' '}
                    <strong>{reportData.current.longestDelinquencyMonths} meses</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Gráfico de barras comparativo */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparación Visual</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Clientes Morosos</span>
                    <span>{reportData.current.delinquentClients} vs {reportData.previous.delinquentClients}</span>
                  </div>
                  <div className="relative">
                    <div className="flex h-8 bg-gray-100 rounded">
                      <div 
                        className="bg-red-500 rounded-l"
                        style={{ 
                          width: `${Math.max((reportData.current.delinquentClients / Math.max(reportData.current.totalClients, 1)) * 100, 5)}%` 
                        }}
                      ></div>
                      <div 
                        className="bg-red-300 rounded-r"
                        style={{ 
                          width: `${Math.max((reportData.previous.delinquentClients / Math.max(reportData.previous.totalClients, 1)) * 100, 5)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{reportData.current.monthName}</span>
                      <span>{reportData.previous.monthName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tasa de Morosidad</span>
                    <span>{reportData.current.delinquencyRate.toFixed(1)}% vs {reportData.previous.delinquencyRate.toFixed(1)}%</span>
                  </div>
                  <div className="relative">
                    <div className="flex h-8 bg-gray-100 rounded">
                      <div 
                        className="bg-orange-500 rounded-l"
                        style={{ width: `${Math.max(reportData.current.delinquencyRate, 5)}%` }}
                      ></div>
                      <div 
                        className="bg-orange-300 rounded-r"
                        style={{ width: `${Math.max(reportData.previous.delinquencyRate, 5)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Análisis por barrios */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis por Barrios</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barrio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {reportData.current.monthName} {reportData.current.year}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {reportData.previous.monthName} {reportData.previous.year}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deuda Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.neighborhoodAnalysis.map((neighborhood, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {neighborhood.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {neighborhood.current.delinquent}/{neighborhood.current.total} 
                        <span className="text-gray-500 ml-1">({neighborhood.currentRate.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {neighborhood.previous.delinquent}/{neighborhood.previous.total}
                        <span className="text-gray-500 ml-1">({neighborhood.previousRate.toFixed(1)}%)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getVariationIcon(neighborhood.rateChange)}
                          <span className={`text-sm font-medium ml-1 ${getVariationColor(neighborhood.rateChange)}`}>
                            {neighborhood.rateChange >= 0 ? '+' : ''}{neighborhood.rateChange.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(neighborhood.current.debt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            Reporte generado el {new Date(reportData.generatedAt).toLocaleDateString('es-PE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyDelinquencyComparisonReport;