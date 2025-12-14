-- 4.7. TAREAS AI USO
ALTER TABLE tareas_ai_uso ENABLE ROW LEVEL SECURITY;
-- Política: Permitir si el usuario es dueño de la tarea relacionada
CREATE POLICY "Allow owners to manage AI usage on tasks" ON tareas_ai_uso FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM tareas
        WHERE id = tareas_ai_uso.tarea_id
            AND (
                owner_user_id = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM proyectos_maestros
                    WHERE id = tareas.proyecto_id
                        AND owner_user_id = auth.uid()
                )
            )
    )
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM tareas
        WHERE id = tareas_ai_uso.tarea_id
            AND (
                owner_user_id = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM proyectos_maestros
                    WHERE id = tareas.proyecto_id
                        AND owner_user_id = auth.uid()
                )
            )
    )
);