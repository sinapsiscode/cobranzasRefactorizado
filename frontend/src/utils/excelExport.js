// Utilidad para exportar datos a Excel usando SheetJS
import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'datos', sheetName = 'Datos') => {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  // Crear un libro de trabajo
  const workbook = XLSX.utils.book_new();
  
  // Crear una hoja de trabajo desde los datos
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Agregar la hoja al libro
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Escribir y descargar el archivo
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportDashboardToExcel = async (metrics, clients, payments) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dashboard-export-${timestamp}`;

    // Crear un libro de trabajo
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Métricas generales
    if (metrics) {
      const metricsData = [{
        'Métrica': 'Total Cobrado',
        'Valor': metrics.totalCollected || 0,
        'Moneda': 'PEN',
        'Fecha': new Date().toLocaleDateString('es-PE')
      }, {
        'Métrica': 'Pagos Pendientes',
        'Valor': metrics.pendingPayments || 0,
        'Moneda': 'Cantidad',
        'Fecha': new Date().toLocaleDateString('es-PE')
      }, {
        'Métrica': 'Tasa de Morosidad (%)',
        'Valor': (metrics.overdueRate || 0).toFixed(1),
        'Moneda': 'Porcentaje',
        'Fecha': new Date().toLocaleDateString('es-PE')
      }, {
        'Métrica': 'Clientes Actuales',
        'Valor': metrics.currentClients || 0,
        'Moneda': 'Cantidad',
        'Fecha': new Date().toLocaleDateString('es-PE')
      }, {
        'Métrica': 'Total Pagos',
        'Valor': metrics.totalPayments || 0,
        'Moneda': 'Cantidad',
        'Fecha': new Date().toLocaleDateString('es-PE')
      }];

      const metricsWorksheet = XLSX.utils.json_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsWorksheet, 'Métricas');
    }

    // Hoja 2: Resumen de clientes
    if (clients && clients.length > 0) {
      const clientsData = clients.map(client => ({
        'ID': client.id,
        'Nombre Completo': client.fullName,
        'DNI': client.dni,
        'Teléfono': client.phone,
        'Correo': client.email || '',
        'Barrio': client.neighborhood,
        'Dirección': client.address,
        'Plan de Servicio': client.servicePlan,
        'Tipo de Servicio': client.serviceType || 'internet',
        'Estado': client.status === 'active' ? 'Activo' : 'Inactivo',
        'Fecha de Instalación': new Date(client.installationDate).toLocaleDateString('es-PE'),
        'Último Acceso': client.lastLogin ? new Date(client.lastLogin).toLocaleDateString('es-PE') : 'Sin registro'
      }));

      const clientsWorksheet = XLSX.utils.json_to_sheet(clientsData);
      XLSX.utils.book_append_sheet(workbook, clientsWorksheet, 'Clientes');
    }

    // Hoja 3: Pagos recientes
    if (payments && payments.length > 0) {
      const paymentsData = payments.slice(0, 1000).map(payment => ({
        'ID Pago': payment.id,
        'Cliente ID': payment.clientId,
        'Monto': payment.amount,
        'Estado': getPaymentStatusLabel(payment.status),
        'Período': payment.period,
        'Fecha de Vencimiento': new Date(payment.dueDate).toLocaleDateString('es-PE'),
        'Fecha de Pago': payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('es-PE') : '',
        'Método de Pago': payment.paymentMethod || '',
        'Cobrador ID': payment.collectorId || '',
        'Creado': new Date(payment.createdAt).toLocaleDateString('es-PE')
      }));

      const paymentsWorksheet = XLSX.utils.json_to_sheet(paymentsData);
      XLSX.utils.book_append_sheet(workbook, paymentsWorksheet, 'Pagos');
    }

    // Escribir el archivo Excel
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error(`Error al exportar: ${error.message}`);
  }
};


// Función auxiliar para obtener etiqueta del estado de pago
const getPaymentStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    overdue: 'Vencido',
    collected: 'Cobrado',
    validated: 'Validado',
    paid: 'Pagado',
    partial: 'Parcial'
  };
  return labels[status] || status;
};

// Exportar datos específicos con formato personalizado (compatible con BD ABONADOS)
export const exportClientsToExcel = (clients) => {
  if (!clients || clients.length === 0) {
    throw new Error('No hay clientes para exportar');
  }

  const clientsData = clients.map((client, index) => ({
    'ITEM': index + 1,
    'APELLIDOS': client.apellidos || client.fullName?.split(' ').slice(0, -1).join(' ') || '',
    'NOMBRES': client.nombres || client.fullName?.split(' ').slice(-1).join(' ') || '',
    'DNI': client.dni,
    'CELULAR': client.phone,
    'COSTO MES': client.costoMensual || (
      client.servicePlan === 'basic' ? 80 :
      client.servicePlan === 'standard' ? 120 :
      client.servicePlan === 'premium' ? 160 : 80
    ),
    'COSTO DE INST': client.costoInstalacion || 0,
    'DIRECCIÓN': client.neighborhood || client.address,
    'CONDICION': client.tipoTarifa === 'gratuitous' ? 'GRATUITO' : 'ACTIVO',
    'REFERENCIA': client.referencia || '',
    'FEC_INST': client.installationDate ? new Date(client.installationDate).toLocaleDateString('es-PE') : '',
    'OBSERVACIONES': client.observaciones || '',
    
    // Información adicional del sistema actual
    'Email': client.email || '',
    'Plan Sistema': client.servicePlan,
    'Estado Sistema': client.status === 'active' ? 'Activo' : 
                      client.status === 'paused' ? 'En Pausa' : 
                      client.status === 'debt' ? 'Con Deuda' :
                      client.status === 'suspended' ? 'Suspendido' : 
                      'De Baja',
    'Tipo Tarifa': client.tipoTarifa || 'standard',
    'Meses Adeudados': client.mesesAdeudados || 0,
    'Deuda Total': client.deudaTotal || 0,
    'Último Pago': client.ultimoPago || 'Sin pagos',
    'Deuda Más Antigua': client.deudaMasAntigua || '',
    'Último Acceso': client.lastLogin ? new Date(client.lastLogin).toLocaleDateString('es-PE') : 'Sin registro'
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  exportToExcel(clientsData, `clientes-bd-abonados-${timestamp}`, 'BD COBRANZA');
};

export const exportPaymentsToExcel = (payments) => {
  if (!payments || payments.length === 0) {
    throw new Error('No hay pagos para exportar');
  }

  const paymentsData = payments.map(payment => ({
    'ID': payment.id,
    'Cliente ID': payment.clientId,
    'Monto': payment.amount,
    'Estado': getPaymentStatusLabel(payment.status),
    'Período': payment.period,
    'Fecha Vencimiento': new Date(payment.dueDate).toLocaleDateString('es-PE'),
    'Fecha Pago': payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('es-PE') : '',
    'Método Pago': payment.paymentMethod || '',
    'Cobrador': payment.collectorId || '',
    'Creado': new Date(payment.createdAt).toLocaleDateString('es-PE')
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  exportToExcel(paymentsData, `pagos-${timestamp}`, 'Lista de Pagos');
};

export const exportMetricsToExcel = (metrics) => {
  if (!metrics) {
    throw new Error('No hay métricas para exportar');
  }

  const metricsData = [
    { 'Métrica': 'Total Cobrado', 'Valor': metrics.totalCollected || 0, 'Moneda': 'PEN', 'Fecha': new Date().toLocaleDateString('es-PE') },
    { 'Métrica': 'Pagos Pendientes', 'Valor': metrics.pendingPayments || 0, 'Moneda': 'Cantidad', 'Fecha': new Date().toLocaleDateString('es-PE') },
    { 'Métrica': 'Tasa de Morosidad (%)', 'Valor': (metrics.overdueRate || 0).toFixed(2), 'Moneda': 'Porcentaje', 'Fecha': new Date().toLocaleDateString('es-PE') },
    { 'Métrica': 'Clientes Actuales', 'Valor': metrics.currentClients || 0, 'Moneda': 'Cantidad', 'Fecha': new Date().toLocaleDateString('es-PE') },
    { 'Métrica': 'Total de Pagos', 'Valor': metrics.totalPayments || 0, 'Moneda': 'Cantidad', 'Fecha': new Date().toLocaleDateString('es-PE') }
  ];

  const timestamp = new Date().toISOString().split('T')[0];
  exportToExcel(metricsData, `metricas-${timestamp}`, 'Métricas del Sistema');
};

export const exportMonthlyDebtMatrixToExcel = (clients, year, getClientDebts, getClientSummary) => {
  if (!clients || clients.length === 0) {
    throw new Error('No hay clientes para exportar');
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    name: getMonthName(i + 1)
  }));

  // Función auxiliar para obtener nombre del mes
  function getMonthName(monthNumber) {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthNumber - 1] || '';
  }

  const matrixData = clients.map(client => {
    const row = {
      'Cliente': client.fullName,
      'N° de celular': client.phone || ''
    };

    // Agregar columna para cada mes
    months.forEach(month => {
      const debts = getClientDebts(client.id, year);
      const monthDebt = debts.find(debt => debt.month === month.month);

      // Si existe deuda para este mes
      if (monthDebt) {
        // Si está pagada, mostrar "Pagado"
        if (monthDebt.status === 'paid' || monthDebt.status === 'collected' || monthDebt.status === 'validated') {
          row[month.name] = 'Pagado';
        }
        // Si no está pagada, mostrar el monto pendiente
        else {
          row[month.name] = `S/ ${monthDebt.amount.toFixed(2)}`;
        }
      } else {
        // Si no hay deuda registrada para ese mes, dejar vacío
        row[month.name] = '';
      }
    });

    return row;
  });

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `matriz-deudas-mensuales-${year}-${timestamp}`;

  exportToExcel(matrixData, filename, `Matriz Deudas ${year}`);
};

export const exportBackupToExcel = (backupData) => {
  if (!backupData || !backupData.paymentReport) {
    throw new Error('Datos de backup inválidos');
  }

  const { paymentReport, metadata } = backupData;
  const timestamp = new Date(backupData.timestamp).toLocaleDateString('es-PE').replace(/\//g, '-');

  // Crear un libro de trabajo
  const workbook = XLSX.utils.book_new();

  // HOJA 1: Resumen General
  const summaryData = [
    { 'Descripción': 'Fecha del Backup', 'Valor': new Date(backupData.timestamp).toLocaleString('es-PE') },
    { 'Descripción': 'Versión', 'Valor': backupData.version },
    { 'Descripción': '', 'Valor': '' },
    { 'Descripción': '=== CLIENTES ===', 'Valor': '' },
    { 'Descripción': 'Total de Clientes', 'Valor': metadata.totalClients },
    { 'Descripción': 'Clientes con Deuda', 'Valor': metadata.clientsWithDebt },
    { 'Descripción': 'Clientes al Día', 'Valor': metadata.clientsPaid },
    { 'Descripción': '', 'Valor': '' },
    { 'Descripción': '=== MONTOS ===', 'Valor': '' },
    { 'Descripción': 'Total Deuda Pendiente', 'Valor': `S/ ${metadata.totalDebtAmount.toFixed(2)}` },
    { 'Descripción': 'Total Pagado', 'Valor': `S/ ${metadata.totalPaidAmount.toFixed(2)}` },
    { 'Descripción': '', 'Valor': '' },
    { 'Descripción': '=== OTROS DATOS ===', 'Valor': '' },
    { 'Descripción': 'Total de Pagos', 'Valor': metadata.totalPayments },
    { 'Descripción': 'Total de Servicios', 'Valor': metadata.totalServices },
    { 'Descripción': 'Total de Cajas', 'Valor': metadata.totalCashBoxes },
    { 'Descripción': 'Tamaño del Backup', 'Valor': `${metadata.backupSize} KB` }
  ];

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen');

  // HOJA 2: Clientes con Deuda
  if (paymentReport.clientsWithDebt && paymentReport.clientsWithDebt.length > 0) {
    const debtData = paymentReport.clientsWithDebt.map(client => ({
      'Cliente': client.fullName,
      'DNI': client.dni || '',
      'N° de Celular': client.phone || '',
      'Deuda Total': `S/ ${client.totalDebt.toFixed(2)}`,
      'Pagos Pendientes': client.pendingPaymentsCount,
      'Plan': client.servicePlan || '',
      'Barrio': client.neighborhood || ''
    }));

    const debtWorksheet = XLSX.utils.json_to_sheet(debtData);
    XLSX.utils.book_append_sheet(workbook, debtWorksheet, 'Clientes con Deuda');
  }

  // HOJA 3: Clientes que Han Pagado
  if (paymentReport.clientsPaid && paymentReport.clientsPaid.length > 0) {
    const paidData = paymentReport.clientsPaid.map(client => ({
      'Cliente': client.fullName,
      'DNI': client.dni || '',
      'N° de Celular': client.phone || '',
      'Total Pagado': `S/ ${client.totalPaid.toFixed(2)}`,
      'Pagos Realizados': client.paidPaymentsCount,
      'Último Pago': client.lastPaymentDate ? new Date(client.lastPaymentDate).toLocaleDateString('es-PE') : 'N/A',
      'Plan': client.servicePlan || '',
      'Barrio': client.neighborhood || ''
    }));

    const paidWorksheet = XLSX.utils.json_to_sheet(paidData);
    XLSX.utils.book_append_sheet(workbook, paidWorksheet, 'Clientes al Día');
  }

  // HOJA 4: Todos los Clientes con Estado
  if (paymentReport.clientsWithPaymentStatus && paymentReport.clientsWithPaymentStatus.length > 0) {
    const allClientsData = paymentReport.clientsWithPaymentStatus.map(client => ({
      'Cliente': client.fullName,
      'DNI': client.dni || '',
      'N° de Celular': client.phone || '',
      'Email': client.email || '',
      'Plan': client.servicePlan || '',
      'Tipo de Servicio': client.serviceType || '',
      'Barrio': client.neighborhood || '',
      'Estado Cliente': client.status || '',
      'Tiene Deuda': client.paymentStatus.hasDebt ? 'SÍ' : 'NO',
      'Ha Pagado': client.paymentStatus.hasPaid ? 'SÍ' : 'NO',
      'Deuda Pendiente': `S/ ${client.paymentStatus.totalDebt.toFixed(2)}`,
      'Total Pagado': `S/ ${client.paymentStatus.totalPaid.toFixed(2)}`,
      'Pagos Pendientes': client.paymentStatus.pendingPaymentsCount,
      'Pagos Realizados': client.paymentStatus.paidPaymentsCount,
      'Último Pago': client.paymentStatus.lastPaymentDate ? new Date(client.paymentStatus.lastPaymentDate).toLocaleDateString('es-PE') : 'N/A'
    }));

    const allClientsWorksheet = XLSX.utils.json_to_sheet(allClientsData);
    XLSX.utils.book_append_sheet(workbook, allClientsWorksheet, 'Todos los Clientes');
  }

  // Escribir el archivo Excel
  const filename = `backup-completo-${timestamp}`;
  XLSX.writeFile(workbook, `${filename}.xlsx`);

  return filename;
};