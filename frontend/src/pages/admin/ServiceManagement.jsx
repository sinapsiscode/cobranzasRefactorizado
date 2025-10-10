import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Wifi, 
  Tv, 
  Settings,
  Check,
  X,
  DollarSign,
  Network
} from 'lucide-react';
import { useServiceStore } from '../../stores/serviceStore';
import { useAuthStore } from '../../stores/authStore';
import { saveBasePrices, getBasePrices } from '../../services/basePricingService';
import { 
  getServiceTypeLabel, 
  getServiceTypeColor,
  getCategoryLabel,
  getCategoryColor,
  getServiceStatusLabel,
  getServiceStatusColor
} from '../../schemas/service';

const ServiceManagement = () => {
  const { user } = useAuthStore();
  const {
    services,
    loading,
    error,
    filters,
    fetchServices,
    createService,
    updateService,
    deleteService,
    getFilteredServices,
    setFilters,
    clearFilters,
    setCurrentService,
    clearCurrentService,
    clearError,
    getServiceStats,
    initializeDefaultServices
  } = useServiceStore();
  
  // Estados para los precios de servicios básicos
  const [servicePrices, setServicePrices] = useState({
    internet: 0,
    cable: 0,
    duo: 0
  });
  const [showPriceModal, setShowPriceModal] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [newService, setNewService] = useState({
    name: 'internet', // Ahora será: internet, cable, duo
    description: '',
    serviceType: 'plan_hogar', // Ahora será: plan_hogar, plan_corporativo, plan_negocio
    price: 0,
    features: {
      speed: '',
      bandwidth: '',
      channels: 0,
      extras: []
    },
    isActive: true,
    isAvailable: true,
    installationFee: 0,
    contractDuration: 12
  });

  const [extraInput, setExtraInput] = useState('');

  useEffect(() => {
    initializeDefaultServices();
    fetchServices();
    // Cargar precios guardados
    loadServicePrices();
  }, []);
  
  const loadServicePrices = () => {
    const prices = getBasePrices();
    setServicePrices(prices);
  };
  
  const saveServicePrices = () => {
    const success = saveBasePrices(servicePrices);
    if (success) {
      alert('Precios actualizados correctamente. Los cambios se aplicarán automáticamente en todo el sistema.');
      setShowPriceModal(false);
    } else {
      alert('Error al guardar los precios. Intente nuevamente.');
    }
  };

  const handleCreateService = async () => {
    try {
      await createService(newService, user?.id);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating service:', error);
    }
  };

  const handleUpdateService = async () => {
    try {
      await updateService(selectedService.id, selectedService);
      setShowEditModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async () => {
    try {
      await deleteService(selectedService.id);
      setShowDeleteModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const resetForm = () => {
    setNewService({
      name: 'internet', // Ahora será: internet, cable, duo
      description: '',
      serviceType: 'plan_hogar', // Ahora será: plan_hogar, plan_corporativo, plan_negocio
        price: 0,
      features: {
        speed: '',
        bandwidth: '',
        channels: 0,
        extras: []
      },
      isActive: true,
      isAvailable: true,
      installationFee: 0,
      contractDuration: 12
    });
    setExtraInput('');
  };

  const addExtra = (service, setService) => {
    if (extraInput.trim()) {
      setService(prev => ({
        ...prev,
        features: {
          ...prev.features,
          extras: [...prev.features.extras, extraInput.trim()]
        }
      }));
      setExtraInput('');
    }
  };

  const removeExtra = (index, service, setService) => {
    setService(prev => ({
      ...prev,
      features: {
        ...prev.features,
        extras: prev.features.extras.filter((_, i) => i !== index)
      }
    }));
  };

  const filteredServices = getFilteredServices();
  const stats = getServiceStats();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Servicios</h1>
            <p className="text-gray-600">Administrar servicios y precios de internet y cable</p>
          </div>
          <button
            onClick={() => setShowPriceModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            <span>Configurar Precios Base</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Settings className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Check className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Internet</p>
              <p className="text-2xl font-bold text-blue-600">{stats.internet}</p>
            </div>
            <Wifi className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cable</p>
              <p className="text-2xl font-bold text-purple-600">{stats.cable}</p>
            </div>
            <Tv className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            {/* Service Type Filter */}
            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ serviceType: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="internet">Internet</option>
              <option value="cable">Cable</option>
              <option value="duo">Dúo (Internet + Cable)</option>
            </select>


            {/* Status Filter */}
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ isActive: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Limpiar filtros
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Servicio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
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
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Cargando servicios...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron servicios
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceTypeColor(service.serviceType)}`}>
                        {service.serviceType === 'internet' ? (
                          <Wifi className="h-3 w-3 mr-1" />
                        ) : service.serviceType === 'cable' ? (
                          <Tv className="h-3 w-3 mr-1" />
                        ) : (
                          <Network className="h-3 w-3 mr-1" />
                        )}
                        {getServiceTypeLabel(service.serviceType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      S/ {service.price}
                      {service.installationFee > 0 && (
                        <div className="text-xs text-gray-500">
                          + S/ {service.installationFee} instalación
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceStatusColor(service.isActive, service.isAvailable)}`}>
                        {getServiceStatusLabel(service.isActive, service.isAvailable)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Servicio</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre (anteriormente Tipo de Servicio) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <select
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="internet">Internet</option>
                    <option value="cable">Cable</option>
                    <option value="duo">Dúo (Internet + Cable)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                  </label>
                  <input
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Tipo de Servicio (ahora será Plan Hogar, etc.) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Servicio *
                  </label>
                  <select
                    value={newService.serviceType}
                    onChange={(e) => setNewService(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="plan_hogar">Plan Hogar</option>
                    <option value="plan_corporativo">Plan Corporativo</option>
                    <option value="plan_negocio">Plan Negocio</option>
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo de Instalación
                  </label>
                  <input
                    type="number"
                    value={newService.installationFee}
                    onChange={(e) => setNewService(prev => ({ ...prev, installationFee: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración del Contrato (meses)
                  </label>
                  <input
                    type="number"
                    value={newService.contractDuration}
                    onChange={(e) => setNewService(prev => ({ ...prev, contractDuration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="60"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción del servicio"
                  maxLength={500}
                />
              </div>

              {/* Features Section */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Características</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newService.name === 'internet' || newService.name === 'duo' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Velocidad
                        </label>
                        <input
                          type="text"
                          value={newService.features.speed}
                          onChange={(e) => setNewService(prev => ({
                            ...prev,
                            features: { ...prev.features, speed: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: 100 Mbps"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ancho de Banda
                        </label>
                        <input
                          type="text"
                          value={newService.features.bandwidth}
                          onChange={(e) => setNewService(prev => ({
                            ...prev,
                            features: { ...prev.features, bandwidth: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: Ilimitado"
                        />
                      </div>
                      {newService.name === 'duo' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Canales
                          </label>
                          <input
                            type="number"
                            value={newService.features.channels}
                            onChange={(e) => setNewService(prev => ({
                              ...prev,
                              features: { ...prev.features, channels: Number(e.target.value) }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            placeholder="Canales incluidos"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Canales
                      </label>
                      <input
                        type="number"
                        value={newService.features.channels}
                        onChange={(e) => setNewService(prev => ({
                          ...prev,
                          features: { ...prev.features, channels: Number(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {/* Extras */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicios Adicionales
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={extraInput}
                      onChange={(e) => setExtraInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Agregar servicio adicional"
                      onKeyPress={(e) => e.key === 'Enter' && addExtra(newService, setNewService)}
                    />
                    <button
                      type="button"
                      onClick={() => addExtra(newService, setNewService)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newService.features.extras.map((extra, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {extra}
                        <button
                          type="button"
                          onClick={() => removeExtra(index, newService, setNewService)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Checkboxes */}
              <div className="mt-4 flex gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newService.isActive}
                    onChange={(e) => setNewService(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Servicio Activo
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={newService.isAvailable}
                    onChange={(e) => setNewService(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                    Disponible para Nuevos Clientes
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateService}
                  disabled={loading || !newService.name || !newService.price}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando...' : 'Crear Servicio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Servicio</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre (anteriormente Tipo de Servicio) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <select
                    value={selectedService.name}
                    onChange={(e) => setSelectedService(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="internet">Internet</option>
                    <option value="cable">Cable</option>
                    <option value="duo">Dúo (Internet + Cable)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                  </label>
                  <input
                    type="number"
                    value={selectedService.price}
                    onChange={(e) => setSelectedService(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Tipo de Servicio (ahora será Plan Hogar, etc.) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Servicio *
                  </label>
                  <select
                    value={selectedService.serviceType}
                    onChange={(e) => setSelectedService(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="plan_hogar">Plan Hogar</option>
                    <option value="plan_corporativo">Plan Corporativo</option>
                    <option value="plan_negocio">Plan Negocio</option>
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo de Instalación
                  </label>
                  <input
                    type="number"
                    value={selectedService.installationFee}
                    onChange={(e) => setSelectedService(prev => ({ ...prev, installationFee: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración del Contrato (meses)
                  </label>
                  <input
                    type="number"
                    value={selectedService.contractDuration}
                    onChange={(e) => setSelectedService(prev => ({ ...prev, contractDuration: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="60"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={selectedService.description || ''}
                  onChange={(e) => setSelectedService(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={500}
                />
              </div>

              {/* Status Checkboxes */}
              <div className="mt-4 flex gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={selectedService.isActive}
                    onChange={(e) => setSelectedService(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsActive" className="ml-2 block text-sm text-gray-900">
                    Servicio Activo
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editIsAvailable"
                    checked={selectedService.isAvailable}
                    onChange={(e) => setSelectedService(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsAvailable" className="ml-2 block text-sm text-gray-900">
                    Disponible para Nuevos Clientes
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedService(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdateService}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Servicio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Eliminar Servicio
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar el servicio "<strong>{selectedService.name}</strong>"?
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="items-center px-4 py-3 flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedService(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteService}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Precios Base */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Configurar Precios Base de Servicios
              </h3>
              
              <div className="space-y-4">
                {/* Precio Internet */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Wifi className="h-5 w-5 text-blue-600 mr-2" />
                      <label className="text-sm font-medium text-gray-900">
                        Servicio de Internet
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={servicePrices.internet}
                      onChange={(e) => setServicePrices(prev => ({
                        ...prev,
                        internet: parseFloat(e.target.value) || 0
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Precio Cable */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Tv className="h-5 w-5 text-purple-600 mr-2" />
                      <label className="text-sm font-medium text-gray-900">
                        Servicio de Cable
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={servicePrices.cable}
                      onChange={(e) => setServicePrices(prev => ({
                        ...prev,
                        cable: parseFloat(e.target.value) || 0
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Precio DUO */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="flex -space-x-1 mr-2">
                        <Wifi className="h-5 w-5 text-green-600" />
                        <Tv className="h-5 w-5 text-green-600" />
                      </div>
                      <label className="text-sm font-medium text-gray-900">
                        Servicio DUO (Internet + Cable)
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={servicePrices.duo}
                      onChange={(e) => setServicePrices(prev => ({
                        ...prev,
                        duo: parseFloat(e.target.value) || 0
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Precio especial para el paquete combinado
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Cómo funcionan los precios:</h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <p><strong>• Precios Base:</strong> Los valores que configures arriba</p>
                  <p><strong>• Plan Básico:</strong> 100% del precio base</p>
                  <p><strong>• Plan Estándar:</strong> 160% del precio base</p>
                  <p><strong>• Plan Premium:</strong> 240% del precio base</p>
                  <p className="pt-2 border-t border-blue-200">
                    <strong>Ejemplo:</strong> Si Internet = S/ 50, entonces Plan Estándar = S/ 80
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPriceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveServicePrices}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Guardar Precios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;