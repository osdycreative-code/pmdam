import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// 1. Local Database Connection (PostgreSQL Local)
// Assumes user has a local POSTGRES running. 
// If not, this will fail to connect but serves the architectural purpose.
export const poolLocal = new Pool({
  connectionString: process.env.DATABASE_URL_LOCAL || 'postgresql://postgres:postgres@localhost:5432/pman_local'
});

// 2. Cloud Database Connection (Service Wrapper for Direct SQL or Supabase Client)
// We use Supabase Client for easier RLS handling and interactions
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Credentials");
}

export const supabaseCloud = createClient(supabaseUrl || '', supabaseKey || '');

// Optional: Direct SQL Pool to Cloud if needed for high-throughput batching
export const poolCloudRaw = new Pool({
    connectionString: process.env.DATABASE_URL_CLOUD // Direct connection string to Supabase DB
});
