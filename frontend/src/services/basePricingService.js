/**
 * Servicio centralizado para manejo de precios base de servicios
 * MIGRADO A JSON SERVER - Usa API backend en lugar de localStorage
 */

const API_URL = '/api';

// Precios por defecto (fallback si no hay configuración)
const DEFAULT_BASE_PRICES = {
  internet: 50,
  cable: 40,
  duo: 80
};

// Cache en memoria para reducir llamadas a API
let pricesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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
 * Obtiene los precios base configurados desde el backend
 * @returns {Promise<Object>} Precios base para internet, cable y dúo
 */
export const getBasePrices = async () => {
  try {
    // Usar cache si está disponible y es reciente
    if (pricesCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return pricesCache;
    }

    const response = await fetch(`${API_URL}/settings`);
    if (!response.ok) {
      throw new Error('Error al obtener configuración');
    }

    const settings = await response.json();
    const prices = settings.basePrices || DEFAULT_BASE_PRICES;

    // Validar que los precios sean números válidos
    const validPrices = {
      internet: parseFloat(prices.internet) || DEFAULT_BASE_PRICES.internet,
      cable: parseFloat(prices.cable) || DEFAULT_BASE_PRICES.cable,
      duo: parseFloat(prices.duo) || DEFAULT_BASE_PRICES.duo
    };

    // Actualizar cache
    pricesCache = validPrices;
    cacheTimestamp = Date.now();

    return validPrices;
  } catch (error) {
    console.error('Error loading base prices from API:', error);
    // Retornar cache si existe, sino defaults
    return pricesCache || { ...DEFAULT_BASE_PRICES };
  }
};

/**
 * Guarda los precios base en el backend
 * @param {Object} prices - Precios a guardar {internet, cable, duo}
 * @returns {Promise<boolean>} true si se guardó correctamente
 */
export const saveBasePrices = async (prices) => {
  try {
    const validPrices = {
      internet: parseFloat(prices.internet) || 0,
      cable: parseFloat(prices.cable) || 0,
      duo: parseFloat(prices.duo) || 0
    };

    const response = await fetch(`${API_URL}/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        basePrices: validPrices
      }),
    });

    if (!response.ok) {
      throw new Error('Error al guardar precios');
    }

    // Actualizar cache
    pricesCache = validPrices;
    cacheTimestamp = Date.now();

    // Disparar evento para notificar cambios a otros componentes
    window.dispatchEvent(new CustomEvent('basePricesUpdated', {
      detail: validPrices
    }));

    return true;
  } catch (error) {
    console.error('Error saving base prices to API:', error);
    return false;
  }
};

/**
 * Calcula el precio final según el tipo de servicio y categoría de plan
 * @param {string} serviceType - 'internet', 'cable', 'duo'
 * @param {string} planCategory - 'basic', 'standard', 'premium'
 * @returns {Promise<number>} Precio calculado
 */
export const calculateServicePrice = async (serviceType, planCategory = 'standard') => {
  const basePrices = await getBasePrices();
  const basePrice = basePrices[serviceType] || 0;
  const multiplier = PLAN_MULTIPLIERS[planCategory] || PLAN_MULTIPLIERS.standard;

  return Math.round(basePrice * multiplier);
};

/**
 * Obtiene la matriz completa de precios por plan y servicio
 * @returns {Promise<Object>} Matriz de precios organizados por plan
 */
export const getPriceMatrix = async () => {
  const basePrices = await getBasePrices();

  return {
    basic: {
      internet: await calculateServicePrice('internet', 'basic'),
      cable: await calculateServicePrice('cable', 'basic'),
      duo: await calculateServicePrice('duo', 'basic')
    },
    standard: {
      internet: await calculateServicePrice('internet', 'standard'),
      cable: await calculateServicePrice('cable', 'standard'),
      duo: await calculateServicePrice('duo', 'standard')
    },
    premium: {
      internet: await calculateServicePrice('internet', 'premium'),
      cable: await calculateServicePrice('cable', 'premium'),
      duo: await calculateServicePrice('duo', 'premium')
    },
    plan_hogar: {
      internet: await calculateServicePrice('internet', 'plan_hogar'),
      cable: await calculateServicePrice('cable', 'plan_hogar'),
      duo: await calculateServicePrice('duo', 'plan_hogar')
    },
    plan_corporativo: {
      internet: await calculateServicePrice('internet', 'plan_corporativo'),
      cable: await calculateServicePrice('cable', 'plan_corporativo'),
      duo: await calculateServicePrice('duo', 'plan_corporativo')
    },
    plan_negocio: {
      internet: await calculateServicePrice('internet', 'plan_negocio'),
      cable: await calculateServicePrice('cable', 'plan_negocio'),
      duo: await calculateServicePrice('duo', 'plan_negocio')
    }
  };
};

/**
 * Hook personalizado para usar precios base con reactividad
 * @returns {Object} Precios base y función para actualizarlos
 */
export const useBasePrices = () => {
  const [prices, setPrices] = React.useState(DEFAULT_BASE_PRICES);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Cargar precios al montar
    const loadPrices = async () => {
      setIsLoading(true);
      const fetchedPrices = await getBasePrices();
      setPrices(fetchedPrices);
      setIsLoading(false);
    };
    loadPrices();

    // Escuchar cambios
    const handlePricesUpdated = (event) => {
      setPrices(event.detail);
    };

    window.addEventListener('basePricesUpdated', handlePricesUpdated);

    return () => {
      window.removeEventListener('basePricesUpdated', handlePricesUpdated);
    };
  }, []);

  const updatePrices = async (newPrices) => {
    const success = await saveBasePrices(newPrices);
    if (success) {
      setPrices(newPrices);
      return true;
    }
    return false;
  };

  return {
    basePrices: prices,
    isLoading,
    updateBasePrices: updatePrices,
    calculatePrice: calculateServicePrice,
    getPriceMatrix
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
 * @returns {Promise<Object>} Información completa del servicio
 */
export const getServiceInfo = async (serviceType, planCategory = 'standard') => {
  const price = await calculateServicePrice(serviceType, planCategory);
  const basePrices = await getBasePrices();

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
    basePrice: basePrices[serviceType] || 0,
    multiplier: PLAN_MULTIPLIERS[planCategory] || 1.0
  };
};

// Exportar constantes para uso externo
export { DEFAULT_BASE_PRICES, PLAN_MULTIPLIERS };