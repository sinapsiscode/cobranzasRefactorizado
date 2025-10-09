# ⚠️ FUNCIONALIDADES FALTANTES EN LA MIGRACIÓN

## ❌ ENDPOINTS QUE FALTAN EN JSON SERVER

### **1. Dashboard y Métricas**
- [ ] `GET /api/stats/dashboard` - Métricas generales (PARCIAL)
- [ ] `GET /api/stats/collection-chart?months=6` - Gráfico de cobranza
- [ ] `GET /api/stats/payment-status-chart` - Gráfico de estados de pago
- [ ] `GET /api/stats/collector/:id` - Métricas por cobrador

### **2. Operaciones Especiales de Clientes**
- [ ] `PATCH /api/clients/:id/last-login` - Actualizar último acceso
- [ ] `POST /api/clients/:id/change-status` - Cambiar estado con historial
- [ ] `GET /api/clients/check-automatic-terminations` - Verificar bajas automáticas
- [ ] `GET /api/clients/by-neighborhood/:neighborhood` - Clientes por barrio

### **3. Validaciones de Negocio**
- [ ] DNI único al crear/actualizar cliente
- [ ] No eliminar clientes con pagos pendientes
- [ ] Validación de fechas de pago
- [ ] Validación de montos

### **4. Filtros Avanzados**
- [ ] Filtros combinados con AND/OR
- [ ] Búsqueda full-text mejorada
- [ ] Filtros por rango de fechas
- [ ] Filtros por barrios múltiples

---

## 🔧 SOLUCIONES

### **Opción 1: Agregar Endpoints Faltantes al Backend** (RECOMENDADO)

Crear endpoints personalizados en `server.js`:

```javascript
// Dashboard metrics completo
server.get('/api/stats/dashboard', (req, res) => {
  const db = router.db;
  const clients = db.get('clients').value();
  const payments = db.get('payments').value();

  // Calcular métricas
  const metrics = {
    totalCollected: payments.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    overduePayments: payments.filter(p => p.status === 'overdue').length,
    activeClients: clients.filter(c => c.status === 'active').length,
    // ... más métricas
  };

  res.json(metrics);
});

// Gráfico de cobranza
server.get('/api/stats/collection-chart', (req, res) => {
  const { months = 6 } = req.query;
  const db = router.db;
  const payments = db.get('payments').value();

  // Generar datos de los últimos N meses
  const chartData = [];
  // ... lógica de agregación

  res.json(chartData);
});

// Cambiar estado de cliente
server.post('/api/clients/:id/change-status', (req, res) => {
  const { id } = req.params;
  const { newStatus, reason, adminId } = req.body;

  const db = router.db;
  const client = db.get('clients').find({ id }).value();

  if (!client) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  // Agregar al historial
  const statusHistory = [
    ...(client.statusHistory || []),
    {
      fromStatus: client.status,
      toStatus: newStatus,
      date: new Date().toISOString(),
      reason,
      changedBy: adminId
    }
  ];

  // Actualizar cliente
  const updated = db.get('clients')
    .find({ id })
    .assign({
      status: newStatus,
      statusReason: reason,
      statusHistory,
      updatedAt: new Date().toISOString()
    })
    .write();

  res.json(updated);
});
```

### **Opción 2: Agregar Lógica en los Stores Refactorizados**

Algunos cálculos pueden hacerse client-side:

