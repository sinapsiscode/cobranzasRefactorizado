// Schema de validación para gastos/expenses
export const ExpenseStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid'
};

export const ExpenseCategories = {
  MAINTENANCE: 'maintenance',
  SUPPLIES: 'supplies',
  SERVICES: 'services',
  EQUIPMENT: 'equipment',
  TRANSPORT: 'transport',
  OTHER: 'other'
};

// Schema base para un gasto
export const expenseSchema = {
  id: () => `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  concept: '',
  description: '',
  amount: 0,
  expenseDate: new Date().toISOString().split('T')[0],
  category: ExpenseCategories.OTHER,
  serviceType: 'internet',
  paymentMethod: 'cash',
  supplier: '',
  receiptNumber: '',
  status: ExpenseStatuses.PENDING,
  createdBy: null,
  approvedBy: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Validación de gastos
export const validateExpense = (expense) => {
  const errors = {};

  // Validar concepto
  if (!expense.concept || expense.concept.trim() === '') {
    errors.concept = 'El concepto es requerido';
  }

  // Validar monto
  if (!expense.amount || expense.amount <= 0) {
    errors.amount = 'El monto debe ser mayor a 0';
  }

  // Validar fecha
  if (!expense.expenseDate) {
    errors.expenseDate = 'La fecha es requerida';
  }

  // Validar categoría
  if (!expense.category || !Object.values(ExpenseCategories).includes(expense.category)) {
    errors.category = 'Categoría inválida';
  }

  // Validar estado
  if (!expense.status || !Object.values(ExpenseStatuses).includes(expense.status)) {
    errors.status = 'Estado inválido';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Helpers
export const getExpenseStatusLabel = (status) => {
  const labels = {
    [ExpenseStatuses.PENDING]: 'Pendiente',
    [ExpenseStatuses.APPROVED]: 'Aprobado',
    [ExpenseStatuses.REJECTED]: 'Rechazado',
    [ExpenseStatuses.PAID]: 'Pagado'
  };
  return labels[status] || status;
};

export const getExpenseStatusColor = (status) => {
  const colors = {
    [ExpenseStatuses.PENDING]: 'bg-yellow-100 text-yellow-800',
    [ExpenseStatuses.APPROVED]: 'bg-green-100 text-green-800',
    [ExpenseStatuses.REJECTED]: 'bg-red-100 text-red-800',
    [ExpenseStatuses.PAID]: 'bg-blue-100 text-blue-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getCategoryLabel = (category) => {
  const labels = {
    [ExpenseCategories.MAINTENANCE]: 'Mantenimiento',
    [ExpenseCategories.SUPPLIES]: 'Suministros',
    [ExpenseCategories.SERVICES]: 'Servicios',
    [ExpenseCategories.EQUIPMENT]: 'Equipamiento',
    [ExpenseCategories.TRANSPORT]: 'Transporte',
    [ExpenseCategories.OTHER]: 'Otro'
  };
  return labels[category] || category;
};
