import { writeFileSync, appendFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const LOG_DIR = join(__dirname, '../../logs')
const LOG_FILE = join(LOG_DIR, 'api.log')

// Asegurar que el directorio de logs existe
if (!existsSync(LOG_DIR)) {
  import('fs').then(fs => fs.mkdirSync(LOG_DIR, { recursive: true }))
}

// Función para escribir logs
const writeLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  }

  const logLine = `${timestamp} [${level.toUpperCase()}] ${message} ${JSON.stringify(meta)}\n`

  try {
    appendFileSync(LOG_FILE, logLine)
  } catch (error) {
    console.error('Error escribiendo log:', error)
  }
}

// Middleware de logging para requests
export const requestLogger = (req, res, next) => {
  const start = Date.now()

  // Interceptar la respuesta
  const originalSend = res.send
  res.send = function(data) {
    const duration = Date.now() - start

    // Log de la request
    writeLog('info', `${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role
    })

    // Log de errores (status 400+)
    if (res.statusCode >= 400) {
      writeLog('error', `HTTP Error ${res.statusCode}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        response: typeof data === 'string' ? data : JSON.stringify(data),
        userId: req.user?.id
      })
    }

    originalSend.call(this, data)
  }

  next()
}

// Middleware para logging de operaciones de negocio
export const businessLogger = (operation) => {
  return (req, res, next) => {
    const originalSend = res.send
    res.send = function(data) {
      if (res.statusCode < 400) {
        writeLog('business', `${operation} completed`, {
          operation,
          userId: req.user?.id,
          userRole: req.user?.role,
          requestData: req.body,
          success: true
        })
      } else {
        writeLog('business', `${operation} failed`, {
          operation,
          userId: req.user?.id,
          userRole: req.user?.role,
          requestData: req.body,
          success: false,
          error: typeof data === 'string' ? data : JSON.stringify(data)
        })
      }

      originalSend.call(this, data)
    }

    next()
  }
}

// Middleware para logging de errores no capturados
export const errorLogger = (err, req, res, next) => {
  writeLog('error', `Unhandled error: ${err.message}`, {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    body: req.body
  })

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  })
}

// Función para logs manuales
export const log = {
  info: (message, meta = {}) => writeLog('info', message, meta),
  warn: (message, meta = {}) => writeLog('warn', message, meta),
  error: (message, meta = {}) => writeLog('error', message, meta),
  debug: (message, meta = {}) => writeLog('debug', message, meta),
  business: (message, meta = {}) => writeLog('business', message, meta)
}