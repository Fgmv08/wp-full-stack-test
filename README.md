# 🛍️ E-Commerce Payment Gateway (Full Stack - Wompi Integration)

> Aplicación web Full Stack para comercio electrónico con integración de pasarela de pagos Wompi (Sandbox), diseñada bajo los principios de **Clean Architecture / Arquitectura Hexagonal**, **SOLID**, **Domain-Driven Design (DDD)** y desplegable con **Docker y Docker Compose**.

---

## 📑 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Arquitectura y Principios de Diseño](#-arquitectura-y-principios-de-diseño)
   - [Backend (Arquitectura Hexagonal / Puertos y Adaptadores)](#backend-arquitectura-hexagonal--puertos-y-adaptadores)
   - [Frontend (Arquitectura por Capas & UI/UX)](#frontend-arquitectura-por-capas--uiux)
   - [Cumplimiento de Principios SOLID](#cumplimiento-de-principios-solid)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Infraestructura y Servicios](#-infraestructura-y-servicios)
6. [Variables de Entorno](#-variables-de-entorno)
7. [Guía de Instalación y Ejecución](#-guía-de-instalación-y-ejecución)
   - [Opción A: Ejecución con Docker Compose (Recomendada)](#opción-a-ejecución-con-docker-compose-recomendada)
   - [Opción B: Ejecución Local en Entorno Host (Node.js)](#opción-b-ejecución-local-en-entorno-host-nodejs)
8. [Flujo de Pago y Seguridad (Wompi)](#-flujo-de-pago-y-seguridad-wompi)
9. [Endpoints de la API](#-endpoints-de-la-api)
10. [Base de Datos y Auto-Seeding](#-base-de-datos-y-auto-seeding)
11. [Buenas Prácticas Aplicadas](#-buenas-prácticas-aplicadas)

---

## 📌 Descripción General

El proyecto consiste en una tienda virtual y sistema transaccional donde los usuarios pueden consultar catálogo de productos, gestionar compras y procesar pagos mediante tarjeta de crédito usando el ecosistema de la pasarela de pagos **Wompi Colombia**.

### Características Principales
- **Catálogo Interactivo**: Filtrado por categorías, búsqueda y diseño responsivo adaptativo (grid dinámico con fallback a 1 columna en móviles de $\le 520\text{px}$).
- **Checkout Seguro & Resiliente**: Modal con validaciones exhaustivas (Zod + React Hook Form), cálculo de cuotas e intereses, desglose de tarifas base + envío y **persistencia de estado ante refrescos accidentales** (`localStorage`).
- **Integración Wompi Sandbox**: Generación de tokens de tarjeta, firma de integridad criptográfica (SHA-256) y procesamiento de transacciones con actualización de stock atómica.
- **Historial de Transacciones**: Consulta de órdenes generadas y estado en tiempo real.

---

## 🏛️ Arquitectura y Principios de Diseño

### Backend (Arquitectura Hexagonal / Puertos y Adaptadores)

El servidor desacopla completamente el núcleo de negocio de los detalles técnicos y librerías de infraestructura:

```
server/src/
├── domain/            # 1. Capa de Dominio (Entidades, Value Objects, Reglas, Puertos)
├── application/       # 2. Capa de Aplicación (Casos de uso / Orquestación)
├── infrastructure/    # 3. Capa de Infraestructura (PostgreSQL, TypeORM, Redis, Adaptador Wompi)
├── interfaces/        # 4. Capa de Interfaces / HTTP (Controladores Express, Middlewares, Validadores)
└── shared/            # Kernel compartido (Configuración Zod, Result pattern, Tipos)
```

1. **Domain**: Contiene entidades puras (`Product`, `Order`, `User`), value objects (`Money`, `CardToken`) y puertos o interfaces (`IProductRepository`, `IPaymentGateway`, `IOrderRepository`). No depende de librerías externas ni de frameworks.
2. **Application**: Casos de uso (`ProcessPaymentUseCase`, `GetProductsUseCase`, `CreateOrderUseCase`) que implementan los flujos del sistema interactuando únicamente con los puertos del dominio.
3. **Infrastructure**: Implementaciones concretas de los puertos: repositorios TypeORM (`PostgresProductRepository`, `PostgresOrderRepository`), clientes HTTP (Axios para `WompiAdapter`), conexión Redis y esquemas de base de datos.
4. **Interfaces**: Rutas Express, inyección de dependencias manual (sin acoplamiento a contenedores mágicos) y serialización HTTP.

### Frontend (Arquitectura por Capas & UI/UX)

Estructurado en React 19 + TypeScript bajo principios de modularidad y responsabilidad única:

```
app/src/
├── domain/            # Modelos del cliente (Product, Order, Transaction)
├── infrastructure/    # Clientes HTTP (Axios / apiClient) y adaptadores de API
├── presentation/      # UI: Componentes atómicos, Vistas, Modales y Layouts
├── shared/            # Hooks utilitarios, Helpers y Formateadores
└── store/             # Estado global predecible con Redux Toolkit
```

### Cumplimiento de Principios SOLID

| Principio | Aplicación en el Proyecto |
|---|---|
| **S (Single Responsibility)** | Cada caso de uso, repositorio y componente UI atiende un único propósito. Por ejemplo, `WompiAdapter` solo interactúa con el API de Wompi; el control de stock y persistencia recae en sus respectivos casos de uso y repositorios. |
| **O (Open/Closed)** | El sistema de pagos está definido mediante el puerto `IPaymentGateway`. Si se requiere agregar otra pasarela (e.g. Stripe, MercadoPago), se crea un nuevo adaptador sin modificar la lógica de los casos de uso. |
| **L (Liskov Substitution)** | Cualquier implementación de los repositorios o gateways de pago respeta los contratos de interfaz del dominio y puede intercambiarse sin romper el flujo. |
| **I (Interface Segregation)** | Interfaces delgadas y específicas para cada actor (`IUserRepository`, `IProductRepository`, `IPaymentGateway`), evitando métodos que los consumidores no usen. |
| **D (Dependency Inversion)** | Los casos de uso de la capa de aplicación dependen de abstracciones (interfaces del dominio), nunca de clases concretas de infraestructura (`TypeORM` o `Axios`). |

---

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje & Runtime**: Node.js v20+ / TypeScript 5.7
- **Framework Web**: Express.js
- **ORM & DB Driver**: TypeORM 0.3 + PostgreSQL 16
- **Caché / Memoria**: Redis 7
- **Validación de Datos**: Zod + Express-Validator
- **Seguridad**: CORS configurable por entorno, Helmet-ready, firma de integridad SHA-256

### Frontend
- **Framework UI**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 6 (con proxy inverso `/api` integrado)
- **Gestor de Estado**: Redux Toolkit 2 + React-Redux
- **Estilos**: TailwindCSS v4 + Diseño fluido y micro-animaciones
- **Formularios & Validación**: React Hook Form + Resolvers Zod
- **Cliente HTTP**: Axios con interceptores

### DevOps & Entorno
- **Contenedores**: Docker (Multi-stage builds) & Docker Compose
- **Orquestación Local**: Red interna bridge (`shop_network`), volúmenes persistentes y healthchecks

---

## 📂 Estructura del Proyecto

```text
.
├── app/                           # Código fuente del Frontend (React + Vite)
│   ├── public/                    # Assets estáticos
│   ├── src/
│   │   ├── domain/                # Modelos del frontend
│   │   ├── infrastructure/        # Adaptadores y cliente API
│   │   ├── presentation/          # Componentes (ProductCard, CheckoutModal, etc.)
│   │   ├── store/                 # Slices de Redux (products, checkout, orders)
│   │   └── shared/                # Utilidades y constantes
│   ├── Dockerfile                 # Imagen Docker optimizada (development / production)
│   ├── vite.config.ts             # Configuración del bundler y proxy
│   └── package.json
│
├── server/                        # Código fuente del Backend (Node.js + Express)
│   ├── src/
│   │   ├── application/           # Casos de uso
│   │   ├── domain/                # Entidades y puertos (interfaces)
│   │   ├── infrastructure/        # Repositorios TypeORM, Adaptador Wompi, DB
│   │   ├── interfaces/            # Rutas y controladores HTTP
│   │   └── shared/                # Configuración, Zod schemas, constantes
│   ├── Dockerfile                 # Multi-stage Dockerfile
│   └── package.json
│
├── doc/                           # Documentación técnica adicional y diagramas
├── docker-compose.yml             # Orquestación de Postgres, Redis, Server y App
├── .env.example                   # Plantilla de variables de entorno para Docker Compose
└── README.md                      # Documentación principal del repositorio
```

---

## ⚙️ Infraestructura y Servicios

La infraestructura local está diseñada para levantarse con un solo comando gracias a Docker Compose:

```
+--------------------------------------------------------------------+
|                         shop_network (bridge)                      |
|                                                                    |
|  [postgres:16-alpine]  <---+                                       |
|  (Port: 5432)              |                                       |
|                            +--- [server: Node.js Express]          |
|  [redis:7-alpine]      <---+    (Port: 8080)                       |
|  (Port: 6378)                         ^                            |
|                                       | /api (reverse proxy)       |
|                                [app: Vite / React]                 |
|                                (Port: 5000)                        |
+--------------------------------------------------------------------+
```

- **Healthchecks automáticos**: El backend espera a que PostgreSQL (`pg_isready`) y Redis (`redis-cli ping`) estén en estado saludable antes de arrancar.
- **Caché persistente**: Los volúmenes Docker aíslan `node_modules` y la caché de `npm` para optimizar tiempos de compilación.

---

## 🔐 Variables de Entorno

El proyecto incluye archivos `.env.example` en la raíz y en cada servicio.

### 1. Variables Globales / Docker Compose (`.env` en la raíz)
```env
DB_PORT=5432
REDIS_PORT=6378
SERVER_PORT=8080
APP_PORT=5000
```

### 2. Variables del Backend (`server/.env`)
```env
NODE_ENV=development
PORT=8080

# Base de datos
POSTGRES_HOST=postgres       # Usar 'localhost' si corre fuera de Docker
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=shop_db

# Redis
REDIS_HOST=redis             # Usar 'localhost' si corre fuera de Docker
REDIS_PORT=6379

# Seguridad & CORS
CORS_ORIGIN=http://localhost:5000

# Wompi Sandbox Credentials
PAYMENT_PUBLIC_KEY=pub_stagtest_g2u0Hit74QbGaea9GFi054RhZtE2RUMV
PAYMENT_PRIVATE_KEY=prv_stagtest_5tJuupGbOunPvgQfL2l686tLnbR8X32y
PAYMENT_INTEGRITY_KEY=stagtest_integ_jhH9FmF6yB3x5V2n3a8D9f4G6h7J8k9L
PAYMENT_EVENTS_KEY=stagtest_events_7J8k9LjhH9FmF6yB3x5V2n3a8D9f4G6h
PAYMENT_API_URL=https://api-sandbox.co.wompi.co/v1

# Tarifas comerciales (en centavos de COP)
BASE_FEE_CENTS=500000        # $5,000 COP
SHIPPING_FEE_CENTS=800000    # $8,000 COP
CURRENCY=COP
```

### 3. Variables del Frontend (`app/.env`)
```env
APP_PORT=5000
# VITE_API_URL: Dejar vacío en desarrollo para utilizar el proxy inverso de Vite (/api).
# En producción, asignar la URL pública del backend.
```

---

## 🚀 Guía de Instalación y Ejecución

### Opción A: Ejecución con Docker Compose (Recomendada)

Garantiza paridad total de entornos y levanta los 4 servicios automáticamente:

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/test-full-stack-jr-wp.git
   cd test-full-stack-jr-wp
   ```

2. **Preparar variables de entorno**:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   cp app/.env.example app/.env
   ```

3. **Construir y levantar los contenedores**:
   ```bash
   docker compose up --build -d
   ```

4. **Verificar estado de los contenedores**:
   ```bash
   docker compose ps
   ```

5. **Acceder a las aplicaciones**:
   - **Frontend**: [http://localhost:5000](http://localhost:5000)
   - **Backend Health Check**: [http://localhost:8080/health](http://localhost:8080/health)

6. **Para detener los servicios**:
   ```bash
   docker compose down
   ```

---

### Opción B: Ejecución Local en Entorno Host (Node.js)

Requisitos previos: **Node.js 20+**, **PostgreSQL 16** y **Redis 7** en ejecución local.

1. **Configuración del Backend**:
   ```bash
   cd server
   npm install
   # Asegúrate de que server/.env tenga POSTGRES_HOST=localhost y REDIS_HOST=localhost
   npm run dev
   ```
   *El servidor compilará con TypeScript y ejecutará el auto-seeder automáticamente si la base de datos está vacía.*

2. **Configuración del Frontend**:
   ```bash
   cd ../app
   npm install
   npm run dev
   ```
   *La aplicación estará disponible en [http://localhost:5000](http://localhost:5000).*

---

## 💳 Flujo de Pago y Seguridad (Wompi)

El proceso de compra cumple con las directrices de seguridad y tokens de Wompi:

```
[Usuario] 
    │ Llena formulario de tarjeta
    ▼
[Frontend (Vite / React)]
    │ 1. Envía datos sensibles directo a Wompi
    ▼
[Wompi API: /tokens/cards] ──> Retorna card_token (tokenizado)
    │
    │ 2. POST /api/payment/process (card_token, cuotas, customer_data)
    ▼
[Backend (Express / Hexagonal)]
    │ 3. Valida stock y calcula total (producto + base fee + envío)
    │ 4. Genera firma criptográfica SHA-256 (referencia + monto + moneda + integrity_key)
    │ 5. POST a Wompi /transactions
    ▼
[Wompi Sandbox] ──> Procesa transacción (APPROVED / DECLINED / PENDING)
    │
    ▼
[Backend] 
    │ 6. Actualiza stock atómicamente y persiste orden
    ▼
[Frontend]
    │ Muestra pantalla de éxito / rechazo y limpia almacenamiento local
```

> **Garantía de Seguridad**: Los números completos de tarjeta de crédito (PAN) y CVV **nunca tocan el backend**, evitando el alcance PCI-DSS innecesario.

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Chequeo de salud del servicio |
| `GET` | `/api/products` | Obtiene el catálogo completo de productos con stock |
| `GET` | `/api/products/:id` | Detalle de un producto específico |
| `POST` | `/api/orders` | Creación de orden de compra |
| `GET` | `/api/orders/:id` | Consulta de orden y estado de transacción |
| `POST` | `/api/payment/process` | Procesa el pago con el token de tarjeta generado |
| `POST` | `/api/datapayment` | Endpoint de webhook / sincronización de pago |

---

## 🗄️ Base de Datos y Auto-Seeding

El sistema cuenta con inicialización inteligente:

1. **Auto-Sincronización**: Al arrancar el backend (`AppDataSource.initialize()`), se verifica la existencia de la tabla `users`. Si es un despliegue en limpio (local o en la nube como Render/Neon), sincroniza las tablas automáticamente.
2. **Auto-Seeding**: Si no se detectan productos en base de datos, el sistema inserta datos de prueba realistas (electrónica, accesorios, calzado) con imágenes, descripciones, stock y precios en pesos colombianos (COP).
3. **Comandos manuales** (disponibles en `server/package.json`):
   ```bash
   npm run migration:run       # Ejecutar migraciones pendientes
   npm run seed                # Poblar manualmente la base de datos
   ```

---

## ✨ Buenas Prácticas Aplicadas

- **TypeScript Strict Mode**: Tipado estricto en ambos lados (cliente y servidor) para prevenir errores en tiempo de compilación.
- **Fail Fast & Validaciones Zod**: Schemas Zod que validan variables de entorno al iniciar y payloads HTTP entrantes antes de alcanzar los casos de uso.
- **Persistencia y Resiliencia**: Si el cliente refresca el navegador mientras completa su pago, la información y el estado del modal persisten de forma segura mediante sincronización con `localStorage`.
- **Manejo Centralizado de Errores**: Middleware de error global en Express que normaliza respuestas en formato JSON consistente (`{ success: false, error: { message, statusCode } }`).
- **Principios DRY & Modularidad**: Funciones utilitarias, formateadores de moneda, ganchos personalizados de React y componentes atómicos reutilizables.
- **Responsividad Completa**: Adaptación de interfaz para desktop, tablets y dispositivos móviles con resoluciones reducidas ($\le 520\text{px}$).

---

<p align="center">Desarrollado con dedicación técnica, buenas prácticas y arquitectura de software escalable.</p>
