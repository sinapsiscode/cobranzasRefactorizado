import { Router } from 'express'
import BusinessService from '../services/businessService.js'

const router = Router()

// GET /api/clients - Obtener todos los clientes con filtros
router.get('/', async (req, res) => {
  try {
    const service = new BusinessService()
    const filters = {
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      assignedCollector: req.query.assignedCollector,
      neighborhood: req.query.neighborhood,
      servicePlan: req.query.servicePlan
    }

    const clients = service.getClients(filters)

    res.json({
      success: true,
      data: clients,
      meta: {
        total: clients.length,
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

// GET /api/clients/:id - Obtener cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const service = new BusinessService()
    const client = service.getClientById(req.params.id)

    // Obtener historial de pagos del cliente
    const payments = service.getPayments({ clientId: req.params.id })

    res.json({
      success: true,
      data: {
        ...client,
        payments
      }
    })
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    })
  }
})

// POST /api/clients - Crear nuevo cliente
router.post('/', async (req, res) => {
  try {
    const service = new BusinessService()
    const newClient = service.createClient(req.body)

    res.status(201).json({
      success: true,
      data: newClient,
      message: 'Cliente creado exitosamente'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// PUT /api/clients/:id - Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const service = new BusinessService()
    const updatedClient = service.updateClient(req.params.id, req.body)

    res.json({
      success: true,
      data: updatedClient,
      message: 'Cliente actualizado exitosamente'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// DELETE /api/clients/:id - Eliminar/Desactivar cliente
router.delete('/:id', async (req, res) => {
  try {
    const service = new BusinessService()
    const result = service.deleteClient(req.params.id)

    res.json({
      success: true,
      ...result
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// PATCH /api/clients/:id/activate - Activar cliente
router.patch('/:id/activate', async (req, res) => {
  try {
    const service = new BusinessService()
    const updatedClient = service.updateClient(req.params.id, {
      isActive: true,
      status: 'active'
    })

    res.json({
      success: true,
      data: updatedClient,
      message: 'Cliente activado exitosamente'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

// PATCH /api/clients/:id/deactivate - Desactivar cliente
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const service = new BusinessService()
    const updatedClient = service.updateClient(req.params.id, {
      isActive: false,
      status: 'inactive'
    })

    res.json({
      success: true,
      data: updatedClient,
      message: 'Cliente desactivado exitosamente'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

export default router