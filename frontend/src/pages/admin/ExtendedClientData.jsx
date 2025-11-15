import React, { useState, useEffect } from 'react';
import { useClientStore } from '../../stores/clientStore';
import { useClientExtendedStore } from '../../stores/clientExtendedStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { 
  User, 
  DollarSign, 
  FileText, 
  Search, 
  Edit, 
  Save, 
  X,
  Plus,
  Filter
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getTarifaLabel, getTarifaColor } from '../../schemas/clientExtended';

const ExtendedClientData = () => {
  const { clients, fetchClients } = useClientStore();
  const {
    getExtendedData,
    setExtendedData,
    updateExtendedData,
    getExtendedStats,
    fetchExtendedData
  } = useClientExtendedStore();
  const { success, error: showError } = useNotificationStore();

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTarifa, setFilterTarifa] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchClients();
    fetchExtendedData();
  }, []);

  // Función helper para dividir fullName en apellidos y nombres
  const splitFullName = (fullName) => {
    if (!fullName) return { nombres: '-', apellidos: '-' };

    const parts = fullName.trim().split(' ').filter(Boolean);

    if (parts.length === 0) {
      return { nombres: '-', apellidos: '-' };
    } else if (parts.length === 1) {
      return { nombres: parts[0], apellidos: '-' };
    } else if (parts.length === 2) {
      return { nombres: parts[0], apellidos: parts[1] };
    } else if (parts.length === 3) {
      return { nombres: parts[0], apellidos: parts.slice(1).join(' ') };
    } else {
      return { nombres: parts.slice(0, 2).join(' '), apellidos: parts.slice(2).join(' ') };
    }
  };

  // Función para obtener costo por defecto según plan
  const getDefaultCost = (plan) => {
    const costs = {
      basic: 50,
      standard: 80,
      premium: 120
    };
    return costs[plan] || 80;
  };
  
  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const extendedData = getExtendedData(client.id);
    const matchesSearch = client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.dni?.includes(searchTerm) ||
                          extendedData?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          extendedData?.nombres?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTarifa = !filterTarifa || extendedData?.tipoTarifa === filterTarifa;
    
    return matchesSearch && matchesTarifa;
  });
  
  const stats = getExtendedStats();
  
  // Manejar edición
  const handleEdit = (client) => {
    const extendedData = getExtendedData(client.id) || {};

    // Si no hay datos extendidos, pre-rellenar con fallbacks
    const { nombres, apellidos } = extendedData.apellidos || extendedData.nombres
      ? { nombres: extendedData.nombres, apellidos: extendedData.apellidos }
      : splitFullName(client.fullName);

    setEditingClient(client.id);
    setFormData({
      apellidos: extendedData.apellidos || apellidos || '',
      nombres: extendedData.nombres || nombres || '',
      costoMensual: extendedData.costoMensual || getDefaultCost(client.servicePlan),
      costoInstalacion: extendedData.costoInstalacion || 0,
      referencia: extendedData.referencia || '',
      observaciones: extendedData.observaciones || '',
      tipoTarifa: extendedData.tipoTarifa || 'standard',
      condicionOriginal: extendedData.condicionOriginal || ''
    });
  };
  
  // Guardar cambios
  const handleSave = async (clientId) => {
    try {
      if (getExtendedData(clientId)) {
        updateExtendedData(clientId, formData);
      } else {
        setExtendedData(clientId, formData);
      }
      
      setEditingClient(null);
      success('Datos extendidos actualizados correctamente');
    } catch (error) {
      showError('Error al guardar los datos');
    }
  };
  
  // Cancelar edición
  const handleCancel = () => {
    setEditingClient(null);
    setFormData({});
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Datos Extendidos de Clientes</h1>
        <p className="text-gray-600 mt-2">
          Gestión de campos adicionales del Excel BD ABONADOS
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <User className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tarifa Legacy</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.legacy}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Servicios Gratuitos</p>
              <p className="text-2xl font-bold text-green-600">{stats.gratuitous}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Importados Excel</p>
              <p className="text-2xl font-bold text-purple-600">{stats.imported}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellidos, DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            
            {/* Filtro por tarifa */}
            <select 
              value={filterTarifa}
              onChange={(e) => setFilterTarifa(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">Todas las tarifas</option>
              <option value="standard">Estándar</option>
              <option value="legacy">Legacy</option>
              <option value="gratuitous">Gratuito</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de datos extendidos */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apellidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Mensual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Instalación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Tarifa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observaciones
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => {
                const extendedData = getExtendedData(client.id);
                const isEditing = editingClient === client.id;

                // Obtener apellidos y nombres con fallback
                const { nombres: displayNombres, apellidos: displayApellidos } = extendedData?.apellidos || extendedData?.nombres
                  ? { nombres: extendedData.nombres, apellidos: extendedData.apellidos }
                  : splitFullName(client.fullName);

                // Obtener costo mensual con fallback
                const displayCostoMensual = extendedData?.costoMensual || getDefaultCost(client.servicePlan);

                // Obtener costo instalación con fallback
                const displayCostoInstalacion = extendedData?.costoInstalacion || 0;

                return (
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
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.apellidos || ''}
                          onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Apellidos"
                        />
                      ) : (
                        <span className="text-sm text-gray-900" title={displayApellidos !== '-' ? `Desde: ${extendedData ? 'Datos extendidos' : 'Nombre completo'}` : ''}>
                          {displayApellidos}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.nombres || ''}
                          onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Nombres"
                        />
                      ) : (
                        <span className="text-sm text-gray-900" title={displayNombres !== '-' ? `Desde: ${extendedData ? 'Datos extendidos' : 'Nombre completo'}` : ''}>
                          {displayNombres}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={formData.costoMensual || ''}
                          onChange={(e) => setFormData({...formData, costoMensual: parseFloat(e.target.value) || 0})}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-gray-900" title={!extendedData?.costoMensual ? `Desde plan ${client.servicePlan}` : 'Costo personalizado'}>
                          S/. {displayCostoMensual.toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          value={formData.costoInstalacion || ''}
                          onChange={(e) => setFormData({...formData, costoInstalacion: parseFloat(e.target.value) || 0})}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="0"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">
                          S/. {displayCostoInstalacion.toFixed(2)}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          value={formData.tipoTarifa || 'standard'}
                          onChange={(e) => setFormData({...formData, tipoTarifa: e.target.value})}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="standard">Estándar</option>
                          <option value="legacy">Legacy</option>
                          <option value="gratuitous">Gratuito</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTarifaColor(extendedData?.tipoTarifa || 'standard')}`}>
                          {getTarifaLabel(extendedData?.tipoTarifa || 'standard')}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <textarea
                          value={formData.referencia || ''}
                          onChange={(e) => setFormData({...formData, referencia: e.target.value})}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Referencia..."
                          rows="2"
                        />
                      ) : (
                        <div className="max-w-xs">
                          <span className="text-sm text-gray-900 truncate block" title={extendedData?.referencia}>
                            {extendedData?.referencia || '-'}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <textarea
                          value={formData.observaciones || ''}
                          onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Observaciones..."
                          rows="2"
                        />
                      ) : (
                        <div className="max-w-xs">
                          <span className="text-sm text-gray-900 truncate block" title={extendedData?.observaciones}>
                            {extendedData?.observaciones || '-'}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditing ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSave(client.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Guardar"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-red-600 hover:text-red-900"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar datos extendidos"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredClients.length === 0 && (
          <div className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron clientes con los filtros aplicados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtendedClientData;