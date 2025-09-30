// Esquema de Cliente según especificaciones de leer.md
export const ClientSchema = {
  id: { type: 'string', required: true },
  fullName: { type: 'string', required: true, minLength: 3, maxLength: 100 },
  dni: { type: 'string', required: true, pattern: /^\d{8}$/ },
  phone: { type: 'string', required: true, pattern: /^\+51\d{9}$/ },
  email: { type: 'email', required: false },
  address: { type: 'string', required: true, minLength: 10, maxLength: 200 },
  neighborhood: { type: 'string', required: true, minLength: 2, maxLength: 50 },
  servicePlan: { type: 'enum', values: ['basic', 'standard', 'premium'], required: true },
  serviceType: { type: 'enum', values: ['internet', 'cable', 'duo'], required: true }, // Tipo de servicio principal (mantener por compatibilidad)
  services: { type: 'array', default: [], values: ['internet', 'cable'] }, // Array de servicios para soportar DUO
  installationDate: { type: 'date', required: true },
  preferredPaymentDay: { type: 'number', min: 1, max: 31, required: true },
  
  // Sistema de estados del cliente
  status: { type: 'enum', values: ['active', 'terminated', 'debt', 'paused', 'suspended'], required: true },
  statusHistory: { type: 'array', default: [] }, // Historial de cambios de estado
  statusReason: { type: 'string', required: false, maxLength: 500 }, // Razón del estado actual
  
  // Control de pausa automática  
  pauseStartDate: { type: 'date', required: false }, // Fecha inicio de pausa
  pauseEndDate: { type: 'date', required: false }, // Fecha estimada fin de pausa
  pauseReason: { type: 'string', required: false, maxLength: 500 },
  
  // Sistema de archivo e historial
  isArchived: { type: 'boolean', default: false },
  archivedDate: { type: 'date', required: false },
  previousClientId: { type: 'string', required: false }, // Cliente anterior (si regresó)
  clientVersions: { type: 'array', default: [] }, // IDs de versiones anteriores
  
  // Deudas preservadas (nunca se borran)
  preservedDebts: { type: 'array', default: [] }, // Deudas de estados anteriores
  
  isActive: { type: 'boolean', default: true }, // Mantener por compatibilidad
  lastLogin: { type: 'date', required: false }, // Último acceso del cliente
  reactivationDate: { type: 'date', required: false }, // Última reactivación
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() }
};

// Valores por defecto
export const ClientDefaults = {
  isActive: true,
  servicePlan: 'basic',
  serviceType: 'internet',
  preferredPaymentDay: 15,
  status: 'active',
  statusHistory: [],
  isArchived: false,
  clientVersions: [],
  preservedDebts: []
};

// Validaciones específicas
export const validateClient = (data) => {
  const errors = {};
  
  if (!data.fullName || data.fullName.length < 3) {
    errors.fullName = 'Nombre debe tener al menos 3 caracteres';
  }
  
  if (!data.dni || !/^\d{8}$/.test(data.dni)) {
    errors.dni = 'DNI debe tener 8 dígitos';
  }
  
  if (!data.phone || !/^\+51\d{9}$/.test(data.phone)) {
    errors.phone = 'Teléfono debe ser formato +51XXXXXXXXX';
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Email inválido';
  }
  
  if (!data.address || data.address.length < 10) {
    errors.address = 'Dirección debe tener al menos 10 caracteres';
  }
  
  if (!data.neighborhood || data.neighborhood.length < 2) {
    errors.neighborhood = 'Barrio debe tener al menos 2 caracteres';
  }
  
  if (!['basic', 'standard', 'premium'].includes(data.servicePlan)) {
    errors.servicePlan = 'Plan de servicio inválido';
  }

  if (!['internet', 'cable', 'duo'].includes(data.serviceType)) {
    errors.serviceType = 'Tipo de servicio inválido';
  }
  
  if (!data.preferredPaymentDay || data.preferredPaymentDay < 1 || data.preferredPaymentDay > 31) {
    errors.preferredPaymentDay = 'Día de pago debe estar entre 1 y 31';
  }

  if (!['active', 'terminated', 'debt', 'paused', 'suspended'].includes(data.status)) {
    errors.status = 'Estado del cliente inválido';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Funciones auxiliares para estados
export const getStatusLabel = (status) => {
  const labels = {
    active: 'Activo',
    terminated: 'Baja',
    debt: 'Con Deuda',
    paused: 'En Pausa',
    suspended: 'Suspendido'
  };
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    terminated: 'bg-gray-100 text-gray-800',
    debt: 'bg-red-100 text-red-800',
    paused: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-orange-100 text-orange-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Funciones para tipo de servicio
export const getServiceTypeLabel = (serviceType) => {
  const labels = {
    internet: 'Internet',
    cable: 'Cable/TV',
    duo: 'Dúo (Internet + Cable)'
  };
  return labels[serviceType] || serviceType;
};

export const getServiceTypeColor = (serviceType) => {
  const colors = {
    internet: 'bg-blue-100 text-blue-800',
    cable: 'bg-purple-100 text-purple-800',
    duo: 'bg-indigo-100 text-indigo-800'
  };
  return colors[serviceType] || 'bg-gray-100 text-gray-800';
};

// Función para cambiar estado del cliente
export const changeClientStatus = (client, newStatus, reason = '', adminId = null) => {
  const now = new Date().toISOString();
  
  // Agregar al historial
  const historyEntry = {
    fromStatus: client.status,
    toStatus: newStatus,
    date: now,
    reason: reason,
    changedBy: adminId
  };
  
  const updatedClient = {
    ...client,
    status: newStatus,
    statusReason: reason,
    statusHistory: [...client.statusHistory, historyEntry],
    updatedAt: now
  };

  // Lógica específica según el nuevo estado
  if (newStatus === 'paused') {
    updatedClient.pauseStartDate = now;
    updatedClient.pauseReason = reason;
    // La fecha de fin se puede estimar o dejar vacía
  } else if (newStatus === 'terminated' && client.status === 'paused') {
    // Baja automática por pausa prolongada
    updatedClient.isArchived = true;
    updatedClient.archivedDate = now;
  }

  return updatedClient;
};

// Función específica para reactivar un cliente dado de baja
export const reactivateClient = (client, reason = '', adminId = null) => {
  if (client.status !== 'terminated') {
    throw new Error('Solo se pueden reactivar clientes dados de baja');
  }
  
  const now = new Date().toISOString();
  
  // Crear entrada del historial de reactivación
  const reactivationEntry = {
    fromStatus: 'terminated',
    toStatus: 'active',
    date: now,
    reason: reason || 'Cliente reactivado',
    changedBy: adminId,
    isReactivation: true // Marca especial para reactivaciones
  };
  
  const reactivatedClient = {
    ...client,
    status: 'active',
    statusReason: reason || 'Cliente reactivado',
    statusHistory: [...client.statusHistory, reactivationEntry],
    isActive: true,
    isArchived: false,
    archivedDate: null,
    // Mantener referencia al historial previo
    reactivationDate: now,
    updatedAt: now
  };
  
  return reactivatedClient;
};