
import Dexie, { Table } from 'dexie';
import { ProyectoMaestro, Tarea, RegistroFinanzas, InventarioActivo, AIDirectory, CreativeArtifact, FolderItem } from '../types';

// Definición de Interfaces Locales (coincidentes con el esquema general)

// Removed legacy LocalTask and LocalFinance interfaces in favor of UUID versions below

export interface LocalCategory {
  id?: number;
  name: string;
  type: 'Income' | 'Expense';
}

export interface LocalAccountPayable {
  id?: number;
  entity_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  invoice_number?: string;
  sync_status?: 'pending' | 'synced';
}

export interface LocalAccountReceivable {
  id?: number;
  entity_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  invoice_number?: string;
  sync_status?: 'pending' | 'synced';
}

export interface LocalCreativeArtifact {
    id: string; // UUID
    title: string;
    type: 'story' | 'coloring' | 'manual' | 'game' | 'app';
    content: string;
    prompt: string;
    created_at: string;
}

export interface LocalFolderItem {
    id: string; // UUID
    listId: string; 
    parentId: string | null; 
    name: string;
    type: 'folder' | 'document' | 'file' | 'note' | 'task';
    updatedAt: string;
    size?: string;
    url?: string;
    content?: string; 
}

export interface LocalProject {
    id: string; // UUID
    nombre_proyecto: string;
    tipo_activo: string;
    presupuesto_asignado: number;
    gastos_acumulados: number;
    progreso_total: number;
    fecha_creacion: string;
    ultima_actualizacion: string;
    sync_status?: 'pending' | 'synced';
}

export interface LocalTask extends Omit<Tarea, 'id'> {
    id: string; // UUID
}

export interface LocalFinance extends Omit<RegistroFinanzas, 'id'> {
    id: string; // UUID
}

export interface LocalInventory {
    id: string;
    nombre_activo: string;
    tipo_archivo?: string;
    url_almacenamiento: string;
    licencia_derechos: string;
    fecha_expiracion?: string;
    tarea_creacion_id?: string;
    ultima_actualizacion: string;
    sync_status?: 'pending' | 'synced';
}

export interface LocalAITool {
    id: string;
    nombre_herramienta: string;
    categoria?: string;
    url_acceso?: string;
    costo_licencia: number;
    sync_status?: 'pending' | 'synced';
}

class PManLocalDB extends Dexie {
  // Tablas
  tasks!: Table<LocalTask, string>;
  finance!: Table<LocalFinance, string>;
  categories!: Table<LocalCategory, number>; // Mantener int si es local simple, o cambiar a UUID si se sincroniza
  accounts_payable!: Table<LocalAccountPayable, number>;
  accounts_receivable!: Table<LocalAccountReceivable, number>;
  creative_artifacts!: Table<LocalCreativeArtifact, string>;
  folder_items!: Table<LocalFolderItem, string>;
  projects!: Table<LocalProject, string>;
  inventory!: Table<LocalInventory, string>;
  ai_tools!: Table<LocalAITool, string>;
  spaces!: Table<LocalSpace, string>;
  lists!: Table<LocalList, string>;
  products!: Table<any, string>;
  notifications!: Table<any, string>;
  templates!: Table<any, string>;

  constructor() {
    super('PManLocalDB');
    
    // UUID Schema (v7): "id" (primary key, string UUID) instead of "++id"
    // Version 8: Added spaces, lists, products, notifications, templates
    this.version(8).stores({
      tasks: 'id, proyecto_id, estado, sync_status, es_subtarea_de_id',
      finance: 'id, proyecto_id, tipo_transaccion, sync_status',
      categories: '++id, type', // Keep simple for now unless synced
      accounts_payable: '++id, status, due_date, sync_status',
      accounts_receivable: '++id, status, due_date, sync_status',
      creative_artifacts: 'id, type',
      folder_items: 'id, parentId, listId',
      projects: 'id, ultima_actualizacion, sync_status',
      inventory: 'id, sync_status',
      ai_tools: 'id, categoria, sync_status',
      spaces: 'id',
      lists: 'id, spaceId',
      products: 'id',
      notifications: 'id',
      templates: 'id'
    });
  }
}

export interface LocalSpace {
    id: string;
    name: string;
    icon: string;
}

export interface LocalList {
    id: string;
    spaceId: string;
    name: string;
    color: string;
    type: string;
    customFields: any[];
}

export const dbLocal = new PManLocalDB();

