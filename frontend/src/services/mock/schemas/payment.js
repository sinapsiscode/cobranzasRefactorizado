// Esquema de Pago según especificaciones de leer.md
export const PaymentSchema = {
  id: { type: 'string', required: true },
  clientId: { type: 'string', required: true },
  collectorId: { type: 'string', required: false },
  serviceType: { type: 'enum', values: ['internet', 'cable'], required: true }, // Tipo de servicio para determinar caja
  amount: { type: 'number', required: true, min: 0 },
  dueDate: { type: 'date', required: true },
  paymentDate: { type: 'date', required: false },
  status: { type: 'enum', values: ['pending', 'collected', 'validated', 'paid', 'overdue', 'partial'], required: true },
  paymentMethod: { type: 'enum', values: ['cash', 'transfer', 'deposit', 'voucher'], required: false },
  voucherUrl: { type: 'string', required: false },
  comments: { type: 'string', required: false, maxLength: 500 },
  
  // Campos de validación
  validatedBy: { type: 'string', required: false }, // ID del SubAdmin/Admin que validó
  validatedDate: { type: 'date', required: false }, // Fecha de validación
  validationComments: { type: 'string', required: false, maxLength: 500 }, // Comentarios de validación
  month: { type: 'string', required: true, pattern: /^\d{4}-\d{2}$/ }, // YYYY-MM
  year: { type: 'number', required: true },
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() }
};

// Valores por defecto
export const PaymentDefaults = {
  status: 'pending',
  paymentMethod: 'cash'
};

// Validaciones específicas
export const validatePayment = (data) => {
  const errors = {};
  
  if (!data.clientId) {
    errors.clientId = 'ID de cliente es obligatorio';
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.amount = 'Monto debe ser mayor a 0';
  }
  
  if (!data.dueDate) {
    errors.dueDate = 'Fecha de vencimiento es obligatoria';
  }
  
  if (!['internet', 'cable'].includes(data.serviceType)) {
    errors.serviceType = 'Tipo de servicio inválido';
  }

  if (!['pending', 'collected', 'validated', 'paid', 'overdue', 'partial'].includes(data.status)) {
    errors.status = 'Estado de pago inválido';
  }
  
  if (data.paymentMethod && !['cash', 'transfer', 'deposit', 'voucher'].includes(data.paymentMethod)) {
    errors.paymentMethod = 'Método de pago inválido';
  }
  
  if (!data.month || !/^\d{4}-\d{2}$/.test(data.month)) {
    errors.month = 'Mes debe tener formato YYYY-MM';
  }
  
  if (!data.year || data.year < 2020 || data.year > 2030) {
    errors.year = 'Año debe estar entre 2020 y 2030';
  }
  
  if (data.comments && data.comments.length > 500) {
    errors.comments = 'Comentarios no pueden exceder 500 caracteres';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};