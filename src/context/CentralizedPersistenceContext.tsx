
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
    ProjectsAPI, 
    TasksAPI, 
    FinanceAPI, 
    InventoryAPI, 
    AIMarketplaceAPI,
    FinanceCategoriesAPI,
    AccountsPayableAPI,
    AccountsReceivableAPI
} from '../../services/api';
import { 
    ProyectoMaestro, 
    Tarea, 
    RegistroFinanzas, 
    InventarioActivo, 
    AIDirectory,
    AccountPayable,
    AccountReceivable
} from '../../types';

// Define Category Interface locally if not in types
export interface FinanceCategory {
    id: number;
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
    accountsPayable: AccountPayable[]; // Using types.ts interface (might need casting if DB structure varies)
    accountsReceivable: AccountReceivable[];

    loading: boolean;
    error: string | null;
    
    // Actions
    fetchProjects: () => Promise<void>;
    fetchTasks: (projectId: number) => Promise<void>;
    fetchFinances: (projectId: number) => Promise<void>;
    
    // Categories
    fetchCategories: () => Promise<void>;
    createCategory: (name: string, type: 'Income' | 'Expense') => Promise<void>;
    deleteCategory: (id: number) => Promise<void>;

    // AP/AR
    fetchAccountsPayable: () => Promise<void>;
    createAccountPayable: (item: any) => Promise<void>;
    updateAccountPayable: (id: number, updates: any) => Promise<void>;
    deleteAccountPayable: (id: number) => Promise<void>;

    fetchAccountsReceivable: () => Promise<void>;
    createAccountReceivable: (item: any) => Promise<void>;
    updateAccountReceivable: (id: number, updates: any) => Promise<void>;
    deleteAccountReceivable: (id: number) => Promise<void>;

    createProject: (nombre: string, tipo: string, presupuesto: number) => Promise<void>;
    deleteProject: (id: number) => Promise<void>;
    
    createTask: (task: any) => Promise<void>;
    updateTask: (id: number, updates: any) => Promise<void>;
    deleteTask: (id: number) => Promise<void>;
    
    createFinance: (transaction: Omit<RegistroFinanzas, 'id'>) => Promise<void>;
    deleteFinance: (id: number) => Promise<void>;

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

    const fetchTasks = useCallback(async (projectId: number) => {
        try {
            const data = await TasksAPI.getAllByProject(projectId);
            setTasks(data); 
        } catch (err: any) {
            console.error(err);
        }
    }, []);

    const fetchFinances = useCallback(async (projectId: number) => {
        try {
            const data = await FinanceAPI.getAllByProject(projectId);
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
            const newItem = await FinanceCategoriesAPI.create({ name, type });
            setCategories(prev => [...prev, newItem as unknown as FinanceCategory]);
        } catch (err: any) { setError(err.message); }
    }, []);

    const deleteCategory = useCallback(async (id: number) => {
        try {
            await FinanceCategoriesAPI.delete(id);
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

    const updateAccountPayable = useCallback(async (id: number, updates: any) => {
        try {
            await AccountsPayableAPI.update(id, updates);
            setAccountsPayable(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        } catch (err: any) { setError(err.message); }
    }, []);

    const deleteAccountPayable = useCallback(async (id: number) => {
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

    const updateAccountReceivable = useCallback(async (id: number, updates: any) => {
        try {
            await AccountsReceivableAPI.update(id, updates);
            setAccountsReceivable(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        } catch (err: any) { setError(err.message); }
    }, []);

    const deleteAccountReceivable = useCallback(async (id: number) => {
        try {
            await AccountsReceivableAPI.delete(id);
            setAccountsReceivable(prev => prev.filter(item => item.id !== id));
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

    const deleteProject = useCallback(async (id: number) => {
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

    const updateTask = useCallback(async (id: number, updates: any) => {
        try {
            await TasksAPI.update(id, updates);
            // Optimistic update or refetch could go here
            setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    const deleteTask = useCallback(async (id: number) => {
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

    const deleteFinance = useCallback(async (id: number) => {
        try {
            await FinanceAPI.delete(id);
            setFinances(prev => prev.filter(f => f.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchProjects();
        fetchCategories();
        fetchAccountsPayable();
        fetchAccountsReceivable();
        // Load other global directories if needed
        // InventoryAPI.getAll().then(setInventory);
        // AIMarketplaceAPI.getAll().then(setAiTools);
    }, [fetchProjects, fetchCategories, fetchAccountsPayable, fetchAccountsReceivable]);

    return (
        <PersistenceContext.Provider value={{
            projects, tasks, finances, inventory, aiTools,
            categories, accountsPayable, accountsReceivable,
            loading, error,
            fetchProjects, fetchTasks, fetchFinances,
            createProject, deleteProject, createTask, updateTask, deleteTask,
            createFinance, deleteFinance,
            fetchCategories, createCategory, deleteCategory,
            fetchAccountsPayable, createAccountPayable, updateAccountPayable, deleteAccountPayable,
            fetchAccountsReceivable, createAccountReceivable, updateAccountReceivable, deleteAccountReceivable
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
