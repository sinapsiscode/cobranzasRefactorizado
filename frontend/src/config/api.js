// Configuración de la API para conectar con JSON Server

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4020',
  API_PREFIX: '/api',
  AUTH_PREFIX: '/auth',
  TIMEOUT: 10000, // 10 segundos
}

// URLs completas para diferentes tipos de endpoints
export const API_URLS = {
  // Base URLs
  BASE: API_CONFIG.BASE_URL,
  API: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`,

  // Auth endpoints
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/login`,
    LOGOUT: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/logout`,
    VALIDATE: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_PREFIX}/validate`,
  },

  // Resource endpoints
  USERS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/users`,
  CLIENTS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/clients`,
  PAYMENTS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/payments`,
  SERVICES: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/services`,
  CASHBOXES: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/cashboxes`,
  NOTIFICATIONS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/notifications`,
  VOUCHERS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/vouchers`,
  MONTHLY_DEBTS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/monthlyDebts`,
  CASH_BOX_REQUESTS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/cashBoxRequests`,
  CLIENT_EXTENDED: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/clientExtended`,
  BACKUPS: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}/backups`,
  NEIGHBORHOODS: `${API_CONFIG.BASE_URL}/neighborhoods`,

  // Special endpoints
  DASHBOARD_STATS: `${API_CONFIG.BASE_URL}/dashboard/stats`,
  HEALTH: `${API_CONFIG.BASE_URL}/health`,
}

// Headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}

// Función para obtener headers con token de autenticación
export const getAuthHeaders = () => {
  const token = localStorage.getItem('tv-cable-auth')
  const headers = { ...DEFAULT_HEADERS }

  if (token) {
    try {
      const authData = JSON.parse(token)
      if (authData?.token) {
        headers['Authorization'] = `Bearer ${authData.token}`
      }
    } catch (error) {
      console.error('Error parsing auth token:', error)
    }
  }

  return headers
}

// Configuración para diferentes tipos de requests
export const REQUEST_CONFIG = {
  DEFAULT: {
    headers: DEFAULT_HEADERS,
    timeout: API_CONFIG.TIMEOUT,
  },

  WITH_AUTH: () => ({
    headers: getAuthHeaders(),
    timeout: API_CONFIG.TIMEOUT,
  }),

  MULTIPART: () => ({
    headers: {
      ...getAuthHeaders(),
      // No incluir Content-Type para FormData, el browser lo añadirá automáticamente
    },
    timeout: API_CONFIG.TIMEOUT * 2, // Más tiempo para uploads
  }),
}

// Función helper para construir URLs con query parameters
export const buildURL = (baseUrl, params = {}) => {
  const url = new URL(baseUrl)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v))
      } else {
        url.searchParams.append(key, value.toString())
      }
    }
  })

  return url.toString()
}

// Función para manejar respuestas de la API
export const handleAPIResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP Error: ${response.status}`

    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // Si no se puede parsear el JSON, usar el mensaje por defecto
    }

    throw new Error(errorMessage)
  }

  const data = await response.json()

  // Si la respuesta tiene formato de JSON Server estándar, devolver directamente
  // Si tiene formato de respuesta personalizada, extraer los datos
  if (data.success !== undefined) {
    if (!data.success) {
      throw new Error(data.error || 'Error en la respuesta de la API')
    }
    return data
  }

  // Para respuestas de JSON Server estándar
  return { success: true, data }
}

// Función para limpiar datos de autenticación
export const clearAuthData = () => {
  localStorage.removeItem('tv-cable-auth')
}

export default API_CONFIG