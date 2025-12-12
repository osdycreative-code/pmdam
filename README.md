<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PMDAM - Project Management Dashboard with AI

Sistema de gestión de proyectos con integración de inteligencia artificial.

## Requisitos Previos

- Node.js
- PostgreSQL (para base de datos local)
- Cuenta en Supabase (para base de datos en la nube)
- Clave API de Google Gemini

## Configuración Inicial

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   - Copiar `.env.local.example` a `.env.local`
   - Establecer `GEMINI_API_KEY` con tu clave de API de Gemini
   - Configurar `DATABASE_URL_LOCAL` con tus credenciales de PostgreSQL

3. Restablecer base de datos con datos reales:
   ```bash
   ./scripts/reset-database.sh
   ```

4. Ejecutar la aplicación:
   ```bash
   npm run dev
   ```

## Estructura de la Base de Datos

El sistema utiliza una arquitectura híbrida con bases de datos locales y en la nube:

- **Local**: PostgreSQL para operaciones diarias y trabajo sin conexión
- **Nube**: Supabase para respaldo, sincronización y colaboración

### Tablas Principales

- `proyectos_maestros`: Proyectos principales
- `tareas`: Tareas asociadas a proyectos
- `registro_finanzas`: Registro financiero de proyectos
- `inventario_activos`: Activos digitales generados
- `ai_directory`: Herramientas de IA disponibles

## Despliegue

La aplicación puede desplegarse en plataformas como Netlify o Vercel siguiendo la configuración de variables de entorno especificada en la documentación.
