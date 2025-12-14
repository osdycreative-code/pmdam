-- ==============================================================================
-- 0. LIMPIEZA TOTAL (Clean Slate)
-- ==============================================================================
-- Eliminamos tablas en orden inverso a sus dependencias para evitar errores FK
DROP TABLE IF EXISTS tareas_ai_uso CASCADE;
DROP TABLE IF EXISTS ai_directory CASCADE;
DROP TABLE IF EXISTS inventario_activos CASCADE;
DROP TABLE IF EXISTS registro_finanzas CASCADE;
DROP TABLE IF EXISTS estructura_contenido CASCADE;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS proyectos_maestros CASCADE;
-- ==============================================================================
-- 1. TIPOS ENUM Y DROPS (Seguridad de Ejecución)
-- ==============================================================================
DROP TYPE IF EXISTS estado_tarea;
DROP TYPE IF EXISTS tipo_transaccion;
CREATE TYPE estado_tarea AS ENUM (
    'Por Hacer',
    'En Progreso',
    'En Revisión',
    'Bloqueado',
    'Terminado'
);
CREATE TYPE tipo_transaccion AS ENUM ('Gasto', 'Ingreso');
-- ==============================================================================
-- 2. TABLAS E ÍNDICES
-- ==============================================================================
-- Tipos de Activo soportados: Libro, Manual, Libro para Colorear, Libro Ilustrativo, Juego, App, Storybook.
-- ----------------------------------------------------------------------
-- 2.1. TABLA: PROYECTOS MAESTROS (DB 1)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proyectos_maestros (
    id SERIAL PRIMARY KEY,
    owner_user_id UUID DEFAULT auth.uid() NOT NULL,
    -- Usuario propietario
    nombre_proyecto VARCHAR(255) NOT NULL,
    tipo_activo VARCHAR(50) NOT NULL,
    presupuesto_asignado NUMERIC(12, 2) DEFAULT 0.00,
    -- Campos Rollup (actualizados por triggers o funciones de Supabase)
    gastos_acumulados NUMERIC(12, 2) DEFAULT 0.00,
    progreso_total REAL DEFAULT 0.0,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_proyectos_owner ON proyectos_maestros (owner_user_id);
-- ----------------------------------------------------------------------
-- 2.2. TABLA: TAREAS (DB 2)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tareas (
    id SERIAL PRIMARY KEY,
    owner_user_id UUID DEFAULT auth.uid() NOT NULL,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    titulo_tarea VARCHAR(255) NOT NULL,
    estado estado_tarea DEFAULT 'Por Hacer',
    asignado_a VARCHAR(100),
    prioridad VARCHAR(20) DEFAULT 'Media',
    fecha_vencimiento DATE,
    es_subtarea_de_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto_owner ON tareas (proyecto_id, owner_user_id);
-- ----------------------------------------------------------------------
-- 2.3. TABLA: ESTRUCTURA_CONTENIDO (Para Módulos de Libros, Cursos, Juegos)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estructura_contenido (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    tipo_elemento VARCHAR(50) NOT NULL,
    -- Ej: 'Capítulo', 'Nivel', 'Lección'
    orden INTEGER NOT NULL,
    titulo VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contenido_proyecto ON estructura_contenido (proyecto_id);
-- ----------------------------------------------------------------------
-- 2.4. TABLA: REGISTRO DE FINANZAS (DB 5)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registro_finanzas (
    id SERIAL PRIMARY KEY,
    owner_user_id UUID DEFAULT auth.uid() NOT NULL,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    tipo_transaccion tipo_transaccion NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    fecha_transaccion DATE NOT NULL DEFAULT CURRENT_DATE
);
-- ----------------------------------------------------------------------
-- 2.5. TABLA: INVENTARIO DE ACTIVOS (DAM - DB 4)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_activos (
    id SERIAL PRIMARY KEY,
    owner_user_id UUID DEFAULT auth.uid() NOT NULL,
    nombre_activo VARCHAR(255) NOT NULL,
    licencia_derechos TEXT NOT NULL,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE
    SET NULL
);
-- ----------------------------------------------------------------------
-- 2.6. TABLA: AI DIRECTORY (DB E)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_directory (
    id SERIAL PRIMARY KEY,
    nombre_herramienta VARCHAR(100) NOT NULL UNIQUE,
    costo_licencia NUMERIC(8, 2) DEFAULT 0.00 -- No necesita owner_user_id si es un catálogo global de la aplicación.
    -- Si es por usuario, añadir owner_user_id UUID
);
-- ----------------------------------------------------------------------
-- 2.7. TABLA DE UNIÓN: TAREAS AI USO (Many-to-Many)
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tareas_ai_uso (
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    ai_tool_id INTEGER REFERENCES ai_directory(id) ON DELETE CASCADE,
    PRIMARY KEY (tarea_id, ai_tool_id)
);
-- ==============================================================================
-- 3. FUNCIONES Y TRIGGERS (Automatización de Rollup)
-- ==============================================================================
-- Función para recalcular el progreso de un proyecto
CREATE OR REPLACE FUNCTION update_project_progress() RETURNS TRIGGER AS $$
DECLARE total_tareas INTEGER;
tareas_terminadas INTEGER;
nuevo_progreso REAL;
BEGIN
SELECT COUNT(id) INTO total_tareas
FROM tareas
WHERE proyecto_id = NEW.proyecto_id
    OR proyecto_id = OLD.proyecto_id;
IF total_tareas > 0 THEN
SELECT COUNT(id) INTO tareas_terminadas
FROM tareas
WHERE proyecto_id = NEW.proyecto_id
    OR proyecto_id = OLD.proyecto_id
    AND estado = 'Terminado';
nuevo_progreso := (tareas_terminadas::REAL / total_tareas::REAL) * 100.0;
ELSE nuevo_progreso := 0.0;
END IF;
UPDATE proyectos_maestros
SET progreso_total = nuevo_progreso
WHERE id = NEW.proyecto_id
    OR id = OLD.proyecto_id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger que se dispara después de INSERT, UPDATE o DELETE en la tabla TAREAS
CREATE TRIGGER on_task_update
AFTER
INSERT
    OR
UPDATE
    OR DELETE ON tareas FOR EACH ROW EXECUTE FUNCTION update_project_progress();
-- ==============================================================================
-- 4. SEGURIDAD DE NIVEL DE FILA (RLS) - POLÍTICAS PARA SUPABASE
-- ==============================================================================
-- 4.1. PROYECTOS MAESTROS
ALTER TABLE proyectos_maestros ENABLE ROW LEVEL SECURITY;
-- Política de lectura: El usuario puede ver sus propios proyectos
CREATE POLICY "Allow authenticated users to view own projects" ON proyectos_maestros FOR
SELECT USING (auth.uid() = owner_user_id);
-- Política de modificación: El usuario solo puede modificar y eliminar sus propios proyectos
CREATE POLICY "Allow owners to manage own projects" ON proyectos_maestros FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
-- 4.2. TAREAS
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
-- Política de lectura: El usuario puede ver sus tareas si pertenece al proyecto
CREATE POLICY "Allow owners to view related tasks" ON tareas FOR
SELECT USING (
        auth.uid() = owner_user_id
        OR EXISTS (
            SELECT 1
            FROM proyectos_maestros
            WHERE id = proyecto_id
                AND owner_user_id = auth.uid()
        )
    );
-- Política de modificación: El usuario solo puede modificar y eliminar sus tareas
CREATE POLICY "Allow owners to manage own tasks" ON tareas FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
-- 4.3. REGISTRO DE FINANZAS
ALTER TABLE registro_finanzas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow owners to manage own finance records" ON registro_finanzas FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
-- 4.4. INVENTARIO DE ACTIVOS
ALTER TABLE inventario_activos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow owners to manage own assets" ON inventario_activos FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
-- 4.5. AI DIRECTORY (Acceso público de lectura, solo administradores pueden escribir)
ALTER TABLE ai_directory ENABLE ROW LEVEL SECURITY;
-- Lectura: Cualquier usuario autenticado puede ver el directorio de herramientas
CREATE POLICY "Allow authenticated read-only access to AI Directory" ON ai_directory FOR
SELECT USING (auth.uid() IS NOT NULL);
-- Escritura: Solo un rol específico (Ej. 'supabase_admin' o un rol definido) puede insertar/actualizar.
-- Aquí se deja la política más restrictiva para que el administrador la defina.
-- CREATE POLICY "Deny all DML for general users"
--   ON ai_directory FOR ALL
--   USING (false);