import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Calendar,
  Shield,
  ShieldCheck,
  User,
  Crown,
  Lock,
  Unlock,
  Filter,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { db } from '../../services/mock/db';

const UserManagement = () => {
  const { success, error: showError, info } = useNotificationStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'collector',
    isActive: true
  });

  const roles = [
    { id: 'admin', name: 'Súper administrador', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-100' },
    { id: 'subadmin', name: 'Administrador', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'collector', name: 'Cobrador', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
    { id: 'client', name: 'Cliente', icon: User, color: 'text-gray-600', bg: 'bg-gray-100' }
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = db.getCollection('users') || [];
      
      // Agregar estadísticas para cada usuario
      const usersWithStats = allUsers.map(user => {
        let stats = {};
        
        if (user.role === 'collector') {
          const payments = db.getCollection('payments') || [];
          const collectorPayments = payments.filter(p => p.collectorId === user.id);
          const clients = db.getCollection('clients') || [];
          
          const assignedClients = new Set();
          collectorPayments.forEach(payment => {
            assignedClients.add(payment.clientId);
          });
          
          stats = {
            totalClients: assignedClients.size,
            totalCollected: collectorPayments
              .filter(p => p.status === 'paid')
              .reduce((sum, p) => sum + p.amount, 0),
            paymentsCount: collectorPayments.filter(p => p.status === 'paid').length,
            pendingPayments: collectorPayments.filter(p => p.status === 'pending').length
          };
        } else if (user.role === 'client') {
          const payments = db.getCollection('payments') || [];
          const clientPayments = payments.filter(p => p.clientId === user.id);
          
          stats = {
            totalPayments: clientPayments.length,
            paidPayments: clientPayments.filter(p => p.status === 'paid').length,
            pendingPayments: clientPayments.filter(p => p.status === 'pending').length,
            overduePayments: clientPayments.filter(p => p.status === 'overdue').length
          };
        }
        
        return { ...user, stats };
      });
      
      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'collector',
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const handleSubmitAdd = (e) => {
    e.preventDefault();
    
    try {
      // Verificar si el username ya existe
      const existingUser = users.find(u => u.username === formData.username);
      if (existingUser) {
        showError('Ya existe un usuario con este nombre de usuario');
        return;
      }

      // Verificar si el email ya existe
      const existingEmail = users.find(u => u.email === formData.email);
      if (existingEmail) {
        showError('Ya existe un usuario con este email');
        return;
      }
      
      const newUser = {
        ...formData,
        id: `user-${Date.now()}`,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.create('users', newUser);
      success('Usuario creado exitosamente');
      setShowAddModal(false);
      loadUsers();
    } catch (error) {
      showError('Error al crear el usuario');
    }
  };

  const handleSubmitEdit = (e) => {
    e.preventDefault();
    
    try {
      // Verificar username único (excluyendo el usuario actual)
      const existingUser = users.find(u => u.username === formData.username && u.id !== selectedUser.id);
      if (existingUser) {
        showError('Ya existe un usuario con este nombre de usuario');
        return;
      }

      // Verificar email único (excluyendo el usuario actual)
      const existingEmail = users.find(u => u.email === formData.email && u.id !== selectedUser.id);
      if (existingEmail) {
        showError('Ya existe un usuario con este email');
        return;
      }
      
      const updates = { ...formData };
      if (!updates.password) {
        delete updates.password;
      }
      updates.updatedAt = new Date().toISOString();
      
      db.update('users', selectedUser.id, updates);
      success('Usuario actualizado exitosamente');
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      showError('Error al actualizar el usuario');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      db.update('users', user.id, { isActive: !user.isActive });
      success(`Usuario ${!user.isActive ? 'activado' : 'desactivado'} exitosamente`);
      loadUsers();
    } catch (error) {
      showError('Error al cambiar el estado del usuario');
    }
  };

  const handleDeleteUser = async (user) => {
    if (window.confirm(`¿Está seguro de eliminar al usuario ${user.fullName}?`)) {
      try {
        db.delete('users', user.id);
        success('Usuario eliminado exitosamente');
        loadUsers();
      } catch (error) {
        showError('Error al eliminar el usuario');
      }
    }
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

  const getRoleInfo = (roleId) => {
    return roles.find(r => r.id === roleId) || roles[0];
  };

  const getStatsByRole = () => {
    const stats = {
      admin: users.filter(u => u.role === 'admin').length,
      subadmin: users.filter(u => u.role === 'subadmin').length,
      collector: users.filter(u => u.role === 'collector').length,
      client: users.filter(u => u.role === 'client').length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };
    return stats;
  };

  const stats = getStatsByRole();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administrar todos los usuarios del sistema</p>
        </div>
        
        <button 
          onClick={handleAddUser}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-gray-600 opacity-20" />
          </div>
        </div>
        
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{role.name}</p>
                <p className={`text-xl font-bold ${role.color}`}>
                  {stats[role.id]}
                </p>
              </div>
              <role.icon className={`h-6 w-6 ${role.color} opacity-20`} />
            </div>
          </div>
        ))}
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Activos</p>
              <p className="text-xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">{stats.inactive} inactivos</p>
            </div>
            <Activity className="h-6 w-6 text-green-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2">
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

          {/* Filtro por Rol */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Todos los roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="large" text="Cargando usuarios..." />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay usuarios"
            description={searchTerm || roleFilter || statusFilter ? 
              "No se encontraron usuarios with los criterios de búsqueda." : 
              "No hay usuarios registrados en el sistema."}
            action={
              !searchTerm && !roleFilter && !statusFilter && (
                <button 
                  onClick={handleAddUser}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Agregar Primer Usuario
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
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estadísticas
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
                {filteredUsers.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.bg} ${roleInfo.color}`}>
                          <roleInfo.icon className="h-3 w-3 mr-1" />
                          {roleInfo.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="truncate max-w-48">{user.email}</span>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-gray-400" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          {user.role === 'collector' && user.stats && (
                            <>
                              <div className="text-gray-600">
                                <span className="font-medium">{user.stats.totalClients}</span> clientes
                              </div>
                              <div className="text-green-600">
                                {formatCurrency(user.stats.totalCollected)} recaudado
                              </div>
                            </>
                          )}
                          {user.role === 'client' && user.stats && (
                            <>
                              <div className="text-gray-600">
                                <span className="font-medium">{user.stats.totalPayments}</span> pagos
                              </div>
                              <div className="text-green-600">
                                <span className="font-medium">{user.stats.paidPayments}</span> pagados
                              </div>
                            </>
                          )}
                          {(user.role === 'admin' || user.role === 'subadmin') && (
                            <div className="text-gray-500">
                              Sistema
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
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
                        {user.lastLogin ? (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {formatDate(user.lastLogin)}
                          </div>
                        ) : (
                          'Nunca'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`${user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                            title={user.isActive ? 'Desactivar' : 'Activar'}
                          >
                            {user.isActive ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar Usuario */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Agregar Nuevo Usuario</h2>
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
                    Rol
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
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
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
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
                    Rol
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
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
    </div>
  );
};

export default UserManagement;