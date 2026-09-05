# Documentación del Proyecto: Onboarding de Pago Wompi

Este documento detalla la arquitectura, el flujo del proceso comercial de onboarding de pago con Wompi, la configuración de contenedores Docker y la guía de verificación manual.

---

## 🏛️ Arquitectura General

El proyecto sigue **Arquitectura Hexagonal (Puertos y Adaptadores)** y **Principios SOLID** tanto en el Backend (`server/`) como en el Frontend (`app/`).

### 1. Backend (`server/`)
- **Dominio (`src/domain`)**:
  - Entidades: `Product`, `User`, `Order`.
  - Puertos: `IProductRepository`, `IUserRepository`, `IOrderRepository`, `IPaymentGateway`.
- **Aplicación (`src/application`)**: Casos de uso desacoplados (`GetProducts`, `GetProductById`, `CreateOrder`, `ConfirmPayment`, `GetTransaction`, `GetPaymentConfig`).
- **Infraestructura (`src/infrastructure`)**:
  - `database`: PostgreSQL 16 con **TypeORM v0.3.20** y pool de conexiones.
  - `cache`: Redis 7 con `ioredis` para caché de productos y resiliencia.
  - `payment`: Adaptador Wompi sandbox (`WompiAdapter`) que se comunica directamente con la API de Wompi v1 para tokenización e integridad de firma SHA-256.
- **Interfaces (`src/interfaces`)**:
  - HTTP REST endpoints construidos con Express.js + Zod validation + middleware de errores centralizado.

### 2. Frontend (`app/`)
- **Dominio y Puertos (`src/domain`)**: Definición de interfaces de entidades (`Product`, `Cart`, `Order`) y repositorios (`IProductRepository`, `IPaymentRepository`).
- **Infraestructura (`src/infrastructure`)**: Cliente HTTP Axios (`HttpProductRepository`, `HttpPaymentRepository`).
- **Presentación y Estado (`src/presentation`)**:
  - **Redux Toolkit (Patrón Flux)**: `productSlice`, `checkoutSlice`, `transactionSlice`.
  - Componentes UI: `Header`, `ProductCard`, `ProductGrid`, `CheckoutModal` (Modal multi-paso con tarjetas de prueba sandbox).
  - Páginas: `HomePage` (Catálogo de productos) y `PaymentResultPage` (Componente de verificación de transacción y retorno de ID de usuario).

---

## 🔄 Flujo del Proceso Comercial Wompi

1. **Selección del Producto**: El cliente explora la tienda, donde ve la descripción, precio en COP y el stock disponible.
2. **Formulario de Entrega**: Al presionar "Pagar", se abre el modal donde ingresa sus datos personales y dirección de despacho (nombre destinatario, teléfono, dirección, ciudad, departamento, código postal).
3. **Formulario de Pago & Tokenización**: Se capturan los datos de la tarjeta (Número, CVC, MM/YY, Titular, Cuotas).
4. **Procesamiento de Orden & Reserva**:
   - Se crea/recupera el usuario comprador.
   - Se tokeniza la tarjeta de forma segura con Wompi (`POST /v1/tokens/cards`).
   - Se genera la orden en estado `PENDING` en PostgreSQL.
   - Se efectúa la transacción en Wompi sandbox (`POST /v1/transactions`) firmada con SHA-256 (`PAYMENT_INTEGRITY_KEY`).
5. **Resultado y Retorno de ID de Usuario**:
   - La respuesta o redirección dirige al componente `PaymentResultPage` (`/payment-result?transactionId=...&userId=...`).
   - Se consulta el backend (`GET /api/payment/transaction/:wompiTxId`) para verificar la transacción en Wompi y base de datos.
   - Si la transacción fue aprobada, se descuenta la unidad del inventario y se retorna el **ID del Usuario** comprador para consulta inmediata.

---

## 🔌 Documentación de Rutas / Endpoints HTTP Backend

### Productos
- `GET /api/products`: Lista todos los productos disponibles con stock.
- `GET /api/products/:id`: Obtiene el detalle de un producto específico.

### Pagos y Órdenes
- `GET /api/payment/config`: Retorna la llave pública de Wompi sandbox.
- `POST /api/payment/create-order`: Recibe los datos de producto, tarjeta y envío; procesa el pago y crea la orden.
- `POST /api/payment/confirm`: Confirma y actualiza el estado de una transacción Wompi y actualiza el stock si aplica.
- `GET /api/payment/transaction/:wompiTxId`: Retorna los detalles de la orden y la transacción dado el ID de transacción Wompi y el **ID de usuario**.

---

## 🐳 Despliegue con Docker y `.env_file`

Cada subcarpeta tiene su propio archivo `.env` independiente:
- `server/.env`: Variables del backend (credenciales DB, Redis, llaves Wompi).
- `app/.env`: Variables del frontend (`VITE_API_URL`, `VITE_PAYMENT_PUBLIC_KEY`).

### Comandos de Ejecución con `docker-compose.yml`:

```bash
# Levantar todos los servicios (Postgres, Redis, Server backend, App frontend)
docker-compose up --build -d

# Ver logs de los servicios
docker-compose logs -f

# Detener contenedores
docker-compose down
```

Las aplicaciones quedarán expuestas en:
- **Frontend App**: `http://localhost:5000`
- **Backend API**: `http://localhost:8080`

Dado caso este en local la apirest de Wompi se deja: `https://sandbox.wompi.co/api`.




---

## 📋 Lista de Verificación Manual (Checklist)

- [x] Carga de productos desde el backend con estado de stock.
- [x] Modal de Checkout multi-paso (Datos de Envío -> Tarjeta Wompi -> Procesamiento -> Resultado).
- [x] Presets de prueba de tarjeta Wompi (Aprobada `4242...` y Rechazada `4000...`).
- [x] Validación de campos del formulario con Zod / React state.
- [x] Redirección / Vista de resultado en `/payment-result` mostrando el **ID del Usuario** comprador.
- [x] Actualización automática de stock en base de datos al aprobar la transacción.
- [x] Archivos `Dockerfile` independientes y unificados en `docker-compose.yml`.
