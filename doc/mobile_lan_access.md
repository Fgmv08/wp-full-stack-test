# Configuración para Acceso en Red Local (Móvil / LAN)

## Problema detectado
Al acceder a la aplicación desde un dispositivo móvil conectado a la misma red Wi-Fi (`http://<IP_LOCAL>:5000`):
1. **Frontend (`apiClient.ts`)**: La variable `VITE_API_URL` apuntaba por defecto a `http://localhost:8080/api`. Cuando el navegador del móvil intentaba hacer peticiones HTTP a `localhost`, intentaba conectarse a sí mismo (al teléfono) y no a la PC donde corre el servidor de Docker.
2. **Backend (`app.ts`)**: Las políticas de CORS estaban restringidas únicamente al origen `http://localhost:5000`, bloqueando solicitudes que vinieran desde orígenes de red local (`http://192.168.x.x:5000`).

---

## Solución Implementada

### 1. Detección Dinámica de Host en el Frontend ([`apiClient.ts`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/app/src/infrastructure/api/apiClient.ts))
Se implementó una resolución dinámica de la URL base en el cliente API:
- Si el navegador está en un dispositivo externo (`window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'`), las peticiones a la API se redirigen automáticamente a:
  ```
  http://${window.location.hostname}:8080/api
  ```
- Mantiene compatibilidad con `localhost` y variables de entorno (`VITE_API_URL`).

### 2. Permisividad de CORS en Desarrollo ([`app.ts`](file:///c:/Users/giova/Documents/test-full-stack-jr-wp/server/src/interfaces/http/app.ts))
En el backend, se ajustó el middleware de CORS:
```typescript
app.use(
  cors({
    origin: env.NODE_ENV === 'development' ? true : env.CORS_ORIGIN,
    credentials: true,
  })
);
```
Esto permite que cualquier origen dentro de la red local pueda consultar los endpoints en modo desarrollo.

---

## Instrucciones de Uso

1. **Obtener la IP local de tu PC:**
   En PowerShell ejecuta `ipconfig` y busca la **Dirección IPv4** del adaptador Wi-Fi (ej. `192.168.78.175`).

2. **Abrir en el Navegador del Móvil:**
   Conecta el teléfono a la misma red Wi-Fi y abre:
   ```
   http://192.168.78.175:5000
   ```

3. **Firewall de Windows (en caso de bloqueo):**
   Si la página no carga en el móvil, asegurarse de que el Firewall de Windows permita el tráfico entrante en los puertos **5000** y **8080** para redes Privadas.
