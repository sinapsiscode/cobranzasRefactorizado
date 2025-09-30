// Generador de reportes PDF con @react-pdf/renderer
import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  pdf,
  Image
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Estilos para PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6'
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15
  },
  companyInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5
  },
  companySubtitle: {
    fontSize: 14,
    color: '#6B7280'
  },
  reportInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5
  },
  reportDate: {
    fontSize: 12,
    color: '#6B7280'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2937'
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    marginBottom: 20
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#F3F4F6'
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB'
  },
  tableColWide: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB'
  },
  tableCell: {
    margin: 'auto',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 10,
    textAlign: 'center'
  },
  tableCellHeader: {
    margin: 'auto',
    marginTop: 8,
    marginBottom: 8,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 5
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6B7280'
  },
  footer: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#6B7280',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
    textTransform: 'uppercase'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 'bold'
  },
  value: {
    fontSize: 11,
    color: '#1F2937',
    flex: 1
  }
});

// Componente de reporte de cobranza
const CollectionReport = ({ data, filters }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>TV Cable</Text>
          <Text style={styles.companySubtitle}>Sistema de Cobranzas</Text>
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>Reporte de Cobranza</Text>
          <Text style={styles.reportDate}>
            Generado: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </View>
      </View>

      {/* Filtros aplicados */}
      <View style={styles.section}>
        <Text style={styles.title}>Filtros Aplicados</Text>
        <Text style={{ fontSize: 10, marginBottom: 10 }}>
          Período: {filters.startDate || 'Inicio'} - {filters.endDate || 'Actual'}
        </Text>
        {filters.collector && (
          <Text style={{ fontSize: 10, marginBottom: 10 }}>
            Cobrador: {filters.collector}
          </Text>
        )}
      </View>

      {/* Resumen */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>S/ {data.totalCollected?.toLocaleString() || '0'}</Text>
          <Text style={styles.summaryLabel}>Total Recaudado</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{data.totalPayments || '0'}</Text>
          <Text style={styles.summaryLabel}>Total Pagos</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{data.overdueRate || '0'}%</Text>
          <Text style={styles.summaryLabel}>Tasa Morosidad</Text>
        </View>
      </View>

      {/* Tabla de pagos */}
      <View style={styles.section}>
        <Text style={styles.title}>Detalle de Pagos</Text>
        
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellHeader}>Cliente</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellHeader}>Monto</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellHeader}>Fecha</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellHeader}>Estado</Text>
            </View>
          </View>

          {/* Filas de datos */}
          {data.payments?.slice(0, 15).map((payment, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {payment.clientName?.substring(0, 20) || 'Cliente'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  S/ {payment.amount?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd/MM/yyyy') : 'Pendiente'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {getStatusLabel(payment.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {data.payments?.length > 15 && (
          <Text style={{ fontSize: 10, textAlign: 'center', color: '#6B7280' }}>
            Mostrando los primeros 15 de {data.payments.length} registros
          </Text>
        )}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        TV Cable - Sistema de Cobranzas | Página 1 de 1
      </Text>
    </Page>
  </Document>
);

// Componente de recibo de pago
const PaymentReceipt = ({ payment, client, collector, validator }) => (
  <Document>
    <Page size="A5" style={[styles.page, { padding: 20 }]}>
      {/* Header del recibo */}
      <View style={[styles.header, { borderBottomWidth: 1, paddingBottom: 10, marginBottom: 15 }]}>
        <View style={styles.companyInfo}>
          <Text style={[styles.companyName, { fontSize: 20 }]}>TV Cable</Text>
          <Text style={[styles.companySubtitle, { fontSize: 12 }]}>Sistema de Cobranzas</Text>
        </View>
        <View style={styles.reportInfo}>
          <Text style={[styles.reportTitle, { fontSize: 16 }]}>RECIBO DE PAGO</Text>
          <Text style={[styles.reportDate, { fontSize: 10 }]}>
            Nº {payment.id}
          </Text>
        </View>
      </View>

      {/* Información del cliente */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>CLIENTE:</Text>
        <Text style={{ fontSize: 11 }}>{client?.fullName}</Text>
        <Text style={{ fontSize: 10, color: '#6B7280' }}>DNI: {client?.dni}</Text>
        <Text style={{ fontSize: 10, color: '#6B7280' }}>{client?.address}</Text>
      </View>

      {/* Detalles del pago */}
      <View style={{ marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB', padding: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 11 }}>Servicio:</Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold' }}>TV Cable {client?.servicePlan}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 11 }}>Mes de servicio:</Text>
          <Text style={{ fontSize: 11 }}>{payment.month}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 11 }}>Fecha de pago:</Text>
          <Text style={{ fontSize: 11 }}>{payment.paymentDate || new Date().toLocaleDateString('es-PE')}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 11 }}>Método de pago:</Text>
          <Text style={{ fontSize: 11 }}>{payment.paymentMethod === 'cash' ? 'Efectivo' : payment.paymentMethod}</Text>
        </View>
        <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>TOTAL PAGADO:</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>S/ {payment.amount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Firmas */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 15 }}>
        {/* Firma del Cobrador */}
        <View style={{ alignItems: 'center', flex: 1 }}>
          <View style={{ borderTopWidth: 1, borderTopColor: '#000', width: 120, paddingTop: 3 }}>
            <Text style={{ textAlign: 'center', fontSize: 10, fontStyle: 'italic' }}>
              {collector?.alias || collector?.fullName || 'Cobrador'}
            </Text>
          </View>
          <Text style={{ fontSize: 8, marginTop: 3, fontWeight: 'bold' }}>Firma del Cobrador</Text>
          <Text style={{ fontSize: 7, color: '#6b7280', marginTop: 1 }}>
            {collector?.alias}
          </Text>
        </View>

        {/* Firma del Validador (solo si el pago está validado) */}
        {validator && (
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', width: 120, paddingTop: 3 }}>
              <Text style={{ textAlign: 'center', fontSize: 10, fontStyle: 'italic' }}>
                {validator.fullName || 'Administrador'}
              </Text>
            </View>
            <Text style={{ fontSize: 8, marginTop: 3, fontWeight: 'bold' }}>Firma del Validador</Text>
            <Text style={{ fontSize: 7, color: '#6b7280', marginTop: 1 }}>
              {validator.role === 'subadmin' ? 'Administrador' : 'Súper administrador'}
            </Text>
          </View>
        )}
      </View>

      {/* Nota */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10 }}>
        <Text style={{ fontSize: 9, color: '#6B7280', textAlign: 'center' }}>
          Gracias por su pago puntual
        </Text>
        <Text style={{ fontSize: 8, color: '#9CA3AF', textAlign: 'center', marginTop: 5 }}>
          Este documento es un comprobante válido de pago
        </Text>
      </View>

      {/* Footer con fecha y hora de impresión */}
      <View style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        <Text style={{ fontSize: 8, color: '#9CA3AF', textAlign: 'center' }}>
          Impreso: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
        </Text>
      </View>
    </Page>
  </Document>
);

