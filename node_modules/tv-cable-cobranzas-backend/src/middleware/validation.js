// Middleware de validación para requests
export const validateClientData = (req, res, next) => {
  const { fullName, dni, phone, address, neighborhood, servicePlan } = req.body

  const errors = []

  // Validar campos requeridos
  if (!fullName || fullName.trim().length < 3) {
    errors.push('El nombre completo debe tener al menos 3 caracteres')
  }

  if (!dni || !/^\d{8}$/.test(dni)) {
    errors.push('El DNI debe tener exactamente 8 dígitos')
  }

  if (!phone || !/^\+51\d{9}$/.test(phone)) {
    errors.push('El teléfono debe tener el formato +51XXXXXXXXX')
  }

  if (!address || address.trim().length < 10) {
    errors.push('La dirección debe tener al menos 10 caracteres')
  }

  if (!neighborhood || neighborhood.trim().length < 3) {
    errors.push('El barrio es requerido')
  }

  if (!servicePlan || !['basic', 'standard', 'premium'].includes(servicePlan)) {
    errors.push('El plan de servicio debe ser: basic, standard o premium')
  }

  // Validar email si se proporciona
  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    errors.push('El formato del email no es válido')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Datos de validación incorrectos',
      details: errors
    })
  }

  next()
}

export const validatePaymentData = (req, res, next) => {
  const { clientId, amount, paymentMethod } = req.body

  const errors = []

  if (!clientId) {
    errors.push('El ID del cliente es requerido')
  }

  if (amount === undefined || amount === null) {
    errors.push('El monto es requerido')
  } else if (isNaN(amount) || parseFloat(amount) < 0) {
    errors.push('El monto debe ser un número válido mayor o igual a 0')
  }

  if (!paymentMethod) {
    errors.push('El método de pago es requerido')
  } else if (!['cash', 'transfer', 'card', 'free'].includes(paymentMethod)) {
    errors.push('El método de pago debe ser: cash, transfer, card o free')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Datos de pago incorrectos',
      details: errors
    })
  }

  next()
}

export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query

  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      success: false,
      error: 'La fecha de inicio no es válida'
    })
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({
      success: false,
      error: 'La fecha de fin no es válida'
    })
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      success: false,
      error: 'La fecha de inicio no puede ser mayor que la fecha de fin'
    })
  }

  next()
}

export const validatePagination = (req, res, next) => {
  let { page = 1, limit = 10 } = req.query

  page = parseInt(page)
  limit = parseInt(limit)

  if (isNaN(page) || page < 1) {
    page = 1
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    limit = 10
  }

  req.pagination = { page, limit }
  next()
}

export const sanitizeInput = (req, res, next) => {
  // Función recursiva para limpiar objetos
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim()
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value)
      }
      return sanitized
    }
    return obj
  }

  req.body = sanitize(req.body)
  next()
}