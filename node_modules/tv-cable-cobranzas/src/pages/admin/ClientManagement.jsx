import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClientStore } from '../../stores/clientStore';
import { useClientExtendedStore } from '../../stores/clientExtendedStore';
import { useMonthlyDebtStore } from '../../stores/monthlyDebtStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuthStore } from '../../stores/authStore';
import { Users, Plus, Search, Filter, Download, Upload, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Calendar, Clock, Pause, XCircle, AlertTriangle, CheckCircle, History, Import, DollarSign, FileText, MessageCircle, MoreVertical, RefreshCw } from 'lucide-react';
import { calculateServicePrice, getPriceMatrix, getServiceInfo, formatPrice } from '../../services/basePricingService';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NeighborhoodFilter from '../../components/common/NeighborhoodFilter';
import ClientHistory from '../../components/common/ClientHistory';
import ClientExtendedDetails from '../../components/common/ClientExtendedDetails';
import { getStatusLabel, getStatusColor, getServiceTypeLabel, getServiceTypeColor } from '../../services/mock/schemas/client';
import { getTarifaLabel, getTarifaColor } from '../../services/mock/schemas/clientExtended';
import { exportClientsToExcel } from '../../utils/excelExport';

// Verificar que las funciones estén disponibles
console.log('🔍 Funciones de estado importadas:', { getStatusLabel, getStatusColor });

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

