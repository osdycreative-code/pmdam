-- Script to address reported Security Warnings
-- 1. FIX FUNCTION SEARCH PATH (function_search_path_mutable)
-- The warning identified 'pg_temp_4.count_estimate'. 
-- This indicates it was likely a temporary function created by a tool or query.
-- However, we will ensure that if 'count_estimate' exists permanently in 'public', it is secured.
-- We also reinforce our known functions.
DO $$ BEGIN -- Check if 'count_estimate' exists in public schema and secure it
IF EXISTS (
    SELECT 1
    FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'count_estimate'
        AND n.nspname = 'public'
) THEN ALTER FUNCTION public.count_estimate()
SET search_path = public;
END IF;
-- Reinforce our main helper function
ALTER FUNCTION public.crear_proyecto_con_presupuesto(TEXT, TEXT, NUMERIC)
SET search_path = public;
END $$;
-- 2. LEAKED PASSWORD PROTECTION (auth_leaked_password_protection)
-- This cannot be enabled via SQL. You must enable it in the Supabase Dashboard:
-- Go to: Authentication -> Security -> Password Protection -> Enable "Leaked Password Protection"