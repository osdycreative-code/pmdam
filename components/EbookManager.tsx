import React, { useState, useEffect, useContext } from 'react';
import { Book, Plus, Search, Download, Trash2, Eye, Edit3 } from 'lucide-react';
import { StoreContext } from '../App';
import { ModuleType, Ebook as EbookType } from '../types';
import { dbService, STORES } from '../services/db';

interface Ebook {
  id: string;
  title: string;
  description: string;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}

const EbookManager: React.FC = () => {
  const { lists, tasks } = useContext(StoreContext);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filter tasks that can be converted to ebooks (tasks with content)
  const ebookCompatibleTasks = tasks.filter(task => 
    task.contentBlocks && task.contentBlocks.length > 0
  );

  // Initialize with existing "ebooks" from IndexedDB
  useEffect(() => {
    const loadEbooks = async () => {
      try {
        const savedEbooks = await dbService.getAll<EbookType>(STORES.EBOOKS);
        setEbooks(savedEbooks.map(ebook => ({
          ...ebook,
          createdAt: new Date(ebook.createdAt),
          updatedAt: new Date(ebook.updatedAt)
        })));
      } catch (e) {
        console.error('Failed to load ebooks from IndexedDB', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadEbooks();
  }, []);

  // Save ebooks to IndexedDB whenever they change
  useEffect(() => {
    ebooks.forEach(ebook => {
      dbService.addItem(STORES.EBOOKS, ebook);
    });
  }, [ebooks]);

  const handleCreateEbook = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newEbook: Ebook = {
      id: `ebook_${Date.now()}`,
      title: task.title,
      description: task.description || `Ebook generado a partir de la tarea "${task.title}"`,
      taskId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setEbooks(prev => [...prev, newEbook]);
    await dbService.addItem(STORES.EBOOKS, newEbook);
    setIsCreating(false);
  };

  const handleDeleteEbook = async (ebookId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este ebook?')) {
      setEbooks(prev => prev.filter(ebook => ebook.id !== ebookId));
      await dbService.deleteItem(STORES.EBOOKS, ebookId);
    }
  };

  const handleExportEbook = (ebook: Ebook) => {
    const task = tasks.find(t => t.id === ebook.taskId);
    if (!task) return;

    // Generate EPUB content
    const content = task.contentBlocks.map(b => {
      if (b.type.includes('heading')) return `\n# ${b.content}\n`;
      return b.content;
    }).join('\n');

    // Create a more structured EPUB-like format
    const epubContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0">
  <metadata>
    <dc:title xmlns:dc="http://purl.org/dc/elements/1.1/">${ebook.title}</dc:title>
    <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">NexusFlow</dc:creator>
    <dc:date xmlns:dc="http://purl.org/dc/elements/1.1/">${new Date().toISOString()}</dc:date>
  </metadata>
  <manifest>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>

<!-- Content File -->
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${ebook.title}</title>
</head>
<body>
  <h1>${ebook.title}</h1>
  <div>${content.replace(/\n/g, '<br/>')}</div>
</body>
</html>`;

    const blob = new Blob([epubContent], { type: 'application/epub+zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ebook.title.replace(/\s+/g, '_')}.epub`;
    a.click();
  };

  const filteredEbooks = ebooks.filter(ebook =>
    ebook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ebook.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Book className="text-indigo-600" size={28} />
              Gestor de eBooks
            </h1>
            <p className="text-gray-500 mt-1">Crea, gestiona y exporta tus libros electrónicos</p>
          </div>
          
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Crear eBook
          </button>
        </div>
        
        {isCreating && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Seleccionar tarea para convertir en eBook</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ebookCompatibleTasks.length > 0 ? (
                ebookCompatibleTasks.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-indigo-300 cursor-pointer transition-all duration-200"
                    onClick={() => handleCreateEbook(task.id)}
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {task.contentBlocks.slice(0, 2).map(b => b.content).join(' ').substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {lists.find(l => l.id === task.listId)?.name || 'Lista'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No hay tareas disponibles para convertir en eBooks</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar eBooks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredEbooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEbooks.map(ebook => {
              const task = tasks.find(t => t.id === ebook.taskId);
              return (
                <div 
                  key={ebook.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{ebook.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ebook.description}</p>
                      </div>
                      <Book className="text-indigo-500 flex-shrink-0 ml-2" size={20} />
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 mt-4">
                      <span>Tarea origen: {task?.title || 'Desconocida'}</span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>Creado: {ebook.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportEbook(ebook)}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                        title="Exportar"
                      >
                        <Download size={14} />
                        Exportar
                      </button>
                      <button
                        onClick={() => handleDeleteEbook(ebook.id)}
                        className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {ebook.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
            <Book size={48} className="mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No hay eBooks creados</h3>
            <p className="text-gray-500 max-w-md text-center mb-6">
              Crea tu primer eBook seleccionando una tarea existente o comienza creando una nueva tarea con contenido.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Crear tu primer eBook
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EbookManager;