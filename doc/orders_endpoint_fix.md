# Corrección de Rutas de Órdenes y Datos de Pago (`/api/orders` y `/api/datapayment`)

## Contexto y Causa del Problema

Al intentar listar los pedidos desde el frontend (en el modal de pedidos `OrdersSummaryModal` y `orderSlice`), la petición fallaba arrojando un error `Route not found (404)`.

### Causa Raíz
1. **Desalineación de rutas entre frontend y backend**:
   - El cliente HTTP de frontend ([HttpPaymentRepository.ts](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/src/infrastructure/api/HttpPaymentRepository.ts)) realiza:
     - `apiClient.get('/orders')` -> apunta a `/api/orders`
     - `apiClient.post('/datapayment', input)` -> apunta a `/api/datapayment`
   - En el backend ([app.ts](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/server/src/interfaces/http/app.ts)), las rutas de pagos estaban montadas únicamente bajo `/api/payment`:
     - `router.get('/orders')` resultaba en `/api/payment/orders`
     - `router.post('/datapayment')` resultaba en `/api/payment/datapayment`
   - Al no existir el endpoint `/api/orders`, Express respondía con `404 Route not found`.

---

## Solución Aplicada (Principios SOLID)

1. **Principio de Responsabilidad Única (SRP)**:
   - Se creó un módulo de rutas dedicado a órdenes: [orders.routes.ts](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/server/src/interfaces/http/routes/orders.routes.ts), separando la consulta y obtención de órdenes de la pasarela de pagos.
   - Provee:
     - `GET /api/orders`: listado de pedidos recientes.
     - `GET /api/orders/:id`: detalle de un pedido específico por ID.

2. **Compatibilidad Total (Retrocompatibilidad y Robustez)**:
   - En [app.ts](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/server/src/interfaces/http/app.ts):
     - Se montó `app.use('/api/orders', createOrderRoutes(orderRepo))` para responder a `/api/orders`.
     - Se mantuvo el endpoint `/api/payment/orders` en `paymentRouter` para no romper llamadas legadas.
     - Se vinculó `POST /api/datapayment` directamente hacia el manejador de `datapayment` para que coincida exactamente con la especificación técnica.

---

## Archivos Modificados / Creados

1. **[server/src/interfaces/http/routes/orders.routes.ts](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/server/src/interfaces/http/routes/orders.routes.ts)**:
   - Nuevo controlador/router con `createOrderRoutes`.
2. **[server/src/interfaces/http/app.ts](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/server/src/interfaces/http/app.ts)**:
   - Registro de `/api/orders` y alias de `/api/datapayment`.

---

## Verificación Manual

### 1. Probar `GET /api/orders`
```bash
curl -i http://localhost:8080/api/orders
```
**Respuesta esperada**: `HTTP/1.1 200 OK` con `{ "success": true, "data": [...] }`.

### 2. Probar `GET /api/payment/orders`
```bash
curl -i http://localhost:8080/api/payment/orders
```
**Respuesta esperada**: `HTTP/1.1 200 OK` con `{ "success": true, "data": [...] }`.

### 3. Probar `POST /api/datapayment`
```bash
curl -i -X POST http://localhost:8080/api/datapayment -H "Content-Type: application/json" -d "{}"
```
**Respuesta esperada**: `HTTP/1.1 400 Bad Request` (validador de esquema Zod funcionando, no 404).