// Componente de reporte de morosidad
const OverdueReport = ({ data, filters }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>TV Cable</Text>
          <Text style={styles.companySubtitle}>Sistema de Cobranzas</Text>
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>Reporte de Morosidad</Text>
          <Text style={styles.reportDate}>
            Generado: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </View>
      </View>

      {/* Resumen de morosidad */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{data.overdueClients || '0'}</Text>
          <Text style={styles.summaryLabel}>Clientes Morosos</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>S/ {data.overdueAmount?.toLocaleString() || '0'}</Text>
          <Text style={styles.summaryLabel}>Monto Vencido</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{data.overdueRate || '0'}%</Text>
          <Text style={styles.summaryLabel}>Tasa Morosidad</Text>
        </View>
      </View>

      {/* Tabla de clientes morosos */}
      <View style={styles.section}>
        <Text style={styles.title}>Clientes con Pagos Vencidos</Text>
        
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableColWide}>
              <Text style={styles.tableCellHeader}>Cliente</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellHeader}>Días Vencido</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellHeader}>Monto</Text>
            </View>
          </View>

          {data.overduePayments?.slice(0, 20).map((payment, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text style={styles.tableCell}>
                  {payment.clientName?.substring(0, 30) || 'Cliente'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {payment.daysOverdue || '0'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  S/ {payment.amount?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>
        TV Cable - Sistema de Cobranzas | Reporte de Morosidad
      </Text>
    </Page>
  </Document>
);

// Helper functions
const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    collected: 'Cobrado', 
    validated: 'Validado',
    paid: 'Pagado',
    overdue: 'Vencido',
    partial: 'Parcial'
  };
  return labels[status] || status;
};

// Función principal para generar PDFs
export const generatePDF = async (reportType, data, filters = {}) => {
  try {
    let reportComponent;

    switch (reportType) {
      case 'collection':
        reportComponent = <CollectionReport data={data} filters={filters} />;
        break;
      case 'overdue':
        reportComponent = <OverdueReport data={data} filters={filters} />;
        break;
      case 'payment-note':
        reportComponent = <PaymentNoteReport data={data} />;
        break;
      case 'collector':
        reportComponent = <CollectionReport data={data} filters={filters} />;
        break;
      case 'income':
        reportComponent = <CollectionReport data={data} filters={filters} />;
        break;
      case 'receipt':
        reportComponent = <PaymentReceipt payment={data.payment} client={data.client} collector={data.collector} validator={data.validator} />;
        break;
      default:
        throw new Error('Tipo de reporte no soportado');
    }

    // Generar PDF blob
    const pdfBlob = await pdf(reportComponent).toBlob();
    
    return pdfBlob;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};

// Función para descargar PDF
export const downloadPDF = async (reportType, data, filters = {}) => {
  try {
    const pdfBlob = await generatePDF(reportType, data, filters);
    
    // Crear URL de descarga
    const url = URL.createObjectURL(pdfBlob);
    
    // Crear enlace temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${reportType}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error descargando PDF:', error);
    throw error;
  }
};

// Función para preview de PDF
export const previewPDF = async (reportType, data, filters = {}) => {
  try {
    const pdfBlob = await generatePDF(reportType, data, filters);
    const url = URL.createObjectURL(pdfBlob);
    
    // Abrir en nueva ventana para preview
    window.open(url, '_blank');
    
    return url;
  } catch (error) {
    console.error('Error en preview PDF:', error);
    throw error;
  }
};

// Componente de Nota de Pago para Cobradores
const PaymentNoteReport = ({ data }) => {
  const { payment, client, collector, validator } = data;
  
  const planDetails = {
    basic: { name: 'Básico', price: 80, speed: '50 Mbps', channels: '80 canales HD' },
    standard: { name: 'Estándar', price: 120, speed: '100 Mbps', channels: '120 canales HD' },
    premium: { name: 'Premium', price: 160, speed: '200 Mbps', channels: '180 canales HD + HBO' }
  };

  const plan = planDetails[client.servicePlan] || planDetails.basic;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>TV Cable Cobranzas</Text>
            <Text style={styles.companySubtitle}>NOTA DE PAGO</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportDate}>N° {payment.id}</Text>
            <Text style={styles.reportDate}>{format(new Date(), 'dd/MM/yyyy')}</Text>
          </View>
        </View>

        {/* Datos del Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={[styles.infoRow, { paddingVertical: 3 }]}>
            <Text style={[styles.label, { width: 100 }]}>Nombre:</Text>
            <Text style={styles.value}>{client.fullName}</Text>
          </View>
          <View style={[styles.infoRow, { paddingVertical: 3 }]}>
            <Text style={[styles.label, { width: 100 }]}>DNI:</Text>
            <Text style={styles.value}>{client.dni}</Text>
          </View>
          <View style={[styles.infoRow, { paddingVertical: 3 }]}>
            <Text style={[styles.label, { width: 100 }]}>Dirección:</Text>
            <Text style={styles.value}>{client.address}</Text>
          </View>
          <View style={[styles.infoRow, { paddingVertical: 3 }]}>
            <Text style={[styles.label, { width: 100 }]}>Teléfono:</Text>
            <Text style={styles.value}>{client.phone}</Text>
          </View>
        </View>

        {/* Detalle del Servicio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DEL SERVICIO CONTRATADO</Text>
          <View style={{ backgroundColor: '#f0f9ff', padding: 15, borderRadius: 5 }}>
            <View style={[styles.infoRow, { paddingVertical: 3 }]}>
              <Text style={[styles.label, { width: 150 }]}>Plan:</Text>
              <Text style={[styles.value, { fontWeight: 'bold' }]}>
                {plan.name.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.infoRow, { paddingVertical: 3 }]}>
              <Text style={[styles.label, { width: 150 }]}>Velocidad Internet:</Text>
              <Text style={styles.value}>{plan.speed}</Text>
            </View>
            <View style={[styles.infoRow, { paddingVertical: 3 }]}>
              <Text style={[styles.label, { width: 150 }]}>Canales TV:</Text>
              <Text style={styles.value}>{plan.channels}</Text>
            </View>
            <View style={[styles.infoRow, { paddingVertical: 3 }]}>
              <Text style={[styles.label, { width: 150 }]}>Mensualidad:</Text>
              <Text style={[styles.value, { fontSize: 16, color: '#059669' }]}>
                S/ {plan.price}.00
              </Text>
            </View>
          </View>
        </View>

        {/* Detalle del Pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DEL PAGO</Text>
          <View style={[styles.infoRow, { paddingVertical: 3 }]}>
            <Text style={[styles.label, { width: 120 }]}>Periodo:</Text>
            <Text style={styles.value}>
              {payment.month || format(new Date(), 'MMMM yyyy', { locale: es })}
            </Text>
          </View>
          <View style={[styles.infoRow, { paddingVertical: 3 }]}>
            <Text style={[styles.label, { width: 120 }]}>Fecha de Pago:</Text>
            <Text style={styles.value}>{format(new Date(), 'dd/MM/yyyy')}</Text>
          </View>
          <View style={[styles.infoRow, { paddingVertical: 3 }]}>
            <Text style={[styles.label, { width: 120 }]}>Método de Pago:</Text>
            <Text style={styles.value}>
              {payment.paymentMethod === 'cash' ? 'Efectivo' : 
               payment.paymentMethod === 'transfer' ? 'Transferencia' : 'Depósito'}
            </Text>
          </View>
        </View>

        {/* Total */}
        <View style={[styles.section, { alignItems: 'center', marginTop: 20 }]}>
          <View style={{ backgroundColor: '#059669', padding: 10, borderRadius: 5 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
              TOTAL PAGADO: S/ {payment.amount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Firmas */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 }}>
          {/* Firma del Cobrador */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ borderTopWidth: 1, borderTopColor: '#000', width: 150, paddingTop: 5 }}>
              <Text style={{ textAlign: 'center', fontSize: 12, fontStyle: 'italic' }}>
                {collector?.alias || collector?.fullName || 'Cobrador'}
              </Text>
            </View>
            <Text style={{ fontSize: 10, marginTop: 5, fontWeight: 'bold' }}>Firma del Cobrador</Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 3 }}>
              {collector?.alias} - Tel: {collector?.phone || '+51 999 999 999'}
            </Text>
          </View>

          {/* Firma del Validador (solo si el pago está validado) */}
          {validator && (
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ borderTopWidth: 1, borderTopColor: '#000', width: 150, paddingTop: 5 }}>
                <Text style={{ textAlign: 'center', fontSize: 12, fontStyle: 'italic' }}>
                  {validator.fullName || 'Administrador'}
                </Text>
              </View>
              <Text style={{ fontSize: 10, marginTop: 5, fontWeight: 'bold' }}>Firma del Validador</Text>
              <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 3 }}>
                {validator.role === 'subadmin' ? 'Administrador' : 'Súper administrador'} - {new Date(payment.validatedDate).toLocaleDateString('es-PE')}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30 }}>
          <Text style={styles.footer}>
            Gracias por su pago puntual | WhatsApp: +51 999 888 777
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Función específica para generar recibo de pago
export const generatePaymentReceipt = async (payment, client, collector, validator = null) => {
  try {
    const data = { payment, client, collector, validator };
    const pdfBlob = await generatePDF('receipt', data);
    
    // Crear URL de descarga
    const url = URL.createObjectURL(pdfBlob);
    
    // Crear enlace temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `recibo-pago-${payment.id}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generando recibo:', error);
    throw error;
  }
};

