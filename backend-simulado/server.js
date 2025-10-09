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

const PORT = process.env.PORT || 3001;

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

  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const overduePayments = payments.filter(p => p.status === 'overdue').length;
  const activeClients = clients.filter(c => c.status === 'active').length;

  const overdueRate = payments.length > 0
    ? (overduePayments / payments.length * 100).toFixed(2)
    : 0;

  res.json({
    totalCollected,
    pendingPayments,
    overduePayments,
    activeClients,
    overdueRate: parseFloat(overdueRate),
    totalClients: clients.length
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

  res.json(chartData);
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

  res.json(chartData);
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
// MIDDLEWARE DE REESCRITURA DE RUTAS
// ============================================
server.use(jsonServer.rewriter({
  '/api/*': '/$1',
  '/api/clients/:id': '/clients/:id',
  '/api/payments/:id': '/payments/:id',
  '/api/users/:id': '/users/:id'
}));

// ============================================
// USAR EL ROUTER POR DEFECTO
// ============================================
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
