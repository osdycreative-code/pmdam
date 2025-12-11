-- ==============================================================================
-- SCRIPT DE REINICIO TOTAL (FRESH START)
-- ==============================================================================
-- 1. ELIMINAR TABLAS EXISTENTES (Orden correcto por Foreign Keys)
DROP TABLE IF EXISTS tareas_ai_uso CASCADE;
DROP TABLE IF EXISTS registro_finanzas CASCADE;
DROP TABLE IF EXISTS inventario_activos CASCADE;
DROP TABLE IF EXISTS tareas CASCADE;
DROP TABLE IF EXISTS proyectos_maestros CASCADE;
DROP TABLE IF EXISTS ai_directory CASCADE;
DROP TABLE IF EXISTS finance_categories CASCADE;
DROP TABLE IF EXISTS accounts_payable CASCADE;
DROP TABLE IF EXISTS accounts_receivable CASCADE;
-- 2. ELIMINAR TIPOS ENUM
DROP TYPE IF EXISTS estado_tarea CASCADE;
DROP TYPE IF EXISTS tipo_transaccion CASCADE;
-- 3. RECREAR TIPOS
CREATE TYPE estado_tarea AS ENUM (
    'Por Hacer',
    'En Progreso',
    'En Revisión',
    'Bloqueado',
    'Terminado'
);
CREATE TYPE tipo_transaccion AS ENUM ('Gasto', 'Ingreso');
-- ==============================================================================
-- 4. RECREAR TABLAS MAESTRAS
-- ==============================================================================
-- 4.1 PROYECTOS
CREATE TABLE proyectos_maestros (
    id SERIAL PRIMARY KEY,
    nombre_proyecto VARCHAR(255) NOT NULL,
    tipo_activo VARCHAR(50) NOT NULL,
    -- 'Ebook', 'Curso', 'App', 'Web'
    presupuesto_asignado NUMERIC(12, 2) DEFAULT 0.00,
    gastos_acumulados NUMERIC(12, 2) DEFAULT 0.00,
    progreso_total REAL DEFAULT 0.0,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_proyectos_tipo ON proyectos_maestros (tipo_activo);
-- 4.2 TAREAS
CREATE TABLE tareas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    titulo_tarea VARCHAR(255) NOT NULL,
    estado estado_tarea DEFAULT 'Por Hacer',
    asignado_a VARCHAR(100),
    prioridad VARCHAR(20) DEFAULT 'Media',
    fecha_vencimiento DATE,
    descripcion TEXT,
    bloqueado_por_tarea_id INTEGER REFERENCES tareas(id) ON DELETE
    SET NULL,
        es_subtarea_de_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
        ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tareas_proyecto ON tareas (proyecto_id);
CREATE INDEX idx_tareas_estado ON tareas (estado);
-- 4.3 FINANZAS
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
-- 4.4 INVENTARIO (DAM)
CREATE TABLE inventario_activos (
    id SERIAL PRIMARY KEY,
    nombre_activo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(50),
    url_almacenamiento TEXT NOT NULL,
    licencia_derechos TEXT NOT NULL,
    fecha_expiracion DATE,
    tarea_creacion_id INTEGER REFERENCES tareas(id) ON DELETE
    SET NULL,
        ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- 4.5 AI DIRECTORY
CREATE TABLE ai_directory (
    id SERIAL PRIMARY KEY,
    nombre_herramienta VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50),
    url_acceso TEXT,
    costo_licencia NUMERIC(8, 2) DEFAULT 0.00
);
-- 4.6 RELACION TAREAS-AI
CREATE TABLE tareas_ai_uso (
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    ai_tool_id INTEGER REFERENCES ai_directory(id) ON DELETE CASCADE,
    PRIMARY KEY (tarea_id, ai_tool_id)
);
-- 4.7 CATEGORIAS FINANCIERAS
CREATE TABLE finance_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) CHECK (type IN ('Income', 'Expense'))
);
-- 4.8 CUENTAS POR PAGAR (AP)
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
-- 4.9 CUENTAS POR COBRAR (AR)
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
-- 5. SEGURIDAD (RLS)
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
-- Políticas permisivas para desarrollo
CREATE POLICY "Public Access Projects" ON proyectos_maestros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Tasks" ON tareas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Finance" ON registro_finanzas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Assets" ON inventario_activos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access AI" ON ai_directory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access AI Usage" ON tareas_ai_uso FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Finance Cats" ON finance_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access AP" ON accounts_payable FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access AR" ON accounts_receivable FOR ALL USING (true) WITH CHECK (true);
-- ==============================================================================
-- 6. RPC HELPERS
-- ==============================================================================
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
-- Tarea inicial por defecto
INSERT INTO tareas (proyecto_id, titulo_tarea, estado, prioridad)
VALUES (
        v_proyecto_id,
        'Configuración Inicial',
        'Por Hacer',
        'Alta'
    );
RETURN json_build_object('id', v_proyecto_id, 'status', 'success');
EXCEPTION
WHEN OTHERS THEN RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;