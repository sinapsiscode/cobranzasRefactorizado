import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DB_FILE = join(__dirname, '../../db.json')

export class BusinessService {
  constructor() {
    this.db = this.readDB()
  }

  readDB() {
    try {
      const data = readFileSync(DB_FILE, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      throw new Error('Error leyendo base de datos')
    }
  }

  writeDB(data) {
    try {
      writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
      this.db = data
    } catch (error) {
      throw new Error('Error escribiendo base de datos')
    }
  }

  // Gestión de clientes
  getClients(filters = {}) {
    let clients = [...this.db.clients]

    if (filters.isActive !== undefined) {
      clients = clients.filter(c => c.isActive === filters.isActive)
    }

    if (filters.assignedCollector) {
      clients = clients.filter(c => c.assignedCollector === filters.assignedCollector)
    }

    if (filters.neighborhood) {
      clients = clients.filter(c => c.neighborhood === filters.neighborhood)
    }

    if (filters.servicePlan) {
      clients = clients.filter(c => c.servicePlan === filters.servicePlan)
    }

    return clients
  }

  getClientById(id) {
    const client = this.db.clients.find(c => c.id === id)
    if (!client) {
      throw new Error('Cliente no encontrado')
    }
    return client
  }

  createClient(clientData) {
    const requiredFields = ['fullName', 'dni', 'phone', 'address', 'neighborhood', 'servicePlan']

    for (const field of requiredFields) {
      if (!clientData[field]) {
        throw new Error(`El campo ${field} es requerido`)
      }
    }

    // Verificar DNI único
    const existingClient = this.db.clients.find(c => c.dni === clientData.dni)
    if (existingClient) {
      throw new Error('Ya existe un cliente con este DNI')
    }

    const newClient = {
      id: `client-${Date.now()}`,
      ...clientData,
      isActive: true,
      status: 'active',
      balance: 0,
      lastPaymentDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.db.clients.push(newClient)
    this.writeDB(this.db)

    return newClient
  }

  updateClient(id, updateData) {
    const clientIndex = this.db.clients.findIndex(c => c.id === id)
    if (clientIndex === -1) {
      throw new Error('Cliente no encontrado')
    }

    // No permitir cambiar ciertos campos críticos
    const protectedFields = ['id', 'createdAt']
    const cleanUpdateData = { ...updateData }
    protectedFields.forEach(field => delete cleanUpdateData[field])

    this.db.clients[clientIndex] = {
      ...this.db.clients[clientIndex],
      ...cleanUpdateData,
      updatedAt: new Date().toISOString()
    }

    this.writeDB(this.db)
    return this.db.clients[clientIndex]
  }

  deleteClient(id) {
    const clientIndex = this.db.clients.findIndex(c => c.id === id)
    if (clientIndex === -1) {
      throw new Error('Cliente no encontrado')
    }

    // Verificar si tiene pagos registrados
    const hasPayments = this.db.payments.some(p => p.clientId === id)
    if (hasPayments) {
      // En lugar de eliminar, marcar como inactivo
      this.db.clients[clientIndex].isActive = false
      this.db.clients[clientIndex].status = 'inactive'
      this.db.clients[clientIndex].updatedAt = new Date().toISOString()
    } else {
      // Si no tiene pagos, se puede eliminar completamente
      this.db.clients.splice(clientIndex, 1)
    }

    this.writeDB(this.db)
    return { success: true, message: hasPayments ? 'Cliente marcado como inactivo' : 'Cliente eliminado' }
  }

  // Gestión de pagos
  getPayments(filters = {}) {
    let payments = [...this.db.payments]

    if (filters.clientId) {
      payments = payments.filter(p => p.clientId === filters.clientId)
    }

    if (filters.status) {
      payments = payments.filter(p => p.status === filters.status)
    }

    if (filters.month) {
      payments = payments.filter(p => p.month === filters.month)
    }

    if (filters.collectorId) {
      payments = payments.filter(p => p.collectorId === filters.collectorId)
    }

    // Enriquecer con datos del cliente
    payments = payments.map(payment => {
      const client = this.db.clients.find(c => c.id === payment.clientId)
      return {
        ...payment,
        client: client ? {
          fullName: client.fullName,
          dni: client.dni,
          phone: client.phone,
          neighborhood: client.neighborhood
        } : null
      }
    })

    return payments
  }

  createPayment(paymentData) {
    const { clientId, amount, paymentMethod, comments, collectorId } = paymentData

    if (!clientId || amount === undefined || !paymentMethod) {
      throw new Error('clientId, amount y paymentMethod son requeridos')
    }

    // Verificar que el cliente existe
    const client = this.db.clients.find(c => c.id === clientId)
    if (!client) {
      throw new Error('Cliente no encontrado')
    }

    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    const newPayment = {
      id: `payment-${Date.now()}`,
      clientId,
      amount: parseFloat(amount),
      paymentMethod,
      paymentDate: currentDate.toISOString(),
      status: 'paid',
      collectorId: collectorId || null,
      comments: comments || null,
      month: currentMonth,
      billingType: 'normal',
      createdAt: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    }

    this.db.payments.push(newPayment)

    // Actualizar cliente
    const clientIndex = this.db.clients.findIndex(c => c.id === clientId)
    if (clientIndex !== -1) {
      this.db.clients[clientIndex].lastPaymentDate = newPayment.paymentDate
      this.db.clients[clientIndex].updatedAt = newPayment.updatedAt
    }

    this.writeDB(this.db)
    return newPayment
  }

  // Generar deudas mensuales
  generateMonthlyDebts(month, year) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`

    // Verificar si ya existen deudas para este mes
    const existingDebts = this.db.payments.filter(p => p.month === monthKey)
    if (existingDebts.length > 0) {
      throw new Error('Ya existen deudas generadas para este mes')
    }

    const newDebts = []
    const activeClients = this.db.clients.filter(c => c.isActive)

    activeClients.forEach(client => {
      const service = this.db.services.find(s => s.id === `service-${client.servicePlan}`)
      if (!service) return

      let amount = service.price
      let billingType = client.billingType || 'normal'
      let comments = null

      // Aplicar lógica de facturación especial
      if (billingType === 'prorated' && client.proratedDays) {
        const daysInMonth = new Date(year, month, 0).getDate()
        amount = (service.price / daysInMonth) * client.proratedDays
        comments = `Prorrateo: (${service.price} ÷ ${daysInMonth} días) × ${client.proratedDays} días = S/ ${amount.toFixed(2)}`
      } else if (billingType === 'free') {
        amount = 0
        comments = 'Mes gratis'
      }

      const debt = {
        id: `payment-${client.id}-${monthKey}`,
        clientId: client.id,
        amount: parseFloat(amount.toFixed(2)),
        billingType,
        dueDate: `${year}-${String(month).padStart(2, '0')}-${String(client.preferredPaymentDay || 15).padStart(2, '0')}`,
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

    this.db.payments.push(...newDebts)
    this.writeDB(this.db)

    return {
      generated: newDebts.length,
      month: monthKey,
      debts: newDebts
    }
  }

  // Obtener estadísticas
  getStats(month = null) {
    const currentDate = new Date()
    const targetMonth = month || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    const monthPayments = this.db.payments.filter(p => p.month === targetMonth)
    const totalRevenue = this.db.payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)

    const stats = {
      clients: {
        total: this.db.clients.length,
        active: this.db.clients.filter(c => c.isActive).length,
        inactive: this.db.clients.filter(c => !c.isActive).length
      },
      payments: {
        month: targetMonth,
        total: monthPayments.length,
        paid: monthPayments.filter(p => p.status === 'paid').length,
        pending: monthPayments.filter(p => p.status === 'pending').length,
        overdue: monthPayments.filter(p => p.status === 'overdue').length,
        revenue: monthPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0)
      },
      totalRevenue,
      services: {
        total: this.db.services.length,
        active: this.db.services.filter(s => s.isActive).length
      }
    }

    return stats
  }

  // Obtener cobranzas pendientes
  getPendingCollections(collectorId = null) {
    const currentDate = new Date()
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    let activeClients = this.db.clients.filter(c => c.isActive)

    if (collectorId) {
      activeClients = activeClients.filter(c => c.assignedCollector === collectorId)
    }

    const pendingCollections = activeClients
      .map(client => {
        const pendingPayments = this.db.payments.filter(p =>
          p.clientId === client.id &&
          p.month === currentMonth &&
          (p.status === 'pending' || p.status === 'overdue')
        )

        if (pendingPayments.length > 0) {
          return {
            ...client,
            pendingPayments
          }
        }
        return null
      })
      .filter(Boolean)

    return {
      collections: pendingCollections,
      meta: {
        total: pendingCollections.length,
        month: currentMonth,
        collectorId
      }
    }
  }

  // Marcar pago como vencido
  markPaymentsAsOverdue() {
    const currentDate = new Date()
    const today = currentDate.toISOString().split('T')[0]

    let updatedCount = 0

    this.db.payments.forEach((payment, index) => {
      if (payment.status === 'pending' && payment.dueDate < today) {
        this.db.payments[index].status = 'overdue'
        this.db.payments[index].updatedAt = new Date().toISOString()
        updatedCount++
      }
    })

    if (updatedCount > 0) {
      this.writeDB(this.db)
    }

    return { updated: updatedCount }
  }
}

export default BusinessService