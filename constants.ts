

import { Space, List, Task, TaskStatus, TaskPriority, BlockType, User, Block, CustomFieldType, Product, AITool, ModuleType, Project, ProjectStatus, FinanceTransaction, TransactionType, FolderItem, FolderItemType } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Chen', avatar: 'https://picsum.photos/32/32?random=1' },
  { id: 'u2', name: 'Bob Smith', avatar: 'https://picsum.photos/32/32?random=2' },
];

export const MOCK_SPACES: Space[] = [
  { id: 's1', name: 'Engineering', icon: '🚀' },
  { id: 's2', name: 'Marketing', icon: '📢' },
  { id: 's3', name: 'Product', icon: '🎯' },
  { id: 's4', name: 'Finance', icon: '💰' },
  { id: 's5', name: 'Library', icon: '📚' },
];

export const MOCK_LISTS: List[] = [
  // Space 1: Engineering
  { 
    id: 'l1', 
    spaceId: 's1', 
    name: 'Frontend Sprint', 
    color: 'bg-blue-500',
    type: ModuleType.TASKS,
    customFields: [
      { id: 'cf1', name: 'Story Points', type: CustomFieldType.NUMBER },
      { id: 'cf2', name: 'Environment', type: CustomFieldType.SELECT, options: ['Dev', 'Staging', 'Prod'] }
    ]
  },
  { 
    id: 'l2', 
    spaceId: 's1', 
    name: 'Backend API', 
    color: 'bg-green-500',
    type: ModuleType.TASKS,
    customFields: []
  },
  {
    id: 'l_inv_1',
    spaceId: 's1', 
    name: 'Lab Equipment',
    color: 'bg-orange-500',
    type: ModuleType.INVENTORY,
    customFields: []
  },
  
  // Space 2: Marketing
  { 
    id: 'l3', 
    spaceId: 's2', 
    name: 'Q1 Campaign', 
    color: 'bg-purple-500',
    type: ModuleType.TASKS,
    customFields: [
       { id: 'cf3', name: 'Budget', type: CustomFieldType.NUMBER },
       { id: 'cf4', name: 'Client URL', type: CustomFieldType.URL }
    ]
  },
  {
    id: 'l_studio_1',
    spaceId: 's2',
    name: 'Creative Assets',
    color: 'bg-pink-500',
    type: ModuleType.STUDIO,
    customFields: []
  },

  // Space 3: Product
  {
    id: 'l_dir_1',
    spaceId: 's3',
    name: 'Competitor AI Tools',
    color: 'bg-indigo-500',
    type: ModuleType.DIRECTORY,
    customFields: []
  },
  {
    id: 'l_proj_1',
    spaceId: 's3',
    name: '2025 Roadmap',
    color: 'bg-teal-500',
    type: ModuleType.PROJECTS,
    customFields: [
        { id: 'cf_lead', name: 'Project Lead', type: CustomFieldType.TEXT },
        { id: 'cf_budget', name: 'Budget', type: CustomFieldType.NUMBER }
    ]
  },
  {
    id: 'l_folders_1',
    spaceId: 's3',
    name: 'Product Docs',
    color: 'bg-yellow-500',
    type: ModuleType.FOLDERS,
    customFields: []
  },

  // Space 4: Finance
  {
    id: 'l_fin_1',
    spaceId: 's4',
    name: 'Q1 Budgeting',
    color: 'bg-emerald-500',
    type: ModuleType.FINANCE,
    customFields: []
  },
  // Space 5: Library
  {
    id: 'l_ebooks_1',
    spaceId: 's5',
    name: 'My eBooks',
    color: 'bg-indigo-500',
    type: ModuleType.EBOOKS,
    customFields: []
  }
];

const INITIAL_BLOCKS: Block[] = [
  { id: 'b1', type: BlockType.HEADING_1, content: 'Implementation Plan' },
  { id: 'b2', type: BlockType.PARAGRAPH, content: 'We need to ensure the API is robust and scalable.' },
  { id: 'b3', type: BlockType.TODO, content: 'Setup database schema', checked: true },
  { id: 'b4', type: BlockType.TODO, content: 'Configure authentication endpoints', checked: false },
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    listId: 'l1',
    title: 'Implement Task Hierarchy',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assigneeId: 'u1',
    createdAt: new Date(),
    dueDate: tomorrow,
    contentBlocks: INITIAL_BLOCKS,
    subtasks: [
      { id: 'st1', title: 'Define data models', completed: true },
      { id: 'st2', title: 'Update API endpoints', completed: false },
      { id: 'st3', title: 'Write unit tests', completed: false }
    ],
    customFieldValues: {
      'cf1': 5,
      'cf2': 'Dev'
    }
  },
  {
    id: 't2',
    listId: 'l1',
    title: 'Design System Update',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assigneeId: 'u2',
    createdAt: new Date(),
    dueDate: nextWeek,
    contentBlocks: [{ id: 'b5', type: BlockType.PARAGRAPH, content: 'Update the color palette.' }],
    subtasks: [],
    customFieldValues: {
      'cf1': 3
    }
  },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Ergonomic Keyboard', sku: 'ACC-KB-001', stockCount: 45, price: 129.99, description: 'Mechanical split keyboard' },
  { id: 'p2', name: '4K Monitor', sku: 'MON-4K-27', stockCount: 8, price: 349.50, description: '27 inch IPS Display' },
  { id: 'p3', name: 'USB-C Hub', sku: 'ACC-HUB-05', stockCount: 120, price: 49.99, description: '7-in-1 Adapter' },
];

