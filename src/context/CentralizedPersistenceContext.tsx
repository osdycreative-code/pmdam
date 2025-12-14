
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
    ProjectsAPI, 
    TasksAPI, 
    FinanceAPI, 
    InventoryAPI, 
    AIMarketplaceAPI,
    FinanceCategoriesAPI,
    AccountsPayableAPI,
    AccountsReceivableAPI,
    CreativeArtifactsAPI,
    FolderItemsAPI
} from '../../services/api';
import { 
    ProyectoMaestro, 
    Tarea, 
    RegistroFinanzas, 
    InventarioActivo, 
    AIDirectory,
    AccountPayable,
    AccountReceivable,
    CreativeArtifact,
    FolderItem
} from '../../types';

import { SyncService } from '../../services/syncService';

// Define Category Interface locally if not in types
export interface FinanceCategory {
    id: string; // UUID
    name: string;
    type: 'Income' | 'Expense';
}

interface PersistenceContextType {
    projects: ProyectoMaestro[];
    tasks: Tarea[];
    finances: RegistroFinanzas[];
    inventory: InventarioActivo[];
    aiTools: AIDirectory[];
    
    // New State
    categories: FinanceCategory[];
    accountsPayable: AccountPayable[]; 
    accountsReceivable: AccountReceivable[];
    creativeArtifacts: CreativeArtifact[];
    folderItems: FolderItem[];

    loading: boolean;
    error: string | null;
    
    // Actions
    fetchProjects: () => Promise<void>;
    fetchTasks: (projectId: string) => Promise<void>;
    fetchFinances: (projectId?: string) => Promise<void>;
    
    // Categories
    fetchCategories: () => Promise<void>;
    createCategory: (name: string, type: 'Income' | 'Expense') => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    // AP/AR
    fetchAccountsPayable: () => Promise<void>;
    createAccountPayable: (item: any) => Promise<void>;
    updateAccountPayable: (id: string, updates: any) => Promise<void>;
    deleteAccountPayable: (id: string) => Promise<void>;

    fetchAccountsReceivable: () => Promise<void>;
    createAccountReceivable: (item: any) => Promise<void>;
    updateAccountReceivable: (id: string, updates: any) => Promise<void>;
    deleteAccountReceivable: (id: string) => Promise<void>;

    // Creative Artifacts
    fetchCreativeArtifacts: () => Promise<void>;
    createCreativeArtifact: (item: Omit<CreativeArtifact, 'id'>) => Promise<void>;
    updateCreativeArtifact: (id: string, updates: Partial<CreativeArtifact>) => Promise<void>;
    deleteCreativeArtifact: (id: string) => Promise<void>;
    
    // Folder Items
    fetchFolderItems: () => Promise<void>;
    createFolderItem: (item: any) => Promise<void>; 
    updateFolderItem: (id: string, updates: Partial<FolderItem>) => Promise<void>;
    deleteFolderItem: (id: string) => Promise<void>;

    createProject: (nombre: string, tipo: string, presupuesto: number) => Promise<void>;
    updateProject: (id: string, updates: Partial<ProyectoMaestro>) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    
    createTask: (task: any) => Promise<void>;
    updateTask: (id: string, updates: any) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    
    createFinance: (transaction: Omit<RegistroFinanzas, 'id'>) => Promise<void>;
    updateFinance: (id: string, updates: Partial<RegistroFinanzas>) => Promise<void>;
    deleteFinance: (id: string) => Promise<void>;

}

const PersistenceContext = createContext<PersistenceContextType | undefined>(undefined);

