import React, { useState } from 'react';
import { X, DollarSign, User, MapPin, Calendar, FileText, Tag, Clock, MessageCircle, ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';
import { getTarifaLabel, getTarifaColor } from '../../schemas/clientExtended';

const ClientExtendedDetails = ({ client, extendedData, debtSummary, onClose }) => {
  if (!client) return null;

  // Estado para manejar secciones expandibles
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: true,
    financial: true,
    debt: true,
    references: false,
    system: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Función helper para dividir fullName en apellidos y nombres
  const splitFullName = (fullName) => {
    if (!fullName) return { nombres: 'No especificado', apellidos: 'No especificado' };

    const parts = fullName.trim().split(' ').filter(Boolean);

    if (parts.length === 0) {
      return { nombres: 'No especificado', apellidos: 'No especificado' };
    } else if (parts.length === 1) {
      return { nombres: parts[0], apellidos: '' };
    } else if (parts.length === 2) {
      // Asumimos: Nombre Apellido
      return { nombres: parts[0], apellidos: parts[1] };
    } else if (parts.length === 3) {
      // Asumimos: Nombre Apellido1 Apellido2
      return { nombres: parts[0], apellidos: parts.slice(1).join(' ') };
    } else {
      // 4 o más palabras: primeras dos son nombres, resto apellidos
      return { nombres: parts.slice(0, 2).join(' '), apellidos: parts.slice(2).join(' ') };
    }
  };

  // Obtener apellidos y nombres con fallback
  const { nombres: clientNombres, apellidos: clientApellidos } = extendedData?.apellidos || extendedData?.nombres
    ? { nombres: extendedData.nombres, apellidos: extendedData.apellidos }
    : splitFullName(client.fullName);

  // Calcular costo efectivo del plan
  const getDefaultCost = (plan) => {
    const costs = {
      basic: 50,
      standard: 80,
      premium: 120
    };
    return costs[plan] || 80;
  };

  const effectiveCost = extendedData?.costoMensual || getDefaultCost(client.servicePlan);

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full h-screen sm:h-auto sm:max-w-2xl md:max-w-4xl lg:max-w-5xl sm:max-h-[90vh] flex flex-col">

        {/* Header Grande para Móvil */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 z-10 shadow-sm">
          <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex-1 min-w-0 pr-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {client.fullName}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-sm sm:text-base text-gray-600">
                <span className="font-medium">ID: #{extendedData?.externalId || client.id}</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span className="font-medium">{client.dni || 'Sin DNI'}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {client.phone && (
                <button
                  onClick={() => openWhatsApp(client.phone)}
                  className="flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 bg-green-500 text-white rounded-xl sm:rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors shadow-md"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-6 w-6 sm:h-5 sm:w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-12 h-12 sm:w-10 sm:h-10 bg-gray-500 text-white rounded-xl sm:rounded-lg hover:bg-gray-600 active:bg-gray-700 transition-colors shadow-md"
                title="Cerrar"
              >
                <X className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal con scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

            {/* Resumen Rápido - Móvil Optimizado */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Plan</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 capitalize">{client.servicePlan}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Servicio</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 capitalize">{client.serviceType}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Deuda</p>
                  <p className={`text-base sm:text-lg font-bold ${debtSummary?.monthsOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {debtSummary?.monthsOwed > 0 ? `${debtSummary.monthsOwed} meses` : 'Al día'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">Costo</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">S/. {effectiveCost}</p>
                </div>
              </div>
            </div>

            {/* Secciones Expandibles - Móvil Optimizado */}
            {/* Datos Básicos */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
              <button
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between p-5 sm:p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[60px]"
              >
                <div className="flex items-center">
                  <User className="h-6 w-6 sm:h-5 sm:w-5 mr-4 sm:mr-3 text-blue-600 flex-shrink-0" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Datos Básicos</h3>
                </div>
                {expandedSections.basic ?
                  <ChevronUp className="h-6 w-6 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" /> :
                  <ChevronDown className="h-6 w-6 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                }
              </button>
              {expandedSections.basic && (
                <div className="px-4 sm:px-6 pb-6 border-t-2 border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-1 gap-5 mt-6">
                    <div>
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Apellidos</label>
                      <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-white rounded-lg border-2 border-gray-200 font-medium">{clientApellidos || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Nombres</label>
                      <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-white rounded-lg border-2 border-gray-200 font-medium">{clientNombres || 'No especificado'}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">DNI</label>
                        <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-white rounded-lg border-2 border-gray-200 font-medium">{client.dni || 'No especificado'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Teléfono Principal</label>
                        {client.phone ? (
                          <button
                            onClick={() => openWhatsApp(client.phone)}
                            className="w-full flex items-center justify-center space-x-3 text-white bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors py-4 px-4 rounded-lg border-2 border-green-600 min-h-[52px] font-semibold"
                          >
                            <MessageCircle className="h-5 w-5 flex-shrink-0" />
                            <span className="text-base truncate">{client.phone}</span>
                          </button>
                        ) : (
                          <p className="text-base text-gray-400 py-3 px-4 bg-white rounded-lg border-2 border-gray-200">No especificado</p>
                        )}
                      </div>
                    </div>
                    {client.phone2 && (
                      <div>
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Teléfono Secundario</label>
                        <button
                          onClick={() => openWhatsApp(client.phone2)}
                          className="w-full flex items-center justify-center space-x-3 text-white bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors py-4 px-4 rounded-lg border-2 border-green-600 min-h-[52px] font-semibold"
                        >
                          <MessageCircle className="h-5 w-5 flex-shrink-0" />
                          <span className="text-base truncate">{client.phone2}</span>
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Email</label>
                      <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-white rounded-lg border-2 border-gray-200 break-all font-medium">{client.email || 'No especificado'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ubicación y Servicio */}
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
              <button
                onClick={() => toggleSection('location')}
                className="w-full flex items-center justify-between p-5 sm:p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[60px]"
              >
                <div className="flex items-center">
                  <MapPin className="h-6 w-6 sm:h-5 sm:w-5 mr-4 sm:mr-3 text-green-600 flex-shrink-0" />
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Ubicación y Servicio</h3>
                </div>
                {expandedSections.location ?
                  <ChevronUp className="h-6 w-6 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" /> :
                  <ChevronDown className="h-6 w-6 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                }
              </button>
              {expandedSections.location && (
                <div className="px-4 sm:px-6 pb-6 border-t-2 border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-1 gap-5 mt-6">
                    <div>
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Barrio</label>
                      <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-white rounded-lg border-2 border-gray-200 font-medium">{client.neighborhood || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Dirección Completa</label>
                      <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-white rounded-lg border-2 border-gray-200 break-words font-medium">{client.address || 'No especificado'}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Plan</label>
                        <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-blue-50 rounded-lg border-2 border-blue-300 capitalize font-bold">{client.servicePlan}</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Tipo de Servicio</label>
                        <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-blue-50 rounded-lg border-2 border-blue-300 capitalize font-bold">{client.serviceType}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-700 uppercase tracking-wider block mb-2">Fecha Instalación</label>
                      <p className="text-base sm:text-lg text-gray-900 py-3 px-4 bg-white rounded-lg border-2 border-gray-200 font-medium">
                        {client.installationDate ?
                          new Date(client.installationDate).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          }) :
                          'No especificado'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Información Financiera */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('financial')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-target"
              >
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-3 text-green-600 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Información Financiera</h3>
                </div>
                {expandedSections.financial ?
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" /> :
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                }
              </button>
              {expandedSections.financial && (
                <div className="px-3 sm:px-4 pb-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Costo Mensual</label>
                      <p className="text-lg font-semibold text-green-600">
                        S/. {effectiveCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Costo Instalación</label>
                      <p className="text-lg font-semibold text-blue-600">
                        S/. {(extendedData?.costoInstalacion || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Tipo de Tarifa</label>
                      <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-lg w-full justify-center ${getTarifaColor(extendedData?.tipoTarifa || 'standard')}`}>
                        {getTarifaLabel(extendedData?.tipoTarifa || 'standard')}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Condición</label>
                      <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-lg w-full justify-center ${
                        extendedData?.condicionOriginal === 'GRATUITO' ? 'bg-green-100 text-green-800 border border-green-200' :
                        extendedData?.condicionOriginal === 'ACTIVO' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {extendedData?.condicionOriginal || 'No especificado'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Estado de Deudas */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('debt')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-target"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <Clock className="h-5 w-5 mr-3 text-orange-600 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mr-2">Estado de Deudas</h3>
                  {debtSummary?.monthsOwed > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0">
                      {debtSummary.monthsOwed}m
                    </span>
                  )}
                </div>
                {expandedSections.debt ?
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" /> :
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                }
              </button>
              {expandedSections.debt && (
                <div className="px-3 sm:px-4 pb-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className={`rounded-lg p-3 border ${debtSummary?.monthsOwed > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Meses Adeudados</label>
                      <p className={`text-xl font-bold ${debtSummary?.monthsOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {debtSummary?.monthsOwed || 0} meses
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${debtSummary?.monthsOwed > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Deuda Total</label>
                      <p className={`text-xl font-bold ${debtSummary?.monthsOwed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        S/. {(typeof debtSummary?.balance === 'number' && !isNaN(debtSummary.balance)) ? debtSummary.balance.toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Deuda Más Antigua</label>
                      <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border">
                        {debtSummary?.oldestDebt || 'Sin deudas'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Último Pago</label>
                      <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border">
                        {debtSummary?.lastPayment ?
                          new Date(debtSummary.lastPayment).toLocaleDateString('es-PE') :
                          'Sin pagos registrados'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Referencias y Observaciones */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('references')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-target"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Referencias y Observaciones</h3>
                </div>
                {expandedSections.references ?
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" /> :
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                }
              </button>
              {expandedSections.references && (
                <div className="px-3 sm:px-4 pb-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Referencia</label>
                      <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded border min-h-[2.5rem] break-words">
                        {extendedData?.referencia || 'Sin referencias'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Observaciones</label>
                      <div className="text-sm text-gray-900 p-3 bg-gray-50 rounded border min-h-[2.5rem] break-words">
                        {extendedData?.observaciones || 'Sin observaciones registradas'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Información del Sistema */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggleSection('system')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-target"
              >
                <div className="flex items-center">
                  <Tag className="h-5 w-5 mr-3 text-indigo-600 flex-shrink-0" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Información del Sistema</h3>
                </div>
                {expandedSections.system ?
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" /> :
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                }
              </button>
              {expandedSections.system && (
                <div className="px-3 sm:px-4 pb-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 gap-4 mt-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Estado Actual</label>
                      <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border capitalize font-medium">{client.status || 'active'}</p>
                    </div>
                    {client.statusReason && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Motivo de Estado</label>
                        <p className="text-sm text-gray-900 py-2 px-3 bg-yellow-50 rounded border border-yellow-200">{client.statusReason}</p>
                      </div>
                    )}
                    {client.status === 'paused' && client.pauseReason && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Motivo de Pausa</label>
                        <p className="text-sm text-gray-900 py-2 px-3 bg-orange-50 rounded border border-orange-200">{client.pauseReason}</p>
                      </div>
                    )}
                    {client.status === 'paused' && client.pauseStartDate && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Fecha de Pausa</label>
                        <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border">
                          {new Date(client.pauseStartDate).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {client.reactivationDate && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Fecha de Reactivación</label>
                        <p className="text-sm text-gray-900 py-2 px-3 bg-green-50 rounded border border-green-200">
                          {new Date(client.reactivationDate).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {client.lastLogin && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Último Acceso</label>
                        <p className="text-sm text-gray-900 py-2 px-3 bg-blue-50 rounded border border-blue-200">
                          {new Date(client.lastLogin).toLocaleString('es-PE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Origen de Datos</label>
                      <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border">
                        {extendedData?.importedFrom === 'excel' ? 'Excel BD ABONADOS' : 'Creado Manual'}
                      </p>
                    </div>
                    {extendedData?.importDate && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Fecha Importación</label>
                        <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border">
                          {new Date(extendedData.importDate).toLocaleDateString('es-PE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {extendedData?.externalId && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">ID Externo</label>
                        <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border font-mono">#{extendedData.externalId}</p>
                      </div>
                    )}
                    {client.isArchived && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Estado de Archivo</label>
                        <p className="text-sm text-red-700 py-2 px-3 bg-red-50 rounded border border-red-200 font-medium">
                          Archivado {client.archivedDate && `el ${new Date(client.archivedDate).toLocaleDateString('es-PE')}`}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Día Preferido de Pago</label>
                      <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border">Día {client.preferredPaymentDay || '15'} del mes</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1">Días para Vencimiento</label>
                      <p className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded border">{client.paymentDueDays || '5'} días</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Grande para Móvil */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-300 p-4 sm:p-6 shadow-2xl">
          {/* Acciones rápidas prominentes */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mb-4">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center justify-center gap-3 p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 transition-colors text-base font-bold shadow-lg min-h-[56px]"
              >
                <Mail className="h-5 w-5 flex-shrink-0" />
                <span>Email</span>
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center justify-center gap-3 p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 active:bg-green-700 transition-colors text-base font-bold shadow-lg min-h-[56px]"
              >
                <Phone className="h-5 w-5 flex-shrink-0" />
                <span>Llamar</span>
              </a>
            )}
          </div>

          {/* Controles grandes de vista */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3 flex-1">
              <button
                onClick={() => {
                  // Colapsar todas las secciones
                  setExpandedSections({
                    basic: false,
                    location: false,
                    financial: false,
                    debt: false,
                    references: false,
                    system: false
                  });
                }}
                className="flex-1 sm:flex-none px-6 py-4 bg-gray-400 text-white rounded-xl hover:bg-gray-500 active:bg-gray-600 transition-colors text-base font-bold shadow-lg min-h-[56px]"
              >
                Colapsar Todo
              </button>
              <button
                onClick={() => {
                  // Expandir todas las secciones
                  setExpandedSections({
                    basic: true,
                    location: true,
                    financial: true,
                    debt: true,
                    references: true,
                    system: true
                  });
                }}
                className="flex-1 sm:flex-none px-6 py-4 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 active:bg-indigo-700 transition-colors text-base font-bold shadow-lg min-h-[56px]"
              >
                Expandir Todo
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-4 bg-red-500 text-white rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors text-lg font-black shadow-lg min-h-[56px]"
            >
              CERRAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientExtendedDetails;