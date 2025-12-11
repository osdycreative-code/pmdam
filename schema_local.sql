-- ==============================================================================
-- SCRIPT DE INICIALIZACIÓN - BASE DE DATOS LOCAL (PostgreSQL)
-- ==============================================================================
-- Ejecutar este script en tu instancia local de PostgreSQL (ej. psql -d pman_local -f schema_local.sql)
-- ==============================================================================
-- 1. LIMPIEZA PREVIA
DROP TABLE IF EXISTS tareas_ai_uso CASCADE;
DROP TABLE IF EXISTS registro_finanzas CASCADE;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS ai_directory CASCADE;
-- Local Replica
DROP TABLE IF EXISTS proyectos_maestros CASCADE;
-- Local Replica
DROP TYPE IF EXISTS estado_tarea CASCADE;
DROP TYPE IF EXISTS tipo_transaccion CASCADE;
-- 2. TIPOS
CREATE TYPE estado_tarea AS ENUM (
    'Por Hacer',
    'En Progreso',
    'En Revisión',
    'Bloqueado',
    'Terminado'
);
CREATE TYPE tipo_transaccion AS ENUM ('Gasto', 'Ingreso');
-- 3. TABLAS MAESTRAS (REPLICAS LOCALES)
-- Estas tablas "viven" en la Nube, pero necesitamos su estructura localmente
-- para mantener la integridad referencial (Foreign Keys) de las tareas y finanzas.
-- La aplicación (o un proceso de fondo) debería sincronizar estos datos desde la Nube.
CREATE TABLE proyectos_maestros (
    id INTEGER PRIMARY KEY,
    -- No es SERIAL aquí, copiamos el ID de la Nube
    nombre_proyecto VARCHAR(255) NOT NULL,
    tipo_activo VARCHAR(50),
    presupuesto_asignado NUMERIC(12, 2) DEFAULT 0.00,
    -- Campos informativos para visualización offline (opcional)
    gastos_acumulados NUMERIC(12, 2) DEFAULT 0.00,
    progreso_total REAL DEFAULT 0.0,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE
);
CREATE TABLE ai_directory (
    id INTEGER PRIMARY KEY,
    -- No es SERIAL aquí, copiamos el ID de la Nube
    nombre_herramienta VARCHAR(100),
    categoria VARCHAR(50),
    costo_licencia NUMERIC(8, 2)
);
-- 4. TABLAS DE EJECUCIÓN (MASTER LOCAL)
-- Estas son las tablas donde la aplicación escribe localmente.
CREATE TABLE tareas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    titulo_tarea VARCHAR(255) NOT NULL,
    estado estado_tarea DEFAULT 'Por Hacer',
    asignado_a VARCHAR(100),
    prioridad VARCHAR(20) DEFAULT 'Media',
    fecha_vencimiento DATE,
    bloqueado_por_tarea_id INTEGER REFERENCES tareas(id) ON DELETE
    SET NULL,
        es_subtarea_de_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
        ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tareas_proyecto ON tareas (proyecto_id);
CREATE INDEX idx_tareas_estado ON tareas (estado);
CREATE TABLE registro_finanzas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE
    SET NULL,
        concepto VARCHAR(255) NOT NULL,
        tipo_transaccion tipo_transaccion NOT NULL,
        monto NUMERIC(12, 2) NOT NULL,
        categoria VARCHAR(50),
        fecha_transaccion DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX idx_finanzas_proyecto ON registro_finanzas (proyecto_id);
CREATE TABLE tareas_ai_uso (
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    ai_tool_id INTEGER REFERENCES ai_directory(id) ON DELETE CASCADE,
    PRIMARY KEY (tarea_id, ai_tool_id)
);
-- Nota: No incluimos inventario_activos localmente ya que es solo de lectura desde Nube
-- y no tiene tablas hijas locales en esta arquitectura.
-- ==============================================================================
-- DATOS SEMILLA (MOCKS) - SOLO PARA DESARROLLO
-- Como la app local necesita proyectos para crear tareas, insertamos un dummy.
-- En producción, esto vendría de la sincronización con Supabase.
-- ==============================================================================
INSERT INTO proyectos_maestros (
        id,
        nombre_proyecto,
        tipo_activo,
        presupuesto_asignado
    )
VALUES (999, 'Proyecto Local Demo', 'Web', 5000.00);