
import { supabase } from './supabaseClient';
import { dbLocal } from './dexieDb'; // Usamos Dexie en lugar de Axios/Backend
import { 
    ProyectoMaestro, 
    Tarea, 
    RegistroFinanzas, 
    InventarioActivo, 
    AIDirectory,
    CreativeArtifact,
    FolderItem
} from '../types';

// ==============================================================================
// HYBRID API ROUTER
// Based on "Hybrid Database Implementation Prompt"
//
// 1. Projects (Bi-directional): Cloud is Master, Local is Cache/Work.
// 2. Tasks/Finance (Uni-directional Write): Local -> Cloud.
// 3. Inventory/AI (Uni-directional Read): Cloud -> Local.
// ==============================================================================
// 1. SERVICES PARA DATOS "MAESTROS" (Proyectos, Inventario, AI Tools)
//    - Router local: Lee de Dexie (rápido). Escribe en Dexie y en cola de Sync.
// ==============================================================================

import { SyncService } from './syncService';

export const ProjectsAPI = {
    getAll: async () => {
        // Router: Bi-directional Read (Priority Local + Background Sync)
        SyncService.syncProjects(); // Trigger sync
        const projects = await dbLocal.projects.toArray();
        return projects as unknown as ProyectoMaestro[];
    },

    getById: async (id: string) => {
        // Router: Cache-First
        const project = await dbLocal.projects.get(id);
        if (project) {
             return project as unknown as ProyectoMaestro;
        } else {
             // Fallback to Cloud if not local (e.g. fresh device)
             const { data, error } = await supabase
                .from('proyectos_maestros')
                .select('*')
                .eq('id', id)
                .single();
             
             if (error || !data) throw new Error("Project not found");
             
             // Cache it
             await dbLocal.projects.add({ ...data, sync_status: 'synced' });
             
             return data as unknown as ProyectoMaestro;
        }
    },

    createWithBudget: async (nombre_proyecto: string, tipo_activo: string, presupuesto_asignado: number) => {
        // Router: Create Bi-directional (Start Local for speed, then Sync)
        
        // 1. Write Local
        const localResult = await dbLocal.transaction('rw', [dbLocal.projects, dbLocal.tasks, dbLocal.finance], async () => {
            const now = new Date().toISOString();
            const projectId = crypto.randomUUID(); // Generate UUID locally!
            
            await dbLocal.projects.add({
                id: projectId,
                nombre_proyecto, tipo_activo, presupuesto_asignado,
                gastos_acumulados: 0, progreso_total: 0,
                fecha_creacion: now, ultima_actualizacion: now,
                sync_status: 'pending'
            });
            
            // Auto-create initial task
            const taskId = crypto.randomUUID();
            await dbLocal.tasks.add({
                id: taskId,
                proyecto_id: projectId,
                titulo_tarea: 'Configuración Inicial del Proyecto',
                estado: 'Por Hacer',
                prioridad: 'Alta',
                ultima_actualizacion: now,
                sync_status: 'pending'
            } as any);

            return { id: projectId, nombre_proyecto, tipo_activo, presupuesto_asignado } as ProyectoMaestro;
        });

        // 2. Trigger Background Sync
        SyncService.syncProjects(); 
        SyncService.pushExecutionData(); // For the initial task

        return localResult;
    },

    update: async (id: string, updates: Partial<ProyectoMaestro>) => {
        await dbLocal.projects.update(id, { ...updates, sync_status: 'pending' });
        SyncService.syncProjects();
        return await dbLocal.projects.get(id) as unknown as ProyectoMaestro;
    },

    delete: async (id: string) => {
        // Delete Local
        await dbLocal.projects.delete(id);
        // Also Delete Cloud (Best effort)
        try { 
            await supabase.from('proyectos_maestros').delete().eq('id', id); 
            // Also trigger sync to be safe, though delete is direct here
            SyncService.syncProjects();
        } catch(e) {}
    }
};

export const InventoryAPI = {
    getAll: async () => {
        // Router: Uni-directional Read (Cloud -> Local)
        // Strategy: Return Local (Fast), Pull Cloud (Update)
        SyncService.pullReferenceData(); // Background
        const data = await dbLocal.inventory.toArray();
        return data as unknown as InventarioActivo[];
    }
};

export const AIMarketplaceAPI = {
    getAll: async () => {
        // Router: Uni-directional Read (Cloud -> Local)
        SyncService.pullReferenceData(); // Background
        const data = await dbLocal.ai_tools.toArray();
        return data as unknown as AIDirectory[];
    }
};


// ==============================================================================
// 2. SERVICES PARA DATOS "LOCAL FIRST" (Tareas, Finanzas)
//    - Usan Dexie.js (IndexedDB) para almacenamiento local instantáneo.
// ==============================================================================

export const TasksAPI = {
    getAllByProject: async (proyecto_id: string) => {
        // Leemos de Dexie Local
        const tasks = await dbLocal.tasks
            .where('proyecto_id')
            .equals(proyecto_id)
            .toArray();
        return tasks as unknown as Tarea[];
    },

    create: async (task: Omit<Tarea, 'id' | 'ultima_actualizacion'>) => {
        // Router: Write Local -> Push Cloud
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        
        await dbLocal.tasks.add({
            ...task,
            id: newId,
            ultima_actualizacion: now,
            sync_status: 'pending'
        } as any);
        
        SyncService.pushExecutionData(); // Trigger Sync
        
        return { ...task, id: newId, ultima_actualizacion: now } as Tarea;
    },

    update: async (id: string, updates: Partial<Tarea>) => {
        await dbLocal.tasks.update(id, { ...updates, sync_status: 'pending' });
        SyncService.pushExecutionData(); // Trigger Sync
        return { id, ...updates } as Tarea;
    },

    delete: async (id: string) => {
        await dbLocal.tasks.delete(id);
        // Optimistic delete from cloud too if needed, or handle in sync
         try { await supabase.from('tareas').delete().eq('id', id); } catch(e) {}
    }
};

