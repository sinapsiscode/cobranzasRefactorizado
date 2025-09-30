import React, { useEffect, useState } from 'react';
import {
  Settings,
  CreditCard,
  Smartphone,
  Building2,
  MapPin,
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { usePaymentMethodStore } from '../../stores/paymentMethodStore';
import { useNotificationStore } from '../../stores/notificationStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PaymentMethodSettings = () => {
  const {
    paymentMethods,
    fetchPaymentMethods,
    updatePaymentMethod,
    uploadQRCode,
    addBankAccount,
    removeBankAccount,
    addPaymentPoint,
    removePaymentPoint,
    isLoading,
    hasError,
    error
  } = usePaymentMethodStore();

  const { addNotification } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('cash');
  const [formData, setFormData] = useState({});
  const [newBankAccount, setNewBankAccount] = useState({
    bankName: '',
    accountNumber: '',
    cci: '',
    holderName: ''
  });
  const [newPaymentPoint, setNewPaymentPoint] = useState({
    name: '',
    address: '',
    hours: '',
    phone: ''
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  useEffect(() => {
    if (paymentMethods) {
      setFormData(JSON.parse(JSON.stringify(paymentMethods)));
    }
  }, [paymentMethods]);

  const handleMethodToggle = (methodType) => {
    setFormData(prev => ({
      ...prev,
      [methodType]: {
        ...prev[methodType],
        enabled: !prev[methodType]?.enabled
      }
    }));
  };

  const handleInputChange = (methodType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [methodType]: {
        ...prev[methodType],
        [field]: value
      }
    }));
  };

  const handleQRUpload = async (methodType, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        message: 'Por favor selecciona un archivo de imagen válido'
      });
      return;
    }

    try {
      const qrUrl = await uploadQRCode(methodType, file);
      setFormData(prev => ({
        ...prev,
        [methodType]: {
          ...prev[methodType],
          qrCode: qrUrl
        }
      }));

      addNotification({
        type: 'success',
        message: 'Código QR subido exitosamente'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Error al subir el código QR'
      });
    }
  };

  const handleSave = async (methodType) => {
    try {
      await updatePaymentMethod(methodType, formData[methodType]);
      addNotification({
        type: 'success',
        message: 'Configuración guardada exitosamente'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Error al guardar la configuración'
      });
    }
  };

  const handleAddBankAccount = async () => {
    if (!newBankAccount.bankName || !newBankAccount.accountNumber || !newBankAccount.holderName) {
      addNotification({
        type: 'error',
        message: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    try {
      await addBankAccount(newBankAccount);
      setNewBankAccount({
        bankName: '',
        accountNumber: '',
        cci: '',
        holderName: ''
      });
      addNotification({
        type: 'success',
        message: 'Cuenta bancaria agregada exitosamente'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Error al agregar cuenta bancaria'
      });
    }
  };

  const handleAddPaymentPoint = async () => {
    if (!newPaymentPoint.name || !newPaymentPoint.address) {
      addNotification({
        type: 'error',
        message: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    try {
      await addPaymentPoint(newPaymentPoint);
      setNewPaymentPoint({
        name: '',
        address: '',
        hours: '',
        phone: ''
      });
      addNotification({
        type: 'success',
        message: 'Punto de pago agregado exitosamente'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Error al agregar punto de pago'
      });
    }
  };

  const tabs = [
    { id: 'cash', label: 'Efectivo', icon: MapPin },
    { id: 'bank_transfer', label: 'Transferencia', icon: Building2 },
    { id: 'yape', label: 'Yape', icon: Smartphone },
    { id: 'plin', label: 'Plin', icon: Smartphone }
  ];

  if (isLoading()) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="large" text="Cargando configuración..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Métodos de Pago</h1>
          <p className="text-gray-600">Configura los métodos de pago disponibles para los clientes</p>
        </div>
      </div>

      {/* Error Alert */}
      {hasError() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Yape Configuration */}
        {activeTab === 'yape' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Yape</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.yape?.enabled || false}
                  onChange={() => handleMethodToggle('yape')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Activar Yape</span>
              </label>
            </div>

            {formData.yape?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de teléfono *
                    </label>
                    <input
                      type="text"
                      value={formData.yape?.phoneNumber || ''}
                      onChange={(e) => handleInputChange('yape', 'phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="999 999 999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del titular *
                    </label>
                    <input
                      type="text"
                      value={formData.yape?.holderName || ''}
                      onChange={(e) => handleInputChange('yape', 'holderName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instrucciones para el cliente
                    </label>
                    <textarea
                      value={formData.yape?.instructions || ''}
                      onChange={(e) => handleInputChange('yape', 'instructions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      rows="3"
                      placeholder="Instrucciones adicionales..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código QR
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {formData.yape?.qrCode ? (
                        <div className="space-y-3">
                          <img
                            src={formData.yape.qrCode}
                            alt="QR Yape"
                            className="mx-auto h-32 w-32 object-contain"
                          />
                          <button
                            onClick={() => handleInputChange('yape', 'qrCode', null)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Eliminar QR
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div>
                            <label className="cursor-pointer text-primary hover:text-blue-600">
                              <span>Subir código QR</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleQRUpload('yape', e.target.files[0])}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.yape?.enabled && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('yape')}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Configuración</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Plin Configuration */}
        {activeTab === 'plin' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Plin</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.plin?.enabled || false}
                  onChange={() => handleMethodToggle('plin')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Activar Plin</span>
              </label>
            </div>

            {formData.plin?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de teléfono *
                    </label>
                    <input
                      type="text"
                      value={formData.plin?.phoneNumber || ''}
                      onChange={(e) => handleInputChange('plin', 'phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="999 999 999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del titular *
                    </label>
                    <input
                      type="text"
                      value={formData.plin?.holderName || ''}
                      onChange={(e) => handleInputChange('plin', 'holderName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instrucciones para el cliente
                    </label>
                    <textarea
                      value={formData.plin?.instructions || ''}
                      onChange={(e) => handleInputChange('plin', 'instructions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      rows="3"
                      placeholder="Instrucciones adicionales..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código QR
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {formData.plin?.qrCode ? (
                        <div className="space-y-3">
                          <img
                            src={formData.plin.qrCode}
                            alt="QR Plin"
                            className="mx-auto h-32 w-32 object-contain"
                          />
                          <button
                            onClick={() => handleInputChange('plin', 'qrCode', null)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Eliminar QR
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div>
                            <label className="cursor-pointer text-primary hover:text-blue-600">
                              <span>Subir código QR</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleQRUpload('plin', e.target.files[0])}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.plin?.enabled && (
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('plin')}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Configuración</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bank Transfer Configuration */}
        {activeTab === 'bank_transfer' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Transferencias Bancarias</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.bank_transfer?.enabled || false}
                  onChange={() => handleMethodToggle('bank_transfer')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Activar Transferencias</span>
              </label>
            </div>

            {formData.bank_transfer?.enabled && (
              <div className="space-y-6">
                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrucciones para el cliente
                  </label>
                  <textarea
                    value={formData.bank_transfer?.instructions || ''}
                    onChange={(e) => handleInputChange('bank_transfer', 'instructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    rows="3"
                    placeholder="Instrucciones para realizar transferencias bancarias..."
                  />
                </div>

                {/* Existing Bank Accounts */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Cuentas Bancarias</h4>
                  <div className="space-y-3">
                    {formData.bank_transfer?.accounts?.map((account) => (
                      <div key={account.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Banco:</span>
                              <p className="text-gray-900">{account.bankName}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Cuenta:</span>
                              <p className="text-gray-900">{account.accountNumber}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">CCI:</span>
                              <p className="text-gray-900">{account.cci || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Titular:</span>
                              <p className="text-gray-900">{account.holderName}</p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeBankAccount(account.id)}
                          className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Bank Account */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Agregar Nueva Cuenta</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Banco *
                      </label>
                      <select
                        value={newBankAccount.bankName}
                        onChange={(e) => setNewBankAccount(prev => ({ ...prev, bankName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      >
                        <option value="">Seleccionar banco</option>
                        <option value="BCP">Banco de Crédito del Perú (BCP)</option>
                        <option value="BBVA">BBVA Continental</option>
                        <option value="Interbank">Interbank</option>
                        <option value="Scotiabank">Scotiabank</option>
                        <option value="BanBif">BanBif</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de cuenta *
                      </label>
                      <input
                        type="text"
                        value={newBankAccount.accountNumber}
                        onChange={(e) => setNewBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="0000-0000-0000-000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código CCI
                      </label>
                      <input
                        type="text"
                        value={newBankAccount.cci}
                        onChange={(e) => setNewBankAccount(prev => ({ ...prev, cci: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="00000000000000000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Titular de la cuenta *
                      </label>
                      <input
                        type="text"
                        value={newBankAccount.holderName}
                        onChange={(e) => setNewBankAccount(prev => ({ ...prev, holderName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Nombre completo"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleAddBankAccount}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar Cuenta</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave('bank_transfer')}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar Configuración</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cash Configuration */}
        {activeTab === 'cash' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Configuración de Pagos en Efectivo</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.cash?.enabled || false}
                  onChange={() => handleMethodToggle('cash')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm font-medium text-gray-900">Activar Pagos en Efectivo</span>
              </label>
            </div>

            {formData.cash?.enabled && (
              <div className="space-y-6">
                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrucciones para el cliente
                  </label>
                  <textarea
                    value={formData.cash?.instructions || ''}
                    onChange={(e) => handleInputChange('cash', 'instructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    rows="3"
                    placeholder="Instrucciones para realizar pagos en efectivo..."
                  />
                </div>

                {/* Existing Payment Points */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Puntos de Pago</h4>
                  <div className="space-y-3">
                    {formData.cash?.paymentPoints?.map((point) => (
                      <div key={point.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Nombre:</span>
                              <p className="text-gray-900">{point.name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Dirección:</span>
                              <p className="text-gray-900">{point.address}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Horarios:</span>
                              <p className="text-gray-900">{point.hours || 'No especificado'}</p>
                            </div>
                            {point.phone && (
                              <div>
                                <span className="font-medium text-gray-700">Teléfono:</span>
                                <p className="text-gray-900">{point.phone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removePaymentPoint(point.id)}
                          className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add New Payment Point */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Agregar Nuevo Punto de Pago</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del punto *
                      </label>
                      <input
                        type="text"
                        value={newPaymentPoint.name}
                        onChange={(e) => setNewPaymentPoint(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Oficina Principal"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        value={newPaymentPoint.address}
                        onChange={(e) => setNewPaymentPoint(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Av. Principal 123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horarios de atención
                      </label>
                      <input
                        type="text"
                        value={newPaymentPoint.hours}
                        onChange={(e) => setNewPaymentPoint(prev => ({ ...prev, hours: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Lun-Vie 9:00-18:00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={newPaymentPoint.phone}
                        onChange={(e) => setNewPaymentPoint(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="999 999 999"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleAddPaymentPoint}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar Punto</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave('cash')}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Guardar Configuración</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodSettings;