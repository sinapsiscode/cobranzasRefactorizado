// Servicio de generación de reportes
// MIGRADO A JSON SERVER - Usa fetch() en lugar de db
import { downloadPDF, previewPDF } from './pdfGenerator.jsx';
import { format, parseISO, differenceInDays } from 'date-fns';
import { getServiceTypeLabel } from '../../schemas/service.js';

const API_URL = '/api';

export class ReportService {
  // Generar datos para reporte de cobranza
  static async generateCollectionReportData(filters = {}) {
    try {
      const { startDate, endDate, collectorId } = filters;

      // Obtener datos base desde API
      const paymentsResponse = await fetch(`${API_URL}/payments`);
      const payments = await paymentsResponse.json();

      const clientsResponse = await fetch(`${API_URL}/clients`);
      const clients = await clientsResponse.json();
      
      // Crear mapa de clientes para nombres
      const clientMap = clients.reduce((acc, client) => {
        acc[client.id] = client.fullName;
        return acc;
      }, {});
      
      // Filtrar pagos según criterios
      let filteredPayments = payments;
      
      if (startDate) {
        filteredPayments = filteredPayments.filter(p => 
          p.paymentDate && p.paymentDate >= startDate
        );
      }
      
      if (endDate) {
        filteredPayments = filteredPayments.filter(p => 
          p.paymentDate && p.paymentDate <= endDate
        );
      }
      
      if (collectorId) {
        filteredPayments = filteredPayments.filter(p => p.collectorId === collectorId);
      }
      
      // Agregar nombres de clientes a los pagos
      const paymentsWithClientNames = filteredPayments.map(payment => ({
        ...payment,
        clientName: clientMap[payment.clientId] || 'Cliente Desconocido'
      }));
      
      // Calcular métricas
      const totalCollected = filteredPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalPayments = filteredPayments.length;
      const overduePayments = filteredPayments.filter(p => p.status === 'overdue').length;
      const overdueRate = totalPayments > 0 ? (overduePayments / totalPayments) * 100 : 0;
      
      return {
        payments: paymentsWithClientNames,
        totalCollected,
        totalPayments,
        overdueRate: Math.round(overdueRate * 100) / 100,
        filters
      };
    } catch (error) {
      console.error('Error generating collection report data:', error);
      throw new Error('Error al generar datos del reporte de cobranza');
    }
  }
  
  // Generar datos para reporte de morosidad
  static async generateOverdueReportData(filters = {}) {
    try {
      const paymentsResponse = await fetch(`${API_URL}/payments`);
      const payments = await paymentsResponse.json();

      const clientsResponse = await fetch(`${API_URL}/clients`);
      const clients = await clientsResponse.json();
      
      // Crear mapa de clientes
      const clientMap = clients.reduce((acc, client) => {
        acc[client.id] = client.fullName;
        return acc;
      }, {});
      
      // Filtrar solo pagos vencidos
      const overduePayments = payments.filter(p => p.status === 'overdue');
      
      // Calcular días de vencimiento
      const overdueWithDays = overduePayments.map(payment => {
        const dueDate = new Date(payment.dueDate);
        const today = new Date();
        const daysOverdue = differenceInDays(today, dueDate);
        
        return {
          ...payment,
          clientName: clientMap[payment.clientId] || 'Cliente Desconocido',
          daysOverdue: Math.max(0, daysOverdue)
        };
      });
      
      // Ordenar por días vencidos (mayor a menor)
      overdueWithDays.sort((a, b) => b.daysOverdue - a.daysOverdue);
      
      // Calcular métricas
      const overdueClients = new Set(overduePayments.map(p => p.clientId)).size;
      const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPayments = payments.length;
      const overdueRate = totalPayments > 0 ? (overduePayments.length / totalPayments) * 100 : 0;
      
      return {
        overduePayments: overdueWithDays,
        overdueClients,
        overdueAmount,
        overdueRate: Math.round(overdueRate * 100) / 100,
        filters
      };
    } catch (error) {
      console.error('Error generating overdue report data:', error);
      throw new Error('Error al generar datos del reporte de morosidad');
    }
  }
  
  // Generar datos para reporte por cobrador
  static async generateCollectorReportData(filters = {}) {
    try {
      const { collectorId } = filters;
      
      if (!collectorId) {
        throw new Error('ID de cobrador es requerido');
      }
      
      // Usar el mismo datos del reporte de cobranza pero filtrado por cobrador
      return await this.generateCollectionReportData({ ...filters, collectorId });
    } catch (error) {
      console.error('Error generating collector report data:', error);
      throw new Error('Error al generar datos del reporte por cobrador');
    }
  }
  
