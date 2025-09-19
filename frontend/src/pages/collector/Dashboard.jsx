import React, { useState } from 'react';
import { Users, DollarSign, CheckCircle, Clock, MapPin, Plus } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import PaymentRegistrationModal from '../../components/common/PaymentRegistrationModal';

const CollectorDashboard = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  return (
    <div className="p-4 space-y-4 sm:space-y-6">
      
      {/* Header móvil con botón de registro */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Dashboard Cobrador</h1>
          <p className="text-sm text-gray-600">Vista optimizada para trabajo en campo</p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto sm:py-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Pago
        </button>
      </div>

      {/* Resumen del día */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-base font-semibold sm:text-lg">Resumen de Hoy</h2>
            <p className="text-blue-100 text-xs sm:text-sm">Miércoles, 21 de Agosto</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold sm:text-2xl">5 de 8</p>
            <p className="text-blue-100 text-xs sm:text-sm">cobrados</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
          <div>
            <p className="text-lg font-bold sm:text-2xl">S/ 320</p>
            <p className="text-blue-100 text-xs">Recaudado</p>
          </div>
          <div>
            <p className="text-lg font-bold sm:text-2xl">3</p>
            <p className="text-blue-100 text-xs">Pendientes</p>
          </div>
          <div>
            <p className="text-lg font-bold sm:text-2xl">0</p>
            <p className="text-blue-100 text-xs">Vencidos</p>
          </div>
        </div>
      </div>

      {/* Métricas en cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <StatCard
          title="Clientes Asignados"
          value="12"
          icon={Users}
          color="blue"
        />
        
        <StatCard
          title="Meta Diaria"
          value="67%"
          icon={CheckCircle}
          color="green"
        />
      </div>


      {/* Lista de clientes del día */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 sm:text-base">Clientes de Hoy</h3>
          <button className="text-xs text-blue-600 sm:text-sm">Ver mapa</button>
        </div>
        
        <div className="divide-y divide-gray-200">
          {/* Cliente 1 - Pagado */}
          <div className="p-3 flex items-center space-x-3 sm:p-4">
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate sm:text-base">Carlos García Pérez</p>
              <p className="text-xs text-gray-500 truncate sm:text-sm">Jr. Lampa 1234, San Isidro</p>
              <p className="text-xs text-gray-400">S/ 80.00 - Plan Estándar</p>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-green-500 sm:h-5 sm:w-5" />
              <span className="text-xs text-green-600 font-medium hidden sm:inline">Pagado</span>
            </div>
          </div>
          
          {/* Cliente 2 - Pendiente */}
          <div className="p-4 flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">Ana Martínez López</p>
              <p className="text-sm text-gray-500">Av. Arequipa 567, Miraflores</p>
              <p className="text-xs text-gray-400">S/ 50.00 - Plan Básico</p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-xs text-yellow-600 font-medium">Pendiente</span>
            </div>
          </div>
          
          {/* Cliente 3 - Pendiente */}
          <div className="p-4 flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">José Rodríguez Silva</p>
              <p className="text-sm text-gray-500">Jr. de la Unión 890, Lima Cercado</p>
              <p className="text-xs text-gray-400">S/ 120.00 - Plan Premium</p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-xs text-yellow-600 font-medium">Pendiente</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button className="w-full text-center text-blue-600 text-sm font-medium hover:text-blue-800">
            Ver todos los clientes (8)
          </button>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <DollarSign className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Cobrar</span>
          </button>
          
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <MapPin className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Ubicaciones</span>
          </button>
        </div>
      </div>

      {/* Modal de registro de pagos */}
      <PaymentRegistrationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
};

export default CollectorDashboard;