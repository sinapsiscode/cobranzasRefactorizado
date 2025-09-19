import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Eye, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { ReportService } from '../../services/reports/reportService.js';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import DelinquentsByNeighborhoodReport from '../../components/reports/DelinquentsByNeighborhoodReport';
import MonthlyDelinquencyComparisonReport from '../../components/reports/MonthlyDelinquencyComparisonReport';

const Reports = () => {
  const { success, error, info } = useNotificationStore();
  
  const [formData, setFormData] = useState({
    reportType: 'collection',
    startDate: '',
    endDate: '',
    collectorId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [collectors, setCollectors] = useState([]);
  const [showNeighborhoodReport, setShowNeighborhoodReport] = useState(false);
  const [neighborhoodReportData, setNeighborhoodReportData] = useState(null);
  const [showComparisonReport, setShowComparisonReport] = useState(false);
  
  // Cargar lista de cobradores
  useEffect(() => {
    const loadCollectors = async () => {
      try {
        const collectorList = await ReportService.getCollectors();
        setCollectors(collectorList);
      } catch (error) {
        console.error('Error loading collectors:', error);
      }
    };
    
    loadCollectors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreview = async () => {
    if (formData.reportType === 'delinquentsByNeighborhood') {
      await generateNeighborhoodReport();
    } else if (formData.reportType === 'monthlyDelinquencyComparison') {
      setShowComparisonReport(true);
      success('Reporte comparativo de morosidad generado exitosamente');
    } else {
      await handleReportGeneration('preview');
    }
  };

  const handleDownload = async () => {
    if (formData.reportType === 'delinquentsByNeighborhood') {
      info('Para este reporte utilice la vista previa para ver los detalles por barrio');
      await generateNeighborhoodReport();
    } else if (formData.reportType === 'monthlyDelinquencyComparison') {
      info('Para este reporte utilice la vista previa para ver los detalles y opciones de descarga');
      setShowComparisonReport(true);
    } else {
      await handleReportGeneration('download');
    }
  };

  const generateNeighborhoodReport = async () => {
    setLoading(true);
    try {
      const reportData = await ReportService.generateDelinquentsByNeighborhoodReportData({
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      });
      
      setNeighborhoodReportData(reportData);
      setShowNeighborhoodReport(true);
      success('Reporte de morosos por barrios generado exitosamente');
    } catch (error) {
      console.error('Error generating neighborhood report:', error);
      error('Error al generar el reporte de morosos por barrios');
    } finally {
      setLoading(false);
    }
  };

  const handleReportGeneration = async (action) => {
    setLoading(true);
    
    try {
      // Validar filtros
      ReportService.validateDateFilters(formData);
      
      // Generar reporte
      const result = await ReportService.generateReport(
        formData.reportType,
        {
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
          collectorId: formData.collectorId || null
        },
        action
      );
      
      if (result.success) {
        if (action === 'preview') {
          success('Vista previa generada exitosamente');
        } else {
          success('Reporte descargado exitosamente');
        }
      } else {
        if (result.error === 'insuficiencia_datos') {
          error(`No hay datos suficientes para generar este reporte. ${result.message}`);
        } else {
          error(result.message || 'Error al generar el reporte');
        }
      }
    } catch (err) {
      console.error('Error generating report:', err);
      error(err.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const getReportDescription = (type) => {
    const descriptions = {
      collection: 'Muestra todos los pagos realizados en el período seleccionado con detalles de cliente, fecha y monto.',
      overdue: 'Lista de clientes con pagos vencidos, incluyendo días de atraso y montos adeudados.',
      collector: 'Rendimiento de cobranza por cobrador específico con métricas detalladas.',
      income: 'Reporte de ingresos confirmados agrupados por período con totales mensuales.',
      delinquentsByNeighborhood: 'Clientes morosos organizados por barrios con detalles de contacto y deudas pendientes.',
      monthlyDelinquencyComparison: 'Análisis comparativo de morosidad entre mes actual y anterior con tendencias, variaciones y métricas detalladas.'
    };
    return descriptions[type] || '';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Generar y exportar reportes profesionales en PDF</p>
        </div>
      </div>

      {/* Configuración de reporte */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configurar Reporte</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tipo de reporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select 
                name="reportType"
                value={formData.reportType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="collection">Reporte de Cobranza</option>
                <option value="overdue">Reporte de Morosidad</option>
                <option value="collector">Reporte por Cobrador</option>
                <option value="income">Reporte de Ingresos</option>
                <option value="delinquentsByNeighborhood">Morosos por Barrios</option>
                <option value="monthlyDelinquencyComparison">Comparativo de Morosidad Mensual</option>
              </select>
            </div>
            
            {/* Cobrador (solo para reporte por cobrador) */}
            {formData.reportType === 'collector' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cobrador
                </label>
                <select
                  name="collectorId"
                  value={formData.collectorId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Seleccionar cobrador</option>
                  {collectors.map(collector => (
                    <option key={collector.id} value={collector.id}>
                      {collector.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Fecha desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            
            {/* Fecha hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          
          {/* Descripción del reporte */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  {formData.reportType === 'collection' && 'Reporte de Cobranza'}
                  {formData.reportType === 'overdue' && 'Reporte de Morosidad'}
                  {formData.reportType === 'collector' && 'Reporte por Cobrador'}
                  {formData.reportType === 'income' && 'Reporte de Ingresos'}
                  {formData.reportType === 'delinquentsByNeighborhood' && 'Morosos por Barrios'}
                  {formData.reportType === 'monthlyDelinquencyComparison' && 'Comparativo de Morosidad Mensual'}
                </p>
                <p className="text-sm text-blue-700">
                  {getReportDescription(formData.reportType)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex space-x-3 mt-6">
            <button 
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="small" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Vista Previa
            </button>
            
            <button 
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Reportes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Características */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Características</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Formato PDF profesional con logo empresarial
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Datos en tiempo real del sistema
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Filtros por fecha y cobrador
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Métricas calculadas automáticamente
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Vista previa antes de descargar
                </li>
              </ul>
            </div>
            
            {/* Tipos disponibles */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Tipos de Reportes</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cobranza</p>
                    <p className="text-xs text-gray-500">Listado detallado de todos los pagos</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Morosidad</p>
                    <p className="text-xs text-gray-500">Clientes con pagos vencidos</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="h-4 w-4 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Por Cobrador</p>
                    <p className="text-xs text-gray-500">Rendimiento individual</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="h-4 w-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Ingresos</p>
                    <p className="text-xs text-gray-500">Análisis financiero de ingresos</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FileText className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Comparativo Morosidad</p>
                    <p className="text-xs text-gray-500">Análisis mes actual vs anterior</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de reporte de morosos por barrios */}
      {showNeighborhoodReport && neighborhoodReportData && (
        <DelinquentsByNeighborhoodReport
          reportData={neighborhoodReportData}
          onClose={() => {
            setShowNeighborhoodReport(false);
            setNeighborhoodReportData(null);
          }}
        />
      )}

      {/* Modal de reporte comparativo de morosidad */}
      {showComparisonReport && (
        <MonthlyDelinquencyComparisonReport
          onClose={() => setShowComparisonReport(false)}
        />
      )}
    </div>
  );
};

export default Reports;