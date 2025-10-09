# 🚀 Pasos Siguientes - Guía Rápida

## ✅ Lo que ya está hecho:

1. ✅ Backend simulado configurado (JSON Server)
2. ✅ db.json generado con **200 clientes** y **1280 pagos**
3. ✅ Capa de servicios API completa (8 APIs)
4. ✅ 3 stores refactorizados de ejemplo (auth, client, payment, service)
5. ✅ Script generador de datos masivos

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### PASO 1: Probar el Backend (5 min)

```bash
# Si no está corriendo, iniciar el backend
cd backend-simulado
npm start

# En otra terminal, probar endpoints:
# Abrir en navegador: http://localhost:3001/api/clients
# Deberías ver 200 clientes en JSON
```

### PASO 2: Configurar Frontend (5 min)

```bash
cd frontend

# Crear archivo .env
copy .env.example .env

# Editar .env y asegurar:
# VITE_API_URL=http://localhost:3001/api
```

### PASO 3: Reemplazar Stores Antiguos (15-30 min)

**Opción A: Reemplazar directamente**
```bash
# Respaldar stores antiguos
cd frontend/src/stores
mkdir old
copy *.js old/

# Usar stores refactorizados
copy authStore.refactored.js authStore.js
copy clientStore.refactored.js clientStore.js
copy paymentStore.refactored.js paymentStore.js
copy serviceStore.refactored.js serviceStore.js
```

**Opción B: Ir store por store (RECOMENDADO)**

Migra un store a la vez y prueba:
1. `authStore.js` → Login/Logout
2. `clientStore.js` → Lista de clientes
3. `paymentStore.js` → Pagos
4. `serviceStore.js` → Planes

---

## 📝 REFACTORIZAR STORES RESTANTES

Necesitas refactorizar estos stores siguiendo el mismo patrón:

### Template para refactorizar:

```javascript
import { create } from 'zustand';
import { xxxApi } from '../services/api';

export const useXXXStore = create((set, get) => ({
  // Estado
  items: [],
  isLoading: false,
  error: null,

  // Fetch all
  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await xxxApi.getAll();
      set({ items, isLoading: false });
      return { success: true, data: items };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Create
  create: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const item = await xxxApi.create(data);
      set(state => ({ items: [...state.items, item], isLoading: false }));
      return { success: true, data: item };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Update, Delete, etc.
}));
```

### Stores pendientes de refactorizar:

- [ ] `cashBoxStore.js` → usa `cashBoxApi`
- [ ] `notificationStore.js` → usa `notificationsApi`
- [ ] `monthlyDebtStore.js` → usa `paymentsApi.getMonthlyDebts()`
- [ ] `settingsStore.js` → usa endpoint `/settings`
- [ ] `paymentMethodStore.js` → usa endpoint `/paymentMethods`
- [ ] `voucherStore.js` → usa endpoint `/vouchers`

---

## 🔄 ACTUALIZAR COMPONENTES

### Ejemplo de migración de un componente:

**ANTES (hardcodeado):**
```javascript
// pages/admin/Clients.jsx
import { mockServer } from '@/services/mock/server';

function Clients() {
  useEffect(() => {
    const clients = mockServer.getClients();
    setClients(clients);
  }, []);
}
```

**DESPUÉS (API):**
```javascript
// pages/admin/Clients.jsx
import { useClientStore } from '@/stores/clientStore'; // .refactored

function Clients() {
  const { clients, fetchClients, isLoading } = useClientStore();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  if (isLoading) return <div>Cargando...</div>;
}
```

---

## 🧪 TESTING BÁSICO

### 1. Test de Autenticación

```javascript
// En el navegador, consola de desarrollo
import { authApi } from '@/services/api';

// Probar login
const response = await authApi.login('admin', 'admin123');
console.log(response);
// Debe retornar: { user: {...}, token: "..." }
```

### 2. Test de Clientes

```javascript
import { clientsApi } from '@/services/api';

// Obtener todos los clientes
const clients = await clientsApi.getAll();
console.log(clients.length); // Debe ser 200

// Obtener clientes con deudas
const debts = await clientsApi.getWithDebts();
console.log(debts);
```

### 3. Test de Pagos

```javascript
import { paymentsApi } from '@/services/api';

// Obtener deudas mensuales
const debts = await paymentsApi.getMonthlyDebts();
console.log(debts.length);

// Actualizar estado de pago
const updated = await paymentsApi.updateStatus('payment-client-001-2025-10', {
  status: 'paid',
  paymentMethod: 'cash',
  collectorId: 'collector-1'
});
console.log(updated);
```

---

## 📦 FEATURES AVANZADAS

### Agregar Loading States

```javascript
function ClientList() {
  const { clients, isLoading, error } = useClientStore();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner">Cargando clientes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      {clients.map(client => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
}
```

### Agregar Error Handling

