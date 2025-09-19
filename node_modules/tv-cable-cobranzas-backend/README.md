# TV Cable Cobranzas - Backend API

Backend API basado en JSON Server para el sistema de gestión de cobranzas de TV Cable.

## 🚀 Instalación y Configuración

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación
```bash
cd backend
npm install
```

### Configuración
1. Copia el archivo de configuración:
```bash
cp .env.example .env
```

2. Ajusta las variables según tu entorno en `.env`

### Inicialización de Datos
```bash
# Generar base de datos con datos de prueba
npm run seed

# Resetear base de datos (elimina todo y regenera)
npm run reset
```

## 🎯 Scripts Disponibles

```bash
# Iniciar servidor en producción
npm start

# Iniciar servidor en desarrollo con auto-reload
npm run dev

# Poblar base de datos con datos iniciales
npm run seed

# Resetear base de datos
npm run reset
```

## 📡 API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `POST /auth/validate` - Validar token

### Recursos Principales (requieren autenticación)
- `GET|POST|PUT|DELETE /api/users` - Gestión de usuarios
- `GET|POST|PUT|DELETE /api/clients` - Gestión de clientes
- `GET|POST|PUT|DELETE /api/payments` - Gestión de pagos
- `GET|POST|PUT|DELETE /api/services` - Gestión de servicios
- `GET|POST|PUT|DELETE /api/cashboxes` - Gestión de cajas
- `GET|POST|PUT|DELETE /api/notifications` - Notificaciones
- `GET|POST|PUT|DELETE /api/vouchers` - Comprobantes
- `GET|POST|PUT|DELETE /api/monthlyDebts` - Deudas mensuales

### Endpoints Especiales
- `GET /health` - Estado del servidor
- `GET /dashboard/stats` - Estadísticas del dashboard
- `GET /neighborhoods` - Lista de barrios

## 🔐 Autenticación

### Usuarios por Defecto
```javascript
// Administrador
username: admin
password: admin123

// Sub-administrador
username: subadmin
password: subadmin123

// Cobradores
username: collector1, collector2, collector3
password: collector123
```

### Headers Requeridos
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── middleware/     # Middleware personalizado
│   ├── routes/         # Rutas personalizadas
│   └── utils/          # Utilidades (seeder, reset)
├── db.json            # Base de datos JSON
├── server.js          # Servidor principal
└── package.json
```

## 🛡️ Seguridad

- JWT tokens con expiración de 8 horas
- Middleware de autenticación en todas las rutas API
- Autorización por roles (admin, subadmin, collector, client)
- CORS configurado para dominios específicos
- Filtrado automático de datos por rol de usuario

## 📊 Base de Datos

La base de datos está en formato JSON con las siguientes colecciones:

- `users` - Usuarios del sistema
- `clients` - Clientes y sus datos
- `payments` - Historial de pagos
- `services` - Planes de servicio disponibles
- `cashboxes` - Cajas de dinero
- `notifications` - Notificaciones del sistema
- `vouchers` - Comprobantes de pago
- `monthlyDebts` - Deudas mensuales
- `neighborhoods` - Barrios/zonas de cobertura

## 🔄 Migración desde Mock Data

El seeder automáticamente migra los datos existentes desde:
- `frontend/src/data/simulation-clients.json`
- `frontend/src/data/simulation-cashboxes.json`
- `frontend/src/data/mock-payments-validated.json`

## 🚨 Desarrollo

### Logs
El servidor muestra logs detallados en consola incluyendo:
- Requests HTTP con método y ruta
- Errores de autenticación
- Operaciones de base de datos

### CORS
Configurado para permitir requests desde:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)
- `http://127.0.0.1:5173`

## 🐛 Troubleshooting

### Error: Puerto en uso
```bash
# Cambiar puerto en .env
PORT=3002
```

### Error: Base de datos corrupta
```bash
# Resetear base de datos
npm run reset
```

### Error: Permisos de archivos
```bash
# Verificar permisos del archivo db.json
chmod 666 db.json
```

## 📝 Notas de Producción

- Cambiar `JWT_SECRET` por valor seguro
- Configurar variables de entorno apropiadas
- Implementar logging estructurado
- Considerar migración a base de datos real (PostgreSQL/MySQL)
- Implementar rate limiting
- Añadir validación de entrada más robusta