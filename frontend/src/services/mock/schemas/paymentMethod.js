// Esquema de Métodos de Pago
export const PaymentMethodSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true, minLength: 2, maxLength: 50 },
  description: { type: 'string', required: false, maxLength: 200 },
  isActive: { type: 'boolean', default: true },
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() }
};

// Valores por defecto
export const PaymentMethodDefaults = {
  isActive: true
};

// Métodos de pago iniciales
export const DefaultPaymentMethods = [
  {
    id: 'pm_efectivo',
    name: 'Efectivo',
    description: 'Pago en efectivo',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pm_transferencia',
    name: 'Transferencia',
    description: 'Transferencia bancaria',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pm_deposito',
    name: 'Depósito',
    description: 'Depósito bancario',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pm_cheque',
    name: 'Cheque',
    description: 'Pago con cheque',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Validaciones específicas
export const validatePaymentMethod = (data) => {
  const errors = {};

  if (!data.name || data.name.length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres';
  }

  if (data.name && data.name.length > 50) {
    errors.name = 'El nombre no puede exceder 50 caracteres';
  }

  if (data.description && data.description.length > 200) {
    errors.description = 'La descripción no puede exceder 200 caracteres';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
