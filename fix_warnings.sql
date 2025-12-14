CREATE OR REPLACE FUNCTION update_project_progress() RETURNS TRIGGER AS $$
DECLARE total_tareas INTEGER;
tareas_terminadas INTEGER;
nuevo_progreso REAL;
BEGIN -- El search_path ya está fijo por la cláusula SET
-- Usamos COALESCE para manejar INSERT (NEW.proyecto_id) y DELETE (OLD.proyecto_id)
SELECT COUNT(id) INTO total_tareas
FROM tareas
WHERE proyecto_id = COALESCE(NEW.proyecto_id, OLD.proyecto_id);
IF total_tareas > 0 THEN
SELECT COUNT(id) INTO tareas_terminadas
FROM tareas
WHERE proyecto_id = COALESCE(NEW.proyecto_id, OLD.proyecto_id)
    AND estado = 'Terminado';
nuevo_progreso := (tareas_terminadas::REAL / total_tareas::REAL) * 100.0;
ELSE nuevo_progreso := 0.0;
END IF;
UPDATE proyectos_maestros
SET progreso_total = nuevo_progreso,
    ultima_actualizacion = now()
WHERE id = COALESCE(NEW.proyecto_id, OLD.proyecto_id);
RETURN NEW;
END;
$$ LANGUAGE plpgsql -- CLÁUSULA CRÍTICA: Establece la ruta de búsqueda fija y segura
SET search_path = public;