# 🎯 PLAN DE MIGRACIÓN - APPROACH SENIOR WEB DEVELOPER

## 📊 SITUACIÓN ACTUAL (Descubierta tras testing)

```
✅ Node.js v22.17.0 instalado
✅ NPM 10.9.2 instalado
✅ Dependencies backend instaladas
✅ Dependencies frontend instaladas
✅ json-server 0.17.4 instalado correctamente

❌ Puerto 3001 OCUPADO (probablemente un servicio anterior corriendo)
⚠️ Frontend configurado en puerto 3333 (no 3000 como en documentación)
```

---

## 🎓 LECCIONES DE SENIOR DEVELOPER

### **1. NUNCA Migrar Todo de Golpe**
❌ Copiar los 12 stores → Iniciar todo → Esperar que funcione → ERROR MASIVO

✅ **Testing Incremental**:
1. Probar backend aislado ← **AQUÍ ESTAMOS**
2. Verificar un endpoint
3. Migrar 1 store
4. Probar ese store
5. Repetir

### **2. SIEMPRE Verificar el Entorno Primero**
Por eso descubrimos:
- Puerto 3001 ocupado (hubiera causado confusión más tarde)
- Puerto frontend es 3333, no 3000
- json-server necesitaba downgrade

### **3. Documentación != Realidad**
- Docs dicen puerto 3000
- Realidad: vite.config.js dice 3333
- **Un senior verifica antes de confiar**

---

## 🔧 PLAN DE ACCIÓN PROFESIONAL

### **FASE 1: Limpiar Entorno (5 min)** ← AHORA

#### 1.1 Matar Procesos en Puertos
```bash
# Verificar qué usa el puerto 3001
netstat -ano | findstr :3001

# Matar proceso (reemplaza <PID> con el número que veas)
taskkill /PID <PID> /F

# Verificar puerto 3333 (frontend)
netstat -ano | findstr :3333
```

#### 1.2 Verificar Configuraciones
```bash
# Backend: puerto 3001 (correcto)
# Frontend: puerto 3333 (actualizar .env)
```

---

### **FASE 2: Backend Primero (10 min)**

#### 2.1 Iniciar Backend Limpio
```bash
cd backend-simulado
npm start
```

**Esperar ver:**
```
🚀 JSON Server está corriendo!
📡 API disponible en: http://localhost:3001/api
```

#### 2.2 Probar Endpoints Críticos
```bash
# Test 1: Listar clientes
curl http://localhost:3001/api/clients | head -100

# Test 2: Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"

# Test 3: Dashboard stats
curl http://localhost:3001/api/stats/dashboard

# Test 4: Collection chart
curl http://localhost:3001/api/stats/collection-chart?months=6
```

**Si TODOS responden con JSON → Backend ✅**

---

### **FASE 3: Migración Incremental (20 min)**

#### 3.1 Migrar 1 Store de Prueba (authStore)

```bash
cd frontend/src/stores
copy authStore.refactored.js authStore.js
```

#### 3.2 Iniciar Frontend
```bash
cd frontend
npm run dev
```

**Abrir:** http://localhost:3333

#### 3.3 Probar Solo Login
- Intentar login con admin/admin123
- Ver consola del navegador (F12)
- Verificar Network tab

**Si funciona → authStore ✅**

#### 3.4 Migrar Siguiente Store (clientStore)
```bash
copy clientStore.refactored.js clientStore.js
```

**Refrescar frontend, probar:**
- Ver lista de clientes
- Crear un cliente
- Editar un cliente

**Si funciona → clientStore ✅**

#### 3.5 Repetir con Cada Store
Migrar en este orden (del más simple al más complejo):

1. ✅ authStore (ya migrado)
2. ✅ clientStore (ya migrado)
3. ⏳ serviceStore (simple)
4. ⏳ paymentMethodStore (simple)
5. ⏳ settingsStore (simple)
6. ⏳ paymentStore (medio)
7. ⏳ notificationStore (medio)
8. ⏳ monthlyDebtStore (medio)
9. ⏳ voucherStore (medio)
10. ⏳ clientExtendedStore (complejo)
11. ⏳ cashBoxStore (complejo)
12. ⏳ dashboardStore (complejo)

**Después de cada uno:**
- Refrescar navegador
- Probar funcionalidad
- Verificar consola sin errores
- Si falla, revertir y debuggear

---

### **FASE 4: Validación Final (10 min)**

#### 4.1 Smoke Tests
- ✅ Login funciona
- ✅ Ver clientes
- ✅ Crear cliente con validación DNI
- ✅ Ver pagos
- ✅ Cambiar estado de cliente
- ✅ Ver dashboard con gráficos

#### 4.2 Verificar Consola
- Sin errores rojos en DevTools
- Sin warnings críticos
- Network requests 200/201

