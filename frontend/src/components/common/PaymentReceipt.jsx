import React, { forwardRef, useEffect, useState } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Wifi,
  Tv,
  CheckCircle,
  Printer,
  MessageCircle
} from 'lucide-react';
import { usePaymentReceiptStore } from '../../stores/paymentReceiptStore';

const PaymentReceipt = forwardRef(({ receipt, showActions = true }, ref) => {
  const { markAsPrinted, formatReceiptNumber } = usePaymentReceiptStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Función helper para abrir WhatsApp
  const openWhatsApp = (phone) => {
    if (!phone) return;
    
    // Limpiar el número: quitar espacios, guiones y caracteres especiales
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    
    // Si no empieza con código de país, agregar 51 (Perú)
    const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    
    // Abrir en nueva ventana
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
    markAsPrinted(receipt.id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const getServiceIcon = () => {
    return receipt.service.type === 'internet' ? (
      <Wifi className="h-5 w-5 text-blue-600" />
    ) : (
      <Tv className="h-5 w-5 text-purple-600" />
    );
  };

  if (!receipt) {
    return (
      <div className="p-8 text-center text-gray-500">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>No se ha seleccionado ningún recibo</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="max-w-2xl mx-auto bg-white">
      {/* Actions - No se imprimen */}
      {showActions && (
        <div className="mb-4 flex justify-end print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
        </div>
      )}

      {/* Receipt Content */}
      <div className="border border-gray-300 print:border-none print:shadow-none">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{receipt.company.name}</h1>
              <p className="text-blue-100 text-sm">{receipt.company.address}</p>
              <p className="text-blue-100 text-sm">
                Tel: {receipt.company.phone} | Email: {receipt.company.email}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white text-blue-800 px-4 py-2 rounded-lg">
                <p className="text-xs font-medium">NOTA DE PAGO</p>
                <p className="text-lg font-bold">{formatReceiptNumber(receipt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">INFORMACIÓN DEL RECIBO</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span>Fecha de emisión: {formatDate(receipt.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Estado: {receipt.valid ? 'Válido' : 'Anulado'}</span>
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                  <span>Método de pago: {receipt.payment.paymentMethod === 'efectivo' ? 'Efectivo' : receipt.payment.paymentMethod}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">PERIODO DE PAGO</h3>
              <div className="space-y-1 text-sm">
                <p>Período: <strong>{receipt.payment.period}</strong></p>
                <p>Fecha de pago: <strong>{formatDate(receipt.payment.paymentDate)}</strong></p>
                <p>Concepto: <strong>{receipt.payment.concept}</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="p-6 border-b">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">DATOS DEL CLIENTE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="font-medium">{receipt.client.fullName}</span>
              </div>
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                <span>DNI: {receipt.client.dni}</span>
              </div>
              <div className="flex items-center">
                {receipt.client.phone ? (
                  <button
                    onClick={() => openWhatsApp(receipt.client.phone)}
                    className="flex items-center text-green-600 hover:text-green-800 transition-colors"
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span>{receipt.client.phone}</span>
                  </button>
                ) : (
                  <>
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-400">Sin teléfono</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{receipt.client.address}</p>
                  <p className="text-sm text-gray-600">{receipt.client.neighborhood}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="p-6 border-b">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">DETALLE DEL SERVICIO</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {getServiceIcon()}
                <span className="font-bold text-gray-900 ml-2">{receipt.service.planName}</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(receipt.service.price)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Plan contratado:</p>
                <p className="font-medium">{receipt.service.planName}</p>
                {receipt.service.speed && (
                  <>
                    <p className="text-gray-600 mt-2">Velocidad:</p>
                    <p className="font-medium">{receipt.service.speed}</p>
                  </>
                )}
              </div>
              
              <div>
                <p className="text-gray-600">Tipo de servicio:</p>
                <p className="font-medium capitalize">
                  {receipt.service.type === 'internet' ? 'Internet' : 'Cable/TV'}
                </p>
                <p className="text-gray-600 mt-2">Fecha de instalación:</p>
                <p className="font-medium">{formatDate(receipt.client.installationDate)}</p>
              </div>
            </div>

            {receipt.service.features && receipt.service.features.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-gray-600 text-sm mb-2">Servicios adicionales incluidos:</p>
                <div className="flex flex-wrap gap-1">
                  {receipt.service.features.map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">RESUMEN DE PAGO</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Servicio mensual:</span>
              <span>{formatCurrency(receipt.payment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Descuentos:</span>
              <span>S/ 0.00</span>
            </div>
            <div className="flex justify-between">
              <span>Recargos:</span>
              <span>S/ 0.00</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL PAGADO:</span>
                <span className="text-green-600">{formatCurrency(receipt.payment.amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collector Info */}
        <div className="p-6 border-b">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">DATOS DEL COBRADOR</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{receipt.collector.fullName}</p>
              <p className="text-sm text-gray-600">DNI: {receipt.collector.dni}</p>
              <p className="text-sm text-gray-600">
                Fecha de cobranza: {formatDate(receipt.collector.collectionDate)}
              </p>
            </div>
            
            {/* Firma del cobrador */}
            <div className="text-center">
              <div className="border-b-2 border-gray-300 w-48 h-16 mb-2 flex items-end justify-center">
                {receipt.collector.signature ? (
                  <img 
                    src={receipt.collector.signature} 
                    alt="Firma del cobrador" 
                    className="max-h-12 max-w-44"
                  />
                ) : (
                  <div className="text-xs text-gray-400 mb-2">
                    {receipt.collector.fullName}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600">Firma del cobrador</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center bg-gray-50">
          <div className="mb-3">
            <p className="text-sm text-gray-600">
              Este recibo es válido hasta: <strong>{formatDate(receipt.validUntil)}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Para consultas o reclamos, contactar a {receipt.company.phone} o {receipt.company.email}
            </p>
          </div>
          
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500">
              Recibo generado el {formatDate(currentDate)} | ID: {receipt.id}
            </p>
            <p className="text-xs text-gray-500">
              {receipt.company.website} | Gracias por su pago puntual
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .max-w-2xl {
            max-width: none;
            margin: 0;
          }
          
          .border {
            border: 1px solid #000 !important;
          }
          
          .bg-gradient-to-r {
            background: #1e40af !important;
            color: white !important;
          }
          
          page {
            margin: 0.5cm;
          }
        }
      `}</style>
    </div>
  );
});

PaymentReceipt.displayName = 'PaymentReceipt';

export default PaymentReceipt;