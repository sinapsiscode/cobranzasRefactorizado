// Utilidades para cálculo de fechas de pago y vencimiento

/**
 * Calcula la fecha de pago para un mes específico basado en el día preferido del cliente
 * @param {number} year - Año
 * @param {number} month - Mes (0-11)
 * @param {number} preferredPaymentDay - Día del mes preferido (1-31)
 * @returns {Date} Fecha de pago calculada
 */
export const calculatePaymentDate = (year, month, preferredPaymentDay) => {
  // Obtener el último día del mes
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  // Si el día preferido excede los días del mes, usar el último día
  const paymentDay = Math.min(preferredPaymentDay, lastDayOfMonth);

  return new Date(year, month, paymentDay);
};

/**
 * Calcula la fecha de vencimiento basada en la fecha de pago y días de gracia
 * @param {Date} paymentDate - Fecha de pago
 * @param {number} dueDays - Días de gracia antes del vencimiento
 * @returns {Date} Fecha de vencimiento
 */
export const calculateDueDate = (paymentDate, dueDays = 5) => {
  const dueDate = new Date(paymentDate);
  dueDate.setDate(dueDate.getDate() + dueDays);
  return dueDate;
};

/**
 * Obtiene la próxima fecha de pago para un cliente
 * @param {object} client - Datos del cliente
 * @returns {object} Información de la próxima fecha de pago
 */
export const getNextPaymentDate = (client) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Calcular fecha de pago del mes actual
  const currentPaymentDate = calculatePaymentDate(
    currentYear,
    currentMonth,
    client.preferredPaymentDay
  );

  // Si ya pasó la fecha de pago del mes actual, usar el próximo mes
  let nextPaymentDate;
  let nextPaymentMonth;
  let nextPaymentYear;

  if (today > currentPaymentDate) {
    // Ya pasó la fecha de pago de este mes, usar el próximo mes
    nextPaymentMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    nextPaymentYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  } else {
    // Todavía no llegó la fecha de pago de este mes
    nextPaymentMonth = currentMonth;
    nextPaymentYear = currentYear;
  }

  nextPaymentDate = calculatePaymentDate(
    nextPaymentYear,
    nextPaymentMonth,
    client.preferredPaymentDay
  );

  const dueDate = calculateDueDate(nextPaymentDate, client.paymentDueDays || 5);

  return {
    paymentDate: nextPaymentDate,
    dueDate: dueDate,
    month: nextPaymentMonth,
    year: nextPaymentYear,
    monthLabel: nextPaymentDate.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
  };
};

/**
 * Genera una lista de meses pendientes/adeudados para un cliente
 * @param {object} client - Datos del cliente
 * @param {array} payments - Lista de pagos del cliente
 * @returns {array} Lista de meses adeudados con sus fechas
 */
export const getOverdueMonths = (client, payments = []) => {
  const today = new Date();
  const installationDate = new Date(client.installationDate);
  const overdueMonths = [];

  // Empezar desde el mes de instalación
  let checkDate = new Date(installationDate.getFullYear(), installationDate.getMonth(), 1);

  // Revisar hasta el mes actual
  while (checkDate <= today) {
    const year = checkDate.getFullYear();
    const month = checkDate.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Buscar si existe un pago para este mes
    const payment = payments.find(p => p.month === monthKey);

    // Si no hay pago o el pago está pendiente/vencido, agregarlo a la lista
    if (!payment || payment.status === 'pending' || payment.status === 'overdue') {
      const paymentDate = calculatePaymentDate(year, month, client.preferredPaymentDay);
      const dueDate = calculateDueDate(paymentDate, client.paymentDueDays || 5);

      overdueMonths.push({
        month: monthKey,
        monthLabel: new Date(year, month, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }),
        paymentDate: paymentDate,
        dueDate: dueDate,
        year: year,
        monthNumber: month,
        isPastDue: today > dueDate,
        status: payment?.status || 'pending'
      });
    }

    // Avanzar al siguiente mes
    checkDate.setMonth(checkDate.getMonth() + 1);
  }

  return overdueMonths;
};

/**
 * Genera una lista de N meses adelantados a partir del próximo mes a pagar
 * @param {object} client - Datos del cliente
 * @param {array} payments - Lista de pagos del cliente
 * @param {number} monthsCount - Cantidad de meses adelantados a generar
 * @returns {array} Lista de meses adelantados con sus fechas y montos
 */
export const generateAdvanceMonths = (client, payments = [], monthsCount = 1) => {
  const planPrices = {
    basic: 80,
    standard: 120,
    premium: 160
  };

  const monthlyAmount = planPrices[client.servicePlan] || 80;
  const overdueMonths = getOverdueMonths(client, payments);

  // Si hay meses vencidos, empezar desde el primer mes vencido
  let startDate;
  if (overdueMonths.length > 0) {
    const firstOverdue = overdueMonths[0];
    startDate = new Date(firstOverdue.year, firstOverdue.monthNumber, 1);
  } else {
    // Si no hay deudas, empezar desde el próximo mes
    const nextPayment = getNextPaymentDate(client);
    startDate = new Date(nextPayment.year, nextPayment.month, 1);
  }

  const months = [];

  for (let i = 0; i < monthsCount; i++) {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    const paymentDate = calculatePaymentDate(year, month, client.preferredPaymentDay);
    const dueDate = calculateDueDate(paymentDate, client.paymentDueDays || 5);

    months.push({
      month: monthKey,
      monthLabel: new Date(year, month, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }),
      paymentDate: paymentDate,
      dueDate: dueDate,
      amount: monthlyAmount,
      year: year,
      monthNumber: month
    });

    // Avanzar al siguiente mes
    startDate.setMonth(startDate.getMonth() + 1);
  }

  return months;
};

/**
 * Calcula el total a pagar por múltiples meses
 * @param {array} months - Lista de meses generados
 * @returns {number} Total a pagar
 */
export const calculateTotalAmount = (months) => {
  return months.reduce((total, month) => total + (month.amount || 0), 0);
};

/**
 * Formatea una fecha en formato español
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha en formato corto
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada (DD/MM/YYYY)
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
