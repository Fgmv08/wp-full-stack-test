# Resolución Error 403 Forbidden CloudFront Wompi

## Causa Raíz del Error 403
Al hacer clic en el botón de pago de Wompi, el navegador abría un iframe con la siguiente URL:
```
https://checkout.wompi.co/p/?mode=widget&public-key=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7...
```
Respondiendo:
```
403 ERROR: The request could not be satisfied. Request blocked. CloudFront.
```

**Motivo:**
- El dominio `checkout.wompi.co` corresponde al entorno de **Producción** de Wompi.
- Las credenciales que entregaron para la prueba técnica corresponden al entorno de **UAT / Staging** (`pub_stagtest_...`).
- El CloudFront de Producción bloquea las llaves que no pertenezcan al ambiente de producción, arrojando el error `403 Forbidden`.

---

## Solución Aplicada

1. **Dominio Oficial de Checkout UAT:**
   El script y el host de checkout correspondientes para las llaves `pub_stagtest_...` es:
   ```
   https://checkout.co.uat.wompi.dev/widget.js
   ```
   (Host del iframe: `https://checkout.co.uat.wompi.dev/p/`, el cual responde `200 OK` con las llaves de prueba).

2. **Detección Dinámica en [`WompiWidgetButton.tsx`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/src/presentation/components/WompiWidgetButton.tsx)**:
   ```typescript
   const widgetUrl = publicKey.includes('stagtest') || publicKey.includes('uat')
     ? 'https://checkout.co.uat.wompi.dev/widget.js'
     : 'https://checkout.wompi.co/widget.js';
   ```

3. **Actualización de [`index.html`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/index.html)**:
   Se actualizó el script global de carga al endpoint de UAT:
   ```html
   <script type="text/javascript" src="https://checkout.co.uat.wompi.dev/widget.js"></script>
   ```
