/**
 * Servicio centralizado para manejo de precios base de servicios
 * Integra los precios configurados en Administrador > Servicios con todo el sistema
 */

// Clave para localStorage
const STORAGE_KEY = 'tv-cable:service-prices';

// Precios por defecto (fallback si no hay configuración)
const DEFAULT_BASE_PRICES = {
  internet: 50,
  cable: 40,
  duo: 80
};

// Multiplicadores por categoría de plan
const PLAN_MULTIPLIERS = {
  basic: 1.0,           // 100% del precio base (backward compatibility)
  standard: 1.6,        // 160% del precio base (backward compatibility)
  premium: 2.4,         // 240% del precio base (backward compatibility)
  plan_hogar: 1.0,      // 100% del precio base
  plan_corporativo: 1.6, // 160% del precio base
  plan_negocio: 2.4     // 240% del precio base
};

/**
 * Obtiene los precios base configurados desde localStorage
 * @returns {Object} Precios base para internet, cable y dúo
 */
export const getBasePrices = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const prices = JSON.parse(saved);
      // Validar que los precios sean números válidos
      const validPrices = {
        internet: parseFloat(prices.internet) || DEFAULT_BASE_PRICES.internet,
        cable: parseFloat(prices.cable) || DEFAULT_BASE_PRICES.cable,
        duo: parseFloat(prices.duo) || DEFAULT_BASE_PRICES.duo
      };
      return validPrices;
    }
  } catch (error) {
    console.error('Error loading base prices from localStorage:', error);
  }
  
  // Retornar precios por defecto si no hay configuración o hay error
  return { ...DEFAULT_BASE_PRICES };
};

/**
 * Guarda los precios base en localStorage
 * @param {Object} prices - Precios a guardar {internet, cable, duo}
 */
export const saveBasePrices = (prices) => {
  try {
    const validPrices = {
      internet: parseFloat(prices.internet) || 0,
      cable: parseFloat(prices.cable) || 0,
      duo: parseFloat(prices.duo) || 0
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validPrices));
    
    // Disparar evento para notificar cambios a otros componentes
    window.dispatchEvent(new CustomEvent('basePricesUpdated', {
      detail: validPrices
    }));
    
    return true;
  } catch (error) {
    console.error('Error saving base prices to localStorage:', error);
    return false;
  }
};

/**
 * Calcula el precio final según el tipo de servicio y categoría de plan
 * @param {string} serviceType - 'internet', 'cable', 'duo'
 * @param {string} planCategory - 'basic', 'standard', 'premium'
 * @returns {number} Precio calculado
 */
export const calculateServicePrice = (serviceType, planCategory = 'standard') => {
  const basePrices = getBasePrices();
  const basePrice = basePrices[serviceType] || 0;
  const multiplier = PLAN_MULTIPLIERS[planCategory] || PLAN_MULTIPLIERS.standard;
  
  return Math.round(basePrice * multiplier);
};

/**
 * Obtiene la matriz completa de precios por plan y servicio
 * @returns {Object} Matriz de precios organizados por plan
 */
export const getPriceMatrix = () => {
  const basePrices = getBasePrices();

  return {
    basic: {
      internet: calculateServicePrice('internet', 'basic'),
      cable: calculateServicePrice('cable', 'basic'),
      duo: calculateServicePrice('duo', 'basic')
    },
    standard: {
      internet: calculateServicePrice('internet', 'standard'),
      cable: calculateServicePrice('cable', 'standard'),
      duo: calculateServicePrice('duo', 'standard')
    },
    premium: {
      internet: calculateServicePrice('internet', 'premium'),
      cable: calculateServicePrice('cable', 'premium'),
      duo: calculateServicePrice('duo', 'premium')
    },
    plan_hogar: {
      internet: calculateServicePrice('internet', 'plan_hogar'),
      cable: calculateServicePrice('cable', 'plan_hogar'),
      duo: calculateServicePrice('duo', 'plan_hogar')
    },
    plan_corporativo: {
      internet: calculateServicePrice('internet', 'plan_corporativo'),
      cable: calculateServicePrice('cable', 'plan_corporativo'),
      duo: calculateServicePrice('duo', 'plan_corporativo')
    },
    plan_negocio: {
      internet: calculateServicePrice('internet', 'plan_negocio'),
      cable: calculateServicePrice('cable', 'plan_negocio'),
      duo: calculateServicePrice('duo', 'plan_negocio')
    }
  };
};

/**
 * Hook personalizado para usar precios base con reactividad
 * @returns {Object} Precios base y función para actualizarlos
 */
export const useBasePrices = () => {
  const [prices, setPrices] = React.useState(getBasePrices());

  React.useEffect(() => {
    const handlePricesUpdated = (event) => {
      setPrices(event.detail);
    };

    window.addEventListener('basePricesUpdated', handlePricesUpdated);
    
    return () => {
      window.removeEventListener('basePricesUpdated', handlePricesUpdated);
    };
  }, []);

  const updatePrices = (newPrices) => {
    if (saveBasePrices(newPrices)) {
      setPrices(newPrices);
      return true;
    }
    return false;
  };

  return {
    basePrices: prices,
    updateBasePrices: updatePrices,
    calculatePrice: calculateServicePrice,
    priceMatrix: getPriceMatrix()
  };
};

/**
 * Formatea un precio para mostrar en la UI
 * @param {number} price - Precio a formatear
 * @param {boolean} includeCurrency - Si incluir el símbolo de moneda
 * @returns {string} Precio formateado
 */
export const formatPrice = (price, includeCurrency = true) => {
  const formattedPrice = parseFloat(price).toFixed(2);
  return includeCurrency ? `S/ ${formattedPrice}` : formattedPrice;
};

/**
 * Obtiene información de un servicio incluyendo precio calculado
 * @param {string} serviceType - Tipo de servicio
 * @param {string} planCategory - Categoría del plan
 * @returns {Object} Información completa del servicio
 */
export const getServiceInfo = (serviceType, planCategory = 'standard') => {
  const price = calculateServicePrice(serviceType, planCategory);
  
  const serviceLabels = {
    internet: 'INTERNET',
    cable: 'TV',
    duo: 'DUO (Internet + TV)'
  };

  const planLabels = {
    basic: 'Básico',
    standard: 'Estándar',
    premium: 'Premium',
    plan_hogar: 'Plan Hogar',
    plan_corporativo: 'Plan Corporativo',
    plan_negocio: 'Plan Negocio'
  };

  return {
    serviceType,
    planCategory,
    serviceName: serviceLabels[serviceType] || serviceType,
    planName: planLabels[planCategory] || planCategory,
    price,
    formattedPrice: formatPrice(price),
    basePrice: getBasePrices()[serviceType] || 0,
    multiplier: PLAN_MULTIPLIERS[planCategory] || 1.0
  };
};

// Exportar constantes para uso externo
export { DEFAULT_BASE_PRICES, PLAN_MULTIPLIERS, STORAGE_KEY };