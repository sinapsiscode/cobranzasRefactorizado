# 🔗 Guía de Integración Frontend-Backend

## ✅ **Estado Actual**

### 🚀 **Backend Configurado**
- **Puerto**: `4020`
- **URL Base**: `http://localhost:4020`
- **Estado**: 🟢 **FUNCIONANDO**

### 🔗 **Frontend Conectado**
- **Configuración**: ✅ Actualizada para puerto 4020
- **API Service**: ✅ Compatible
- **Estado**: 🟡 **LISTO PARA USAR**

---

## 🎯 **Credenciales de Acceso**

### 👤 **Usuarios Disponibles**
```javascript
// Administrador
username: "admin"
password: "admin123"

// Sub-administrador
username: "subadmin"
password: "subadmin123"

// Cobrador
username: "collector1"
password: "collector123"
```

---

## 📡 **APIs Disponibles**

### 🔐 **Autenticación**
```javascript
// Login
POST http://localhost:4020/auth/login
{
  "username": "admin",
  "password": "admin123"
}

// Respuesta exitosa:
{
  "success": true,
  "data": {
    "user": { /* datos del usuario */ },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 28800000
  },
  "message": "Login exitoso"
}
```

### 👥 **Clientes**
```javascript
// Obtener todos los clientes
GET http://localhost:4020/api/clients
Headers: Authorization: Bearer <token>

// Crear cliente
POST http://localhost:4020/api/clients
Headers: Authorization: Bearer <token>
{
  "fullName": "Juan Pérez",
  "dni": "12345678",
  "phone": "+51987654321",
  "address": "Av. Principal 123",
  "neighborhood": "San Isidro",
  "servicePlan": "standard"
}
```

### 💰 **Pagos**
```javascript
// Obtener pagos
GET http://localhost:4020/api/payments
Headers: Authorization: Bearer <token>

// Registrar pago
POST http://localhost:4020/api/payments
Headers: Authorization: Bearer <token>
{
  "clientId": "client-001",
  "amount": 45.00,
  "paymentMethod": "cash"
}
```

### 📊 **Dashboard**
```javascript
// Dashboard general
GET http://localhost:4020/api/dashboard/overview
Headers: Authorization: Bearer <token>

// Dashboard para cobradores
GET http://localhost:4020/api/dashboard/collections
Headers: Authorization: Bearer <token>

// Dashboard administrativo
GET http://localhost:4020/api/dashboard/admin
Headers: Authorization: Bearer <token>
```

### 🏘️ **Datos de Configuración**
```javascript
// Servicios disponibles
GET http://localhost:4020/api/services
Headers: Authorization: Bearer <token>

// Barrios disponibles
GET http://localhost:4020/api/neighborhoods
Headers: Authorization: Bearer <token>
```

---

## 🔧 **Cómo Usar desde el Frontend**

### 1. **Verificar Configuración**
```javascript
// En frontend/src/config/api.js
const API_CONFIG = {
  BASE_URL: 'http://localhost:4020', // ✅ Ya configurado
  // ...
}
```

### 2. **Ejemplo de Login**
```javascript
import apiService from './services/apiService.js'

// Login
try {
  const response = await apiService.login('admin', 'admin123')
  console.log('Login exitoso:', response.data.user)
  console.log('Token:', response.data.token)
} catch (error) {
  console.error('Error en login:', error.message)
}
```

### 3. **Ejemplo de Obtener Clientes**
```javascript
import apiService from './services/apiService.js'

// Obtener clientes
try {
  const response = await apiService.getClients()
  console.log('Clientes:', response.data)
} catch (error) {
  console.error('Error obteniendo clientes:', error.message)
}
```

### 4. **Ejemplo de Crear Cliente**
```javascript
import apiService from './services/apiService.js'

const nuevoCliente = {
  fullName: "María García López",
  dni: "87654321",
  phone: "+51987654321",
  email: "maria@email.com",
  address: "Jr. Los Robles 456, Lima",
  neighborhood: "Miraflores",
  servicePlan: "premium",
  preferredPaymentDay: 15
}

try {
  const response = await apiService.createClient(nuevoCliente)
  console.log('Cliente creado:', response.data)
} catch (error) {
  console.error('Error creando cliente:', error.message)
}
```

---

## 🚀 **Próximos Pasos**

### **Inmediatos** (Hacer ahora)
1. ✅ **Probar login** desde la interfaz del frontend
2. ✅ **Verificar** que se muestren los datos reales
3. ✅ **Adaptar componentes** para usar las APIs

### **Siguientes** (Después)
1. **Implementar validaciones** en formularios
2. **Agregar manejo de errores** robusto
3. **Optimizar rendimiento** con loading states
4. **Implementar notificaciones** de éxito/error

---

## 🛠️ **Comandos Útiles**

### **Iniciar Backend**
```bash
cd backend
npm run dev
# Servidor en http://localhost:4020
```

### **Iniciar Frontend**
```bash
cd frontend
npm run dev
# Frontend en http://localhost:5173
```

### **Probar API Manualmente**
```bash
# Health check
curl http://localhost:4020/health

# Login
curl -X POST http://localhost:4020/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🎯 **Datos Disponibles**

### **Clientes**
- ✅ 2 clientes de ejemplo con datos reales
- ✅ Diferentes tipos de facturación (gratis, prorrateo)
- ✅ Asignados a cobradores específicos

### **Servicios**
- ✅ 3 planes: Básico (S/25), Estándar (S/45), Premium (S/75)
- ✅ Con características detalladas

### **Barrios**
- ✅ 5 barrios configurados con zonas
- ✅ San Isidro, Surco, San Miguel, Miraflores, La Molina

### **Usuarios**
- ✅ 1 Admin, 1 SubAdmin, 1 Cobrador
- ✅ Con roles y permisos configurados

---

## ⚠️ **Consideraciones Importantes**

1. **Tokens JWT**: Expiran en 8 horas
2. **CORS**: Configurado para localhost:5173
3. **Validaciones**: DNI 8 dígitos, teléfono +51XXXXXXXXX
4. **Permisos**: Cobradores solo ven sus clientes asignados
5. **Logs**: Todas las operaciones se registran automáticamente

---

## 🆘 **Troubleshooting**

### **Backend no inicia**
```bash
# Verificar puerto libre
netstat -ano | findstr :4020

# Cambiar puerto si es necesario
PORT=4021 npm run dev
```

### **Error CORS**
- ✅ Ya configurado para localhost:5173
- Verificar que el frontend esté en puerto 5173

### **Token expirado**
- El frontend debe manejar renovación automática
- O redirigir al login cuando expire

---

¡El backend está **100% funcional** y listo para ser usado por tu frontend! 🎉