export const FinanceAPI = {
    getAllByProject: async (proyecto_id: string) => {
        const items = await dbLocal.finance
            .where('proyecto_id')
            .equals(proyecto_id)
            .toArray();
        return items as unknown as RegistroFinanzas[];
    },

    getAll: async () => {
        const items = await dbLocal.finance.toArray();
        return items as unknown as RegistroFinanzas[];
    },

    create: async (transaction: Omit<RegistroFinanzas, 'id'>) => {
        const newId = crypto.randomUUID();
        await dbLocal.finance.add({
            ...transaction,
            id: newId,
            sync_status: 'pending'
        } as any);
        SyncService.pushExecutionData();
        return { ...transaction, id: newId } as RegistroFinanzas;
    },

    update: async (id: string, updates: Partial<RegistroFinanzas>) => {
        await dbLocal.finance.update(id, { ...updates, sync_status: 'pending' });
        SyncService.pushExecutionData();
        return { id, ...updates } as RegistroFinanzas;
    },

    delete: async (id: string) => {
        await dbLocal.finance.delete(id);
         try { await supabase.from('registro_finanzas').delete().eq('id', id); } catch(e) {}
    }
};

export const FinanceCategoriesAPI = {
    getAll: async () => {
        return await dbLocal.categories.toArray();
    },
    create: async (category: { name: string, type: 'Income' | 'Expense' }) => {
        const id = await dbLocal.categories.add(category as any);
        SyncService.pushExecutionData();
        return { ...category, id: id.toString() };
    },
    delete: async (id: any) => { 
        await dbLocal.categories.delete(Number(id) || id);
        // Deleting from cloud logic for categories - complex if ID mismatch. Skip for now or try name?
    }
};

export const AccountsPayableAPI = {
    getAll: async () => {
        return await dbLocal.accounts_payable.orderBy('due_date').toArray();
    },
    create: async (item: any) => {
        const id = await dbLocal.accounts_payable.add({ ...item, sync_status: 'pending' });
        SyncService.pushExecutionData();
        return { ...item, id };
    },
    update: async (id: any, updates: any) => {
        await dbLocal.accounts_payable.update(id, updates);
        SyncService.pushExecutionData();
        return { id, ...updates };
    },
    delete: async (id: any) => {
        await dbLocal.accounts_payable.delete(id);
        SyncService.pushExecutionData();
    }
};

export const AccountsReceivableAPI = {
    getAll: async () => {
        return await dbLocal.accounts_receivable.orderBy('due_date').toArray();
    },
    create: async (item: any) => {
        const id = await dbLocal.accounts_receivable.add({ ...item, sync_status: 'pending' });
        SyncService.pushExecutionData();
        return { ...item, id };
    },
    update: async (id: any, updates: any) => {
        await dbLocal.accounts_receivable.update(id, updates);
        SyncService.pushExecutionData();
        return { id, ...updates };
    },
    delete: async (id: any) => {
        await dbLocal.accounts_receivable.delete(id);
        SyncService.pushExecutionData();
    }
};

export const CreativeArtifactsAPI = {
    getAll: async () => {
        return await dbLocal.creative_artifacts.toArray();
    },
    create: async (item: Omit<CreativeArtifact, 'id'>) => {
        const newId = crypto.randomUUID();
        await dbLocal.creative_artifacts.add({ ...item, id: newId, sync_status: 'pending' } as any);
        SyncService.pushExecutionData();
        return { ...item, id: newId } as CreativeArtifact;
    },
    update: async (id: string, updates: Partial<CreativeArtifact>) => {
        await dbLocal.creative_artifacts.update(id, { ...updates, sync_status: 'pending' } as any);
        SyncService.pushExecutionData();
        return { id, ...updates };
    },
    delete: async (id: string) => {
        await dbLocal.creative_artifacts.delete(id);
        try { await supabase.from('creative_artifacts').delete().eq('id', id); } catch(e) {}
    }
};

export const FolderItemsAPI = {
    getAll: async () => {
        return await dbLocal.folder_items.toArray();
    },
    create: async (item: Omit<FolderItem, 'id'>) => {
        const newId = crypto.randomUUID();
        // Ensure updatedAt is string for Dexie storage
        const itemToStore = {
            ...item,
            id: newId,
            updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
            sync_status: 'pending'
        };
        await dbLocal.folder_items.add(itemToStore as any); 
        SyncService.pushExecutionData();
        return { ...item, id: newId } as FolderItem;
    },
    update: async (id: string, updates: Partial<FolderItem>) => {
         await dbLocal.folder_items.update(id, { ...updates, sync_status: 'pending' } as any);
         SyncService.pushExecutionData();
         return { id, ...updates };
    },
    delete: async (id: string) => {
        await dbLocal.folder_items.delete(id);
        try { await supabase.from('folder_items').delete().eq('id', id); } catch(e) {}
    }
};
