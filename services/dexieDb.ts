
import Dexie, { Table } from 'dexie';

// Definición de Interfaces Locales (coincidentes con el esquema general)

export interface LocalTask {
  id?: number; // Auto-increment en Dexie
  proyecto_id: number;
  titulo_tarea: string;
  estado: string; // 'Por Hacer', etc.
  prioridad: string;
  fecha_vencimiento?: string;
  descripcion?: string;
  es_subtarea_de_id?: number;
  // Campos extra para sincronización futura
  sync_status?: 'pending' | 'synced'; 
}

export interface LocalFinance {
  id?: number;
  proyecto_id: number;
  concepto: string;
  tipo_transaccion: 'Gasto' | 'Ingreso';
  monto: number;
  categoria?: string;
  fecha_transaccion: string;
  sync_status?: 'pending' | 'synced';
}

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

class PManLocalDB extends Dexie {
  // Tablas
  tasks!: Table<LocalTask, number>;
  finance!: Table<LocalFinance, number>;
  categories!: Table<LocalCategory, number>;
  accounts_payable!: Table<LocalAccountPayable, number>;
  accounts_receivable!: Table<LocalAccountReceivable, number>;

  constructor() {
    super('PManLocalDB');
    
    // Definición de esquema
    // ++id significa auto-incremento
    this.version(3).stores({
      tasks: '++id, proyecto_id, estado, sync_status, es_subtarea_de_id',
      finance: '++id, proyecto_id, tipo_transaccion, sync_status',
      categories: '++id, type',
      accounts_payable: '++id, status, due_date, sync_status',
      accounts_receivable: '++id, status, due_date, sync_status'
    });
  }
}

export const dbLocal = new PManLocalDB();