```javascript
// En clientStore.refactored.js
export const useClientStore = create((set, get) => ({
  // ... estado existente

  /**
   * Cambiar estado del cliente con historial
   */
  changeClientStatus: async (clientId, newStatus, reason, adminId) => {
    const { clients } = get();
    const client = clients.find(c => c.id === clientId);

    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    const statusHistory = [
      ...(client.statusHistory || []),
      {
        fromStatus: client.status,
        toStatus: newStatus,
        date: new Date().toISOString(),
        reason,
        changedBy: adminId
      }
    ];

    const updates = {
      status: newStatus,
      statusReason: reason,
      statusHistory
    };

    // Si es pausa, agregar fecha
    if (newStatus === 'paused') {
      updates.pauseStartDate = new Date().toISOString();
      updates.pauseReason = reason;
    }

    return get().updateClient(clientId, updates);
  },

  /**
   * Verificar bajas automáticas
   */
  checkAutomaticTerminations: async () => {
    const { clients } = get();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const toTerminate = clients.filter(client => {
      if (client.status !== 'paused') return false;
      if (!client.pauseStartDate) return false;

      const pauseStart = new Date(client.pauseStartDate);
      return pauseStart <= thirtyDaysAgo;
    });

    // Procesar cada uno
    const promises = toTerminate.map(client =>
      get().changeClientStatus(
        client.id,
        'terminated',
        'Baja automática: pausa mayor a 30 días',
        'system'
      )
    );

    await Promise.all(promises);
    return toTerminate.length;
  },

  /**
   * Getters específicos
   */
  getClientsByStatus: (status) => {
    const { clients } = get();
    return clients.filter(c => c.status === status);
  },

  getPausedClients: () => get().getClientsByStatus('paused'),

  getTerminatedClients: () => get().getClientsByStatus('terminated'),

  getClientsByNeighborhood: (neighborhood) => {
    const { clients } = get();
    return clients.filter(c => c.neighborhood === neighborhood);
  }
}));
```

---

## 📋 CHECKLIST DE MIGRACIÓN COMPLETA

### **Backend (JSON Server)**
- [x] Endpoints básicos CRUD
- [ ] Endpoint de cambio de estado con historial
- [ ] Endpoint de actualizar último acceso
- [ ] Endpoint de métricas del dashboard
- [ ] Endpoint de gráfico de cobranza
- [ ] Endpoint de gráfico de estados
- [ ] Validación de DNI único
- [ ] Validación de eliminar con pagos pendientes

### **Stores Refactorizados**
- [x] authStore básico
- [x] clientStore básico CRUD
- [x] paymentStore básico CRUD
- [ ] clientStore - changeClientStatus
- [ ] clientStore - checkAutomaticTerminations
- [ ] clientStore - getters específicos
- [ ] clientStore - filtros por barrio
- [ ] dashboardStore - métricas completas

### **Funcionalidades de Negocio**
- [ ] Cambio de estado de cliente
- [ ] Historial de estados
- [ ] Bajas automáticas por pausa >30 días
- [ ] Filtros por barrio con deudores
- [ ] Actualización de último acceso
- [ ] Validaciones de negocio

---

## 🚀 PLAN DE ACCIÓN INMEDIATO

### **1. Agregar Endpoints Críticos al Backend** (30 min)

```bash
# Editar backend-simulado/server.js
# Agregar estos endpoints:
```

1. POST `/api/clients/:id/change-status`
2. GET `/api/stats/dashboard-complete`
3. GET `/api/stats/collection-chart`
4. PATCH `/api/clients/:id/last-login`

### **2. Completar Stores con Funcionalidades Faltantes** (30 min)

Actualizar:
- `clientStore.refactored.js` - Agregar todos los métodos especiales
- `dashboardStore.refactored.js` - Crear nuevo store para dashboard

### **3. Testing** (15 min)

Probar cada funcionalidad faltante.

---

## 💡 RECOMENDACIÓN

**Para una migración 100% completa:**

1. ✅ Usa los 11 stores refactorizados actuales (cubren 80%)
2. ⚠️ Agrega los 4 endpoints críticos al backend
3. ⚠️ Completa los métodos especiales en clientStore
4. ⚠️ Crea dashboardStore completo con gráficos

**O bien, para empezar rápido:**

1. ✅ Usa los stores actuales para funcionalidad básica
2. ⏳ Mantén el mockServer para funcionalidades avanzadas temporalmente
3. ⏳ Migra gradualmente las funcionalidades especiales

---

¿Quieres que complete ahora mismo las funcionalidades faltantes?

Puedo:
1. Agregar los 4 endpoints críticos al server.js
2. Completar clientStore con todos los métodos
3. Crear dashboardStore.refactored.js completo
