// Schema para deudas mensuales (tracking tipo Excel)

// Función simple para generar IDs únicos
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Schema para tracking de deudas mensuales
export const monthlyDebtSchema = {
  id: () => generateId(),
  clientId: null,              // FK a cliente
  
  // Período
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,  // 1-12
  period: '',                  // "2025-05" formato ISO
  
  // Información financiera
  amountDue: 0,               // Monto que debe pagar
  amountPaid: 0,              // Monto pagado
  status: 'pending',           // 'pending' | 'paid' | 'partial' | 'overdue'
  
  // Fechas
  dueDate: null,               // Fecha de vencimiento
  paymentDate: null,           // Fecha en que se pagó
  
  // Metadata
  notes: '',
  createdAt: () => new Date().toISOString(),
  updatedAt: () => new Date().toISOString()
};

// Funciones auxiliares
export const getMonthName = (month) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || '';
};

export const formatPeriod = (year, month) => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const parsePeriod = (period) => {
  const [year, month] = period.split('-').map(Number);
  return { year, month };
};

export const getDebtStatusLabel = (status) => {
  const labels = {
    pending: 'Pendiente',
    paid: 'Pagado',
    partial: 'Pago Parcial',
    overdue: 'Vencido'
  };
  return labels[status] || status;
};

export const getDebtStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-orange-100 text-orange-800',
    overdue: 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Calcular estado basado en fecha actual
export const calculateDebtStatus = (debt) => {
  if (debt.amountPaid >= debt.amountDue) {
    return 'paid';
  }
  
  if (debt.amountPaid > 0 && debt.amountPaid < debt.amountDue) {
    return 'partial';
  }
  
  const now = new Date();
  const dueDate = new Date(debt.dueDate);
  
  if (now > dueDate) {
    return 'overdue';
  }
  
  return 'pending';
};

// Obtener resumen de deudas de un cliente
export const getClientDebtSummary = (clientDebts) => {
  const summary = {
    totalDebt: 0,
    totalPaid: 0,
    monthsOwed: 0,
    monthsPaid: 0,
    oldestDebt: null,
    lastPayment: null
  };
  
  clientDebts.forEach(debt => {
    summary.totalDebt += debt.amountDue;
    summary.totalPaid += debt.amountPaid;
    
    if (debt.status === 'paid') {
      summary.monthsPaid++;
      if (!summary.lastPayment || debt.paymentDate > summary.lastPayment) {
        summary.lastPayment = debt.paymentDate;
      }
    } else {
      summary.monthsOwed++;
      if (!summary.oldestDebt || debt.period < summary.oldestDebt) {
        summary.oldestDebt = debt.period;
      }
    }
  });
  
  summary.balance = summary.totalDebt - summary.totalPaid;
  
  return summary;
};

// Generar deudas para un rango de meses
export const generateMonthlyDebts = (clientId, startYear, startMonth, endYear, endMonth, amount) => {
  const debts = [];
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    const period = formatPeriod(currentYear, currentMonth);
    const dueDate = new Date(currentYear, currentMonth - 1, 10); // Vencimiento el día 10
    
    debts.push({
      ...monthlyDebtSchema,
      id: generateId(),
      clientId,
      year: currentYear,
      month: currentMonth,
      period,
      amountDue: amount,
      amountPaid: 0,
      status: 'pending',
      dueDate: dueDate.toISOString(),
      createdAt: new Date().toISOString()
    });
    
    // Avanzar al siguiente mes
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  return debts;
};

export default monthlyDebtSchema;