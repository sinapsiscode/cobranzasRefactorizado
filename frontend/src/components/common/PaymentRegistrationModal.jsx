import React, { useState, useEffect } from 'react';
import { X, Search, User, DollarSign, Calendar, CreditCard, AlertCircle, Check, Info } from 'lucide-react';
import { useClientStore } from '../../stores/clientStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import {
  getOverdueMonths,
  generateAdvanceMonths,
  calculateTotalAmount,
  formatDate,
  formatDateShort
} from '../../utils/paymentDateCalculator';
import LoadingSpinner from './LoadingSpinner';

const PaymentRegistrationModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { clients, fetchClients, searchClients, loading: clientsLoading } = useClientStore();
  const { createPayment, payments, isLoading: paymentsLoading } = usePaymentStore();
  const { success, error: showError } = useNotificationStore();

  // Estados del modal
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientResults, setShowClientResults] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);

  // Estados calculados automáticamente
  const [overdueMonths, setOverdueMonths] = useState([]);
  const [monthsToPay, setMonthsToPay] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // Estados del formulario de pago
  const [monthsCount, setMonthsCount] = useState(1); // Cuántos meses quiere pagar
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'efectivo',
    paidAmount: '', // Monto abonado por el cliente
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Precios de planes
  const PLAN_PRICES = {
    basic: 80,
    standard: 120,
    premium: 160
  };

  // Cargar TODOS los clientes cuando el modal se abre (SIEMPRE)
  useEffect(() => {
    if (isOpen) {
      fetchClients({ limit: 999999 });
    }
  }, [isOpen, fetchClients]);

  // Resetear modal al cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedClient(null);
      setShowClientResults(false);
      setFilteredClients([]);
      setOverdueMonths([]);
      setMonthsToPay([]);
      setTotalAmount(0);
      setMonthsCount(1);
      setPaymentData({
        paymentMethod: 'efectivo',
        paidAmount: '',
        description: ''
      });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Calcular meses adeudados y meses a pagar cuando se selecciona un cliente o cambia monthsCount
  useEffect(() => {
    if (selectedClient) {
      // Obtener pagos del cliente
      const clientPayments = payments.filter(p => p.clientId === selectedClient.id);

      // Calcular meses adeudados
      const overdue = getOverdueMonths(selectedClient, clientPayments);
      setOverdueMonths(overdue);

      // Generar meses a pagar según cantidad seleccionada
      const months = generateAdvanceMonths(selectedClient, clientPayments, monthsCount);
      setMonthsToPay(months);

      // Calcular total automáticamente
      const total = calculateTotalAmount(months);
      setTotalAmount(total);
    }
  }, [selectedClient, monthsCount, payments]);

  // Función de normalización para búsqueda flexible
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
      .trim();
  };

  // Buscar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.length >= 1) {
      const normalizedSearch = normalizeText(searchTerm);

      const filtered = clients.filter(client => {
        const normalizedName = normalizeText(client.fullName);
        const normalizedAddress = normalizeText(client.address);
        const dni = client.dni || '';
        const phone = client.phone || '';

        return (
          dni.includes(searchTerm) ||
          phone.includes(searchTerm) ||
          normalizedName.includes(normalizedSearch) ||
          normalizedAddress.includes(normalizedSearch) ||
          normalizedSearch.split(' ').every(word =>
            normalizedName.includes(word)
          )
        );
      });

      setFilteredClients(filtered);
      setShowClientResults(true);

      if (filtered.length < 5 && searchTerm.length >= 2) {
        searchClients(searchTerm);
      }
    } else {
      setFilteredClients([]);
      setShowClientResults(false);
    }
  }, [searchTerm, clients, searchClients]);

  // Manejar búsqueda de clientes
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Seleccionar cliente
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSearchTerm(client.fullName);
    setShowClientResults(false);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!selectedClient) {
      showError('Debe seleccionar un cliente');
      return false;
    }
    if (!paymentData.paidAmount || parseFloat(paymentData.paidAmount) <= 0) {
      showError('Debe ingresar un monto abonado válido');
      return false;
    }
    if (monthsCount < 1) {
      showError('Debe seleccionar al menos 1 mes para pagar');
      return false;
    }
    return true;
  };

  // Registrar pago
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const paidAmount = parseFloat(paymentData.paidAmount);

      // Mapear método de pago
      const methodMapping = {
        'efectivo': 'cash',
        'transferencia': 'transfer',
        'deposito': 'deposit',
        'yape': 'transfer',
        'plin': 'transfer'
      };

      // Crear pagos para cada mes seleccionado
      const paymentPromises = monthsToPay.map(async (monthData) => {
        const newPayment = {
          clientId: selectedClient.id,
          serviceType: selectedClient.serviceType || 'internet',
          amount: monthData.amount,
          dueDate: monthData.dueDate.toISOString(),
          paymentDate: new Date().toISOString().split('T')[0],
          status: paidAmount >= totalAmount ? 'collected' : 'partial',
          paymentMethod: methodMapping[paymentData.paymentMethod] || 'cash',
          comments: paymentData.description || `Pago registrado por ${user?.fullName || 'Administrador'}`,
          collectorId: user?.id,
          month: monthData.month,
          year: monthData.year
        };

        return createPayment(newPayment);
      });

      await Promise.all(paymentPromises);

      const monthsText = monthsCount === 1 ? '1 mes' : `${monthsCount} meses`;
      const paymentStatus = paidAmount >= totalAmount ? 'completo' : 'parcial';

      success(`Pago ${paymentStatus} de S/ ${paidAmount.toFixed(2)} registrado para ${monthsText} - ${selectedClient.fullName}`);
      onClose();
    } catch (error) {
      console.error('Error registrando pago:', error);
      showError(error.errors ? `Datos inválidos - ${JSON.stringify(error.errors)}` : 'Error al registrar el pago. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función auxiliar para obtener etiqueta de plan
  const getPlanLabel = (plan) => {
    const labels = {
      basic: 'Básico',
      standard: 'Estándar',
      premium: 'Premium'
    };
    return labels[plan] || plan;
  };

  // Función auxiliar para obtener etiqueta de servicio
  const getServiceLabel = (serviceType) => {
    const labels = {
      internet: 'Internet',
      cable: 'Cable/TV',
      duo: 'Dúo (Internet + Cable)'
    };
    return labels[serviceType] || serviceType;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl aspect-square overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-bold text-gray-900">Registrar Pago</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* Buscador de cliente */}
            {!selectedClient && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Cliente
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="DNI, nombre o teléfono..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    autoFocus
                  />
                  {clientsLoading && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <LoadingSpinner size="small" />
                    </div>
                  )}

                  {/* Resultados de búsqueda */}
                  {showClientResults && (
                    <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => handleSelectClient(client)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-start space-x-3 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{client.fullName}</p>
                              <p className="text-xs text-gray-500">
                                DNI: {client.dni} • {client.phone}
                              </p>
                              <p className="text-xs text-gray-600">
                                Plan: {getPlanLabel(client.servicePlan)} • {getServiceLabel(client.serviceType)}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-gray-500 text-center text-sm">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          No se encontraron clientes
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECCIÓN 1: Datos del cliente (SOLO LECTURA) */}
            {selectedClient && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">Datos del Cliente</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClient(null);
                        setSearchTerm('');
                      }}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg p-1.5 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Nombre Completo</p>
                      <p className="text-sm font-semibold text-blue-900">{selectedClient.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-1">DNI</p>
                      <p className="text-sm font-semibold text-blue-900">{selectedClient.dni}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Teléfono</p>
                      <p className="text-sm font-semibold text-blue-900">{selectedClient.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 mb-1">Dirección</p>
                      <p className="text-sm font-semibold text-blue-900 truncate">{selectedClient.address}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-blue-600 mb-2">Plan de Servicio (NO EDITABLE)</p>
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-500 text-white px-4 py-2 rounded-lg">
                        <p className="text-xs">Plan</p>
                        <p className="text-lg font-bold">{getPlanLabel(selectedClient.servicePlan)}</p>
                      </div>
                      <div className="bg-indigo-500 text-white px-4 py-2 rounded-lg">
                        <p className="text-xs">Servicio</p>
                        <p className="text-lg font-bold">{getServiceLabel(selectedClient.serviceType)}</p>
                      </div>
                      <div className="bg-green-500 text-white px-4 py-2 rounded-lg">
                        <p className="text-xs">Precio Mensual</p>
                        <p className="text-lg font-bold">S/ {PLAN_PRICES[selectedClient.servicePlan]}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-blue-600 mb-2">Configuración de Pagos</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Día de Pago</p>
                        <p className="text-sm font-bold text-gray-900">Día {selectedClient.preferredPaymentDay} de cada mes</p>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <p className="text-xs text-gray-600">Días de Gracia</p>
                        <p className="text-sm font-bold text-gray-900">{selectedClient.paymentDueDays || 5} días</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: Deuda Actual (SOLO LECTURA - Fechas Automáticas) */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">Deuda Actual</h3>
                  </div>

                  {overdueMonths.length > 0 ? (
                    <div className="space-y-2">
                      {overdueMonths.map((month, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-900 capitalize">{month.monthLabel}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                Fecha de pago: <span className="font-medium">{formatDateShort(month.paymentDate)}</span>
                              </p>
                              <p className="text-xs text-gray-600">
                                Vencimiento: <span className="font-medium">{formatDateShort(month.dueDate)}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              {month.isPastDue ? (
                                <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                                  VENCIDO
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">
                                  PENDIENTE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-green-900">¡No hay deudas!</p>
                      <p className="text-xs text-green-700">El cliente está al día con sus pagos</p>
                    </div>
                  )}
                </div>

                {/* SECCIÓN 3: Registro del Pago */}
                <div className="bg-white border border-gray-300 rounded-lg p-5">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Registro de Pago</h3>

                  {/* Selector de cuántos meses pagar */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cuántos meses desea pagar?
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setMonthsCount(Math.max(1, monthsCount - 1))}
                        className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={monthsCount}
                        onChange={(e) => setMonthsCount(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max="12"
                        className="w-20 text-center py-2 border border-gray-300 rounded-lg font-bold text-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setMonthsCount(Math.min(12, monthsCount + 1))}
                        className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 transition-colors"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-600">
                        {monthsCount === 1 ? '1 mes' : `${monthsCount} meses`}
                      </span>
                    </div>
                  </div>

                  {/* Lista de meses que se pagarán */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meses que se pagarán
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                      {monthsToPay.map((month, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <span className="text-sm font-medium text-gray-900 capitalize">{month.monthLabel}</span>
                          <span className="text-sm font-bold text-blue-600">S/ {month.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monto Total (CALCULADO AUTOMÁTICAMENTE) */}
                  <div className="mb-5 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Monto Total a Pagar</p>
                        <p className="text-xs text-blue-600">Calculado automáticamente</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">S/ {totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Monto Abonado (EDITABLE) */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Abonado por el Cliente *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        name="paidAmount"
                        value={paymentData.paidAmount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Indicador de pago parcial/completo */}
                    {paymentData.paidAmount && (
                      <div className={`mt-2 p-3 rounded-lg flex items-center space-x-2 ${
                        parseFloat(paymentData.paidAmount) >= totalAmount
                          ? 'bg-green-100 border border-green-300'
                          : 'bg-yellow-100 border border-yellow-300'
                      }`}>
                        <span className="text-lg">
                          {parseFloat(paymentData.paidAmount) >= totalAmount ? '✅' : '⚠️'}
                        </span>
                        <div className="flex-1">
                          <span className={`text-sm font-semibold ${
                            parseFloat(paymentData.paidAmount) >= totalAmount
                              ? 'text-green-900'
                              : 'text-yellow-900'
                          }`}>
                            {parseFloat(paymentData.paidAmount) >= totalAmount ? 'Pago Completo' : 'Pago Parcial'}
                          </span>
                          <span className={`text-xs ml-2 ${
                            parseFloat(paymentData.paidAmount) >= totalAmount
                              ? 'text-green-700'
                              : 'text-yellow-700'
                          }`}>
                            {((parseFloat(paymentData.paidAmount) / totalAmount) * 100).toFixed(0)}% del total
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Método de pago */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pago *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          name="paymentMethod"
                          value={paymentData.paymentMethod}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
                        >
                          <option value="efectivo">Efectivo</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="yape">Yape</option>
                          <option value="plin">Plin</option>
                        </select>
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones (Opcional)
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={paymentData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Observaciones adicionales..."
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedClient || isSubmitting || !paymentData.paidAmount}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                <span>Registrar Pago</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentRegistrationModal;
