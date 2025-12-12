// import { initializeService, db, getAllObjectsOfTypeFromCache as loadManyOf} from "../local-foraging-store";
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { InventoryView } from './components/InventoryView';
import { AIDirectoryView } from './components/AIDirectoryView';
import { CreativeStudio } from './components/CreativeStudio';
import { ProjectsView } from './components/ProjectsView';
import { FinanceView } from './components/FinanceView';
import { AppGeneratorView } from './components/AppGeneratorView';
import { FoldersView } from './components/FoldersView';
import { DashboardView } from './components/DashboardView';
import { MainDashboard } from './components/MainDashboard';
import { LoginPage } from './components/LoginPage';
import EbookManager from './components/EbookManager';
import { PersistenceProvider } from './src/context/CentralizedPersistenceContext';
import { Space, List, Task, TaskStatus, TaskPriority, BlockType, Product, AITool, ModuleType, Project, ProjectTemplate, FinanceTransaction, FolderItem, FolderItemType, AppNotification, AccountPayable, AccountReceivable } from './types';
import { Bell, X, Loader2 } from 'lucide-react';
import { dbService, STORES } from './services/db';

// Simple Store Context
interface StoreContextType {
  spaces: Space[];
  lists: List[];
  tasks: Task[];
  products: Product[];
  aiTools: AITool[];
  projects: Project[];
  projectTemplates: ProjectTemplate[];
  transactions: FinanceTransaction[];
  folderItems: FolderItem[];
  notifications: AppNotification[];
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  activeSpaceId: string | null;
  activeListId: string | null;
  activeTaskId: string | null;
  setActiveSpaceId: (id: string) => void;
  setActiveListId: (id: string | null) => void;
  setActiveTaskId: (id: string | null) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateList: (listId: string, updates: Partial<List>) => void;
  deleteList: (listId: string) => void;
  createTask: (listId: string, title: string) => void;
  createSpace: (name: string, modules: ModuleType[]) => void;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  deleteSpace: (spaceId: string) => void;
  addModule: (spaceId: string, type: ModuleType, name: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addAITool: (tool: AITool) => void;
  updateAITool: (id: string, updates: Partial<AITool>) => void;
  deleteAITool: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  saveProjectAsTemplate: (projectId: string, templateName: string) => void;
  addTransaction: (transaction: FinanceTransaction) => void;
  updateTransaction: (id: string, updates: Partial<FinanceTransaction>) => void;
  deleteTransaction: (id: string) => void;
  addAccountPayable: (account: AccountPayable) => void;
  updateAccountPayable: (id: string, updates: Partial<AccountPayable>) => void;
  deleteAccountPayable: (id: string) => void;
  addAccountReceivable: (account: AccountReceivable) => void;
  updateAccountReceivable: (id: string, updates: Partial<AccountReceivable>) => void;
  deleteAccountReceivable: (id: string) => void;
  addFolderItem: (item: FolderItem) => void;
  updateFolderItem: (id: string, updates: Partial<FolderItem>) => void;
  deleteFolderItem: (id: string) => void;
  organizeFolderItems: (listId: string, parentId: string | null, criteria: 'type' | 'date') => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  logout: () => void;
  resetData: () => void;
}

export const StoreContext = createContext<StoreContextType>({} as StoreContextType);

// Reserved ID for the dashboard view
export const DASHBOARD_VIEW_ID = 'dashboard_view';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Application State - Initially empty, loaded from DB
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [aiTools, setAiTools] = useState<AITool[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [folderItems, setFolderItems] = useState<FolderItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Finance accounts state
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);
  
  // Navigation State
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(DASHBOARD_VIEW_ID);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Toast State
  const [currentToast, setCurrentToast] = useState<AppNotification | null>(null);

