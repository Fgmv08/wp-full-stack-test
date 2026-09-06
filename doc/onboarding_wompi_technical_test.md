# Documentación del Proyecto: Onboarding de Pago Wompi

Este documento detalla la arquitectura, el flujo del proceso comercial de onboarding de pago con Wompi, la configuración de contenedores Docker y la guía de verificación manual.

---

## 🏛️ Arquitectura General

El proyecto sigue **Arquitectura Hexagonal (Puertos y Adaptadores)** y **Principios SOLID** tanto en el Backend (`server/`) como en el Frontend (`app/`).

### 1. Backend (`server/`)
- **Dominio (`src/domain`)**:
  - Entidades: `Product`, `User`, `Order` (con `reference` y `cardInfo`).
  - Puertos: `IProductRepository`, `IUserRepository`, `IOrderRepository`, `IPaymentGateway`.
- **Aplicación (`src/application`)**: Casos de uso desacoplados (`GetProducts`, `GetProductById`, `GenerateDataPayment`, `GetOrders`, `ConfirmPayment`, `GetTransaction`, `GetPaymentConfig`).
- **Infraestructura (`src/infrastructure`)**:
  - `database`: PostgreSQL 16 con **TypeORM v0.3.20**, auto-migraciones y **AutoSeeder** (valida si la base de datos está vacía e inserta 15 productos con stock y usuario por defecto).
  - `cache`: Redis 7 con `ioredis` para caché y resiliencia.
  - `payment`: Adaptador Wompi sandbox (`WompiAdapter`) y generación de firma SHA-256 con secreto de integridad.
- **Interfaces (`src/interfaces`)**:
  - HTTP REST endpoints con Express.js + Zod validation + middleware de errores centralizado.

### 2. Frontend (`app/`)
- **Dominio y Puertos (`src/domain`)**: Definición de interfaces de entidades (`Product`, `Cart`, `Order`) y repositorios (`IProductRepository`, `IPaymentRepository`).
- **Infraestructura (`src/infrastructure`)**: Cliente HTTP Axios (`HttpProductRepository`, `HttpPaymentRepository`).
- **Presentación y Estado (`src/presentation`)**:
  - **Redux Toolkit (Patrón Flux)**: `productSlice`, `checkoutSlice`, `transactionSlice`, `orderSlice`.
  - **Diseño Responsivo con Flexbox**: Adaptable a resoluciones compactas (desde 1334px x 750px) y dispositivos móviles.
  - **Componente de Pedidos del Sistema**: Visualización en tiempo real de órdenes con badge superior y modal detallado (`OrdersSummaryModal`).
  - **Modal de Checkout Optimizado**:
    - **Paso 1 (Tarjeta de Crédito)**: Algoritmo de Luhn, detección automática de Visa y Mastercard con logotipos oficiales, campo único de vencimiento `MM/YY`, CVC y selector de cuotas.
    - **Paso 2 (Datos de Envío & Cliente)**: Datos del sistema precargados (`Carlos Mendoza`), dropdowns con búsqueda en tiempo real de Departamentos de Colombia y Ciudades filtradas por departamento.
    - **Paso 3 (Wompi WidgetCheckout)**: Invocación oficial del widget de Wompi mediante firma SHA-256 de integridad generada por el backend.

---

## 🔄 Flujo del Proceso Comercial Wompi

1. **Selección del Producto**: El cliente explora la tienda con 15 productos iniciales con stock y precios en COP.
2. **Formulario de Tarjeta**:
   - Detección visual instantánea de franquicia (Visa / Mastercard).
   - Validación del número de tarjeta mediante el algoritmo de Luhn (módulo 10).
   - Captura de fecha de vencimiento combinada (`MM/YY`), CVC y titular.
3. **Formulario de Entrega**:
   - Datos personales y de contacto precargados del usuario del sistema.
   - Dropdown interactivo tipeable para seleccionar Departamento de Colombia y Ciudad correspondiente.
4. **Generación de Datos de Pago & Firma (`/api/datapayment`)**:
   - El backend genera una referencia única de pago (`REF_...`).
   - Calcula la firma de integridad SHA-256:
     `sha256(<referencia><montoEnCentavos><moneda><secretoIntegridad>)`
   - Registra el pedido en estado `PENDING` en PostgreSQL con los datos del comprador y tarjeta enmascarada.
5. **Apertura de Wompi Widget**:
   - Se instancia `WidgetCheckout` con la firma y parámetros retornados.
   - El cliente concluye la transacción en la interfaz segura de Wompi.
6. **Confirmación y Actualización de Stock**:
   - Wompi redirecciona a `/payment-result?id=...&reference=...`.
   - El backend valida el estado de la transacción con Wompi (`/api/payment/confirm`).
   - Al aprobarse, se actualiza la orden a `APPROVED` y se descuenta automáticamente el inventario en la base de datos.

---

## 🔌 Documentación de Rutas / Endpoints HTTP Backend

### Productos
- `GET /api/products`: Lista todos los productos disponibles con stock.
- `GET /api/products/:id`: Obtiene el detalle de un producto específico.

### Pagos y Órdenes
- `POST /api/datapayment`: Genera la referencia de pago, calcula la firma SHA-256 de integridad de Wompi, registra la orden en `PENDING` y devuelve la configuración para el `WidgetCheckout`.
- `GET /api/orders`: Lista todos los pedidos registrados en el sistema para el componente de consulta superior.
- `GET /api/payment/config`: Retorna la llave pública de Wompi sandbox.
- `POST /api/payment/create-order`: Procesa pago directo con tokenización.
- `POST /api/payment/confirm`: Confirma el estado de una transacción Wompi y actualiza el stock si fue aprobada.
- `GET /api/payment/transaction/:wompiTxId`: Retorna el detalle de una transacción y su orden asociada.

---

## 🐳 Despliegue con Docker y `.env_file`

- `server/.env`: Configuración de base de datos, Redis y credenciales sandbox de Wompi.
- `app/.env`: Variables del cliente frontend (`VITE_API_URL`, `VITE_PAYMENT_PUBLIC_KEY`).

### Comandos de Ejecución con `docker-compose.yml`:

```bash
# Levantar todos los servicios
docker-compose up --build -d

# Ver logs de los servicios
docker-compose logs -f

# Detener contenedores
docker-compose down
```

### Puertos Expuestos:
- **Frontend App**: `http://localhost:5000`
- **Backend API**: `http://localhost:8080`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6378` (interno `6379`)
