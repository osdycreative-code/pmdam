
import { MOCK_SPACES, MOCK_LISTS, MOCK_TASKS, MOCK_PRODUCTS, MOCK_AI_TOOLS, MOCK_PROJECTS, MOCK_TRANSACTIONS, MOCK_FOLDER_ITEMS } from '../constants';

const DB_NAME = 'NexusFlowDB';
const DB_VERSION = 3; // Increment version to force upgrade if needed

export const STORES = {
  SPACES: 'spaces',
  LISTS: 'lists',
  // REMOVED FOR CENTRALIZED PERSISTENCE: TASKS: 'tasks',
  PRODUCTS: 'products',
  AI_TOOLS: 'aiTools',
  // REMOVED FOR CENTRALIZED PERSISTENCE: PROJECTS: 'projects',
  TEMPLATES: 'projectTemplates',
  // REMOVED FOR CENTRALIZED PERSISTENCE: TRANSACTIONS: 'transactions',
  FOLDER_ITEMS: 'folderItems',
  NOTIFICATIONS: 'notifications',
  USERS: 'users', // Added Users store
  EBOOKS: 'ebooks', // Added Ebooks store
  ACCOUNTS_PAYABLE: 'accountsPayable', // Added Accounts Payable store
  ACCOUNTS_RECEIVABLE: 'accountsReceivable' // Added Accounts Receivable store
};

class DBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Database error:', event);
        reject('Error opening database');
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create all object stores with 'id' as the key path
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  // Generic helper to get a transaction
  private getTransaction(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Generic Get All
  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readonly');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Add/Put
  async addItem<T>(storeName: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.put(item); // put updates if exists, adds if not

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Delete
  async deleteItem(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getTransaction(storeName, 'readwrite');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Check if DB is empty (check if any store has data)
  async isEmpty(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.db) return resolve(true);
      
      // Check all stores for data
      const storesToCheck = [
        STORES.SPACES,
        STORES.LISTS,
        // STORES.TASKS,
        STORES.PRODUCTS,
        STORES.AI_TOOLS,
        // STORES.PROJECTS,
        STORES.TEMPLATES,
        // STORES.TRANSACTIONS,
        STORES.FOLDER_ITEMS,
        STORES.NOTIFICATIONS,
        STORES.USERS,
        STORES.EBOOKS,
        STORES.ACCOUNTS_PAYABLE,
        STORES.ACCOUNTS_RECEIVABLE
      ];
      
      let checkedCount = 0;
      let hasData = false;
      
      storesToCheck.forEach(storeName => {
        const store = this.getTransaction(storeName, 'readonly');
        const request = store.count();
        
        request.onsuccess = () => {
          checkedCount++;
          if (request.result > 0) {
            hasData = true;
          }
          
          // If we found data or checked all stores, resolve
          if (hasData || checkedCount === storesToCheck.length) {
            resolve(!hasData);
          }
        };
        
        request.onerror = () => {
          checkedCount++;
          // If we've checked all stores and none had data, resolve true (empty)
          if (checkedCount === storesToCheck.length) {
            resolve(true);
          }
        };
      });
    });
  }

  // Seed Mock Data - All mock data
  async seedMockData(): Promise<void> {
    // Don't seed mock data - work with real data only
    console.log("Skipping mock data seeding. Working with real data only.");
  }

// ... existing code ...

  // Authentication methods
  async saveAuthToken(token: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([STORES.USERS], 'readwrite');
    const store = transaction.objectStore(STORES.USERS);
    
    // Save token with a fixed ID for easy retrieval
    const authToken = { id: 'auth_token', token, timestamp: new Date() };
    const request = store.put(authToken);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAuthToken(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([STORES.USERS], 'readonly');
    const store = transaction.objectStore(STORES.USERS);
    
    const request = store.get('auth_token');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.token : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearAuthToken(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction([STORES.USERS], 'readwrite');
    const store = transaction.objectStore(STORES.USERS);
    
    const request = store.delete('auth_token');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => {
            this.db = null;
            resolve();
        };
        req.onerror = () => reject("Could not delete DB");
    });
  }
}

export const dbService = new DBService();