```javascript
const handleCreateClient = async (data) => {
  const result = await createClient(data);

  if (result.success) {
    toast.success('Cliente creado exitosamente');
    navigate('/clients');
  } else {
    toast.error(result.error || 'Error al crear cliente');
  }
};
```

---

## 🗂️ ESTRUCTURA DE ARCHIVOS FINAL

```
proyecto/
├── backend-simulado/
│   ├── db.json                      ✅ (200 clientes, 1280 pagos)
│   ├── server.js                    ✅
│   ├── package.json                 ✅
│   └── utils/
│       ├── dataGenerator.js         ✅
│       └── generateDb.js            ✅
│
├── frontend/
│   ├── .env                         ⚠️ CREAR
│   ├── src/
│   │   ├── services/
│   │   │   └── api/                 ✅
│   │   │       ├── client.js
│   │   │       ├── authApi.js
│   │   │       ├── clientsApi.js
│   │   │       ├── paymentsApi.js
│   │   │       ├── servicesApi.js
│   │   │       ├── usersApi.js
│   │   │       ├── cashBoxApi.js
│   │   │       ├── notificationsApi.js
│   │   │       ├── dashboardApi.js
│   │   │       └── index.js
│   │   │
│   │   └── stores/
│   │       ├── authStore.js         ⏳ REEMPLAZAR
│   │       ├── clientStore.js       ⏳ REEMPLAZAR
│   │       ├── paymentStore.js      ⏳ REEMPLAZAR
│   │       ├── serviceStore.js      ⏳ REEMPLAZAR
│   │       ├── cashBoxStore.js      ⏳ REFACTORIZAR
│   │       └── ...                  ⏳ REFACTORIZAR
│
└── README_MIGRACION.md              ✅
```

---

## 🎓 RECURSOS ÚTILES

### Comandos Frecuentes

```bash
# Backend
cd backend-simulado
npm start                    # Iniciar servidor
npm run generate             # Regenerar db.json

# Frontend
cd frontend
npm run dev                  # Iniciar desarrollo

# Verificar API
curl http://localhost:3001/api/clients
curl http://localhost:3001/api/users
```

### Debugging

```javascript
// En componentes, agregar logs temporales
console.log('Fetching clients...');
const result = await fetchClients();
console.log('Result:', result);
```

### Endpoints Importantes

```
GET    /api/clients                 - 200 clientes
GET    /api/clients/with-debts      - Clientes con deudas
GET    /api/payments                - 1280 pagos
GET    /api/monthly-debts           - 196 deudas
GET    /api/stats/dashboard         - Estadísticas
POST   /api/auth/login              - Login
```

---

## ✅ CHECKLIST DE PROGRESO

### Backend
- [x] Backend instalado y corriendo
- [x] db.json generado con 200 clientes
- [x] Endpoints funcionando

### Frontend - API Layer
- [x] Capa de API creada (8 APIs)
- [x] Configuración lista
- [ ] Variables de entorno (.env) creadas

### Frontend - Stores
- [x] authStore refactorizado
- [x] clientStore refactorizado
- [x] paymentStore refactorizado
- [x] serviceStore refactorizado
- [ ] cashBoxStore refactorizado
- [ ] notificationStore refactorizado
- [ ] Otros stores refactorizados

### Frontend - Componentes
- [ ] Componentes actualizados para usar stores nuevos
- [ ] Loading states implementados
- [ ] Error handling implementado

### Testing
- [ ] Login funciona
- [ ] Lista de clientes carga desde API
- [ ] Pagos funcionan
- [ ] CRUD completo probado

---

## 🆘 TROUBLESHOOTING

### Error: "Failed to fetch"
**Solución:** Verificar que el backend esté corriendo en puerto 3001

```bash
cd backend-simulado
npm start
```

### Error: "Cannot find module '@/services/api'"
**Solución:** Verificar alias en vite.config.js

```javascript
// vite.config.js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

### Backend responde lento
**Solución:** El servidor simula latencia (100-500ms). Para desactivar, editar `server.js`:

```javascript
// Comentar este middleware en server.js
// server.use((req, res, next) => {
//   const delay = Math.floor(Math.random() * 400) + 100;
//   setTimeout(next, delay);
// });
```

---

## 🎯 SIGUIENTE ACCIÓN RECOMENDADA

**Opción 1: Empezar simple**
```bash
# 1. Crear .env
cd frontend
copy .env.example .env

# 2. Probar un store refactorizado
# Usar authStore.refactored.js en el Login
# Ver si funciona el login con el backend
```

**Opción 2: Ir full**
```bash
# Reemplazar todos los stores
cd frontend/src/stores
copy authStore.refactored.js authStore.js
copy clientStore.refactored.js clientStore.js
copy paymentStore.refactored.js paymentStore.js
copy serviceStore.refactored.js serviceStore.js

# Iniciar frontend y probar
npm run dev
```

---

**¿Necesitas ayuda?** Consulta `README_MIGRACION.md` para documentación completa.

**¡Éxito con la migración!** 🚀