export const MOCK_AI_TOOLS: AITool[] = [
  { id: 'at1', name: 'ChatGPT', category: 'Chatbot', description: 'Conversational AI by OpenAI', url: 'https://chat.openai.com', isApiAvailable: true, costModel: 'Freemium' },
  { id: 'at2', name: 'Midjourney', category: 'Image Gen', description: 'Artistic image generation', url: 'https://midjourney.com', isApiAvailable: false, costModel: 'Paid' },
  { id: 'at3', name: 'Jasper', category: 'Copywriting', description: 'Marketing copy assistant', url: 'https://jasper.ai', isApiAvailable: true, costModel: 'Paid' },
  { id: 'at4', name: 'Hugging Face', category: 'Platform', description: 'Model hosting and datasets', url: 'https://huggingface.co', isApiAvailable: true, costModel: 'Free' },
];

export const MOCK_PROJECTS: Project[] = [
  { 
    id: 'pr1', 
    listId: 'l_proj_1',
    name: 'Website Redesign', 
    description: 'Overhaul the corporate website with new branding.', 
    status: ProjectStatus.ACTIVE, 
    startDate: new Date(), 
    endDate: nextWeek, 
    progress: 35,
    ownerId: 'u1',
    customFieldValues: { 'cf_lead': 'Alice Chen', 'cf_budget': 15000 }
  },
  { 
    id: 'pr2', 
    listId: 'l_proj_1',
    name: 'Mobile App Launch', 
    description: 'Initial release of the iOS and Android applications.', 
    status: ProjectStatus.PLANNING, 
    startDate: nextWeek, 
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)), 
    progress: 0,
    ownerId: 'u2',
    customFieldValues: { 'cf_lead': 'Bob Smith', 'cf_budget': 45000 }
  },
  { 
    id: 'pr3', 
    listId: 'l_proj_1',
    name: 'Q1 Financial Audit', 
    description: 'Internal audit of all Q1 expenditures.', 
    status: ProjectStatus.COMPLETED, 
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)), 
    endDate: new Date(), 
    progress: 100,
    ownerId: 'u1',
    customFieldValues: { 'cf_lead': 'Sarah Jones', 'cf_budget': 5000 }
  }
];

export const MOCK_TRANSACTIONS: FinanceTransaction[] = [
  { id: 'ft1', listId: 'l_fin_1', description: 'Client Payment', contact: 'Acme Corp', amount: 5000.00, type: TransactionType.INCOME, date: new Date(), category: 'Sales' },
  { id: 'ft2', listId: 'l_fin_1', description: 'AWS Server Costs', contact: 'Amazon Web Services', amount: 450.00, type: TransactionType.EXPENSE, date: new Date(), category: 'Software' },
  { id: 'ft3', listId: 'l_fin_1', description: 'Office Rent', contact: 'Real Estate LLC', amount: 2000.00, type: TransactionType.EXPENSE, date: new Date(new Date().setDate(new Date().getDate() - 5)), category: 'Rent' },
  { id: 'ft4', listId: 'l_fin_1', description: 'Consulting Fee', contact: 'Tech Solutions Inc', amount: 1200.00, type: TransactionType.INCOME, date: new Date(new Date().setDate(new Date().getDate() - 2)), category: 'Services' },
];

export const MOCK_FOLDER_ITEMS: FolderItem[] = [
    { id: 'f1', listId: 'l_folders_1', parentId: null, name: 'Specifications', type: FolderItemType.FOLDER, updatedAt: new Date() },
    { id: 'f2', listId: 'l_folders_1', parentId: null, name: 'Meeting Notes', type: FolderItemType.FOLDER, updatedAt: new Date() },
    { id: 'doc1', listId: 'l_folders_1', parentId: 'f1', name: 'PRD - v1.0', type: FolderItemType.DOCUMENT, updatedAt: new Date(), size: '4 blocks' },
    { id: 'file1', listId: 'l_folders_1', parentId: 'f1', name: 'Architecture_Diagram.png', type: FolderItemType.FILE, updatedAt: new Date(), size: '2.4 MB' },
    { id: 'note1', listId: 'l_folders_1', parentId: 'f2', name: 'Kickoff Meeting', type: FolderItemType.NOTE, updatedAt: new Date() },
];