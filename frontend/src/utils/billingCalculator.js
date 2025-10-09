// Utilidades para cálculo de facturación y prorrateo

/**
 * Calcula el tipo de cobro según la fecha de instalación
 * @param {string|Date} installationDate - Fecha de instalación
 * @returns {object} Información del tipo de cobro
 */
export const calculateBillingType = (installationDate) => {
  if (!installationDate) return null;
  
  const date = new Date(installationDate);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // Si instala después del día 26, mes gratis
  if (day >= 26) {
    return {
      type: 'free',
      label: 'Mes Gratis',
      badge: '🎁',
      color: 'green',
      description: `Instalación día ${day} - Mes gratis`,
      amount: 0,
      daysUsed: 0,
      startBilling: new Date(year, month + 1, 1) // Siguiente mes
    };
  }
  
  // Si instala antes del día 26, prorrateo
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysUsed = daysInMonth - day + 1;
  
  return {
    type: 'prorated',
    label: 'Prorrateo',
    badge: '⚖️',
    color: 'yellow',
    description: `Prorrateo - ${daysUsed} días`,
    daysUsed: daysUsed,
    daysInMonth: daysInMonth,
    startBilling: date
  };
};

/**
 * Calcula el monto prorrateado
 * @param {number} monthlyFee - Tarifa mensual
 * @param {number} daysUsed - Días utilizados
 * @param {number} daysInMonth - Días totales del mes
 * @returns {number} Monto prorrateado
 */
export const calculateProratedAmount = (monthlyFee, daysUsed, daysInMonth = 30) => {
  if (daysUsed <= 0) return 0;
  return Number(((monthlyFee * daysUsed) / daysInMonth).toFixed(2));
};

/**
 * Obtiene el monto del primer pago según plan y fecha de instalación
 * @param {string} servicePlan - Plan de servicio (basic, standard, premium)
 * @param {string|Date} installationDate - Fecha de instalación
 * @returns {object} Información del primer pago
 */
export const getFirstPaymentInfo = (servicePlan, installationDate) => {
  const planPrices = {
    basic: 80,
    standard: 120,
    premium: 160
  };
  
  const monthlyFee = planPrices[servicePlan] || 80;
  const billing = calculateBillingType(installationDate);
  
  if (!billing) {
    return {
      amount: monthlyFee,
      type: 'normal',
      description: 'Mes completo'
    };
  }
  
  if (billing.type === 'free') {
    return {
      amount: 0,
      type: 'free',
      description: billing.description,
      nextPayment: {
        date: billing.startBilling,
        amount: monthlyFee
      }
    };
  }
  
  if (billing.type === 'prorated') {
    const proratedAmount = calculateProratedAmount(
      monthlyFee, 
      billing.daysUsed, 
      billing.daysInMonth
    );
    
    return {
      amount: proratedAmount,
      type: 'prorated',
      description: billing.description,
      calculation: `(S/ ${monthlyFee} ÷ ${billing.daysInMonth} días) × ${billing.daysUsed} días = S/ ${proratedAmount}`
    };
  }
  
  return {
    amount: monthlyFee,
    type: 'normal',
    description: 'Mes completo'
  };
};

/**
 * Determina si un cliente tiene mes gratis actualmente
 * @param {string|Date} installationDate - Fecha de instalación
 * @returns {boolean} True si el cliente está en su mes gratis
 */
export const isInFreeMonth = (installationDate) => {
  if (!installationDate) return false;
  
  const date = new Date(installationDate);
  const today = new Date();
  
  // Si es el mismo mes y año de instalación
  if (date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear()) {
    // Y se instaló después del día 26
    return date.getDate() >= 26;
  }
  
  return false;
};

/**
 * Formatea la información de facturación para mostrar
 * @param {object} client - Datos del cliente
 * @returns {object} Información formateada
 */
export const getBillingDisplay = (client) => {
  const billing = calculateBillingType(client.installationDate);
  const payment = getFirstPaymentInfo(client.servicePlan, client.installationDate);
  
  return {
    ...billing,
    ...payment,
    client: client.fullName,
    plan: client.servicePlan
  };
};