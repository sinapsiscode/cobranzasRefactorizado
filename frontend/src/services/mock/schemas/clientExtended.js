// Schema para datos extendidos del cliente (campos del Excel no contemplados)

// Función simple para generar IDs únicos
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Schema para datos adicionales del cliente que vienen del Excel
export const clientExtendedSchema = {
  id: () => generateId(),
  clientId: null,              // FK a cliente principal
  
  // Datos del nombre separados
  apellidos: '',
  nombres: '',
  
  // Datos financieros personalizados
  costoMensual: 0,            // Costo mensual personalizado (ej: 40 soles)
  costoInstalacion: 0,        // Costo de instalación
  tipoTarifa: 'standard',     // 'standard' | 'legacy' | 'gratuitous'
  
  // Información adicional
  referencia: '',              // Referencias o notas del Excel
  observaciones: '',           // OBSERVACIONES del Excel (columna L)
  condicionOriginal: '',       // ACTIVO, GRATUITO, etc (valor original del Excel)
  
  // Metadata
  importedFrom: 'manual',      // 'manual' | 'excel' | 'api'
  importDate: null,
  lastModified: () => new Date().toISOString(),
  createdAt: () => new Date().toISOString()
};

// Funciones auxiliares para manejar tarifas
export const getTarifaLabel = (tipo) => {
  const labels = {
    standard: 'Plan Estándar',
    legacy: 'Tarifa Legacy',
    gratuitous: 'Servicio Gratuito'
  };
  return labels[tipo] || tipo;
};

export const getTarifaColor = (tipo) => {
  const colors = {
    standard: 'bg-blue-100 text-blue-800',
    legacy: 'bg-yellow-100 text-yellow-800',
    gratuitous: 'bg-green-100 text-green-800'
  };
  return colors[tipo] || 'bg-gray-100 text-gray-800';
};

// Calcular costo efectivo del cliente
export const getEffectiveCost = (client, extendedData) => {
  if (!extendedData) {
    // Si no hay datos extendidos, usar plan estándar
    const planCosts = {
      basic: 80,
      standard: 120,
      premium: 160
    };
    return planCosts[client.servicePlan] || 80;
  }
  
  // Si es gratuito
  if (extendedData.tipoTarifa === 'gratuitous') {
    return 0;
  }
  
  // Si tiene costo personalizado
  if (extendedData.costoMensual > 0) {
    return extendedData.costoMensual;
  }
  
  // Por defecto usar plan estándar
  const planCosts = {
    basic: 80,
    standard: 120,
    premium: 160
  };
  return planCosts[client.servicePlan] || 80;
};

// Validar datos extendidos (validación mínima)
export const validateExtendedData = (data) => {
  const errors = [];
  const warnings = [];
  
  // Solo validar lo mínimo indispensable
  if (!data.clientId) {
    errors.push('Cliente ID es requerido');
  }
  
  // Todo lo demás son advertencias
  if (data.costoMensual < 0) {
    warnings.push('Costo mensual negativo será corregido a 0');
  }
  
  if (data.costoInstalacion < 0) {
    warnings.push('Costo de instalación negativo será corregido a 0');
  }
  
  const validTipos = ['standard', 'legacy', 'gratuitous'];
  if (data.tipoTarifa && !validTipos.includes(data.tipoTarifa)) {
    warnings.push('Tipo de tarifa inválido será corregido a standard');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export default clientExtendedSchema;