  // --- IndexedDB Initialization ---
  useEffect(() => {
    const initDb = async () => {
      try {
        await dbService.init();
        
        // Check if empty and create minimal structure if needed
        const isEmpty = await dbService.isEmpty();
        if (isEmpty) {
            console.log("Database empty. Creating minimal structure...");
            // Create only essential structures without mock data
        }

        // Load all data
        const [
            lSpaces, lLists, lTasks, lProducts, lAiTools, lProjects, lTemplates, lTrans, lFolders, lNotifs, lAccountsPayable, lAccountsReceivable
        ] = await Promise.all([
            dbService.getAll<Space>(STORES.SPACES),
            dbService.getAll<List>(STORES.LISTS),
            Promise.resolve([]), // dbService.getAll<Task>(STORES.TASKS),
            dbService.getAll<Product>(STORES.PRODUCTS),
            dbService.getAll<AITool>(STORES.AI_TOOLS),
            Promise.resolve([]), // dbService.getAll<Project>(STORES.PROJECTS),
            dbService.getAll<ProjectTemplate>(STORES.TEMPLATES),
            Promise.resolve([]), // dbService.getAll<FinanceTransaction>(STORES.TRANSACTIONS),
            dbService.getAll<FolderItem>(STORES.FOLDER_ITEMS),
            dbService.getAll<AppNotification>(STORES.NOTIFICATIONS),
            dbService.getAll<AccountPayable>(STORES.ACCOUNTS_PAYABLE),
            dbService.getAll<AccountReceivable>(STORES.ACCOUNTS_RECEIVABLE),

        ]);

        setSpaces(lSpaces);
        setLists(lLists);
        setTasks(lTasks);
        setProducts(lProducts);
        setAiTools(lAiTools);
        setProjects(lProjects);
        setProjectTemplates(lTemplates);
        setTransactions(lTrans);
        setFolderItems(lFolders);
        setNotifications(lNotifs);
        setAccountsPayable(lAccountsPayable);
        setAccountsReceivable(lAccountsReceivable);

      } catch (err) {
        console.error("Failed to initialize database", err);
      } finally {
        setIsDbLoading(false);
      }
    };

    initDb();
  }, []);

  // --- Auth Logic (Local) ---
  useEffect(() => {
      const initAuth = async () => {
          try {
              const token = await dbService.getAuthToken();
              if (token) {
                  setAuthToken(token);
                  setIsAuthenticated(true);
              }
          } catch (err) {
              console.error("Failed to initialize auth", err);
          }
      };
      
      if (!isDbLoading) {
          initAuth();
      }
  }, [isDbLoading]);

  const handleLoginSuccess = async (token: string) => {
      try {
          await dbService.saveAuthToken(token);
          setAuthToken(token);
          setIsAuthenticated(true);
      } catch (err) {
          console.error("Failed to save auth token", err);
      }
  };

  const logout = async () => {
      try {
          await dbService.clearAuthToken();
          setAuthToken(null);
          setIsAuthenticated(false);
      } catch (err) {
          console.error("Failed to clear auth token", err);
      }
  };

  const resetData = async () => {
      if(window.confirm("This will delete the local database and all accounts. Are you sure?")) {
          setIsDbLoading(true);
          await dbService.clearDatabase();
          
          // Reinitialize the database without loading mock data
          await dbService.init();
          
          // Clear all state
          setSpaces([]);
          setLists([]);
          setTasks([]);
          setProducts([]);
          setAiTools([]);
          setProjects([]);
          setProjectTemplates([]);
          setTransactions([]);
          setFolderItems([]);
          setNotifications([]);
          
          // Clear authentication state
          setAuthToken(null);
          setIsAuthenticated(false);
          
          setIsDbLoading(false);
          window.location.reload();
      }
  };

