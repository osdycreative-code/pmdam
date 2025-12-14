-- ==============================================================================
-- SCRIPT DE SEGURIDAD (RLS) - MULTI-TENANCY
-- ==============================================================================
-- Este script actualiza todas las tablas para soportar múltiples usuarios.
-- 1. Agrega la columna 'user_id' (UUID) vinculada a auth.users.
-- 2. Actualiza las políticas RLS para que cada usuario solo vea su data.
-- ==============================================================================
-- 1. Agregar columna user_id a todas las tablas principales
ALTER TABLE proyectos_maestros
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE inventario_activos
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE ai_directory
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE finance_categories
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE accounts_payable
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE accounts_receivable
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
-- Las tablas dependientes (tareas, finanzas) idealmente heredan el acceso del proyecto,
-- pero para mayor seguridad y simplicidad en consultas directas, también les agregamos user_id.
ALTER TABLE tareas
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE registro_finanzas
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE tareas_ai_uso
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
-- 2. Eliminar políticas antiguas (Permisivas)
DROP POLICY IF EXISTS "Enable all for anon" ON proyectos_maestros;
DROP POLICY IF EXISTS "Enable all for anon" ON inventario_activos;
DROP POLICY IF EXISTS "Enable all for anon" ON ai_directory;
DROP POLICY IF EXISTS "Enable all for anon" ON finance_categories;
DROP POLICY IF EXISTS "Enable all for anon" ON accounts_payable;
DROP POLICY IF EXISTS "Enable all for anon" ON accounts_receivable;
DROP POLICY IF EXISTS "Enable all for anon" ON tareas;
DROP POLICY IF EXISTS "Enable all for anon" ON registro_finanzas;
DROP POLICY IF EXISTS "Enable all for anon" ON tareas_ai_uso;
-- 3. Crear Políticas Estrictas (Solo el dueño ve sus datos)
-- PROYECTOS
CREATE POLICY "Users can only see their own projects" ON proyectos_maestros FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- INVENTARIO
CREATE POLICY "Users can only see their own inventory" ON inventario_activos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- AI DIRECTORY (Si queremos que sea privado por usuario, si es global cambiar política)
-- Asumimos por ahora que cada usuario gestiona sus propias herramientas o favoritos.
CREATE POLICY "Users can only see their own ai tools" ON ai_directory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- FINANZAS CATEGORIAS
CREATE POLICY "Users can only see their own categories" ON finance_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- AP & AR
CREATE POLICY "Users can only see their own AP" ON accounts_payable FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only see their own AR" ON accounts_receivable FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- TAREAS & TRANSACCIONES
CREATE POLICY "Users can only see their own tasks" ON tareas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only see their own finances" ON registro_finanzas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only see their own ai usage" ON tareas_ai_uso FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- 4. Actualizar Función de Creación de Proyectos para incluir user_id
CREATE OR REPLACE FUNCTION crear_proyecto_con_presupuesto(
        p_nombre_proyecto TEXT,
        p_tipo_activo TEXT,
        p_presupuesto NUMERIC
    ) RETURNS JSON LANGUAGE plpgsql
SET search_path = public AS $$
DECLARE v_proyecto_id INTEGER;
BEGIN
INSERT INTO proyectos_maestros (
        nombre_proyecto,
        tipo_activo,
        presupuesto_asignado,
        user_id
    )
VALUES (
        p_nombre_proyecto,
        p_tipo_activo,
        p_presupuesto,
        auth.uid()
    )
RETURNING id INTO v_proyecto_id;
-- Tarea semilla también con user_id
INSERT INTO tareas (
        proyecto_id,
        titulo_tarea,
        estado,
        prioridad,
        user_id
    )
VALUES (
        v_proyecto_id,
        'Configuración Inicial del Proyecto',
        'Por Hacer',
        'Alta',
        auth.uid()
    );
RETURN json_build_object('id', v_proyecto_id, 'status', 'success');
EXCEPTION
WHEN OTHERS THEN RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
-- ==============================================================================
-- 5. FIX: SECURITY WARNING (Function Search Path Mutable)
-- ==============================================================================
-- Recreamos la función update_project_progress con la ruta de búsqueda fijada
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_tareas INTEGER;
    tareas_terminadas INTEGER;
    nuevo_progreso REAL;
BEGIN
    -- FIJAR LA RUTA DE BÚSQUEDA A 'public'
    SET search_path = public;

    -- Contar todas las tareas relacionadas con el proyecto (usando OLD.proyecto_id si es DELETE)
    SELECT COUNT(id)
    INTO total_tareas
    FROM tareas
    WHERE proyecto_id = COALESCE(NEW.proyecto_id, OLD.proyecto_id); -- Usa NEW si es INSERT/UPDATE, OLD si es DELETE

    IF total_tareas > 0 THEN
        -- Contar tareas terminadas
        SELECT COUNT(id)
        INTO tareas_terminadas
        FROM tareas
        WHERE proyecto_id = COALESCE(NEW.proyecto_id, OLD.proyecto_id)
          AND estado = 'Terminado';

        nuevo_progreso := (tareas_terminadas::REAL / total_tareas::REAL) * 100.0;
    ELSE
        nuevo_progreso := 0.0;
    END IF;

    -- Actualizar el proyecto maestro
    UPDATE proyectos_maestros
    SET progreso_total = nuevo_progreso
    WHERE id = COALESCE(NEW.proyecto_id, OLD.proyecto_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
