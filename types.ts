

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING_1 = 'heading_1',
  HEADING_2 = 'heading_2',
  HEADING_3 = 'heading_3',
  TODO = 'todo',
  BULLET = 'bullet',
  CODE = 'code', 
  IMAGE = 'image',
}

export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  URL = 'url',
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[]; // For select type
}

export enum ViewMode {
  LIST = 'list',
  BOARD = 'board',
  CALENDAR = 'calendar',
}

// New Enum for Module Types
export enum ModuleType {
  TASKS = 'tasks',
  INVENTORY = 'inventory',
  DIRECTORY = 'directory',
  STUDIO = 'studio',
  PROJECTS = 'projects',
  FINANCE = 'finance',
  APP_GENERATOR = 'app_generator',
  FOLDERS = 'folders',
  EBOOKS = 'ebooks',
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // For TODO blocks
  metadata?: any; // For image URLs or code language
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description?: string; // Legacy simple description
  contentBlocks: Block[]; // The Notion-like content
  subtasks: Subtask[]; // Checklist items
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  reminder?: Date; // New: Reminder timestamp
  reminderFired?: boolean; // New: Flag to prevent duplicate alerts
  customFieldValues: Record<string, any>; // JSONB storage for values: { fieldId: value }
  createdAt: Date;
}

export interface List {
  id: string;
  spaceId: string;
  name: string;
  color: string;
  type: ModuleType; // Identifies if this is a Task List, Inventory, etc.
  customFields: CustomFieldDefinition[]; // Schema definition (primarily for Tasks)
}

export interface Space {
  id: string;
  name: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}
// Authentication Token Interface
export interface AuthToken {
  id: string;
  token: string;
  timestamp: Date;
}

// ... existing code ...
export interface AppNotification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type: 'reminder' | 'system';
    linkTaskId?: string;
}

// --- New Modules Types ---

export interface Product {
  id: string;
  name: string;
  sku: string;
  stockCount: number;
  price: number;
  description: string;
}

export interface AITool {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  isApiAvailable: boolean;
  costModel: 'Free' | 'Freemium' | 'Paid';
}

export enum ProjectStatus {
  PLANNING = 'Planning',
  ACTIVE = 'Active',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
}

export interface Project {
  id: string;
  listId: string; // Links project to a specific space module
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  endDate: Date;
  progress: number; // 0-100
  ownerId: string;
  customFieldValues: Record<string, any>; // Flexible storage for user-defined fields
}

export interface ProjectTemplate {
  id: string;
  name: string; // Template name
  description: string;
  customFieldValues: Record<string, any>;
}

// --- Finance Module Types ---

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface FinanceTransaction {
  id: string;
  listId: string;
  description: string;
  contact?: string; // New: Contact/Payee name
  amount: number;
  type: TransactionType;
  date: Date;
  category: string;
}

// --- Finance Accounts Types ---

export interface PaymentHistory {
  id: number;
  date: Date;
  amount: number;
  description: string;
}

export interface AccountPayable {
  id: number;
  name: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: Date;
  nextPaymentDate?: Date;
  invoiceNumber: string;
  paymentHistory: PaymentHistory[];
}

export interface AccountReceivable {
  id: number;
  name: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: Date;
  nextPaymentDate?: Date;
  invoiceNumber: string;
  paymentHistory: PaymentHistory[];
}

// --- Folders Module Types ---

export enum FolderItemType {
  FOLDER = 'folder',
  DOCUMENT = 'document',
  FILE = 'file',
  NOTE = 'note',
  TASK = 'task'
}

export interface FolderItem {
  id: string;
  listId: string;
  parentId: string | null; // null means root of the module
  name: string;
  type: FolderItemType;
  updatedAt: Date;
  size?: string; // e.g. "2 MB" for files, or block count for docs
  url?: string; // For uploaded files (mock storage URL)
}

// --- Ebooks Module Types ---

export interface Ebook {
  id: string;
  title: string;
  description: string;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==============================================================================
// NEW SCHEMA INTERFACES (Centralized Persistence)
// ==============================================================================

export type EstadoTarea = 'Por Hacer' | 'En Progreso' | 'En Revisión' | 'Bloqueado' | 'Terminado';
export type TipoTransaccion = 'Gasto' | 'Ingreso';

export interface ProyectoMaestro {
    id: number; // SERIAL in DB
    nombre_proyecto: string;
    tipo_activo: string; // 'Ebook', 'Curso', 'App', 'Web'
    presupuesto_asignado: number; // numeric
    gastos_acumulados: number; // numeric
    progreso_total: number; // real (percentage)
    fecha_creacion: string; // timestamp
    ultima_actualizacion: string; // timestamp
}

export interface Tarea {
    id: number;
    proyecto_id: number;
    titulo_tarea: string;
    estado: EstadoTarea;
    asignado_a?: string;
    prioridad: string; // Default 'Media'
    fecha_vencimiento?: string; // date
    descripcion?: string;
    bloqueado_por_tarea_id?: number;
    es_subtarea_de_id?: number;
    ultima_actualizacion: string;
}

export interface RegistroFinanzas {
    id: number;
    proyecto_id: number;
    tarea_id?: number;
    concepto: string;
    tipo_transaccion: TipoTransaccion;
    monto: number;
    categoria?: string;
    fecha_transaccion: string; // date
}

export interface InventarioActivo {
    id: number;
    nombre_activo: string;
    tipo_archivo?: string;
    url_almacenamiento: string;
    licencia_derechos: string;
    fecha_expiracion?: string;
    tarea_creacion_id?: number;
    ultima_actualizacion: string;
}

export interface AIDirectory {
    id: number;
    nombre_herramienta: string;
    categoria?: string;
    url_acceso?: string;
    costo_licencia: number;
}