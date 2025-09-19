import React, { useState, useEffect } from 'react';
import { X, Search, User, DollarSign, Calendar, CreditCard, AlertCircle, Check } from 'lucide-react';
import { useClientStore } from '../../stores/clientStore';
import { usePaymentStore } from '../../stores/paymentStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { calculateServicePrice, getPriceMatrix, getServiceInfo } from '../../services/basePricingService';
import LoadingSpinner from './LoadingSpinner';

const PaymentRegistrationModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { clients, searchClients, isLoading: clientsLoading } = useClientStore();
  const { createPayment, isLoading: paymentsLoading } = usePaymentStore();
  const { success, error: showError } = useNotificationStore();

  // Estado para forzar re-render cuando cambien los precios
  const [priceUpdateTrigger, setPriceUpdateTrigger] = useState(0);

  // Estados del modal
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientResults, setShowClientResults] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);

  // Estados del formulario de pago
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'efectivo',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    selectedServiceType: 'internet'
  });

  // Resetear modal al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedClient(null);
      setShowClientResults(false);
      setFilteredClients([]);
      setPaymentData({
        amount: '',
        paymentMethod: 'efectivo',
        description: '',
        paymentDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        selectedServiceType: 'internet'
      });
    }
  }, [isOpen]);

  // Buscar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const filtered = clients.filter(client =>
        client.dni?.includes(searchTerm) ||
        client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
      );
      setFilteredClients(filtered);
      setShowClientResults(true);

      // Si no hay resultados locales, hacer búsqueda en el servidor
      if (filtered.length === 0 && searchTerm.length >= 3) {
        searchClients(searchTerm);
      }
    } else {
      setFilteredClients([]);
      setShowClientResults(false);
    }
  }, [searchTerm, clients, searchClients]);

  // Manejar búsqueda de clientes
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Seleccionar cliente
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSearchTerm(client.fullName);
    setShowClientResults(false);
    
    // Auto-completar algunos campos basado en el plan y tipo de servicio del cliente
    const plan = client.servicePlan || 'standard';
    const serviceType = client.serviceType || 'internet';
    
    // Usar servicio centralizado de precios
    const amount = calculateServicePrice(serviceType, plan);
    let description = 'Pago mensual';
    
    // Crear descripción más detallada
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const serviceLabel = getServiceLabel(serviceType);
    description = `Pago mensual - ${planLabel} (${serviceLabel})`;
    
    setPaymentData(prev => ({
      ...prev,
      amount: amount.toString(),
      description: description,
      selectedServiceType: serviceType
    }));
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

  // Función para obtener precio según tipo de servicio
  const getServicePrice = (serviceType) => {
    if (!selectedClient) return 0;
    
    const plan = selectedClient.servicePlan || 'standard';
    return calculateServicePrice(serviceType, plan);
  };

  // Manejar cambio de tipo de servicio
  const handleServiceTypeChange = (serviceType) => {
    const amount = getServicePrice(serviceType);
    const planLabel = selectedClient.servicePlan?.charAt(0).toUpperCase() + selectedClient.servicePlan?.slice(1) || 'Standard';
    const serviceLabel = getServiceLabel(serviceType);
    const description = `Pago mensual - ${planLabel} (${serviceLabel})`;
    
    setPaymentData(prev => ({
      ...prev,
      selectedServiceType: serviceType,
      amount: amount.toString(),
      description: description
    }));
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
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      showError('Debe ingresar un monto válido');
      return false;
    }
    if (!paymentData.paymentDate) {
      showError('Debe seleccionar una fecha de pago');
      return false;
    }
    return true;
  };

  // Registrar pago
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const newPayment = {
        clientId: selectedClient.id,
        amount: parseFloat(paymentData.amount),
        paymentMethod: paymentData.paymentMethod,
        description: paymentData.description || `Pago registrado por ${user?.name || 'Usuario'}`,
        paymentDate: paymentData.paymentDate,
        dueDate: paymentData.dueDate,
        status: 'collected', // Directamente como cobrado
        collectorId: user?.id,
        registeredBy: user?.id,
        registeredAt: new Date().toISOString()
      };

      await createPayment(newPayment);
      success(`Pago de S/ ${paymentData.amount} registrado exitosamente para ${selectedClient.fullName}`);
      onClose();
    } catch (error) {
      console.error('Error registrando pago:', error);
      showError('Error al registrar el pago. Intente nuevamente.');
    }
  };

  if (!isOpen) return null;

  const isLoading = clientsLoading || paymentsLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto max-h-[95vh] overflow-y-auto sm:max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">Registrar Pago</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 sm:p-6 sm:space-y-6">
          
          {/* Buscador de cliente */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Buscar Cliente por DNI, Nombre o Teléfono
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 sm:h-5 sm:w-5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Ingrese DNI, nombre o teléfono..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:pl-10 sm:py-3 sm:text-sm"
              />
              {isLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <LoadingSpinner size="small" />
                </div>
              )}
            </div>

            {/* Resultados de búsqueda */}
            {showClientResults && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto sm:max-h-60">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-start space-x-2 border-b border-gray-100 last:border-b-0 sm:px-4 sm:py-3 sm:space-x-3"
                    >
                      <User className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0 sm:h-5 sm:w-5 sm:mt-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate sm:text-base">{client.fullName}</p>
                        <p className="text-xs text-gray-500 sm:text-sm">
                          DNI: {client.dni} • {client.phone}
                        </p>
                        <p className="text-xs text-gray-600 sm:text-sm">
                          Plan: {client.servicePlan?.charAt(0).toUpperCase() + client.servicePlan?.slice(1)}
                          {client.serviceType && ` • ${getServiceLabel(client.serviceType)}`}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-center text-sm sm:px-4 sm:py-3">
                    No se encontraron clientes
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cliente seleccionado */}
          {selectedClient && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 sm:w-10 sm:h-10">
                  <User className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-900 sm:text-base">{selectedClient.fullName}</p>
                  <p className="text-xs text-blue-700 sm:text-sm">
                    DNI: {selectedClient.dni} • {selectedClient.phone}
                  </p>
                  <p className="text-xs text-blue-600 sm:text-sm">
                    Plan: {selectedClient.servicePlan?.charAt(0).toUpperCase() + selectedClient.servicePlan?.slice(1)}
                    {selectedClient.serviceType && ` • ${getServiceLabel(selectedClient.serviceType)}`}
                  </p>
                  <p className="text-xs text-blue-500 truncate sm:text-sm">{selectedClient.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClient(null);
                    setSearchTerm('');
                  }}
                  className="text-blue-600 hover:text-blue-800 p-1 flex-shrink-0"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Formulario de pago */}
          {selectedClient && (
            <div className="space-y-4 sm:space-y-6">
              {/* Selector de tipo de servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Servicio
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => handleServiceTypeChange('internet')}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      paymentData.selectedServiceType === 'internet'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📡</div>
                      <div>Internet</div>
                      <div className="text-xs text-gray-500">S/ {getServicePrice('internet')}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleServiceTypeChange('cable')}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      paymentData.selectedServiceType === 'cable'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📺</div>
                      <div>Cable/TV</div>
                      <div className="text-xs text-gray-500">S/ {getServicePrice('cable')}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleServiceTypeChange('duo')}
                    className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                      paymentData.selectedServiceType === 'duo'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📡📺</div>
                      <div>Dúo</div>
                      <div className="text-xs text-gray-500">S/ {getServicePrice('duo')}</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Monto */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto (S/)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="amount"
                    value={paymentData.amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="paymentMethod"
                    value={paymentData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="yape">Yape</option>
                    <option value="plin">Plin</option>
                  </select>
                </div>
              </div>

              {/* Fecha de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Pago
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="paymentDate"
                    value={paymentData.paymentDate}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Fecha de vencimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="dueDate"
                    value={paymentData.dueDate}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  name="description"
                  value={paymentData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción adicional del pago..."
                />
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!selectedClient || isLoading || !paymentData.amount}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
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