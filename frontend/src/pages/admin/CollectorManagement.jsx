import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAlertStore } from '../../stores/alertStore';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Calendar,
  Activity,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Lock,
  Unlock,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PieChart,
  BarChart2,
  CalendarDays,
  Bell,
  Send,
  History
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
// MIGRADO A JSON SERVER - import eliminado

const CollectorManagement = () => {
  const { success, error: showError, info } = useNotificationStore();
  const { createCashBoxClosingAlert } = useAlertStore();
  const { user } = useAuthStore();
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('month'); // 'month' o 'range'
  const [selectedMonth, setSelectedMonth] = useState('');
  const [currentYear, setCurrentYear] = useState(2024);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [selectedCollectors, setSelectedCollectors] = useState([]);
  const [reminderMessage, setReminderMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    alias: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  useEffect(() => {
    loadCollectors();
  }, [selectedMonth, dateFrom, dateTo]);

  const loadCollectors = async () => {
    setLoading(true);
    try {
      const users = db.getCollection('users') || [];
      const collectorUsers = users.filter(user => user.role === 'collector');
      const clients = db.getCollection('clients') || [];
      
      // Agregar estadísticas para cada cobrador
      const collectorsWithStats = collectorUsers.map(collector => {
        const payments = db.getCollection('payments') || [];
        let collectorPayments = payments.filter(p => p.collectorId === collector.id);
        
        // Filtrar según el tipo de filtro activo
        if (filterType === 'month' && selectedMonth) {
          collectorPayments = collectorPayments.filter(p => p.month === selectedMonth);
        } else if (filterType === 'range' && (dateFrom || dateTo)) {
          collectorPayments = collectorPayments.filter(payment => {
            const paymentDate = payment.dueDate || payment.paymentDate;
            if (!paymentDate) return false;
            
            if (dateFrom && dateTo) {
              return paymentDate >= dateFrom && paymentDate <= dateTo;
            } else if (dateFrom) {
              return paymentDate >= dateFrom;
            } else if (dateTo) {
              return paymentDate <= dateTo;
            }
            return true;
          });
        }
        
        // Obtener clientes únicos asignados a este cobrador
        const assignedClients = new Set();
        const paidClients = new Set();
        const unpaidClients = new Set();
        
        collectorPayments.forEach(payment => {
          assignedClients.add(payment.clientId);
          if (payment.status === 'paid') {
            paidClients.add(payment.clientId);
          } else {
            unpaidClients.add(payment.clientId);
          }
        });
        
        const totalClients = assignedClients.size;
        const clientsPaid = paidClients.size;
        const clientsUnpaid = unpaidClients.size;
        
        return {
          ...collector,
          stats: {
            totalCollected: collectorPayments
              .filter(p => p.status === 'paid')
              .reduce((sum, p) => sum + p.amount, 0),
            paymentsCount: collectorPayments.filter(p => p.status === 'paid').length,
            pendingPayments: collectorPayments.filter(p => p.status === 'pending').length,
            overduePayments: collectorPayments.filter(p => p.status === 'overdue').length,
            totalClients,
            clientsPaid,
            clientsUnpaid,
            paidPercentage: totalClients > 0 
              ? Math.round((clientsPaid / totalClients) * 100)
              : 0,
            unpaidPercentage: totalClients > 0
              ? Math.round((clientsUnpaid / totalClients) * 100)
              : 0,
            collectionRate: collectorPayments.length > 0 
              ? Math.round((collectorPayments.filter(p => p.status === 'paid').length / collectorPayments.length) * 100)
              : 0
          }
        };
      });
      
      setCollectors(collectorsWithStats);
    } catch (error) {
      console.error('Error loading collectors:', error);
      showError('Error al cargar los cobradores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCollectors = collectors.filter(collector =>
    collector.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collector.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collector.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCollector = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      alias: '',
      phone: '',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEditCollector = (collector) => {
    setSelectedCollector(collector);
    setFormData({
      username: collector.username,
      email: collector.email,
      password: '',
      fullName: collector.fullName,
      alias: collector.alias || '',
      phone: collector.phone,
      startDate: collector.startDate || new Date().toISOString().split('T')[0],
      isActive: collector.isActive
    });
    setShowEditModal(true);
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    
    // Validar que el alias esté presente
    if (!formData.alias || formData.alias.trim().length === 0) {
      showError('El alias es obligatorio para cobradores');
      return;
    }
    
    try {
      const newCollector = {
        ...formData,
        id: `collector-${Date.now()}`,
        role: 'collector',
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.create('users', newCollector);
      success('Cobrador agregado exitosamente');
      setShowAddModal(false);
      loadCollectors();
    } catch (error) {
      showError('Error al agregar el cobrador');
    }
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    
    // Validar que el alias esté presente
    if (!formData.alias || formData.alias.trim().length === 0) {
      showError('El alias es obligatorio para cobradores');
      return;
    }
    
    try {
      const updates = { ...formData };
      if (!updates.password) {
        delete updates.password;
      }
      
      db.update('users', selectedCollector.id, updates);
      success('Cobrador actualizado exitosamente');
      setShowEditModal(false);
      loadCollectors();
    } catch (error) {
      showError('Error al actualizar el cobrador');
    }
  };

  const handleToggleStatus = async (collector) => {
    try {
      db.update('users', collector.id, { isActive: !collector.isActive });
      success(`Cobrador ${!collector.isActive ? 'activado' : 'desactivado'} exitosamente`);
      loadCollectors();
    } catch (error) {
      showError('Error al cambiar el estado del cobrador');
    }
  };

  const handleDeleteCollector = async (collector) => {
    if (window.confirm(`¿Está seguro de eliminar al cobrador ${collector.fullName}?`)) {
      try {
        db.delete('users', collector.id);
        success('Cobrador eliminado exitosamente');
        loadCollectors();
      } catch (error) {
        showError('Error al eliminar el cobrador');
      }
    }
  };

  const handleViewHistory = (collector) => {
    setSelectedCollector(collector);
    setShowHistoryModal(true);
  };

  // Obtener historial completo de cobros del cobrador
  const getCollectorHistory = (collectorId) => {
    const payments = db.getCollection('payments') || [];
    const clients = db.getCollection('clients') || [];

    const collectorPayments = payments.filter(p => p.collectorId === collectorId);

    // Enriquecer pagos con información del cliente
    const enrichedPayments = collectorPayments.map(payment => {
      const client = clients.find(c => c.id === payment.clientId);
      return {
        ...payment,
        clientName: client ? client.fullName : 'Cliente no encontrado',
        clientPhone: client ? client.phone : '',
        clientNeighborhood: client ? client.neighborhood : ''
      };
    });

    // Ordenar por fecha de pago (más recientes primero)
    return enrichedPayments.sort((a, b) => {
      const dateA = new Date(a.paymentDate || a.dueDate);
      const dateB = new Date(b.paymentDate || b.dueDate);
      return dateB - dateA;
    });
  };

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

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const clearMonthFilter = () => {
    setSelectedMonth('');
  };

  const clearAllFilters = () => {
    setSelectedMonth('');
    setDateFrom('');
    setDateTo('');
  };

  const handleSendReminder = (collectorIds = null) => {
    // Si no se especifican cobradores, usar todos los activos
    const targetCollectors = collectorIds || collectors
      .filter(c => c.isActive)
      .map(c => c.id);
    
    setSelectedCollectors(targetCollectors);
    setReminderMessage('Recordatorio: Es hora de cerrar tu caja semanal. Por favor, procede a cerrar tu caja y envía el reporte correspondiente.');
    setShowReminderModal(true);
  };

  // Función helper para abrir WhatsApp
  const openWhatsApp = (phone, message) => {
    if (!phone) return;

    // Limpiar el número: quitar espacios, guiones y caracteres especiales
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');

    // Si no empieza con código de país, agregar 51 (Perú)
    const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);

    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

    // Abrir en nueva ventana
    window.open(whatsappUrl, '_blank');
  };

  const handleConfirmSendReminder = () => {
    try {
      // Crear alerta en el sistema (funcionalidad original)
      createCashBoxClosingAlert(selectedCollectors, reminderMessage, user?.id);

      // Obtener cobradores seleccionados
      const selectedCollectorData = collectors.filter(c => selectedCollectors.includes(c.id));

      // Abrir WhatsApp para cada cobrador
      selectedCollectorData.forEach((collector, index) => {
        if (collector.phone) {
          // Agregar un pequeño delay entre ventanas para evitar bloqueo del navegador
          setTimeout(() => {
            openWhatsApp(collector.phone, reminderMessage);
          }, index * 500); // 500ms de delay entre cada ventana
        }
      });

      const collectorNames = selectedCollectors.length === collectors.length
        ? 'todos los cobradores'
        : `${selectedCollectors.length} cobrador${selectedCollectors.length > 1 ? 'es' : ''}`;

      success(`Recordatorio enviado a WhatsApp de ${collectorNames}`);
      setShowReminderModal(false);
      setSelectedCollectors([]);
      setReminderMessage('');
    } catch (error) {
      showError('Error al enviar recordatorio');
    }
  };

  const hasActiveFilter = () => {
    if (filterType === 'month') {
      return !!selectedMonth;
    }
    return dateFrom || dateTo;
  };

  // Funciones para el calendario
  const months = [
    { id: 1, name: 'Ene', fullName: 'Enero' },
    { id: 2, name: 'Feb', fullName: 'Febrero' },
    { id: 3, name: 'Mar', fullName: 'Marzo' },
    { id: 4, name: 'Abr', fullName: 'Abril' },
    { id: 5, name: 'May', fullName: 'Mayo' },
    { id: 6, name: 'Jun', fullName: 'Junio' },
    { id: 7, name: 'Jul', fullName: 'Julio' },
    { id: 8, name: 'Ago', fullName: 'Agosto' },
    { id: 9, name: 'Sep', fullName: 'Septiembre' },
    { id: 10, name: 'Oct', fullName: 'Octubre' },
    { id: 11, name: 'Nov', fullName: 'Noviembre' },
    { id: 12, name: 'Dic', fullName: 'Diciembre' }
  ];

  const handleMonthSelect = (monthId) => {
    const monthStr = `${currentYear}-${String(monthId).padStart(2, '0')}`;
    setSelectedMonth(monthStr);
    setShowMonthSelector(false);
  };

  const getSelectedMonthName = () => {
    if (!selectedMonth) return '';
    const [year, month] = selectedMonth.split('-');
    const monthObj = months.find(m => m.id === parseInt(month));
    return monthObj ? `${monthObj.fullName} ${year}` : '';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Cobradores</h1>
          <p className="text-gray-600">Administrar usuarios cobradores del sistema</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => handleSendReminder()}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
            title="Enviar recordatorio de cierre de caja a todos los cobradores"
          >
            <Bell className="h-4 w-4 mr-2" />
            Recordatorio de Caja
          </button>
          
          <button 
            onClick={handleAddCollector}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cobrador
          </button>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cobradores</p>
              <p className="text-2xl font-bold text-gray-900">{collectors.length}</p>
              <p className="text-xs text-gray-500">
                {collectors.filter(c => c.isActive).length} activos
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-purple-600">
                {collectors.reduce((sum, c) => sum + (c.stats?.totalClients || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">
                {hasActiveFilter() ? 'Período filtrado' : 'Total'}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes Pagados</p>
              <p className="text-2xl font-bold text-green-600">
                {collectors.reduce((sum, c) => sum + (c.stats?.clientsPaid || 0), 0)}
              </p>
              <p className="text-xs text-green-600">
                {collectors.reduce((sum, c) => sum + (c.stats?.totalClients || 0), 0) > 0
                  ? Math.round((collectors.reduce((sum, c) => sum + (c.stats?.clientsPaid || 0), 0) / 
                    collectors.reduce((sum, c) => sum + (c.stats?.totalClients || 0), 0)) * 100)
                  : 0}%
              </p>
            </div>
            <PieChart className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">No Pagados</p>
              <p className="text-2xl font-bold text-red-600">
                {collectors.reduce((sum, c) => sum + (c.stats?.clientsUnpaid || 0), 0)}
              </p>
              <p className="text-xs text-red-600">
                {collectors.reduce((sum, c) => sum + (c.stats?.totalClients || 0), 0) > 0
                  ? Math.round((collectors.reduce((sum, c) => sum + (c.stats?.clientsUnpaid || 0), 0) / 
                    collectors.reduce((sum, c) => sum + (c.stats?.totalClients || 0), 0)) * 100)
                  : 0}%
              </p>
            </div>
            <BarChart2 className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recaudado</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(collectors.reduce((sum, c) => sum + (c.stats?.totalCollected || 0), 0))}
              </p>
              <p className="text-xs text-gray-500">
                {hasActiveFilter() ? 'Período filtrado' : 'Total'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          {/* Búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o usuario..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Tabs para tipo de filtro */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-4">
              <button
                onClick={() => {
                  setFilterType('month');
                  clearDateFilters();
                }}
                className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                  filterType === 'month'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CalendarDays className="inline h-4 w-4 mr-2" />
                Por Mes
              </button>
              <button
                onClick={() => {
                  setFilterType('range');
                  clearMonthFilter();
                }}
                className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                  filterType === 'range'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="inline h-4 w-4 mr-2" />
                Por Rango
              </button>
            </nav>
          </div>

          {/* Contenido según el tab seleccionado */}
          {filterType === 'month' ? (
            /* Filtro por Mes */
            <div>
              <div className="relative">
                <button
                  onClick={() => setShowMonthSelector(!showMonthSelector)}
                  className="w-full md:w-auto flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 text-gray-400 mr-2" />
                    <span className={selectedMonth ? "text-gray-900" : "text-gray-500"}>
                      {selectedMonth ? getSelectedMonthName() : "Seleccionar mes"}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 ml-4 transform transition-transform ${showMonthSelector ? 'rotate-180' : ''}`} />
                </button>

                {/* Calendario desplegable */}
                {showMonthSelector && (
                  <div className="absolute z-10 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {/* Header del calendario */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                      <button
                        onClick={() => setCurrentYear(currentYear - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-semibold text-gray-900">{currentYear}</span>
                      <button
                        onClick={() => setCurrentYear(currentYear + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Grid de meses */}
                    <div className="grid grid-cols-3 gap-1 p-3">
                      {months.map((month) => {
                        const monthStr = `${currentYear}-${String(month.id).padStart(2, '0')}`;
                        const isSelected = selectedMonth === monthStr;
                        const currentMonth = new Date().getMonth() + 1;
                        const isCurrentMonth = month.id === currentMonth && currentYear === new Date().getFullYear();
                        
                        return (
                          <button
                            key={month.id}
                            onClick={() => handleMonthSelect(month.id)}
                            className={`
                              py-2 px-3 rounded-md text-sm font-medium transition-colors
                              ${isSelected 
                                ? 'bg-primary text-white' 
                                : isCurrentMonth
                                ? 'bg-blue-50 text-primary hover:bg-blue-100'
                                : 'text-gray-700 hover:bg-gray-100'
                              }
                            `}
                          >
                            {month.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Botón de limpiar */}
                    <div className="px-3 pb-3">
                      <button
                        onClick={() => {
                          setSelectedMonth('');
                          setShowMonthSelector(false);
                        }}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        Limpiar filtro
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Indicador de mes seleccionado */}
              {selectedMonth && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-blue-800">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>Filtrando por: <strong>{getSelectedMonthName()}</strong></span>
                    </div>
                    <button
                      onClick={clearMonthFilter}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <span className="mr-1">✕</span>
                      Limpiar filtro
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Filtro por Rango de Fechas */
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha Desde */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Desde</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      max={dateTo || undefined}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                
                {/* Fecha Hasta */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hasta</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom || undefined}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Indicador de rango seleccionado */}
              {(dateFrom || dateTo) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-blue-800">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>
                        Mostrando datos
                        {dateFrom && <span className="font-semibold"> desde {formatDate(dateFrom)}</span>}
                        {dateFrom && dateTo && <span> hasta</span>}
                        {dateTo && <span className="font-semibold"> {!dateFrom && 'hasta'} {formatDate(dateTo)}</span>}
                      </span>
                    </div>
                    <button
                      onClick={clearDateFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <span className="mr-1">✕</span>
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista de cobradores */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="large" text="Cargando cobradores..." />
          </div>
        ) : filteredCollectors.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No hay cobradores"
            description={searchTerm ? "No se encontraron cobradores con los criterios de búsqueda." : "No hay cobradores registrados en el sistema."}
            action={
              !searchTerm && (
                <button 
                  onClick={handleAddCollector}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Agregar Primer Cobrador
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cobrador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Recaudado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Efectividad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Acceso
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCollectors.map((collector) => (
                  <tr key={collector.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {collector.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{collector.username} {collector.alias && <span className="text-primary">• "{collector.alias}"</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex flex-col space-y-1">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {collector.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {collector.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(collector.stats?.totalCollected || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        {/* Gráfico de barras de pagados vs no pagados */}
                        <div className="flex items-center space-x-1">
                          <div className="flex h-6">
                            {collector.stats?.paidPercentage > 0 && (
                              <div 
                                className="bg-green-500 rounded-l-md flex items-center justify-center text-xs font-medium text-white px-1"
                                style={{ width: `${collector.stats.paidPercentage * 0.8}px` }}
                                title={`${collector.stats.paidPercentage}% pagaron`}
                              >
                                {collector.stats.paidPercentage}%
                              </div>
                            )}
                            {collector.stats?.unpaidPercentage > 0 && (
                              <div 
                                className="bg-red-500 rounded-r-md flex items-center justify-center text-xs font-medium text-white px-1"
                                style={{ width: `${collector.stats.unpaidPercentage * 0.8}px` }}
                                title={`${collector.stats.unpaidPercentage}% no pagaron`}
                              >
                                {collector.stats.unpaidPercentage}%
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Tasa: {collector.stats?.collectionRate || 0}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {collector.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {collector.lastLogin ? (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(collector.lastLogin).toLocaleDateString('es-PE')}
                        </div>
                      ) : (
                        'Nunca'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {collector.isActive && (
                          <button
                            onClick={() => handleSendReminder([collector.id])}
                            className="text-orange-600 hover:text-orange-900"
                            title="Enviar recordatorio de cierre de caja"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewHistory(collector)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver Historial de Cobros"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(collector)}
                          className={`${collector.isActive ? 'text-purple-600 hover:text-purple-900' : 'text-green-600 hover:text-green-900'}`}
                          title={collector.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {collector.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEditCollector(collector)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollector(collector)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar Cobrador */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar Nuevo Cobrador</h2>
            <form onSubmit={handleSubmitAdd}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alias (para tickets) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.alias}
                    onChange={(e) => setFormData({...formData, alias: e.target.value})}
                    placeholder="Ej: Carlitos, Juan, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Este nombre aparecerá en los recibos de pago
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Fecha en que el cobrador ingresó a la empresa
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
                >
                  Agregar Cobrador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Cobrador */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Editar Cobrador</h2>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alias (para tickets) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.alias}
                    onChange={(e) => setFormData({...formData, alias: e.target.value})}
                    placeholder="Ej: Carlitos, Juan, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Este nombre aparecerá en los recibos de pago
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña (dejar en blanco para mantener la actual)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Ingreso
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Fecha en que el cobrador ingresó a la empresa
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Enviar Recordatorio */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-orange-600" />
              Enviar Recordatorio de Cierre de Caja
            </h2>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Se enviará el recordatorio a <strong>{selectedCollectors.length}</strong> cobrador{selectedCollectors.length > 1 ? 'es' : ''}:
              </p>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {selectedCollectors.map(collectorId => {
                  const collector = collectors.find(c => c.id === collectorId);
                  if (!collector) return null;

                  const hasPhone = collector.phone && collector.phone.trim() !== '';
                  return (
                    <div key={collectorId} className="text-sm py-1 flex items-center justify-between">
                      <span className="text-gray-700">
                        • {collector.fullName} ({collector.alias})
                      </span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        hasPhone
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {hasPhone ? '📱 WhatsApp' : '❌ Sin teléfono'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Advertencia si hay cobradores sin teléfono */}
              {selectedCollectors.some(id => {
                const collector = collectors.find(c => c.id === id);
                return !collector?.phone || collector.phone.trim() === '';
              }) && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                  <div className="flex items-start">
                    <svg className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-red-800">
                      <strong>Advertencia:</strong> Algunos cobradores no tienen teléfono configurado y no recibirán el mensaje por WhatsApp.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje del recordatorio:
              </label>
              <textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Escribe el mensaje de recordatorio..."
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <Send className="h-4 w-4 text-green-600 mr-2 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">📱 Envío por WhatsApp:</p>
                  <p>Se abrirá WhatsApp para cada cobrador con el mensaje pre-escrito. Podrás enviar cada mensaje individualmente.</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <Bell className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Recordatorio adicional:</p>
                  <p>El recordatorio también aparecerá como popup en el sistema para los cobradores.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowReminderModal(false);
                  setSelectedCollectors([]);
                  setReminderMessage('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSendReminder}
                disabled={!reminderMessage.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                📱 Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Cobros */}
      {showHistoryModal && selectedCollector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <History className="h-5 w-5 mr-2 text-blue-600" />
                  Historial de Cobros - {selectedCollector.fullName}
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Estadísticas rápidas */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Cobrado</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(selectedCollector.stats.totalCollected)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Cobros Realizados</p>
                      <p className="text-lg font-bold text-blue-900">
                        {selectedCollector.stats.paymentsCount}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Eficiencia</p>
                      <p className="text-lg font-bold text-orange-900">
                        {selectedCollector.stats.collectionRate}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Clientes Atendidos</p>
                      <p className="text-lg font-bold text-purple-900">
                        {selectedCollector.stats.totalClients}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Cobros */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {getCollectorHistory(selectedCollector.id).length === 0 ? (
                  <div className="text-center py-12">
                    <History className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay historial</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Este cobrador aún no ha registrado cobros.
                    </p>
                  </div>
                ) : (
                  getCollectorHistory(selectedCollector.id).map((payment, index) => (
                    <div key={payment.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">
                                {payment.clientName}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {payment.clientNeighborhood && `📍 ${payment.clientNeighborhood}`}
                                {payment.clientPhone && ` • 📞 ${payment.clientPhone}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {payment.paymentMethod || 'Efectivo'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                payment.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : payment.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {payment.status === 'paid' ? 'Pagado' :
                                 payment.status === 'pending' ? 'Pendiente' :
                                 payment.status === 'overdue' ? 'Vencido' : payment.status}
                              </span>

                              {payment.period && (
                                <span className="text-xs text-gray-500">
                                  Período: {payment.period}
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-500">
                              {payment.paymentDate ? (
                                <span>
                                  Cobrado: {new Date(payment.paymentDate).toLocaleDateString('es-PE')}
                                </span>
                              ) : payment.dueDate ? (
                                <span>
                                  Vence: {new Date(payment.dueDate).toLocaleDateString('es-PE')}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorManagement;