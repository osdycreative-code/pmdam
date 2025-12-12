-- ==============================================================================
-- SCRIPT DE REINICIO CON DATOS REALES
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
    bloqueado_por_tarea_id INTEGER REFERENCES tareas(id) ON DELETE SET NULL,
    es_subtarea_de_id INTEGER REFERENCES tareas(id) ON DELETE CASCADE,
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tareas_proyecto ON tareas (proyecto_id);
CREATE INDEX idx_tareas_estado ON tareas (estado);

-- 4.3 FINANZAS
CREATE TABLE registro_finanzas (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos_maestros(id) ON DELETE CASCADE,
    tarea_id INTEGER REFERENCES tareas(id) ON DELETE SET NULL,
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
    tarea_creacion_id INTEGER REFERENCES tareas(id) ON DELETE SET NULL,
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
-- 6. INSERTAR DATOS REALES
-- ==============================================================================

-- 6.1 CATEGORIAS FINANCIERAS
INSERT INTO finance_categories (name, type) VALUES 
('Ventas', 'Income'),
('Servicios', 'Income'),
('Salarios', 'Expense'),
('Marketing', 'Expense'),
('Desarrollo', 'Expense'),
('Infraestructura', 'Expense'),
('Legal', 'Expense'),
('Impuestos', 'Expense');

-- 6.2 DIRECTORIO DE HERRAMIENTAS AI
INSERT INTO ai_directory (nombre_herramienta, categoria, url_acceso, costo_licencia) VALUES
('ChatGPT Pro', 'Texto', 'https://chat.openai.com', 20.00),
('Midjourney', 'Imagen', 'https://midjourney.com', 10.00),
('Claude', 'Texto', 'https://claude.ai', 18.00),
('DALL-E', 'Imagen', 'https://openai.com/dall-e', 15.00),
('Runway ML', 'Video', 'https://runwayml.com', 12.00),
('Descript', 'Audio', 'https://descript.com', 12.00);

-- 6.3 PROYECTOS REALES
INSERT INTO proyectos_maestros (nombre_proyecto, tipo_activo, presupuesto_asignado) VALUES
('Sitio Web Corporativo', 'Web', 5000.00),
('Aplicación Móvil Tienda Online', 'App', 15000.00),
('Curso Online Marketing Digital', 'Curso', 3000.00),
('Ebook Guía Financiera Personal', 'Ebook', 1500.00);

-- 6.4 TAREAS DE EJEMPLO PARA SITIO WEB CORPORATIVO
INSERT INTO tareas (proyecto_id, titulo_tarea, estado, asignado_a, prioridad, fecha_vencimiento, descripcion) VALUES
(1, 'Diseño de wireframes', 'Terminado', 'Diseñador', 'Alta', '2025-12-10', 'Crear wireframes para todas las páginas principales del sitio'),
(1, 'Desarrollo frontend', 'En Progreso', 'Frontend Dev', 'Alta', '2025-12-20', 'Implementar el diseño con React y TailwindCSS'),
(1, 'Integración backend', 'Por Hacer', 'Backend Dev', 'Media', '2025-12-25', 'Conectar con la API de servicios'),
(1, 'Pruebas de usabilidad', 'Por Hacer', 'QA Tester', 'Media', '2025-12-28', 'Realizar pruebas con usuarios reales'),
(1, 'Despliegue en producción', 'Por Hacer', 'DevOps', 'Alta', '2025-12-30', 'Configurar servidor y desplegar sitio');

-- 6.5 REGISTROS FINANCIEROS
INSERT INTO registro_finanzas (proyecto_id, tarea_id, concepto, tipo_transaccion, monto, categoria, fecha_transaccion) VALUES
(1, 1, 'Pago servicio de diseño', 'Gasto', 1200.00, 'Desarrollo', '2025-12-10'),
(1, 2, 'Pago desarrollador frontend', 'Gasto', 2500.00, 'Desarrollo', '2025-12-20'),
(1, NULL, 'Pago hosting anual', 'Gasto', 240.00, 'Infraestructura', '2025-12-01'),
(2, NULL, 'Anticipo cliente', 'Ingreso', 5000.00, 'Ventas', '2025-12-05'),
(3, NULL, 'Venta curso completo', 'Ingreso', 1500.00, 'Servicios', '2025-12-15');

-- 6.6 INVENTARIO DE ACTIVOS
INSERT INTO inventario_activos (nombre_activo, tipo_archivo, url_almacenamiento, licencia_derechos, fecha_expiracion, tarea_creacion_id) VALUES
('Logo corporativo', 'PNG', '/assets/logo.png', 'Copyright 2025 Empresa XYZ', '2026-12-31', 1),
('Manual de marca', 'PDF', '/assets/brand_manual.pdf', 'Copyright 2025 Empresa XYZ', '2026-12-31', 1),
('Componentes UI Kit', 'ZIP', '/assets/ui_kit.zip', 'MIT License', NULL, 2);

-- 6.7 USO DE HERRAMIENTAS AI
INSERT INTO tareas_ai_uso (tarea_id, ai_tool_id) VALUES
(1, 1), -- Uso de ChatGPT para generar copy
(1, 2), -- Uso de Midjourney para crear moodboard
(2, 1); -- Uso de ChatGPT para documentación técnica

-- 6.8 CUENTAS POR PAGAR
INSERT INTO accounts_payable (entity_name, description, amount, due_date, status) VALUES
('Proveedor Hosting', 'Pago mensual servidor cloud', 80.00, '2026-01-05', 'Pending'),
('Licencia Software', 'Suscripción Adobe Creative Suite', 50.00, '2026-01-10', 'Pending');

-- 6.9 CUENTAS POR COBRAR
INSERT INTO accounts_receivable (entity_name, description, amount, due_date, status) VALUES
('Cliente ABC', 'Pago pendiente por sitio web', 2500.00, '2025-12-20', 'Pending'),
('Cliente XYZ', 'Mantenimiento mensual', 300.00, '2026-01-05', 'Pending');

-- ==============================================================================
-- 7. ACTUALIZAR ESTADÍSTICAS DE PROYECTOS
-- ==============================================================================
UPDATE proyectos_maestros 
SET gastos_acumulados = (
    SELECT COALESCE(SUM(monto), 0) 
    FROM registro_finanzas 
    WHERE proyecto_id = proyectos_maestros.id AND tipo_transaccion = 'Gasto'
),
progreso_total = CASE 
    WHEN id = 1 THEN 40.0  -- Sitio Web Corporativo: 40% completado
    WHEN id = 2 THEN 10.0  -- App Móvil: 10% completado
    WHEN id = 3 THEN 75.0  -- Curso Online: 75% completado
    WHEN id = 4 THEN 20.0  -- Ebook: 20% completado
    ELSE 0.0
END;

-- ==============================================================================
-- 8. CREAR FUNCIONES DE AYUDA
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

-- ==============================================================================
-- 9. VERIFICACIÓN FINAL
-- ==============================================================================
-- Contar registros insertados
SELECT 
    (SELECT COUNT(*) FROM proyectos_maestros) as proyectos,
    (SELECT COUNT(*) FROM tareas) as tareas,
    (SELECT COUNT(*) FROM registro_finanzas) as finanzas,
    (SELECT COUNT(*) FROM inventario_activos) as activos,
    (SELECT COUNT(*) FROM ai_directory) as herramientas_ai;