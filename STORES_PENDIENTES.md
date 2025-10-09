# 📋 Estado de Migración de Stores

## ✅ STORES REFACTORIZADOS (8 de 15)

| Store | Archivo | API Usada | Estado |
|-------|---------|-----------|---------|
| 1. Auth | `authStore.refactored.js` | `authApi` | ✅ Listo |
| 2. Client | `clientStore.refactored.js` | `clientsApi` | ✅ Listo |
| 3. Payment | `paymentStore.refactored.js` | `paymentsApi` | ✅ Listo |
| 4. Service | `serviceStore.refactored.js` | `servicesApi` | ✅ Listo |
| 5. Settings | `settingsStore.refactored.js` | `/settings` | ✅ Listo |
| 6. Payment Methods | `paymentMethodStore.refactored.js` | `/paymentMethods` | ✅ Listo |
| 7. Notifications | `notificationStore.refactored.js` | `notificationsApi` | ✅ Listo |
| 8. Monthly Debts | `monthlyDebtStore.refactored.js` | `paymentsApi` | ✅ Listo |

---

## ⏳ STORES PENDIENTES (3 importantes + 4 opcionales)

### **Prioridad ALTA** (Requieren refactorización)

| Store | Archivo | API Disponible | Complejidad |
|-------|---------|----------------|-------------|
| 9. CashBox | `cashBoxStore.js` | ✅ `cashBoxApi` | 🔴 ALTA |
| 10. Voucher | `voucherStore.js` | ✅ `/vouchers` | 🟡 MEDIA |
| 11. Client Extended | `clientExtendedStore.js` | ✅ `clientsApi` | 🟡 MEDIA |

### **Prioridad BAJA** (Pueden quedarse sin migrar)

| Store | Archivo | Necesita API | Nota |
|-------|---------|--------------|------|
| 12. UI | `uiStore.js` | ❌ No | Solo maneja estado de UI local (sidebar, modales) |
| 13. Payment Receipt | `paymentReceiptStore.js` | ❌ No | Solo genera PDFs localmente |
| 14. Alert | `alertStore.js` | ⚠️ Opcional | Puede usar `notificationsApi` |
| 15. Backup | `backupStore.js` | ⚠️ Requiere endpoints nuevos | Backup/Restore completo |

---

## 🎯 SIGUIENTE PASO: Reemplazar Stores

### Opción A: Reemplazar Uno por Uno (RECOMENDADO)

```bash
cd frontend/src/stores

# 1. Respaldar stores antiguos
mkdir old
copy authStore.js old\
copy clientStore.js old\
copy paymentStore.js old\
copy serviceStore.js old\

# 2. Reemplazar con versiones refactorizadas
copy authStore.refactored.js authStore.js
copy clientStore.refactored.js clientStore.js
copy paymentStore.refactored.js paymentStore.js
copy serviceStore.refactored.js serviceStore.js
copy settingsStore.refactored.js settingsStore.js
copy paymentMethodStore.refactored.js paymentMethodStore.js
copy notificationStore.refactored.js notificationStore.js
copy monthlyDebtStore.refactored.js monthlyDebtStore.js
```

### Opción B: Reemplazar Todos de Golpe (Rápido pero arriesgado)

```bash
cd frontend/src/stores

# Respaldar TODO
mkdir old
copy *.js old\

# Reemplazar todos los stores refactorizados
for %f in (*refactored.js) do copy %f %~nf.js
```

---

## 📝 STORES QUE FALTAN REFACTORIZAR

### 1. **cashBoxStore.js** (COMPLEJO)

**Complejidad:** 🔴 ALTA
**API:** `cashBoxApi`
**Funcionalidades:**
- Solicitudes de caja
- Aprobación/Rechazo de solicitudes
- Registro de transacciones
- Cierre de caja
- Cálculos complejos de efectivo/digital

**Template básico:**
```javascript
import { create } from 'zustand';
import { cashBoxApi } from '../services/api';

export const useCashBoxStore = create((set) => ({
  requests: [],
  currentRequest: null,

  // Obtener solicitudes
  fetchRequests: async () => {
    const requests = await cashBoxApi.getAllRequests();
    set({ requests });
  },

  // Crear solicitud
  createRequest: async (data) => {
    const newRequest = await cashBoxApi.createRequest(data);
    set(state => ({ requests: [...state.requests, newRequest] }));
  },

  // Aprobar solicitud
  approveRequest: async (id, approvalData) => {
    const updated = await cashBoxApi.approveRequest(id, approvalData);
    set(state => ({
      requests: state.requests.map(r => r.id === id ? updated : r)
    }));
  },

  // Rechazar solicitud
  rejectRequest: async (id, reason) => {
    const updated = await cashBoxApi.rejectRequest(id, reason);
    set(state => ({
      requests: state.requests.map(r => r.id === id ? updated : r)
    }));
  }
}));
```

---

### 2. **voucherStore.js** (MEDIO)

