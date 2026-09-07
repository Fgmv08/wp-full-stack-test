.# 🧪 Documentación de Pruebas Automatizadas en el Backend

Este documento detalla la suite completa de pruebas unitarias y de integración implementadas con **Jest** y **Supertest** para el servidor backend, cubriendo la arquitectura hexagonal, casos de uso de la capa de aplicación, adaptadores de infraestructura y rutas HTTP con middlewares.

---

## 📊 Resumen de Cobertura

- **Total de Suites de Prueba:** 13 suites
- **Total de Pruebas Ejecutadas:** 69 pruebas
- **Tasa de Éxito:** 100% aprobadas (`69 passed, 69 total`)
- **Cobertura Global:**
  - Sentencias (% Stmts): **94.54%**
  - Ramas (% Branch): **85.00%**
  - Funciones (% Funcs): **94.54%**
  - Líneas (% Lines): **94.92%**
- **Cobertura de Infraestructura Clave:**
  - `RedisClient.ts`: **100% Stmts / 100% Branch / 100% Funcs / 100% Lines**
  - `WompiAdapter.ts`: **100% Stmts / 100% Branch / 100% Funcs / 100% Lines**
- **Limpieza de Recursos:** Configurado `setupFilesAfterEnv` y teardown controlado (`closeRedisClient()`), eliminando advertencias de handles o sockets abiertos.

---

## 🏗️ Estructura de Pruebas

```text
server/
├── jest.config.js                                    # Configuración Jest con mapeo de alias @domain, @application, etc.
└── tests/
    ├── setup.ts                                      # Variables de entorno seguras para testing
    ├── unit/
    │   ├── application/                              # Pruebas Unitarias de Casos de Uso
    │   │   ├── GetProducts.spec.ts                   # Casos con DB, caché Redis y fallos
    │   │   ├── GetProductById.spec.ts                # Casos 200, 404 not found, errores de persistencia
    │   │   ├── GetCart.spec.ts                       # Casos con orden, sin orden y usuario no encontrado
    │   │   ├── GenerateDataPayment.spec.ts           # Casos de cálculo SHA-256, sin stock, 404
    │   │   ├── CreateOrder.spec.ts                   # Tokenización, estados Wompi y control de stock
    │   │   └── ConfirmPayment.spec.ts                # Idempotencia, Wompi APPROVED/DECLINED, stock
    │   └── infrastructure/                           # Pruebas de Adaptadores
    │       └── WompiAdapter.spec.ts                  # Integración HTTP con API de Wompi y firmas
    └── integration/                                  # Pruebas de Integración HTTP (Supertest)
        ├── products.routes.spec.ts                   # GET /api/products, GET /api/products/:id
        ├── orders.routes.spec.ts                     # GET /api/orders, GET /api/orders/:id
        ├── cart.routes.spec.ts                       # GET /api/cart
        ├── payment.routes.spec.ts                    # /config, /datapayment, /confirm, /transaction/:id
        └── errorHandler.spec.ts                      # AppError, Zod validation errors, 500 internals
```

---

## 🔬 Detalle de Suites y Casos de Prueba

### 1. Casos de Uso (`tests/unit/application/`)

#### `GetProducts.spec.ts`
- **Caso 1:** Retorna productos desde la base de datos y los almacena en caché Redis con TTL de 120s cuando la caché está vacía.
- **Caso 2:** Retorna productos directamente desde la caché de Redis sin consultar la base de datos (optimización y rendimiento).
- **Caso 3:** Retorna un arreglo vacío si no existen productos registrados en la base de datos.
- **Caso 4:** Propaga adecuadamente el error si el repositorio falla al consultar la base de datos.

#### `GetProductById.spec.ts`
- **Caso 1:** Retorna el producto correspondiente cuando se provee un ID existente.
- **Caso 2:** Lanza `AppError` con código HTTP 404 (`Product not found`) si el ID no existe.
- **Caso 3:** Propaga excepciones inesperadas arrojadas por la capa de persistencia.

#### `GetCart.spec.ts`
- **Caso 1:** Retorna el usuario y su orden asociada exitosamente cuando existen registros.
- **Caso 2:** Retorna la propiedad `order` como `null` si el usuario no tiene compras registradas aún.
- **Caso 3:** Lanza `AppError` con código HTTP 404 (`User not found`) si el usuario no existe en la base de datos.

#### `GenerateDataPayment.spec.ts`
- **Caso 1:** Genera exitosamente los datos de pago, calcula la firma de integridad **SHA-256** exacta (`<referencia><monto><moneda><secreto>`) y enmascara la información de la tarjeta (últimos 4 dígitos y marca).
- **Caso 2:** Lanza `AppError` 404 si el usuario no existe.
- **Caso 3:** Lanza `AppError` 404 si el producto no existe.
- **Caso 4:** Lanza `AppError` 409 (`conflict`) si el producto no tiene stock disponible.

