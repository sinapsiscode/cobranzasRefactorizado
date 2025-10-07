import React, { useEffect, useState } from 'react';
import { usePaymentStore } from '../../stores/paymentStore';
import { useClientStore } from '../../stores/clientStore';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useCashBoxStore } from '../../stores/cashBoxStore';
import { usePaymentReceiptStore } from '../../stores/paymentReceiptStore';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  Calendar,
  FileText,
  Send,
  DollarSign,
  User,
  Phone,
  MapPin,
  Wifi,
  Eye,
  Upload,
  X
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentReceipt from '../../components/common/PaymentReceipt';
import { db } from '../../services/mock/db';

const CollectorPayments = () => {
  const { user } = useAuthStore();
  const { payments, fetchPayments, collectPayment, isLoading } = usePaymentStore();
  const { clients, fetchClients } = useClientStore();
  const { success, error: showError } = useNotificationStore();
  const { addPaymentIncome, hasCurrentCashBox } = useCashBoxStore();
  const { generateReceipt, getReceiptByPaymentId } = usePaymentReceiptStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending'); // pending | paid | all
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [serviceType, setServiceType] = useState('internet'); // internet | cable | duo
  const [duoSplit, setDuoSplit] = useState({ internet: 0, cable: 0 }); // Montos manuales para división DUO
  const [servicePrices, setServicePrices] = useState({ internet: 0, cable: 0, duo: 0 });
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  useEffect(() => {
    fetchPayments();
    fetchClients();
    // Cargar precios de servicios
    const prices = localStorage.getItem('tv-cable:service-prices');
    if (prices) {
      setServicePrices(JSON.parse(prices));
    }
  }, []);

  // TODOS los cobradores ven TODOS los deudores (no hay restricción por asignación)
  const getAllDebtorClients = () => {
    // Retornar todos los clientes - no filtrar por asignación
    return clients;
  };

  const allClients = getAllDebtorClients();
  const allClientIds = allClients.map(c => c.id);

  // Filtrar pagos de TODOS los clientes (solo mostrar deudores)
  const getFilteredPayments = () => {
    let filtered = payments.filter(p => allClientIds.includes(p.clientId));

    // Filtrar por estado
    if (filterStatus === 'pending') {
      filtered = filtered.filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'partial');
    } else if (filterStatus === 'paid') {
      filtered = filtered.filter(p => p.status === 'collected' || p.status === 'validated' || p.status === 'paid');
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        const client = clients.find(c => c.id === p.clientId);
        return client?.fullName.toLowerCase().includes(search) ||
               client?.dni?.includes(search) ||
               client?.phone?.includes(search);
      });
    }
    
    return filtered.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
  };

  // Agrupar pagos por cliente para mostrar botones por mes
  const getGroupedPaymentsByClient = () => {
    const filtered = getFilteredPayments();
    const grouped = {};
    
    filtered.forEach(payment => {
      if (!grouped[payment.clientId]) {
        grouped[payment.clientId] = [];
      }
      grouped[payment.clientId].push(payment);
    });
    
    // Ordenar pagos de cada cliente por fecha de vencimiento
    Object.keys(grouped).forEach(clientId => {
      grouped[clientId].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    });
    
    return grouped;
  };

  const filteredPayments = getFilteredPayments();
  const groupedPayments = getGroupedPaymentsByClient();

  // Obtener datos del cliente
  const getClient = (clientId) => {
    return clients.find(c => c.id === clientId);
  };

  // Manejar registro de pago (ahora recibe el pago específico del mes)
  const handleRegisterPayment = async (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
    // Resetear valores para nueva transacción
    setServiceType('internet');
    setDuoSplit({ internet: 0, cable: 0 });
    setPaymentMethod('efectivo');
    setSelectedVoucher(null);
  };

  // File upload handlers
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      validateAndSetVoucher(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetVoucher(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetVoucher = (file) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      showError('Solo se permiten archivos JPG, PNG o PDF');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('El archivo no puede superar los 5MB');
      return;
    }

    setSelectedVoucher(file);
    success('Voucher seleccionado correctamente');
  };

  const removeVoucher = () => {
    setSelectedVoucher(null);
  };

  // Función para obtener el nombre del mes en español
  const getMonthName = (monthString) => {
    const months = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    };
    
    if (monthString && monthString.includes('-')) {
      const [year, month] = monthString.split('-');
      return `${months[month]} ${year}`;
    }
    return monthString;
  };

  const confirmPayment = async () => {
    try {
      // Verificar si hay caja abierta
      if (!hasCurrentCashBox()) {
        showError('Debe abrir su caja antes de registrar pagos. Vaya a la sección "Mi Caja"');
        return;
      }

      const client = getClient(selectedPayment.clientId);
      
      // Preparar datos del pago con información del servicio
      const paymentData = {
        id: selectedPayment.id,
        collectorId: user.id,
        method: paymentMethod === 'efectivo' ? 'cash' : 'transfer',
        serviceType: serviceType,
        duoSplit: serviceType === 'duo' ? duoSplit : null
      };
      
      // Registrar cobro (cambia estado a 'collected') con información del servicio y voucher
      const updatedPayment = await collectPayment(
        selectedPayment.id,
        user.id,
        paymentMethod === 'efectivo' ? 'cash' : 'transfer',
        selectedVoucher
      );
      
      // Guardar información del servicio en localStorage para futuros reportes
      const paymentServiceInfo = {
        paymentId: selectedPayment.id,
        serviceType: serviceType,
        duoSplit: serviceType === 'duo' ? duoSplit : null,
        paymentMethod: paymentMethod,
        collectedDate: new Date().toISOString()
      };
      
      const storedServiceInfo = localStorage.getItem('tv-cable:payment-service-info') || '[]';
      const serviceInfoArray = JSON.parse(storedServiceInfo);
      serviceInfoArray.push(paymentServiceInfo);
      localStorage.setItem('tv-cable:payment-service-info', JSON.stringify(serviceInfoArray));

      // Si es un pago DUO, registrar en ambas cajas (Internet y Cable)
      if (serviceType === 'duo') {
        const internetAmount = duoSplit.internet;
        const cableAmount = duoSplit.cable;
        
        // Registrar porción de Internet
        try {
          await addPaymentIncome({
            paymentId: `${selectedPayment.id}-internet`,
            clientId: selectedPayment.clientId,
            clientName: client?.fullName || 'Cliente no encontrado',
            amount: internetAmount,
            method: paymentMethod,
            serviceType: 'internet'
          });
        } catch (cashError) {
          console.warn('Error registrando Internet en caja:', cashError);
        }
        
        // Registrar porción de Cable
        try {
          await addPaymentIncome({
            paymentId: `${selectedPayment.id}-cable`,
            clientId: selectedPayment.clientId,
            clientName: client?.fullName || 'Cliente no encontrado',
            amount: cableAmount,
            method: paymentMethod,
            serviceType: 'cable'
          });
        } catch (cashError) {
          console.warn('Error registrando Cable en caja:', cashError);
        }
      } else {
        // Pago simple (Internet o Cable)
        try {
          await addPaymentIncome({
            paymentId: selectedPayment.id,
            clientId: selectedPayment.clientId,
            clientName: client?.fullName || 'Cliente no encontrado',
            amount: selectedPayment.amount,
            method: paymentMethod,
            serviceType: serviceType
          });
        } catch (cashError) {
          console.warn('Error registrando en caja:', cashError);
        }
      }
      
      const methodLabels = {
        efectivo: 'Efectivo',
        yape: 'Yape',
        plin: 'Plin',
        transferencia: 'Transferencia',
        otros: 'Otros Digitales'
      };
      
      const serviceLabels = {
        internet: 'Internet',
        cable: 'Cable',
        duo: `DUO (Internet: S/${duoSplit.internet} / Cable: S/${duoSplit.cable})`
      };
      
      success(`Pago cobrado correctamente - ${serviceLabels[serviceType]} - ${methodLabels[paymentMethod]} - Pendiente de validación`);
      
      // Generar nota de pago automáticamente (ya se hace en el store de paymentStore)
      // Esperar un momento para que se genere el recibo
      setTimeout(async () => {
        const receipt = getReceiptByPaymentId(selectedPayment.id);
        if (receipt) {
          setCurrentReceipt(receipt);
          setShowReceiptModal(true);
        }
      }, 500);
      
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentMethod('efectivo');
      setSelectedVoucher(null);
    } catch (error) {
      showError('Error al registrar el pago');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      collected: 'bg-blue-100 text-blue-800',
      validated: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Función para detectar si un pago es adelantado
  const isAdvancePayment = (paymentMonth) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return paymentMonth > currentMonth;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4 text-yellow-600" />,
      overdue: <AlertTriangle className="h-4 w-4 text-red-600" />,
      collected: <CheckCircle className="h-4 w-4 text-blue-600" />,
      validated: <CheckCircle className="h-4 w-4 text-purple-600" />,
      paid: <CheckCircle className="h-4 w-4 text-green-600" />
    };
    return icons[status] || null;
  };

  const getPlanInfo = (plan) => {
    const plans = {
      basic: { name: 'Básico', price: 80, speed: '50 Mbps' },
      standard: { name: 'Estándar', price: 120, speed: '100 Mbps' },
      premium: { name: 'Premium', price: 160, speed: '200 Mbps' }
    };
    return plans[plan] || { name: 'Básico', price: 80, speed: '50 Mbps' };
  };

  // Ver nota de pago
  const handleViewReceipt = (payment) => {
    const receipt = getReceiptByPaymentId(payment.id);
    if (receipt) {
      setCurrentReceipt(receipt);
      setShowReceiptModal(true);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Gestión de Cobros</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {allClients.length} clientes disponibles para cobro
          </p>
          <span className="text-sm font-medium text-primary">
            {user?.alias || user?.fullName}
          </span>
        </div>
      </div>

      {/* Advertencia de caja cerrada */}
      {!hasCurrentCashBox() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Caja no abierta
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Debe abrir su caja antes de poder registrar cobros. 
                <span className="font-medium"> Vaya a la sección "Mi Caja" para abrir su caja diaria.</span>
              </p>
            </div>
            <button
              onClick={() => window.location.href = '/collector/cashbox'}
              className="ml-4 px-4 py-2 bg-red-100 text-red-800 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
            >
              Ir a Mi Caja
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filtros de estado */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Pendientes ({filteredPayments.filter(p => p.status !== 'paid').length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Cobrados ({filteredPayments.filter(p => p.status === 'paid').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de clientes con pagos agrupados */}
      {isLoading() ? (
        <LoadingSpinner />
      ) : Object.keys(groupedPayments).length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No hay pagos"
          description={filterStatus === 'pending' ? "No tienes pagos pendientes" : "No se encontraron pagos"}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPayments).map(([clientId, clientPayments]) => {
            const client = getClient(clientId);
            const planInfo = getPlanInfo(client?.servicePlan);
            
            // Separar pagos por estado para mostrarlos organizadamente
            const pendingPayments = clientPayments.filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'partial');
            const paidPayments = clientPayments.filter(p => ['collected', 'validated', 'paid'].includes(p.status));
            
            return (
              <div key={clientId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  {/* Cliente info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {client?.fullName || 'Cliente desconocido'}
                      </h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {client?.phone}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {client?.address?.split(',')[1]?.trim()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Wifi className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        Plan {planInfo.name} ({planInfo.speed})
                      </span>
                    </div>
                  </div>

                  {/* Meses pendientes de pago */}
                  {pendingPayments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Meses pendientes de pago ({pendingPayments.length}):
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {pendingPayments.map((payment) => (
                          <button
                            key={payment.id}
                            onClick={() => {
                              if (hasCurrentCashBox()) {
                                handleRegisterPayment(payment);
                              } else {
                                showError('Debe abrir su caja antes de registrar pagos. Vaya a la sección "Mi Caja"');
                              }
                            }}
                            disabled={!hasCurrentCashBox()}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              !hasCurrentCashBox()
                                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : payment.status === 'overdue'
                                  ? 'border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400'
                                  : payment.status === 'partial'
                                    ? 'border-orange-300 bg-orange-50 hover:bg-orange-100 hover:border-orange-400'
                                    : isAdvancePayment(payment.month)
                                      ? 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400'
                                      : 'border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${
                                payment.status === 'overdue' ? 'text-red-700' :
                                payment.status === 'partial' ? 'text-orange-700' :
                                isAdvancePayment(payment.month) ? 'text-blue-700' :
                                'text-gray-900'
                              }`}>
                                {getMonthName(payment.month)}
                                {payment.status === 'partial' && (
                                  <span className="ml-1 text-xs">(Parcial)</span>
                                )}
                                {(payment.isAdvancePayment || isAdvancePayment(payment.month)) && (
                                  <span className="ml-1 text-xs text-blue-600">(Adelantado)</span>
                                )}
                              </span>
                              {payment.status === 'overdue' && (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              )}
                              {payment.status === 'partial' && (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                              )}
                              {(payment.isAdvancePayment || isAdvancePayment(payment.month)) && payment.status !== 'overdue' && payment.status !== 'partial' && (
                                <span className="text-blue-600">🔵</span>
                              )}
                            </div>
                            <div className={`text-lg font-bold ${
                              !hasCurrentCashBox() ? 'text-gray-400' : 'text-primary'
                            }`}>
                              S/ {payment.amount.toFixed(2)}
                            </div>
                            <div className={`text-xs ${
                              !hasCurrentCashBox() ? 'text-gray-400' :
                              payment.status === 'overdue' ? 'text-red-600' :
                              payment.status === 'partial' ? 'text-orange-600' :
                              (payment.isAdvancePayment || isAdvancePayment(payment.month)) ? 'text-blue-600' :
                              'text-gray-500'
                            }`}>
                              {!hasCurrentCashBox() ? 'Abra su caja primero' :
                               payment.status === 'partial' ? 'Pago parcial pendiente' :
                               (payment.isAdvancePayment || isAdvancePayment(payment.month)) ? 'Pago adelantado' :
                               `Vence: ${new Date(payment.dueDate).toLocaleDateString('es-PE')}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meses ya pagados/cobrados */}
                  {paidPayments.length > 0 && (
                    <div className="border-t pt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        Meses procesados ({paidPayments.length}):
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {paidPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className={`p-3 rounded-lg border text-left ${
                              payment.status === 'collected' ? 'border-blue-300 bg-blue-50' :
                              payment.status === 'validated' ? 'border-purple-300 bg-purple-50' :
                              'border-green-300 bg-green-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {getMonthName(payment.month)}
                              </span>
                              {getStatusIcon(payment.status)}
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              S/ {payment.amount.toFixed(2)}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${
                                payment.status === 'collected' ? 'text-blue-600' :
                                payment.status === 'validated' ? 'text-purple-600' :
                                'text-green-600'
                              }`}>
                                {payment.status === 'collected' ? 'Cobrado' :
                                 payment.status === 'validated' ? 'Validado' : 'Pagado'}
                              </span>
                              {getReceiptByPaymentId(payment.id) && (
                                <button 
                                  onClick={() => handleViewReceipt(payment)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mensaje cuando no hay pagos para mostrar */}
                  {pendingPayments.length === 0 && paidPayments.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No hay pagos para mostrar con los filtros actuales
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación de pago */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Cobro
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Cliente</p>
                <p className="font-medium text-gray-900">
                  {getClient(selectedPayment.clientId)?.fullName}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Mes a cobrar</p>
                <p className="font-medium text-gray-900">
                  {getMonthName(selectedPayment.month)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Monto a cobrar</p>
                <p className="text-2xl font-bold text-primary">
                  S/ {selectedPayment.amount.toFixed(2)}
                </p>
              </div>

              {/* Información de deuda total */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium mb-2">📋 Estado de Deuda del Cliente</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Meses pendientes:</span>
                    <span className="font-medium text-red-700">
                      {(() => {
                        const clientPayments = payments.filter(p => p.clientId === selectedPayment.clientId);
                        const pendingCount = clientPayments.filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'partial').length;
                        return pendingCount;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Deuda total:</span>
                    <span className="font-bold text-red-700">
                      S/ {(() => {
                        const clientPayments = payments.filter(p => p.clientId === selectedPayment.clientId);
                        const totalDebt = clientPayments
                          .filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'partial')
                          .reduce((sum, p) => sum + p.amount, 0);
                        return totalDebt.toFixed(2);
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Meses vencidos:</span>
                    <span className="font-medium text-red-700">
                      {(() => {
                        const clientPayments = payments.filter(p => p.clientId === selectedPayment.clientId);
                        const overdueCount = clientPayments.filter(p => p.status === 'overdue').length;
                        return overdueCount;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Lista de meses adeudados */}
                <div className="mt-3 pt-2 border-t border-red-200">
                  <p className="text-xs text-red-600 mb-1">Meses adeudados:</p>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      const clientPayments = payments.filter(p => p.clientId === selectedPayment.clientId);
                      const owedPayments = clientPayments.filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'partial');
                      return owedPayments.map(payment => (
                        <span
                          key={payment.id}
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            payment.status === 'overdue'
                              ? 'bg-red-200 text-red-800'
                              : payment.status === 'partial'
                                ? 'bg-orange-200 text-orange-800'
                                : 'bg-yellow-200 text-yellow-800'
                          }`}
                        >
                          {getMonthName(payment.month)}
                          {payment.status === 'partial' && ' (Parcial)'}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Tipo de Servicio</p>
                <select 
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="internet">🌐 Internet{servicePrices.internet > 0 && ` (Ref: S/ ${servicePrices.internet})`}</option>
                  <option value="cable">📺 Cable{servicePrices.cable > 0 && ` (Ref: S/ ${servicePrices.cable})`}</option>
                  <option value="duo">🎯 DUO{servicePrices.duo > 0 && ` (Ref: S/ ${servicePrices.duo})`}</option>
                </select>
                {servicePrices[serviceType] > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Precio de referencia: S/ {servicePrices[serviceType]}
                  </p>
                )}
                
                {serviceType === 'duo' && (
                  <div className="mt-3 p-2 bg-blue-50 rounded">
                    <p className="text-xs text-blue-700 mb-2">División manual del pago DUO</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Monto Internet (S/)</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={duoSplit.internet}
                          onChange={(e) => {
                            const internetAmount = parseFloat(e.target.value) || 0;
                            setDuoSplit({ 
                              ...duoSplit,
                              internet: internetAmount
                            });
                          }}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Monto Cable (S/)</label>
                        <input 
                          type="number"
                          step="0.01"
                          min="0"
                          value={duoSplit.cable}
                          onChange={(e) => {
                            const cableAmount = parseFloat(e.target.value) || 0;
                            setDuoSplit({ 
                              ...duoSplit,
                              cable: cableAmount
                            });
                          }}
                          className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs text-gray-600">
                        Total cobrado: S/ {(duoSplit.internet + duoSplit.cable).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Método de pago</p>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="yape">📱 Yape</option>
                  <option value="plin">📱 Plin</option>
                  <option value="transferencia">🏦 Transferencia Bancaria</option>
                  <option value="otros">📲 Otros Digitales</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {paymentMethod === 'efectivo' 
                    ? 'Se agregará a su caja como efectivo recibido'
                    : `Se agregará a su caja como ingreso de ${paymentMethod.toUpperCase()}`
                  }
                </p>
              </div>

              {/* Sección de voucher */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Voucher (opcional)</p>
                
                {selectedVoucher ? (
                  <div className="flex items-center justify-between bg-white border-2 border-green-300 rounded-lg p-3">
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-gray-900 truncate max-w-[150px]">
                        {selectedVoucher.name}
                      </span>
                    </div>
                    <button
                      onClick={removeVoucher}
                      className="text-red-500 hover:text-red-700 p-1"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                      dragActive 
                        ? 'border-primary bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDrag}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onClick={() => document.getElementById('voucher-input').click()}
                  >
                    <Upload className={`h-6 w-6 mx-auto mb-2 ${dragActive ? 'text-primary' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-600">
                      Arrastra un archivo aquí o haz click
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG o PDF (máx. 5MB)
                    </p>
                  </div>
                )}

                <input
                  id="voucher-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedVoucher(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPayment}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de nota de pago */}
      {showReceiptModal && currentReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Nota de Pago - {currentReceipt.receiptNumber}
              </h3>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setCurrentReceipt(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <PaymentReceipt receipt={currentReceipt} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorPayments;