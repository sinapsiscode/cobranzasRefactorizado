// UI Constants - Todos los textos y configuraciones de UI
export const UI_TEXT = {
  // Navegación
  NAV: {
    HOME: 'Inicio',
    CLIENTS: 'Clientes',
    PAYMENTS: 'Pagos',
    REPORTS: 'Reportes',
    SETTINGS: 'Configuración',
    LOGOUT: 'Cerrar Sesión'
  },

  // Botones
  BUTTONS: {
    ADD: 'Agregar',
    EDIT: 'Editar',
    DELETE: 'Eliminar',
    SAVE: 'Guardar',
    CANCEL: 'Cancelar',
    CONFIRM: 'Confirmar',
    SEARCH: 'Buscar',
    FILTER: 'Filtrar',
    EXPORT: 'Exportar',
    IMPORT: 'Importar',
    UPLOAD: 'Subir',
    DOWNLOAD: 'Descargar',
    BACK: 'Volver',
    NEXT: 'Siguiente',
    PREVIOUS: 'Anterior',
    SUBMIT: 'Enviar',
    REFRESH: 'Actualizar'
  },

  // Estados
  STATUS: {
    PAID: 'Pagado',
    PENDING: 'Pendiente',
    OVERDUE: 'Vencido',
    PARTIAL: 'Parcial',
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    LOADING: 'Cargando...',
    ERROR: 'Error',
    SUCCESS: 'Éxito',
    WARNING: 'Advertencia'
  },

  // Formularios
  FORMS: {
    REQUIRED_FIELD: 'Este campo es obligatorio',
    INVALID_EMAIL: 'Email inválido',
    INVALID_PHONE: 'Teléfono inválido',
    INVALID_DNI: 'DNI inválido',
    INVALID_AMOUNT: 'Monto inválido',
    PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
    MIN_LENGTH: 'Mínimo {0} caracteres',
    MAX_LENGTH: 'Máximo {0} caracteres'
  },

  // Mensajes
  MESSAGES: {
    WELCOME: 'Bienvenido al Sistema de Cobranzas',
    NO_DATA: 'No hay datos disponibles',
    NO_RESULTS: 'No se encontraron resultados',
    LOADING_DATA: 'Cargando datos...',
    SAVE_SUCCESS: 'Guardado exitosamente',
    DELETE_SUCCESS: 'Eliminado exitosamente',
    UPDATE_SUCCESS: 'Actualizado exitosamente',
    CONFIRM_DELETE: '¿Estás seguro de eliminar este registro?',
    UNSAVED_CHANGES: 'Tienes cambios sin guardar',
    SESSION_EXPIRED: 'Tu sesión ha expirado',
    CONNECTION_ERROR: 'Error de conexión',
    INSUFFICIENT_DATA: 'Datos insuficientes para generar este reporte'
  },

  // Roles
  ROLES: {
    ADMIN: 'Súper administrador',
    COLLECTOR: 'Cobrador',
    CLIENT: 'Cliente'
  },

  // Dashboard
  DASHBOARD: {
    TOTAL_COLLECTED: 'Total Recaudado',
    PENDING_PAYMENTS: 'Pagos Pendientes',
    OVERDUE_RATE: 'Tasa de Morosidad',
    CURRENT_CLIENTS: 'Clientes al Día',
    RECENT_ACTIVITY: 'Actividad Reciente',
    COLLECTION_CHART: 'Cobranza Últimos 6 Meses',
    PAYMENT_STATUS_CHART: 'Estado de Pagos Actual',
    QUICK_ACTIONS: 'Accesos Rápidos'
  }
};

// Configuraciones de componentes
export const UI_CONFIG = {
  PAGINATION: {
    ITEMS_PER_PAGE: [10, 25, 50, 100],
    DEFAULT_PAGE_SIZE: 25
  },
  
  SEARCH: {
    DEBOUNCE_DELAY: 300,
    MIN_SEARCH_LENGTH: 2
  },
  
  COLORS: {
    PRIMARY: '#3B82F6',
    SUCCESS: '#10B981',
    ERROR: '#EF4444',
    WARNING: '#F59E0B',
    INFO: '#06B6D4',
    GRAY: '#6B7280'
  },
  
  ANIMATIONS: {
    DURATION: '0.2s',
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// Estados de pago
export const PAYMENT_STATUSES = {
  PAID: { value: 'paid', label: UI_TEXT.STATUS.PAID, color: 'success' },
  PENDING: { value: 'pending', label: UI_TEXT.STATUS.PENDING, color: 'warning' },
  OVERDUE: { value: 'overdue', label: UI_TEXT.STATUS.OVERDUE, color: 'error' },
  PARTIAL: { value: 'partial', label: UI_TEXT.STATUS.PARTIAL, color: 'info' }
};

// Planes de servicio
export const SERVICE_PLANS = {
  BASIC: { value: 'basic', label: 'Plan Básico', price: 50 },
  STANDARD: { value: 'standard', label: 'Plan Estándar', price: 80 },
  PREMIUM: { value: 'premium', label: 'Plan Premium', price: 120 }
};