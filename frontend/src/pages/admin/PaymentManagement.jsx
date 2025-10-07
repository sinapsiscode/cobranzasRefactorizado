import React, { useEffect, useState } from 'react';
import { usePaymentStore } from '../../stores/paymentStore';
import { useClientStore } from '../../stores/clientStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useVoucherStore } from '../../stores/voucherStore';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  DollarSign,
  FolderOpen,
  Folder,
  FolderCheck,
  FileText,
  TrendingUp,
  Users,
  ArrowLeft,
  CheckSquare,
  Square,
  List,
  Grid,
  Gift,
  Calculator,
  Upload,
  ImageIcon,
  X,
  Check,
  MessageSquare
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PaymentRegistrationModal from '../../components/common/PaymentRegistrationModal';
import { generatePaymentReceipt } from '../../services/reports/pdfGenerator';
import { db } from '../../services/mock/db';

const PaymentManagement = () => {
  const { 
    payments, 
    pagination,
    filters,
    fetchPayments,
    setFilters,
    setPage,
    updatePayment,
    isLoading
  } = usePaymentStore();
  
  const { clients, fetchClients } = useClientStore();
  const { success, error: showError, info } = useNotificationStore();
  const { vouchers, fetchAllVouchers, reviewVoucher, isLoading: vouchersLoading } = useVoucherStore();
  const { validatePayment, finalizePayment } = usePaymentStore();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history' | 'vouchers'
  const [viewMode, setViewMode] = useState('folders'); // 'folders' | 'list'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Estados para vouchers
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherFilter, setVoucherFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  
  // Estados para validación de pagos
  const [selectedPaymentForValidation, setSelectedPaymentForValidation] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Estado para modal de registro de pagos
  const [showPaymentRegistrationModal, setShowPaymentRegistrationModal] = useState(false);
  
  useEffect(() => {
    fetchPayments();
    fetchClients();
    fetchAllVouchers();
  }, []);

  // Agrupar pagos por mes
  const getPaymentsByMonth = () => {
    const monthGroups = {};
    
    payments.forEach(payment => {
      const monthKey = payment.month || `${payment.year}-${String(new Date(payment.dueDate).getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          month: monthKey,
          year: payment.year || new Date(payment.dueDate).getFullYear(),
          payments: [],
          totalAmount: 0,
          paidAmount: 0,
          pendingCount: 0,
          paidCount: 0,
          overdueCount: 0,
          totalClients: new Set(),
          isComplete: false
        };
      }
      
      monthGroups[monthKey].payments.push(payment);
      monthGroups[monthKey].totalAmount += payment.amount;
      monthGroups[monthKey].totalClients.add(payment.clientId);
      
      if (payment.status === 'paid') {
        monthGroups[monthKey].paidAmount += payment.amount;
        monthGroups[monthKey].paidCount++;
      } else if (payment.status === 'pending') {
        monthGroups[monthKey].pendingCount++;
      } else if (payment.status === 'overdue') {
        monthGroups[monthKey].overdueCount++;
      }
    });
    
    // Determinar si cada mes está completo
    Object.values(monthGroups).forEach(group => {
      group.isComplete = group.pendingCount === 0 && group.overdueCount === 0;
      group.totalClients = group.totalClients.size;
      group.completionRate = Math.round((group.paidCount / group.payments.length) * 100);
    });
    
    return monthGroups;
  };

  const monthGroups = getPaymentsByMonth();
  const sortedMonths = Object.keys(monthGroups).sort().reverse();

  // Filtrar pagos según el tab activo
  const getFilteredPayments = () => {
    if (selectedMonth) {
      return monthGroups[selectedMonth]?.payments || [];
    }
    
    if (activeTab === 'pending') {
      return payments.filter(p => p.status === 'pending' || p.status === 'overdue');
    }
    
    return payments;
  };

  const filteredPayments = getFilteredPayments();

  // Funciones auxiliares
  const formatMonthName = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.fullName : 'Cliente desconocido';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4 text-yellow-600" />,
      collected: <CheckCircle className="h-4 w-4 text-blue-600" />,
      validated: <CheckCircle className="h-4 w-4 text-purple-600" />,
      paid: <CheckCircle className="h-4 w-4 text-green-600" />,
      overdue: <AlertTriangle className="h-4 w-4 text-red-600" />,
      partial: <XCircle className="h-4 w-4 text-orange-600" />
    };
    return icons[status] || null;
  };

  const getBillingTypeBadge = (payment) => {
    // Prioridad 1: Pago adelantado
    if (payment.isAdvancePayment) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          Adelantado
        </span>
      );
    }

    // Prioridad 2: Tipo de facturación especial
    if (payment.billingType === 'free') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          <Gift className="h-3 w-3 mr-1" />
          Mes Gratis
        </span>
      );
    } else if (payment.billingType === 'prorated') {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          <Calculator className="h-3 w-3 mr-1" />
          Prorrateo
        </span>
      );
    }

    // Prioridad 3: Normal
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Normal
      </span>
    );
  };

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

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      collected: 'bg-blue-100 text-blue-800',
      validated: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // ELIMINADO: No se permite marcar pagos como pagados sin validación
  // Todos los pagos DEBEN pasar por el flujo de validación obligatoria

  const handlePrintReceipt = async (payment) => {
    try {
      // Obtener datos del cliente
      const client = clients.find(c => c.id === payment.clientId);
      
      // Obtener datos del cobrador si existe
      let collector = null;
      if (payment.collectorId) {
        const users = db.getCollection('users') || [];
        collector = users.find(u => u.id === payment.collectorId);
      }

      // Obtener datos del validador (OBLIGATORIO para todos los pagos)
      let validator = null;
      if (payment.validatedBy) {
        const users = db.getCollection('users') || [];
        validator = users.find(u => u.id === payment.validatedBy);
      }

      // Solo generar recibo si el pago fue validado
      if (!validator) {
        showError('No se puede generar recibo: el pago debe ser validado por un Administrador o Súper administrador');
        return;
      }
      
      // Generar el recibo con firma del validador
      await generatePaymentReceipt(payment, client, collector, validator);
      success('Recibo generado exitosamente con firma del validador');
    } catch (error) {
      showError('Error al generar el recibo');
      console.error('Error:', error);
    }
  };

  const formatAmount = (amount) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE');
  };

  // Funciones para manejo de vouchers
  const getFilteredVouchers = () => {
    let filtered = vouchers;
    
    // Filtrar por estado
    if (voucherFilter !== 'all') {
      filtered = filtered.filter(v => v.status === voucherFilter);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(v => {
        const client = clients.find(c => c.id === v.clientId);
        return client?.fullName.toLowerCase().includes(search) ||
               v.operationNumber.includes(search) ||
               client?.phone?.includes(search);
      });
    }
    
    return filtered.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  };

  const handleVoucherReview = (voucher) => {
    setSelectedVoucher(voucher);
    setShowVoucherModal(true);
  };

  const handleVoucherApproval = async (status, comments = '') => {
    try {
      const user = JSON.parse(localStorage.getItem('tv-cable:auth'))?.user;
      await reviewVoucher(selectedVoucher.id, status, user?.fullName || 'Admin', comments);
      
      success(status === 'approved' ? 'Voucher aprobado' : 'Voucher rechazado');
      setShowVoucherModal(false);
      setSelectedVoucher(null);
    } catch (error) {
      showError('Error al revisar voucher');
    }
  };

  const getVoucherStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getVoucherStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4 text-yellow-600" />,
      approved: <CheckCircle className="h-4 w-4 text-green-600" />,
      rejected: <X className="h-4 w-4 text-red-600" />
    };
    return icons[status] || null;
  };

  // Funciones para validación de pagos
  const handleValidatePayment = (payment) => {
    setSelectedPaymentForValidation(payment);
    setShowValidationModal(true);
  };

  const handlePaymentValidation = async (action, comments = '') => {
    try {
      const user = JSON.parse(localStorage.getItem('tv-cable:auth'))?.user;
      
      if (action === 'validate') {
        // Validar el pago sin división de cajas
        await validatePayment(selectedPaymentForValidation.id, user?.id, comments);
        success(`Pago de S/${selectedPaymentForValidation.amount.toFixed(2)} validado correctamente`);
      } else if (action === 'finalize') {
        await finalizePayment(selectedPaymentForValidation.id);
        success('Pago finalizado correctamente');
      }
      
      setShowValidationModal(false);
      setSelectedPaymentForValidation(null);
    } catch (error) {
      showError('Error al procesar la validación');
    }
  };

  // Renderizar vista de vouchers
  const renderVouchersView = () => {
    const filteredVouchers = getFilteredVouchers();
    
    return (
      <div className="space-y-4">
        {/* Filtros de vouchers */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setVoucherFilter('pending')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                voucherFilter === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Pendientes ({vouchers.filter(v => v.status === 'pending').length})
            </button>
            <button
              onClick={() => setVoucherFilter('approved')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                voucherFilter === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Aprobados ({vouchers.filter(v => v.status === 'approved').length})
            </button>
            <button
              onClick={() => setVoucherFilter('rejected')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                voucherFilter === 'rejected' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Rechazados ({vouchers.filter(v => v.status === 'rejected').length})
            </button>
            <button
              onClick={() => setVoucherFilter('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                voucherFilter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Lista de vouchers */}
        {vouchersLoading() ? (
          <LoadingSpinner text="Cargando vouchers..." />
        ) : filteredVouchers.length === 0 ? (
          <EmptyState
            icon={Upload}
            title="No hay vouchers"
            description={voucherFilter === 'pending' ? "No hay vouchers pendientes de revisión" : "No se encontraron vouchers"}
          />
        ) : (
          <div className="space-y-3">
            {filteredVouchers.map((voucher) => {
              const client = clients.find(c => c.id === voucher.clientId);
              
              return (
                <div key={voucher.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {client?.fullName || 'Cliente desconocido'}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs text-gray-500">
                            N° Operación: {voucher.operationNumber}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(voucher.uploadDate)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getVoucherStatusIcon(voucher.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVoucherStatusColor(voucher.status)}`}>
                          {voucher.status === 'pending' ? 'Pendiente' : 
                           voucher.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </div>
                    </div>

                    {/* Detalles del voucher */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Monto</p>
                          <p className="font-medium text-gray-900">S/ {voucher.amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Fecha de Pago</p>
                          <p className="font-medium text-gray-900">{formatDate(voucher.paymentDate)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Archivo</p>
                        <div className="flex items-center text-sm text-gray-900">
                          <ImageIcon className="h-4 w-4 mr-2" />
                          {voucher.fileName}
                          <span className="ml-2 text-xs text-gray-500">
                            ({(voucher.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                      </div>

                      {voucher.comments && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 mb-1">Comentarios</p>
                          <p className="text-sm text-gray-900">{voucher.comments}</p>
                        </div>
                      )}
                    </div>

                    {/* Información de revisión */}
                    {voucher.reviewedBy && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600 font-medium">
                            Revisado por: {voucher.reviewedBy}
                          </span>
                          <span className="text-xs text-blue-600">
                            {formatDate(voucher.reviewDate)}
                          </span>
                        </div>
                        {voucher.reviewComments && (
                          <p className="text-sm text-blue-900 mt-1">{voucher.reviewComments}</p>
                        )}
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVoucherReview(voucher)}
                        className="flex-1 bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Revisar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista de carpetas
  const renderFoldersView = () => {
    const monthsToShow = activeTab === 'pending' 
      ? sortedMonths.filter(month => !monthGroups[month].isComplete)
      : sortedMonths;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monthsToShow.map(monthKey => {
          const group = monthGroups[monthKey];
          const isComplete = group.isComplete;
          
          return (
            <div
              key={monthKey}
              onClick={() => setSelectedMonth(monthKey)}
              className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-primary"
            >
              {/* Indicador de completitud */}
              {isComplete && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
              
              <div className="p-4">
                {/* Icono y título */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {isComplete ? (
                      <FolderCheck className="h-10 w-10 text-green-500 mr-3" />
                    ) : (
                      <Folder className="h-10 w-10 text-yellow-500 mr-3" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {formatMonthName(monthKey)}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {group.totalClients} clientes
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Estadísticas */}
                <div className="space-y-2">
                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        isComplete ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${group.completionRate}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{group.completionRate}% completado</span>
                    <span>{group.paidCount}/{group.payments.length}</span>
                  </div>
                  
                  {/* Montos */}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{formatAmount(group.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Recaudado:</span>
                      <span className="font-medium text-green-600">
                        {formatAmount(group.paidAmount)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Estados */}
                  <div className="flex justify-between pt-2 border-t">
                    {group.paidCount > 0 && (
                      <span className="inline-flex items-center text-xs">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        {group.paidCount}
                      </span>
                    )}
                    {group.pendingCount > 0 && (
                      <span className="inline-flex items-center text-xs">
                        <Clock className="h-3 w-3 text-yellow-500 mr-1" />
                        {group.pendingCount}
                      </span>
                    )}
                    {group.overdueCount > 0 && (
                      <span className="inline-flex items-center text-xs">
                        <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                        {group.overdueCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar vista de lista (tabla)
  const renderListView = () => {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mes/Año
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Pago
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getClientName(payment.clientId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMonthName(payment.month)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatAmount(payment.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getBillingTypeBadge(payment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(payment.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {payment.status === 'paid' && (
                        <button
                          onClick={() => handlePrintReceipt(payment)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Imprimir recibo con firma del validador"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                      {payment.status === 'collected' && (
                        <button
                          onClick={() => handleValidatePayment(payment)}
                          className="text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-medium"
                          title="Validar pago"
                        >
                          Validar
                        </button>
                      )}
                      {payment.status === 'validated' && (
                        <span className="text-purple-600 text-xs">
                          Validado - Procesando
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Renderizar detalle del mes seleccionado
  const renderMonthDetail = () => {
    const monthData = monthGroups[selectedMonth];
    if (!monthData) return null;

    return (
      <div className="space-y-6">
        {/* Header del mes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <button
                onClick={() => setSelectedMonth(null)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {formatMonthName(selectedMonth)}
                </h2>
                <p className="text-sm text-gray-600">
                  {monthData.totalClients} clientes • {monthData.payments.length} pagos
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {monthData.isComplete && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Mes Completo</span>
                </div>
              )}
              <button className="flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
          
          {/* Estadísticas del mes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total a Recaudar</p>
              <p className="text-lg font-bold text-gray-900">
                {formatAmount(monthData.totalAmount)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">Recaudado</p>
              <p className="text-lg font-bold text-green-900">
                {formatAmount(monthData.paidAmount)}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-yellow-600 mb-1">Pendiente</p>
              <p className="text-lg font-bold text-yellow-900">
                {formatAmount(monthData.totalAmount - monthData.paidAmount)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">Progreso</p>
              <p className="text-lg font-bold text-blue-900">
                {monthData.completionRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Lista de pagos del mes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Detalle de Pagos
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthData.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getClientName(payment.clientId)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.clientId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatAmount(payment.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getBillingTypeBadge(payment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(payment.status)}
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {payment.status === 'paid' && (
                          <button
                            onClick={() => handlePrintReceipt(payment)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Imprimir recibo con firma del validador"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {payment.status === 'collected' && (
                          <span className="text-blue-600 text-xs">
                            Pendiente de validación
                          </span>
                        )}
                        {payment.status === 'validated' && (
                          <span className="text-purple-600 text-xs">
                            Validado - Procesando
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600">Administrar pagos mensuales y vouchers</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button
            onClick={() => setShowPaymentRegistrationModal(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Pago
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Finalizados</p>
              <p className="text-2xl font-bold text-green-600">
                {payments.filter(p => p.status === 'paid').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes Validación</p>
              <p className="text-2xl font-bold text-blue-600">
                {payments.filter(p => p.status === 'collected').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validados</p>
              <p className="text-2xl font-bold text-purple-600">
                {payments.filter(p => p.status === 'validated').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Meses Completos</p>
              <p className="text-2xl font-bold text-primary">
                {Object.values(monthGroups).filter(m => m.isComplete).length}
              </p>
            </div>
            <FolderCheck className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Si hay un mes seleccionado, mostrar su detalle */}
      {selectedMonth ? (
        renderMonthDetail()
      ) : (
        <>
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <div className="flex justify-between items-center px-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'pending'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Pagos Pendientes
                      {payments.filter(p => p.status === 'pending' || p.status === 'overdue').length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
                          {payments.filter(p => p.status === 'pending' || p.status === 'overdue').length}
                        </span>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'history'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Historial de Pagos
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('vouchers')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'vouchers'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Vouchers de Pago
                      {vouchers.filter(v => v.status === 'pending').length > 0 && (
                        <span className="ml-2 bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs font-medium">
                          {vouchers.filter(v => v.status === 'pending').length}
                        </span>
                      )}
                    </div>
                  </button>
                </nav>
                
                {/* Controles de vista */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('folders')}
                    className={`p-2 rounded ${viewMode === 'folders' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Vista de carpetas"
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Vista de lista"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Búsqueda y filtros */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, mes o monto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Todos los estados</option>
                  <option value="paid">Pagados</option>
                  <option value="pending">Pendientes</option>
                  <option value="overdue">Vencidos</option>
                </select>
                
                <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Más Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          {activeTab === 'vouchers' ? (
            renderVouchersView()
          ) : isLoading() ? (
            <div className="bg-white rounded-lg shadow p-8 flex justify-center">
              <LoadingSpinner size="large" text="Cargando pagos..." />
            </div>
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title={activeTab === 'pending' ? 'No hay pagos pendientes' : 'No hay pagos registrados'}
              description={activeTab === 'pending' 
                ? 'Todos los pagos están al día. ¡Excelente trabajo!' 
                : 'No se encontraron pagos en el historial.'}
            />
          ) : (
            viewMode === 'folders' ? renderFoldersView() : renderListView()
          )}
        </>
      )}

      {/* Modal de validación de pago */}
      {showValidationModal && selectedPaymentForValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Validar Pago
                </h3>
                <button 
                  onClick={() => setShowValidationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Información del pago */}
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Pago</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">
                        {clients.find(c => c.id === selectedPaymentForValidation.clientId)?.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto Total:</span>
                      <span className="font-bold text-primary">
                        S/ {selectedPaymentForValidation.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Método:</span>
                      <span>{selectedPaymentForValidation.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de cobro:</span>
                      <span>{formatDate(selectedPaymentForValidation.paymentDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Información del tipo de servicio */}
                {(() => {
                  const client = clients.find(c => c.id === selectedPaymentForValidation.clientId);
                  const isDuo = client?.services?.includes('cable') && client?.services?.includes('internet');
                  const hasCable = client?.services?.includes('cable');
                  const hasInternet = client?.services?.includes('internet');
                  
                  if (isDuo) {
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>🎯 Cliente DUO:</strong> Servicios de Cable + Internet
                        </p>
                      </div>
                    );
                  } else if (hasCable && !hasInternet) {
                    return (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm text-purple-800">
                          <strong>📺 Cliente:</strong> Servicio de Cable
                        </p>
                      </div>
                    );
                  } else if (hasInternet && !hasCable) {
                    return (
                      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                        <p className="text-sm text-cyan-800">
                          <strong>🌐 Cliente:</strong> Servicio de Internet
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios de validación (opcional)
                  </label>
                  <textarea 
                    id="validationComments"
                    placeholder="Agregar comentarios sobre la validación..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    rows="3"
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const comments = document.getElementById('validationComments').value;
                    handlePaymentValidation('validate', comments);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Validar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de revisión de voucher */}
      {showVoucherModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Revisar Voucher de Pago
                </h3>
                <button 
                  onClick={() => setShowVoucherModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Información del cliente */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-medium">
                      {clients.find(c => c.id === selectedVoucher.clientId)?.fullName || 'Cliente desconocido'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">
                      {clients.find(c => c.id === selectedVoucher.clientId)?.phone || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del voucher */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Detalles del Voucher</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">N° Operación</p>
                    <p className="font-mono font-bold text-blue-900">
                      {selectedVoucher.operationNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Monto</p>
                    <p className="text-xl font-bold text-blue-900">
                      S/ {selectedVoucher.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Fecha de Pago</p>
                    <p className="font-medium text-blue-900">
                      {formatDate(selectedVoucher.paymentDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Fecha de Subida</p>
                    <p className="font-medium text-blue-900">
                      {formatDate(selectedVoucher.uploadDate)}
                    </p>
                  </div>
                </div>
                
                {selectedVoucher.comments && (
                  <div className="mt-3">
                    <p className="text-sm text-blue-600">Comentarios del cliente</p>
                    <p className="text-blue-900">{selectedVoucher.comments}</p>
                  </div>
                )}
              </div>

              {/* Preview del archivo */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Archivo Adjunto</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ImageIcon className="h-6 w-6 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedVoucher.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {selectedVoucher.fileType} • {(selectedVoucher.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Crear un enlace temporal para descargar/ver el archivo
                      const link = document.createElement('a');
                      link.href = selectedVoucher.fileData;
                      link.download = selectedVoucher.fileName;
                      link.click();
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Ver Archivo
                  </button>
                </div>
              </div>

              {/* Acciones de revisión */}
              {selectedVoucher.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comentarios de revisión (opcional)
                    </label>
                    <textarea 
                      id="reviewComments"
                      placeholder="Agregar comentarios sobre la revisión..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      rows="3"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        const comments = document.getElementById('reviewComments').value;
                        handleVoucherApproval('approved', comments);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aprobar Voucher
                    </button>
                    <button
                      onClick={() => {
                        const comments = document.getElementById('reviewComments').value;
                        handleVoucherApproval('rejected', comments);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rechazar Voucher
                    </button>
                  </div>
                </div>
              )}

              {/* Información de revisión ya realizada */}
              {selectedVoucher.status !== 'pending' && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Estado de Revisión</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getVoucherStatusIcon(selectedVoucher.status)}
                      <span className="ml-2 font-medium">
                        {selectedVoucher.status === 'approved' ? 'Voucher Aprobado' : 'Voucher Rechazado'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-yellow-600">
                        Revisado por: {selectedVoucher.reviewedBy}
                      </p>
                      <p className="text-sm text-yellow-600">
                        {formatDate(selectedVoucher.reviewDate)}
                      </p>
                    </div>
                  </div>
                  {selectedVoucher.reviewComments && (
                    <div className="mt-2 pt-2 border-t border-yellow-200">
                      <p className="text-sm text-yellow-600">Comentarios:</p>
                      <p className="text-yellow-900">{selectedVoucher.reviewComments}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Pagos */}
      <PaymentRegistrationModal
        isOpen={showPaymentRegistrationModal}
        onClose={() => {
          setShowPaymentRegistrationModal(false);
          fetchPayments(); // Recargar pagos después de cerrar el modal
        }}
      />
    </div>
  );
};

export default PaymentManagement;