---

## 🚨 TROUBLESHOOTING PROACTIVO

### Problema: Puerto 3001 Ocupado
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

### Problema: Frontend No Conecta
```bash
# Verificar .env
type frontend\.env
# Debe tener: VITE_API_URL=http://localhost:3001/api

# Si no existe
echo VITE_API_URL=http://localhost:3001/api > frontend\.env
```

### Problema: Store No Funciona
1. Verificar que se copió correctamente
2. Ver consola del navegador para el error exacto
3. Verificar Network tab para ver request/response
4. Revisar que el endpoint backend responda

### Problema: CORS Error
```bash
# Verificar que el backend tiene CORS habilitado
# (Ya está configurado en server.js con json-server.defaults())
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

### Antes de Empezar
- [ ] Puerto 3001 libre
- [ ] Puerto 3333 libre (o el configurado en vite.config.js)
- [ ] `.env` existe con `VITE_API_URL=http://localhost:3001/api`
- [ ] Backend `node_modules` instalado
- [ ] Frontend `node_modules` instalado

### Backend Funcionando
- [ ] `npm start` sin errores
- [ ] Ver mensaje "🚀 JSON Server está corriendo!"
- [ ] `/api/clients` responde JSON con 200 clientes
- [ ] `/api/auth/login` responde con token
- [ ] `/api/stats/dashboard` responde con métricas

### Frontend Conectado
- [ ] `npm run dev` sin errores
- [ ] Abre en http://localhost:3333
- [ ] Login funciona
- [ ] Redirige a dashboard
- [ ] Sin errores en consola

### Cada Store Migrado
- [ ] Archivo copiado: `.refactored.js` → `.js`
- [ ] Frontend reiniciado
- [ ] Funcionalidad probada
- [ ] Sin errores en consola
- [ ] Network requests exitosas

---

## 💡 TIPS PROFESIONALES

### 1. Git Commits Frecuentes
```bash
# Después de cada store que funcione
git add frontend/src/stores/clientStore.js
git commit -m "feat: migrate clientStore to API"
```

### 2. Backup Antes de Migrar
```bash
cd frontend/src/stores
mkdir backup-$(date +%Y%m%d)
copy *.js backup-$(date +%Y%m%d)\
```

### 3. Browser DevTools Siempre Abierto
- F12 → Console (ver errores)
- F12 → Network (ver requests)
- F12 → Application → LocalStorage (ver tokens)

### 4. Testing en Navegador Incógnito
- Evita cache
- Evita localStorage antiguo
- Testing limpio

### 5. Un Terminal por Servicio
- Terminal 1: Backend (npm start)
- Terminal 2: Frontend (npm run dev)
- Terminal 3: Comandos adicionales (curl, git, etc.)

---

## 🎯 SIGUIENTE PASO INMEDIATO

**AHORA MISMO, haz esto:**

### 1. Matar Proceso en Puerto 3001
```bash
netstat -ano | findstr :3001
```

Si ves algo como:
```
TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
```

Entonces:
```bash
taskkill /PID 12345 /F
```

### 2. Iniciar Backend
```bash
cd backend-simulado
npm start
```

### 3. Verificar que Funciona
Abre navegador: http://localhost:3001/api/clients

**Deberías ver JSON con 200 clientes.**

---

## 📊 PROGRESO ESPERADO

```
Día 1 (HOY):
├─ Limpiar entorno ✅
├─ Backend funcionando ✅
├─ 3 stores básicos (auth, client, service) ✅
└─ Login + ver clientes funcionando ✅

Día 2:
├─ Migrar stores medios (payments, notifications)
└─ Probar flujos completos

Día 3:
├─ Migrar stores complejos (cashBox, dashboard)
└─ Testing completo
```

---

## ✅ CUANDO TERMINES

**Señales de éxito:**
1. Backend corre sin errores
2. Frontend corre sin errores
3. Login funciona
4. Puedes ver y crear clientes
5. Los cambios persisten en db.json
6. Sin errores en consola del navegador

**Entonces:**
- ✅ Migración exitosa
- ✅ Sistema funcional
- ✅ Listo para desarrollo

---

## 🎓 CONCLUSIÓN

**Un senior web developer:**
1. ✅ Verifica el entorno ANTES de escribir código
2. ✅ Migra incrementalmente, NO todo de golpe
3. ✅ Prueba cada pieza de forma aislada
4. ✅ Tiene plan B para cada problema común
5. ✅ Documenta problemas encontrados
6. ✅ Hace commits frecuentes
7. ✅ NO confía en documentación sin verificar

**Tu próximo paso:** Matar el proceso en puerto 3001 e iniciar el backend limpio.

¿Necesitas ayuda con algún paso específico?

---

*Documento creado: 2025-10-09*
*Autor: Senior Web Developer Approach*
