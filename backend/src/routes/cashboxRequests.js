import { Router } from 'express'
import BusinessService from '../services/businessService.js'

const router = Router()

// GET /api/cashbox-requests - Obtener todas las solicitudes con filtros
router.get('/', async (req, res) => {
  try {
    const service = new BusinessService()
    const db = service.readDB()

    let requests = [...db.cashBoxRequests]

    // Filtros
    if (req.query.status) {
      requests = requests.filter(r => r.status === req.query.status)
    }

    if (req.query.collectorId) {
      requests = requests.filter(r => r.collectorId === req.query.collectorId)
    }

    if (req.query.workDate) {
      requests = requests.filter(r => r.workDate === req.query.workDate)
    }

    // Para cobradores, solo mostrar sus propias solicitudes
    if (req.user.role === 'collector') {
      requests = requests.filter(r => r.collectorId === req.user.id)
    }

    // Ordenar por fecha de solicitud (más recientes primero)
    requests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))

    res.json({
      success: true,
      data: requests,
      meta: {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/cashbox-requests/:id - Obtener solicitud por ID
router.get('/:id', async (req, res) => {
  try {
    const service = new BusinessService()
    const db = service.readDB()

    const request = db.cashBoxRequests.find(r => r.id === req.params.id)

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    // Para cobradores, solo pueden ver sus propias solicitudes
    if (req.user.role === 'collector' && request.collectorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para ver esta solicitud'
      })
    }

    res.json({
      success: true,
      data: request
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/cashbox-requests - Crear nueva solicitud
router.post('/', async (req, res) => {
  try {
    const service = new BusinessService()
    const db = service.readDB()

    const { workDate, requestedInitialCash, notes } = req.body

    // Validaciones
    if (!workDate) {
      return res.status(400).json({
        success: false,
        error: 'La fecha de trabajo es requerida'
      })
    }

    if (!requestedInitialCash || !requestedInitialCash.efectivo) {
      return res.status(400).json({
        success: false,
        error: 'El monto de efectivo solicitado es requerido'
      })
    }

    // Para cobradores, usar su propio ID
    const collectorId = req.user.role === 'collector' ? req.user.id : req.body.collectorId

    if (!collectorId) {
      return res.status(400).json({
        success: false,
        error: 'ID del cobrador es requerido'
      })
    }

    // Buscar información del cobrador
    const collector = db.users.find(u => u.id === collectorId && u.role === 'collector')
    if (!collector) {
      return res.status(400).json({
        success: false,
        error: 'Cobrador no encontrado'
      })
    }

    // Verificar si ya tiene una solicitud pendiente para la misma fecha
    const existingRequest = db.cashBoxRequests.find(r =>
      r.collectorId === collectorId &&
      r.workDate === workDate &&
      r.status === 'pending'
    )

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'Ya tienes una solicitud pendiente para esta fecha'
      })
    }

    // Crear nueva solicitud
    const newRequest = {
      id: `request-${new Date().toISOString().split('T')[0]}-${collectorId}`,
      collectorId,
      collectorName: `${collector.firstName} ${collector.lastName}`,
      requestDate: new Date().toISOString(),
      workDate,
      status: 'pending',
      requestedInitialCash: {
        efectivo: parseFloat(requestedInitialCash.efectivo),
        digital: {
          yape: parseFloat(requestedInitialCash.digital?.yape || 0),
          plin: parseFloat(requestedInitialCash.digital?.plin || 0),
          transferencia: parseFloat(requestedInitialCash.digital?.transferencia || 0),
          otros: parseFloat(requestedInitialCash.digital?.otros || 0)
        }
      },
      notes: notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    db.cashBoxRequests.push(newRequest)
    service.writeDB(db)

    res.status(201).json({
      success: true,
      data: newRequest,
      message: 'Solicitud creada exitosamente'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/cashbox-requests/:id/approve - Aprobar solicitud (solo admin/subadmin)
router.put('/:id/approve', async (req, res) => {
  try {
    // Solo admins y subadmins pueden aprobar
    if (!['admin', 'subadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para aprobar solicitudes'
      })
    }

    const service = new BusinessService()
    const db = service.readDB()

    const requestIndex = db.cashBoxRequests.findIndex(r => r.id === req.params.id)

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    const request = db.cashBoxRequests[requestIndex]

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden aprobar solicitudes pendientes'
      })
    }

    // Actualizar solicitud
    db.cashBoxRequests[requestIndex] = {
      ...request,
      status: 'approved',
      approvedBy: req.user.id,
      approvalDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    service.writeDB(db)

    res.json({
      success: true,
      data: db.cashBoxRequests[requestIndex],
      message: 'Solicitud aprobada exitosamente'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/cashbox-requests/:id/reject - Rechazar solicitud (solo admin/subadmin)
router.put('/:id/reject', async (req, res) => {
  try {
    // Solo admins y subadmins pueden rechazar
    if (!['admin', 'subadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para rechazar solicitudes'
      })
    }

    const service = new BusinessService()
    const db = service.readDB()

    const requestIndex = db.cashBoxRequests.findIndex(r => r.id === req.params.id)

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    const request = db.cashBoxRequests[requestIndex]

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden rechazar solicitudes pendientes'
      })
    }

    const { rejectionReason } = req.body

    // Actualizar solicitud
    db.cashBoxRequests[requestIndex] = {
      ...request,
      status: 'rejected',
      rejectedBy: req.user.id,
      rejectionDate: new Date().toISOString(),
      rejectionReason: rejectionReason || 'No especificado',
      updatedAt: new Date().toISOString()
    }

    service.writeDB(db)

    res.json({
      success: true,
      data: db.cashBoxRequests[requestIndex],
      message: 'Solicitud rechazada'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/cashbox-requests/:id - Actualizar solicitud (solo el cobrador que la creó)
router.put('/:id', async (req, res) => {
  try {
    const service = new BusinessService()
    const db = service.readDB()

    const requestIndex = db.cashBoxRequests.findIndex(r => r.id === req.params.id)

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    const request = db.cashBoxRequests[requestIndex]

    // Solo el cobrador que creó la solicitud puede editarla
    if (req.user.role === 'collector' && request.collectorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Solo puedes editar tus propias solicitudes'
      })
    }

    // Solo se pueden editar solicitudes pendientes
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden editar solicitudes pendientes'
      })
    }

    const { requestedInitialCash, notes } = req.body

    // Actualizar campos permitidos
    const updatedData = {}

    if (requestedInitialCash) {
      updatedData.requestedInitialCash = {
        efectivo: parseFloat(requestedInitialCash.efectivo),
        digital: {
          yape: parseFloat(requestedInitialCash.digital?.yape || 0),
          plin: parseFloat(requestedInitialCash.digital?.plin || 0),
          transferencia: parseFloat(requestedInitialCash.digital?.transferencia || 0),
          otros: parseFloat(requestedInitialCash.digital?.otros || 0)
        }
      }
    }

    if (notes !== undefined) {
      updatedData.notes = notes
    }

    db.cashBoxRequests[requestIndex] = {
      ...request,
      ...updatedData,
      updatedAt: new Date().toISOString()
    }

    service.writeDB(db)

    res.json({
      success: true,
      data: db.cashBoxRequests[requestIndex],
      message: 'Solicitud actualizada exitosamente'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// DELETE /api/cashbox-requests/:id - Eliminar solicitud (solo pendientes)
router.delete('/:id', async (req, res) => {
  try {
    const service = new BusinessService()
    const db = service.readDB()

    const requestIndex = db.cashBoxRequests.findIndex(r => r.id === req.params.id)

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Solicitud no encontrada'
      })
    }

    const request = db.cashBoxRequests[requestIndex]

    // Solo el cobrador que creó la solicitud o un admin puede eliminarla
    if (req.user.role === 'collector' && request.collectorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Solo puedes eliminar tus propias solicitudes'
      })
    }

    // Solo se pueden eliminar solicitudes pendientes
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden eliminar solicitudes pendientes'
      })
    }

    db.cashBoxRequests.splice(requestIndex, 1)
    service.writeDB(db)

    res.json({
      success: true,
      message: 'Solicitud eliminada exitosamente'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/cashbox-requests/stats - Estadísticas de solicitudes
router.get('/stats', async (req, res) => {
  try {
    const service = new BusinessService()
    const db = service.readDB()

    let requests = [...db.cashBoxRequests]

    // Para cobradores, solo sus solicitudes
    if (req.user.role === 'collector') {
      requests = requests.filter(r => r.collectorId === req.user.id)
    }

    const stats = {
      total: requests.length,
      byStatus: {
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length
      },
      totalRequested: {
        efectivo: requests.reduce((sum, r) => sum + r.requestedInitialCash.efectivo, 0),
        digital: requests.reduce((sum, r) =>
          sum + (r.requestedInitialCash.digital.yape || 0) +
          (r.requestedInitialCash.digital.plin || 0) +
          (r.requestedInitialCash.digital.transferencia || 0), 0
        )
      }
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router