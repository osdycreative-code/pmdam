/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// NOTE: In a real production environment, these should be environment variables.
// Since we are in a demo environment, you will need to replace these with your actual Supabase credentials.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const deleteAllSupabaseData = async () => {
    const tables = [
        'tareas_ai_uso', 
        'registro_finanzas',
        'tareas',
        'estructura_contenido',
        'inventario_activos',
        'proyectos_maestros',
        'ai_directory',
        'folder_items',
        'accounts_payable',
        'accounts_receivable', 
        'creative_artifacts'
    ];

    for (const table of tables) {
        try {
            // Check for existence and ID type
            const { data, error: checkError } = await supabase.from(table).select('id').limit(1);
            
            if (checkError) {
                // Determine if it is a "table not found" error (404-like) or permission error
                // Just continue if error, logging warning
                console.warn(`Skipping reset for ${table}:`, checkError.message);
                continue;
            }

            if (data && data.length > 0) {
                const sampleId = data[0].id;
                let deleteOp;
                
                if (typeof sampleId === 'number') {
                    deleteOp = supabase.from(table).delete().gt('id', -1);
                } else {
                    // Assume UUID or String
                    deleteOp = supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
                }

                const { error: deleteError } = await deleteOp;
                if (deleteError) {
                    console.error(`Error clearing table ${table}:`, deleteError.message);
                } else {
                    console.log(`Cleared table: ${table}`);
                }
            } else {
                // If empty, nothing to delete, but technically "cleared"
                 console.log(`Table ${table} is already empty or empty result.`);
            }
        } catch (err) {
            console.error(`Unexpected error clearing ${table}:`, err);
        }
    }
};