  // Generar datos para reporte de ingresos
  static async generateIncomeReportData(filters = {}) {
    try {
      const { startDate, endDate } = filters;

      // Obtener datos base desde API
      const paymentsResponse = await fetch(`${API_URL}/payments`);
      const payments = await paymentsResponse.json();

      const clientsResponse = await fetch(`${API_URL}/clients`);
      const clients = await clientsResponse.json();
      
      // Filtrar solo pagos confirmados
      let paidPayments = payments.filter(p => p.status === 'paid');
      
      if (startDate) {
        paidPayments = paidPayments.filter(p => 
          p.paymentDate && p.paymentDate >= startDate
        );
      }
      
      if (endDate) {
        paidPayments = paidPayments.filter(p => 
          p.paymentDate && p.paymentDate <= endDate
        );
      }
      
      // Agrupar por mes
      const incomeByMonth = paidPayments.reduce((acc, payment) => {
        const monthKey = payment.month;
        acc[monthKey] = (acc[monthKey] || 0) + payment.amount;
        return acc;
      }, {});
      
      // Crear mapa de clientes
      const clientMap = clients.reduce((acc, client) => {
        acc[client.id] = client.fullName;
        return acc;
      }, {});
      
      // Agregar nombres de clientes
      const paymentsWithClientNames = paidPayments.map(payment => ({
        ...payment,
        clientName: clientMap[payment.clientId] || 'Cliente Desconocido'
      }));
      
      const totalCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
      
      return {
        payments: paymentsWithClientNames,
        incomeByMonth,
        totalCollected,
        totalPayments: paidPayments.length,
        overdueRate: 0, // Para ingresos, la morosidad no aplica
        filters
      };
    } catch (error) {
      console.error('Error generating income report data:', error);
      throw new Error('Error al generar datos del reporte de ingresos');
    }
  }
  
  // Función principal para generar y descargar reportes
  static async generateReport(reportType, filters = {}, action = 'download') {
    try {
      let reportData;
      
      // Generar datos según tipo de reporte
      switch (reportType) {
        case 'collection':
          reportData = await this.generateCollectionReportData(filters);
          break;
        case 'overdue':
          reportData = await this.generateOverdueReportData(filters);
          break;
        case 'collector':
          reportData = await this.generateCollectorReportData(filters);
          break;
        case 'income':
          reportData = await this.generateIncomeReportData(filters);
          break;
        case 'delinquentsByNeighborhood':
          reportData = await this.generateDelinquentsByNeighborhoodReportData(filters);
          break;
        default:
          throw new Error('Tipo de reporte no soportado');
      }
      
      // Verificar que hay datos suficientes
      if (!reportData || (reportData.payments && reportData.payments.length === 0)) {
        return {
          success: false,
          error: 'insuficiencia_datos',
          message: 'No hay datos suficientes para generar este reporte',
          missing: ['payments']
        };
      }
      
      // Ejecutar acción solicitada
      if (action === 'preview') {
        const url = await previewPDF(reportType, reportData, filters);
        return { success: true, action: 'preview', url };
      } else {
        await downloadPDF(reportType, reportData, filters);
        return { success: true, action: 'download' };
      }
      
    } catch (error) {
      console.error('Error in generateReport:', error);
      return {
        success: false,
        error: 'generation_error',
        message: error.message || 'Error al generar el reporte'
      };
    }
  }
  
