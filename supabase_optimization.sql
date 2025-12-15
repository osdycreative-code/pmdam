-- ==============================================================================
-- OPTIMIZATION SCRIPT: FIX SUPERBASE RLS PERFORMANCE WARNINGS & POLICIES
-- ==============================================================================
-- This script addresses "auth_rls_initplan" (Performance) and "multiple_permissive_policies" warnings.
-- It replaces multiple overlapping policies with single, optimized policies using (select auth.uid()).
-- ------------------------------------------------------------------------------
-- 1. TABLE: proyectos_maestros
-- Issue: Multiple overlapping policies ("Allow authenticated...", "Allow owners...") 
--        + Unoptimized auth.uid() calls.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated users to view own projects" ON public.proyectos_maestros;
DROP POLICY IF EXISTS "Allow owners to manage own projects" ON public.proyectos_maestros;
-- Legacy policies referenced in previous scripts
DROP POLICY IF EXISTS "Users can only see their own projects" ON public.proyectos_maestros;
-- Create Unified Optimized Policy
CREATE POLICY "owner_access_proyectos_maestros" ON public.proyectos_maestros FOR ALL TO authenticated USING (
    -- Optimization: wrap auth.uid() in select to allow plan caching
    owner_user_id = (
        select auth.uid()
    )
    OR -- Fallback for legacy schema if user_id was used instead of owner_user_id
    user_id = (
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
-- ------------------------------------------------------------------------------
-- 2. TABLE: tareas
-- Issue: Overlapping policies "view related" vs "manage own" + unoptimized calls.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow owners to view related tasks" ON public.tareas;
DROP POLICY IF EXISTS "Allow owners to manage own tasks" ON public.tareas;
DROP POLICY IF EXISTS "Users can only see their own tasks" ON public.tareas;
CREATE POLICY "owner_access_tareas" ON public.tareas FOR ALL TO authenticated USING (
    -- Check if task has direct user_id assignment (optimization)
    user_id = (
        select auth.uid()
    )
    OR -- Or if the related project belongs to the user
    exists (
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
-- ------------------------------------------------------------------------------
-- 3. TABLE: registro_finanzas
-- Issue: Unoptimized auth.uid() calls
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow owners to manage own finance records" ON public.registro_finanzas;
DROP POLICY IF EXISTS "Users can only see their own finances" ON public.registro_finanzas;
CREATE POLICY "owner_access_registro_finanzas" ON public.registro_finanzas FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
-- ------------------------------------------------------------------------------
-- 4. TABLE: inventario_activos
-- Issue: Unoptimized auth.uid() calls
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow owners to manage own assets" ON public.inventario_activos;
DROP POLICY IF EXISTS "Users can only see their own inventory" ON public.inventario_activos;
CREATE POLICY "owner_access_inventario_activos" ON public.inventario_activos FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
-- ------------------------------------------------------------------------------
-- 5. TABLE: ai_directory
-- Issue: Unoptimized calls
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow authenticated read-only access to AI Directory" ON public.ai_directory;
DROP POLICY IF EXISTS "Users can only see their own ai tools" ON public.ai_directory;
-- Assuming this is private per user based on previous scripts
CREATE POLICY "owner_access_ai_directory" ON public.ai_directory FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
-- ------------------------------------------------------------------------------
-- 6. TABLE: estructura_contenido
-- Issue: Unoptimized calls
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow owners to manage content structure" ON public.estructura_contenido;
CREATE POLICY "owner_access_estructura_contenido" ON public.estructura_contenido FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);
-- ------------------------------------------------------------------------------
-- 7. TABLE: tareas_ai_uso
-- Issue: Unoptimized calls
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow owners to manage AI usage on tasks" ON public.tareas_ai_uso;
DROP POLICY IF EXISTS "Users can only see their own ai usage" ON public.tareas_ai_uso;
CREATE POLICY "owner_access_tareas_ai_uso" ON public.tareas_ai_uso FOR ALL TO authenticated USING (
    user_id = (
        select auth.uid()
    )
) WITH CHECK (
    user_id = (
        select auth.uid()
    )
);