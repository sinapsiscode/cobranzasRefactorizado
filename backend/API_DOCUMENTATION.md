# TV Cable Cobranzas - API REST

API REST construida con JSON Server para gestión de cobranzas de TV Cable.

## 🚀 Características

- **JSON Server** como base con funcionalidades personalizadas
- **Autenticación JWT** con roles (admin, subadmin, collector)
- **Rutas de negocio especializadas** para cobranzas
- **Middlewares de validación y logging**
- **Generación automática de deudas mensuales**
- **Dashboard con estadísticas en tiempo real**
- **Sistema de permisos por roles**

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.js          # Autenticación y autorización
│   │   ├── validation.js    # Validación de datos
│   │   └── logging.js       # Sistema de logs
│   ├── routes/
│   │   ├── index.js         # Rutas principales y auth
│   │   ├── clients.js       # Gestión de clientes
│   │   ├── payments.js      # Gestión de pagos
│   │   └── dashboard.js     # Estadísticas y dashboards
│   ├── services/
│   │   └── businessService.js # Lógica de negocio
│   └── utils/
│       ├── seeder.js        # Migración y seeding de datos
│       └── reset.js         # Reset de base de datos
├── logs/                    # Logs de la aplicación
├── db.json                  # Base de datos JSON
├── server.js               # Servidor principal
└── package.json
```

## 🛠️ Instalación y Configuración

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

3. **Migrar datos iniciales**:
```bash
npm run seed
```

4. **Iniciar servidor de desarrollo**:
```bash
npm run dev
```

5. **Iniciar servidor de producción**:
```bash
npm start
```

## 🔐 Autenticación

### Login
```bash
POST /auth/login
```

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Usuarios por defecto:**
- **Admin**: `admin` / `admin123`
- **SubAdmin**: `subadmin` / `subadmin123`
- **Cobrador**: `collector1` / `collector123`

### Validar Token
```bash
POST /auth/validate
Headers: Authorization: Bearer <token>
```

## 📊 Endpoints Principales

### 🏠 Dashboard
```bash
# Resumen general
GET /api/dashboard/overview

# Dashboard para cobradores
GET /api/dashboard/collections?collectorId=collector-1

# Dashboard administrativo (solo admin/subadmin)
GET /api/dashboard/admin
```

### 👥 Clientes
```bash
# Listar clientes con filtros
GET /api/clients?isActive=true&neighborhood=Surco

# Obtener cliente por ID
GET /api/clients/client-001

# Crear cliente
POST /api/clients

# Actualizar cliente
PUT /api/clients/client-001

# Activar/Desactivar cliente
PATCH /api/clients/client-001/activate
PATCH /api/clients/client-001/deactivate
```

### 💰 Pagos
```bash
# Listar pagos con filtros
GET /api/payments?status=pending&month=2025-09

# Registrar pago
POST /api/payments

# Obtener cobranzas pendientes
GET /api/payments/pending?collectorId=collector-1

# Generar deudas mensuales (solo admin/subadmin)
POST /api/payments/generate-monthly

# Marcar pagos vencidos (solo admin/subadmin)
PUT /api/payments/mark-overdue

# Estadísticas de pagos
GET /api/payments/stats?month=2025-09
```

### 📈 Rutas de Negocio Legacy
```bash
# Cobranzas pendientes
GET /api/business/collections/pending

# Registrar pago
POST /api/business/payments

# Estadísticas generales
GET /api/business/stats

# Generar deudas mensuales
POST /api/business/generate-monthly-debts
```

## 🎯 Ejemplos de Uso

### Crear un cliente
```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "fullName": "Juan Pérez García",
    "dni": "12345678",
    "phone": "+51987654321",
    "email": "juan@email.com",
    "address": "Av. Principal 123, Lima",
    "neighborhood": "San Isidro",
    "servicePlan": "standard",
    "preferredPaymentDay": 15,
    "assignedCollector": "collector-1"
  }'
