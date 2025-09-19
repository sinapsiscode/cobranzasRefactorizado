import jsonServer from 'json-server'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuración
const PORT = process.env.PORT || 4020
const JWT_SECRET = process.env.JWT_SECRET || 'tv-cable-secret-key-2025'
const DB_FILE = join(__dirname, 'db.json')

// Crear servidor JSON Server
const server = jsonServer.create()
const router = jsonServer.router(DB_FILE)
const middlewares = jsonServer.defaults()

// Middleware personalizado para CORS
server.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://localhost:4020'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Middleware para parsear JSON antes que los middlewares por defecto
server.use(express.json())
server.use(express.urlencoded({ extended: true }))

// Middleware de json-server
server.use(middlewares)

// Función para leer la base de datos
const readDB = () => {
  const data = readFileSync(DB_FILE, 'utf8')
  return JSON.parse(data)
}

// Función para escribir en la base de datos
const writeDB = (data) => {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  // Permitir login sin autenticación
  if (req.path === '/auth/login' || req.method === 'OPTIONS') {
    return next()
  }

  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido o expirado'
      })
    }
    req.user = user
    next()
  })
}

// Rutas de autenticación
server.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuario y contraseña son requeridos'
      })
    }

    const db = readDB()
    const user = db.users.find(u => u.username === username && u.isActive)

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado o inactivo'
      })
    }

    // Verificar contraseña directamente contra la almacenada
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      })
    }

    // Actualizar último login
    user.lastLogin = new Date().toISOString()

    // Actualizar en la base de datos
    const userIndex = db.users.findIndex(u => u.id === user.id)
    db.users[userIndex] = user
    writeDB(db)

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    // Remover contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: 8 * 60 * 60 * 1000 // 8 horas en ms
      },
      message: 'Login exitoso'
    })

  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

server.post('/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  })
})

server.post('/auth/validate', authenticateToken, (req, res) => {
  try {
    const db = readDB()
    const user = db.users.find(u => u.id === req.user.id && u.isActive)

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no válido'
      })
    }

    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      data: { user: userWithoutPassword }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Middleware para todas las rutas API (excepto auth)
server.use('/api', authenticateToken)

// Rutas personalizadas de negocio
server.use('/api/business', (req, res, next) => {
  // Middleware específico para rutas de negocio
  req.db = readDB()
  next()
})

// Rutas de cobranza específicas
server.get('/api/business/collections/pending', (req, res) => {
  try {
    const db = req.db
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Obtener deudas pendientes por cobrar
    const pendingCollections = db.clients
      .filter(client => client.isActive)
      .map(client => {
        const clientPayments = db.payments.filter(p =>
          p.clientId === client.id &&
          p.month === currentMonth &&
          (p.status === 'pending' || p.status === 'overdue')
        )

        if (clientPayments.length > 0) {
          return {
            ...client,
            pendingPayments: clientPayments
          }
        }
        return null
      })
      .filter(Boolean)

    res.json({
      success: true,
      data: pendingCollections,
      meta: {
        total: pendingCollections.length,
        month: currentMonth
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo cobranzas pendientes'
    })
  }
})

// Ruta para registrar un pago
server.post('/api/business/payments', (req, res) => {
  try {
    const { clientId, amount, paymentMethod, comments, collectorId } = req.body
    const db = readDB()

    // Validaciones básicas
    if (!clientId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'clientId, amount y paymentMethod son requeridos'
      })
    }

    // Verificar que el cliente existe
    const client = db.clients.find(c => c.id === clientId)
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      })
    }

    // Crear nuevo pago
    const newPayment = {
      id: `payment-${Date.now()}`,
      clientId,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate: new Date().toISOString(),
      status: 'paid',
      collectorId: collectorId || req.user.id,
      comments: comments || null,
      month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Agregar pago a la base de datos
    db.payments.push(newPayment)

    // Actualizar fecha de último pago del cliente
    const clientIndex = db.clients.findIndex(c => c.id === clientId)
    if (clientIndex !== -1) {
      db.clients[clientIndex].lastPaymentDate = newPayment.paymentDate
      db.clients[clientIndex].updatedAt = newPayment.updatedAt
    }

    writeDB(db)

    res.json({
      success: true,
      data: newPayment,
      message: 'Pago registrado exitosamente'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error registrando pago'
    })
  }
})

