import { Router } from 'express'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { generateToken, authorizeRoles } from '../middleware/auth.js'
import clientsRouter from './clients.js'
import paymentsRouter from './payments.js'
import dashboardRouter from './dashboard.js'
import cashboxRequestsRouter from './cashboxRequests.js'

const router = Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DB_FILE = join(__dirname, '../../db.json')

// Función para leer la base de datos
const readDB = () => {
  const data = readFileSync(DB_FILE, 'utf8')
  return JSON.parse(data)
}

// Función para escribir en la base de datos
const writeDB = (data) => {
  writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

// Rutas de autenticación personalizadas
router.post('/auth/login', async (req, res) => {
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

    // Verificar contraseña (simplificado para demo)
    const isValidPassword = password === user.password

    if (!isValidPassword) {
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
    const token = generateToken(user)

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

router.post('/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  })
})

router.post('/auth/validate', (req, res) => {
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

// Rutas para estadísticas del dashboard
router.get('/dashboard/stats', (req, res) => {
  try {
    const db = readDB()
    const { role, id: userId } = req.user

    let clients = db.clients
    let payments = db.payments

    // Filtrar por cobrador si es necesario
    if (role === 'collector') {
      clients = clients.filter(client => client.assignedCollector === userId)
      payments = payments.filter(payment => {
        const client = clients.find(c => c.id === payment.clientId)
        return client !== undefined
      })
    }

    const stats = {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.isActive).length,
      totalPayments: payments.length,
      totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      pendingPayments: clients.filter(c => c.balance > 0).length,
      monthlyRevenue: payments
        .filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + (p.amount || 0), 0)
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    res.status(500).json({
      success: false,
      error: 'Error obteniendo estadísticas'
    })
  }
})

// Ruta para obtener barrios
router.get('/neighborhoods', (req, res) => {
  try {
    const db = readDB()
    res.json(db.neighborhoods || [])
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo barrios'
    })
  }
})

// Rutas para servicios
router.get('/services', (req, res) => {
  try {
    const db = readDB()
    const services = db.services.filter(service => service.isActive)
    res.json({
      success: true,
      data: services
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo servicios'
    })
  }
})

// Ruta para obtener barrios
router.get('/neighborhoods', (req, res) => {
  try {
    const db = readDB()
    res.json({
      success: true,
      data: db.neighborhoods || []
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo barrios'
    })
  }
})

// Registrar rutas modularizadas
router.use('/clients', clientsRouter)
router.use('/payments', paymentsRouter)
router.use('/dashboard', dashboardRouter)
router.use('/cashbox-requests', cashboxRequestsRouter)

// Ruta de información de la API
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'TV Cable Cobranzas API',
      version: '1.0.0',
      description: 'API REST para gestión de cobranzas de TV Cable',
      endpoints: {
        auth: {
          login: 'POST /auth/login',
          logout: 'POST /auth/logout',
          validate: 'POST /auth/validate'
        },
        clients: {
          list: 'GET /api/clients',
          get: 'GET /api/clients/:id',
          create: 'POST /api/clients',
          update: 'PUT /api/clients/:id',
          delete: 'DELETE /api/clients/:id',
          activate: 'PATCH /api/clients/:id/activate',
          deactivate: 'PATCH /api/clients/:id/deactivate'
        },
        payments: {
          list: 'GET /api/payments',
          create: 'POST /api/payments',
          pending: 'GET /api/payments/pending',
          generate: 'POST /api/payments/generate-monthly',
          markOverdue: 'PUT /api/payments/mark-overdue',
          stats: 'GET /api/payments/stats',
          byClient: 'GET /api/payments/by-client/:clientId'
        },
        dashboard: {
          overview: 'GET /api/dashboard/overview',
          collections: 'GET /api/dashboard/collections',
          admin: 'GET /api/dashboard/admin'
        },
        business: {
          pendingCollections: 'GET /api/business/collections/pending',
          registerPayment: 'POST /api/business/payments',
          stats: 'GET /api/business/stats',
          generateDebts: 'POST /api/business/generate-monthly-debts'
        }
      }
    }
  })
})

export default router