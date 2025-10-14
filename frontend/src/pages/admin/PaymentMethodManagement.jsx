import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
// MIGRADO A JSON SERVER - import eliminado
import { useNotificationStore } from '../../stores/notificationStore';
import { validatePaymentMethod } from '../../schemas/paymentMethod';

const API_URL = 'http://localhost:8231/api';

const PaymentMethodManagement = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  const { success, error: showError } = useNotificationStore();

  // Cargar métodos de pago al montar
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_URL}/paymentMethods`);
      if (!response.ok) {
        throw new Error('Error al cargar métodos de pago');
      }
      const data = await response.json();
      const methods = data.items || data || [];
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      showError('Error al cargar métodos de pago');
    }
  };

  const handleOpenModal = (method = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        description: method.description || '',
        isActive: method.isActive
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        description: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMethod(null);
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar datos
    const dataToValidate = {
      ...formData,
      id: editingMethod?.id || `pm_${Date.now()}`
    };

    const errors = validatePaymentMethod(dataToValidate);
    if (errors) {
      const errorMessages = Object.values(errors);
      showError(`Error: ${errorMessages[0]}`);
      return;
    }

    try {
      if (editingMethod) {
        // Editar método existente
        const response = await fetch(`${API_URL}/paymentMethods/${editingMethod.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Error al actualizar método de pago');
        }

        success('Método de pago actualizado exitosamente');
      } else {
        // Crear nuevo método
        const newMethod = {
          id: `pm_${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const response = await fetch(`${API_URL}/paymentMethods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMethod)
        });

        if (!response.ok) {
          throw new Error('Error al crear método de pago');
        }

        success('Método de pago creado exitosamente');
      }

      await loadPaymentMethods();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving payment method:', error);
      showError('Error al guardar el método de pago');
    }
  };

  const handleToggleActive = async (method) => {
    try {
      const response = await fetch(`${API_URL}/paymentMethods/${method.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !method.isActive
        })
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado');
      }

      success(`Método de pago ${!method.isActive ? 'activado' : 'desactivado'}`);
      await loadPaymentMethods();
    } catch (error) {
      console.error('Error toggling payment method:', error);
      showError('Error al cambiar el estado del método de pago');
    }
  };

  const handleDelete = async (method) => {
    if (window.confirm(`¿Está seguro de eliminar el método de pago "${method.name}"?`)) {
      try {
        const response = await fetch(`${API_URL}/paymentMethods/${method.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Error al eliminar método de pago');
        }

        success('Método de pago eliminado exitosamente');
        await loadPaymentMethods();
      } catch (error) {
        console.error('Error deleting payment method:', error);
        showError('Error al eliminar el método de pago');
      }
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Métodos de Pago</h1>
            <p className="text-gray-600">Gestiona los métodos de pago disponibles en el sistema</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Método
          </button>
        </div>
      </div>

      {/* Lista de métodos de pago */}
      <div className="bg-white rounded-lg shadow">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay métodos de pago</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando un nuevo método de pago
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
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
                {paymentMethods.map((method) => (
                  <tr key={method.id} className={!method.isActive ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                        <div className="text-sm font-medium text-gray-900">
                          {method.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {method.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(method)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                          method.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {method.isActive ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(method)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(method)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Ej: Yape, Plin, etc."
                      maxLength={50}
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      placeholder="Descripción opcional del método de pago"
                      maxLength={200}
                    />
                  </div>

                  {/* Estado */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => handleFormChange('isActive', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Método de pago activo
                    </label>
                  </div>

                  {/* Nota informativa */}
                  <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Los métodos de pago inactivos no aparecerán en los formularios de registro
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {editingMethod ? 'Actualizar' : 'Crear'}
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

export default PaymentMethodManagement;
