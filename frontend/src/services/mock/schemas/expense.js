// Esquema de Gastos para el sistema de gestión de cajas
export const ExpenseSchema = {
  id: { type: 'string', required: true },
  amount: { type: 'number', required: true, min: 0 },
  concept: { type: 'string', required: true, minLength: 3, maxLength: 100 },
  serviceType: { type: 'enum', values: ['internet', 'cable', 'duo', 'general'], required: true }, // Tipo de servicio al que corresponde el gasto
  description: { type: 'string', required: false, maxLength: 500 },
  expenseDate: { type: 'date', required: true },
  registeredBy: { type: 'string', required: true }, // ID del usuario que registró el gasto
  paymentMethod: { type: 'enum', values: ['efectivo', 'transferencia', 'deposito', 'cheque'], required: true },
  receiptNumber: { type: 'string', required: false, maxLength: 50 },
  supplier: { type: 'string', required: false, maxLength: 100 },
  isRecurring: { type: 'boolean', default: false },
  status: { type: 'enum', values: ['pendiente', 'pagado', 'cancelado'], default: 'pagado' },
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() }
};

// Valores por defecto
export const ExpenseDefaults = {
  serviceType: 'general',
  paymentMethod: 'efectivo',
  status: 'pagado',
  isRecurring: false,
  expenseDate: new Date().toISOString().split('T')[0]
};

// Categorías de gastos con etiquetas
export const ExpenseCategories = {
  servicios: 'Servicios',
  mantenimiento: 'Mantenimiento',
  sueldos: 'Sueldos y Comisiones',
  oficina: 'Gastos de Oficina',
  marketing: 'Marketing y Publicidad',
  otros: 'Otros Gastos'
};

// Tipos de servicio con etiquetas
export const ServiceTypes = {
  internet: 'Internet',
  cable: 'Cable/TV',
  duo: 'Dúo (Internet + Cable)',
  general: 'General'
};

// Métodos de pago con etiquetas
export const PaymentMethods = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  deposito: 'Depósito',
  cheque: 'Cheque'
};

// Estados de gasto con etiquetas
export const ExpenseStatuses = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  cancelado: 'Cancelado'
};

// Validaciones específicas
export const validateExpense = (data) => {
  const errors = {};

  if (!data.amount || data.amount <= 0) {
    errors.amount = 'Monto debe ser mayor a 0';
  }

  if (!data.concept || data.concept.length < 3) {
    errors.concept = 'Concepto debe tener al menos 3 caracteres';
  }

  if (!data.serviceType || !Object.keys(ServiceTypes).includes(data.serviceType)) {
    errors.serviceType = 'Tipo de servicio inválido';
  }

  if (!data.expenseDate) {
    errors.expenseDate = 'Fecha de gasto es obligatoria';
  }

  if (!data.paymentMethod || !Object.keys(PaymentMethods).includes(data.paymentMethod)) {
    errors.paymentMethod = 'Método de pago inválido';
  }

  if (!data.registeredBy) {
    errors.registeredBy = 'Usuario que registra es obligatorio';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Función helper para obtener etiqueta de categoría
export const getCategoryLabel = (category) => {
  return ExpenseCategories[category] || category;
};

// Función helper para obtener etiqueta de tipo de servicio
export const getServiceTypeLabel = (serviceType) => {
  return ServiceTypes[serviceType] || serviceType;
};

// Función helper para obtener etiqueta de método de pago
export const getPaymentMethodLabel = (method) => {
  return PaymentMethods[method] || method;
};

// Función helper para obtener etiqueta de estado
export const getStatusLabel = (status) => {
  return ExpenseStatuses[status] || status;
};

// Función helper para obtener color del estado
export const getStatusColor = (status) => {
  const colors = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    pagado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};