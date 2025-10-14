import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  User,
  Phone,
  MapPin,
  Calendar,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useClientStore } from '../../stores/clientStore';
import { useServiceStore } from '../../stores/serviceStore';
import { useAuthStore } from '../../stores/authStore';
// MIGRADO A JSON SERVER - import eliminado

const API_URL = 'http://localhost:8231/api';

const UserManagement = () => {
  const { user } = useAuthStore();
  const {
    clients,
    loading,
    error,
    filters,
    fetchClients,
    createClient,
    updateClient,
    setFilters,
    clearFilters,
    clearError
  } = useClientStore();

  const {
    services,
    getActiveServices,
    fetchServices
  } = useServiceStore();

  // Estados locales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [neighborhoods, setNeighborhoods] = useState([]);

  const [newClient, setNewClient] = useState({
    fullName: '',
    dni: '',
    phone: '',
    address: '',
    neighborhood: '',
    serviceId: '',
    price: '',
    installationDate: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: '',
    // Credenciales de acceso
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchClients();
    fetchServices();
    loadNeighborhoods();
  }, []);

  const loadNeighborhoods = async () => {
    try {
      const response = await fetch(`${API_URL}/neighborhoods`);
      if (!response.ok) {
        throw new Error('Error al cargar barrios');
      }
      const data = await response.json();
      const storedNeighborhoods = data.items || data || [];
      setNeighborhoods(storedNeighborhoods);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
    }
  };

  // Filtrar solo clientes creados por este sub-administrador
  const getMyClients = () => {
    let filteredClients = [...clients];

    // Aplicar filtros
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredClients = filteredClients.filter(client =>
        client.fullName.toLowerCase().includes(searchTerm) ||
        client.dni.includes(searchTerm) ||
        client.phone.includes(searchTerm)
      );
    }

    if (filters.status) {
      filteredClients = filteredClients.filter(client => client.status === filters.status);
    }

    if (filters.neighborhood) {
      filteredClients = filteredClients.filter(client => client.neighborhood === filters.neighborhood);
    }

    // Filtrar solo clientes creados por este sub-administrador
    return filteredClients.filter(client => client.createdBy === user?.id);
  };

  // Función para generar credenciales automáticamente
  const generateCredentials = (fullName, dni) => {
    // Generar username: primeras letras del nombre + últimos 4 dígitos del DNI
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0]?.toLowerCase() || '';
    const lastName = nameParts[1]?.toLowerCase() || '';
    const dniSuffix = dni.slice(-4);

    const username = `${firstName.slice(0, 3)}${lastName.slice(0, 3)}${dniSuffix}`.replace(/[^a-z0-9]/g, '');

    // Generar contraseña: mezcla de letras y números
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return { username, password };
  };

  // Función para validar si el username ya existe
  const isUsernameAvailable = async (username) => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      const users = data.items || data || [];
      return !users.some(user => user.username === username);
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  // Función para generar username único
  const generateUniqueUsername = async (fullName, dni) => {
    let { username, password } = generateCredentials(fullName, dni);
    let counter = 1;

    // Si el username ya existe, agregar un número
    while (!(await isUsernameAvailable(username))) {
      const baseName = username.replace(/\d+$/, '');
      username = `${baseName}${counter}`;
      counter++;
    }

    return { username, password };
  };

  const handleCreateClient = async () => {
    try {
      // Validar campos requeridos
      if (!newClient.fullName || !newClient.dni || !newClient.phone || !newClient.serviceId || !newClient.price) {
        alert('Por favor complete todos los campos obligatorios');
        return;
      }

      // Validar que el precio sea válido
      if (parseFloat(newClient.price) <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
      }

      // Generar credenciales si está habilitado
      let credentials = null;
      if (newClient.generateCredentials) {
        credentials = await generateUniqueUsername(newClient.fullName, newClient.dni);
      } else if (newClient.username && newClient.password) {
        // Verificar que el username manual no exista
        const isAvailable = await isUsernameAvailable(newClient.username);
        if (!isAvailable) {
          alert('El nombre de usuario ya existe. Por favor elija otro.');
          return;
        }
        credentials = {
          username: newClient.username,
          password: newClient.password
        };
      }

      // Agregar createdBy y credenciales al cliente
      const clientWithCreator = {
        ...newClient,
        createdBy: user?.id,
        ...(credentials && {
          username: credentials.username,
          password: credentials.password,
          role: 'client',
          isActive: true
        })
      };

      const createdClient = await createClient(clientWithCreator);

      // Si se generaron credenciales, crear usuario en el sistema
      if (credentials) {
        const newUser = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          username: credentials.username,
          password: credentials.password, // En producción esto debería estar hasheado
          role: 'client',
          clientId: createdClient.id,
          fullName: newClient.fullName,
          isActive: true,
          createdBy: user?.id,
          createdAt: new Date().toISOString()
        };

        // Crear usuario en el backend
        const userResponse = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });

        if (!userResponse.ok) {
          throw new Error('Error al crear usuario');
        }

        // Mostrar credenciales generadas
        setGeneratedCredentials({
          client: createdClient,
          username: credentials.username,
          password: credentials.password
        });
        setShowCredentialsModal(true);
      }

      setShowCreateModal(false);
      resetForm();

      if (!credentials) {
        alert('Cliente creado exitosamente');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error al crear cliente: ' + error.message);
    }
  };

  const handleUpdateClient = async () => {
    try {
      await updateClient(selectedClient.id, selectedClient);
      setShowEditModal(false);
      setSelectedClient(null);
      alert('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar cliente: ' + error.message);
    }
  };

  const resetForm = () => {
    setNewClient({
      fullName: '',
      dni: '',
      phone: '',
      address: '',
      neighborhood: '',
      serviceId: '',
      installationDate: new Date().toISOString().split('T')[0],
      status: 'active',
      notes: '',
      username: '',
      password: '',
      price: ''
    });
  };

  const handleClientFormChange = (field, value) => {
    setNewClient(prev => ({
      ...prev,
      [field]: value
    }));

    // Autocompletar precio cuando se selecciona un servicio
    if (field === 'serviceId' && value) {
      const selectedService = services.find(service => service.id === value);
      if (selectedService) {
        setNewClient(prev => ({
          ...prev,
          serviceId: value,
          price: selectedService.price
        }));
      }
    }
  };

  const handleEditFormChange = (field, value) => {
    setSelectedClient(prev => ({
      ...prev,
      [field]: value
    }));

    // Autocompletar precio cuando se selecciona un servicio en edición
    if (field === 'serviceId' && value) {
      const selectedService = services.find(service => service.id === value);
      if (selectedService) {
        setSelectedClient(prev => ({
          ...prev,
          serviceId: value,
          price: selectedService.price
        }));
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      debt: 'bg-red-100 text-red-800',
      terminated: 'bg-gray-100 text-gray-800',
      paused: 'bg-blue-100 text-blue-800',
      suspended: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Activo',
      debt: 'Moroso',
      terminated: 'Terminado',
      paused: 'Pausado',
      suspended: 'Suspendido'
    };
    return labels[status] || status;
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : 'Sin servicio';
  };

  const myClients = getMyClients();
  const activeServices = getActiveServices();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600">Crear y gestionar clientes del sistema</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mis Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{myClients.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {myClients.filter(c => c.status === 'active').length}
              </p>
            </div>
            <Check className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Deudas</p>
              <p className="text-2xl font-bold text-red-600">
                {myClients.filter(c => c.status === 'debt').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="debt">Morosos</option>
              <option value="paused">Pausados</option>
              <option value="suspended">Suspendidos</option>
              <option value="terminated">Terminados</option>
            </select>

            {/* Neighborhood Filter */}
            <select
              value={filters.neighborhood}
              onChange={(e) => setFilters({ neighborhood: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los barrios</option>
              {neighborhoods.map(neighborhood => (
                <option key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Limpiar filtros
          </button>
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

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servicio
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
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Cargando clientes...
                  </td>
                </tr>
              ) : myClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No has creado ningún cliente aún
                  </td>
                </tr>
              ) : (
                myClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          DNI: {client.dni}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {client.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div>{client.neighborhood}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {client.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getServiceName(client.serviceId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                        {getStatusLabel(client.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedClient(client);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Cliente</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={newClient.fullName}
                    onChange={(e) => handleClientFormChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre completo del cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    value={newClient.dni}
                    onChange={(e) => handleClientFormChange('dni', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de DNI"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => handleClientFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de teléfono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barrio
                  </label>
                  <select
                    value={newClient.neighborhood}
                    onChange={(e) => handleClientFormChange('neighborhood', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar barrio...</option>
                    {neighborhoods.map(neighborhood => (
                      <option key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => handleClientFormChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dirección completa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio *
                  </label>
                  <select
                    value={newClient.serviceId}
                    onChange={(e) => handleClientFormChange('serviceId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar servicio...</option>
                    {activeServices.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - S/ {service.price}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Mensual *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      value={newClient.price}
                      onChange={(e) => handleClientFormChange('price', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {newClient.serviceId && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Precio autocompletado. Puedes modificarlo para aplicar descuentos.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de instalación
                  </label>
                  <input
                    type="date"
                    value={newClient.installationDate}
                    onChange={(e) => handleClientFormChange('installationDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Credenciales de acceso */}
              <div className="mt-6 border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">Credenciales de Acceso</h4>

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="generateCredentials"
                    checked={newClient.generateCredentials}
                    onChange={(e) => {
                      handleClientFormChange('generateCredentials', e.target.checked);
                      if (e.target.checked) {
                        handleClientFormChange('username', '');
                        handleClientFormChange('password', '');
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generateCredentials" className="ml-2 block text-sm text-gray-900">
                    Generar credenciales automáticamente
                  </label>
                </div>

                {!newClient.generateCredentials && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de usuario
                      </label>
                      <input
                        type="text"
                        value={newClient.username}
                        onChange={(e) => handleClientFormChange('username', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Usuario para acceder"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={newClient.password}
                        onChange={(e) => handleClientFormChange('password', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contraseña de acceso"
                      />
                    </div>
                  </div>
                )}

                {newClient.generateCredentials && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      ℹ️ Se generarán automáticamente credenciales únicas basadas en el nombre y DNI del cliente.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={newClient.notes}
                  onChange={(e) => handleClientFormChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales sobre el cliente"
                />
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
                  onClick={handleCreateClient}
                  disabled={loading || !newClient.fullName || !newClient.serviceId || !newClient.username || !newClient.password || !newClient.price}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creando...' : 'Crear Cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Cliente</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={selectedClient.fullName}
                    onChange={(e) => handleEditFormChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    value={selectedClient.dni}
                    onChange={(e) => handleEditFormChange('dni', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={selectedClient.phone}
                    onChange={(e) => handleEditFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={selectedClient.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="debt">Moroso</option>
                    <option value="paused">Pausado</option>
                    <option value="suspended">Suspendido</option>
                    <option value="terminated">Terminado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barrio
                  </label>
                  <select
                    value={selectedClient.neighborhood}
                    onChange={(e) => handleEditFormChange('neighborhood', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar barrio...</option>
                    {neighborhoods.map(neighborhood => (
                      <option key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio *
                  </label>
                  <select
                    value={selectedClient.serviceId}
                    onChange={(e) => handleEditFormChange('serviceId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar servicio...</option>
                    {activeServices.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} - S/ {service.price}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Mensual *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      value={selectedClient.price || ''}
                      onChange={(e) => handleEditFormChange('price', e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={selectedClient.address}
                    onChange={(e) => handleEditFormChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={selectedClient.notes || ''}
                  onChange={(e) => handleEditFormChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedClient(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdateClient}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Actualizando...' : 'Actualizar Cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Credenciales Generadas */}
      {showCredentialsModal && generatedCredentials && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Cliente Creado Exitosamente</h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-3">Credenciales de Acceso Creadas:</h4>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cliente:</span>
                    <span className="font-medium">{generatedCredentials.client.fullName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Usuario:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border">
                      {generatedCredentials.username}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Contraseña:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border">
                      {generatedCredentials.password}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Importante:</strong> Guarde estas credenciales en un lugar seguro.
                  El cliente necesitará esta información para acceder a la plataforma.
                </p>
              </div>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    const credentials = `Cliente: ${generatedCredentials.client.fullName}\nUsuario: ${generatedCredentials.username}\nContraseña: ${generatedCredentials.password}`;
                    navigator.clipboard.writeText(credentials);
                    alert('Credenciales copiadas al portapapeles');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Copiar Credenciales
                </button>
                <button
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setGeneratedCredentials(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;