#### `CreateOrder.spec.ts`
- **Caso 1:** Flujo completo exitoso: tokeniza la tarjeta vía Wompi, crea la orden en estado PENDING, procesa la transacción APPROVED, descuenta stock atómicamente e invalida la caché de Redis.
- **Caso 2:** Mantiene la orden en estado PENDING y **no** descuenta stock si la pasarela responde con estado PENDING.
- **Caso 3:** Lanza `AppError` 409 si el producto no tiene stock disponible antes de intentar el cobro.

#### `ConfirmPayment.spec.ts`
- **Caso 1:** Actualiza la orden a `APPROVED`, descuenta stock de cada producto en la orden e invalida la caché de Redis cuando Wompi aprueba el pago.
- **Caso 2:** Actualiza la orden a `DECLINED` sin alterar el stock cuando la pasarela rechaza la transacción.
- **Caso 3 (Idempotencia):** Retorna la orden sin cambios si su estado ya no es PENDING (evita doble descuento de stock).
- **Caso 4:** Lanza `AppError` 404 si la orden no se localiza por transaction ID ni por referencia.

---

### 2. Infraestructura (`tests/unit/infrastructure/`)

#### `WompiAdapter.spec.ts`
- **Caso 1 (`getConfig`):** Retorna los valores públicos de configuración requeridos por el frontend (`publicKey`, `currency`, tarifas comerciales).
- **Caso 2 (`generateIntegritySignature`):** Calcula la firma SHA-256 en formato hexadecimal de 64 caracteres.
- **Caso 3 (`tokenizeCard`):** Consume el endpoint `/tokens/cards` y devuelve el `card_token` cuando los datos son válidos.
- **Caso 4 (`tokenizeCard`):** Captura respuestas de error de Wompi y lanza `AppError` con código 400 descriptivo.
- **Caso 5 (`getTransaction`):** Mapea los campos de Wompi (`id`, `status`, `reference`, `amount_in_cents`, `created_at`) a la entidad del dominio.
- **Caso 6 (`getTransaction`):** Lanza `AppError` 404 si la transacción no existe en Wompi.

---

### 3. Integración HTTP con Supertest (`tests/integration/`)

#### `products.routes.spec.ts`
- **Caso 1:** `GET /api/products` responde 200 con payload `{ success: true, data: [...] }`.
- **Caso 2:** `GET /api/products` responde 200 con array vacío cuando no hay catálogo disponible.
- **Caso 3:** `GET /api/products` responde 500 estructurado ante fallos imprevistos de base de datos.
- **Caso 4:** `GET /api/products/:id` responde 200 con los detalles del producto cuando el ID existe.
- **Caso 5:** `GET /api/products/:id` responde 404 estructurado cuando el producto no existe.

#### `orders.routes.spec.ts`
- **Caso 1:** `GET /api/orders` responde 200 con el listado de órdenes registradas.
- **Caso 2:** `GET /api/orders` responde 200 con array vacío si no hay órdenes en el sistema.
- **Caso 3:** `GET /api/orders/:id` responde 200 con la orden cuando el ID coincide.
- **Caso 4:** `GET /api/orders/:id` responde 404 cuando la orden no existe.

#### `cart.routes.spec.ts`
- **Caso 1:** `GET /api/cart` responde 200 con la información del usuario y su orden asociada.
- **Caso 2:** `GET /api/cart` responde 200 con `order: null` si el usuario no tiene compras previas.
- **Caso 3:** `GET /api/cart` responde 404 si el usuario no existe.

#### `payment.routes.spec.ts`
- **Caso 1:** `GET /api/payment/config` responde 200 con la clave pública de Wompi y moneda COP.
- **Caso 2:** `POST /api/payment/datapayment` responde 200 con la firma criptográfica y el ID de la orden creada.
- **Caso 3:** `POST /api/payment/datapayment` responde 400 con validación Zod si los datos de tarjeta o entrega son inválidos.
- **Caso 4:** `POST /api/payment/confirm` responde 200 y confirma la orden con el `wompiTransactionId`.
- **Caso 5:** `POST /api/payment/confirm` responde 400 si el body carece de `wompiTransactionId`.
- **Caso 6:** `GET /api/payment/transaction/:wompiTxId` responde 200 con la orden y estado de Wompi.
- **Caso 7:** `GET /api/payment/transaction/:wompiTxId` responde 404 si el ID no corresponde a ninguna orden.

#### `errorHandler.spec.ts`
- **Caso 1:** Normaliza excepciones `AppError.notFound` devolviendo status 404 y formato `{ success: false, error: { message, statusCode } }`.
- **Caso 2:** Normaliza excepciones `AppError.badRequest` devolviendo status 400.
- **Caso 3:** Captura errores `ZodError` devolviendo status 400 y el desglose de campos erróneos en `error.details`.
- **Caso 4:** Captura excepciones imprevistas no controladas devolviendo 500 y ocultando detalles internos del servidor por seguridad.

---

## 🚀 Comandos para Ejecutar las Pruebas

Desde el directorio `server/`:

```bash
# Ejecutar toda la suite de pruebas
npm test

# Ejecutar pruebas en modo observador (watch mode)
npm run test:watch

# Generar reporte de cobertura de código (coverage)
npm run test:coverage
```
