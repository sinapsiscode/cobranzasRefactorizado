# Generar Datos de Prueba con Deudas

## El sistema ya tiene datos automáticos

Tu sistema **ya genera automáticamente** clientes con deudas cuando inicias la aplicación:

- **50 clientes** con múltiples deudas garantizadas
- **Diferentes tipos de pagos:** Pagados, Pendientes, Vencidos, Parciales
- **Varios meses de historial** de pagos y deudas

## Para exportar la Matriz Mensual a Excel:

1. **Inicia sesión como Administrador**
   - Usuario: `admin`
   - Contraseña: `admin123`

2. **Ve a la sección:** `Administrador → Deudas Mensuales`

3. **Cambia a vista "Matriz Mensual"** (botón en la parte superior)

4. **Haz clic en:** `Exportar a Excel` (botón verde con icono de descarga)

5. **Se descargará un archivo Excel** con formato:
   ```
   | Cliente       | N° de celular  | Enero   | Febrero | Marzo    | ... | Diciembre |
   |---------------|----------------|---------|---------|----------|-----|-----------|
   | Carlos García | +51987654321   | Pagado  | S/ 80.00| Pagado   | ... | S/ 80.00  |
   | María López   | +51912345678   | S/ 120.00| Pagado | S/ 120.00| ... | Pagado    |
   ```

## Si necesitas regenerar los datos (OPCIONAL):

### Opción 1: Reiniciar el navegador
1. Cierra y abre de nuevo tu navegador
2. El sistema regenerará los datos automáticamente

### Opción 2: Usar la consola del navegador
1. Presiona `F12` para abrir las Herramientas de Desarrollador
2. Ve a la pestaña `Console`
3. Ejecuta este código:

```javascript
// Importar y ejecutar el seeder
import { reseedDatabase } from './src/services/mock/seeder.js';
reseedDatabase();
console.log('✅ Datos regenerados exitosamente. Recarga la página (F5)');
```

4. Recarga la página con `F5`

### Opción 3: Limpiar localStorage (más simple)
1. Presiona `F12` → Pestaña `Console`
2. Ejecuta:
```javascript
localStorage.clear();
location.reload();
```
3. El sistema regenerará todos los datos automáticamente

## Verificar que tienes datos

En la sección **Deudas Mensuales**, deberías ver:
- Lista de clientes con deudas
- Meses marcados en rojo (vencidos) o amarillo (pendientes)
- Algunos meses en verde (pagados)

## Estructura de los datos generados

El sistema genera automáticamente:
- **200 clientes** en total
- **Los primeros 50 clientes** tienen deudas múltiples garantizadas:
  - 50% tienen deudas del mes actual
  - 45% tienen deudas del mes pasado
  - 40% tienen deudas de hace 2 meses
  - 35% tienen deudas de hace 3 meses
  - 20% tienen deudas más antiguas
- Algunos pagos parciales (8%)
- Algunos pagos cobrados pendientes de validación (15%)

## Ejemplo del Excel generado

El archivo Excel tendrá exactamente **14 columnas**:
1. Cliente
2. N° de celular
3-14. Los 12 meses del año (Enero a Diciembre)

**En cada mes verás:**
- `Pagado` → Si el cliente ya pagó ese mes
- `S/ XX.XX` → El monto que debe si no ha pagado
- `(vacío)` → Si no hay deuda registrada para ese mes
