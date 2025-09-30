// Servidor mock que simula una API REST con latencia, errores y paginación
import { db } from './db.js';
import { validateClient } from './schemas/client.js';
import { validatePayment } from './schemas/payment.js';
import { validateUser } from './schemas/user.js';

// Configuración del servidor mock
const CONFIG = {
  LATENCY_MIN: 100,
  LATENCY_MAX: 600,
  ERROR_RATE: 0.02, // 2% de errores aleatorios (reducido para mayor estabilidad)
  DEFAULT_PAGE_SIZE: 25
};

// Simular latencia de red
const simulateLatency = () => {
  const delay = Math.random() * (CONFIG.LATENCY_MAX - CONFIG.LATENCY_MIN) + CONFIG.LATENCY_MIN;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Simular error de red aleatoriamente
const shouldSimulateError = () => {
  return Math.random() < CONFIG.ERROR_RATE;
};

// Generar respuesta de error
const generateError = (status = 500, message = 'Error interno del servidor') => {
  const errors = [
    { status: 400, message: 'Solicitud incorrecta' },
    { status: 404, message: 'Recurso no encontrado' },
    { status: 409, message: 'Conflicto de datos' },
    { status: 500, message: 'Error interno del servidor' },
    { status: 503, message: 'Servicio no disponible temporalmente' }
  ];
  
  const error = Math.random() < 0.5 ? { status, message } : errors[Math.floor(Math.random() * errors.length)];
  
  return {
    success: false,
    error: error.message,
    status: error.status,
    timestamp: new Date().toISOString()
  };
};

// Generar respuesta exitosa
const generateSuccess = (data, message = null) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

// Clase principal del servidor mock
export class MockServer {
  // AUTH ENDPOINTS
  async login(credentials) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError(401, 'Credenciales incorrectas');
    }
    
    const { username, password } = credentials;
    const users = db.getCollection('users') || [];
    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    
    if (!user) {
      throw generateError(401, 'Usuario o contraseña incorrectos');
    }
    
    // Actualizar último login
    db.update('users', user.id, { lastLogin: new Date().toISOString() });
    
    // Generar token simulado
    const token = btoa(`${user.id}:${Date.now()}`);
    
    const { password: _, ...userWithoutPassword } = user;
    
    return generateSuccess({
      user: userWithoutPassword,
      token,
      expiresIn: 8 * 60 * 60 * 1000 // 8 horas
    });
  }

  async logout(token) {
    await simulateLatency();
    return generateSuccess(null, 'Sesión cerrada exitosamente');
  }

  async validateToken(token) {
    await simulateLatency();
    
    try {
      const [userId] = atob(token).split(':');
      const user = db.readById('users', userId);
      
      if (!user || !user.isActive) {
        throw generateError(401, 'Token inválido');
      }
      
      const { password: _, ...userWithoutPassword } = user;
      return generateSuccess({ user: userWithoutPassword });
    } catch (error) {
      throw generateError(401, 'Token inválido');
    }
  }

  // CLIENT ENDPOINTS
  async getClients(params = {}) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    const {
      page = 1,
      limit = CONFIG.DEFAULT_PAGE_SIZE,
      search = '',
      status = '',
      plan = '',
      neighborhoods = [],
      sortBy = 'fullName',
      sortOrder = 'asc'
    } = params;
    
    let clients = db.getCollection('clients') || [];
    
    // Aplicar filtros
    if (search) {
      clients = db.search('clients', search, ['fullName', 'dni', 'phone', 'address']);
    }
    
    if (status) {
      clients = clients.filter(client => {
        if (status === 'active') return client.isActive;
        if (status === 'inactive') return !client.isActive;
        return true;
      });
    }
    
    if (plan) {
      clients = clients.filter(client => client.servicePlan === plan);
    }
    
    if (neighborhoods && neighborhoods.length > 0) {
      clients = clients.filter(client => neighborhoods.includes(client.neighborhood));
    }
    
    // Ordenar
    clients = db.sort(clients, sortBy, sortOrder);
    
    // Paginar
    const result = db.paginate(clients, parseInt(page), parseInt(limit));
    
    return generateSuccess(result);
  }

  async getClient(id) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    const client = db.readById('clients', id);
    
    if (!client) {
      throw generateError(404, 'Cliente no encontrado');
    }
    
    return generateSuccess(client);
  }

  async createClient(clientData) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    // Validar datos
    const errors = validateClient(clientData);
    if (errors) {
      throw generateError(400, 'Datos inválidos', errors);
    }
    
    // Verificar DNI único
    const existingClient = db.readAll('clients').find(c => c.dni === clientData.dni);
    if (existingClient) {
      throw generateError(409, 'Ya existe un cliente con este DNI');
    }
    
    const client = db.create('clients', clientData);
    return generateSuccess(client, 'Cliente creado exitosamente');
  }

  async updateClient(id, updates) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    const existingClient = db.readById('clients', id);
    if (!existingClient) {
      throw generateError(404, 'Cliente no encontrado');
    }
    
    // Validar datos
    const updatedData = { ...existingClient, ...updates };
    const errors = validateClient(updatedData);
    if (errors) {
      throw generateError(400, 'Datos inválidos', errors);
    }
    
    const client = db.update('clients', id, updates);
    return generateSuccess(client, 'Cliente actualizado exitosamente');
  }

  async updateClientLastLogin(clientId, lastLoginDate = null) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    const existingClient = db.readById('clients', clientId);
    if (!existingClient) {
      throw generateError(404, 'Cliente no encontrado');
    }
    
    const updateDate = lastLoginDate || new Date().toISOString();
    const client = db.update('clients', clientId, { 
      lastLogin: updateDate,
      updatedAt: new Date().toISOString()
    });
    
    return generateSuccess(client, 'Último acceso actualizado exitosamente');
  }

  async deleteClient(id) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    // Verificar que no tenga pagos pendientes
    const pendingPayments = db.readAll('payments').filter(p => 
      p.clientId === id && ['pending', 'overdue'].includes(p.status)
    );
    
    if (pendingPayments.length > 0) {
      throw generateError(409, 'No se puede eliminar cliente con pagos pendientes');
    }
    
    const deleted = db.delete('clients', id);
    
    if (!deleted) {
      throw generateError(404, 'Cliente no encontrado');
    }
    
    return generateSuccess(null, 'Cliente eliminado exitosamente');
  }

  // PAYMENT ENDPOINTS
  async getPayments(params = {}) {
    await simulateLatency();

    if (shouldSimulateError()) {
      throw generateError();
    }

    const {
      page = 1,
      limit = CONFIG.DEFAULT_PAGE_SIZE,
      clientId = '',
      status = '',
      month = '',
      year = '',
      collectorId = '',
      sortBy = 'dueDate',
      sortOrder = 'desc'
    } = params;

    let payments = db.getCollection('payments') || [];

    // Aplicar filtros
    const filters = {};
    if (clientId) filters.clientId = clientId;
    if (status) filters.status = status;
    if (month) filters.month = month;
    if (year) filters.year = parseInt(year);
    if (collectorId) filters.collectorId = collectorId;

    payments = db.applyFilters(payments, filters);

    // Ordenar
    payments = db.sort(payments, sortBy, sortOrder);

    // MODIFICACIÓN: Si se filtra por clientId específico, no paginar para asegurar que se obtengan todos los pagos del cliente
    if (clientId) {
      console.log(`=== RETORNANDO TODOS LOS PAGOS PARA ${clientId} (sin paginar) ===`);
      console.log(`Total pagos encontrados para ${clientId}:`, payments.length);

      return generateSuccess({
        items: payments,
        pagination: {
          page: 1,
          limit: payments.length,
          total: payments.length,
          pages: 1,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    // Paginar solo si no hay filtro de clientId
    const result = db.paginate(payments, parseInt(page), parseInt(limit));

    return generateSuccess(result);
  }

  async createPayment(paymentData) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    // Validar datos
    const errors = validatePayment(paymentData);
    if (errors) {
      throw generateError(400, 'Datos inválidos', errors);
    }
    
    // Verificar que el cliente existe
    const client = db.readById('clients', paymentData.clientId);
    if (!client) {
      throw generateError(404, 'Cliente no encontrado');
    }
    
    const payment = db.create('payments', paymentData);
    return generateSuccess(payment, 'Pago registrado exitosamente');
  }

  async updatePayment(id, updates) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    const existingPayment = db.readById('payments', id);
    if (!existingPayment) {
      throw generateError(404, 'Pago no encontrado');
    }
    
    const payment = db.update('payments', id, updates);
    return generateSuccess(payment, 'Pago actualizado exitosamente');
  }

  // DASHBOARD/METRICS ENDPOINTS
  async getDashboardMetrics(params = {}) {
    await simulateLatency();
    
    if (shouldSimulateError()) {
      throw generateError();
    }
    
    const { startDate, endDate, collectorId } = params;
    
    const clients = db.getCollection('clients') || [];
    const payments = db.getCollection('payments') || [];
    
    // Filtrar pagos por fecha si se proporciona
    let filteredPayments = payments;
    if (startDate || endDate || collectorId) {
      filteredPayments = payments.filter(payment => {
        let include = true;
        
        if (startDate && payment.dueDate < startDate) include = false;
        if (endDate && payment.dueDate > endDate) include = false;
        if (collectorId && payment.collectorId !== collectorId) include = false;
        
        return include;
      });
    }
    
    // Calcular métricas
    const totalCollected = filteredPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const pendingPayments = filteredPayments.filter(p => p.status === 'pending').length;
    const overduePayments = filteredPayments.filter(p => p.status === 'overdue').length;
    const overdueRate = filteredPayments.length > 0 ? 
      (overduePayments / filteredPayments.length) * 100 : 0;
    
    const currentClients = clients.filter(c => c.isActive).length;
    
    return generateSuccess({
      totalCollected,
      pendingPayments,
      overdueRate: Math.round(overdueRate * 100) / 100,
      currentClients,
      totalPayments: filteredPayments.length
    });
  }

  async getCollectionChart(months = 6) {
    await simulateLatency();
    
    const payments = db.getCollection('payments') || [];
    const currentDate = new Date();
    const chartData = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthPayments = payments.filter(p => p.month === monthStr && p.status === 'paid');
      const total = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      
      chartData.push({
        month: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
        amount: total,
        count: monthPayments.length
      });
    }
    
    return generateSuccess(chartData);
  }

  async getPaymentStatusChart() {
    await simulateLatency();
    
    const payments = db.getCollection('payments') || [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthPayments = payments.filter(p => p.month === currentMonth);
    
    const statusCounts = currentMonthPayments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {});
    
    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: Math.round((count / currentMonthPayments.length) * 100) || 0
    }));
    
    return generateSuccess(chartData);
  }
}

// Instancia singleton del servidor
export const mockServer = new MockServer();