  // Generar datos para reporte de morosos por barrios
  static async generateDelinquentsByNeighborhoodReportData(filters = {}) {
    try {
      const { startDate, endDate } = filters;

      // Obtener datos desde API
      const clientsResponse = await fetch(`${API_URL}/clients`);
      const clients = await clientsResponse.json();

      const paymentsResponse = await fetch(`${API_URL}/payments`);
      const payments = await paymentsResponse.json();

      const servicesResponse = await fetch(`${API_URL}/services`);
      const services = await servicesResponse.json();

      // Crear mapa de servicios
      const serviceMap = services.reduce((acc, service) => {
        acc[service.id] = service;
        return acc;
      }, {});
      
      // Crear mapa de pagos por cliente
      const clientPaymentsMap = payments.reduce((acc, payment) => {
        if (!acc[payment.clientId]) {
          acc[payment.clientId] = [];
        }
        acc[payment.clientId].push(payment);
        return acc;
      }, {});
      
      // Identificar clientes morosos
      const delinquentClients = clients.filter(client => {
        const clientPayments = clientPaymentsMap[client.id] || [];
        
        // Filtrar por fechas si se especifican
        let relevantPayments = clientPayments;
        if (startDate || endDate) {
          relevantPayments = clientPayments.filter(payment => {
            if (startDate && payment.dueDate && payment.dueDate < startDate) return false;
            if (endDate && payment.dueDate && payment.dueDate > endDate) return false;
            return true;
          });
        }
        
        // Cliente es moroso si tiene pagos pendientes o vencidos
        return relevantPayments.some(payment => 
          payment.status === 'overdue' || 
          (payment.status === 'pending' && new Date(payment.dueDate) < new Date())
        );
      });
      
      // Agrupar por barrio
      const neighborhoodGroups = delinquentClients.reduce((acc, client) => {
        const neighborhood = client.neighborhood || 'Sin barrio';
        
        if (!acc[neighborhood]) {
          acc[neighborhood] = {
            neighborhood,
            clientsCount: 0,
            clients: [],
            totalDebt: 0
          };
        }
        
        // Calcular deuda total del cliente
        const clientPayments = clientPaymentsMap[client.id] || [];
        const clientDebt = clientPayments
          .filter(p => p.status === 'overdue' || p.status === 'pending')
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        acc[neighborhood].clientsCount++;
        acc[neighborhood].totalDebt += clientDebt;
        // Obtener información del servicio contratado
        const clientService = client.serviceId ? serviceMap[client.serviceId] : null;
        const serviceName = clientService ? clientService.name : 'Sin servicio';
        const serviceType = clientService ? clientService.serviceType : '';
        const serviceFullName = clientService ? `${serviceName}${serviceType ? ` - ${getServiceTypeLabel(serviceType)}` : ''}` : 'Sin servicio';

        // Obtener meses adeudados
        const overduePaymentsList = clientPayments.filter(p => p.status === 'overdue' || (p.status === 'pending' && new Date(p.dueDate) < new Date()));
        const owedMonths = overduePaymentsList.map(payment => {
          const date = new Date(payment.dueDate);
          return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        }).sort();

        acc[neighborhood].clients.push({
          id: client.id,
          fullName: client.fullName,
          phone: client.phone,
          address: client.address,
          dni: client.dni,
          status: client.status,
          debt: clientDebt,
          overduePayments: clientPayments.filter(p => p.status === 'overdue').length,
          pendingPayments: clientPayments.filter(p => p.status === 'pending').length,
          serviceName: serviceFullName,
          owedMonths: owedMonths,
          owedMonthsText: owedMonths.length > 0 ? owedMonths.join(', ') : 'Sin meses adeudados'
        });
        
        return acc;
      }, {});
      
      // Convertir a array y ordenar por cantidad de morosos
      const neighborhoodData = Object.values(neighborhoodGroups)
        .sort((a, b) => b.clientsCount - a.clientsCount);
      
      const summary = {
        totalNeighborhoods: neighborhoodData.length,
        totalDelinquentClients: delinquentClients.length,
        totalDebt: neighborhoodData.reduce((sum, n) => sum + n.totalDebt, 0),
        averageDebtPerNeighborhood: neighborhoodData.length > 0 
          ? neighborhoodData.reduce((sum, n) => sum + n.totalDebt, 0) / neighborhoodData.length 
          : 0,
        topNeighborhoods: neighborhoodData.slice(0, 5)
      };
      
      return {
        type: 'delinquentsByNeighborhood',
        summary,
        neighborhoods: neighborhoodData,
        filters
      };
      
    } catch (error) {
      console.error('Error generating delinquents by neighborhood report data:', error);
      throw new Error('Error al generar datos del reporte de morosos por barrios');
    }
  }

  // Obtener lista de cobradores para filtros
  static async getCollectors() {
    try {
      const response = await fetch(`${API_URL}/users`);
      const users = await response.json();

      return users
        .filter(user => user.role === 'collector' && user.isActive)
        .map(user => ({
          id: user.id,
          name: user.fullName
        }));
    } catch (error) {
      console.error('Error getting collectors:', error);
      return [];
    }
  }
  
  // Validar filtros de fecha
  static validateDateFilters(filters) {
    const { startDate, endDate } = filters;
    
    if (startDate && endDate && startDate > endDate) {
      throw new Error('La fecha de inicio no puede ser mayor a la fecha final');
    }
    
    return true;
  }
}