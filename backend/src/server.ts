
import express from 'express';
import cors from 'cors';
import { poolLocal, supabaseCloud } from './config/db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ==================================================================
// ROUTER: HYBRID DATABASE ARCHITECTURE
// ==================================================================

// 1. CLOUD ROUTES (Projects, Inventory, AI) -> Supabase
// ------------------------------------------------------------------

app.get('/api/cloud/projects', async (req, res) => {
    // Read from CLOUD
    const { data, error } = await supabaseCloud
        .from('proyectos_maestros')
        .select('*')
        .order('ultima_actualizacion', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Create Project (Master Data -> Cloud)
app.post('/api/cloud/projects', async (req, res) => {
    const { nombre_proyecto, tipo_activo, presupuesto_asignado } = req.body;
    const { data, error } = await supabaseCloud.rpc('crear_proyecto_con_presupuesto', {
        p_nombre_proyecto: nombre_proyecto,
        p_tipo_activo: tipo_activo,
        p_presupuesto: presupuesto_asignado
    });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.put('/api/cloud/projects/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabaseCloud
        .from('proyectos_maestros')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.delete('/api/cloud/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseCloud
        .from('proyectos_maestros')
        .delete()
        .eq('id', id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});


// 2. LOCAL ROUTES (Tasks, Finance) -> Local PostgreSQL
// ------------------------------------------------------------------

app.get('/api/local/tasks', async (req, res) => {
    // Read from LOCAL
    const { projectId } = req.query;
    try {
        const result = await poolLocal.query(
            'SELECT * FROM tareas WHERE proyecto_id = $1 ORDER BY fecha_vencimiento ASC', 
            [projectId]
        );
        res.json(result.rows);
    } catch (err: any) {
        console.warn("Local DB connection failed. Failover to Cloud? (Not implemented in this demo)");
        res.status(500).json({ error: "Local DB Error: " + err.message });
    }
});

app.post('/api/local/tasks', async (req, res) => {
    // Write to LOCAL
    const { proyecto_id, titulo_tarea, estado, prioridad, fecha_vencimiento } = req.body;
    try {
        const result = await poolLocal.query(
            `INSERT INTO tareas (proyecto_id, titulo_tarea, estado, prioridad, fecha_vencimiento)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [proyecto_id, titulo_tarea, estado, prioridad, fecha_vencimiento]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/local/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    // Dynamic query builder would be better, but simple for now
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    
    try {
        const result = await poolLocal.query(
            `UPDATE tareas SET ${setClause}, ultima_actualizacion = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/local/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await poolLocal.query('DELETE FROM tareas WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/local/finance', async (req, res) => {
    const { projectId } = req.query;
    try {
        const result = await poolLocal.query(
            'SELECT * FROM registro_finanzas WHERE proyecto_id = $1 ORDER BY fecha_transaccion DESC',
            [projectId]
        );
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: "Local DB Error: " + err.message });
    }
});

app.post('/api/local/finance', async (req, res) => {
    const { proyecto_id, concepto, tipo_transaccion, monto, categoria, fecha_transaccion } = req.body;
    try {
        const result = await poolLocal.query(
            `INSERT INTO registro_finanzas (proyecto_id, concepto, tipo_transaccion, monto, categoria, fecha_transaccion)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [proyecto_id, concepto, tipo_transaccion, monto, categoria, fecha_transaccion]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/local/finance/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await poolLocal.query('DELETE FROM registro_finanzas WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Hybrid Database Router running on port ${PORT}`);
    console.log(`- Local Ops: /api/local/*`);
    console.log(`- Cloud Ops: /api/cloud/*`);
});
