import React, { useState } from 'react';
import { Wallet, Clock, Eye, Settings } from 'lucide-react';
import CashBoxRequestsPanel from '../../components/subadmin/CashBoxRequestsPanel';
import CashBoxSupervisor from '../../components/subadmin/CashBoxSupervisor';

const CashBoxManagement = () => {
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Cajas</h1>
        <p className="text-gray-600">Aprobar solicitudes y supervisar cajas de los cobradores</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Solicitudes</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('supervisor')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'supervisor'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Supervisión</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Contenido de las tabs */}
      <div>
        {activeTab === 'requests' && <CashBoxRequestsPanel />}
        {activeTab === 'supervisor' && <CashBoxSupervisor />}
      </div>
    </div>
  );
};

export default CashBoxManagement;