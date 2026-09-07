# Frontend Testing Suite (`app/test`)

Este documento detalla la arquitectura, cobertura y ejecución de las pruebas unitarias y de integración del frontend (`app/`), implementadas con **Vitest**, **React Testing Library** (`@testing-library/react`), `@testing-library/jest-dom` y `@testing-library/user-event`.

---

## 1. Stack Tecnológico de Pruebas

- **Test Runner:** [Vitest](https://vitest.dev/) (entorno nativo Vite de alta velocidad y compatibilidad con ESM/TypeScript).
- **DOM Environment:** `jsdom`.
- **UI Testing Utilities:** `@testing-library/react` y `@testing-library/user-event`.
- **Custom Matchers:** `@testing-library/jest-dom` (e.g. `toBeInTheDocument`, `toBeDisabled`).
- **Store & State Management:** `@reduxjs/toolkit` y `react-redux`.

---

## 2. Estructura del Directorio de Pruebas

```
app/test/
├── setup.ts                                # Configuración global y matchers jest-dom
├── components/                             # Pruebas de integración de componentes UI
│   ├── CheckoutModal.test.tsx              # Modal de compra multipaso (Tarjeta, Envío, Wompi)
│   ├── Header.test.tsx                     # Barra superior, badge de pedidos y apertura de modal
│   ├── OrdersSummaryModal.test.tsx         # Modal de historial de órdenes y estados
│   ├── ProductCard.test.tsx                # Tarjeta de producto, moneda COP y botón de compra
│   ├── ProductGrid.test.tsx                # Grilla de catálogo, filtros por categoría y búsqueda
│   └── SearchableSelect.test.tsx           # Dropdown con búsqueda para municipios y departamentos
├── redux/                                  # Pruebas de reducers, actions y async thunks
│   ├── checkoutSlice.test.ts               # Flujo de estado de checkout, sincronizaciones y persistencia
│   ├── orderSlice.test.ts                  # Apertura/cierre de modal y thunk fetchOrders
│   ├── productSlice.test.ts                # Filtrado de catálogo y thunk fetchProducts
│   └── transactionSlice.test.ts            # Confirmación de transacciones y estados de polling
└── utils/                                  # Pruebas de funciones puras y lógica de negocio frontend
    ├── cardUtils.test.ts                   # Detección de marca (Visa/Mastercard), algoritmo Luhn y formato
    └── checkoutPersistence.test.ts         # Guardado, carga y manejo de JSON corrupto en localStorage
```

---

## 3. Detalle de Suites y Casos de Prueba Implementados

### A. Capa de Lógica de Negocio y Utilidades (`test/utils/`)

#### 1. `cardUtils.test.ts` (14 pruebas)
- **Detección de Marca:**
  - Identificación de franquicia **VISA** (prefijo `4`).
  - Identificación de franquicia **MASTERCARD** (rango BIN `51-55` y `2221-2720`).
  - Clasificación de marcas no soportadas como `UNKNOWN`.
- **Algoritmo de Luhn (Validación Matemática de Tarjetas):**
  - Aceptación de tarjetas de crédito válidas (Visa de prueba `4242...`).
  - Rechazo de números inválidos por suma checksum incorrecta.
  - Rechazo de números con longitudes inválidas (< 13 dígitos).
- **Formateo de Tarjeta:**
  - Inserción de espacios en grupos de 4 dígitos (`4242 4242 4242 4242`).
  - Restricción de longitud máxima a 19 dígitos formateados.
- **Formateo y Validación de Expiración:**
  - Auto-inserción de barra `/` en formato `MM/YY` (`1226` -> `12/26`).
  - Restricción de meses fuera de rango (`00` o `> 12`).
  - Detección de tarjetas ya vencidas con respecto al año y mes actual.
  - Validación de años futuros.

#### 2. `checkoutPersistence.test.ts` (4 pruebas)
- Persistencia de datos del formulario en `localStorage` bajo clave tipada.
- Recuperación exitosa del estado serializado.
- Manejo resiliente y tolerancia a fallos cuando `localStorage` contiene JSON corrupto o truncado.
- Limpieza total del estado almacenado mediante `clearCheckoutState()`.

---

### B. Capa de Estado Global (`test/redux/`)

#### 3. `productSlice.test.ts` (8 pruebas)
- Estado inicial del catálogo vacío y sin errores.
- Actualización sincrónica de `searchQuery` y `selectedCategory`.
- Manejo del ciclo de vida de `fetchProducts`:
  - `pending`: conmuta `loading: true` y limpia `error`.
  - `fulfilled`: inyecta los productos y desactiva el loader.
  - `rejected`: captura el mensaje de fallo del backend.

#### 4. `orderSlice.test.ts` (5 pruebas)
- Conmutación sincrónica del modal de órdenes (`openOrdersModal` y `closeOrdersModal`).
- Manejo del thunk `fetchOrders`:
  - `pending`: activa indicador de carga.
  - `fulfilled`: puebla la lista de órdenes registradas.
  - `rejected`: almacena el mensaje de error.

#### 5. `checkoutSlice.test.ts` (8 pruebas)
- Apertura del modal con un producto seleccionado y cierre restaurando el estado por defecto.
- Navegación entre pasos (`CARD_DETAILS` ➔ `DELIVERY_INFO` ➔ `CONFIRMATION`).
- Actualizaciones parciales inmutables de los datos de envío (`updateDeliveryInfo`).
- Sincronización automática de `month` y `year` en `cardInfo` al cambiar `expiryInput`.
- Limpieza de datos sensibles de tarjeta al finalizar el flujo.

#### 6. `transactionSlice.test.ts` (5 pruebas)
- Estado inicial y reseteo de transacciones.
- Ciclo de vida del thunk `fetchTransaction`: estados `pending`, `fulfilled` (mapeo de datos de Wompi) y `rejected`.

---

### C. Capa de Componentes de Interfaz (`test/components/`)

#### 7. `SearchableSelect.test.tsx` (5 pruebas)
- Despliegue de opciones al enfocar o hacer clic en el input.
- Filtrado en tiempo real según el texto escrito por el usuario.
- Cierre del desplegable al presionar tecla `Escape` o hacer clic fuera del componente.
- Selección de opción y notificación mediante callback `onChange`.
- Resaltado visual y mensaje de validación cuando se pasa la prop `error`.

#### 8. `ProductCard.test.tsx` (3 pruebas)
- Renderizado de imagen, nombre, descripción y categoría.
- Formateo correcto de moneda en pesos colombianos (`COP`) mediante expresión regular.
- Manejo de stock: botón de compra deshabilitado cuando `stock === 0`.
- Despacho de la acción `openCheckout` con la entidad de producto al hacer clic en "Comprar Ahora".

#### 9. `ProductGrid.test.tsx` (4 pruebas)
- Renderizado simultáneo del buscador, chips de categorías únicas y tarjetas de productos.
- Filtrado reactivo de productos al hacer clic en un chip de categoría específica.
- Filtrado de productos en vivo por coincidencia de texto en el input de búsqueda.
- Despliegue de mensaje de error amigable y botón de reintento cuando falla la carga de la API.

#### 10. `Header.test.tsx` (2 pruebas)
- Renderizado del logo/título del comercio, avatar del usuario y contador en badge de pedidos.
- Apertura del modal de pedidos al hacer clic en el botón "Mis Pedidos".

#### 11. `CheckoutModal.test.tsx` (5 pruebas)
- Control de visibilidad: no renderiza ningún nodo DOM si `isOpen: false`.
- **Paso 1 (Datos de Tarjeta):** verificación de campos requeridos (número de tarjeta, nombre del titular, vencimiento y CVC).
- Cierre del modal mediante el botón de cabecera.
- Validación de datos de tarjeta y transición al paso 2 al presionar "Continuar".
- **Paso 2 (Datos de Envío):** renderizado de campos de entrega (departamento, municipio, dirección y teléfono).

#### 12. `OrdersSummaryModal.test.tsx` (4 pruebas)
- Control de visibilidad condicional.
- Estado vacío: mensaje descriptivo cuando no hay pedidos registrados.
- Listado de pedidos: visualización de referencia de orden, badge de estado (`APPROVED`), monto formateado en COP y tarjeta enmascarada (`VISA •••• 4242`).
- Despacho de la acción `closeOrdersModal` al presionar el botón "Cerrar".

---

## 4. Comandos de Ejecución

Dentro del directorio `app/`:

```bash
# Ejecutar toda la suite de pruebas frontend (modo run una sola vez)
npm test

# Ejecutar pruebas en modo interactivo (watch)
npm run test:watch

# Generar reporte de cobertura de código
npm run test:coverage
```

---

## 5. Resultados de la Suite

- **Archivos de Test:** 12 suites pasadas (12/12)
- **Casos de Test:** 67 tests pasados (67/67)
- **Tasa de Acierto:** 100%
- **Tiempo Promedio de Ejecución:** ~14.3 segundos en Windows jsdom/forks