**Complejidad:** 🟡 MEDIA
**API:** Endpoint `/vouchers`
**Funcionalidades:**
- Subir comprobantes
- Validar comprobantes
- Aprobar/Rechazar
- Listar vouchers por estado

**Template básico:**
```javascript
import { create } from 'zustand';
import { apiClient } from '../services/api';

export const useVoucherStore = create((set) => ({
  vouchers: [],

  fetchVouchers: async (params) => {
    const vouchers = await apiClient.get('/vouchers', params);
    set({ vouchers });
  },

  uploadVoucher: async (voucherData) => {
    const newVoucher = await apiClient.post('/vouchers', voucherData);
    set(state => ({ vouchers: [...state.vouchers, newVoucher] }));
  },

  validateVoucher: async (id, status, validatedBy) => {
    const updated = await apiClient.patch(`/vouchers/${id}`, {
      status,
      validatedBy,
      validatedAt: new Date().toISOString()
    });
    set(state => ({
      vouchers: state.vouchers.map(v => v.id === id ? updated : v)
    }));
  }
}));
```

---

### 3. **clientExtendedStore.js** (MEDIO)

**Complejidad:** 🟡 MEDIA
**API:** Extender `clientsApi`
**Funcionalidades:**
- Datos extendidos de clientes
- Info de instalación detallada
- Info de facturación
- Historial completo

**Posible solución:**
```javascript
import { create } from 'zustand';
import { clientsApi } from '../services/api';

export const useClientExtendedStore = create((set) => ({
  clientDetails: null,

  fetchClientDetails: async (clientId) => {
    // Obtener cliente básico
    const client = await clientsApi.getById(clientId);

    // Obtener pagos del cliente
    const payments = await clientsApi.getPayments(clientId);

    // Combinar información
    const details = {
      ...client,
      paymentHistory: payments,
      totalPaid: payments.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0),
      totalDebt: payments.filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0)
    };

    set({ clientDetails: details });
  }
}));
```

---

### 4. **alertStore.js** (BAJO)

**Complejidad:** 🟢 BAJA
**Opción:** Usar `notificationsApi` con type='alert'

```javascript
import { create } from 'zustand';
import { notificationsApi } from '../services/api';

export const useAlertStore = create((set) => ({
  alerts: [],

  fetchAlerts: async (userId) => {
    const alerts = await notificationsApi.getByType(userId, 'alert');
    set({ alerts });
  },

  createAlert: async (alertData) => {
    const alert = await notificationsApi.create({
      ...alertData,
      type: 'alert'
    });
    set(state => ({ alerts: [alert, ...state.alerts] }));
  }
}));
```

---

## 🔍 VERIFICAR COMPONENTES

Después de reemplazar stores, buscar componentes que los usan:

```bash
# Buscar imports de stores antiguos
cd frontend
grep -r "from.*stores/authStore" src/
grep -r "from.*stores/clientStore" src/
grep -r "from.*stores/paymentStore" src/
```

Reemplazar imports:
```javascript
// ANTES
import { useAuthStore } from '@/stores/authStore';

// DESPUÉS (si reemplazaste el archivo)
import { useAuthStore } from '@/stores/authStore'; // Mismo import, nuevo código
```

---

## ✅ CHECKLIST FINAL

### Stores Base (Listos)
- [x] authStore
- [x] clientStore
- [x] paymentStore
- [x] serviceStore

### Stores Auxiliares (Listos)
- [x] settingsStore
- [x] paymentMethodStore
- [x] notificationStore
- [x] monthlyDebtStore

### Stores Pendientes (Hacer ahora)
- [ ] cashBoxStore ← **MÁS IMPORTANTE**
- [ ] voucherStore
- [ ] clientExtendedStore

### Stores Opcionales (Pueden esperar)
- [ ] alertStore (usar notificationsApi)
- [ ] uiStore (NO necesita migrar)
- [ ] paymentReceiptStore (NO necesita migrar)
- [ ] backupStore (requiere endpoints nuevos)

---

## 🚀 ACCIÓN INMEDIATA

```bash
# 1. Reemplazar los 8 stores listos
cd frontend/src/stores
copy authStore.refactored.js authStore.js
copy clientStore.refactored.js clientStore.js
copy paymentStore.refactored.js paymentStore.js
copy serviceStore.refactored.js serviceStore.js
copy settingsStore.refactored.js settingsStore.js
copy paymentMethodStore.refactored.js paymentMethodStore.js
copy notificationStore.refactored.js notificationStore.js
copy monthlyDebtStore.refactored.js monthlyDebtStore.js

# 2. Iniciar frontend y probar
cd ../..
npm run dev

# 3. Probar login con backend
# Usuario: admin
# Password: admin123
```

---

## 📊 PROGRESO GENERAL

```
✅ Completado: 8/15 stores (53%)
⏳ Pendiente:  3/15 stores importantes (20%)
❌ Opcional:   4/15 stores (27%)

Total funcional: 73% (8+3 de 15)
```

---

**¿Necesitas ayuda con algún store específico?** Puedo crear los 3 stores pendientes ahora mismo si quieres.