// Ruta para obtener estadísticas de cobranza
server.get('/api/business/stats', (req, res) => {
  try {
    const db = req.db
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    const stats = {
      totalClients: db.clients.length,
      activeClients: db.clients.filter(c => c.isActive).length,
      inactiveClients: db.clients.filter(c => !c.isActive).length,
      currentMonthPayments: {
        total: db.payments.filter(p => p.month === currentMonth).length,
        paid: db.payments.filter(p => p.month === currentMonth && p.status === 'paid').length,
        pending: db.payments.filter(p => p.month === currentMonth && p.status === 'pending').length,
        overdue: db.payments.filter(p => p.month === currentMonth && p.status === 'overdue').length
      },
      totalRevenue: db.payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0)
    }

    res.json({
      success: true,
      data: stats,
      meta: {
        month: currentMonth,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas'
    })
  }
})

// Ruta para generar deudas mensuales automáticamente
server.post('/api/business/generate-monthly-debts', (req, res) => {
  try {
    const { month, year } = req.body
    const db = readDB()

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'month y year son requeridos'
      })
    }

    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    const existingDebts = db.payments.filter(p => p.month === monthKey)

    if (existingDebts.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Ya existen deudas generadas para este mes'
      })
    }

    const newDebts = []

    // Generar deudas para clientes activos
    db.clients.filter(c => c.isActive).forEach(client => {
      const service = db.services.find(s => s.id === `service-${client.servicePlan}`)
      if (!service) return

      let amount = service.price
      let billingType = 'normal'
      let comments = null

      // Lógica de prorrateo si es necesario
      if (client.billingType === 'prorated' && client.proratedDays) {
        const daysInMonth = new Date(year, month, 0).getDate()
        amount = (service.price / daysInMonth) * client.proratedDays
        billingType = 'prorated'
        comments = `Prorrateo: (${service.price} ÷ ${daysInMonth} días) × ${client.proratedDays} días = S/ ${amount.toFixed(2)}`
      } else if (client.billingType === 'free') {
        amount = 0
        billingType = 'free'
        comments = 'Mes gratis'
      }

      const debt = {
        id: `payment-${client.id}-${monthKey}`,
        clientId: client.id,
        amount: parseFloat(amount.toFixed(2)),
        billingType,
        dueDate: `${year}-${String(month).padStart(2, '0')}-${String(client.preferredPaymentDay).padStart(2, '0')}`,
        status: amount === 0 ? 'paid' : 'pending',
        paymentDate: amount === 0 ? new Date().toISOString() : null,
        paymentMethod: amount === 0 ? 'free' : null,
        collectorId: amount === 0 ? client.assignedCollector : null,
        comments,
        month: monthKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      newDebts.push(debt)
    })

    // Agregar las nuevas deudas
    db.payments.push(...newDebts)
    writeDB(db)

    res.json({
      success: true,
      data: {
        generated: newDebts.length,
        month: monthKey,
        debts: newDebts
      },
      message: `${newDebts.length} deudas generadas para ${monthKey}`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error generando deudas mensuales'
    })
  }
})

// Registrar rutas personalizadas con prefijo /api
server.use('/api', router)

// Registrar JSON Server routes también bajo /api
server.use('/api', jsonServer.router(DB_FILE))

// Ruta de health check
server.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Middleware de manejo de errores
server.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  })
})

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 JSON Server ejecutándose en http://localhost:${PORT}`)
  console.log(`📊 API disponible en http://localhost:${PORT}/api`)
  console.log(`🔐 Auth endpoints en http://localhost:${PORT}/auth`)
  console.log(`❤️ Health check en http://localhost:${PORT}/health`)
})

export default server