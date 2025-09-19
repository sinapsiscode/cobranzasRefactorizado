// Esquema de Usuario/Cobrador según especificaciones de leer.md
export const UserSchema = {
  id: { type: 'string', required: true },
  username: { type: 'string', required: true, minLength: 4, maxLength: 50 },
  email: { type: 'email', required: true },
  password: { type: 'string', required: true, minLength: 6 },
  fullName: { type: 'string', required: true, minLength: 3, maxLength: 100 },
  alias: { type: 'string', required: true, minLength: 2, maxLength: 30 },
  role: { type: 'enum', values: ['subadmin', 'admin', 'collector', 'client'], required: true },
  phone: { type: 'string', required: false, pattern: /^\+51\d{9}$/ },
  isActive: { type: 'boolean', default: true },
  lastLogin: { type: 'date', required: false },
  startDate: { type: 'date', required: false, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: 'date', default: () => new Date() },
  updatedAt: { type: 'date', default: () => new Date() }
};

// Valores por defecto
export const UserDefaults = {
  isActive: true,
  role: 'collector'
};

// Validaciones específicas
export const validateUser = (data) => {
  const errors = {};
  
  if (!data.username || data.username.length < 4) {
    errors.username = 'Usuario debe tener al menos 4 caracteres';
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Email inválido';
  }
  
  if (!data.password || data.password.length < 6) {
    errors.password = 'Contraseña debe tener al menos 6 caracteres';
  }
  
  if (!data.fullName || data.fullName.length < 3) {
    errors.fullName = 'Nombre debe tener al menos 3 caracteres';
  }
  
  if (!['subadmin', 'admin', 'collector', 'client'].includes(data.role)) {
    errors.role = 'Rol inválido';
  }
  
  if (data.phone && !/^\+51\d{9}$/.test(data.phone)) {
    errors.phone = 'Teléfono debe ser formato +51XXXXXXXXX';
  }
  
  // Validación de alias - obligatorio para cobradores
  if (data.role === 'collector') {
    if (!data.alias || data.alias.trim().length === 0) {
      errors.alias = 'Alias es obligatorio para cobradores';
    } else if (data.alias.length < 2 || data.alias.length > 30) {
      errors.alias = 'Alias debe tener entre 2 y 30 caracteres';
    }
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};