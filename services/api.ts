
import { supabase } from './supabaseClient';
import { dbLocal } from './dexieDb'; // Usamos Dexie en lugar de Axios/Backend
import { 
    ProyectoMaestro, 
    Tarea, 
    RegistroFinanzas, 
    InventarioActivo, 
    AIDirectory
} from '../types';

// ==============================================================================
// 1. SERVICES PARA DATOS "CLOUD ONLY" (Proyectos, Inventario, AI)
//    - Se conectan directo a Supabase.
// ==============================================================================

export const ProjectsAPI = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('proyectos_maestros')
            .select('*')
            .order('ultima_actualizacion', { ascending: false });
        if (error) throw error;
        return data as ProyectoMaestro[];
    },

    getById: async (id: number) => {
        const { data, error } = await supabase
            .from('proyectos_maestros')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as ProyectoMaestro;
    },

    createWithBudget: async (
        nombre_proyecto: string, 
        tipo_activo: string, 
        presupuesto_asignado: number
    ) => {
        const { data, error } = await supabase.rpc('crear_proyecto_con_presupuesto', {
            p_nombre_proyecto: nombre_proyecto,
            p_tipo_activo: tipo_activo,
            p_presupuesto: presupuesto_asignado
        });
        if (error) throw error;

        // LOCAL SYNC UPDATE:
        // Automatically create the initial task locally so it appears immediately
        // The Cloud RPC already created it in Postgres, but we are in "Local-First" mode for tasks.
        if (data && data.id) {
            await dbLocal.tasks.add({
                proyecto_id: data.id,
                titulo_tarea: 'Configuración Inicial del Proyecto',
                estado: 'Por Hacer',
                prioridad: 'Alta',
                sync_status: 'synced' // It's already in the cloud via the RPC
            });
        }

        return data; 
    },

    update: async (id: number, updates: Partial<ProyectoMaestro>) => {
        const { data, error } = await supabase
            .from('proyectos_maestros')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data as ProyectoMaestro;
    },

    delete: async (id: number) => {
        const { error } = await supabase.from('proyectos_maestros').delete().eq('id', id);
        if (error) throw error;
    }
};

export const InventoryAPI = {
    getAll: async () => {
        const { data, error } = await supabase.from('inventario_activos').select('*');
        if (error) throw error;
        return data as InventarioActivo[];
    }
};

export const AIMarketplaceAPI = {
    getAll: async () => {
        const { data, error } = await supabase.from('ai_directory').select('*');
        if (error) throw error;
        return data as AIDirectory[];
    }
};


// ==============================================================================
// 2. SERVICES PARA DATOS "LOCAL FIRST" (Tareas, Finanzas)
//    - Usan Dexie.js (IndexedDB) para almacenamiento local instantáneo.
// ==============================================================================

export const TasksAPI = {
    getAllByProject: async (proyecto_id: number) => {
        // Leemos de Dexie Local
        const tasks = await dbLocal.tasks
            .where('proyecto_id')
            .equals(proyecto_id)
            .toArray();
        return tasks as unknown as Tarea[];
    },

    create: async (task: Omit<Tarea, 'id' | 'ultima_actualizacion'>) => {
        // Guardamos en Dexie Local
        const id = await dbLocal.tasks.add({
            ...task,
            sync_status: 'pending' // Flag para futura sincro
        } as any);
        return { ...task, id } as Tarea;
    },

    update: async (id: number, updates: Partial<Tarea>) => {
        await dbLocal.tasks.update(id, updates);
        return { id, ...updates } as Tarea;
    },

    delete: async (id: number) => {
        await dbLocal.tasks.delete(id);
    }
};

export const FinanceAPI = {
    getAllByProject: async (proyecto_id: number) => {
        const items = await dbLocal.finance
            .where('proyecto_id')
            .equals(proyecto_id)
            .toArray();
        return items as unknown as RegistroFinanzas[];
    },

    create: async (transaction: Omit<RegistroFinanzas, 'id'>) => {
        const id = await dbLocal.finance.add({
            ...transaction,
            sync_status: 'pending'
        } as any);
        return { ...transaction, id } as RegistroFinanzas;
    },

    delete: async (id: number) => {
        await dbLocal.finance.delete(id);
    }
};

export const FinanceCategoriesAPI = {
    getAll: async () => {
        return await dbLocal.categories.toArray();
    },
    create: async (category: { name: string, type: 'Income' | 'Expense' }) => {
        const id = await dbLocal.categories.add(category);
        return { ...category, id };
    },
    delete: async (id: number) => {
        await dbLocal.categories.delete(id);
    }
};

export const AccountsPayableAPI = {
    getAll: async () => {
        return await dbLocal.accounts_payable.orderBy('due_date').toArray();
    },
    create: async (item: any) => {
        const id = await dbLocal.accounts_payable.add({ ...item, sync_status: 'pending' });
        return { ...item, id };
    },
    update: async (id: number, updates: any) => {
        await dbLocal.accounts_payable.update(id, updates);
        return { id, ...updates };
    },
    delete: async (id: number) => {
        await dbLocal.accounts_payable.delete(id);
    }
};

export const AccountsReceivableAPI = {
    getAll: async () => {
        return await dbLocal.accounts_receivable.orderBy('due_date').toArray();
    },
    create: async (item: any) => {
        const id = await dbLocal.accounts_receivable.add({ ...item, sync_status: 'pending' });
        return { ...item, id };
    },
    update: async (id: number, updates: any) => {
        await dbLocal.accounts_receivable.update(id, updates);
        return { id, ...updates };
    },
    delete: async (id: number) => {
        await dbLocal.accounts_receivable.delete(id);
    }
};
