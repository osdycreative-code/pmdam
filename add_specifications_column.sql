-- Add specifications column to proyectos_maestros to store App Generator data
ALTER TABLE public.proyectos_maestros
ADD COLUMN IF NOT EXISTS specifications JSONB;