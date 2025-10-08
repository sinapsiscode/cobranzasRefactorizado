# ROLES Y FUNCIONES DEL SISTEMA

Documentación completa de todas las funcionalidades disponibles para cada rol de usuario en el Sistema de Gestión de Cobranzas TV Cable.

---

## 📋 ÍNDICE DE ROLES

1. [**ADMIN** (Súper Administrador)](#1-admin-súper-administrador)
2. [**SUBADMIN** (Administrador)](#2-subadmin-administrador)
3. [**COLLECTOR** (Cobrador)](#3-collector-cobrador)
4. [**CLIENT** (Cliente)](#4-client-cliente)

---

## 1. ADMIN (Súper Administrador)

**Acceso completo a todas las funcionalidades del sistema**

### 🏠 DASHBOARD (`/admin/dashboard`)
- Ver métricas generales del sistema
  - Total recaudado (histórico completo)
  - Pagos pendientes
  - Tasa de morosidad
  - Clientes al día
- Gráficos de cobranza (últimos 6 meses)
- Gráfico de estado de pagos
- Acciones rápidas (botones de acceso directo)
- **Registrar pago manual**
- **Exportar dashboard a Excel** (métricas, clientes, pagos)
- **Cargar datos de simulación**
- **Panel de automatización**
  - Ver estadísticas del servicio de pagos
  - Ejecutar verificación manual de pagos
  - Forzar cierre de mes

### 👥 GESTIÓN DE CLIENTES (`/admin/clients`)
- **Ver lista completa de clientes**
- **Buscar clientes** (por nombre, DNI, teléfono)
- **Filtrar clientes**
  - Por estado (activo, suspendido, cancelado, etc.)
  - Por plan de servicio (básico, estándar, premium)
  - Por estado del cliente
  - Por barrio/zona
- **Agregar nuevo cliente**
  - Datos personales (nombre, DNI, teléfono 1 y 2, email)
  - Dirección y barrio
  - Plan de servicio y tipo de servicio
  - Servicios contratados (internet, cable, teléfono)
  - Día preferido de pago
  - Fecha de instalación
  - Precio personalizado (opcional)
- **Editar cliente**
  - Modificar todos los datos del cliente
  - Cambiar plan de servicio
  - Actualizar precios personalizados
- **Eliminar cliente**
- **Cambiar estado del cliente**
  - Activo
  - Suspendido
  - Cancelado
  - Moroso
  - Con motivo/razón del cambio
- **Ver historial completo del cliente**
  - Historial de pagos
  - Historial de cambios de estado
  - Historial de cambios de servicio
- **Ver datos extendidos del cliente**
  - Información de instalación
  - Detalles de facturación
  - Tipo de tarifa (prorrateo/mes gratis)
  - Precio efectivo del servicio
- **Registrar pago para un cliente**
- **Exportar clientes a Excel**
- **Contactar cliente por WhatsApp** (botón directo)
- **Enviar recordatorios de pago masivos** (email)
- **Gestionar barrios/zonas**
  - Agregar nuevo barrio
  - Editar barrio
  - Eliminar barrio

### 📥 IMPORTACIÓN DE CLIENTES (`/admin/import-clients`)
- **Importar clientes desde archivo Excel**
- **Ver plantilla de importación**
- **Validación de datos en tiempo real**
- **Previsualización de datos antes de importar**
- **Manejo de errores de importación**

### 📊 DATOS EXTENDIDOS (`/admin/extended-data`)
- **Ver datos de instalación de clientes**
- **Ver información de facturación**
- **Gestionar tipos de tarifa** (prorrateo, mes gratis)
- **Ver costos efectivos por cliente**
- **Exportar datos extendidos**

### 📅 DEUDAS MENSUALES (`/admin/monthly-debts`)
- **Vista de resumen de deudas**
  - Ver clientes con deudas
  - Ver meses adeudados por cliente
  - Estadísticas globales de deudas
- **Vista de matriz mensual**
  - Ver todos los meses del año en formato tabla
  - Estados por mes: Pagado, Pendiente, Vencido, Monto adeudado
  - Colores por estado
- **Registrar pago de deuda**
- **Ver detalles de pago por mes**
- **Filtrar por estado** (al día, con deuda)
- **Filtrar por barrio**
- **Filtrar por año**
- **Búsqueda por cliente**
- **Exportar matriz mensual a Excel**
  - Formato: Cliente | Teléfono | Enero | Febrero | ... | Diciembre
  - 14 columnas en total

### 👤 GESTIÓN DE COBRADORES (`/admin/collectors`)
- **Ver lista de cobradores**
- **Agregar nuevo cobrador**
- **Editar cobrador**
  - Datos personales
  - Zona/barrio asignado
  - Metas de cobro
- **Eliminar cobrador**
- **Asignar clientes a cobrador**
- **Ver estadísticas por cobrador**
  - Total recaudado
  - Clientes asignados
  - Pagos cobrados
  - Tasa de efectividad
- **Ver historial de cobranzas**

### 🔐 GESTIÓN DE USUARIOS (`/admin/users`)
- **Ver todos los usuarios del sistema**
  - Admins
  - SubAdmins
  - Cobradores
  - Clientes
- **Agregar nuevo usuario**
  - Username
  - Email
  - Password
  - Nombre completo
  - Teléfono
  - Rol (admin, subadmin, collector, client)
  - Estado (activo/inactivo)
- **Editar usuario**
  - Modificar todos los datos
  - Cambiar rol
  - Cambiar contraseña
- **Eliminar usuario**
- **Activar/Desactivar usuario**
- **Ver estadísticas por usuario**
  - Para cobradores: clientes, cobros, pendientes
  - Para clientes: pagos realizados, deudas
- **Filtrar por rol**
- **Filtrar por estado** (activo/inactivo)
- **Buscar usuarios**

### 💳 GESTIÓN DE PAGOS (`/admin/payments`)
- **Vista de pagos pendientes de validación**
- **Vista de historial de pagos**
- **Vista de vouchers subidos**
- **Agrupar pagos por mes** (vista de carpetas)
- **Vista de lista de pagos**
- **Validar pagos cobrados por cobradores**
- **Validar vouchers subidos por clientes**
  - Ver imagen del voucher
  - Aprobar voucher
  - Rechazar voucher con motivo
  - Ver datos del voucher (número operación, monto, método de pago, meses pagados)
- **Registrar nuevo pago**
- **Editar pago**
- **Anular pago**
- **Generar recibo de pago en PDF**
- **Filtrar pagos**
  - Por estado (pagado, pendiente, vencido, validado, rechazado)
  - Por mes
  - Por cliente
  - Por cobrador
  - Por método de pago
- **Búsqueda de pagos**
- **Ver contador de pagos pendientes de validación** (con badge en sidebar)

### 💰 GESTIÓN DE CAJAS (`/admin/cashboxes`)
**3 pestañas principales:**

#### Pestaña 1: Solicitudes de Apertura (`requests`)
- **Ver solicitudes de apertura de caja de cobradores**
  - Solicitudes pendientes
  - Solicitudes aprobadas
  - Solicitudes rechazadas
- **Aprobar solicitud de apertura**
  - Establecer monto inicial en efectivo
  - Establecer monto inicial digital (Yape, Plin, Transferencia, Otros)
- **Rechazar solicitud con motivo**
- **Filtrar solicitudes por estado**
- **Filtrar por cobrador**
- **Filtrar por fecha**

#### Pestaña 2: Supervisión de Cajas (`supervision`)
- **Ver cajas abiertas actualmente**
  - Ver cobrador
  - Ver fecha de apertura
  - Ver monto inicial
  - Ver cobros del día
  - Ver gastos registrados
  - Ver saldo actual
- **Ver detalles de caja específica**
  - Lista de cobros realizados
  - Lista de gastos del día
  - Totales por método de pago
- **Cerrar caja de cobrador**
  - Validar conteo final
  - Generar reporte de cierre
- **Ver alertas de cajas** (descuadres, montos inusuales)

#### Pestaña 3: Flujo de Caja (`cashflow`)
- **Vista de resumen**
  - Total de ingresos
  - Total de egresos
  - Balance neto
  - Gráficos de flujo
- **Vista de ingresos** (pagos recibidos)
- **Vista de gastos**
- **Registrar gasto general**
  - Monto
  - Concepto
  - Categoría (mantenimiento, servicios, suministros, otros)
  - Tipo de servicio
  - Descripción
  - Fecha
  - Método de pago
  - Número de recibo
  - Proveedor
- **Filtrar por categoría de gasto**
- **Filtrar por rango de fechas**
- **Exportar flujo de caja a Excel**

### 🔧 GESTIÓN DE SERVICIOS (`/admin/services`)
- **Ver lista de servicios ofrecidos**
  - Internet
  - Cable TV
  - Teléfono
  - Paquetes combinados
- **Agregar nuevo servicio**
  - Nombre
  - Descripción
  - Categoría (internet, cable, telefono, paquete)
  - Precio base
  - Velocidad (para internet)
  - Canales (para cable)
  - Características incluidas
  - Estado (activo/inactivo)
- **Editar servicio**
  - Modificar todos los datos
  - Actualizar precios
  - Cambiar características
- **Eliminar servicio**
- **Activar/Desactivar servicio**
- **Configurar precios por tipo de servicio**
  - Precio base
  - Precio con descuento
  - Precio promocional
- **Ver servicios activos/inactivos**

### 📱 MÉTODOS DE PAGO (`/admin/payment-methods`)
- **Ver métodos de pago disponibles**
  - Efectivo
  - Yape
  - Plin
  - Transferencia bancaria
  - Tarjeta de crédito/débito
  - Otros
- **Configurar cada método de pago**
  - Habilitar/Deshabilitar
  - Configurar datos específicos (número de cuenta, CCI, número de Yape/Plin)
  - Establecer si requiere comprobante
  - Establecer si requiere validación admin
- **Ver instrucciones de pago por método**
- **Editar instrucciones**
- **Guardar configuración**

### 💾 BACKUPS (`/admin/backups`)
- **Crear backup completo del sistema**
  - Exportar todos los datos a archivo JSON
  - Incluye: clientes, pagos, usuarios, servicios, cajas, configuraciones
- **Ver lista de backups creados**
  - Fecha y hora de creación
  - Tamaño del archivo
  - Usuario que lo creó
- **Descargar backup**
- **Restaurar desde backup**
  - Seleccionar archivo JSON
  - Previsualizar datos a restaurar
  - Confirmar restauración (SOBRESCRIBE datos actuales)
- **Eliminar backup antiguo**
- **Programar backups automáticos**

### 📈 REPORTES (`/admin/reports`)
- **Reportes disponibles:**
  1. **Reporte de Morosidad Mensual Comparativa**
     - Comparar morosidad mes a mes
     - Gráficos de tendencias
  2. **Reporte de Morosos por Barrio**
     - Desglose por zona geográfica
     - Identificar zonas problemáticas
  3. **Reporte de Cobranza por Cobrador**
     - Rendimiento individual
     - Ranking de cobradores
  4. **Reporte de Servicios Contratados**
     - Popularidad de servicios
     - Ingresos por tipo de servicio
  5. **Reporte Financiero General**
     - Ingresos totales
     - Egresos totales
     - Utilidad neta
- **Generar reporte en PDF**
- **Exportar reporte a Excel**
- **Filtrar por rango de fechas**
- **Imprimir reporte**

### 📊 ANALYTICS (`/admin/analytics`)
- **Panel de análisis avanzado**
- **Gráficos interactivos**
  - Tendencias de cobranza
  - Análisis de morosidad
  - Proyecciones de ingresos
- **KPIs principales**
  - Tasa de retención de clientes
  - Tiempo promedio de pago
  - Efectividad de cobranza
- **Comparativas periodo a periodo**
- **Exportar análisis**

---

## 2. SUBADMIN (Administrador)

**Acceso limitado a funcionalidades administrativas. NO puede gestionar usuarios ni configuraciones críticas del sistema**

### 🏠 DASHBOARD (`/subadmin/dashboard`)
- Ver métricas generales **(limitadas a últimos 3 meses)**
  - Total recaudado (últimos 3 meses)
  - Pagos pendientes
  - Tasa de morosidad
  - Clientes al día
- Gráficos de cobranza
- Gráfico de estado de pagos
- Registrar pago manual
- Exportar dashboard a Excel

### 👥 GESTIÓN DE CLIENTES (`/subadmin/clients`)
- **Todas las funciones de Admin en clientes:**
  - Ver, buscar, filtrar clientes
  - Agregar nuevo cliente
  - Editar cliente
  - Eliminar cliente
  - Cambiar estado del cliente
  - Ver historial del cliente
  - Ver datos extendidos
  - Registrar pago
  - Exportar a Excel
  - Contactar por WhatsApp
  - Gestionar barrios

### 📊 DATOS EXTENDIDOS (`/subadmin/extended-data`)
- Ver datos de instalación
- Ver información de facturación
- Gestionar tipos de tarifa
- Ver costos efectivos
- Exportar datos extendidos

### 📅 DEUDAS MENSUALES (`/subadmin/monthly-debts`)
- **Todas las funciones de Admin:**
  - Vista de resumen
  - Vista de matriz mensual
  - Registrar pago de deuda
  - Filtros (estado, barrio, año)
  - Búsqueda
  - Exportar a Excel

### 👤 GESTIÓN DE COBRADORES (`/subadmin/collectors`)
- **Todas las funciones de Admin:**
  - Ver, agregar, editar cobradores
  - Asignar clientes
  - Ver estadísticas
  - Ver historial

### 🔐 GESTIÓN DE USUARIOS (`/subadmin/users`)
**⚠️ LIMITADO: Solo puede crear y gestionar CLIENTES**
- **Ver solo usuarios tipo CLIENTE**
- **Crear nuevos clientes con credenciales de acceso**
  - Generar username y password automáticamente
  - Ver credenciales generadas
- **Editar clientes**
- **No puede:**
  - Ver, crear o editar usuarios Admin
  - Ver, crear o editar usuarios SubAdmin
  - Ver, crear o editar usuarios Collector
  - Cambiar roles de usuarios

### 💳 GESTIÓN DE PAGOS (`/subadmin/payments`)
- **Todas las funciones de Admin:**
  - Ver pagos pendientes
  - Ver historial
  - Ver vouchers
  - Validar pagos y vouchers
  - Registrar nuevo pago
  - Generar recibos PDF
  - Filtros y búsqueda

### 💰 GESTIÓN DE CAJAS (`/subadmin/cashboxes`)
- **Todas las funciones de Admin:**
  - Ver y gestionar solicitudes de apertura
  - Supervisar cajas abiertas
  - Ver flujo de caja
  - Registrar gastos
  - Cerrar cajas
  - Exportar datos

### 📈 REPORTES (`/subadmin/reports`)
- **Todos los reportes de Admin:**
  - Reporte de morosidad
  - Reporte por barrio
  - Reporte por cobrador
  - Reporte de servicios
  - Reporte financiero
- Generar PDF
- Exportar a Excel

### ❌ NO TIENE ACCESO A:
- Importación de clientes
- Gestión de servicios
- Métodos de pago
- Backups del sistema
- Analytics avanzado
- Configuraciones críticas del sistema
- Gestión de usuarios (excepto clientes)

---

## 3. COLLECTOR (Cobrador)

**Rol especializado para trabajo de campo. Acceso limitado a funciones de cobranza**

### 🏠 DASHBOARD (`/collector/dashboard`)
- **Ver resumen del día**
  - Fecha actual
  - Clientes cobrados vs total asignado
  - Meta del día (porcentaje completado)
- **Métricas del día**
  - Total recaudado hoy
  - Pagos pendientes del día
  - Pagos vencidos
- **Estadísticas generales**
  - Clientes asignados (total)
  - Meta diaria (%)
- **Lista de clientes del día**
  - Ver clientes programados para hoy
  - Estado de cada cliente (pagado/pendiente/vencido)
  - Información de contacto
  - Dirección
  - Monto a cobrar
  - Plan contratado
- **Acciones rápidas**
  - Botón: Registrar pago
  - Botón: Ver ubicaciones (mapa)
- **Botón flotante: Registrar Pago Rápido**

### 👥 CLIENTES (`/collector/clients`)
- **Ver lista de clientes asignados**
- **Buscar clientes** (por nombre, DNI, teléfono)
- **Filtrar por estado de pago**
  - Sin pagos
  - Al día
  - Pendiente
  - Vencido
- **Filtrar por barrio/zona**
  - Ver solo clientes con deuda en zona seleccionada
- **Ver información del cliente**
  - Nombre completo
  - Dirección
  - Teléfono
  - Plan de servicio
  - Velocidad/características
  - Monto mensual
  - Estado de pago actual
- **Llamar al cliente** (botón directo al teléfono)
- **Ver ubicación del cliente** (mapa)
- **Registrar pago del cliente**
  - Método de pago (efectivo, Yape, Plin, transferencia)
  - Monto
  - Descripción
  - Mes pagado
  - Pago parcial (sí/no)
  - Pago adelantado (sí/no)
- **Ver historial de pagos del cliente**

### 💰 MI CAJA (`/collector/cash-box`)

#### Si NO tiene caja abierta:
- **Solicitar apertura de caja**
  - Ingresar notas/comentarios
  - Enviar solicitud a Admin/SubAdmin
  - Ver estado de solicitud
    - Pendiente (amarillo)
    - Aprobada (verde) → puede abrir caja
    - Rechazada (rojo) → ver motivo

#### Si tiene caja aprobada pero no abierta:
- **Abrir caja**
  - Ver monto inicial en efectivo (aprobado por admin)
  - Ver monto inicial digital por método (Yape, Plin, Transferencia, Otros)
  - Confirmar apertura

#### Si tiene caja abierta:
- **Ver estado actual de caja**
  - Hora de apertura
  - Monto inicial (efectivo + digital)
  - Total cobrado hasta el momento
  - Cobros en efectivo
  - Cobros digitales (desglosado por método)
  - Gastos del día
  - Saldo actual en caja
- **Registrar cobro** (desde esta pantalla)
- **Registrar gasto**
  - Concepto
  - Monto
  - Descripción
  - Tipo de servicio (general, internet, cable, telefono)
  - Fecha
- **Ver lista de cobros del día**
  - Cliente
  - Monto
  - Método de pago
  - Hora
- **Ver lista de gastos del día**
  - Concepto
  - Monto
  - Descripción
- **Eliminar gasto** (solo los propios)
- **Solicitar cierre de caja**
  - Ingresar conteo final efectivo
  - Ingresar conteo final digital
  - Ver diferencias (si las hay)
  - Confirmar cierre
  - Generar reporte de cierre (PDF)
- **Ver historial de cajas**
  - Cajas anteriores cerradas
  - Ver detalles de cada caja pasada

### ❌ NO TIENE ACCESO A:
- Gestión de otros usuarios
- Gestión de clientes (crear, editar, eliminar)
- Configuraciones del sistema
- Reportes generales
- Backups
- Cajas de otros cobradores
- Aprobación de solicitudes
- Validación de pagos de otros cobradores
- Gestión de servicios
- Analytics

---

## 4. CLIENT (Cliente)

**Rol con acceso mínimo. Solo puede ver su información y subir comprobantes de pago**

### 🏠 MI CUENTA (`/client/dashboard`)
- **Ver información personal**
  - Nombre completo
  - DNI
  - Teléfono
  - Email
  - Dirección
  - Barrio
- **Ver plan contratado**
  - Nombre del plan (Básico, Estándar, Premium)
  - Servicios incluidos (Internet, Cable, Teléfono)
  - Precio mensual
  - Velocidad de internet
  - Canales de cable (si aplica)
- **Ver estado de cuenta**
  - Estado actual (activo, suspendido, moroso)
  - Fecha de instalación
  - Fecha de próximo pago
- **Ver deudas pendientes**
  - **Calendario mensual del año en curso**
  - Meses pagados (verde)
  - Meses pendientes (amarillo)
  - Meses vencidos (rojo)
  - Monto adeudado por mes
- **Ver historial de pagos**
  - Lista de pagos realizados
  - Fecha de pago
  - Monto
  - Método de pago
  - Meses pagados
  - Estado (pagado, pendiente validación)
- **Ver vouchers subidos**
  - Lista de comprobantes subidos
  - Estado de cada voucher:
    - Pendiente (amarillo)
    - Aprobado (verde)
    - Rechazado (rojo)
  - Fecha de subida
  - Monto
  - Meses que cubre
  - Comentarios de admin (si fue rechazado)
- **Ver métodos de pago disponibles**
  - Ver instrucciones para cada método
  - Ver números de cuenta
  - Copiar números (con botón de copiar)

### 📤 SUBIR VOUCHER (`/client/upload-voucher`)
- **Subir comprobante de pago**
  - Seleccionar archivo de imagen (JPG, PNG)
  - Arrastrar y soltar archivo
  - Vista previa de imagen
- **Llenar formulario de voucher**
  - **Número de operación** (validación automática de duplicados)
  - **Monto pagado**
  - **Fecha de pago**
  - **Seleccionar mes(es) que está pagando**
    - Vista de calendario
    - Selección múltiple de meses
    - Ver meses con deuda resaltados
  - **Método de pago**
    - Efectivo
    - Yape
    - Plin
    - Transferencia
    - Tarjeta
    - Otros
  - **Comentarios adicionales** (opcional)
- **Ver resumen antes de enviar**
  - Confirmar todos los datos
- **Enviar voucher**
  - Barra de progreso de subida
  - Confirmación de envío exitoso
- **Ver vouchers enviados**
  - Estado de validación
  - Poder ver imagen del voucher subido

### ❌ NO TIENE ACCESO A:
- Información de otros clientes
- Gestión de usuarios
- Reportes del sistema
- Configuraciones
- Datos de cobradores
- Cajas de cobranza
- Backups
- Ninguna función administrativa

---

## 📊 RESUMEN COMPARATIVO DE ACCESOS

| Funcionalidad | Admin | SubAdmin | Collector | Client |
|--------------|-------|----------|-----------|--------|
| **Dashboard completo** | ✅ | ✅ (3 meses) | ✅ (personal) | ✅ (personal) |
| **Gestión de clientes** | ✅ Completo | ✅ Completo | ❌ Solo ver | ❌ |
| **Importar clientes Excel** | ✅ | ❌ | ❌ | ❌ |
| **Datos extendidos** | ✅ | ✅ | ❌ | ❌ |
| **Deudas mensuales** | ✅ | ✅ | ❌ | ✅ (propias) |
| **Gestión cobradores** | ✅ | ✅ | ❌ | ❌ |
| **Gestión usuarios** | ✅ Todo | ⚠️ Solo clientes | ❌ | ❌ |
| **Gestión de pagos** | ✅ | ✅ | ✅ (cobrar) | ✅ (subir voucher) |
| **Validar pagos** | ✅ | ✅ | ❌ | ❌ |
| **Gestión de cajas** | ✅ Supervisión | ✅ Supervisión | ✅ (propia caja) | ❌ |
| **Aprobar solicitudes caja** | ✅ | ✅ | ❌ | ❌ |
| **Gestión servicios** | ✅ | ❌ | ❌ | ❌ |
| **Métodos de pago config** | ✅ | ❌ | ❌ | ❌ |
| **Backups** | ✅ | ❌ | ❌ | ❌ |
| **Reportes** | ✅ | ✅ | ❌ | ❌ |
| **Analytics** | ✅ | ❌ | ❌ | ❌ |
| **Exportar a Excel** | ✅ | ✅ | ❌ | ❌ |
| **Generar PDFs** | ✅ | ✅ | ✅ (caja) | ❌ |

---

## 🔑 CREDENCIALES DE PRUEBA

```
Admin:      usuario: admin      | password: admin123
Cobrador:   usuario: collector  | password: collector123
Cliente:    usuario: client-1   | password: password123
```

---

## 📝 NOTAS IMPORTANTES

1. **SubAdmin** tiene casi los mismos permisos que Admin, EXCEPTO:
   - No puede gestionar usuarios (solo clientes)
   - No puede importar clientes masivamente
   - No puede configurar servicios
   - No puede configurar métodos de pago
   - No puede hacer backups
   - No tiene acceso a analytics
   - Dashboard limitado a 3 meses

2. **Collector** está optimizado para trabajo de campo:
   - Solo ve sus propios clientes asignados
   - Solo gestiona su propia caja
   - Puede registrar pagos en efectivo y digitales
   - Debe solicitar apertura de caja diariamente

3. **Client** tiene acceso muy limitado:
   - Solo ve su propia información
   - Solo puede subir comprobantes de pago
   - No puede modificar ningún dato del sistema
   - Puede ver su historial de pagos y deudas

4. **Validación de pagos**: Los pagos registrados por cobradores y vouchers subidos por clientes quedan en estado "pendiente de validación" hasta que un Admin o SubAdmin los valide.

5. **Sistema de caja del cobrador**:
   - Requiere aprobación de Admin/SubAdmin para abrir
   - Debe cerrar al final del día
   - Registra cobros y gastos separadamente
   - Genera reporte de cierre automático
