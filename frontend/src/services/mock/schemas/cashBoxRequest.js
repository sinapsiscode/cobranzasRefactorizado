// Esquema para solicitudes de apertura de caja
export const CashBoxRequestSchema = {
  id: { type: 'string', required: true },
  collectorId: { type: 'string', required: true },
  collectorName: { type: 'string', required: true },
  requestDate: { type: 'date', required: true },
  workDate: { type: 'date', required: true }, // Fecha para la cual solicita la caja
  status: { 
    type: 'enum', 
    values: ['pending', 'approved', 'rejected', 'cancelled'], 
    required: true 
  },
  requestedInitialCash: {
    type: 'object',
    properties: {
      efectivo: { type: 'number', min: 0 },
      digital: {
        type: 'object',
        properties: {
          yape: { type: 'number', min: 0 },
          plin: { type: 'number', min: 0 },
          transferencia: { type: 'number', min: 0 },
          otros: { type: 'number', min: 0 }
        }
      }
    },
    required: true
  },
  approvedBy: { type: 'string', required: false }, // ID del sub-admin que aprobó
  approvalDate: { type: 'date', required: false },
  rejectionReason: { type: 'string', required: false },
  notes: { type: 'string', required: false },
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() }
};

// Estados posibles de la solicitud
export const RequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Valores por defecto
export const CashBoxRequestDefaults = {
  status: RequestStatus.PENDING,
  requestedInitialCash: {
    efectivo: 0,
    digital: {
      yape: 0,
      plin: 0,
      transferencia: 0,
      otros: 0
    }
  }
};

// Validaciones específicas
export const validateCashBoxRequest = (data) => {
  const errors = {};
  
  if (!data.collectorId) {
    errors.collectorId = 'ID del cobrador es requerido';
  }
  
  if (!data.collectorName || data.collectorName.length < 2) {
    errors.collectorName = 'Nombre del cobrador es requerido';
  }
  
  if (!data.workDate) {
    errors.workDate = 'Fecha de trabajo es requerida';
  }
  
  if (!['pending', 'approved', 'rejected', 'cancelled'].includes(data.status)) {
    errors.status = 'Estado de solicitud inválido';
  }
  
  if (!data.requestedInitialCash || typeof data.requestedInitialCash !== 'object') {
    errors.requestedInitialCash = 'Montos iniciales son requeridos';
  } else {
    const { efectivo, digital } = data.requestedInitialCash;
    
    if (typeof efectivo !== 'number' || efectivo < 0) {
      errors.requestedInitialCash = 'Monto de efectivo debe ser un número positivo';
    }
    
    if (!digital || typeof digital !== 'object') {
      errors.requestedInitialCash = 'Montos digitales son requeridos';
    } else {
      const digitalFields = ['yape', 'plin', 'transferencia', 'otros'];
      for (const field of digitalFields) {
        if (typeof digital[field] !== 'number' || digital[field] < 0) {
          errors.requestedInitialCash = `Monto de ${field} debe ser un número positivo`;
          break;
        }
      }
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

// Funciones auxiliares
export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    cancelled: 'Cancelada'
  };
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Función para crear solicitud
export const createCashBoxRequest = (collectorId, collectorName, workDate, requestedInitialCash, notes = '') => {
  const now = new Date();
  return {
    id: `request-${Date.now()}-${collectorId}`,
    collectorId,
    collectorName,
    requestDate: now.toISOString(),
    workDate,
    status: RequestStatus.PENDING,
    requestedInitialCash,
    notes,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
};

// Función para aprobar solicitud
export const approveCashBoxRequest = (request, approvedBy) => {
  const now = new Date();
  return {
    ...request,
    status: RequestStatus.APPROVED,
    approvedBy,
    approvalDate: now.toISOString(),
    updatedAt: now.toISOString()
  };
};

// Función para rechazar solicitud
export const rejectCashBoxRequest = (request, rejectionReason, rejectedBy) => {
  const now = new Date();
  return {
    ...request,
    status: RequestStatus.REJECTED,
    rejectionReason,
    approvedBy: rejectedBy, // Quien procesó la solicitud
    approvalDate: now.toISOString(),
    updatedAt: now.toISOString()
  };
};