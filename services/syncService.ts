
import { supabase } from './supabaseClient';
import { dbLocal, LocalProject, LocalTask, LocalFinance, LocalInventory, LocalAITool } from './dexieDb';
import { ProyectoMaestro, Tarea, RegistroFinanzas, InventarioActivo, AIDirectory } from '../types';

export const SyncService = {
    // ------------------------------------------------------------------
    // PROJECTS (Bi-directional)
    // ------------------------------------------------------------------
    syncProjects: async () => {
        try {
            // 1. PUSH: Send pending local projects to Cloud
            const pendingProjects = await dbLocal.projects.where('sync_status').equals('pending').toArray();
            for (const p of pendingProjects) {
                const { sync_status, ...projectData } = p;
                
                // UUIDs are pre-generated locally, so we just upsert.
                const { data, error } = await supabase.from('proyectos_maestros').upsert(projectData as any).select().single();
                
                if (!error) {
                    await dbLocal.projects.update(p.id, { sync_status: 'synced' });
                } else {
                    console.error("Sync PUSH Error:", error);
                }
            }

            // 2. PULL: Get latest from Cloud
            const { data: cloudProjects, error } = await supabase.from('proyectos_maestros').select('*');
            if (!error && cloudProjects) {
                await dbLocal.transaction('rw', dbLocal.projects, async () => {
                    for (const cp of cloudProjects) {
                        const existing = await dbLocal.projects.get(cp.id);
                        if (existing) {
                            // Update existing
                            await dbLocal.projects.put({ ...existing, ...cp, sync_status: 'synced' });
                        } else {
                            // Insert new
                            await dbLocal.projects.add({ ...cp, sync_status: 'synced' });
                        }
                    }
                });
            }
        } catch (e) {
            console.error("Sync Projects Error:", e);
        }
    },

    // ------------------------------------------------------------------
    // TASKS & FINANCE (Local -> Cloud)
    // ------------------------------------------------------------------
    pushExecutionData: async () => {
        try {
            // TASKS
            const pendingTasks = await dbLocal.tasks.where('sync_status').equals('pending').toArray();
            for (const t of pendingTasks) {
                const { sync_status, ...taskData } = t;
                const { error } = await supabase.from('tareas').upsert(taskData as any);
                if (!error) {
                    await dbLocal.tasks.update(t.id, { sync_status: 'synced' });
                }
            }

            // FINANCE
            const pendingFinance = await dbLocal.finance.where('sync_status').equals('pending').toArray();
            for (const f of pendingFinance) {
                const { sync_status, ...finData } = f;
                const { error } = await supabase.from('registro_finanzas').upsert(finData as any);
                if (!error) {
                    await dbLocal.finance.update(f.id, { sync_status: 'synced' });
                }
            }
        } catch (e) {
            console.error("Sync Execution Data Error:", e);
        }
    },

    // ------------------------------------------------------------------
    // INVENTORY & AI (Cloud -> Local)
    // ------------------------------------------------------------------
    pullReferenceData: async () => {
        try {
            // INVENTORY
            const { data: inventory } = await supabase.from('inventario_activos').select('*');
            if (inventory) {
                await dbLocal.transaction('rw', dbLocal.inventory, async () => {
                    await dbLocal.inventory.clear(); // Simple strategy: Replace all
                    await dbLocal.inventory.bulkAdd(inventory.map(i => ({...i, sync_status: 'synced'})));
                });
            }

            // AI DIRECTORY
            const { data: aiTools } = await supabase.from('ai_directory').select('*');
            if (aiTools) {
                await dbLocal.transaction('rw', dbLocal.ai_tools, async () => {
                    await dbLocal.ai_tools.clear();
                    await dbLocal.ai_tools.bulkAdd(aiTools.map(t => ({...t, sync_status: 'synced'})));
                });
            }
        } catch (e) {
            console.error("Sync Reference Data Error:", e);
        }
    },

    // ------------------------------------------------------------------
    // REALTIME SUBSCRIPTION
    // ------------------------------------------------------------------
    initRealtime: (onChange: (table: string) => void) => {
        console.log("Initializing Realtime Subscription...");
        const channel = supabase.channel('db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                async (payload) => {
                    console.log('Realtime Event received:', payload);
                    await SyncService.handleRealtimeEvent(payload);
                    onChange(payload.table);
                }
            )
            .subscribe((status) => {
                console.log("Realtime Subscription Status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    },

    handleRealtimeEvent: async (payload: any) => {
        const { table, eventType, new: newRecord, old: oldRecord } = payload;
        
        try {
            switch (table) {
                case 'proyectos_maestros':
                    if (eventType === 'DELETE') await dbLocal.projects.delete(oldRecord.id);
                    else await dbLocal.projects.put({ ...newRecord, sync_status: 'synced' });
                    break;
                case 'tareas':
                    if (eventType === 'DELETE') await dbLocal.tasks.delete(oldRecord.id);
                    else await dbLocal.tasks.put({ ...newRecord, sync_status: 'synced' });
                    break;
                case 'registro_finanzas':
                    if (eventType === 'DELETE') await dbLocal.finance.delete(oldRecord.id);
                    else await dbLocal.finance.put({ ...newRecord, sync_status: 'synced' });
                    break;
                case 'accounts_payable':
                    if (eventType === 'DELETE') await dbLocal.accounts_payable.delete(oldRecord.id);
                    else await dbLocal.accounts_payable.put({ ...newRecord, sync_status: 'synced' });
                    break;
                case 'accounts_receivable':
                    if (eventType === 'DELETE') await dbLocal.accounts_receivable.delete(oldRecord.id);
                    else await dbLocal.accounts_receivable.put({ ...newRecord, sync_status: 'synced' });
                    break;
                case 'creative_artifacts':
                    if (eventType === 'DELETE') await dbLocal.creative_artifacts.delete(oldRecord.id);
                    else await dbLocal.creative_artifacts.put({ ...newRecord, sync_status: 'synced' }); // Assuming compatible
                    break;
                case 'folder_items':
                    if (eventType === 'DELETE') await dbLocal.folder_items.delete(oldRecord.id);
                    else await dbLocal.folder_items.put({ ...newRecord, sync_status: 'synced' });
                    break;
                // Add reference tables if needed
                case 'inventario_activos':
                    if (eventType === 'DELETE') await dbLocal.inventory.delete(oldRecord.id);
                    else await dbLocal.inventory.put({ ...newRecord, sync_status: 'synced' });
                    break;
                case 'ai_directory':
                    if (eventType === 'DELETE') await dbLocal.ai_tools.delete(oldRecord.id);
                    else await dbLocal.ai_tools.put({ ...newRecord, sync_status: 'synced' });
                    break;
            }
        } catch (e) {
            console.error("Error handling realtime event:", e);
        }
    }
};
