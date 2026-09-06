# Integración Modo Sandbox y Modalidad Débito (Sin Cuotas)

## Requerimientos y Cambios Aplicados

### 1. Eliminación del Selector de Cuotas y Modalidad Débito por Defecto
- **Contexto**: El flujo de pago se realiza con **tarjeta débito**, por lo que los cobros se liquidan en **1 solo pago inmediato** contra la cuenta bancaria sin diferir a cuotas.
- **Cambios en [`CheckoutModal.tsx`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/src/presentation/components/CheckoutModal.tsx)**:
  - Se eliminó el campo desplegable `<select>` de cuotas.
  - La cuadrícula de fecha de expiración y CVC se reorganizó en 2 columnas responsivas limpias (`grid-cols-1 sm:grid-cols-2`).
  - Se añadieron avisos e indicadores visuales de **"Tarjeta Débito (1 pago automático sin cuotas diferidas)"**.
  - Se actualizaron los botones rápidos de prueba de Sandbox a **⚡ Visa Débito Aprobada** y **⚡ Rechazada**.
- **Cambios en Estado Redux ([`checkoutSlice.ts`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/src/presentation/redux/slices/checkoutSlice.ts))**:
  - `installments` se fija en `1` por defecto para todas las transacciones débito.

---

### 2. Configuración del Entorno Wompi Sandbox
Se verificó la correspondencia de las claves y endpoints proporcionados para el entorno UAT / Sandbox:

- **Widget JS**: `https://checkout.wompi.co/widget.js` (cargado en [`index.html`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/index.html))
- **URLs de la API Wompi**:
  - `UAT_URL`: `https://api.co.uat.wompi.dev/v1`
  - `UAT_SANDBOX_URL`: `https://api-sandbox.co.uat.wompi.dev/v1`
- **Claves Configuradas en [`server/.env`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/server/.env) y [`app/.env`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/.env)**:
  - `PAYMENT_PUBLIC_KEY` / `VITE_PAYMENT_PUBLIC_KEY`: `pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7`
  - `PAYMENT_PRIVATE_KEY`: `prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg`
  - `PAYMENT_EVENTS_KEY`: `stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N`
  - `PAYMENT_INTEGRITY_KEY`: `stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp`
  - `PAYMENT_API_URL`: `https://api-sandbox.co.uat.wompi.dev/v1`
