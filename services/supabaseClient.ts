import { createClient } from '@supabase/supabase-js';

// NOTE: In a real production environment, these should be environment variables.
// Since we are in a demo environment, you will need to replace these with your actual Supabase credentials.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
