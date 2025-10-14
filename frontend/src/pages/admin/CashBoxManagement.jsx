import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  Eye,
  Settings,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  Search
} from 'lucide-react';
import CashBoxRequestsPanel from '../../components/subadmin/CashBoxRequestsPanel';
import CashBoxSupervisor from '../../components/subadmin/CashBoxSupervisor';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
// MIGRADO A JSON SERVER - import eliminado
import { ServiceTypes, getServiceTypeLabel } from '../../schemas/service';
import {
  ExpenseStatuses,
  getExpenseStatusLabel as getStatusLabel,
  getExpenseStatusColor as getStatusColor,
  validateExpense
} from '../../schemas/expense';

const API_URL = 'http://localhost:8231/api';

const CashBoxManagement = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [cashFlowView, setCashFlowView] = useState('summary'); // 'summary', 'income', 'expenses'
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const { user } = useAuthStore();
  const { success, error: showError } = useNotificationStore();

  // Estados para el modal de gastos
  const [expenseFormData, setExpenseFormData] = useState({
    amount: '',
    concept: '',
    serviceType: 'general',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    receiptNumber: '',
    supplier: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPaymentMethods();
    if (activeTab === 'cashflow') {
      loadCashFlowData();
    }
  }, [activeTab]);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_URL}/paymentMethods`);
      if (!response.ok) {
        throw new Error('Error al cargar métodos de pago');
      }
      const data = await response.json();
      const methods = data.items || data;
      // Filtrar solo métodos activos
      setPaymentMethods(methods.filter(m => m.isActive));
    } catch (error) {
      console.error('Error loading payment methods:', error);
      showError('Error al cargar métodos de pago');
    }
  };

  const loadCashFlowData = async () => {
    setLoading(true);
    try {
      // Cargar gastos
      const expensesResponse = await fetch(`${API_URL}/expenses`);
      const expensesData = await expensesResponse.json();
      setExpenses(expensesData.items || expensesData || []);

      // Cargar pagos (ingresos)
      const paymentsResponse = await fetch(`${API_URL}/payments`);
      const paymentsData = await paymentsResponse.json();
      const allPayments = paymentsData.items || paymentsData || [];
      setPayments(allPayments.filter(p => p.status === 'paid' || p.status === 'validated'));
    } catch (error) {
      console.error('Error loading cash flow data:', error);
      showError('Error al cargar datos del flujo de caja');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseFormChange = (field, value) => {
    setExpenseFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddExpense = () => {
    setExpenseFormData({
      amount: '',
      concept: '',
      serviceType: 'general',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethods.length > 0 ? paymentMethods[0].id : '',
      receiptNumber: '',
      supplier: ''
    });
    setShowExpenseModal(true);
  };

  const handleSubmitExpense = async () => {
    try {
      // Validar datos
      const errors = validateExpense({
        ...expenseFormData,
        registeredBy: user?.id,
        amount: parseFloat(expenseFormData.amount)
      });

      if (errors) {
        const errorMessages = Object.values(errors);
        showError(`Error en los datos: ${errorMessages[0]}`);
        return;
      }

      // Crear nuevo gasto
      const newExpense = {
        ...expenseFormData,
        amount: parseFloat(expenseFormData.amount),
        registeredBy: user?.id,
        status: 'pagado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // POST al API
      const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newExpense)
      });

      if (!response.ok) {
        throw new Error('Error al crear gasto');
      }

      const data = await response.json();
      const createdExpense = data.data || data;

      // Actualizar estado local
      setExpenses([createdExpense, ...expenses]);

      success('Gasto registrado exitosamente');
      setShowExpenseModal(false);
      setExpenseFormData({
        amount: '',
        concept: '',
        serviceType: 'general',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethods.length > 0 ? paymentMethods[0].id : '',
        receiptNumber: '',
        supplier: ''
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      showError('Error al registrar el gasto');
    }
  };

  // Filtrar gastos según criterios
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDateRange = (!filterDateFrom || expense.expenseDate >= filterDateFrom) &&
                            (!filterDateTo || expense.expenseDate <= filterDateTo);

    return matchesSearch && matchesDateRange;
  });

  // Filtrar ingresos según criterios
  const filteredPayments = payments.filter(payment => {
    const matchesDateRange = (!filterDateFrom || payment.paymentDate >= filterDateFrom) &&
                            (!filterDateTo || payment.paymentDate <= filterDateTo);

    return matchesDateRange;
  });

  // Calcular totales
  const totalIncome = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  const formatCurrency = (amount) => {
    return `S/ ${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPaymentMethodName = (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId);
    return method ? method.name : methodId;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Cajas</h1>
        <p className="text-gray-600">Aprobar solicitudes y supervisar cajas de los cobradores</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Solicitudes</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('supervisor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'supervisor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Supervisión</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('cashflow')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'cashflow'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Flujo de Caja</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Contenido de las tabs */}
      <div>
        {activeTab === 'requests' && <CashBoxRequestsPanel />}
        {activeTab === 'supervisor' && <CashBoxSupervisor />}
        {activeTab === 'cashflow' && (
          <div className="space-y-6">
            {/* Resumen financiero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Ingresos</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Gastos</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className={`h-8 w-8 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Balance Neto</p>
                    <p className={`text-2xl font-semibold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles y filtros */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setCashFlowView('summary')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        cashFlowView === 'summary'
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Resumen
                    </button>
                    <button
                      onClick={() => setCashFlowView('income')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        cashFlowView === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Ingresos
                    </button>
                    <button
                      onClick={() => setCashFlowView('expenses')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        cashFlowView === 'expenses'
                          ? 'bg-red-100 text-red-800'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Gastos
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleAddExpense}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Gasto
                    </button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <input
                    type="date"
                    placeholder="Fecha desde"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  <input
                    type="date"
                    placeholder="Fecha hasta"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Contenido según vista seleccionada */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Cargando datos...</p>
                  </div>
                ) : (
                  <>
                    {/* Vista de resumen */}
                    {cashFlowView === 'summary' && (
                      <div className="space-y-6">
                        <div className="text-center py-8">
                          <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Vista de Resumen</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Selecciona "Ingresos" o "Gastos" para ver los detalles
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Vista de ingresos */}
                    {cashFlowView === 'income' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Ingresos ({filteredPayments.length})
                        </h3>
                        {filteredPayments.length === 0 ? (
                          <div className="text-center py-8">
                            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ingresos</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              No se encontraron ingresos con los filtros aplicados
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cliente
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Concepto
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Monto
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Método
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPayments.map((payment) => (
                                  <tr key={payment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatDate(payment.paymentDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {payment.clientName || payment.clientId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      Pago de servicios - {payment.month}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                      {formatCurrency(payment.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {payment.paymentMethod || 'Efectivo'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vista de gastos */}
                    {cashFlowView === 'expenses' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Gastos ({filteredExpenses.length})
                        </h3>
                        {filteredExpenses.length === 0 ? (
                          <div className="text-center py-8">
                            <TrendingDown className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay gastos registrados</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Comienza registrando el primer gasto con el botón "Registrar Gasto"
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Concepto
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Servicio
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Proveedor
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Monto
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Método
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredExpenses.map((expense) => (
                                  <tr key={expense.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {formatDate(expense.expenseDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">{expense.concept}</div>
                                      {expense.description && (
                                        <div className="text-sm text-gray-500">{expense.description}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {getServiceTypeLabel(expense.serviceType)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {expense.supplier || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                      {formatCurrency(expense.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {getPaymentMethodName(expense.paymentMethod)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                                        {getStatusLabel(expense.status)}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Registro de Gastos */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Registrar Nuevo Gasto
                </h3>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitExpense(); }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monto */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">S/</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={expenseFormData.amount}
                        onChange={(e) => handleExpenseFormChange('amount', e.target.value)}
                        className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha del Gasto *
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseFormData.expenseDate}
                      onChange={(e) => handleExpenseFormChange('expenseDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Concepto */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Concepto *
                    </label>
                    <input
                      type="text"
                      required
                      value={expenseFormData.concept}
                      onChange={(e) => handleExpenseFormChange('concept', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Descripción breve del gasto"
                    />
                  </div>

                  {/* Tipo de Servicio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Servicio *
                    </label>
                    <select
                      value={expenseFormData.serviceType}
                      onChange={(e) => handleExpenseFormChange('serviceType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {Object.entries(ServiceTypes).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Método de Pago */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pago *
                    </label>
                    <select
                      value={expenseFormData.paymentMethod}
                      onChange={(e) => handleExpenseFormChange('paymentMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {paymentMethods.length === 0 ? (
                        <option value="">No hay métodos de pago disponibles</option>
                      ) : (
                        paymentMethods.map((method) => (
                          <option key={method.id} value={method.id}>{method.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Proveedor */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor
                    </label>
                    <input
                      type="text"
                      value={expenseFormData.supplier}
                      onChange={(e) => handleExpenseFormChange('supplier', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nombre del proveedor"
                    />
                  </div>

                  {/* Número de Recibo */}
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      N° de Recibo/Factura
                    </label>
                    <input
                      type="text"
                      value={expenseFormData.receiptNumber}
                      onChange={(e) => handleExpenseFormChange('receiptNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="000-001-1234"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción Adicional
                    </label>
                    <textarea
                      rows={3}
                      value={expenseFormData.description}
                      onChange={(e) => handleExpenseFormChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      placeholder="Detalles adicionales del gasto..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Registrar Gasto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashBoxManagement;