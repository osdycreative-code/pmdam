# Arquitectura Híbrida de Bases de Datos - pman

Este documento define la estrategia para implementar una arquitectura de base de datos híbrida, combinando PostgreSQL Local y un servicio de base de datos en la nube (Supabase gestionado).

## 1. Definición de Roles

| Datos (Tabla)               | Entorno (Source of Truth) | Sincronización Sugerida       | Razón                                                 |
| :-------------------------- | :------------------------ | :---------------------------- | :---------------------------------------------------- |
| `proyectos_maestros` (DB 1) | **Nube**                  | Bidireccional (Lógica)        | Datos maestros accesibles globalmente.                |
| `tareas` (DB 2)             | **Local**                 | Unidireccional (Local → Nube) | Baja latencia requerida para operaciones diarias.     |
| `registro_finanzas` (DB 5)  | **Local**                 | Unidireccional (Local → Nube) | Alta frecuencia de escritura local. Respaldo en nube. |
| `inventario_activos` (DB 4) | **Nube**                  | Unidireccional (Nube → Local) | Gestión centralizada de activos (DAM).                |
| `ai_directory` (DB E)       | **Nube**                  | Unidireccional (Nube → Local) | Catálogo global de herramientas.                      |
| `tareas_ai_uso`             | **Local**                 | Unidireccional (Local → Nube) | Registros de uso interno.                             |
| `finance_categories`        | **Nube**                  | Unidireccional (Nube → Local) | Categorías financieras estandarizadas.                |
| `accounts_payable`          | **Nube**                  | Unidireccional (Nube → Local) | Cuentas por pagar centralizadas.                      |
| `accounts_receivable`       | **Nube**                  | Unidireccional (Nube → Local) | Cuentas por cobrar centralizadas.                     |

**Nota:** En esta implementación inicial, el "Entorno Local" para la aplicación será simulado mediante un **Servidor Node.js Intermedio** que actúa como Router. Si el usuario dispone de una instancia PostgreSQL local real, este servidor se conectará a ella. Si no, se conectará a la base de datos de desarrollo (o Supabase) simulando la separación lógica mediante endpoints diferenciados.

## 2. Router de API Híbrida

El backend implementará un patrón de enrutamiento inteligente para dirigir el tráfico:

- **Rutas Locales (`/api/local/*`)**:
  - Gestionan `TASKS` y `FINANCE`.
  - Conectan a `DATABASE_URL_LOCAL`.
- **Rutas Cloud (`/api/cloud/*`)**:
  - Gestionan `PROJECTS`, `INVENTORY`, `AI_TOOLS`, `FINANCE_CATEGORIES`, `ACCOUNTS_PAYABLE`, `ACCOUNTS_RECEIVABLE`.
  - Conectan a `DATABASE_URL_CLOUD` (Supabase).

### Estrategia de Fallos (Failover)

Si la conexión a `DATABASE_URL_LOCAL` falla, el sistema intentará conectar a `DATABASE_URL_CLOUD` en modo lectura/escritura de emergencia (si existe conectividad), o almacenará en cola las operaciones (si no hay red).

## 3. Plan de Implementación

1. **Backend (Node/Express)**:
    - Servidor en puerto 3001.
    - Dos pools de conexión PostgreSQL (`poolLocal`, `poolCloud`).
    - Endpoints segregados.
2. **Frontend (React/Vite)**:
    - Refactorizar `api.ts` para apuntar a `localhost:3001` en lugar de usar `supabase-js` directamente para todo.
    - (Opción Intermedia): Mantener `supabase-js` para Cloud y usar `fetch('localhost:3001/...')` para Local.

## 4. Restablecimiento de Base de Datos con Datos Reales

Se ha creado un script especializado para restablecer la base de datos con datos reales:

- **Archivo**: `reset_db_with_real_data.sql`
- **Script de ejecución**: `scripts/reset-database.sh`

Este script crea la estructura completa de la base de datos e inserta datos de ejemplo realistas para:
- Proyectos reales (Sitio Web Corporativo, Aplicación Móvil, etc.)
- Tareas con diferentes estados y prioridades
- Registros financieros con ingresos y gastos
- Inventario de activos digitales
- Herramientas de IA disponibles
- Cuentas por pagar y por cobrar

## 5. Configuración de Variables de Entorno

Para facilitar la configuración del entorno, se han creado archivos de ejemplo:

- `.env.local.example`: Plantilla para configurar variables locales
- `.env`: Variables de entorno para Supabase

---

**Nota para el Usuario:** Para ejecutar esta arquitectura completa, necesitarás tener una instancia de PostgreSQL ejecutándose en tu máquina (puerto 5432 o similar) y configurar la variable `DATABASE_URL_LOCAL`.