// Función específica para generar nota de pago
export const generatePaymentNote = async (payment, client, collector, validator = null) => {
  try {
    const data = { payment, client, collector, validator };
    const pdfBlob = await generatePDF('payment-note', data);
    
    // Crear URL de descarga
    const url = URL.createObjectURL(pdfBlob);
    
    // Crear enlace temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `nota-pago-${payment.id}-${client.dni}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generando nota de pago:', error);
    throw error;
  }
};

// Componente para el reporte de caja
const CashBoxReportDocument = ({ cashBox, collector }) => {
  const formatCurrency = (amount) => `S/ ${(amount || 0).toFixed(2)}`;
  const formatDate = (date) => format(new Date(date), 'dd/MM/yyyy', { locale: es });
  const formatTime = (date) => format(new Date(date), 'HH:mm', { locale: es });

  const calculateTotals = () => {
    const inicialEfectivo = cashBox.cajaInicial?.efectivo || 0;
    const inicialDigital = Object.values(cashBox.cajaInicial?.digital || {}).reduce((sum, val) => sum + (val || 0), 0);
    const totalInicial = inicialEfectivo + inicialDigital;
    
    const ingresos = cashBox.ingresos?.reduce((sum, ingreso) => sum + (ingreso.monto || 0), 0) || 0;
    const gastos = cashBox.gastos?.reduce((sum, gasto) => sum + (gasto.monto || 0), 0) || 0;
    
    const teorico = totalInicial + ingresos - gastos;
    const real = (cashBox.cierreEfectivo || 0) + (cashBox.cierreDigital || 0);
    const diferencia = real - teorico;
    
    return {
      inicialEfectivo,
      inicialDigital,
      totalInicial,
      ingresos,
      gastos,
      teorico,
      real,
      diferencia
    };
  };

  const totals = calculateTotals();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>TV CABLE ABANCAY</Text>
            <Text style={styles.companySubtitle}>Sistema de Cobranzas</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>REPORTE DE CAJA</Text>
            <Text style={styles.reportDate}>{formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Información del cobrador y fecha */}
        <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 5 }}>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', width: 100 }}>Cobrador:</Text>
            <Text style={{ fontSize: 12 }}>{collector?.fullName || 'No disponible'}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', width: 100 }}>Fecha:</Text>
            <Text style={{ fontSize: 12 }}>{formatDate(cashBox.date || new Date())}</Text>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', width: 100 }}>Hora Apertura:</Text>
            <Text style={{ fontSize: 12 }}>{formatTime(cashBox.fechaApertura)}</Text>
          </View>
          {cashBox.fechaCierre && (
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', width: 100 }}>Hora Cierre:</Text>
              <Text style={{ fontSize: 12 }}>{formatTime(cashBox.fechaCierre)}</Text>
            </View>
          )}
        </View>

        {/* Montos Iniciales */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.title}>MONTOS INICIALES</Text>
          <View style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontSize: 12 }}>Efectivo:</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{formatCurrency(totals.inicialEfectivo)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ fontSize: 12 }}>Digital (Yape/Plin/Transfer):</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{formatCurrency(totals.inicialDigital)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Total Inicial:</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3B82F6' }}>{formatCurrency(totals.totalInicial)}</Text>
            </View>
          </View>
        </View>

        {/* Ingresos del día */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.title}>INGRESOS DEL DÍA</Text>
          {cashBox.ingresos && cashBox.ingresos.length > 0 ? (
            <View>
              {cashBox.ingresos.map((ingreso, index) => (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, backgroundColor: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF' }}>
                  <Text style={{ fontSize: 11, flex: 1 }}>{ingreso.descripcion || `Ingreso ${index + 1}`}</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#059669' }}>{formatCurrency(ingreso.monto)}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#10B981', marginTop: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>Total Ingresos:</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>{formatCurrency(totals.ingresos)}</Text>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 11, color: '#6B7280', padding: 10 }}>No hay ingresos registrados</Text>
          )}
        </View>

        {/* Gastos del día */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.title}>GASTOS DEL DÍA</Text>
          {cashBox.gastos && cashBox.gastos.length > 0 ? (
            <View>
              {cashBox.gastos.map((gasto, index) => (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, backgroundColor: index % 2 === 0 ? '#F9FAFB' : '#FFFFFF' }}>
                  <Text style={{ fontSize: 11, flex: 1 }}>{gasto.descripcion || `Gasto ${index + 1}`}</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#DC2626' }}>{formatCurrency(gasto.monto)}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#EF4444', marginTop: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>Total Gastos:</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>{formatCurrency(totals.gastos)}</Text>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 11, color: '#6B7280', padding: 10 }}>No hay gastos registrados</Text>
          )}
        </View>

        {/* Resumen Final */}
        <View style={{ marginTop: 'auto', marginBottom: 20 }}>
          <Text style={styles.title}>RESUMEN FINAL</Text>
          <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12 }}>Monto Inicial:</Text>
              <Text style={{ fontSize: 12 }}>{formatCurrency(totals.totalInicial)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12 }}>+ Ingresos:</Text>
              <Text style={{ fontSize: 12, color: '#059669' }}>{formatCurrency(totals.ingresos)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12 }}>- Gastos:</Text>
              <Text style={{ fontSize: 12, color: '#DC2626' }}>{formatCurrency(totals.gastos)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Total Teórico:</Text>
              <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{formatCurrency(totals.teorico)}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#3B82F6', paddingTop: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937' }}>TOTAL FINAL:</Text>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#3B82F6' }}>{formatCurrency(totals.teorico)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30 }}>
          <Text style={styles.footer}>
            Reporte generado el {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Función para generar reporte de caja
export const generateCashBoxReport = async (cashBox, collector) => {
  try {
    const doc = <CashBoxReportDocument cashBox={cashBox} collector={collector} />;
    const pdfBlob = await pdf(doc).toBlob();
    
    // Crear URL de descarga
    const url = URL.createObjectURL(pdfBlob);
    
    // Crear enlace temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-caja-${format(new Date(cashBox.date || new Date()), 'yyyy-MM-dd')}-${collector?.fullName?.replace(/\s+/g, '-') || 'cobrador'}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpiar URL
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generando reporte de caja:', error);
    throw error;
  }
};