import React, { useEffect, useState } from 'react';
import {
  Upload,
  CreditCard,
  Smartphone,
  Building2,
  MapPin,
  Download,
  Copy,
  Check,
  AlertCircle,
  FileImage,
  X,
  ArrowLeft,
  Calendar,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { usePaymentMethodStore } from '../../stores/paymentMethodStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useClientStore } from '../../stores/clientStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UploadVoucher = () => {
  const { paymentMethods, fetchPaymentMethods, getEnabledMethods, isLoading } = usePaymentMethodStore();
  const { payments, fetchPayments, createPayment, getPaymentsByClient, getOverduePayments } = usePaymentStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { clients, fetchClients } = useClientStore();

  const [selectedMethod, setSelectedMethod] = useState('');
  const [voucherFile, setVoucherFile] = useState(null);
  const [voucherPreview, setVoucherPreview] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [includeAdvancePayments, setIncludeAdvancePayments] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: '',
    paidMonth: new Date().toISOString().slice(0, 7)
  });
  const [copiedText, setCopiedText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    fetchPaymentMethods();
    fetchPayments();
    fetchClients();
  }, [fetchPaymentMethods, fetchPayments, fetchClients]);

  // Obtener el cliente actual
  const currentClient = clients.find(c => c.id === user?.clientId || c.id === 'client-1');
  const planPrices = { basic: 80, standard: 120, premium: 160 };
  const monthlyAmount = currentClient ? planPrices[currentClient.servicePlan] : 80;

  // Calcular meses disponibles (deudas + meses adelantados)
  useEffect(() => {
    if (!user?.id || !payments) return;

    const months = [];
    const today = new Date();
    const allPayments = getPaymentsByClient(user.clientId || user.id);
    const overduePayments = getOverduePayments().filter(p => p.clientId === (user.clientId || user.id));

    // Agregar meses con deuda
    const debtMonthsSet = new Set();
    overduePayments.forEach(payment => {
      const month = payment.dueDate.slice(0, 7);
      if (!debtMonthsSet.has(month)) {
        debtMonthsSet.add(month);
        months.push({
          value: month,
          label: formatMonthLabel(month),
          amount: payment.amount,
          status: 'overdue',
          isDebt: true
        });
      }
    });

    // Si está habilitado, agregar próximos 3 meses para pagos adelantados
    if (includeAdvancePayments) {
      for (let i = 0; i < 3; i++) {
        const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthStr = futureDate.toISOString().slice(0, 7);

        // Verificar si este mes ya no está en deudas y no está pagado
        const isPaid = allPayments.some(p => p.dueDate.slice(0, 7) === monthStr && p.status === 'paid');
        const isInDebt = debtMonthsSet.has(monthStr);

        if (!isPaid && !isInDebt) {
          months.push({
            value: monthStr,
            label: formatMonthLabel(monthStr),
            amount: monthlyAmount,
            status: 'advance',
            isDebt: false
          });
        }
      }
    }

    // Ordenar por fecha
    months.sort((a, b) => new Date(a.value) - new Date(b.value));
    setAvailableMonths(months);
  }, [user, payments, includeAdvancePayments, currentClient]);

  const formatMonthLabel = (monthStr) => {
    const date = new Date(monthStr + '-01');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calcular monto total basado en meses seleccionados
  useEffect(() => {
    const total = selectedMonths.reduce((sum, monthValue) => {
      const month = availableMonths.find(m => m.value === monthValue);
      return sum + (month?.amount || 0);
    }, 0);
    setPaymentForm(prev => ({ ...prev, amount: total.toString() }));
  }, [selectedMonths, availableMonths]);

  const enabledMethods = getEnabledMethods();

  const methodLabels = {
    cash: 'Efectivo',
    bank_transfer: 'Transferencia',
    yape: 'Yape',
    plin: 'Plin'
  };

  const methodIcons = {
    cash: MapPin,
    bank_transfer: Building2,
    yape: Smartphone,
    plin: Smartphone
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        message: 'Por favor selecciona un archivo de imagen válido'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      addNotification({
        type: 'error',
        message: 'El archivo es demasiado grande. Máximo 10MB'
      });
      return;
    }

    setVoucherFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setVoucherPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(label);
      setTimeout(() => setCopiedText(''), 2000);
      addNotification({
        type: 'success',
        message: `${label} copiado al portapapeles`
      });
    });
  };

  const downloadQR = (qrUrl, methodName) => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qr-${methodName}.png`;
    link.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMethod || !voucherFile || selectedMonths.length === 0) {
      addNotification({
        type: 'error',
        message: 'Por favor completa todos los campos requeridos y selecciona al menos un mes'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear descripción con los meses seleccionados
      const monthLabels = selectedMonths.map(m => {
        const month = availableMonths.find(am => am.value === m);
        return month?.label || m;
      }).join(', ');

      const paymentData = {
        clientId: user.clientId || user.id || 'client-1',
        method: selectedMethod,
        amount: parseFloat(paymentForm.amount),
        description: paymentForm.description || `Pago de: ${monthLabels}`,
        paidMonths: selectedMonths, // Array de meses pagados
        paidMonth: selectedMonths[0], // Mantener compatibilidad
        status: 'pending',
        voucher: {
          name: voucherFile.name,
          type: voucherFile.type,
          size: voucherFile.size,
          data: voucherFile,
          uploadedAt: new Date().toISOString()
        }
      };

      await createPayment(paymentData);

      addNotification({
        type: 'success',
        message: 'Voucher enviado exitosamente. Tu pago está siendo procesado.'
      });

      // Reset form
      setSelectedMethod('');
      setVoucherFile(null);
      setVoucherPreview(null);
      setSelectedMonths([]);
      setPaymentForm({
        amount: '',
        description: '',
        paidMonth: new Date().toISOString().slice(0, 7)
      });

    } catch (error) {
      console.error('Error al enviar voucher:', error);
      addNotification({
        type: 'error',
        message: 'Error al enviar el voucher. Intente nuevamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMethodInfo = () => {
    if (!selectedMethod || !enabledMethods[selectedMethod]) return null;

    const method = enabledMethods[selectedMethod];

    switch (selectedMethod) {
      case 'yape':
      case 'plin':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-blue-900">
              Información para pago con {methodLabels[selectedMethod]}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-blue-700">Número de teléfono:</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-lg font-mono bg-white px-3 py-2 rounded border">
                      {method.phoneNumber}
                    </span>
                    <button
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
                    alt={`QR ${methodLabels[selectedMethod]}`}
                    className="w-32 h-32 object-contain border rounded"
                  />
                  <button
                    onClick={() => downloadQR(method.qrCode, selectedMethod)}
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-green-900">Información para Transferencia Bancaria</h3>

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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-yellow-900">Puntos de Pago en Efectivo</h3>

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

  if (isLoading()) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="large" text="Cargando métodos de pago..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Upload className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subir Voucher de Pago</h1>
          <p className="text-gray-600">Selecciona el método de pago y sube tu comprobante</p>
        </div>
      </div>

      {Object.keys(enabledMethods).length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-700">No hay métodos de pago configurados. Contacte al administrador.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Method Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">1. Selecciona el método de pago</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(enabledMethods).map(([key, method]) => {
              const Icon = methodIcons[key];
              return (
                <label
                  key={key}
                  className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === key
                      ? 'border-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={key}
                    checked={selectedMethod === key}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="sr-only"
                  />
                  <Icon className={`h-8 w-8 mb-2 ${selectedMethod === key ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${selectedMethod === key ? 'text-primary' : 'text-gray-600'}`}>
                    {methodLabels[key]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Payment Information */}
        {selectedMethod && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">2. Información del pago</h3>
            {renderMethodInfo()}
          </div>
        )}

        {/* Month Selection - Simplified View */}
        {selectedMethod && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">3. Selecciona los meses a pagar</h3>

            {/* Checkbox para pagos adelantados */}
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAdvancePayments}
                  onChange={(e) => setIncludeAdvancePayments(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Incluir pagos adelantados (próximos 3 meses)</span>
              </label>
            </div>

            {/* Lista de meses disponibles */}
            <div className="space-y-2 mb-6">
              {availableMonths.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay meses disponibles para pago</p>
                  {!includeAdvancePayments && (
                    <p className="text-sm mt-2">Activa los pagos adelantados para ver más opciones</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableMonths.map(month => (
                    <label
                      key={month.value}
                      className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedMonths.includes(month.value)
                          ? 'border-primary bg-blue-50'
                          : month.isDebt
                          ? 'border-red-200 bg-red-50 hover:border-red-300'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          value={month.value}
                          checked={selectedMonths.includes(month.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMonths([...selectedMonths, month.value]);
                            } else {
                              setSelectedMonths(selectedMonths.filter(m => m !== month.value));
                            }
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{month.label}</span>
                          {month.isDebt && (
                            <span className="ml-2 text-xs text-red-600 font-semibold">DEUDA</span>
                          )}
                          {month.status === 'advance' && (
                            <span className="ml-2 text-xs text-green-600 font-semibold">ADELANTADO</span>
                          )}
                        </div>
                      </div>
                      <span className="font-medium text-gray-700">S/ {month.amount.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen de pago */}
            {selectedMonths.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      {selectedMonths.length} {selectedMonths.length === 1 ? 'mes' : 'meses'} seleccionado{selectedMonths.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total a pagar:</p>
                    <p className="text-2xl font-bold text-primary">S/ {paymentForm.amount || '0.00'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción opcional */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                value={paymentForm.description}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                rows="2"
                placeholder="Descripción adicional del pago..."
              />
            </div>
          </div>
        )}

        {/* Voucher Upload */}
        {selectedMethod && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">4. Subir voucher/comprobante</h3>

            <div className="space-y-4">
              {!voucherFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <label className="cursor-pointer">
                      <span className="text-primary hover:text-blue-600 font-medium">
                        Seleccionar archivo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500">
                      O arrastra y suelta una imagen aquí (máximo 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileImage className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{voucherFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(voucherFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVoucherFile(null);
                        setVoucherPreview(null);
                      }}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {voucherPreview && (
                    <div className="text-center">
                      <img
                        src={voucherPreview}
                        alt="Vista previa del voucher"
                        className="mx-auto max-h-64 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {selectedMethod && voucherFile && selectedMonths.length > 0 && (
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setSelectedMethod('');
                setVoucherFile(null);
                setVoucherPreview(null);
                setSelectedMonths([]);
                setPaymentForm({
                  amount: '',
                  description: '',
                  paidMonth: new Date().toISOString().slice(0, 7)
                });
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting || selectedMonths.length === 0}
            >
              {isSubmitting ? 'Enviando...' : `Enviar Voucher (${selectedMonths.length} ${selectedMonths.length === 1 ? 'mes' : 'meses'})`}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default UploadVoucher;