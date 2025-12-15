-- ==============================================================================
-- COMPREHENSIVE FIX: SCHEMA COLUMNS + RLS OPTIMIZATION
-- ==============================================================================
-- This script first ensures all necessary 'user_id' columns exist, then applies
-- the optimized RLS policies to resolve Supabase warnings.
-- ------------------------------------------------------------------------------
-- 1. ENSURE COLUMNS EXIST (Idempotent Alterations)
-- ------------------------------------------------------------------------------
-- Helpers for safe column addition
DO $$ BEGIN -- 1. proyectos_maestros: Ensure owner_user_id (standard) and user_id (optional legacy) exist
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'proyectos_maestros'
) THEN
ALTER TABLE public.proyectos_maestros
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE public.proyectos_maestros
ADD COLUMN IF NOT EXISTS owner_user_id UUID DEFAULT auth.uid();
END IF;
-- 2. tareas
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'tareas'
) THEN
ALTER TABLE public.tareas
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
-- 3. registro_finanzas
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'registro_finanzas'
) THEN
ALTER TABLE public.registro_finanzas
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
-- 4. inventario_activos
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'inventario_activos'
) THEN
ALTER TABLE public.inventario_activos
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
-- 5. ai_directory
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'ai_directory'
) THEN
ALTER TABLE public.ai_directory
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
-- 6. estructura_contenido (If it exists)
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'estructura_contenido'
) THEN
ALTER TABLE public.estructura_contenido
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
-- 7. tareas_ai_uso
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'tareas_ai_uso'
) THEN
ALTER TABLE public.tareas_ai_uso
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
-- 8. finance_categories
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'finance_categories'
) THEN
ALTER TABLE public.finance_categories
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
-- 9. accounts_payable
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'accounts_payable'
) THEN
ALTER TABLE public.accounts_payable
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
-- 10. accounts_receivable
IF EXISTS (
    SELECT
    FROM pg_tables
    WHERE schemaname = 'public'
        AND tablename = 'accounts_receivable'
) THEN
ALTER TABLE public.accounts_receivable
ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
END IF;
END $$;
-- ------------------------------------------------------------------------------
-- 2. APPLY OPTIMIZED RLS POLICIES
-- ------------------------------------------------------------------------------
-- A. PROYECTOS MAESTROS
DROP POLICY IF EXISTS "Allow authenticated users to view own projects" ON public.proyectos_maestros;
DROP POLICY IF EXISTS "Allow owners to manage own projects" ON public.proyectos_maestros;
DROP POLICY IF EXISTS "Users can only see their own projects" ON public.proyectos_maestros;
DROP POLICY IF EXISTS "Enable all for anon" ON public.proyectos_maestros;
DROP POLICY IF EXISTS "Public Access Projects" ON public.proyectos_maestros;
CREATE POLICY "owner_access_proyectos_maestros" ON public.proyectos_maestros FOR ALL TO authenticated USING (
    owner_user_id = (
        select auth.uid()
    )
    OR user_id = (
        select auth.uid()
    )
) WITH CHECK (
    owner_user_id = (
        select auth.uid()
    )
    OR user_id = (
        select auth.uid()
    )
);
-- B. TAREAS
DROP POLICY IF EXISTS "Allow owners to view related tasks" ON public.tareas;
DROP POLICY IF EXISTS "Allow owners to manage own tasks" ON public.tareas;
DROP POLICY IF EXISTS "Users can only see their own tasks" ON public.tareas;
DROP POLICY IF EXISTS "Enable all for anon" ON public.tareas;
DROP POLICY IF EXISTS "Public Access Tasks" ON public.tareas;
CREATE POLICY "owner_access_tareas" ON public.tareas FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
    OR exists (
        select 1
        from public.proyectos_maestros pm
        where pm.id = tareas.proyecto_id
            and (
                pm.owner_user_id = (
                    select auth.uid()
                )
                OR pm.user_id = (
                    select auth.uid()
                )
            )
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
    OR exists (
        select 1
        from public.proyectos_maestros pm
        where pm.id = tareas.proyecto_id
            and (
                pm.owner_user_id = (
                    select auth.uid()
                )
                OR pm.user_id = (
                    select auth.uid()
                )
            )
    )
);
-- C. REGISTRO FINANZAS
DROP POLICY IF EXISTS "Allow owners to manage own finance records" ON public.registro_finanzas;
DROP POLICY IF EXISTS "Users can only see their own finances" ON public.registro_finanzas;
DROP POLICY IF EXISTS "Enable all for anon" ON public.registro_finanzas;
DROP POLICY IF EXISTS "Public Access Finance" ON public.registro_finanzas;
CREATE POLICY "owner_access_registro_finanzas" ON public.registro_finanzas FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
-- D. INVENTARIO ACTIVOS
DROP POLICY IF EXISTS "Allow owners to manage own assets" ON public.inventario_activos;
DROP POLICY IF EXISTS "Users can only see their own inventory" ON public.inventario_activos;
DROP POLICY IF EXISTS "Enable all for anon" ON public.inventario_activos;
DROP POLICY IF EXISTS "Public Access Assets" ON public.inventario_activos;
CREATE POLICY "owner_access_inventario_activos" ON public.inventario_activos FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
-- E. AI DIRECTORY
DROP POLICY IF EXISTS "Allow authenticated read-only access to AI Directory" ON public.ai_directory;
DROP POLICY IF EXISTS "Users can only see their own ai tools" ON public.ai_directory;
DROP POLICY IF EXISTS "Enable all for anon" ON public.ai_directory;
DROP POLICY IF EXISTS "Public Access AI" ON public.ai_directory;
CREATE POLICY "owner_access_ai_directory" ON public.ai_directory FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
-- F. TAREAS AI USO
DROP POLICY IF EXISTS "Allow owners to manage AI usage on tasks" ON public.tareas_ai_uso;
DROP POLICY IF EXISTS "Users can only see their own ai usage" ON public.tareas_ai_uso;
DROP POLICY IF EXISTS "Enable all for anon" ON public.tareas_ai_uso;
DROP POLICY IF EXISTS "Public Access AI Usage" ON public.tareas_ai_uso;
CREATE POLICY "owner_access_tareas_ai_uso" ON public.tareas_ai_uso FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);