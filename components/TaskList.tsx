
import React, { useState, useMemo } from 'react';
import { usePersistence } from '../src/context/CentralizedPersistenceContext';
import { Plus, Filter, ArrowUpDown, Circle, CheckCircle2, CircleDashed, LayoutList, Table as TableIcon, KanbanSquare, Calendar as CalendarIcon, GripHorizontal, Briefcase, ListTree, ChevronDown, ChevronRight } from 'lucide-react';
import { ViewMode, EstadoTarea, Tarea } from '../types';
import { TaskEditModal } from './TaskEditModal';

// Helper to map DB status to UI colors/icons
const getStatusIcon = (s: string) => {
    switch(s) {
        case 'Terminado': return <CheckCircle2 size={18} className="text-green-500" />;
        case 'En Progreso': return <CircleDashed size={18} className="text-blue-500 animate-[spin_3s_linear_infinite]" />;
        case 'Bloqueado': return <Circle size={18} className="text-red-400" />;
        default: return <Circle size={18} className="text-gray-300" />;
    }
};

const getPriorityColor = (p: string) => {
    switch(p?.toLowerCase()) {
        case 'urgente': return 'text-red-600 bg-red-50';
        case 'alta': return 'text-orange-600 bg-orange-50';
        case 'media': return 'text-yellow-600 bg-yellow-50';
        case 'baja': return 'text-gray-500 bg-gray-50';
        default: return 'text-gray-500';
    }
};

