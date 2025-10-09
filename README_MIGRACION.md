# Guía de Migración: Frontend Hardcodeado → Arquitectura Cliente-Servidor

Esta guía documenta el proceso de migración del frontend con datos hardcodeados a una arquitectura cliente-servidor usando JSON Server como backend simulado.

## 📋 Tabla de Contenidos

1. [Estructura del Proyecto](#estructura-del-proyecto)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Arquitectura de la API](#arquitectura-de-la-api)
4. [Cómo Refactorizar Componentes](#cómo-refactorizar-componentes)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Testing y Debugging](#testing-y-debugging)
7. [Deployment](#deployment)

---

## 🏗️ Estructura del Proyecto

```
proyecto/
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── api/                    # ⭐ NUEVA CAPA DE API
│   │   │   │   ├── client.js           # Cliente HTTP base
│   │   │   │   ├── config.js           # Configuración de API
│   │   │   │   ├── authApi.js          # API de autenticación
│   │   │   │   ├── clientsApi.js       # API de clientes
│   │   │   │   ├── paymentsApi.js      # API de pagos
│   │   │   │   └── index.js            # Exportaciones centralizadas
│   │   │   └── mock/                   # (Código antiguo - opcional mantener)
│   │   ├── stores/
│   │   │   ├── authStore.refactored.js     # Ejemplo refactorizado
│   │   │   └── clientStore.refactored.js   # Ejemplo refactorizado
│   │   └── ...
│   ├── .env.example                    # Variables de entorno ejemplo
│   └── package.json
│
├── backend-simulado/                   # ⭐ NUEVO BACKEND SIMULADO
│   ├── db.json                         # Base de datos JSON
│   ├── server.js                       # Servidor JSON Server
│   ├── package.json                    # Dependencias del backend
│   ├── middleware/                     # Middlewares personalizados
│   ├── utils/                          # Utilidades
│   └── .gitignore
│
└── README_MIGRACION.md                 # Esta guía
```

---

## 🚀 Instalación y Configuración

### 1. Configurar el Backend Simulado

```bash
# Navegar al directorio del backend
cd backend-simulado

# Instalar dependencias
npm install

# Iniciar el servidor (puerto 3001)
npm start

# O en modo desarrollo con auto-reload
npm run dev
```

El servidor estará disponible en: **http://localhost:3001/api**

### 2. Configurar el Frontend

```bash
# Navegar al directorio del frontend
cd frontend

# Copiar archivo de variables de entorno
copy .env.example .env

# Editar .env y configurar la URL de la API
# VITE_API_URL=http://localhost:3001/api

# Instalar dependencias (si es necesario)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Verificar que todo funciona

1. Abrir **http://localhost:3001/api/clients** en el navegador
2. Deberías ver la lista de clientes en formato JSON
3. Abrir **http://localhost:3000** (tu frontend)
4. El frontend ahora consumirá datos del backend

---

## 🔌 Arquitectura de la API

### Endpoints Disponibles

#### 🔐 Autenticación

```http
POST   /api/auth/login         # Login de usuario
POST   /api/auth/logout        # Logout de usuario
GET    /api/auth/verify        # Verificar token
```

#### 👥 Clientes

```http
GET    /api/clients                      # Listar todos los clientes
GET    /api/clients?_page=1&_limit=10    # Paginación
GET    /api/clients?status=active        # Filtrar por estado
GET    /api/clients/:id                  # Obtener cliente por ID
POST   /api/clients                      # Crear nuevo cliente
PUT    /api/clients/:id                  # Actualizar cliente (completo)
PATCH  /api/clients/:id                  # Actualizar cliente (parcial)
DELETE /api/clients/:id                  # Eliminar cliente
```

#### 💰 Pagos

```http
GET    /api/payments                # Listar todos los pagos
GET    /api/payments/:id            # Obtener pago por ID
POST   /api/payments                # Crear nuevo pago
PUT    /api/payments/:id            # Actualizar pago
PATCH  /api/payments/:id/status     # Actualizar solo estado de pago
DELETE /api/payments/:id            # Eliminar pago
```

#### 📊 Rutas Personalizadas

```http
GET    /api/clients/with-debts          # Clientes con deudas
GET    /api/clients/:id/payments        # Pagos de un cliente específico
GET    /api/stats/dashboard             # Estadísticas para dashboard
GET    /api/monthly-debts               # Deudas mensuales
POST   /api/cashbox/request             # Crear solicitud de caja
PATCH  /api/cashbox/request/:id         # Aprobar/Rechazar solicitud
```

### Otros Recursos

```http
GET    /api/services              # Planes de servicio
GET    /api/paymentMethods        # Métodos de pago
GET    /api/notifications         # Notificaciones
GET    /api/cashBoxRequests       # Solicitudes de caja
GET    /api/settings              # Configuración del sistema
```

---

## 🔄 Cómo Refactorizar Componentes

### Paso 1: Identificar Datos Hardcodeados

**ANTES (hardcodeado):**
```javascript
// clientStore.js (antiguo)
const clients = [
  { id: 1, name: 'Juan Pérez', ... },
  { id: 2, name: 'María García', ... }
];
```

**DESPUÉS (API):**
```javascript
// clientStore.refactored.js (nuevo)
import { clientsApi } from '../services/api';

fetchClients: async () => {
  const clients = await clientsApi.getAll();
  set({ clients });
}
```

### Paso 2: Usar la Capa de Servicios

#### Importar API en tu componente/store:

```javascript
import { clientsApi, paymentsApi, authApi } from '@/services/api';

// O importar todo
import api from '@/services/api';
```

#### Ejemplo de uso en un componente React:

```javascript
import { useEffect, useState } from 'react';
import { clientsApi } from '@/services/api';

function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientsApi.getAll();
        setClients(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <ul>
      {clients.map(client => (
        <li key={client.id}>{client.fullName}</li>
      ))}
    </ul>
  );
}
```

### Paso 3: Refactorizar Stores de Zustand

**Patrón recomendado:**

```javascript
import { create } from 'zustand';
import { clientsApi } from '@/services/api';

export const useClientStore = create((set, get) => ({
  clients: [],
  isLoading: false,
  error: null,

  // Acción asíncrona que llama a la API
  fetchClients: async () => {
    set({ isLoading: true, error: null });

    try {
      const clients = await clientsApi.getAll();
      set({ clients, isLoading: false });
      return { success: true, data: clients };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  createClient: async (clientData) => {
    set({ isLoading: true });

    try {
      const newClient = await clientsApi.create(clientData);
      set(state => ({
        clients: [...state.clients, newClient],
        isLoading: false
      }));
      return { success: true, data: newClient };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  }
}));
```

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Login con API

```javascript
import { useAuthStore } from '@/stores/authStore.refactored';

function LoginForm() {
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    const result = await login(username, password);

    if (result.success) {
      // Redirigir al dashboard
      navigate('/dashboard');
    } else {
      // Mostrar error
      alert(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" placeholder="Usuario" />
      <input name="password" type="password" placeholder="Contraseña" />
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}
```

### Ejemplo 2: CRUD de Clientes

```javascript
import { useClientStore } from '@/stores/clientStore.refactored';

function ClientManagement() {
  const {
    clients,
    isLoading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  } = useClientStore();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreate = async (clientData) => {
    const result = await createClient(clientData);
    if (result.success) {
      alert('Cliente creado exitosamente');
    }
  };

  const handleUpdate = async (id, clientData) => {
    const result = await updateClient(id, clientData);
    if (result.success) {
      alert('Cliente actualizado exitosamente');
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteClient(id);
    if (result.success) {
      alert('Cliente eliminado exitosamente');
    }
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>
          <h3>{client.fullName}</h3>
          <button onClick={() => handleUpdate(client.id, {...})}>Editar</button>
          <button onClick={() => handleDelete(client.id)}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 3: Obtener Clientes con Deudas

```javascript
import { clientsApi } from '@/services/api';

function DebtReport() {
  const [clientsWithDebts, setClientsWithDebts] = useState([]);

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        const clients = await clientsApi.getWithDebts();
        setClientsWithDebts(clients);
      } catch (error) {
        console.error('Error al cargar deudas:', error);
      }
    };

    fetchDebts();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Cliente</th>
          <th>Deudas</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {clientsWithDebts.map(client => (
          <tr key={client.id}>
            <td>{client.fullName}</td>
            <td>{client.debtCount}</td>
            <td>S/ {client.totalDebt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Ejemplo 4: Actualizar Estado de Pago

```javascript
import { paymentsApi } from '@/services/api';

async function markAsPaid(paymentId, collectorId) {
  try {
    const updatedPayment = await paymentsApi.updateStatus(paymentId, {
      status: 'paid',
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      collectorId
    });

    console.log('Pago actualizado:', updatedPayment);
    return updatedPayment;
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    throw error;
  }
}
```

---

## 🧪 Testing y Debugging

### Verificar que el Backend está Corriendo

```bash
# Verificar estado del servidor
curl http://localhost:3001/api/clients

# Debería devolver JSON con los clientes
```

### Verificar Autenticación

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Respuesta esperada:
# {
#   "user": { "id": "admin-1", "username": "admin", ... },
#   "token": "base64encodedtoken..."
# }
```

### Testing de Endpoints CRUD

```bash
# Crear cliente
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Cliente",
    "dni": "12345678",
    "phone": "+51987654321",
    "servicePlan": "basic"
  }'

# Actualizar cliente
curl -X PUT http://localhost:3001/api/clients/client-001 \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Nuevo Nombre"}'

# Eliminar cliente
curl -X DELETE http://localhost:3001/api/clients/client-001
```

### Debugging en Frontend

```javascript
// Habilitar logs en desarrollo
if (import.meta.env.DEV) {
  console.log('API Response:', response);
}
```

---

## 📦 Deployment

### Opción 1: Desarrollo Local

```bash
# Terminal 1 - Backend
cd backend-simulado
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Opción 2: JSON Server en Producción

Para deployment real, considera migrar a un backend real (Express, NestJS, etc.) o usar servicios como:

- **json-server** en Vercel/Netlify
- **my-json-server.typicode.com** (GitHub-based)
- **mockapi.io** (API mock service)

### Configuración de Variables de Entorno

**Desarrollo:**
```env
# .env.development
VITE_API_URL=http://localhost:3001/api
```

**Producción:**
```env
# .env.production
VITE_API_URL=https://tu-backend-produccion.com/api
```

---

## 📚 Recursos Adicionales

- [JSON Server Documentation](https://github.com/typicode/json-server)
- [Fetch API](https://developer.mozilla.org/es/docs/Web/API/Fetch_API)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ Checklist de Migración

- [ ] Backend simulado instalado y corriendo
- [ ] Variables de entorno configuradas en frontend
- [ ] Capa de servicios API creada
- [ ] authStore refactorizado para usar API
- [ ] clientStore refactorizado para usar API
- [ ] paymentStore refactorizado para usar API
- [ ] Componentes actualizados para usar stores refactorizados
- [ ] Testing de endpoints funcionando
- [ ] Manejo de errores implementado
- [ ] Estados de carga (loading) implementados

---

## 🆘 Solución de Problemas

### Error: "Failed to fetch"

**Problema:** CORS o servidor no corriendo

**Solución:**
```bash
# Verificar que el backend esté corriendo
cd backend-simulado
npm start

# El servidor debe mostrar: "JSON Server está corriendo!"
```

### Error: "Token inválido"

**Problema:** Token expirado o no enviado

**Solución:**
```javascript
// Verificar que el token se esté enviando en headers
console.log('Auth Token:', getAuthToken());

// Re-login si es necesario
await authApi.login(username, password);
```

### Error: "Cannot GET /api/..."

**Problema:** Endpoint no existe o ruta incorrecta

**Solución:**
```bash
# Verificar rutas disponibles en server.js
# Asegurarse de usar /api/ como prefijo
```

---

## 📞 Soporte

Si tienes problemas con la migración, verifica:

1. Que el backend esté corriendo en puerto 3001
2. Que el frontend esté configurado con la URL correcta en .env
3. Que los stores estén importando las APIs correctamente
4. Que los componentes estén usando los stores refactorizados

---

**¡Migración completada exitosamente!** 🎉

Ahora tienes una arquitectura cliente-servidor moderna y escalable.
