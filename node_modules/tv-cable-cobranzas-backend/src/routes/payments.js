import { Router } from 'express'
import BusinessService from '../services/businessService.js'

const router = Router()

// GET /api/payments - Obtener todos los pagos con filtros
router.get('/', async (req, res) => {
  try {
    const service = new BusinessService()
    const filters = {
      clientId: req.query.clientId,
      status: req.query.status,
      month: req.query.month,
      collectorId: req.query.collectorId
    }

    const payments = service.getPayments(filters)

    res.json({
      success: true,
      data: payments,
      meta: {
        total: payments.length,
        filters
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/payments - Registrar nuevo pago
router.post('/', async (req, res) => {
  try {
    const service = new BusinessService()
    const paymentData = {
      ...req.body,
      collectorId: req.body.collectorId || req.user.id
    }

    const newPayment = service.createPayment(paymentData)

    res.status(201).json({
      success: true,
      data: newPayment,
      message: 'Pago registrado exitosamente'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/payments/pending - Obtener pagos pendientes
router.get('/pending', async (req, res) => {
  try {
    const service = new BusinessService()
    const collectorId = req.query.collectorId || (req.user.role === 'collector' ? req.user.id : null)

    const pendingCollections = service.getPendingCollections(collectorId)

    res.json({
      success: true,
      data: pendingCollections.collections,
      meta: pendingCollections.meta
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/payments/generate-monthly - Generar deudas mensuales
router.post('/generate-monthly', async (req, res) => {
  try {
    // Solo admins y subadmins pueden generar deudas
    if (!['admin', 'subadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      })
    }

    const service = new BusinessService()
    const { month, year } = req.body

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'month y year son requeridos'
      })
    }

    const result = service.generateMonthlyDebts(month, year)

    res.json({
      success: true,
      data: result,
      message: `${result.generated} deudas generadas para ${result.month}`
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/payments/mark-overdue - Marcar pagos vencidos
router.put('/mark-overdue', async (req, res) => {
  try {
    // Solo admins y subadmins pueden marcar como vencidos
    if (!['admin', 'subadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción'
      })
    }

    const service = new BusinessService()
    const result = service.markPaymentsAsOverdue()

    res.json({
      success: true,
      data: result,
      message: `${result.updated} pagos marcados como vencidos`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/payments/stats - Obtener estadísticas de pagos
router.get('/stats', async (req, res) => {
  try {
    const service = new BusinessService()
    const month = req.query.month

    const stats = service.getStats(month)

    res.json({
      success: true,
      data: stats,
      meta: {
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/payments/by-client/:clientId - Obtener pagos de un cliente específico
router.get('/by-client/:clientId', async (req, res) => {
  try {
    const service = new BusinessService()
    const payments = service.getPayments({ clientId: req.params.clientId })

    // Calcular resumen
    const summary = {
      total: payments.length,
      paid: payments.filter(p => p.status === 'paid').length,
      pending: payments.filter(p => p.status === 'pending').length,
      overdue: payments.filter(p => p.status === 'overdue').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0)
    }

    res.json({
      success: true,
      data: payments,
      summary
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router