export const TaskList: React.FC = () => {
  const { tasks, projects, createTask, updateTask, deleteTask, loading } = usePersistence();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [sortConfig, setSortConfig] = useState<{key: keyof any, direction: 'asc' | 'desc'} | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [editingTask, setEditingTask] = useState<Tarea | null>(null);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
        ...prev,
        [group]: prev[group] === undefined ? false : !prev[group] // Default open logic inverted: if undefined (default), clicking makes it false (closed). Wait, better explicit.
    }));
  };
  
  // Helper: Open by default
  const isGroupExpanded = (group: string) => expandedGroups[group] !== false;

  // Filter tasks
  const visibleTasks = useMemo(() => {
      let filtered = tasks;
      if (selectedProjectId) {
          filtered = filtered.filter(t => t.proyecto_id === selectedProjectId);
      }
      return filtered;
  }, [tasks, selectedProjectId]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    if (!sortConfig) return visibleTasks;
    
    return [...visibleTasks].sort((a, b) => {
      // @ts-ignore
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      // @ts-ignore
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [visibleTasks, sortConfig]);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newTaskTitle.trim() && selectedProjectId) {
          await createTask({
              titulo_tarea: newTaskTitle,
              proyecto_id: Number(selectedProjectId),
              estado: 'Por Hacer',
              prioridad: 'Media'
          });
          setNewTaskTitle('');
      } else if (!selectedProjectId) {
          alert("Please select a project first");
      }
  };

  const requestSort = (key: keyof any) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- Kanban Logic ---
  const onDragStart = (e: React.DragEvent, taskId: string) => { // taskId is number in generic, but converting to string for transfer
      e.dataTransfer.setData("taskId", taskId);
  };

  const onDrop = async (e: React.DragEvent, status: string) => {
      const taskId = parseInt(e.dataTransfer.getData("taskId"));
      if(taskId) await updateTask(taskId, { estado: status });
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  // --- Calendar Logic ---
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days: (Date | null)[] = [];
    for(let i = 0; i < firstDay; i++) days.push(null);
    for(let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, []);

  const availableStatuses = ['Por Hacer', 'En Progreso', 'En Revisión', 'Bloqueado', 'Terminado'];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
         <div className="flex items-center gap-3">
             <div className={`p-2 bg-blue-100 rounded-lg text-blue-600`}>
                 <LayoutList size={20}/>
             </div>
             <h1 className="text-xl font-semibold text-gray-800">Global Tasks</h1>
             <span className="text-gray-400 text-sm ml-2">{visibleTasks.length} tasks</span>
         </div>
         
         {/* View Switcher & Actions */}
         <div className="flex items-center gap-4">
             {/* Project Filter */}
             <div className="flex items-center gap-2">
                 <Briefcase size={16} className="text-gray-400"/>
                 <select 
                    className="text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : '')}
                    title="Filter by Project"
                 >
                     <option value="">All Projects</option>
                     {projects.map(p => (
                         <option key={p.id} value={p.id}>{p.nombre_proyecto}</option>
                     ))}
                 </select>
             </div>

             <div className="flex bg-gray-100 p-0.5 rounded-lg">
                <button 
                    onClick={() => setViewMode(ViewMode.LIST)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all duration-200 hover:border-gray-300 border border-transparent ${viewMode === ViewMode.LIST ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="List View"
                >
                    <LayoutList size={16} />
                </button>
                <button 
                    onClick={() => setViewMode(ViewMode.TABLE)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all duration-200 hover:border-gray-300 border border-transparent ${viewMode === ViewMode.TABLE ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="Table View"
                >
                    <TableIcon size={16} />
                </button>
                <button 
                    onClick={() => setViewMode(ViewMode.BOARD)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all duration-200 hover:border-gray-300 border border-transparent ${viewMode === ViewMode.BOARD || viewMode === ViewMode.KANBAN ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="Board/Kanban View"
                >
                    <KanbanSquare size={16} />
                </button>
                <button 
                    onClick={() => setViewMode(ViewMode.CALENDAR)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all duration-200 hover:border-gray-300 border border-transparent ${viewMode === ViewMode.CALENDAR ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="Calendar View"
                >
                    <CalendarIcon size={16} />
                </button>
                <button 
                    onClick={() => setViewMode(ViewMode.ACCORDION)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all duration-200 hover:border-gray-300 border border-transparent ${viewMode === ViewMode.ACCORDION ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="Accordion View"
                >
                    <ListTree size={16} />
                </button>
             </div>
         </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden bg-gray-50/50">
          {viewMode === ViewMode.LIST && (
            <div className="h-full overflow-y-auto px-8 py-6">
                <div className="mb-6">
                    <form onSubmit={handleCreate} className="group relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                            <Plus size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder={selectedProjectId ? "Add a new task to this project..." : "Select a project to add tasks"} 
                            disabled={!selectedProjectId}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                    </form>
                </div>

                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {visibleTasks.map(task => (
                        <div 
                            key={task.id} 
                            onClick={() => setEditingTask(task)}
                            className="group flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md border border-gray-200 cursor-pointer transition-all duration-200 hover:border-indigo-200"
                        >
                            <div className="flex items-center gap-33 overflow-hidden">
                                <button className="shrink-0 pt-0.5">
                                    {getStatusIcon(task.estado)}
                                </button>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-medium truncate ${task.estado === 'Terminado' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {task.titulo_tarea}
                                    </span>
                                    {!selectedProjectId && (
                                        <span className="text-[10px] text-gray-400">
                                            {projects.find(p => p.id === task.proyecto_id)?.nombre_proyecto}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0">
                                {task.fecha_vencimiento && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <CalendarIcon size={12}/> {new Date(task.fecha_vencimiento).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                    </span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.prioridad)}`}>
                                    {task.prioridad}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {(viewMode === ViewMode.BOARD || viewMode === ViewMode.KANBAN) && (
              <div className="h-full overflow-x-auto overflow-y-hidden p-6">
                  <div className="flex gap-6 h-full min-w-max">
                      {availableStatuses.map(status => (
                          <div 
                            key={status} 
                            onDrop={(e) => onDrop(e, status)}
                            onDragOver={onDragOver}
                            className="w-80 flex flex-col h-full bg-gray-100/50 rounded-xl border border-gray-200/60"
                          >
                              {/* Column Header */}
                              <div className="p-3 flex items-center justify-between font-medium text-sm text-gray-500 uppercase tracking-wide">
                                  <div className="flex items-center gap-2">
                                      {getStatusIcon(status)}
                                      {status}
                                  </div>
                                  <span className="bg-gray-200 px-2 rounded-full text-xs text-gray-600">
                                      {visibleTasks.filter(t => t.estado === status).length}
                                  </span>
                              </div>
                              
                              {/* Column Content */}
                              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                  {visibleTasks.filter(t => t.estado === status).map(task => (
                                      <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, task.id.toString())}
                                        onClick={() => setEditingTask(task)}
                                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all"
                                      >
                                          <div className="flex justify-between items-start mb-2">
                                              <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(task.prioridad)}`}>
                                                  {task.prioridad}
                                              </span>
                                              <GripHorizontal size={14} className="text-gray-300" />
                                          </div>
                                          <div className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                                              {task.titulo_tarea}
                                          </div>
                                          <div className="flex items-center justify-between mt-2">
                                               {task.fecha_vencimiento && (
                                                   <div className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded">
                                                       <CalendarIcon size={10} />
                                                       {new Date(task.fecha_vencimiento).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                   </div>
                                               )}
                                               {!selectedProjectId && (
                                                   <div className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                                       {projects.find(p => p.id === task.proyecto_id)?.nombre_proyecto}
                                                   </div>
                                               )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {viewMode === ViewMode.CALENDAR && (
              <div className="h-full p-6 overflow-y-auto">
                  <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase">
                              {day}
                          </div>
                      ))}
                      
                      {calendarDays.map((date, idx) => {
                          if(!date) return <div key={idx} className="bg-white h-32"></div>;
                          
                          const dayTasks = visibleTasks.filter(t => 
                              t.fecha_vencimiento && 
                              new Date(t.fecha_vencimiento).toDateString() === date.toDateString()
                          );

                          return (
                              <div key={idx} className="bg-white min-h-[8rem] p-2 hover:bg-gray-50 transition-colors">
                                  <div className={`text-xs font-medium mb-1 ${date.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-gray-500'}`}>
                                      {date.getDate()}
                                  </div>
                                  <div className="space-y-1">
                                      {dayTasks.map(task => (
                                          <div 
                                              key={task.id}
                                              onClick={() => setEditingTask(task)}
                                              className={`text-[10px] px-1.5 py-1 rounded truncate cursor-pointer ${task.estado === 'Terminado' ? 'bg-gray-100 text-gray-400 line-through' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}
                                          >
                                              {task.titulo_tarea}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {viewMode === ViewMode.TABLE && (
            <div className="h-full overflow-y-auto px-8 py-6">
                <div className="mb-6">
                    <form onSubmit={handleCreate} className="group relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                            <Plus size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder={selectedProjectId ? "Add a new task to this project..." : "Select a project to add tasks"} 
                            disabled={!selectedProjectId}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                    </form>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('titulo_tarea')}
                                >
                                    <div className="flex items-center gap-1">
                                        Task
                                        {sortConfig?.key === 'titulo_tarea' && (
                                            <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? '' : 'rotate-180'} />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('proyecto_id')}
                                >
                                    <div className="flex items-center gap-1">
                                        Project
                                        {sortConfig?.key === 'proyecto_id' && (
                                            <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? '' : 'rotate-180'} />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('estado')}
                                >
                                    <div className="flex items-center gap-1">
                                        Status
                                        {sortConfig?.key === 'estado' && (
                                            <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? '' : 'rotate-180'} />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('prioridad')}
                                >
                                    <div className="flex items-center gap-1">
                                        Priority
                                        {sortConfig?.key === 'prioridad' && (
                                            <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? '' : 'rotate-180'} />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => requestSort('fecha_vencimiento')}
                                >
                                    <div className="flex items-center gap-1">
                                        Due Date
                                        {sortConfig?.key === 'fecha_vencimiento' && (
                                            <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? '' : 'rotate-180'} />
                                        )}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedTasks.map(task => (
                                <tr 
                                    key={task.id} 
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setEditingTask(task)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <button className="mr-3">
                                                {getStatusIcon(task.estado)}
                                            </button>
                                            <div className="text-sm font-medium text-gray-900">
                                                {task.titulo_tarea}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {projects.find(p => p.id === task.proyecto_id)?.nombre_proyecto}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            task.estado === 'Terminado' ? 'bg-green-100 text-green-800' :
                                            task.estado === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                                            task.estado === 'Bloqueado' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {task.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.prioridad)}`}>
                                            {task.prioridad}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {task.fecha_vencimiento ? new Date(task.fecha_vencimiento).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {viewMode === ViewMode.ACCORDION && (
              <div className="h-full overflow-y-auto px-8 py-6 space-y-4">
                 <div className="mb-6">
                    <form onSubmit={handleCreate} className="group relative">
                        <div className="absolute left-3 top-3 text-gray-400">
                            <Plus size={20} />
                        </div>
                        <input 
                            type="text" 
                            placeholder={selectedProjectId ? "Add a new task to this project..." : "Select a project to add tasks"} 
                            disabled={!selectedProjectId}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-sm shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                    </form>
                </div>

                {availableStatuses.map(status => {
                    const groupTasks = visibleTasks.filter(t => t.estado === status);
                    if (groupTasks.length === 0) return null;

                    const isExpanded = isGroupExpanded(status);

                    return (
                        <div key={status} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                            <button 
                                onClick={() => setExpandedGroups(prev => ({ ...prev, [status]: !isExpanded }))}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2 font-medium text-gray-700 text-sm">
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    {getStatusIcon(status)}
                                    <span>{status}</span>
                                    <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full ml-2">
                                        {groupTasks.length}
                                    </span>
                                </div>
                            </button>
                            
                            {isExpanded && (
                                <div className="divide-y divide-gray-100">
                                    {groupTasks.map(task => (
                                        <div 
                                            key={task.id} 
                                            onClick={() => setEditingTask(task)}
                                            className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors group pl-9 cursor-pointer"
                                        >
                                           <div className="flex items-center gap-3">
                                               <span className={`text-sm ${task.estado === 'Terminado' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                   {task.titulo_tarea}
                                               </span>
                                           </div>
                                            <div className="flex items-center gap-4 text-xs">
                                                {!selectedProjectId && (
                                                    <span className="text-gray-400">
                                                        {projects.find(p => p.id === task.proyecto_id)?.nombre_proyecto}
                                                    </span>
                                                )}
                                                <span className={`px-2 py-0.5 rounded font-medium ${getPriorityColor(task.prioridad)}`}>
                                                    {task.prioridad}
                                                </span>
                                                {task.fecha_vencimiento && (
                                                    <span className="text-gray-400 flex items-center gap-1">
                                                        <CalendarIcon size={12}/> {new Date(task.fecha_vencimiento).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
              </div>
          )}
      </div>
      
      {editingTask && (
        <TaskEditModal 
            task={editingTask} 
            allTasks={tasks}
            onClose={() => setEditingTask(null)} 
            onUpdate={(id: any, updates: any) => {
                updateTask(id, updates);
                setEditingTask(prev => prev ? { ...prev, ...updates } : null);
            }}
            onDelete={(id: any) => {
                if(window.confirm('Delete this task?')) {
                    deleteTask(id);
                    setEditingTask(null);
                }
            }}
            onCreateSubtask={(parentId: any, title: any) => {
                 createTask({
                    proyecto_id: editingTask.proyecto_id,
                    titulo_tarea: title,
                    estado: 'Por Hacer',
                    prioridad: 'Media',
                    es_subtarea_de_id: parentId
                 });
            }}
        />
      )}
    </div>
  );
};