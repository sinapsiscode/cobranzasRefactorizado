import React, { useState, useEffect } from 'react';
import { Upload, Download, CreditCard, FileText, MessageCircle, CheckCircle, AlertTriangle, Clock, X, ChevronLeft, ChevronRight, Eye, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useVoucherStore } from '../../stores/voucherStore';
import { usePaymentMethodStore } from '../../stores/paymentMethodStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useNotificationStore } from '../../stores/notificationStore';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ClientDashboard = () => {
  const { user } = useAuthStore();
  const {
    uploadVoucher,
    fetchClientVouchers,
    vouchers,
    loading,
    error,
    uploadProgress,
    validateOperationNumber,
    clearError,
    clearProgress
  } = useVoucherStore();
  const { paymentMethods, fetchPaymentMethods, getEnabledMethods } = usePaymentMethodStore();
  const { payments, fetchPayments, getOverduePayments, getPaymentsByClient } = usePaymentStore();
  const { success, error: showError } = useNotificationStore();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    operationNumber: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    selectedMonths: [`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`], // Array de meses seleccionados
    paymentMethod: 'cash', // Método de pago por defecto
    comments: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchClientVouchers(user.id);
      fetchPayments(); // CARGAR TODOS LOS PAGOS
    }
    fetchPaymentMethods();
  }, [user?.id, fetchClientVouchers, fetchPaymentMethods, fetchPayments]);

  useEffect(() => {
    if (error) {
      showError(error);
      clearError();
    }
  }, [error, showError, clearError]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showError('Debe seleccionar un archivo');
      return;
    }

    // Validar número de operación
    const validation = validateOperationNumber(formData.operationNumber);
    if (!validation.valid) {
      showError(validation.message);
      return;
    }

    try {
      // Crear string del periodo con los meses seleccionados
      const paymentPeriod = formData.selectedMonths.length === 1
        ? formData.selectedMonths[0]
        : `${formData.selectedMonths[0]} a ${formData.selectedMonths[formData.selectedMonths.length - 1]}`;

      // Crear descripción de los meses para mejor claridad
      const monthsCount = formData.selectedMonths.length;
      const monthsText = monthsCount === 1 ? 'mes' : 'meses';

      await uploadVoucher({
        clientId: user.id,
        operationNumber: formData.operationNumber,
        file: selectedFile,
        amount: calculateTotalAmount(),
        paymentDate: formData.paymentDate,
        paymentPeriod: paymentPeriod,
        selectedMonths: formData.selectedMonths, // Enviamos también el array completo
        paymentMethod: formData.paymentMethod,
        comments: formData.comments || `Pago de ${monthsCount} ${monthsText}`
      });

      success(`Voucher subido exitosamente para ${monthsCount} ${monthsText}. Será revisado por nuestro equipo.`);
      
      // Limpiar formulario
      setFormData({
        operationNumber: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        selectedMonths: [`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`],
        paymentMethod: 'cash',
        comments: ''
      });
      setSelectedFile(null);
      setShowUploadForm(false);
      clearProgress();
      
      // Recargar vouchers
      fetchClientVouchers(user.id);
    } catch (error) {
      // Error ya manejado por el store
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-600" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'pending':
      default:
        return 'En Revisión';
    }
  };

  const formatPaymentPeriod = (periodString) => {
    if (!periodString) return 'No especificado';
    
    try {
      // Verificar si es un array de meses (formato: "2024-01 a 2024-02")
      if (periodString.includes(' a ')) {
        const months = periodString.split(' a ');
        return months.map(month => {
          const [year, monthNum] = month.split('-');
          const date = new Date(parseInt(year), parseInt(monthNum) - 1);
          return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
        }).join(' y ');
      }
      
      // Si es un solo mes
      const [year, month] = periodString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('es-PE', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return periodString;
    }
  };

  // Función para descargar el voucher
  const handleDownloadVoucher = (voucher) => {
    try {
      // Crear un elemento <a> temporal para la descarga
      const link = document.createElement('a');
      link.href = voucher.fileData;
      link.download = voucher.fileName || `voucher-${voucher.operationNumber}.${voucher.fileType?.split('/')[1] || 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      success('Voucher descargado exitosamente');
    } catch (error) {
      showError('Error al descargar el voucher');
    }
  };

  // Función para ver el voucher en una nueva pestaña
  const handleViewVoucher = (voucher) => {
    try {
      // Abrir el voucher en una nueva pestaña
      const newWindow = window.open();
      if (voucher.fileType?.includes('pdf')) {
        // Si es PDF, mostrar en iframe
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Voucher - ${voucher.operationNumber}</title>
              <style>
                body { margin: 0; padding: 0; height: 100vh; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${voucher.fileData}"></iframe>
            </body>
          </html>
        `);
      } else {
        // Si es imagen, mostrar directamente
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Voucher - ${voucher.operationNumber}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #f3f4f6;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  border-radius: 8px;
                }
                .container {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h2 {
                  margin: 0 0 20px 0;
                  color: #1f2937;
                  font-family: system-ui, -apple-system, sans-serif;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Voucher N° ${voucher.operationNumber}</h2>
                <img src="${voucher.fileData}" alt="Voucher ${voucher.operationNumber}" />
              </div>
            </body>
          </html>
        `);
      }
      newWindow.document.close();
    } catch (error) {
      showError('Error al visualizar el voucher');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label);
      setTimeout(() => setCopiedText(''), 2000);
      success(`${label} copiado al portapapeles`);
    });
  };

  const downloadQR = (qrUrl, methodName) => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qr-${methodName}.png`;
    link.click();
  };

  const getEnabledPaymentMethods = () => {
    return getEnabledMethods();
  };

  const getClientOverdueMonths = () => {
    if (!user?.id) return [];

    // Para cliente1, siempre usar client-1 como ID
    const clientId = 'client-1'; // FORZAR SIEMPRE PARA PRUEBA

    console.log('=== VERIFICANDO DEUDAS PARA CLIENT-1 ===');
    console.log('Usuario logueado:', user);
    console.log('Buscando pagos para clientId:', clientId);
    console.log('TODOS los pagos en el store:', payments);

    const allOverduePayments = getOverduePayments();
    const clientPayments = getPaymentsByClient(clientId);

    console.log('Todos los pagos overdue:', allOverduePayments);
    console.log('Pagos del cliente:', clientPayments);

    // Obtener pagos vencidos del cliente
    const clientOverduePayments = allOverduePayments.filter(p => p.clientId === clientId);

    console.log('Pagos overdue de este cliente:', clientOverduePayments);
    console.log('=== FIN DEBUG ===');

    // Obtener también pagos pendientes que aún no han vencido
    const clientPendingPayments = clientPayments.filter(p =>
      p.status === 'pending' && !clientOverduePayments.find(op => op.id === p.id)
    );

    // Combinar ambos tipos de pagos
    const allUnpaidPayments = [...clientOverduePayments, ...clientPendingPayments];

    // Convertir a formato de meses únicos
    const monthsMap = new Map();

    allUnpaidPayments.forEach(payment => {
      const date = new Date(payment.dueDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthsMap.has(monthYear)) {
        monthsMap.set(monthYear, {
          monthYear,
          displayText: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          amount: payment.amount,
          dueDate: payment.dueDate,
          status: payment.status
        });
      }
    });

    // Convertir a array y ordenar por fecha
    return Array.from(monthsMap.values()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  };

  const calculateTotalAmount = () => {
    const overdueMonths = getClientOverdueMonths();
    const selectedMonthsData = overdueMonths.filter(month =>
      formData.selectedMonths.includes(month.monthYear)
    );
    return selectedMonthsData.reduce((total, month) => total + month.amount, 0);
  };

  const renderPaymentMethodInfo = () => {
    if (!formData.paymentMethod) return null;

    const enabledMethods = getEnabledPaymentMethods();
    const method = enabledMethods[formData.paymentMethod];

    if (!method) return null;

    switch (formData.paymentMethod) {
      case 'yape':
      case 'plin':
        return (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-blue-900">
              Información para pago con {formData.paymentMethod === 'yape' ? 'Yape' : 'Plin'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-blue-700">Número de teléfono:</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg font-mono bg-white px-3 py-2 rounded border">
                      {method.phoneNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(method.phoneNumber, 'Número')}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                    >
                      {copiedText === 'Número' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-blue-700">Titular:</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg bg-white px-3 py-2 rounded border">
                      {method.holderName}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(method.holderName, 'Titular')}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                    >
                      {copiedText === 'Titular' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {method.qrCode && (
                <div className="flex flex-col items-center space-y-3">
                  <img
                    src={method.qrCode}
                    alt={`QR ${formData.paymentMethod === 'yape' ? 'Yape' : 'Plin'}`}
                    className="w-32 h-32 object-contain border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => downloadQR(method.qrCode, formData.paymentMethod)}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Descargar QR</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-blue-100 rounded p-3">
              <p className="text-sm text-blue-800">{method.instructions}</p>
            </div>
          </div>
        );

      case 'bank_transfer':
        return (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-green-900">Información para Transferencia Bancaria</h4>

            <div className="space-y-4">
              {method.accounts?.map((account, index) => (
                <div key={account.id} className="bg-white rounded-lg border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-green-700">Banco:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg font-medium">{account.bankName}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-green-700">Titular:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg">{account.holderName}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(account.holderName, `Titular ${index + 1}`)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                        >
                          {copiedText === `Titular ${index + 1}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-green-700">Número de cuenta:</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-lg font-mono bg-gray-50 px-2 py-1 rounded">
                          {account.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(account.accountNumber, `Cuenta ${index + 1}`)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                        >
                          {copiedText === `Cuenta ${index + 1}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {account.cci && (
                      <div>
                        <label className="text-sm font-medium text-green-700">CCI:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-lg font-mono bg-gray-50 px-2 py-1 rounded">
                            {account.cci}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(account.cci, `CCI ${index + 1}`)}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                          >
                            {copiedText === `CCI ${index + 1}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-100 rounded p-3">
              <p className="text-sm text-green-800">{method.instructions}</p>
            </div>
          </div>
        );

      case 'cash':
        return (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-yellow-900">Puntos de Pago en Efectivo</h4>

            <div className="space-y-3">
              {method.paymentPoints?.map((point) => (
                <div key={point.id} className="bg-white rounded-lg border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-yellow-700">Nombre:</label>
                      <p className="text-lg font-medium">{point.name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-yellow-700">Dirección:</label>
                      <div className="flex items-center space-x-2">
                        <p className="text-lg">{point.address}</p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(point.address, 'Dirección')}
                          className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 rounded transition-colors"
                        >
                          {copiedText === 'Dirección' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {point.hours && (
                      <div>
                        <label className="text-sm font-medium text-yellow-700">Horarios:</label>
                        <p className="text-lg">{point.hours}</p>
                      </div>
                    )}

                    {point.phone && (
                      <div>
                        <label className="text-sm font-medium text-yellow-700">Teléfono:</label>
                        <div className="flex items-center space-x-2">
                          <p className="text-lg">{point.phone}</p>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(point.phone, 'Teléfono')}
                            className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 rounded transition-colors"
                          >
                            {copiedText === 'Teléfono' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-100 rounded p-3">
              <p className="text-sm text-yellow-800">{method.instructions}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mi Cuenta</h1>
        <p className="text-gray-600">Portal del cliente - TV Cable</p>
      </div>

      {/* Estado de cuenta */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Estado de Cuenta</h2>
            <p className="text-sm text-gray-600">Último pago: 15 de Julio, 2024</p>
          </div>
          <div className="text-right">
            {(() => {
              const overdueMonths = getClientOverdueMonths();
              const hasOverdue = overdueMonths.length > 0;
              const totalDebt = overdueMonths.reduce((sum, month) => sum + month.amount, 0);

              if (hasOverdue) {
                return (
                  <>
                    <p className="text-2xl font-bold text-red-600">Con deuda</p>
                    <p className="text-sm text-red-600">{overdueMonths.length} {overdueMonths.length === 1 ? 'mes' : 'meses'} pendiente{overdueMonths.length === 1 ? '' : 's'}</p>
                    <p className="text-sm text-gray-600">Total: S/ {totalDebt.toFixed(2)}</p>
                  </>
                );
              } else {
                return (
                  <>
                    <p className="text-2xl font-bold text-green-600">Al día</p>
                    <p className="text-sm text-gray-600">Plan Premium - S/ 120.00</p>
                  </>
                );
              }
            })()}
          </div>
        </div>
      </div>

      {/* Subir voucher */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {!showUploadForm ? (
          <div className="text-center">
            <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Subir Comprobante de Pago
            </h3>
            <p className="text-gray-600 mb-6">
              Envía tu voucher de pago para que sea procesado
            </p>
            
            <button 
              onClick={() => setShowUploadForm(true)}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2 inline" />
              Subir Comprobante
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Subir Comprobante</h3>
              <button 
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                  setFormData({
                    operationNumber: '',
                    amount: '',
                    paymentDate: new Date().toISOString().split('T')[0],
                    selectedMonths: [`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`],
                    paymentMethod: 'cash',
                    comments: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Número de Operación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Operación *
              </label>
              <input
                type="text"
                value={formData.operationNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, operationNumber: e.target.value }))}
                placeholder="Ej: 789456123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Número único de la transacción (6-20 dígitos)
              </p>
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'cash', label: 'Efectivo', icon: '💵', color: 'green' },
                  { value: 'bank_transfer', label: 'Transferencia', icon: '🏦', color: 'blue' },
                  { value: 'yape', label: 'Yape', icon: '📱', color: 'purple' },
                  { value: 'plin', label: 'Plin', icon: '💚', color: 'green' }
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                    className={`
                      flex items-center justify-center px-3 py-2 rounded-lg border-2 transition-all
                      ${formData.paymentMethod === method.value 
                        ? method.color === 'purple' 
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : method.color === 'green'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : method.color === 'blue'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : method.color === 'red'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-500 bg-gray-50 text-gray-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }
                    `}
                  >
                    <span className="mr-1">{method.icon}</span>
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Seleccione el método utilizado para realizar el pago
              </p>
            </div>

            {/* Información del método de pago seleccionado */}
            {renderPaymentMethodInfo()}

            {/* Período de Pago - Vista Simplificada de Meses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona los meses a pagar *
              </label>

              {/* Checkbox para incluir pagos adelantados */}
              <div className="mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.includeAdvancePayments || false}
                    onChange={(e) => setFormData({...formData, includeAdvancePayments: e.target.checked})}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Incluir pagos adelantados (próximos 3 meses)</span>
                </label>
              </div>

              {/* Lista simplificada de meses disponibles */}
              <div className="space-y-2">
                {(() => {
                  const overdueMonths = getClientOverdueMonths();
                  const currentDate = new Date();
                  const allMonths = [...overdueMonths];

                  // Agregar meses adelantados si está habilitado
                  if (formData.includeAdvancePayments) {
                    for (let i = 1; i <= 3; i++) {
                      const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
                      const monthYear = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

                      // Solo agregar si no está en deudas
                      if (!overdueMonths.find(om => om.monthYear === monthYear)) {
                        allMonths.push({
                          monthYear,
                          displayText: futureDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
                          amount: 120, // Usar el monto del plan del cliente
                          status: 'advance',
                          dueDate: futureDate.toISOString()
                        });
                      }
                    }
                  }

                  // Ordenar por fecha
                  allMonths.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                  if (allMonths.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-2">No hay meses disponibles para pago</p>
                        {!formData.includeAdvancePayments && (
                          <p className="text-sm">Activa los pagos adelantados para ver más opciones</p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {allMonths.map(month => {
                        const isSelected = formData.selectedMonths.includes(month.monthYear);
                        const isOverdue = month.status !== 'advance';

                        return (
                          <label
                            key={month.monthYear}
                            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-blue-50'
                                : isOverdue
                                ? 'border-red-200 bg-red-50 hover:border-red-300'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedMonths: [...prev.selectedMonths, month.monthYear].sort()
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      selectedMonths: prev.selectedMonths.filter(m => m !== month.monthYear)
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <div>
                                <span className="font-medium capitalize">{month.displayText}</span>
                                {isOverdue && (
                                  <span className="ml-2 text-xs text-red-600 font-semibold">DEUDA</span>
                                )}
                                {month.status === 'advance' && (
                                  <span className="ml-2 text-xs text-green-600 font-semibold">ADELANTADO</span>
                                )}
                              </div>
                            </div>
                            <span className="font-medium text-gray-700">S/ {month.amount.toFixed(2)}</span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Mostrar meses seleccionados con opción de eliminar */}
              {formData.selectedMonths.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-700 mb-2">
                    Meses seleccionados ({formData.selectedMonths.length}):
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.selectedMonths.map(month => {
                      const overdueMonths = getClientOverdueMonths();
                      const monthData = overdueMonths.find(om => om.monthYear === month);
                      return (
                        <span key={month} className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                          {formatPaymentPeriod(month)} - S/ {monthData?.amount.toFixed(2) || '0.00'}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                selectedMonths: prev.selectedMonths.filter(m => m !== month)
                              }));
                            }}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <div className="bg-red-100 rounded p-2">
                    <p className="text-sm font-semibold text-red-800">
                      Total a pagar: S/ {calculateTotalAmount().toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Selector rápido de meses frecuentes */}
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">Selección rápida:</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const overdueMonths = getClientOverdueMonths();
                      const allOverdueMonthsValues = overdueMonths.map(om => om.monthYear);
                      setFormData({ ...formData, selectedMonths: allOverdueMonthsValues });
                    }}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Todos los meses de deuda
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const overdueMonths = getClientOverdueMonths();
                      const firstThreeMonths = overdueMonths.slice(0, 3).map(om => om.monthYear);
                      setFormData({ ...formData, selectedMonths: firstThreeMonths });
                    }}
                    className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                  >
                    Primeros 3 meses
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const overdueMonths = getClientOverdueMonths();
                      const oldestMonth = overdueMonths.slice(0, 1).map(om => om.monthYear);
                      setFormData({ ...formData, selectedMonths: oldestMonth });
                    }}
                    className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                  >
                    Mes más antiguo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, selectedMonths: [] });
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {/* Monto y Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calculateTotalAmount().toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Monto calculado automáticamente según meses seleccionados
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  La fecha se establece automáticamente al momento actual
                </p>
              </div>
            </div>

            {/* Archivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante *
              </label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : selectedFile 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-blue-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Arrastra tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, PDF (máx. 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Comentarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios (opcional)
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={3}
                placeholder="Información adicional..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Progreso de subida */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !selectedFile || !formData.operationNumber || formData.selectedMonths.length === 0 || calculateTotalAmount() <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <LoadingSpinner size="small" text="Subiendo..." />
                ) : (
                  'Subir Voucher'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Historial de Vouchers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Mis Comprobantes
        </h3>
        
        {loading && vouchers.length === 0 ? (
          <div className="text-center py-8">
            <LoadingSpinner size="large" text="Cargando vouchers..." />
          </div>
        ) : vouchers.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No hay comprobantes"
            description="Aún no has subido ningún comprobante de pago"
          />
        ) : (
          <div className="space-y-4">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                  <div className="mb-2 sm:mb-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 break-all">
                        Operación: {voucher.operationNumber}
                      </p>
                      {/* Botón de descarga rápida */}
                      <button
                        onClick={() => handleDownloadVoucher(voucher)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                        title="Descargar rápido"
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(voucher.uploadDate).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    {getStatusIcon(voucher.status)}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(voucher.status)}`}>
                      {getStatusText(voucher.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Mes pagado:</p>
                    <p className="font-medium text-blue-600">
                      {formatPaymentPeriod(voucher.paymentPeriod)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Archivo:</p>
                    <p className="font-medium break-all text-xs sm:text-sm">{voucher.fileName}</p>
                  </div>
                  {voucher.amount > 0 && (
                    <div>
                      <p className="text-gray-600 mb-1">Monto:</p>
                      <p className="font-medium text-lg text-green-600">S/ {voucher.amount.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600 mb-1">Fecha de Pago:</p>
                    <p className="font-medium">
                      {new Date(voucher.paymentDate).toLocaleDateString('es-PE')}
                    </p>
                  </div>
                </div>
                
                {/* Método de pago */}
                {voucher.paymentMethod && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-600 mr-2">Método de pago:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      voucher.paymentMethod === 'yape' ? 'bg-purple-100 text-purple-800' :
                      voucher.paymentMethod === 'plin' ? 'bg-green-100 text-green-800' :
                      voucher.paymentMethod === 'cash' ? 'bg-yellow-100 text-yellow-800' :
                      voucher.paymentMethod === 'bank_transfer' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {voucher.paymentMethod === 'yape' ? '📱 Yape' :
                       voucher.paymentMethod === 'plin' ? '💚 Plin' :
                       voucher.paymentMethod === 'cash' ? '💵 Efectivo' :
                       voucher.paymentMethod === 'bank_transfer' ? '🏦 Transferencia' :
                       voucher.paymentMethod.charAt(0).toUpperCase() + voucher.paymentMethod.slice(1)}
                    </span>
                  </div>
                )}

                {voucher.comments && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium mb-1">Comentarios:</p>
                    <p className="text-sm text-gray-600 break-words whitespace-pre-wrap leading-relaxed">
                      {voucher.comments}
                    </p>
                  </div>
                )}

                {voucher.status === 'rejected' && voucher.reviewComments && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium mb-1">Motivo de rechazo:</p>
                    <p className="text-sm text-red-600 break-words whitespace-pre-wrap leading-relaxed">
                      {voucher.reviewComments}
                    </p>
                  </div>
                )}

                {voucher.status === 'approved' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Pago aprobado
                      {voucher.reviewDate && (
                        <span className="font-normal"> el {new Date(voucher.reviewDate).toLocaleDateString('es-PE')}</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewVoucher(voucher)}
                      className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors group"
                      title="Ver voucher en nueva pestaña"
                    >
                      <Eye className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleDownloadVoucher(voucher)}
                      className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group"
                      title="Descargar voucher"
                    >
                      <Download className="h-4 w-4 mr-1.5 group-hover:translate-y-0.5 transition-transform" />
                      Descargar
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center">
                      {voucher.fileType?.includes('pdf') ? (
                        <>
                          <FileText className="h-4 w-4 text-red-500 mr-1" />
                          <span>PDF</span>
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 text-blue-500 mr-1" />
                          <span>{voucher.fileType?.includes('png') ? 'PNG' : 'JPG'}</span>
                        </>
                      )}
                    </div>
                    <span className="text-gray-400">•</span>
                    <span>{(voucher.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de pagos */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Historial de Pagos
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            Ver todo
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {/* Pago 1 */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Julio 2024</p>
                  <p className="text-sm text-gray-600">Pagado el 15/07/2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">S/ 120.00</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Descargar
                </button>
              </div>
            </div>
            
            {/* Pago 2 */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Junio 2024</p>
                  <p className="text-sm text-gray-600">Pagado el 12/06/2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">S/ 120.00</p>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Descargar
                </button>
              </div>
            </div>
            
            {/* Pago pendiente */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Agosto 2024</p>
                  <p className="text-sm text-gray-600">Vence el 25/08/2024</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">S/ 120.00</p>
                <span className="text-sm text-yellow-600 font-medium">Pendiente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soporte */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-gray-600 mb-4">
            Contacta con nuestro soporte por WhatsApp
          </p>
          <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
            Chatear por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;