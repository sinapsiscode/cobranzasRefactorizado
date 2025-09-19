import { Router } from 'express'
import BusinessService from '../services/businessService.js'

const router = Router()

// GET /api/dashboard/overview - Resumen general del dashboard
router.get('/overview', async (req, res) => {
  try {
    const service = new BusinessService()
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    // Obtener estadísticas básicas
    const stats = service.getStats(currentMonth)

    // Obtener cobranzas pendientes por cobrador (solo si es admin/subadmin)
    let collectorStats = null
    if (['admin', 'subadmin'].includes(req.user.role)) {
      const collectors = service.readDB().users.filter(u => u.role === 'collector' && u.isActive)
      collectorStats = collectors.map(collector => {
        const pendingCollections = service.getPendingCollections(collector.id)
        return {
          id: collector.id,
          name: `${collector.firstName} ${collector.lastName}`,
          alias: collector.alias || collector.firstName,
          pendingClients: pendingCollections.collections.length,
          totalPending: pendingCollections.collections.reduce((sum, client) =>
            sum + client.pendingPayments.reduce((pSum, payment) => pSum + payment.amount, 0), 0
          )
        }
      })
    }

    // Datos específicos para el usuario actual
    let userSpecificData = null
    if (req.user.role === 'collector') {
      const pendingCollections = service.getPendingCollections(req.user.id)
      userSpecificData = {
        assignedClients: service.getClients({ assignedCollector: req.user.id, isActive: true }).length,
        pendingCollections: pendingCollections.collections.length,
        totalPendingAmount: pendingCollections.collections.reduce((sum, client) =>
          sum + client.pendingPayments.reduce((pSum, payment) => pSum + payment.amount, 0), 0
        )
      }
    }

    // Tendencias de los últimos 6 meses
    const trends = []
    for (let i = 5; i >= 0; i--) {
      const trendDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const trendMonth = `${trendDate.getFullYear()}-${String(trendDate.getMonth() + 1).padStart(2, '0')}`
      const monthStats = service.getStats(trendMonth)

      trends.push({
        month: trendMonth,
        revenue: monthStats.payments.revenue,
        paid: monthStats.payments.paid,
        pending: monthStats.payments.pending
      })
    }

    const overview = {
      generalStats: stats,
      userRole: req.user.role,
      userSpecificData,
      collectorStats,
      trends,
      lastUpdated: new Date().toISOString()
    }

    res.json({
      success: true,
      data: overview
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/dashboard/collections - Dashboard específico para cobradores
router.get('/collections', async (req, res) => {
  try {
    const service = new BusinessService()
    const collectorId = req.user.role === 'collector' ? req.user.id : req.query.collectorId

    if (!collectorId) {
      return res.status(400).json({
        success: false,
        error: 'collectorId es requerido'
      })
    }

    // Obtener cobranzas pendientes
    const pendingCollections = service.getPendingCollections(collectorId)

    // Obtener clientes asignados
    const assignedClients = service.getClients({
      assignedCollector: collectorId,
      isActive: true
    })

    // Obtener pagos del mes actual del cobrador
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const monthlyPayments = service.getPayments({
      collectorId,
      month: currentMonth
    })

    // Calcular métricas
    const metrics = {
      assignedClients: assignedClients.length,
      pendingCollections: pendingCollections.collections.length,
      completedThisMonth: monthlyPayments.filter(p => p.status === 'paid').length,
      totalCollectedThisMonth: monthlyPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0),
      totalPendingAmount: pendingCollections.collections.reduce((sum, client) =>
        sum + client.pendingPayments.reduce((pSum, payment) => pSum + payment.amount, 0), 0
      )
    }

    // Agrupar por barrio
    const byNeighborhood = {}
    pendingCollections.collections.forEach(client => {
      if (!byNeighborhood[client.neighborhood]) {
        byNeighborhood[client.neighborhood] = {
          neighborhood: client.neighborhood,
          clients: [],
          totalAmount: 0
        }
      }
      byNeighborhood[client.neighborhood].clients.push(client)
      byNeighborhood[client.neighborhood].totalAmount += client.pendingPayments.reduce((sum, p) => sum + p.amount, 0)
    })

    const collectionDashboard = {
      metrics,
      pendingCollections: pendingCollections.collections,
      byNeighborhood: Object.values(byNeighborhood),
      recentPayments: monthlyPayments
        .filter(p => p.status === 'paid')
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .slice(0, 10)
    }

    res.json({
      success: true,
      data: collectionDashboard
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// GET /api/dashboard/admin - Dashboard específico para administradores
router.get('/admin', async (req, res) => {
  try {
    // Solo admin y subadmin pueden acceder
    if (!['admin', 'subadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este dashboard'
      })
    }

    const service = new BusinessService()
    const db = service.readDB()

    // Obtener estadísticas generales
    const generalStats = service.getStats()

    // Estadísticas por cobrador
    const collectors = db.users.filter(u => u.role === 'collector' && u.isActive)
    const collectorPerformance = collectors.map(collector => {
      const assignedClients = service.getClients({
        assignedCollector: collector.id,
        isActive: true
      })

      const pendingCollections = service.getPendingCollections(collector.id)

      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
      const monthlyPayments = service.getPayments({
        collectorId: collector.id,
        month: currentMonth
      })

      return {
        collector: {
          id: collector.id,
          name: `${collector.firstName} ${collector.lastName}`,
          alias: collector.alias || collector.firstName
        },
        assignedClients: assignedClients.length,
        pendingCollections: pendingCollections.collections.length,
        collectedThisMonth: monthlyPayments.filter(p => p.status === 'paid').length,
        amountCollectedThisMonth: monthlyPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0),
        pendingAmount: pendingCollections.collections.reduce((sum, client) =>
          sum + client.pendingPayments.reduce((pSum, payment) => pSum + payment.amount, 0), 0
        )
      }
    })

    // Estadísticas por barrio
    const neighborhoods = [...new Set(db.clients.map(c => c.neighborhood))]
    const neighborhoodStats = neighborhoods.map(neighborhood => {
      const clients = service.getClients({ neighborhood, isActive: true })
      const pendingClients = clients.filter(client => {
        const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
        const pendingPayments = service.getPayments({
          clientId: client.id,
          month: currentMonth,
          status: 'pending'
        })
        return pendingPayments.length > 0
      })

      return {
        neighborhood,
        totalClients: clients.length,
        pendingClients: pendingClients.length,
        collectionRate: clients.length > 0 ? ((clients.length - pendingClients.length) / clients.length * 100).toFixed(1) : 0
      }
    })

    // Alertas y notificaciones
    const alerts = []

    // Verificar pagos vencidos
    const overdue = service.getPayments({ status: 'overdue' })
    if (overdue.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Pagos Vencidos',
        message: `Hay ${overdue.length} pagos vencidos que requieren atención`,
        count: overdue.length
      })
    }

    // Verificar cobradores con alta carga
    const highLoadCollectors = collectorPerformance.filter(cp => cp.pendingCollections > 20)
    if (highLoadCollectors.length > 0) {
      alerts.push({
        type: 'info',
        title: 'Carga Alta de Cobradores',
        message: `${highLoadCollectors.length} cobradores tienen más de 20 cobranzas pendientes`,
        count: highLoadCollectors.length
      })
    }

    const adminDashboard = {
      generalStats,
      collectorPerformance,
      neighborhoodStats,
      alerts,
      systemInfo: {
        totalUsers: db.users.length,
        activeUsers: db.users.filter(u => u.isActive).length,
        totalServices: db.services.length,
        activeServices: db.services.filter(s => s.isActive).length
      }
    }

    res.json({
      success: true,
      data: adminDashboard
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router