```

### Registrar un pago
```bash
curl -X POST http://localhost:3001/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "clientId": "client-001",
    "amount": 45.00,
    "paymentMethod": "cash",
    "comments": "Pago en efectivo"
  }'
```

### Generar deudas mensuales
```bash
curl -X POST http://localhost:3001/api/payments/generate-monthly \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "month": 10,
    "year": 2025
  }'
```

## 🔒 Roles y Permisos

### Admin
- Acceso completo a todas las funcionalidades
- Gestión de usuarios, clientes y pagos
- Generación de deudas mensuales
- Dashboard administrativo

### SubAdmin
- Similar al admin pero con ciertas restricciones
- No puede eliminar usuarios
- Puede gestionar clientes y pagos

### Collector (Cobrador)
- Solo ve clientes asignados
- Puede registrar pagos
- Dashboard limitado a sus cobranzas
- No puede generar deudas

## 📋 Validaciones

### Datos de Cliente
- **DNI**: 8 dígitos numéricos
- **Teléfono**: Formato +51XXXXXXXXX
- **Email**: Formato válido (opcional)
- **Dirección**: Mínimo 10 caracteres
- **Plan**: basic, standard o premium

### Datos de Pago
- **Monto**: Número válido ≥ 0
- **Método**: cash, transfer, card, free
- **Cliente**: Debe existir en la base de datos

## 🛡️ Seguridad

- **JWT Tokens** con expiración de 8 horas
- **Validación de roles** en rutas protegidas
- **Sanitización de inputs**
- **Logs de auditoría** para operaciones críticas
- **CORS configurado** para dominios permitidos

## 📝 Logs

Los logs se guardan en `logs/api.log` con los siguientes niveles:
- **info**: Requests HTTP y operaciones generales
- **error**: Errores de aplicación y HTTP 4xx/5xx
- **business**: Operaciones de negocio (pagos, clientes)
- **debug**: Información de desarrollo

## 🔄 Base de Datos

### Estructura de Datos
```json
{
  "users": [...],          // Usuarios del sistema
  "clients": [...],        // Clientes de TV Cable
  "services": [...],       // Planes de servicio
  "payments": [...],       // Pagos y deudas
  "cashboxes": [...],      // Cajas de dinero
  "neighborhoods": [...],  // Barrios disponibles
  "notifications": [...],  // Notificaciones del sistema
  "backups": [...]        // Respaldos de datos
}
```

### Comandos Útiles
```bash
# Reinicializar base de datos
npm run reset

# Migrar datos del frontend
npm run seed

# Ver logs en tiempo real
tail -f logs/api.log
```

## 🌟 Funcionalidades Destacadas

### Generación Automática de Deudas
- Calcula prorrateos automáticamente
- Maneja meses gratis para instalaciones tardías
- Aplica diferentes tipos de facturación

### Dashboard Inteligente
- Estadísticas en tiempo real
- Filtros por cobrador, barrio, fecha
- Alertas para pagos vencidos

### Sistema de Roles Flexible
- Permisos granulares por endpoint
- Datos filtrados según el rol del usuario
- Auditoría completa de acciones

### Integración con Frontend
- APIs diseñadas para React
- Respuestas consistentes con `success/error`
- Paginación y filtros avanzados

## 🔧 Desarrollo

### Agregar Nuevas Rutas
1. Crear archivo en `src/routes/`
2. Importar en `src/routes/index.js`
3. Agregar middleware de autenticación si es necesario

### Agregar Validaciones
1. Crear función en `src/middleware/validation.js`
2. Aplicar en las rutas correspondientes

### Agregar Logs de Negocio
```javascript
import { businessLogger } from '../middleware/logging.js'

router.post('/endpoint', businessLogger('operacion'), (req, res) => {
  // Tu código aquí
})
```

## 📞 Soporte

Para reportar problemas o solicitar funcionalidades, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0
**Autor**: Gabriel
**Licencia**: MIT