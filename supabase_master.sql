-- ==============================================================================
-- SCRIPT MAESTRO DE SUPABASE (NUBE) - ARQUITECTURA HÍBRIDA
-- ==============================================================================
-- Este script define la estructura de la base de datos en la Nube (Supabase).
-- En esta arquitectura híbrida "Local-First", la nube actúa como:
-- 1. Source of Truth para Datos Maestros (Proyectos, Inventario, Directorio AI)
-- 2. Repositorio de Respaldo/Consolidación para Datos Transaccionales (Tareas, Finanzas)
-- ==============================================================================
-- 1. LIMPIEZA TOTAL (Fresh Start)
-- ¡CUIDADO! Esto eliminará todos los datos existentes.
DROP TABLE IF EXISTS tareas_ai_uso CASCADE;
DROP TABLE IF EXISTS registro_finanzas CASCADE;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS inventario_activos CASCADE;
DROP TABLE IF EXISTS proyectos_maestros CASCADE;
DROP TABLE IF EXISTS ai_directory CASCADE;
DROP TABLE IF EXISTS finance_categories CASCADE;
DROP TABLE IF EXISTS accounts_payable CASCADE;
DROP TABLE IF EXISTS accounts_receivable CASCADE;
DROP TYPE IF EXISTS estado_tarea CASCADE;
DROP TYPE IF EXISTS tipo_transaccion CASCADE;
-- 2. TIPOS ENUM
CREATE TYPE estado_tarea AS ENUM (
    'Por Hacer',
    'En Progreso',
    'En Revisión',
    'Bloqueado',
    'Terminado'
);
CREATE TYPE tipo_transaccion AS ENUM ('Gasto', 'Ingreso');
-- ==============================================================================
-- 3. TABLAS MAESTRAS (Source of Truth: NUBE)
-- ==============================================================================
-- 3.1 PROYECTOS (DB 1)
CREATE TABLE proyectos_maestros (
    id SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR(255) NOT NULL,
    tipo_activo VARCHAR(50) NOT NULL,
    -- 'Ebook', 'Curso', 'App', 'Web'
    presupuesto_asignado NUMERIC(12, 2) DEFAULT 0.00,
    gastos_acumulados NUMERIC(12, 2) DEFAULT 0.00,
    -- Calculado/Sincronizado desde finanzas
    progreso_total REAL DEFAULT 0.0,
    -- Calculado/Sincronizado desde tareas
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_proyectos_tipo ON proyectos_maestros (tipo_activo);
-- 3.2 INVENTARIO DE ACTIVOS (DAM - DB 4)
CREATE TABLE inventario_activos (
    id SERIAL PRIMARY KEY,
    nombre_activo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(50),
    url_almacenamiento TEXT NOT NULL,
    licencia_derechos TEXT NOT NULL,
    fecha_expiracion DATE,
    -- Nota: tarea_creacion_id es referencial, pero en arquitectura distribuida podría apuntar a un ID que aún no existe en nube si no se ha sincronizado.
    -- Por ello, lo dejamos como INT simple sin FK estricta, o asumimos consistencia eventual.
    tarea_creacion_id INTEGER,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3.3 AI DIRECTORY (DB E)
CREATE TABLE ai_directory (
    id SERIAL PRIMARY KEY,
    nombre_herramienta VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50),
    url_acceso TEXT,
    costo_licencia NUMERIC(8, 2) DEFAULT 0.00
);
-- 3.4 CATEGORIAS FINANCIERAS
CREATE TABLE finance_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) CHECK (type IN ('Income', 'Expense'))
);
-- 3.5 CUENTAS POR PAGAR (AP)
CREATE TABLE accounts_payable (
    id SERIAL PRIMARY KEY,
    entity_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'Pending',
    invoice_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 3.6 CUENTAS POR COBRAR (AR)
CREATE TABLE accounts_receivable (
    id SERIAL PRIMARY KEY,
    entity_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'Pending',
    invoice_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- ==============================================================================
-- 4. TABLAS TRANSACCIONALES (Source of Truth: LOCAL -> Respaldo en Nube)
-- Estas tablas reciben datos sincronizados desde las instancias locales.
-- ==============================================================================
-- 4.1 TAREAS (DB 2)
CREATE TABLE tareas (
    id SERIAL PRIMARY KEY,
    -- En sincro, idealmente usaríamos UUIDs para evitar colisiones entre múltiples locales. Por ahora mantenemos SERIAL asumiendo 1 usuario.
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    titulo_tarea VARCHAR(255) NOT NULL,
    estado estado_tarea DEFAULT 'Por Hacer',
    asignado_a VARCHAR(100),
    prioridad VARCHAR(20) DEFAULT 'Media',
    fecha_vencimiento DATE,
    descripcion TEXT,
    bloqueado_por_tarea_id INTEGER,
    -- FK débil por eventual consistencia
    es_subtarea_de_id INTEGER,
    -- FK débil
    id_local_origen INTEGER,
    -- Metadato opcional para rastrear origen si hay conflictos
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tareas_proyecto ON tareas (proyecto_id);
-- 4.2 FINANZAS (DB 5)
CREATE TABLE registro_finanzas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    tarea_id INTEGER,
    -- FK débil a tareas
    concepto VARCHAR(255) NOT NULL,
    tipo_transaccion tipo_transaccion NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    categoria VARCHAR(50),
    fecha_transaccion DATE NOT NULL DEFAULT CURRENT_DATE,
    id_local_origen INTEGER -- Metadato opcional
);
CREATE INDEX idx_finanzas_proyecto ON registro_finanzas (proyecto_id);
-- 4.3 USO DE AI (Many-to-Many)
CREATE TABLE tareas_ai_uso (
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    ai_tool_id INTEGER REFERENCES ai_directory(id) ON DELETE CASCADE,
    PRIMARY KEY (tarea_id, ai_tool_id)
);
-- ==============================================================================
-- 5. POLÍTICAS DE SEGURIDAD (RLS)
-- ==============================================================================
ALTER TABLE proyectos_maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE registro_finanzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_activos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas_ai_uso ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
-- Políticas permisivas "Públicas" (Ajustar para producción real con auth.uid())
CREATE POLICY "Enable all for anon" ON proyectos_maestros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON tareas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON registro_finanzas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON inventario_activos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON ai_directory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON tareas_ai_uso FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON finance_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON accounts_payable FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for anon" ON accounts_receivable FOR ALL USING (true) WITH CHECK (true);
-- ==============================================================================
-- 6. STORED PROCEDURES (RPC)
-- ==============================================================================
-- Función crítica para crear proyecto (Datos Maestros Nube)
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
        presupuesto_asignado
    )
VALUES (p_nombre_proyecto, p_tipo_activo, p_presupuesto)
RETURNING id INTO v_proyecto_id;
-- Nota: En modelo híbrido, la "Tarea Inicial" podría crearse aquí (Nube) y bajar al Local,
-- O el Local detecta el nuevo proyecto y crea sus tareas de setup.
-- Por simplicidad, creamos una tarea semilla en la nube que se sincronizará hacia abajo.
INSERT INTO tareas (proyecto_id, titulo_tarea, estado, prioridad)
VALUES (
        v_proyecto_id,
        'Configuración Inicial del Proyecto',
        'Por Hacer',
        'Alta'
    );
RETURN json_build_object('id', v_proyecto_id, 'status', 'success');
EXCEPTION
WHEN OTHERS THEN RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;