const ClientManagement = () => {
  const navigate = useNavigate();
  const { 
    clients, 
    pagination,
    filters,
    fetchClients,
    setFilters,
    setPage,
    deleteClient,
    changeClientStatus,
    getClientsByStatus,
    getAvailableNeighborhoods,
    createClient,
    isLoading
  } = useClientStore();
  
  const { getExtendedData, getClientEffectiveCost, loadFromLocalStorage } = useClientExtendedStore();
  const { getClientSummary } = useMonthlyDebtStore();
  const { success, error: showError } = useNotificationStore();
  const { isAdminOrSubAdmin } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedClientStatus, setSelectedClientStatus] = useState('');
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState([]);
  
  // Estados para modal de cambio de estado
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  
  // Estados para modal de historial
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null);
  
  // Estados para modal de detalles extendidos
  const [showExtendedModal, setShowExtendedModal] = useState(false);
  const [selectedClientForExtended, setSelectedClientForExtended] = useState(null);

  // Estados para modal de nuevo cliente
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
    fullName: '',
    dni: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    servicePlan: 'basic',
    serviceType: 'internet',
    services: ['internet'],
    preferredPaymentDay: 15,
    status: 'active',
    installationDate: new Date().toISOString().split('T')[0]
  });

  // Estados para modal de editar cliente
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editClientFormData, setEditClientFormData] = useState({
    fullName: '',
    dni: '',
    phone: '',
    email: '',
    address: '',
    neighborhood: '',
    servicePlan: 'basic',
    serviceType: 'internet',
    services: ['internet'],
    preferredPaymentDay: 15,
    status: 'active',
    installationDate: new Date().toISOString().split('T')[0]
  });

  // Debug: verificar que las funciones del store estén disponibles
  console.log('🔍 Funciones del store disponibles:', {
    changeClientStatus: typeof changeClientStatus,
    getClientsByStatus: typeof getClientsByStatus,
    clientsLength: clients.length
  });
  
  useEffect(() => {
    fetchClients();
    loadFromLocalStorage(); // Cargar datos extendidos
  }, []);

  // Click outside handler for dropdown menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close all dropdown menus when clicking outside
      const openMenus = document.querySelectorAll('[id^="menu-"]:not(.hidden)');
      openMenus.forEach(menu => {
        const button = menu.previousElementSibling;
        if (!menu.contains(event.target) && !button.contains(event.target)) {
          menu.classList.add('hidden');
        }
      });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length === 0 || value.length >= 3) {
      setFilters({ search: value });
    }
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setSelectedStatus(value);
    setFilters({ status: value });
  };

  const handlePlanChange = (e) => {
    const value = e.target.value;
    setSelectedPlan(value);
    setFilters({ plan: value });
  };

  const handleClientStatusChange = (e) => {
    const value = e.target.value;
    setSelectedClientStatus(value);
    setFilters({ clientStatus: value });
  };

  const handleNeighborhoodFilterChange = (neighborhoods) => {
    setSelectedNeighborhoods(neighborhoods);
    setFilters({ neighborhoods });
  };

  const handleChangeStatus = (client) => {
    setSelectedClient(client);
    setNewStatus(client.status);
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleShowHistory = (client) => {
    setSelectedClientForHistory(client);
    setShowHistoryModal(true);
  };

  const handleShowExtendedDetails = (client) => {
    setSelectedClientForExtended(client);
    setShowExtendedModal(true);
  };

  const handleAddClient = () => {
    setClientFormData({
      fullName: '',
      dni: '',
      phone: '+51',
      email: '',
      address: '',
      neighborhood: '',
      servicePlan: 'basic',
      serviceType: 'internet',
      services: ['internet'],
      preferredPaymentDay: 15,
      status: 'active',
      installationDate: new Date().toISOString().split('T')[0]
    });
    setShowAddClientModal(true);
  };

  const handleClientFormChange = (field, value) => {
    setClientFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si cambia serviceType, actualizar services array
    if (field === 'serviceType') {
      let services = [];
      if (value === 'duo') {
        services = ['internet', 'cable'];
      } else {
        services = [value];
      }
      
      setClientFormData(prev => ({
        ...prev,
        services: services
      }));
    }
  };

  const handleSubmitNewClient = async (e) => {
    e.preventDefault();

    // Validar que se haya seleccionado un servicio
    if (!clientFormData.serviceType) {
      showError('Debe seleccionar un tipo de servicio');
      return;
    }

    if (!clientFormData.servicePlan) {
      showError('Debe seleccionar un plan de servicio');
      return;
    }

    try {
      // Crear cliente con servicio asignado
      const newClient = await createClient(clientFormData);
      
      // Crear primer pago pendiente automáticamente usando precios configurados
      const amount = calculateServicePrice(clientFormData.serviceType, clientFormData.servicePlan);
      const serviceLabel = getServiceLabel(clientFormData.serviceType);
      const planLabel = clientFormData.servicePlan.charAt(0).toUpperCase() + clientFormData.servicePlan.slice(1);
      
      // Calcular fecha de vencimiento basada en día preferido de pago
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), clientFormData.preferredPaymentDay);
      
      // Si el día ya pasó este mes, programar para el próximo mes
      if (dueDate < now) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const firstPayment = {
        clientId: newClient.id,
        amount: amount,
        description: `Primer pago - ${planLabel} (${serviceLabel})`,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending',
        serviceType: clientFormData.serviceType,
        servicePlan: clientFormData.servicePlan
      };

      // Crear el pago usando el store de pagos si está disponible
      try {
        const { usePaymentStore } = await import('../../stores/paymentStore');
        const paymentStore = usePaymentStore.getState();
        await paymentStore.createPayment(firstPayment);
      } catch (paymentError) {
        console.warn('No se pudo crear el primer pago automáticamente:', paymentError);
      }

      success(`Cliente "${clientFormData.fullName}" creado exitosamente con servicio ${serviceLabel} - Plan ${planLabel}`);
      setShowAddClientModal(false);
      fetchClients(); // Recargar la lista
    } catch (error) {
      showError('Error al crear el cliente: ' + (error.message || 'Error desconocido'));
    }
  };

  // Función auxiliar para obtener etiqueta de servicio
  const getServiceLabel = (serviceType) => {
    const labels = {
      internet: 'Internet',
      cable: 'Cable/TV',
      duo: 'Dúo'
    };
    return labels[serviceType] || serviceType;
  };

  // Funciones para editar cliente
  const handleEditClient = (client) => {
    setEditingClient(client);
    setEditClientFormData({
      fullName: client.fullName || '',
      dni: client.dni || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      neighborhood: client.neighborhood || '',
      servicePlan: client.servicePlan || 'basic',
      serviceType: client.serviceType || 'internet',
      services: client.services || ['internet'],
      preferredPaymentDay: client.preferredPaymentDay || 15,
      status: client.status || 'active',
      installationDate: client.installationDate ? client.installationDate.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowEditClientModal(true);
  };

  const handleEditClientFormChange = (field, value) => {
    setEditClientFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si cambia serviceType, actualizar services array
    if (field === 'serviceType') {
      let services = [];
      if (value === 'duo') {
        services = ['internet', 'cable'];
      } else {
        services = [value];
      }
      
      setEditClientFormData(prev => ({
        ...prev,
        services: services
      }));
    }
  };

  const handleSubmitEditClient = async (e) => {
    e.preventDefault();

    // Validar que se haya seleccionado un servicio
    if (!editClientFormData.serviceType) {
      showError('Debe seleccionar un tipo de servicio');
      return;
    }

    if (!editClientFormData.servicePlan) {
      showError('Debe seleccionar un plan de servicio');
      return;
    }

    try {
      await updateClient(editingClient.id, editClientFormData);
      success(`Cliente "${editClientFormData.fullName}" actualizado exitosamente`);
      setShowEditClientModal(false);
      setEditingClient(null);
      fetchClients(); // Recargar la lista
    } catch (error) {
      showError('Error al actualizar el cliente: ' + (error.message || 'Error desconocido'));
    }
  };

  const confirmStatusChange = async () => {
    if (!selectedClient || !newStatus) return;

    try {
      const user = JSON.parse(localStorage.getItem('tv-cable:auth'))?.user;
      await changeClientStatus(selectedClient.id, newStatus, statusReason, user?.id);
      
      success(`Estado del cliente ${selectedClient.fullName} cambiado a ${getStatusLabel(newStatus)}`);
      setShowStatusModal(false);
      setSelectedClient(null);
      setNewStatus('');
      setStatusReason('');
    } catch (error) {
      showError('Error al cambiar estado del cliente');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: <CheckCircle className="h-4 w-4 text-green-600" />,
      terminated: <XCircle className="h-4 w-4 text-gray-600" />,
      debt: <AlertTriangle className="h-4 w-4 text-red-600" />,
      paused: <Pause className="h-4 w-4 text-yellow-600" />,
      suspended: <Clock className="h-4 w-4 text-orange-600" />
    };
    return icons[status] || null;
  };

  const getPlanInfo = (plan) => {
    const plans = {
      basic: { name: 'Básico', price: 80 },
      standard: { name: 'Estándar', price: 120 },
      premium: { name: 'Premium', price: 160 }
    };
    return plans[plan] || plans.basic;
  };

  // Función para obtener precio según plan y tipo de servicio
  const getServicePrice = (plan, serviceType) => {
    const amount = calculateServicePrice(serviceType, plan);
    return formatPrice(amount);
  };

  // Estadísticas por estado con fallback
  const statusStats = {
    active: getClientsByStatus ? getClientsByStatus('active').length : clients.filter(c => (c.status || 'active') === 'active').length,
    terminated: getClientsByStatus ? getClientsByStatus('terminated').length : clients.filter(c => c.status === 'terminated').length,
    debt: getClientsByStatus ? getClientsByStatus('debt').length : clients.filter(c => c.status === 'debt').length,
    paused: getClientsByStatus ? getClientsByStatus('paused').length : clients.filter(c => c.status === 'paused').length,
    suspended: getClientsByStatus ? getClientsByStatus('suspended').length : clients.filter(c => c.status === 'suspended').length
  };

  console.log('📊 Estadísticas calculadas:', statusStats);

  const handleDelete = async (clientId, clientName) => {
    if (window.confirm(`¿Está seguro de eliminar al cliente ${clientName}?`)) {
      try {
        await deleteClient(clientId);
        success('Cliente eliminado correctamente');
      } catch (error) {
        showError('Error al eliminar el cliente');
      }
    }
  };

  const getPlanLabel = (plan) => {
    const labels = {
      basic: 'Básico',
      standard: 'Estándar',
      premium: 'Premium'
    };
    return labels[plan] || plan;
  };

  const getPlanColor = (plan) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800'
    };
    return colors[plan] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Activo
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactivo
      </span>
    );
  };

  // Manejar exportación a Excel con datos completos
  const handleExport = () => {
    try {
      // Enriquecer datos de clientes con información extendida
      const enrichedClients = clients.map(client => {
        const extendedData = getExtendedData(client.id);
        const debtSummary = getClientSummary(client.id);
        const effectiveCost = getClientEffectiveCost(client.id, client);
        
        return {
          ...client,
          // Datos extendidos
          apellidos: extendedData?.apellidos || '',
          nombres: extendedData?.nombres || '',
          costoMensual: effectiveCost,
          costoInstalacion: extendedData?.costoInstalacion || 0,
          referencia: extendedData?.referencia || '',
          tipoTarifa: extendedData?.tipoTarifa || 'standard',
          
          // Información de deudas
          mesesAdeudados: debtSummary.monthsOwed || 0,
          deudaTotal: debtSummary.balance || 0,
          ultimoPago: debtSummary.lastPayment ? 
            new Date(debtSummary.lastPayment).toLocaleDateString('es-PE') : 
            'Sin pagos',
          deudaMasAntigua: debtSummary.oldestDebt || '',
        };
      });

      exportClientsToExcel(enrichedClients);
      success('Datos exportados correctamente');
    } catch (error) {
      showError('Error al exportar: ' + error.message);
    }
  };

  // Obtener información extendida de un cliente
  const getClientExtendedInfo = (client) => {
    const extendedData = getExtendedData(client.id);
    const debtSummary = getClientSummary(client.id);
    const effectiveCost = getClientEffectiveCost(client.id, client);
    
    return {
      extendedData,
      debtSummary,
      effectiveCost
    };
  };


  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-4 mb-4 sm:flex sm:items-center sm:justify-between sm:space-y-0 sm:mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Gestión de Clientes</h1>
          <p className="text-sm text-gray-600 sm:text-base">Administrar información y estados de clientes</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:space-x-3 sm:gap-0">
          <Link
            to="/admin/import-clients"
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 sm:px-4 sm:text-sm"
          >
            <Import className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Importar Excel</span>
            <span className="sm:hidden">Importar</span>
          </Link>
          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 sm:px-4 sm:text-sm"
          >
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Exportar</span>
          </button>
          <button
            onClick={handleAddClient}
            className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-xs font-medium hover:bg-blue-600 sm:px-4 sm:text-sm"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Cliente</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Estadísticas de Estados */}
      <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3 md:grid-cols-5 sm:gap-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 sm:text-sm">Clientes Activos</p>
              <p className="text-lg font-bold text-green-600 sm:text-2xl">{statusStats.active}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600 opacity-20 sm:h-8 sm:w-8" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 sm:text-sm">En Pausa</p>
              <p className="text-lg font-bold sm:text-2xl text-yellow-600">{statusStats.paused}</p>
            </div>
            <Pause className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 sm:text-sm">Con Deuda</p>
              <p className="text-lg font-bold sm:text-2xl text-red-600">{statusStats.debt}</p>
            </div>
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 sm:text-sm">Suspendidos</p>
              <p className="text-lg font-bold sm:text-2xl text-orange-600">{statusStats.suspended}</p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 sm:text-sm">De Baja</p>
              <p className="text-lg font-bold sm:text-2xl text-gray-600">{statusStats.terminated}</p>
            </div>
            <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow mb-4 sm:mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI, teléfono..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-base sm:py-2 sm:text-sm"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex space-x-2">
              <select 
                value={selectedClientStatus}
                onChange={handleClientStatusChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="paused">En Pausa</option>
                <option value="debt">Con Deuda</option>
                <option value="suspended">Suspendidos</option>
                <option value="terminated">De Baja</option>
              </select>
              
              <select 
                value={selectedPlan}
                onChange={handlePlanChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Todos los planes</option>
                <option value="basic">Básico</option>
                <option value="standard">Estándar</option>
                <option value="premium">Premium</option>
              </select>

              <NeighborhoodFilter
                onFilterChange={handleNeighborhoodFilterChange}
                selectedNeighborhoods={selectedNeighborhoods}
                availableNeighborhoods={getAvailableNeighborhoods()}
              />
              
              <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-white rounded-lg shadow">
        {isLoading() ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="large" text="Cargando clientes..." />
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay clientes"
            description="No se encontraron clientes con los filtros aplicados."
            action={
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('');
                  setSelectedPlan('');
                  setFilters({ search: '', status: '', plan: '' });
                }}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Limpiar Filtros
              </button>
            }
          />
        ) : (
          <div className="bg-white rounded-lg shadow">
            {/* Tabla de clientes optimizada */}
            <div className="overflow-x-auto table-container">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      DNI
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Contacto
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan/Servicio
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                      Deuda
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => {
                    console.log('🔍 Renderizando cliente:', client.fullName, 'Estado:', client.status);
                    const { extendedData, debtSummary, effectiveCost } = getClientExtendedInfo(client);
                    
                    return (
                    <tr key={client.id} className="hover:bg-gray-50">
                      {/* Cliente */}
                      <td className="px-3 py-3">
                        <div className="max-w-48">
                          <div className="text-sm font-medium text-gray-900 truncate" title={client.fullName}>
                            {client.fullName}
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={client.email || 'Sin email'}>
                            {client.email || 'Sin email'}
                          </div>
                          {/* Mostrar referencia en móvil */}
                          <div className="md:hidden text-xs text-gray-400 mt-1 truncate">
                            {extendedData?.referencia || 'Sin ref.'}
                          </div>
                        </div>
                      </td>
                      {/* DNI - Oculto en móvil */}
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 hidden sm:table-cell">
                        {client.dni}
                      </td>
                      {/* Contacto - Oculto en móvil y tablet */}
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                        {client.phone ? (
                          <button
                            onClick={() => openWhatsApp(client.phone)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-800 transition-colors"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span className="text-xs">{client.phone}</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Sin tel.</span>
                        )}
                      </td>
                      {/* Plan/Servicio - Consolidado */}
                      <td className="px-2 py-3">
                        <div className="space-y-1">
                          {/* Plan */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPlanColor(client.servicePlan)}`}>
                            {getPlanLabel(client.servicePlan)}
                          </span>
                          {/* Servicio */}
                          <div className="flex items-center space-x-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getServiceTypeColor(client.serviceType)}`}>
                              {getServiceTypeLabel(client.serviceType)}
                            </span>
                            {extendedData && extendedData.tipoTarifa !== 'standard' && (
                              <span className="text-xs text-gray-600">
                                S/. {effectiveCost}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Deuda - Solo en pantallas XL */}
                      <td className="px-2 py-3 whitespace-nowrap hidden xl:table-cell">
                        {debtSummary ? (
                          debtSummary.monthsOwed > 0 ? (
                            <div className="text-center">
                              <div className="flex items-center justify-center">
                                <DollarSign className="h-3 w-3 text-red-500 mr-1" />
                                <span className="text-red-600 font-semibold text-xs">
                                  S/. {debtSummary.balance?.toFixed(0) || '0'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {debtSummary.monthsOwed}m
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                              <span className="text-green-600 text-xs">Al día</span>
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      {/* Estado */}
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {getStatusIcon(client.status || 'active')}
                          <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status || 'active')}`}>
                            {getStatusLabel(client.status || 'active')}
                          </span>
                        </div>
                        {client.status === 'paused' && client.pauseStartDate && (
                          <div className="text-xs text-gray-500 mt-1 text-center">
                            {new Date(client.pauseStartDate).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}
                          </div>
                        )}
                      </td>
                      {/* Acciones */}
                      <td className="px-2 py-3 whitespace-nowrap text-center w-24">
                        <div className="flex justify-center space-x-1">
                          {/* Acción principal: Ver detalles */}
                          <button
                            onClick={() => handleShowExtendedDetails(client)}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                            title="Ver detalles completos"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          {/* Menú dropdown */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => {
                                const actionMenu = document.getElementById(`menu-${client.id}`);
                                actionMenu?.classList.toggle('hidden');
                              }}
                              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                              title="Más acciones"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            <div
                              id={`menu-${client.id}`}
                              className="hidden absolute right-0 z-10 mt-1 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleShowHistory(client);
                                    document.getElementById(`menu-${client.id}`)?.classList.add('hidden');
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <History className="h-4 w-4 mr-2" />
                                  Ver historial
                                </button>
                                <button
                                  onClick={() => {
                                    handleChangeStatus(client);
                                    document.getElementById(`menu-${client.id}`)?.classList.add('hidden');
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Cambiar estado
                                </button>
                                {isAdminOrSubAdmin() && (
                                  <button
                                    onClick={() => {
                                      handleEditClient(client);
                                      document.getElementById(`menu-${client.id}`)?.classList.add('hidden');
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    handleDelete(client.id, client.fullName);
                                    document.getElementById(`menu-${client.id}`)?.classList.add('hidden');
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} clientes
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${
                          pageNum === pagination.page
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de cambio de estado */}
      {showStatusModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cambiar Estado de Cliente
                </h3>
                <button 
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Información del cliente */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">{selectedClient.fullName}</h4>
                <div className="text-sm space-y-1">
                  <p className="text-gray-600">DNI: {selectedClient.dni}</p>
                  <p className="text-gray-600">Plan: {getPlanInfo(selectedClient.servicePlan).name}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-gray-600 mr-2">Estado actual:</span>
                    {getStatusIcon(selectedClient.status || 'active')}
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClient.status || 'active')}`}>
                      {getStatusLabel(selectedClient.status || 'active')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selector de nuevo estado */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevo estado
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="active">Activo</option>
                    <option value="paused">En Pausa</option>
                    <option value="debt">Con Deuda</option>
                    <option value="suspended">Suspendido</option>
                    <option value="terminated">De Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón del cambio
                  </label>
                  <textarea 
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Describir la razón del cambio de estado..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    rows="3"
                  />
                </div>

                {/* Advertencias específicas */}
                {newStatus === 'paused' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <Pause className="h-4 w-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        <strong>Advertencia:</strong> El cliente será dado de baja automáticamente después de 30 días en pausa.
                      </p>
                    </div>
                  </div>
                )}
                
                {newStatus === 'terminated' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">
                        <strong>Importante:</strong> Las deudas del cliente se preservarán y su historial será archivado.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={newStatus === (selectedClient.status || 'active')}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cambiar Estado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de historial del cliente */}
      {showHistoryModal && selectedClientForHistory && (
        <ClientHistory 
          client={selectedClientForHistory}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedClientForHistory(null);
          }}
        />
      )}

      {/* Modal de detalles extendidos del Excel */}
      {showExtendedModal && selectedClientForExtended && (
        <ClientExtendedDetails
          client={selectedClientForExtended}
          extendedData={getExtendedData(selectedClientForExtended.id)}
          debtSummary={getClientSummary(selectedClientForExtended.id)}
          onClose={() => {
            setShowExtendedModal(false);
            setSelectedClientForExtended(null);
          }}
        />
      )}

      {/* Modal de Agregar Nuevo Cliente */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Agregar Nuevo Cliente
                </h3>
                <button 
                  onClick={() => setShowAddClientModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitNewClient}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Nombre Completo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientFormData.fullName}
                      onChange={(e) => handleClientFormChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Ej: Juan Carlos Pérez García"
                    />
                  </div>

                  {/* DNI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="8"
                      pattern="\d{8}"
                      value={clientFormData.dni}
                      onChange={(e) => handleClientFormChange('dni', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="12345678"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientFormData.phone}
                      onChange={(e) => handleClientFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="+51987654321"
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={clientFormData.email}
                      onChange={(e) => handleClientFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="cliente@email.com"
                    />
                  </div>

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientFormData.address}
                      onChange={(e) => handleClientFormChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Av. Principal 123, Mz A Lt 5"
                    />
                  </div>

                  {/* Barrio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barrio *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientFormData.neighborhood}
                      onChange={(e) => handleClientFormChange('neighborhood', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Centro, Villa María, etc."
                    />
                  </div>

                  {/* Fecha de Instalación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Instalación *
                    </label>
                    <input
                      type="date"
                      required
                      value={clientFormData.installationDate}
                      onChange={(e) => handleClientFormChange('installationDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Selección de Servicio y Plan - Nueva interfaz visual */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de Servicio *
                    </label>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <button
                        type="button"
                        onClick={() => handleClientFormChange('serviceType', 'internet')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          clientFormData.serviceType === 'internet'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">📡</div>
                          <div className="font-semibold">Internet</div>
                          <div className="text-xs text-gray-500 mt-1">Solo Internet</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClientFormChange('serviceType', 'cable')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          clientFormData.serviceType === 'cable'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">📺</div>
                          <div className="font-semibold">Cable/TV</div>
                          <div className="text-xs text-gray-500 mt-1">Solo Cable</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClientFormChange('serviceType', 'duo')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          clientFormData.serviceType === 'duo'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">📡📺</div>
                          <div className="font-semibold">Dúo</div>
                          <div className="text-xs text-gray-500 mt-1">Internet + Cable</div>
                        </div>
                      </button>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Plan de Servicio *
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => handleClientFormChange('servicePlan', 'basic')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          clientFormData.servicePlan === 'basic'
                            ? 'border-gray-500 bg-gray-50 text-gray-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg">Básico</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {getServicePrice('basic', clientFormData.serviceType)}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClientFormChange('servicePlan', 'standard')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          clientFormData.servicePlan === 'standard'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg">Estándar</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {getServicePrice('standard', clientFormData.serviceType)}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClientFormChange('servicePlan', 'premium')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          clientFormData.servicePlan === 'premium'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg">Premium</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {getServicePrice('premium', clientFormData.serviceType)}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Resumen del servicio seleccionado */}
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Resumen del Servicio</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Servicio: </span>
                          <span className="text-blue-600">{getServiceLabel(clientFormData.serviceType)}</span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Plan: </span>
                          <span className="text-blue-600">
                            {clientFormData.servicePlan.charAt(0).toUpperCase() + clientFormData.servicePlan.slice(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Monto mensual: </span>
                          <span className="text-blue-600 font-semibold">
                            {getServicePrice(clientFormData.servicePlan, clientFormData.serviceType)}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Servicios incluidos: </span>
                          <span className="text-blue-600">
                            {clientFormData.services.map(service => getServiceLabel(service)).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Día de Pago Preferido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día de Pago Preferido *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      value={clientFormData.preferredPaymentDay}
                      onChange={(e) => handleClientFormChange('preferredPaymentDay', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado Inicial *
                    </label>
                    <select
                      required
                      value={clientFormData.status}
                      onChange={(e) => handleClientFormChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="active">Activo</option>
                      <option value="debt">Con Deuda</option>
                      <option value="paused">En Pausa</option>
                      <option value="suspended">Suspendido</option>
                    </select>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddClientModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    Crear Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Cliente */}
      {showEditClientModal && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Editar Cliente
                </h3>
                <button 
                  onClick={() => setShowEditClientModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitEditClient}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Nombre Completo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={editClientFormData.fullName}
                      onChange={(e) => handleEditClientFormChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Ej: Juan Carlos Pérez García"
                    />
                  </div>

                  {/* DNI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength="8"
                      pattern="\d{8}"
                      value={editClientFormData.dni}
                      onChange={(e) => handleEditClientFormChange('dni', e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="12345678"
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editClientFormData.phone}
                      onChange={(e) => handleEditClientFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="+51987654321"
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editClientFormData.email}
                      onChange={(e) => handleEditClientFormChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="cliente@email.com"
                    />
                  </div>

                  {/* Dirección */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      required
                      value={editClientFormData.address}
                      onChange={(e) => handleEditClientFormChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Av. Principal 123, Mz A Lt 5"
                    />
                  </div>

                  {/* Barrio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barrio *
                    </label>
                    <input
                      type="text"
                      required
                      value={editClientFormData.neighborhood}
                      onChange={(e) => handleEditClientFormChange('neighborhood', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Centro, Villa María, etc."
                    />
                  </div>

                  {/* Fecha de Instalación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Instalación *
                    </label>
                    <input
                      type="date"
                      required
                      value={editClientFormData.installationDate}
                      onChange={(e) => handleEditClientFormChange('installationDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Selección de Servicio y Plan - Nueva interfaz visual */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de Servicio *
                    </label>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <button
                        type="button"
                        onClick={() => handleEditClientFormChange('serviceType', 'internet')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          editClientFormData.serviceType === 'internet'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">📡</div>
                          <div className="font-semibold">Internet</div>
                          <div className="text-xs text-gray-500 mt-1">Solo Internet</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClientFormChange('serviceType', 'cable')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          editClientFormData.serviceType === 'cable'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">📺</div>
                          <div className="font-semibold">Cable/TV</div>
                          <div className="text-xs text-gray-500 mt-1">Solo Cable</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClientFormChange('serviceType', 'duo')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          editClientFormData.serviceType === 'duo'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">📡📺</div>
                          <div className="font-semibold">Dúo</div>
                          <div className="text-xs text-gray-500 mt-1">Internet + Cable</div>
                        </div>
                      </button>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Plan de Servicio *
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => handleEditClientFormChange('servicePlan', 'basic')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          editClientFormData.servicePlan === 'basic'
                            ? 'border-gray-500 bg-gray-50 text-gray-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg">Básico</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {getServicePrice('basic', editClientFormData.serviceType)}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClientFormChange('servicePlan', 'standard')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          editClientFormData.servicePlan === 'standard'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg">Estándar</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {getServicePrice('standard', editClientFormData.serviceType)}
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClientFormChange('servicePlan', 'premium')}
                        className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                          editClientFormData.servicePlan === 'premium'
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-lg">Premium</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {getServicePrice('premium', editClientFormData.serviceType)}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Resumen del servicio seleccionado */}
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Resumen del Servicio</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Servicio: </span>
                          <span className="text-blue-600">{getServiceLabel(editClientFormData.serviceType)}</span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Plan: </span>
                          <span className="text-blue-600">
                            {editClientFormData.servicePlan.charAt(0).toUpperCase() + editClientFormData.servicePlan.slice(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Monto mensual: </span>
                          <span className="text-blue-600 font-semibold">
                            {getServicePrice(editClientFormData.servicePlan, editClientFormData.serviceType)}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Servicios incluidos: </span>
                          <span className="text-blue-600">
                            {editClientFormData.services.map(service => getServiceLabel(service)).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Día de Pago Preferido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Día de Pago Preferido *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="31"
                      value={editClientFormData.preferredPaymentDay}
                      onChange={(e) => handleEditClientFormChange('preferredPaymentDay', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <select
                      required
                      value={editClientFormData.status}
                      onChange={(e) => handleEditClientFormChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="active">Activo</option>
                      <option value="debt">Con Deuda</option>
                      <option value="paused">En Pausa</option>
                      <option value="suspended">Suspendido</option>
                      <option value="terminated">De Baja</option>
                    </select>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditClientModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    Guardar Cambios
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

export default ClientManagement;