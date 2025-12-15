
import { dbLocal } from './dexieDb';
import { SyncService } from './syncService';

export const STORES = {
  SPACES: 'spaces',
  LISTS: 'lists',
  TASKS: 'tasks',
  PRODUCTS: 'products',
  AI_TOOLS: 'ai_tools',
  PROJECTS: 'projects',
  TEMPLATES: 'templates',
  TRANSACTIONS: 'finance', // Maps to 'finance' table
  FOLDER_ITEMS: 'folder_items',
  NOTIFICATIONS: 'notifications',
  ACCOUNTS_PAYABLE: 'accounts_payable',
  ACCOUNTS_RECEIVABLE: 'accounts_receivable',
  SETTINGS: 'settings'
};

const getTable = (storeName: string) => {
    switch (storeName) {
        case STORES.SPACES: return dbLocal.spaces;
        case STORES.LISTS: return dbLocal.lists;
        case STORES.TASKS: return dbLocal.tasks;
        case STORES.PRODUCTS: return dbLocal.products;
        case STORES.AI_TOOLS: return dbLocal.ai_tools;
        case STORES.PROJECTS: return dbLocal.projects;
        case STORES.TEMPLATES: return dbLocal.templates;
        case STORES.TRANSACTIONS: return dbLocal.finance;
        case STORES.FOLDER_ITEMS: return dbLocal.folder_items;
        case STORES.NOTIFICATIONS: return dbLocal.notifications;
        case STORES.ACCOUNTS_PAYABLE: return dbLocal.accounts_payable;
        case STORES.ACCOUNTS_RECEIVABLE: return dbLocal.accounts_receivable;
        case STORES.SETTINGS: return dbLocal.settings;
        default: throw new Error(`Unknown store: ${storeName}`);
    }
};

export const dbService = {
  init: async () => {
    if (!dbLocal.isOpen()) {
        await dbLocal.open();
    }
  },

  getAll: async <T>(storeName: string): Promise<T[]> => {
    const table = getTable(storeName);
    return await table.toArray() as unknown as T[];
  },

  addItem: async <T>(storeName: string, item: T): Promise<void> => {
    const table = getTable(storeName);
    await (table as any).put(item); // Cast to any to handle different key types
    SyncService.triggerSync(storeName);
  },

  updateItem: async <T>(storeName: string, id: string | number, updates: Partial<T>): Promise<void> => {
    const table = getTable(storeName);
    await (table as any).update(id, updates); // Cast to any
    SyncService.triggerSync(storeName);
  },

  deleteItem: async (storeName: string, id: string | number): Promise<void> => {
    const table = getTable(storeName);
    await (table as any).delete(id); // Cast to any
    SyncService.triggerSync(storeName);
  },

  getAuthToken: async (): Promise<string | null> => {
    try {
      const setting = await dbLocal.settings.get('auth_token');
      return setting ? setting.value : null;
    } catch (e) {
      console.error('Error getting auth token from DB:', e);
      return localStorage.getItem('auth_token'); // Fallback
    }
  },

  saveAuthToken: async (token: string): Promise<void> => {
    try {
      await dbLocal.settings.put({ key: 'auth_token', value: token });
    } catch (e) {
      console.error('Error saving auth token to DB:', e);
      localStorage.setItem('auth_token', token); // Fallback
    }
  },

  clearAuthToken: async (): Promise<void> => {
    try {
      await dbLocal.settings.delete('auth_token');
    } catch (e) {
      console.error('Error clearing auth token from DB:', e);
      localStorage.removeItem('auth_token');
    }
  },

  isEmpty: async (): Promise<boolean> => {
      // Check a few key tables
      const spacesCount = await dbLocal.spaces.count();
      return spacesCount === 0;
  },

  clearDatabase: async (): Promise<void> => {
      await dbLocal.delete();
      await dbLocal.open();
  }
};
