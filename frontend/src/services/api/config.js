// Configuración de API
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000, // 10 segundos
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Obtener token del storage
export const getAuthToken = () => {
  try {
    const authData = localStorage.getItem('tv-cable-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.state?.token || null;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

// Headers con autenticación
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    ...API_CONFIG.HEADERS,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};
