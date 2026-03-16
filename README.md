# VENDE ORDEN PPP

WAP para gestionar prospectos y ventas de tus WAPs (ORDEN PPP, CAPITA, PÓLIZA, PROPIEDAD, etc.)

## Stack
- Frontend: React + Vite → Vercel
- Backend: Google Apps Script
- Base de datos: Google Sheets
- CORS: Proxy Vercel (api/proxy.js)

## Pasos para desplegar

### 1. Google Sheets
Crea un nuevo Google Sheet con estas pestañas vacías:
- `Prospectos`
- `Ventas`
- `VentaDetalle`
- `WAPs`
- `Acciones`
- `Metas`

### 2. Google Apps Script
1. En el Sheet: Extensiones → Apps Script
2. Borra el código por defecto
3. Pega el contenido de `codigo.gs`
4. Implementar → Nueva implementación → Aplicación web
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Copia la URL de la implementación

### 3. GitHub + Vercel
1. Crea un repo nuevo en GitHub y sube todos los archivos
2. Importa el repo en Vercel
3. En Vercel → Settings → Environment Variables:
   - `GAS_URL` = URL de tu Apps Script
4. Redeploy

### 4. Catálogo WAPs
Al abrir la app por primera vez, la pestaña WAPs se autocompletará con:
- ORDEN PPP, CAPITA, PÓLIZA, PROPIEDAD, PROSPERA

Para agregar más WAPs o cambiar precios, edita directamente la pestaña `WAPs` del Sheet.

## Pantallas
- **Dashboard** — MRR activo, pipeline, meta del mes con barras de progreso
- **Ventas** — lista filtrable por estado + historial, total setup y mensualidad
- **Nueva Venta** — selección de prospecto + WAPs cotizados + seguimiento
- **Prospectos** — directorio de prospectos (no pistas)
- **Pistas** — prospectos en etapa temprana (PISTA=SI en Sheet)
- **WAPs** — catálogo de productos con precios