  // --- Reminder Logic ---
  useEffect(() => {
    if (isDbLoading) return;

    const checkReminders = () => {
      const now = new Date();
      
      setTasks(prevTasks => {
          let hasUpdates = false;
          const updatedTasks = prevTasks.map(task => {
              if (task.reminder && !task.reminderFired && new Date(task.reminder) <= now) {
                  hasUpdates = true;
                  // Trigger Notification
                  const newNotification: AppNotification = {
                      id: crypto.randomUUID(),
                      title: 'Task Reminder',
                      message: `Reminder for: ${task.title}`,
                      timestamp: new Date(),
                      read: false,
                      type: 'reminder',
                      linkTaskId: task.id
                  };
                  
                  // Optimistic UI Update for Notifications
                  setNotifications(prev => [newNotification, ...prev]);
                  dbService.addItem(STORES.NOTIFICATIONS, newNotification);
                  
                  // Show Toast
                  setCurrentToast(newNotification);
                  setTimeout(() => setCurrentToast(null), 5000); 

                  const updatedTask = { ...task, reminderFired: true };
                  // dbService.addItem(STORES.TASKS, updatedTask); // Persist task change
                  return updatedTask;
              }
              return task;
          });
          
          return hasUpdates ? updatedTasks : prevTasks;
      });
    };

    const intervalId = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [isDbLoading]);

  // --- Actions with DB Persistence ---

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
            const updated = { ...t, ...updates };
            // dbService.addItem(STORES.TASKS, updated);
            return updated;
        }
        return t;
    }));
  };

  const deleteTask = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      // dbService.deleteItem(STORES.TASKS, taskId);
      if (activeTaskId === taskId) setActiveTaskId(null);
  };

  const updateList = (listId: string, updates: Partial<List>) => {
    setLists(prev => prev.map(l => {
        if (l.id === listId) {
            const updated = { ...l, ...updates };
            dbService.addItem(STORES.LISTS, updated);
            return updated;
        }
        return l;
    }));
  };

  const deleteList = (listId: string) => {
      setLists(prev => prev.filter(l => l.id !== listId));
      dbService.deleteItem(STORES.LISTS, listId);

      // Cascade delete items related to the list (In memory + DB)
      setTasks(prev => {
          const kept = prev.filter(t => t.listId !== listId);
          // prev.filter(t => t.listId === listId).forEach(t => dbService.deleteItem(STORES.TASKS, t.id));
          return kept;
      });
      setProjects(prev => {
          const kept = prev.filter(p => p.listId !== listId);
          // prev.filter(p => p.listId === listId).forEach(p => dbService.deleteItem(STORES.PROJECTS, p.id));
          return kept;
      });
      setTransactions(prev => {
          const kept = prev.filter(t => t.listId !== listId);
          // prev.filter(t => t.listId === listId).forEach(t => dbService.deleteItem(STORES.TRANSACTIONS, t.id));
          return kept;
      });
      setFolderItems(prev => {
          const kept = prev.filter(i => i.listId !== listId);
          prev.filter(i => i.listId === listId).forEach(i => dbService.deleteItem(STORES.FOLDER_ITEMS, i.id));
          return kept;
      });
      
      if (activeListId === listId) setActiveListId(null);
  };

  const createTask = (listId: string, title: string) => {
      const newTask: Task = {
          id: crypto.randomUUID(),
          listId,
          title,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          contentBlocks: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }],
          subtasks: [],
          createdAt: new Date(),
          customFieldValues: {},
      };
      setTasks(prev => [...prev, newTask]);
      // dbService.addItem(STORES.TASKS, newTask);
      setActiveTaskId(newTask.id);
  };

  const getModuleColor = (type: ModuleType) => {
      switch(type) {
          case ModuleType.TASKS: return 'bg-blue-500';
          case ModuleType.INVENTORY: return 'bg-orange-500';
          case ModuleType.DIRECTORY: return 'bg-indigo-500';
          case ModuleType.STUDIO: return 'bg-pink-500';
          case ModuleType.PROJECTS: return 'bg-teal-500';
          case ModuleType.FINANCE: return 'bg-emerald-500';
          case ModuleType.APP_GENERATOR: return 'bg-blue-600';
          case ModuleType.FOLDERS: return 'bg-yellow-500';
          default: return 'bg-indigo-500';
      }
  };

  const createSpace = (name: string, modules: ModuleType[]) => {
      const newSpaceId = crypto.randomUUID();
      const newSpace: Space = {
          id: newSpaceId,
          name: name,
          icon: '✨' // Default icon
      };

      const newLists: List[] = modules.map((type, index) => ({
          id: crypto.randomUUID(),
          spaceId: newSpaceId,
          name: type === ModuleType.TASKS ? 'General Tasks' : 
                type === ModuleType.INVENTORY ? 'Inventory' : 
                type === ModuleType.DIRECTORY ? 'AI Tools' : 
                type === ModuleType.PROJECTS ? 'Projects' :
                type === ModuleType.FINANCE ? 'Budget' : 
                type === ModuleType.APP_GENERATOR ? 'App Builder' : 
                type === ModuleType.FOLDERS ? 'Documents & Files' : 'Studio',
          color: getModuleColor(type),
          type: type,
          customFields: []
      }));

      setSpaces(prev => [...prev, newSpace]);
      dbService.addItem(STORES.SPACES, newSpace);

      setLists(prev => [...prev, ...newLists]);
      newLists.forEach(l => dbService.addItem(STORES.LISTS, l));

      setActiveSpaceId(newSpaceId);
      if(newLists.length > 0) setActiveListId(newLists[0].id);
  };

  const updateSpace = (spaceId: string, updates: Partial<Space>) => {
      setSpaces(prev => prev.map(s => {
          if (s.id === spaceId) {
              const updated = { ...s, ...updates };
              dbService.addItem(STORES.SPACES, updated);
              return updated;
          }
          return s;
      }));
  };

  const deleteSpace = (spaceId: string) => {
    // 1. Identify Lists to remove
    const listsToRemove = lists.filter(l => l.spaceId === spaceId);
    const listIdsToRemove = listsToRemove.map(l => l.id);

    // 2. Remove Space
    setSpaces(prev => prev.filter(s => s.id !== spaceId));
    dbService.deleteItem(STORES.SPACES, spaceId);

    // 3. Remove Lists
    setLists(prev => prev.filter(l => l.spaceId !== spaceId));
    listsToRemove.forEach(l => dbService.deleteItem(STORES.LISTS, l.id));

    // 4. Cascade Remove Items
    setFolderItems(prev => {
      const keep = prev.filter(i => !listIdsToRemove.includes(i.listId));
      const itemsToDelete = prev.filter(i => listIdsToRemove.includes(i.listId));
      itemsToDelete.forEach(i => dbService.deleteItem(STORES.FOLDER_ITEMS, i.id));
      return keep;
    });

    // 5. Handle Active State
    if (activeSpaceId === spaceId) {
      setActiveSpaceId(DASHBOARD_VIEW_ID);
      setActiveListId(null);
    }
  };

  const addModule = (spaceId: string, type: ModuleType, name: string) => {
      const newList: List = {
          id: crypto.randomUUID(),
          spaceId,
          name: name,
          color: getModuleColor(type),
          type: type,
          customFields: []
      };
      setLists(prev => [...prev, newList]);
      dbService.addItem(STORES.LISTS, newList);
      setActiveListId(newList.id);
  };

  const addProduct = (product: Product) => {
      setProducts(prev => [...prev, product]);
      dbService.addItem(STORES.PRODUCTS, product);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
      setProducts(prev => prev.map(p => {
          if (p.id === id) {
              const updated = { ...p, ...updates };
              dbService.addItem(STORES.PRODUCTS, updated);
              return updated;
          }
          return p;
      }));
  };

  const deleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
      dbService.deleteItem(STORES.PRODUCTS, id);
  };

  const addAITool = (tool: AITool) => {
      setAiTools(prev => [...prev, tool]);
      dbService.addItem(STORES.AI_TOOLS, tool);
  };

  const updateAITool = (id: string, updates: Partial<AITool>) => {
      setAiTools(prev => prev.map(t => {
          if (t.id === id) {
              const updated = { ...t, ...updates };
              dbService.addItem(STORES.AI_TOOLS, updated);
              return updated;
          }
          return t;
      }));
  };

  const deleteAITool = (id: string) => {
      setAiTools(prev => prev.filter(t => t.id !== id));
      dbService.deleteItem(STORES.AI_TOOLS, id);
  };

  const addProject = (project: Project) => {
      setProjects(prev => [...prev, project]);
      // dbService.addItem(STORES.PROJECTS, project);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
      setProjects(prev => prev.map(p => {
          if (p.id === id) {
              const updated = { ...p, ...updates };
              // dbService.addItem(STORES.PROJECTS, updated);
              return updated;
          }
          return p;
      }));
  };

  const deleteProject = (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
      // dbService.deleteItem(STORES.PROJECTS, id);
  };

  const saveProjectAsTemplate = (projectId: string, templateName: string) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      const newTemplate: ProjectTemplate = {
          id: crypto.randomUUID(),
          name: templateName,
          description: project.description,
          customFieldValues: { ...project.customFieldValues }
      };
      
      setProjectTemplates(prev => [...prev, newTemplate]);
      dbService.addItem(STORES.TEMPLATES, newTemplate);
      
      setCurrentToast({
          id: crypto.randomUUID(),
          title: 'Template Saved',
          message: `Project saved as template: ${templateName}`,
          timestamp: new Date(),
          read: false,
          type: 'system'
      });
      setTimeout(() => setCurrentToast(null), 3000);
  };

  const addTransaction = (transaction: FinanceTransaction) => {
      setTransactions(prev => [...prev, transaction]);
      // dbService.addItem(STORES.TRANSACTIONS, transaction);
  };

  const updateTransaction = (id: string, updates: Partial<FinanceTransaction>) => {
      setTransactions(prev => prev.map(t => {
          if (t.id === id) {
              const updated = { ...t, ...updates };
              // dbService.addItem(STORES.TRANSACTIONS, updated);
              return updated;
          }
          return t;
      }));
  };

  const deleteTransaction = (id: string) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      // dbService.deleteItem(STORES.TRANSACTIONS, id);
  };

  // Accounts Payable Functions
  const addAccountPayable = (account: AccountPayable) => {
    setAccountsPayable(prev => [...prev, account]);
    dbService.addItem(STORES.ACCOUNTS_PAYABLE, account);
  };

  const updateAccountPayable = (id: string, updates: Partial<AccountPayable>) => {
    setAccountsPayable(prev => prev.map(acc => {
      if (acc.id === id) {
        const updated = { ...acc, ...updates };
        dbService.addItem(STORES.ACCOUNTS_PAYABLE, updated);
        return updated;
      }
      return acc;
    }));
  };

  const deleteAccountPayable = (id: string) => {
    setAccountsPayable(prev => prev.filter(acc => acc.id !== id));
    dbService.deleteItem(STORES.ACCOUNTS_PAYABLE, id);
  };

  // Accounts Receivable Functions
  const addAccountReceivable = (account: AccountReceivable) => {
    setAccountsReceivable(prev => [...prev, account]);
    dbService.addItem(STORES.ACCOUNTS_RECEIVABLE, account);
  };

  const updateAccountReceivable = (id: string, updates: Partial<AccountReceivable>) => {
    setAccountsReceivable(prev => prev.map(acc => {
      if (acc.id === id) {
        const updated = { ...acc, ...updates };
        dbService.addItem(STORES.ACCOUNTS_RECEIVABLE, updated);
        return updated;
      }
      return acc;
    }));
  };

  const deleteAccountReceivable = (id: string) => {
    setAccountsReceivable(prev => prev.filter(acc => acc.id !== id));
    dbService.deleteItem(STORES.ACCOUNTS_RECEIVABLE, id);
  };

  const addFolderItem = (item: FolderItem) => {
      setFolderItems(prev => [...prev, item]);
      dbService.addItem(STORES.FOLDER_ITEMS, item);
  };

  const updateFolderItem = (id: string, updates: Partial<FolderItem>) => {
      setFolderItems(prev => prev.map(i => {
          if (i.id === id) {
              const updated = { ...i, ...updates };
              dbService.addItem(STORES.FOLDER_ITEMS, updated);
              return updated;
          }
          return i;
      }));
  };

  const deleteFolderItem = (id: string) => {
    // Recursive delete: delete item and all its children
    const deleteRecursive = (itemId: string) => {
      // First delete all children
      const children = folderItems.filter(item => item.parentId === itemId);
      children.forEach(child => deleteRecursive(child.id));
      
      // Then delete the item itself
      setFolderItems(prev => prev.filter(i => i.id !== itemId));
      dbService.deleteItem(STORES.FOLDER_ITEMS, itemId);
    };
    
    deleteRecursive(id);
    
    // If we're deleting the preview item, close the preview
    if (activeTaskId && activeTaskId === id) {
      setActiveTaskId(null);
    }
  };

  const organizeFolderItems = (listId: string, parentId: string | null, criteria: 'type' | 'date') => {
      setFolderItems(prevItems => {
          const itemsToMove = prevItems.filter(i => 
              i.listId === listId && 
              i.parentId === parentId && 
              i.type !== FolderItemType.FOLDER
          );
          
          if (itemsToMove.length === 0) return prevItems;

          const newItems = [...prevItems];
          const createdFolders: Record<string, string> = {}; // Name -> ID

          const getTargetFolderId = (folderName: string) => {
              const existingId = newItems.find(i => 
                  i.listId === listId && 
                  i.parentId === parentId && 
                  i.type === FolderItemType.FOLDER && 
                  i.name === folderName
              )?.id;

              if (existingId) return existingId;
              if (createdFolders[folderName]) return createdFolders[folderName];

              const newFolderId = crypto.randomUUID();
              const newFolder = {
                  id: newFolderId,
                  listId,
                  parentId,
                  name: folderName,
                  type: FolderItemType.FOLDER,
                  updatedAt: new Date()
              };
              newItems.push(newFolder);
              dbService.addItem(STORES.FOLDER_ITEMS, newFolder); // Persist Folder
              
              createdFolders[folderName] = newFolderId;
              return newFolderId;
          };

          itemsToMove.forEach(item => {
              let targetName = "Misc";
              if (criteria === 'type') {
                  switch(item.type) {
                      case FolderItemType.DOCUMENT: targetName = "Documents"; break;
                      case FolderItemType.FILE: targetName = "Files"; break;
                      case FolderItemType.NOTE: targetName = "Notes"; break;
                      case FolderItemType.TASK: targetName = "Tasks"; break;
                      default: targetName = "Misc";
                  }
              } else if (criteria === 'date') {
                  const date = new Date(item.updatedAt);
                  if (!isNaN(date.getTime())) {
                      targetName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                  } else {
                      targetName = "Unknown Date";
                  }
              }

              const folderId = getTargetFolderId(targetName);
              
              const itemIndex = newItems.findIndex(i => i.id === item.id);
              if(itemIndex > -1) {
                  const updated = { ...newItems[itemIndex], parentId: folderId };
                  newItems[itemIndex] = updated;
                  dbService.addItem(STORES.FOLDER_ITEMS, updated); // Persist Move
              }
          });

          return newItems;
      });
  };

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => {
          if (n.id === id) {
              const updated = { ...n, read: true };
              dbService.addItem(STORES.NOTIFICATIONS, updated);
              return updated;
          }
          return n;
      }));
  };

  const clearAllNotifications = () => {
      // In a real DB we'd batch delete, here we iterate active memory to delete
      notifications.forEach(n => dbService.deleteItem(STORES.NOTIFICATIONS, n.id));
      setNotifications([]);
  };

  // Sync list selection when space changes
  useEffect(() => {
    if (activeSpaceId && activeSpaceId !== DASHBOARD_VIEW_ID) {
      const spaceLists = lists.filter(l => l.spaceId === activeSpaceId);
      const isCurrentListInSpace = spaceLists.find(l => l.id === activeListId);
      if (!isCurrentListInSpace && spaceLists.length > 0) {
        setActiveListId(spaceLists[0].id);
      } else if (spaceLists.length === 0) {
          setActiveListId(null);
      }
    }
  }, [activeSpaceId, lists]);

  const renderMainContent = () => {
      if (activeSpaceId === DASHBOARD_VIEW_ID) {
          return <MainDashboard />;
      }

      if (!activeListId) {
          return (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                Select a module to view
            </div>
          );
      }

      const activeList = lists.find(l => l.id === activeListId);
      if (!activeList) return null;

      switch(activeList.type) {
          case ModuleType.INVENTORY:
              return <InventoryView />;
          case ModuleType.DIRECTORY:
              return <AIDirectoryView />;
          case ModuleType.STUDIO:
              return <CreativeStudio />;
          case ModuleType.PROJECTS:
              return <ProjectsView />;
          case ModuleType.FINANCE:
              return <FinanceView />;
          case ModuleType.APP_GENERATOR:
              return <AppGeneratorView />;
          case ModuleType.FOLDERS:
              return <FoldersView />;
          case ModuleType.EBOOKS:
              return <EbookManager />;
          case ModuleType.TASKS:
          default:
              return <TaskList />;
      }
  };

  if (!isAuthenticated) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (isDbLoading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-indigo-600 gap-4">
              <Loader2 size={48} className="animate-spin" />
              <p className="font-medium">Loading Database...</p>
          </div>
      );
  }

  return (
    <PersistenceProvider>
    <StoreContext.Provider value={{
      spaces, lists, tasks, products, aiTools, projects, projectTemplates, transactions, folderItems, notifications, accountsPayable, accountsReceivable,
      activeSpaceId, activeListId, activeTaskId,
      setActiveSpaceId, setActiveListId, setActiveTaskId,
      updateTask, deleteTask, updateList, deleteList, createTask, createSpace, updateSpace, deleteSpace, addModule, addProduct, updateProduct, deleteProduct,
      addAITool, updateAITool, deleteAITool, addProject, updateProject, deleteProject, saveProjectAsTemplate, addTransaction, updateTransaction, deleteTransaction,
      addAccountPayable, updateAccountPayable, deleteAccountPayable, addAccountReceivable, updateAccountReceivable, deleteAccountReceivable,
      addFolderItem, updateFolderItem, deleteFolderItem, organizeFolderItems,
      markNotificationRead, clearAllNotifications, logout, resetData
    }}>
      <div className="flex h-screen w-full bg-white overflow-hidden text-gray-900 relative">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {renderMainContent()}
        </main>

        {activeTaskId && <TaskDetail />}

        {currentToast && (
            <div className="fixed bottom-6 right-6 bg-white border border-gray-200 shadow-2xl rounded-xl p-4 flex items-start gap-3 w-80 animate-[slideUp_0.3s_ease-out] z-[100]">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full shrink-0">
                    <Bell size={18} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-sm">{currentToast.title}</span>
                        <button onClick={() => setCurrentToast(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{currentToast.message}</p>
                    {currentToast.linkTaskId && (
                        <button 
                            onClick={() => {
                                setActiveTaskId(currentToast.linkTaskId || null);
                                setCurrentToast(null);
                            }}
                            className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                        >
                            View Task
                        </button>
                    )}
                </div>
            </div>
        )}
      </div>
      <style>{`
          @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
          }
      `}</style>
    </StoreContext.Provider>
    </PersistenceProvider>
  );
};

export default App;
