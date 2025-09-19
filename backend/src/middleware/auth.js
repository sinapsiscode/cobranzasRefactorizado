import jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const JWT_SECRET = process.env.JWT_SECRET || 'tv-cable-secret-key-2025'
const DB_FILE = join(__dirname, '../../db.json')

// Función para leer la base de datos
const readDB = () => {
  const data = readFileSync(DB_FILE, 'utf8')
  return JSON.parse(data)
}

// Middleware de autenticación principal
export const authenticateToken = (req, res, next) => {
  // Rutas que no requieren autenticación
  const publicRoutes = ['/auth/login', '/health']

  if (publicRoutes.some(route => req.path.includes(route)) || req.method === 'OPTIONS') {
    return next()
  }

  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido',
      code: 'MISSING_TOKEN'
    })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido o expirado',
        code: 'INVALID_TOKEN'
      })
    }

    // Verificar que el usuario aún existe y está activo
    try {
      const db = readDB()
      const user = db.users.find(u => u.id === decoded.id && u.isActive)

      if (!user) {
        return res.status(403).json({
          success: false,
          error: 'Usuario no válido o inactivo',
          code: 'USER_NOT_FOUND'
        })
      }

      req.user = decoded
      req.userDetails = user
      next()
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Error verificando usuario',
        code: 'DATABASE_ERROR'
      })
    }
  })
}

// Middleware de autorización por roles
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      })
    }

    next()
  }
}

// Middleware para verificar propiedad de recursos (cobradores solo ven sus clientes)
export const authorizeResourceAccess = (req, res, next) => {
  // Solo aplicar a cobradores
  if (req.user.role !== 'collector') {
    return next()
  }

  // Para cobradores, filtrar por assignedCollector
  const originalSend = res.send
  res.send = function(data) {
    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data)

        // Filtrar clientes por cobrador asignado
        if (parsedData && Array.isArray(parsedData)) {
          const filteredData = parsedData.filter(item =>
            !item.assignedCollector || item.assignedCollector === req.user.id
          )
          return originalSend.call(this, JSON.stringify(filteredData))
        }
      } catch (e) {
        // Si no es JSON válido, continuar normalmente
      }
    }

    return originalSend.call(this, data)
  }

  next()
}

// Generar token JWT
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}

// Verificar token JWT
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Token inválido')
  }
}