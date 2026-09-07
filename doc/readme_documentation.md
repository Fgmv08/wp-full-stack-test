# Documentación: Creación del README.md del Proyecto

## Resumen del Cambio
Se generó el archivo principal [`README.md`](../README.md) en la raíz del repositorio con los más altos estándares de documentación técnica y de presentación para proyectos profesionales Full Stack.

## Aspectos Clave Documentados
1. **Propósito del Proyecto y Alcance**:
   - Integración transaccional con la pasarela Wompi Sandbox.
   - Manejo de productos, órdenes, stock y flujo seguro con tarjeta de crédito.

2. **Arquitectura y SOLID**:
   - Detalle de la Arquitectura Hexagonal (Puertos y Adaptadores) en el Backend (`domain`, `application`, `infrastructure`, `interfaces`).
   - Arquitectura limpia en el Frontend (`domain`, `presentation`, `store`, `infrastructure`).
   - Matriz de cumplimiento de cada principio SOLID (S, O, L, I, D).

3. **Infraestructura y DevOps**:
   - Diagrama de red Docker Compose (`shop_network`, PostgreSQL 16, Redis 7, Express Server, Vite Dev Server).
   - Manejo de healthchecks para inicio ordenado (`depends_on: condition: service_healthy`).
   - Volúmenes para persistencia de datos y caché de `npm`.

4. **Variables de Entorno**:
   - Desglose y ejemplos comentados de variables para el orquestador raíz, el backend y el frontend.
   - Aclaración sobre el funcionamiento del proxy inverso de Vite en desarrollo frente a entornos de producción.

5. **Instalación y Ejecución**:
   - Guía paso a paso para Docker Compose (con `docker compose up --build -d`).
   - Guía paso a paso para ejecución en entorno local host con Node.js.

6. **Flujo de Pago y Seguridad**:
   - Diagrama de secuencia del flujo de tokenización de tarjeta en cliente y firma criptográfica SHA-256 en backend.
   - Seguridad y aislamiento PCI-DSS.

7. **Catálogo de Endpoints y Auto-Seeding**:
   - Tabla con métodos y rutas de la API REST.
   - Explicación del mecanismo de auto-sincronización y población de datos iniciales en PostgreSQL.
