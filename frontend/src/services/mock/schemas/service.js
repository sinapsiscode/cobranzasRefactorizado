// Esquema de Servicio para gestión por Administradores
export const ServiceSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  description: { type: 'string', required: false, maxLength: 500 },
  serviceType: { type: 'enum', values: ['internet', 'cable', 'duo'], required: true },
  category: { type: 'enum', values: ['basic', 'standard', 'premium'], required: true },
  price: { type: 'number', required: true, min: 0 },
  
  // Características técnicas del servicio
  features: {
    type: 'object',
    properties: {
      speed: { type: 'string', required: false }, // Ej: "100 Mbps", "50 canales HD"
      bandwidth: { type: 'string', required: false },
      channels: { type: 'number', required: false }, // Para cable/TV
      extras: { type: 'array', default: [] } // Servicios adicionales
    }
  },
  
  // Estado y disponibilidad
  isActive: { type: 'boolean', default: true },
  isAvailable: { type: 'boolean', default: true }, // Disponible para nuevos clientes
  
  // Configuración de instalación
  installationFee: { type: 'number', default: 0 },
  contractDuration: { type: 'number', default: 12 }, // meses
  
  // Metadatos
  createdBy: { type: 'string', required: false }, // ID del admin que lo creó
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() }
};

// Valores por defecto
export const ServiceDefaults = {
  isActive: true,
  isAvailable: true,
  installationFee: 0,
  contractDuration: 12,
  features: {
    speed: '',
    bandwidth: '',
    channels: 0,
    extras: []
  }
};

// Validaciones específicas
export const validateService = (data) => {
  const errors = {};
  
  if (!data.name || data.name.length < 2) {
    errors.name = 'Nombre debe tener al menos 2 caracteres';
  }
  
  if (!['internet', 'cable', 'duo'].includes(data.serviceType)) {
    errors.serviceType = 'Tipo de servicio inválido';
  }
  
  if (!['basic', 'standard', 'premium'].includes(data.category)) {
    errors.category = 'Categoría de servicio inválida';
  }
  
  if (!data.price || data.price < 0) {
    errors.price = 'Precio debe ser mayor o igual a 0';
  }
  
  if (data.installationFee && data.installationFee < 0) {
    errors.installationFee = 'Costo de instalación debe ser mayor o igual a 0';
  }
  
  if (data.contractDuration && (data.contractDuration < 1 || data.contractDuration > 60)) {
    errors.contractDuration = 'Duración de contrato debe estar entre 1 y 60 meses';
  }
  
  if (data.description && data.description.length > 500) {
    errors.description = 'Descripción no puede exceder 500 caracteres';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Funciones para etiquetas y colores
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
    duo: 'bg-green-100 text-green-800'
  };
  return colors[serviceType] || 'bg-gray-100 text-gray-800';
};

export const getCategoryLabel = (category) => {
  const labels = {
    basic: 'Básico',
    standard: 'Estándar',
    premium: 'Premium'
  };
  return labels[category] || category;
};

export const getCategoryColor = (category) => {
  const colors = {
    basic: 'bg-gray-100 text-gray-800',
    standard: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

export const getServiceStatusColor = (isActive, isAvailable) => {
  if (!isActive) return 'bg-red-100 text-red-800';
  if (!isAvailable) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

export const getServiceStatusLabel = (isActive, isAvailable) => {
  if (!isActive) return 'Inactivo';
  if (!isAvailable) return 'No Disponible';
  return 'Activo';
};

// Función para crear nuevo servicio
export const createService = (serviceData, createdBy) => {
  const now = new Date().toISOString();
  return {
    id: `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...ServiceDefaults,
    ...serviceData,
    createdBy,
    createdAt: now,
    updatedAt: now
  };
};

// Función para actualizar servicio
export const updateService = (service, updates) => {
  return {
    ...service,
    ...updates,
    updatedAt: new Date().toISOString()
  };
};