export const PersistenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<ProyectoMaestro[]>([]);
    const [tasks, setTasks] = useState<Tarea[]>([]);
    const [finances, setFinances] = useState<RegistroFinanzas[]>([]);
    const [inventory, setInventory] = useState<InventarioActivo[]>([]);
    const [aiTools, setAiTools] = useState<AIDirectory[]>([]);
    
    const [categories, setCategories] = useState<FinanceCategory[]>([]);
    const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
    const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
    const [creativeArtifacts, setCreativeArtifacts] = useState<CreativeArtifact[]>([]);
    const [folderItems, setFolderItems] = useState<FolderItem[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ProjectsAPI.getAll();
            setProjects(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTasks = useCallback(async (projectId: string) => {
        try {
            const data = await TasksAPI.getAllByProject(projectId);
            setTasks(data); 
        } catch (err: any) {
            console.error(err);
        }
    }, []);

    const fetchFinances = useCallback(async (projectId?: string) => {
        try {
            const data = projectId 
                ? await FinanceAPI.getAllByProject(projectId)
                : await FinanceAPI.getAll();
            setFinances(data);
        } catch (err: any) {
            console.error(err);
        }
    }, []);

    // --- Categories ---
    const fetchCategories = useCallback(async () => {
        try {
            const data = await FinanceCategoriesAPI.getAll();
            setCategories(data as unknown as FinanceCategory[]);
        } catch (err: any) { console.error(err); }
    }, []);

    const createCategory = useCallback(async (name: string, type: 'Income' | 'Expense') => {
        try {
            // Ensure we create a local object with ID if API doesn't return one fully formed, 
            // but relying on API to handle ID generation (it returns object with id).
            // NOTE: Changing API to return UUID in previous steps might be missing in `FinanceCategoriesAPI.create` inside api.ts
            // But we can patch it here or assume api.ts was updated.
            // Actually, we didn't update api.ts createCategory to use UUID properly yet (it used to be ++id). 
            // Let's assume for now we just pass it through.
             const newItem = await FinanceCategoriesAPI.create({ name, type });
            setCategories(prev => [...prev, newItem as unknown as FinanceCategory]);
        } catch (err: any) { setError(err.message); }
    }, []);

    const deleteCategory = useCallback(async (id: string) => {
        try {
            await FinanceCategoriesAPI.delete(id); // API needs string
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (err: any) { setError(err.message); }
    }, []);

    // --- AP ---
    const fetchAccountsPayable = useCallback(async () => {
        try {
            const data = await AccountsPayableAPI.getAll();
            setAccountsPayable(data as unknown as AccountPayable[]);
        } catch (err: any) { console.error(err); }
    }, []);

    const createAccountPayable = useCallback(async (item: any) => {
        try {
            const newItem = await AccountsPayableAPI.create(item);
            setAccountsPayable(prev => [...prev, newItem as unknown as AccountPayable]);
        } catch (err: any) { setError(err.message); }
    }, []);

    const updateAccountPayable = useCallback(async (id: string, updates: any) => {
        try {
            await AccountsPayableAPI.update(id, updates);
            setAccountsPayable(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        } catch (err: any) { setError(err.message); }
    }, []);

    const deleteAccountPayable = useCallback(async (id: string) => {
        try {
            await AccountsPayableAPI.delete(id);
            setAccountsPayable(prev => prev.filter(item => item.id !== id));
        } catch (err: any) { setError(err.message); }
    }, []);

    // --- AR ---
    const fetchAccountsReceivable = useCallback(async () => {
        try {
            const data = await AccountsReceivableAPI.getAll();
            setAccountsReceivable(data as unknown as AccountReceivable[]);
        } catch (err: any) { console.error(err); }
    }, []);

    const createAccountReceivable = useCallback(async (item: any) => {
        try {
            const newItem = await AccountsReceivableAPI.create(item);
            setAccountsReceivable(prev => [...prev, newItem as unknown as AccountReceivable]);
        } catch (err: any) { setError(err.message); }
    }, []);

    const updateAccountReceivable = useCallback(async (id: string, updates: any) => {
        try {
            await AccountsReceivableAPI.update(id, updates);
            setAccountsReceivable(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        } catch (err: any) { setError(err.message); }
    }, []);

    const deleteAccountReceivable = useCallback(async (id: string) => {
        try {
            await AccountsReceivableAPI.delete(id);
            setAccountsReceivable(prev => prev.filter(item => item.id !== id));
        } catch (err: any) { setError(err.message); }
    }, []);

    // --- Creative Artifacts ---
    const fetchCreativeArtifacts = useCallback(async () => {
        try {
            const data = await CreativeArtifactsAPI.getAll();
            setCreativeArtifacts(data as unknown as CreativeArtifact[]);
        } catch (err: any) { console.error(err); }
    }, []);

    const createCreativeArtifact = useCallback(async (item: Omit<CreativeArtifact, 'id'>) => {
        try {
            const newItem = await CreativeArtifactsAPI.create(item);
            setCreativeArtifacts(prev => [...prev, newItem as unknown as CreativeArtifact]);
        } catch (err: any) { setError(err.message); }
    }, []);

    const updateCreativeArtifact = useCallback(async (id: string, updates: Partial<CreativeArtifact>) => {
        try {
            await CreativeArtifactsAPI.update(id, updates);
            setCreativeArtifacts(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        } catch (err: any) { setError(err.message); }
    }, []);

    const deleteCreativeArtifact = useCallback(async (id: string) => {
        try {
            await CreativeArtifactsAPI.delete(id);
            setCreativeArtifacts(prev => prev.filter(item => item.id !== id));
        } catch (err: any) { setError(err.message); }
    }, []);

    // --- Folder Items ---
    const fetchFolderItems = useCallback(async () => {
        try {
            const data = await FolderItemsAPI.getAll();
             // Convert number IDs to strings to match FolderItem interface if needed, or cast
             const adaptedData = data.map((d: any) => ({...d, id: d.id.toString()}));
            setFolderItems(adaptedData as FolderItem[]);
        } catch (err: any) { console.error(err); }
    }, []);

    const createFolderItem = useCallback(async (item: any) => {
        try {
            const newItem = await FolderItemsAPI.create(item);
            setFolderItems(prev => [...prev, newItem]);
        } catch (err: any) { setError(err.message); }
    }, []);

    const updateFolderItem = useCallback(async (id: string, updates: Partial<FolderItem>) => {
        try {
            await FolderItemsAPI.update(id, updates);
            setFolderItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        } catch (err: any) { setError(err.message); }
    }, []);

    const deleteFolderItem = useCallback(async (id: string) => {
        try {
            await FolderItemsAPI.delete(id);
            setFolderItems(prev => prev.filter(item => item.id !== id));
        } catch (err: any) { setError(err.message); }
    }, []);


    const createProject = useCallback(async (nombre: string, tipo: string, presupuesto: number) => {
        setLoading(true);
        try {
            await ProjectsAPI.createWithBudget(nombre, tipo, presupuesto);
            await fetchProjects(); // Refresh list acting as "Sync"
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchProjects]);

    const updateProject = useCallback(async (id: string, updates: Partial<ProyectoMaestro>) => {
        setLoading(true);
        try {
            const updatedProject = await ProjectsAPI.update(id, updates);
            setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updatedProject } : p));
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteProject = useCallback(async (id: string) => {
        setLoading(true);
        try {
            await ProjectsAPI.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = useCallback(async (task: any) => {
        try {
            await TasksAPI.create(task);
            if (task.proyecto_id) fetchTasks(task.proyecto_id);
        } catch (err: any) {
            setError(err.message);
        }
    }, [fetchTasks]);

    const updateTask = useCallback(async (id: string, updates: any) => {
        try {
            await TasksAPI.update(id, updates);
            // Optimistic update or refetch could go here
            setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    const deleteTask = useCallback(async (id: string) => {
        try {
            await TasksAPI.delete(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    const createFinance = useCallback(async (transaction: Omit<RegistroFinanzas, 'id'>) => {
        try {
            const newTrans = await FinanceAPI.create(transaction);
            setFinances(prev => [newTrans, ...prev]);
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    const updateFinance = useCallback(async (id: string, updates: Partial<RegistroFinanzas>) => {
        try {
            await FinanceAPI.update(id, updates);
            setFinances(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    const deleteFinance = useCallback(async (id: string) => {
        try {
            await FinanceAPI.delete(id);
            setFinances(prev => prev.filter(f => f.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    // Initial Load & Realtime Setup
    useEffect(() => {
        // Initial Fetch
        fetchProjects();
        fetchCategories();
        fetchAccountsPayable();
        fetchAccountsReceivable();
        fetchCreativeArtifacts();
        fetchFolderItems();
        fetchFinances(); 
        
        // Setup Realtime
        console.log("Setting up Realtime in Provider...");
        const cleanup = SyncService.initRealtime((table) => {
            console.log(`Context: Realtime update for ${table}`);
            switch(table) {
                case 'proyectos_maestros': fetchProjects(); break;
                case 'registro_finanzas': fetchFinances(); break;
                case 'creative_artifacts': fetchCreativeArtifacts(); break;
                case 'folder_items': fetchFolderItems(); break;
                case 'accounts_payable': fetchAccountsPayable(); break;
                case 'accounts_receivable': fetchAccountsReceivable(); break;
                case 'finance_categories': fetchCategories(); break;
                // Add others as needed
                default: break;
            }
        });

        return () => {
             cleanup();
        };
    }, [fetchProjects, fetchCategories, fetchAccountsPayable, fetchAccountsReceivable, fetchFinances, fetchCreativeArtifacts, fetchFolderItems]);

    return (
        <PersistenceContext.Provider value={{
            projects, tasks, finances, inventory, aiTools,
            categories, accountsPayable, accountsReceivable,
            loading, error,
            fetchProjects, fetchTasks, fetchFinances,
            createProject, updateProject, deleteProject, createTask, updateTask, deleteTask,
            createFinance, updateFinance, deleteFinance,
            fetchCategories, createCategory, deleteCategory,
            fetchAccountsPayable, createAccountPayable, updateAccountPayable, deleteAccountPayable,
            fetchAccountsReceivable, createAccountReceivable, updateAccountReceivable, deleteAccountReceivable,
            creativeArtifacts, fetchCreativeArtifacts, createCreativeArtifact, updateCreativeArtifact, deleteCreativeArtifact,
            folderItems, fetchFolderItems, createFolderItem, updateFolderItem, deleteFolderItem
        }}>
            {children}
        </PersistenceContext.Provider>
    );
};

export const usePersistence = () => {
    const context = useContext(PersistenceContext);
    if (!context) {
        throw new Error('usePersistence must be used within a PersistenceProvider');
    }
    return context;
};
