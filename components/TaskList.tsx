
import React, { useState, useMemo } from 'react';
import { usePersistence } from '../src/context/CentralizedPersistenceContext';
import { Plus, Filter, ArrowUpDown, Circle, CheckCircle2, CircleDashed, LayoutList, KanbanSquare, Calendar as CalendarIcon, GripHorizontal, Briefcase } from 'lucide-react';
import { ViewMode, EstadoTarea } from '../types';

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
  const { tasks, projects, createTask, updateTask, loading } = usePersistence();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);

  // Filter tasks
  const visibleTasks = useMemo(() => {
      let filtered = tasks;
      if (selectedProjectId) {
          filtered = filtered.filter(t => t.proyecto_id === selectedProjectId);
      }
      return filtered;
  }, [tasks, selectedProjectId]);

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
                    onClick={() => setViewMode(ViewMode.BOARD)}
                    className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all duration-200 hover:border-gray-300 border border-transparent ${viewMode === ViewMode.BOARD ? 'bg-white shadow-sm text-gray-900' : ''}`}
                    title="Board View"
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
                            className="group flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md border border-gray-200 cursor-pointer transition-all duration-200 hover:border-indigo-200"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
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

          {viewMode === ViewMode.BOARD && (
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
      </div>
    </div>
  );
};