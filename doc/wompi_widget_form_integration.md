# Integración Oficial del Widget de Wompi mediante Formulario y Script

## Requerimiento
Integrar el widget de Wompi utilizando el formato oficial documentado por la pasarela:
```html
<form>
  <script
    src="https://checkout.wompi.co/widget.js"
    data-render="button"
    data-public-key="pub_test_..."
    data-currency="COP"
    data-amount-in-cents="7890000"
    data-reference="37DNKF84S92N1S"
    data-signature:integrity="..."
    data-redirect-url="..."
    data-customer-data:email="..."
    data-customer-data:full-name="..."
    data-customer-data:phone-number="..."
    data-customer-data:phone-number-prefix="+57"
    data-customer-data:legal-id="..."
    data-customer-data:legal-id-type="CC"
    data-shipping-address:address-line-1="..."
    data-shipping-address:country="CO"
    data-shipping-address:city="..."
    data-shipping-address:phone-number="..."
    data-shipping-address:region="..."
    data-shipping-address:name="..."
  ></script>
</form>
```

---

## Causa del error anterior
1. En React (JSX), los navegadores por estándar de seguridad **no ejecutan** etiquetas `<script>` inyectadas directamente mediante JSX o `innerHTML`.
2. Al intentar invocar el constructor `new window.WidgetCheckout({...})` de forma manual, la librería interna de Wompi fallaba en la serialización de parámetros anidados o por falta de inicialización previa del DOM de Wompi.

---

## Solución Implementada

### 1. Componente Dedicado [`WompiWidgetButton.tsx`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/src/presentation/components/WompiWidgetButton.tsx)
Se creó un componente con responsabilidad única (SOLID):
- Utiliza `useRef<HTMLDivElement>` y `useEffect`.
- Crea dinámicamente un nodo `<form>` y un nodo `<script>` mediante `document.createElement`.
- Asigna todos los atributos `data-*` requeridos por la documentación oficial de Wompi:
  - `data-render="button"`
  - `data-public-key`
  - `data-currency`
  - `data-amount-in-cents`
  - `data-reference`
  - `data-signature:integrity`
  - `data-redirect-url`
  - `data-customer-data:*`
  - `data-shipping-address:*`
- Al insertarse en el DOM, `widget.js` ejecuta automáticamente `_.renderPurchaseButton()` inyectando el botón oficial de Wompi con candado de seguridad.

### 2. Flujo Completo de 3 Pasos en [`CheckoutModal.tsx`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/src/presentation/components/CheckoutModal.tsx)
- **Paso 1: Tarjeta Débito**: Formulario sin cuotas (1 pago directo), validación de titular, número, expiración MM/YY y CVC.
- **Paso 2: Datos de Envío**: Nombre, teléfono, dirección, selector de departamento y ciudad.
- **Paso 3: Resumen y Pago Wompi**:
  - Desglose de costos (tarifa base, envío $8.000, tarifa administrativa $5.000, total).
  - Resumen de datos de entrega y datos de tarjeta débito.
  - Firma SHA-256 generada y referencia única.
  - El botón oficial de Wompi listo para presionar y abrir el iframe seguro de pago.
