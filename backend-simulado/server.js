import jsonServer from 'json-server';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
  static: join(__dirname, 'public')
});

const PORT = 8231;

// Middleware de logging
server.use(morgan('dev'));

// Middlewares por defecto (CORS, logger, static)
server.use(middlewares);

// Middleware para parsear JSON
server.use(jsonServer.bodyParser);

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
server.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Username y password son requeridos'
    });
  }

  const db = router.db; // Acceder a la base de datos
  const user = db.get('users')
    .find({ username, password })
    .value();

  if (!user) {
    return res.status(401).json({
      error: 'Credenciales inválidas'
    });
  }

  // Actualizar lastLogin
  db.get('users')
    .find({ id: user.id })
    .assign({ lastLogin: new Date().toISOString() })
    .write();

  // Generar token simple (en producción usar JWT)
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      alias: user.alias
    },
    token
  });
});

server.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

server.get('/api/auth/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [userId] = decoded.split(':');

    const db = router.db;
    const user = db.get('users').find({ id: userId }).value();

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        alias: user.alias
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// ============================================
// MIDDLEWARE DE SIMULACIÓN DE LATENCIA
// ============================================
server.use((req, res, next) => {
  // Simular latencia de red (100-500ms)
  const delay = Math.floor(Math.random() * 400) + 100;
  setTimeout(next, delay);
});

// ============================================
// RUTAS PERSONALIZADAS
// ============================================

// Endpoint personalizado para obtener clientes con filtros y paginación
server.get('/api/clients', (req, res) => {
  const db = router.db;
  const {
    search = '',
    status = '',
    plan = '',
    clientStatus = '',
    neighborhoods = '',
    sortBy = 'fullName',
    sortOrder = 'asc',
    page = 1,
    limit = 25
  } = req.query;

  let clients = db.get('clients').value();

  // Filtro de búsqueda (nombre, DNI, teléfono, email)
  if (search && search.length >= 3) {
    const searchLower = search.toLowerCase();
    clients = clients.filter(client =>
      client.fullName?.toLowerCase().includes(searchLower) ||
      client.dni?.toLowerCase().includes(searchLower) ||
      client.phone?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    );
  }

  // Filtro por plan de servicio
  if (plan) {
    clients = clients.filter(client => client.servicePlan === plan);
  }

  // Filtro por estado de cliente
  if (clientStatus) {
    clients = clients.filter(client => (client.status || 'active') === clientStatus);
  }

  // Filtro por barrios (puede ser múltiple)
  if (neighborhoods) {
    const neighborhoodArray = Array.isArray(neighborhoods) ? neighborhoods : [neighborhoods];
    if (neighborhoodArray.length > 0 && neighborhoodArray[0] !== '') {
      clients = clients.filter(client => neighborhoodArray.includes(client.neighborhood));
    }
  }

  // Ordenamiento
  clients.sort((a, b) => {
    let aVal = a[sortBy] || '';
    let bVal = b[sortBy] || '';

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Paginación
  const total = clients.length;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const pages = Math.ceil(total / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  const paginatedClients = clients.slice(startIndex, endIndex);

  res.json({
    items: paginatedClients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: total,
      pages: pages,
      hasNext: pageNum < pages,
      hasPrev: pageNum > 1
    }
  });
});

// Obtener clientes con deudas
server.get('/api/clients/with-debts', (req, res) => {
  const db = router.db;
  const clients = db.get('clients').value();
  const payments = db.get('payments').value();

  const clientsWithDebts = clients.filter(client => {
    const clientPayments = payments.filter(p => p.clientId === client.id);
    const overduePayments = clientPayments.filter(p => p.status === 'overdue');
    return overduePayments.length > 0;
  }).map(client => {
    const clientPayments = payments.filter(p => p.clientId === client.id);
    const overduePayments = clientPayments.filter(p => p.status === 'overdue');
    const totalDebt = overduePayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      ...client,
      debtCount: overduePayments.length,
      totalDebt
    };
  });

  res.json(clientsWithDebts);
});

// Obtener pagos por cliente
server.get('/api/clients/:clientId/payments', (req, res) => {
  const { clientId } = req.params;
  const db = router.db;

  const payments = db.get('payments')
    .filter({ clientId })
    .orderBy(['year', 'month'], ['desc', 'desc'])
    .value();

  res.json(payments);
});

// Estadísticas de dashboard
server.get('/api/stats/dashboard', (req, res) => {
  const db = router.db;
  const payments = db.get('payments').value();
  const clients = db.get('clients').value();

  const totalCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const strictPendingPayments = payments.filter(p => p.status === 'pending').length;
  const overduePayments = payments.filter(p => p.status === 'overdue').length;
  const pendingPayments = strictPendingPayments + overduePayments; // Total de pagos sin pagar
  const activeClients = clients.filter(c => c.status === 'active').length;

  const overdueRate = payments.length > 0
    ? (overduePayments / payments.length * 100).toFixed(2)
    : 0;

  res.json({
    data: {
      totalCollected,
      pendingPayments, // Total de pagos pendientes (pending + overdue)
      strictPendingPayments, // Solo pagos en estado "pending"
      overduePayments, // Solo pagos en estado "overdue"
      activeClients,
      currentClients: activeClients, // Alias para compatibilidad con el frontend
      clientesActivos: activeClients, // Alias para compatibilidad con subadmin
      overdueRate: parseFloat(overdueRate),
      totalClients: clients.length,
      pagosPendientes: pendingPayments // Alias para compatibilidad con subadmin
    }
  });
});

// Actualizar estado de pago
server.patch('/api/payments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, paymentMethod, paymentDate, collectorId } = req.body;

  const db = router.db;
  const payment = db.get('payments').find({ id }).value();

  if (!payment) {
    return res.status(404).json({ error: 'Pago no encontrado' });
  }

  const updatedPayment = db.get('payments')
    .find({ id })
    .assign({
      status,
      paymentMethod,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      collectorId
    })
    .write();

  res.json(updatedPayment);
});

// Obtener deudas mensuales
server.get('/api/monthly-debts', (req, res) => {
  const db = router.db;
  const payments = db.get('payments').value();
  const clients = db.get('clients').value();

  const debts = payments
    .filter(p => p.status === 'overdue' || p.status === 'pending')
    .map(payment => {
      const client = clients.find(c => c.id === payment.clientId);
      const dueDate = new Date(payment.dueDate);
      const today = new Date();
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      return {
        id: `debt-${payment.id}`,
        clientId: payment.clientId,
        clientName: client?.fullName || 'Desconocido',
        paymentId: payment.id,
        month: payment.month,
        year: payment.year,
        amount: payment.amount,
        dueDate: payment.dueDate,
        status: payment.status,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0
      };
    });

  res.json(debts);
});

// Crear solicitud de caja
server.post('/api/cashbox/request', (req, res) => {
  const db = router.db;
  const { collectorId, requestedInitialCash, notes } = req.body;

  const collector = db.get('users').find({ id: collectorId }).value();

  if (!collector) {
    return res.status(404).json({ error: 'Cobrador no encontrado' });
  }

  const today = new Date().toISOString().split('T')[0];
  const newRequest = {
    id: `req-${today}-${collectorId}`,
    collectorId,
    collectorName: collector.fullName,
    requestDate: new Date().toISOString(),
    workDate: today,
    status: 'pending',
    requestedInitialCash,
    approvedInitialCash: null,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedBy: null,
    approvedAt: null
  };

  db.get('cashBoxRequests').push(newRequest).write();

  res.status(201).json(newRequest);
});

// Aprobar/Rechazar solicitud de caja
server.patch('/api/cashbox/request/:id', (req, res) => {
  const { id } = req.params;
  const { status, approvedInitialCash, approvedBy } = req.body;

  const db = router.db;
  const request = db.get('cashBoxRequests').find({ id }).value();

  if (!request) {
    return res.status(404).json({ error: 'Solicitud no encontrada' });
  }

  const updatedRequest = db.get('cashBoxRequests')
    .find({ id })
    .assign({
      status,
      approvedInitialCash: approvedInitialCash || request.requestedInitialCash,
      approvedBy,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .write();

  res.json(updatedRequest);
});

// ============================================
// ENDPOINTS ADICIONALES CRÍTICOS
// ============================================

// Cambiar estado de cliente con historial
server.post('/api/clients/:id/change-status', (req, res) => {
  const { id } = req.params;
  const { newStatus, reason, adminId } = req.body;

  const db = router.db;
  const client = db.get('clients').find({ id }).value();

  if (!client) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  // Crear entrada en historial
  const statusHistory = [
    ...(client.statusHistory || []),
    {
      fromStatus: client.status || 'active',
      toStatus: newStatus,
      date: new Date().toISOString(),
      reason: reason || '',
      changedBy: adminId || 'system'
    }
  ];

  // Preparar updates según el estado
  const updates = {
    status: newStatus,
    statusReason: reason,
    statusHistory,
    updatedAt: new Date().toISOString()
  };

  // Lógica específica por estado
  if (newStatus === 'paused') {
    updates.pauseStartDate = new Date().toISOString();
    updates.pauseReason = reason;
    updates.isActive = false;
  } else if (newStatus === 'terminated') {
    updates.isArchived = true;
    updates.archivedDate = new Date().toISOString();
    updates.isActive = false;
  } else if (newStatus === 'active') {
    updates.isActive = true;
    updates.pauseStartDate = null;
    updates.pauseReason = null;
  }

  // Actualizar cliente
  const updated = db.get('clients')
    .find({ id })
    .assign(updates)
    .write();

  res.json(updated);
});

// Actualizar último acceso del cliente
server.patch('/api/clients/:id/last-login', (req, res) => {
  const { id } = req.params;
  const { lastLogin } = req.body;

  const db = router.db;
  const client = db.get('clients').find({ id }).value();

  if (!client) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  const updated = db.get('clients')
    .find({ id })
    .assign({
      lastLogin: lastLogin || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .write();

  res.json(updated);
});

// Verificar bajas automáticas
server.get('/api/clients/check-automatic-terminations', (req, res) => {
  const db = router.db;
  const clients = db.get('clients').value();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const clientsToTerminate = clients.filter(client => {
    if (client.status !== 'paused') return false;
    if (!client.pauseStartDate) return false;

    const pauseStart = new Date(client.pauseStartDate);
    return pauseStart <= thirtyDaysAgo;
  });

  res.json({
    count: clientsToTerminate.length,
    clients: clientsToTerminate
  });
});

// Gráfico de cobranza (últimos N meses)
server.get('/api/stats/collection-chart', (req, res) => {
  const { months = 6 } = req.query;
  const db = router.db;
  const payments = db.get('payments').value();

  const currentDate = new Date();
  const chartData = [];

  for (let i = parseInt(months) - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const monthPayments = payments.filter(p => p.month === monthKey);
    const collected = monthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    chartData.push({
      month: monthKey,
      monthName: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      collected,
      payments: monthPayments.length,
      paid: monthPayments.filter(p => p.status === 'paid').length
    });
  }

  res.json({ data: chartData });
});

// Gráfico de estados de pago
server.get('/api/stats/payment-status-chart', (req, res) => {
  const db = router.db;
  const payments = db.get('payments').value();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthPayments = payments.filter(p => p.month === currentMonth);

  const statusCounts = currentMonthPayments.reduce((acc, payment) => {
    acc[payment.status] = (acc[payment.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    percentage: currentMonthPayments.length > 0
      ? Math.round((count / currentMonthPayments.length) * 100)
      : 0
  }));

  res.json({ data: chartData });
});

// Validar DNI único (antes de crear/actualizar)
server.post('/api/clients/validate-dni', (req, res) => {
  const { dni, excludeId } = req.body;

  const db = router.db;
  const existingClient = db.get('clients')
    .filter(c => c.dni === dni && c.id !== excludeId)
    .value();

  res.json({
    isUnique: existingClient.length === 0,
    exists: existingClient.length > 0
  });
});

// Verificar si cliente puede ser eliminado
server.get('/api/clients/:id/can-delete', (req, res) => {
  const { id } = req.params;
  const db = router.db;

  const client = db.get('clients').find({ id }).value();
  if (!client) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  // Verificar pagos pendientes
  const pendingPayments = db.get('payments')
    .filter(p => p.clientId === id && (p.status === 'pending' || p.status === 'overdue'))
    .value();

  const canDelete = pendingPayments.length === 0;

  res.json({
    canDelete,
    reason: canDelete ? null : 'Cliente tiene pagos pendientes',
    pendingPaymentsCount: pendingPayments.length
  });
});

// Obtener clientes por barrio
server.get('/api/clients/by-neighborhood/:neighborhood', (req, res) => {
  const { neighborhood } = req.params;
  const db = router.db;

  const clients = db.get('clients')
    .filter({ neighborhood })
    .value();

  res.json(clients);
});

// Obtener barrios con deudores
server.get('/api/neighborhoods/with-debtors', (req, res) => {
  const db = router.db;
  const clients = db.get('clients').value();
  const payments = db.get('payments').value();

  const clientsWithDebt = clients.filter(client => {
    const clientPayments = payments.filter(p => p.clientId === client.id);
    if (clientPayments.length === 0) return true;

    const hasOverdue = clientPayments.some(p => p.status === 'overdue');
    const hasPending = clientPayments.some(p => p.status === 'pending');

    return hasOverdue || hasPending;
  });

  const neighborhoods = [...new Set(clientsWithDebt.map(c => c.neighborhood).filter(Boolean))];

  res.json(neighborhoods.sort());
});

// Estadísticas por cobrador
server.get('/api/stats/collector/:collectorId', (req, res) => {
  const { collectorId } = req.params;
  const db = router.db;

  const payments = db.get('payments')
    .filter({ collectorId })
    .value();

  const stats = {
    totalCollections: payments.filter(p => p.status === 'paid').length,
    totalAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pendingCollections: payments.filter(p => p.status === 'collected').length,
    clients: [...new Set(payments.map(p => p.clientId))].length
  };

  res.json(stats);
});

// ============================================
// ENDPOINTS DE CLIENT EXTENDED DATA
// ============================================

// Obtener todos los datos extendidos o por clientId
server.get('/api/client-extended', (req, res) => {
  const { clientId } = req.query;
  const db = router.db;

  let extendedData = db.get('clientExtended').value() || [];

  // Filtrar por clientId si se proporciona
  if (clientId) {
    const data = extendedData.find(d => d.clientId === clientId);
    return res.json(data || null);
  }

  res.json(extendedData);
});

// Crear/actualizar datos extendidos de un cliente
server.post('/api/client-extended', (req, res) => {
  const { clientId } = req.body;
  const db = router.db;

  if (!clientId) {
    return res.status(400).json({ error: 'clientId es requerido' });
  }

  // Verificar si ya existe
  const existing = db.get('clientExtended').find({ clientId }).value();

  if (existing) {
    // Actualizar existente
    const updated = db.get('clientExtended')
      .find({ clientId })
      .assign({
        ...req.body,
        lastModified: new Date().toISOString()
      })
      .write();

    return res.json(updated);
  }

  // Crear nuevo
  const newData = {
    id: `ext-${Date.now()}-${clientId}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  db.get('clientExtended').push(newData).write();

  res.status(201).json(newData);
});

// Actualizar datos extendidos
server.patch('/api/client-extended/:clientId', (req, res) => {
  const { clientId } = req.params;
  const db = router.db;

  const existing = db.get('clientExtended').find({ clientId }).value();

  if (!existing) {
    return res.status(404).json({ error: 'Datos extendidos no encontrados' });
  }

  const updated = db.get('clientExtended')
    .find({ clientId })
    .assign({
      ...req.body,
      lastModified: new Date().toISOString()
    })
    .write();

  res.json(updated);
});

// Eliminar datos extendidos
server.delete('/api/client-extended/:clientId', (req, res) => {
  const { clientId } = req.params;
  const db = router.db;

  const existing = db.get('clientExtended').find({ clientId }).value();

  if (!existing) {
    return res.status(404).json({ error: 'Datos extendidos no encontrados' });
  }

  db.get('clientExtended').remove({ clientId }).write();

  res.json({ message: 'Datos extendidos eliminados correctamente' });
});

// Importación masiva de datos extendidos
server.post('/api/client-extended/bulk', (req, res) => {
  const { data } = req.body;
  const db = router.db;

  if (!Array.isArray(data)) {
    return res.status(400).json({ error: 'Se requiere un array de datos' });
  }

  const results = [];

  data.forEach(item => {
    const existing = db.get('clientExtended').find({ clientId: item.clientId }).value();

    if (existing) {
      // Actualizar
      const updated = db.get('clientExtended')
        .find({ clientId: item.clientId })
        .assign({
          ...item,
          lastModified: new Date().toISOString()
        })
        .write();
      results.push(updated);
    } else {
      // Crear
      const newData = {
        id: `ext-${Date.now()}-${item.clientId}`,
        ...item,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      db.get('clientExtended').push(newData).write();
      results.push(newData);
    }
  });

  res.status(201).json({
    message: `${results.length} registros procesados`,
    data: results
  });
});

// ============================================
// ENDPOINTS DE SETTINGS (CONFIGURACIONES)
// ============================================

// Obtener configuraciones
server.get('/api/settings', (req, res) => {
  const db = router.db;
  const settings = db.get('settings').value() || { emailConfig: {}, emailTemplates: {} };
  res.json(settings);
});

// Actualizar configuraciones
server.patch('/api/settings', (req, res) => {
  const db = router.db;
  const currentSettings = db.get('settings').value() || { emailConfig: {}, emailTemplates: {} };

  const updated = {
    ...currentSettings,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  db.set('settings', updated).write();
  res.json(updated);
});

// ============================================
// ENDPOINTS DE NEIGHBORHOODS (BARRIOS)
// ============================================

// Obtener todos los barrios únicos desde los clientes
server.get('/api/neighborhoods', (req, res) => {
  const db = router.db;
  const clients = db.get('clients').value();
  const settings = db.get('settings').value();

  // Obtener barrios de clientes
  const clientNeighborhoods = clients
    .map(c => c.neighborhood)
    .filter(Boolean);

  // Obtener barrios configurados
  const configuredNeighborhoods = settings.neighborhoods || [];

  // Combinar ambos y obtener únicos
  const allNeighborhoods = [...new Set([...configuredNeighborhoods, ...clientNeighborhoods])].sort();

  res.json(allNeighborhoods);
});

// Crear nuevo barrio (agrega un cliente temporal con ese barrio)
server.post('/api/neighborhoods', (req, res) => {
  const { name } = req.body;
  const db = router.db;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nombre de barrio requerido' });
  }

  const trimmedName = name.trim();

  // Obtener configuración actual
  const settings = db.get('settings').value();
  const currentNeighborhoods = settings.neighborhoods || [];

  // Verificar si ya existe en la configuración
  if (currentNeighborhoods.includes(trimmedName)) {
    return res.status(400).json({ error: 'El barrio ya existe' });
  }

  // Agregar el barrio a la lista de neighborhoods en settings
  const updatedNeighborhoods = [...currentNeighborhoods, trimmedName];

  db.get('settings')
    .assign({
      neighborhoods: updatedNeighborhoods,
      updatedAt: new Date().toISOString()
    })
    .write();

  res.status(201).json({
    name: trimmedName,
    message: 'Barrio agregado correctamente',
    neighborhoods: updatedNeighborhoods
  });
});

// Actualizar barrio (renombrar en todos los clientes y en settings)
server.patch('/api/neighborhoods/:oldName', (req, res) => {
  const { oldName } = req.params;
  const { newName } = req.body;
  const db = router.db;

  if (!newName || !newName.trim()) {
    return res.status(400).json({ error: 'Nuevo nombre de barrio requerido' });
  }

  const trimmedNewName = newName.trim();
  const decodedOldName = decodeURIComponent(oldName);

  // Obtener configuración actual
  const settings = db.get('settings').value();
  const currentNeighborhoods = settings.neighborhoods || [];

  // Verificar si el nuevo nombre ya existe
  const clients = db.get('clients').value();
  const newNameExists = clients.some(c => c.neighborhood === trimmedNewName && c.neighborhood !== decodedOldName);

  if (newNameExists || (currentNeighborhoods.includes(trimmedNewName) && trimmedNewName !== decodedOldName)) {
    return res.status(400).json({ error: 'El nuevo nombre ya existe' });
  }

  // Actualizar todos los clientes con este barrio
  const clientsToUpdate = clients.filter(c => c.neighborhood === decodedOldName);

  clientsToUpdate.forEach(client => {
    db.get('clients')
      .find({ id: client.id })
      .assign({
        neighborhood: trimmedNewName,
        updatedAt: new Date().toISOString()
      })
      .write();
  });

  // Actualizar el barrio en settings si existe
  const neighborhoodIndex = currentNeighborhoods.indexOf(decodedOldName);
  if (neighborhoodIndex !== -1) {
    const updatedNeighborhoods = [...currentNeighborhoods];
    updatedNeighborhoods[neighborhoodIndex] = trimmedNewName;

    db.get('settings')
      .assign({
        neighborhoods: updatedNeighborhoods,
        updatedAt: new Date().toISOString()
      })
      .write();
  }

  res.json({
    message: `Barrio actualizado${clientsToUpdate.length > 0 ? ` en ${clientsToUpdate.length} cliente(s)` : ''}`,
    oldName: decodedOldName,
    newName: trimmedNewName,
    affectedClients: clientsToUpdate.length
  });
});

// Eliminar barrio (solo si no tiene clientes asignados)
server.delete('/api/neighborhoods/:name', (req, res) => {
  const { name } = req.params;
  const db = router.db;
  const decodedName = decodeURIComponent(name);

  // Verificar si hay clientes en este barrio
  const clients = db.get('clients').value();
  const clientsInNeighborhood = clients.filter(c => c.neighborhood === decodedName);

  if (clientsInNeighborhood.length > 0) {
    return res.status(400).json({
      error: `No se puede eliminar. Hay ${clientsInNeighborhood.length} cliente(s) en este barrio`,
      clientCount: clientsInNeighborhood.length
    });
  }

  // Eliminar el barrio de settings
  const settings = db.get('settings').value();
  const currentNeighborhoods = settings.neighborhoods || [];
  const updatedNeighborhoods = currentNeighborhoods.filter(n => n !== decodedName);

  db.get('settings')
    .assign({
      neighborhoods: updatedNeighborhoods,
      updatedAt: new Date().toISOString()
    })
    .write();

  res.json({ message: 'Barrio eliminado correctamente' });
});

// ============================================
// ENDPOINTS DE RECEIPTS (RECIBOS)
// ============================================

// Obtener todos los recibos o filtrar por parámetros
server.get('/api/receipts', (req, res) => {
  const { clientId, collectorId, paymentId } = req.query;
  const db = router.db;

  let receipts = db.get('receipts').value() || [];

  if (clientId) {
    receipts = receipts.filter(r => r.client.id === clientId);
  }

  if (collectorId) {
    receipts = receipts.filter(r => r.collector.id === collectorId);
  }

  if (paymentId) {
    receipts = receipts.filter(r => r.payment.id === paymentId);
  }

  res.json(receipts);
});

// Crear recibo
server.post('/api/receipts', (req, res) => {
  const db = router.db;

  const newReceipt = {
    ...req.body,
    id: req.body.id || `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: req.body.createdAt || new Date().toISOString()
  };

  db.get('receipts').push(newReceipt).write();

  res.status(201).json(newReceipt);
});

// Actualizar recibo
server.patch('/api/receipts/:id', (req, res) => {
  const { id } = req.params;
  const db = router.db;

  const receipt = db.get('receipts').find({ id }).value();

  if (!receipt) {
    return res.status(404).json({ error: 'Recibo no encontrado' });
  }

  const updated = db.get('receipts')
    .find({ id })
    .assign(req.body)
    .write();

  res.json(updated);
});

// Eliminar recibo
server.delete('/api/receipts/:id', (req, res) => {
  const { id } = req.params;
  const db = router.db;

  const receipt = db.get('receipts').find({ id }).value();

  if (!receipt) {
    return res.status(404).json({ error: 'Recibo no encontrado' });
  }

  db.get('receipts').remove({ id }).write();

  res.json({ message: 'Recibo eliminado correctamente' });
});

// ============================================
// ENDPOINTS DE USER PREFERENCES (PREFERENCIAS DE USUARIO)
// ============================================

// Obtener preferencias de usuario
server.get('/api/user-preferences/:userId', (req, res) => {
  const { userId } = req.params;
  const db = router.db;

  const preferences = db.get('userPreferences').find({ userId }).value();

  if (!preferences) {
    // Devolver preferencias por defecto
    return res.json({
      userId,
      theme: 'light',
      fontSize: 'medium',
      language: 'es',
      sidebarCollapsed: false,
      preferences: {
        defaultPageSize: 25,
        autoRefresh: false,
        refreshInterval: 30000,
        notifications: true,
        sounds: false,
        compactMode: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  res.json(preferences);
});

// Crear/actualizar preferencias de usuario
server.post('/api/user-preferences', (req, res) => {
  const { userId } = req.body;
  const db = router.db;

  if (!userId) {
    return res.status(400).json({ error: 'userId es requerido' });
  }

  const existing = db.get('userPreferences').find({ userId }).value();

  if (existing) {
    // Actualizar existente
    const updated = db.get('userPreferences')
      .find({ userId })
      .assign({
        ...req.body,
        updatedAt: new Date().toISOString()
      })
      .write();

    return res.json(updated);
  }

  // Crear nuevo
  const newPreferences = {
    ...req.body,
    id: `pref-${Date.now()}-${userId}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.get('userPreferences').push(newPreferences).write();

  res.status(201).json(newPreferences);
});

// Actualizar preferencias de usuario
server.patch('/api/user-preferences/:userId', (req, res) => {
  const { userId } = req.params;
  const db = router.db;

  const existing = db.get('userPreferences').find({ userId }).value();

  if (!existing) {
    return res.status(404).json({ error: 'Preferencias no encontradas' });
  }

  const updated = db.get('userPreferences')
    .find({ userId })
    .assign({
      ...req.body,
      updatedAt: new Date().toISOString()
    })
    .write();

  res.json(updated);
});

// ============================================
// ENDPOINTS DE USERS (USUARIOS)
// ============================================

// Actualizar usuario
server.patch('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = router.db;

  const user = db.get('users').find({ id }).value();

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // No permitir cambiar el rol o username del usuario logueado si es admin
  const updates = { ...req.body };

  // Asegurar que updatedAt se actualice
  updates.updatedAt = new Date().toISOString();

  const updatedUser = db.get('users')
    .find({ id })
    .assign(updates)
    .write();

  // No devolver la contraseña en la respuesta
  const { password, ...userWithoutPassword } = updatedUser;

  res.json(userWithoutPassword);
});

// Eliminar usuario
server.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const db = router.db;

  const user = db.get('users').find({ id }).value();

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Prevenir eliminación del último admin
  if (user.role === 'admin') {
    const adminCount = db.get('users').filter({ role: 'admin' }).value().length;
    if (adminCount <= 1) {
      return res.status(400).json({
        error: 'No se puede eliminar el último administrador del sistema'
      });
    }
  }

  db.get('users').remove({ id }).write();

  res.json({
    message: 'Usuario eliminado exitosamente',
    id
  });
});

// ============================================
// ENDPOINTS DE VOUCHERS
// ============================================

// Obtener todos los vouchers o por cliente
server.get('/api/vouchers', (req, res) => {
  const { clientId, status } = req.query;
  const db = router.db;

  let vouchers = db.get('vouchers').value() || [];

  // Filtrar por clientId si se proporciona
  if (clientId) {
    vouchers = vouchers.filter(v => v.clientId === clientId);
  }

  // Filtrar por status si se proporciona
  if (status) {
    vouchers = vouchers.filter(v => v.status === status);
  }

  res.json(vouchers);
});

// Subir/crear nuevo voucher
server.post('/api/vouchers', (req, res) => {
  const { clientId, operationNumber, fileName, fileType, fileSize, fileData, amount, paymentDate, paymentPeriod, paymentMethod, comments } = req.body;
  const db = router.db;

  // Verificar que no exista número de operación duplicado
  const existing = db.get('vouchers').find({ operationNumber: operationNumber.toString() }).value();
  if (existing) {
    return res.status(400).json({ error: `El número de operación ${operationNumber} ya está registrado` });
  }

  const newVoucher = {
    id: `voucher-${Date.now()}`,
    clientId,
    operationNumber: operationNumber.toString(),
    fileName,
    fileType,
    fileSize,
    fileData,
    uploadDate: new Date().toISOString(),
    status: 'pending',
    reviewedBy: null,
    reviewDate: null,
    reviewComments: null,
    amount: parseFloat(amount) || 0,
    paymentDate: paymentDate || new Date().toISOString().split('T')[0],
    paymentPeriod: paymentPeriod || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    paymentMethod: paymentMethod || 'yape',
    comments: comments || ''
  };

  db.get('vouchers').push(newVoucher).write();

  res.status(201).json(newVoucher);
});

// Revisar voucher (aprobar/rechazar)
server.patch('/api/vouchers/:id/review', (req, res) => {
  const { id } = req.params;
  const { status, reviewedBy, comments } = req.body;
  const db = router.db;

  const voucher = db.get('vouchers').find({ id }).value();

  if (!voucher) {
    return res.status(404).json({ error: 'Voucher no encontrado' });
  }

  const updatedVoucher = db.get('vouchers')
    .find({ id })
    .assign({
      status,
      reviewedBy,
      reviewDate: new Date().toISOString(),
      reviewComments: comments || ''
    })
    .write();

  res.json(updatedVoucher);
});

// Eliminar voucher
server.delete('/api/vouchers/:id', (req, res) => {
  const { id } = req.params;
  const db = router.db;

  const voucher = db.get('vouchers').find({ id }).value();

  if (!voucher) {
    return res.status(404).json({ error: 'Voucher no encontrado' });
  }

  db.get('vouchers').remove({ id }).write();

  res.json({ message: 'Voucher eliminado correctamente' });
});

// Verificar si número de operación existe
server.get('/api/vouchers/check-operation/:operationNumber', (req, res) => {
  const { operationNumber } = req.params;
  const db = router.db;

  const existing = db.get('vouchers').find({ operationNumber: operationNumber.toString() }).value();

  res.json({
    exists: !!existing,
    voucher: existing || null
  });
});

// ============================================
// MIDDLEWARE DE TRANSFORMACIÓN DE RESPUESTAS DE JSON SERVER
// ============================================
// Usar router.render para transformar las respuestas antes de enviarlas
router.render = (req, res) => {
  const data = res.locals.data;

  // Detectar rutas REST
  const isRestRoute = req.path.match(/^\/(clients|payments|users|services|paymentMethods|notifications|cashBoxRequests|clientExtended|receipts|userPreferences|vouchers)/);

  if (isRestRoute) {
    // GET - lista de recursos
    if (req.method === 'GET' && Array.isArray(data)) {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const total = data.length;
      const pages = Math.ceil(total / limit);

      return res.json({
        items: data,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      });
    }
    // POST, PATCH, PUT, DELETE - objeto único
    else if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && typeof data === 'object' && data !== null) {
      return res.json({ data });
    }
    // GET - objeto único
    else if (req.method === 'GET' && typeof data === 'object' && data !== null) {
      return res.json({ data });
    }
  }

  // Para otros casos, devolver el dato tal cual
  res.json(data);
};

// ============================================
// USAR EL ROUTER POR DEFECTO
// ============================================
// Montar el router en /api para acceder a los recursos REST estándar
server.use('/api', router);

// ============================================
// INICIAR SERVIDOR
// ============================================
server.listen(PORT, () => {
  console.log('');
  console.log('🚀 JSON Server está corriendo!');
  console.log('');
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
  console.log('');
  console.log('📚 Recursos disponibles:');
  console.log(`   - GET    http://localhost:${PORT}/api/users`);
  console.log(`   - GET    http://localhost:${PORT}/api/clients`);
  console.log(`   - GET    http://localhost:${PORT}/api/payments`);
  console.log(`   - GET    http://localhost:${PORT}/api/services`);
  console.log(`   - GET    http://localhost:${PORT}/api/paymentMethods`);
  console.log(`   - GET    http://localhost:${PORT}/api/notifications`);
  console.log(`   - GET    http://localhost:${PORT}/api/cashBoxRequests`);
  console.log('');
  console.log('🔐 Autenticación:');
  console.log(`   - POST   http://localhost:${PORT}/api/auth/login`);
  console.log(`   - POST   http://localhost:${PORT}/api/auth/logout`);
  console.log(`   - GET    http://localhost:${PORT}/api/auth/verify`);
  console.log('');
  console.log('📊 Rutas personalizadas:');
  console.log(`   - GET    http://localhost:${PORT}/api/clients/with-debts`);
  console.log(`   - GET    http://localhost:${PORT}/api/clients/:id/payments`);
  console.log(`   - GET    http://localhost:${PORT}/api/stats/dashboard`);
  console.log(`   - GET    http://localhost:${PORT}/api/monthly-debts`);
  console.log(`   - PATCH  http://localhost:${PORT}/api/payments/:id/status`);
  console.log(`   - POST   http://localhost:${PORT}/api/cashbox/request`);
  console.log(`   - PATCH  http://localhost:${PORT}/api/cashbox/request/:id`);
  console.log('');
  console.log('💡 Presiona Ctrl+C para detener el servidor');
  console.log('');
});
