
import React, { useState, useEffect } from 'react';
import { usePersistence } from '../src/context/CentralizedPersistenceContext';
import { Search, Plus, Calendar, FolderKanban, Pencil, Trash2, Loader2, DollarSign, PieChart, ArrowLeft, CheckCircle2, Circle, Clock, LayoutList, Table as TableIcon, KanbanSquare, Calendar as CalendarIcon, ListTree, GripHorizontal, ChevronDown, ChevronRight, CircleDashed, Eye } from 'lucide-react';
import { ProyectoMaestro, Tarea, EstadoTarea, ViewMode } from '../types';
import { TaskEditModal } from './TaskEditModal';

export const ProjectsView: React.FC = () => {
    const { 
        projects, createProject, updateProject, deleteProject, 
        tasks, fetchTasks, createTask, updateTask, deleteTask,
        loading, error 
    } = usePersistence();
    
    // View State
    const [selectedProject, setSelectedProject] = useState<ProyectoMaestro | null>(null);
    const [editingTask, setEditingTask] = useState<Tarea | null>(null);
    const [editingProject, setEditingProject] = useState<ProyectoMaestro | null>(null);

    // Project List State
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New Project Form State
    const [nombreProyecto, setNombreProyecto] = useState('');
    const [tipoActivo, setTipoActivo] = useState('Web');
    const [presupuesto, setPresupuesto] = useState(0);

    // Edit Project Form State
    const [editNombreProyecto, setEditNombreProyecto] = useState('');
    const [editTipoActivo, setEditTipoActivo] = useState('Web');
    const [editPresupuesto, setEditPresupuesto] = useState(0);

    // New Task Form State
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('Media');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    // View Modes State
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };
    const isGroupExpanded = (group: string) => expandedGroups[group] !== false;

    // Helpers for Views
    const getStatusIcon = (s: string) => {
        switch(s) {
            case 'Terminado': return <CheckCircle2 size={18} className="text-green-500" />;
            case 'En Progreso': return <CircleDashed size={18} className="text-blue-500 animate-[spin_3s_linear_infinite]" />;
            case 'En Revisión': return <Eye size={18} className="text-purple-500" />;
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

    // Kanban DnD
    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };
    const onDrop = async (e: React.DragEvent, status: string) => {
        const taskId = e.dataTransfer.getData("taskId");
        if(taskId) await updateTask(taskId, { estado: status });
    };
    const onDragOver = (e: React.DragEvent) => e.preventDefault();

    // Calendar Days Calculation
    const calendarDays = React.useMemo(() => {
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
    useEffect(() => {
        if (selectedProject) {
            fetchTasks(selectedProject.id);
        }
    }, [selectedProject, fetchTasks]);

    const filteredProjects = projects.filter(p => 
        p.nombre_proyecto.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenAdd = () => {
        setNombreProyecto('');
        setTipoActivo('Web');
        setPresupuesto(0);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (project: ProyectoMaestro) => {
        setEditingProject(project);
        setEditNombreProyecto(project.nombre_proyecto);
        setEditTipoActivo(project.tipo_activo);
        setEditPresupuesto(project.presupuesto_asignado);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createProject(nombreProyecto, tipoActivo, presupuesto);
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to create project", err);
        }
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;
        
        try {
            await updateProject(editingProject.id, {
                nombre_proyecto: editNombreProyecto,
                tipo_activo: editTipoActivo,
                presupuesto_asignado: editPresupuesto,
                ultima_actualizacion: new Date().toISOString()
            });
            setEditingProject(null);
            // If we're editing the currently selected project, update it
            if (selectedProject && selectedProject.id === editingProject.id) {
                setSelectedProject({
                    ...selectedProject,
                    nombre_proyecto: editNombreProyecto,
                    tipo_activo: editTipoActivo,
                    presupuesto_asignado: editPresupuesto
                });
            }
        } catch (err) {
            console.error("Failed to update project", err);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(window.confirm('Are you sure you want to delete this project?')) {
            await deleteProject(id);
            if (selectedProject?.id === id) {
                setSelectedProject(null);
            }
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject || !newTaskTitle.trim()) return;

        try {
            await createTask({
                proyecto_id: selectedProject.id,
                titulo_tarea: newTaskTitle,
                estado: 'Por Hacer',
                prioridad: newTaskPriority,
                fecha_vencimiento: newTaskDueDate || undefined
            });
            
            // Reset form
            setNewTaskTitle('');
            setNewTaskPriority('Media');
            setNewTaskDueDate('');
            setShowTaskForm(false);
        } catch (err) {
            console.error("Failed to create task", err);
        }
    };

    const getAssestColor = (type: string) => {
        switch(type) {
            case 'Web': return 'bg-blue-100 text-blue-700';
            case 'App': return 'bg-purple-100 text-purple-700';
            case 'Ebook': return 'bg-green-100 text-green-700';
            case 'Curso': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getTaskPriorityColor = (prio: string) => {
        switch(prio) {
            case 'Alta': return 'text-red-600 bg-red-50';
            case 'Media': return 'text-orange-600 bg-orange-50';
            case 'Baja': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    // --- Detail View Render ---
    if (selectedProject) {
        return (
            <div className="flex flex-col h-full bg-white animate-[fadeIn_0.2s_ease-out]">
                {/* Detail Header */}
                <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0 bg-white">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSelectedProject(null)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                            title="Back to Projects"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {selectedProject.nombre_proyecto}
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getAssestColor(selectedProject.tipo_activo)}`}>
                                    {selectedProject.tipo_activo}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1"><DollarSign size={12}/> Budget: ${selectedProject.presupuesto_asignado.toLocaleString()}</span>
                                <span className="flex items-center gap-1"><PieChart size={12}/> Progress: {Math.round(selectedProject.progreso_total)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleOpenEdit(selectedProject)}
                            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium text-sm transition-all shadow-sm"
                            title="Edit Project"
                        >
                            <Pencil size={16} /> Edit
                        </button>
                        <button 
                            onClick={() => setShowTaskForm(true)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-all shadow-sm"
                            title="Add New Task"
                        >
                            <Plus size={16} /> Add Task
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-gray-50/50 flex flex-col">
                     {/* View Switcher Toolbar */}
                     <div className="px-6 py-4 flex items-center justify-between shrink-0">
                        <h3 className="text-sm font-bold text-gray-700">Project Tasks</h3>
                        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                            <button onClick={() => setViewMode(ViewMode.LIST)} className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all ${viewMode === ViewMode.LIST ? 'bg-gray-100 text-gray-900 font-medium' : ''}`} title="List View"><LayoutList size={16} /></button>
                            <button onClick={() => setViewMode(ViewMode.TABLE)} className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all ${viewMode === ViewMode.TABLE ? 'bg-gray-100 text-gray-900 font-medium' : ''}`} title="Table View"><TableIcon size={16} /></button>
                            <button onClick={() => setViewMode(ViewMode.BOARD)} className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all ${viewMode === ViewMode.BOARD || viewMode === ViewMode.KANBAN ? 'bg-gray-100 text-gray-900 font-medium' : ''}`} title="Kanban View"><KanbanSquare size={16} /></button>
                            <button onClick={() => setViewMode(ViewMode.CALENDAR)} className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all ${viewMode === ViewMode.CALENDAR ? 'bg-gray-100 text-gray-900 font-medium' : ''}`} title="Calendar View"><CalendarIcon size={16} /></button>
                            <button onClick={() => setViewMode(ViewMode.ACCORDION)} className={`p-1.5 rounded-md text-gray-500 hover:text-gray-900 transition-all ${viewMode === ViewMode.ACCORDION ? 'bg-gray-100 text-gray-900 font-medium' : ''}`} title="Accordion View"><ListTree size={16} /></button>
                        </div>
                     </div>

                    <div className="flex-1 overflow-auto px-6 pb-6">
                         {/* Inline Task Form */}
                         {showTaskForm && (
                            <div className="mb-6 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm animate-[slideDown_0.2s_ease-out]">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">New Task</h3>
                                <form onSubmit={handleCreateTask} className="space-y-4">
                                    <input 
                                        autoFocus
                                        placeholder="What needs to be done?"
                                        className="w-full text-lg font-medium border-b border-gray-200 pb-2 focus:outline-none focus:border-indigo-500 placeholder:text-gray-300 transition-colors"
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        title="Task Title"
                                    />
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Priority</label>
                                            <select 
                                                value={newTaskPriority}
                                                onChange={e => setNewTaskPriority(e.target.value)}
                                                className="text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                title="Task Priority"
                                            >
                                                <option value="Alta">High</option>
                                                <option value="Media">Medium</option>
                                                <option value="Baja">Low</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Due Date</label>
                                            <input 
                                                type="date"
                                                value={newTaskDueDate}
                                                onChange={e => setNewTaskDueDate(e.target.value)}
                                                className="text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                                title="Task Due Date"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setShowTaskForm(false)}
                                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit"
                                            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg font-medium hover:bg-indigo-700 shadow-sm"
                                        >
                                            Create Task
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* LIST VIEW */}
                        {viewMode === ViewMode.LIST && (
                            <div className="space-y-3">
                                {tasks.filter(t => !t.es_subtarea_de_id).length === 0 && !showTaskForm ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <CheckCircle2 size={48} className="mx-auto mb-3 text-gray-200" />
                                        <p>No tasks yet. Create one to get started!</p>
                                    </div>
                                ) : (
                                    tasks.filter(t => !t.es_subtarea_de_id).map(task => (
                                        <TaskItem 
                                            key={task.id} 
                                            task={task} 
                                            allTasks={tasks} 
                                            onEdit={(t: any) => setEditingTask(t)}
                                            onDelete={(id: string) => {
                                                if(window.confirm('Delete this task?')) {
                                                    deleteTask(id);
                                                }
                                            }}
                                            getAssestColor={getAssestColor}
                                            getTaskPriorityColor={getTaskPriorityColor}
                                        />
                                    ))
                                )}
                            </div>
                        )}

                        {/* KANBAN VIEW */}
                        {(viewMode === ViewMode.BOARD || viewMode === ViewMode.KANBAN) && (
                           <div className="h-full overflow-x-auto min-h-[400px]">
                               <div className="flex gap-4 h-full min-w-max pb-4">
                                   {availableStatuses.map(status => (
                                       <div 
                                         key={status} 
                                         onDrop={(e) => onDrop(e, status)}
                                         onDragOver={onDragOver}
                                         className="w-72 flex flex-col h-full bg-gray-100/50 rounded-xl border border-gray-200/60"
                                       >
                                           <div className="p-3 flex items-center justify-between font-medium text-xs text-gray-500 uppercase tracking-wide bg-gray-50/50 rounded-t-xl">
                                               <div className="flex items-center gap-2">
                                                   {getStatusIcon(status)}
                                                   {status}
                                               </div>
                                               <span className="bg-white border border-gray-200 px-2 rounded-full text-[10px] text-gray-600">
                                                   {tasks.filter(t => t.estado === status && !t.es_subtarea_de_id).length}
                                               </span>
                                           </div>
                                            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                                {tasks.filter(t => t.estado === status && !t.es_subtarea_de_id).map(task => (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => onDragStart(e, task.id)}
                                                        onClick={() => setEditingTask(task)}
                                                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-all"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${getPriorityColor(task.prioridad)}`}>
                                                                {task.prioridad}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                                                            {task.titulo_tarea}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                            {task.fecha_vencimiento && (
                                                                <span className="flex items-center gap-1"><CalendarIcon size={10} /> {new Date(task.fecha_vencimiento).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
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

                        {/* TABLE VIEW */}
                        {viewMode === ViewMode.TABLE && (
                             <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden min-w-[600px]">
                                 <table className="w-full text-sm text-left">
                                     <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                         <tr>
                                             <th className="px-4 py-3">Task</th>
                                             <th className="px-4 py-3">Status</th>
                                             <th className="px-4 py-3">Priority</th>
                                             <th className="px-4 py-3">Due Date</th>
                                             <th className="px-4 py-3">Actions</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-gray-100">
                                         {tasks.filter(t => !t.es_subtarea_de_id).map(task => (
                                             <tr 
                                                key={task.id} 
                                                className="hover:bg-gray-50 group cursor-pointer"
                                                onClick={() => setEditingTask(task)}
                                            >
                                                 <td className="px-4 py-3 font-medium text-gray-900 border-r border-transparent">
                                                     <div className="flex items-center gap-2">
                                                        {getStatusIcon(task.estado)}
                                                        {task.titulo_tarea}
                                                     </div>
                                                 </td>
                                                 <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.estado === 'Terminado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{task.estado}</span>
                                                 </td>
                                                 <td className="px-4 py-3">
                                                     <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.prioridad)}`}>{task.prioridad}</span>
                                                 </td>
                                                 <td className="px-4 py-3 text-gray-500">
                                                     {task.fecha_vencimiento ? new Date(task.fecha_vencimiento).toLocaleDateString() : '-'}
                                                 </td>
                                                 <td className="px-4 py-3">
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                         <button onClick={() => setEditingTask(task)} className="text-gray-400 hover:text-indigo-600" title="Edit Task"><Pencil size={14}/></button>
                                                         <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-600" title="Delete Task"><Trash2 size={14}/></button>
                                                     </div>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        )}

                        {/* CALENDAR VIEW */}
                        {viewMode === ViewMode.CALENDAR && (
                             <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500 uppercase">
                                        {day}
                                    </div>
                                ))}
                                {calendarDays.map((date, idx) => {
                                    if(!date) return <div key={idx} className="bg-white h-32"></div>;
                                    const dayTasks = tasks.filter(t => t.fecha_vencimiento && new Date(t.fecha_vencimiento).toDateString() === date.toDateString());
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
                        )}

                        {/* ACCORDION VIEW */}
                        {viewMode === ViewMode.ACCORDION && (
                            <div className="space-y-4">
                                {availableStatuses.map(status => {
                                    const groupTasks = tasks.filter(t => t.estado === status && !t.es_subtarea_de_id);
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
                                                        <div key={task.id} className="p-3 pl-9 hover:bg-gray-50 transition-colors">
                                                             <TaskItem 
                                                                task={task} 
                                                                allTasks={tasks} 
                                                                onEdit={(t: any) => setEditingTask(t)}
                                                                onDelete={(id: string) => {
                                                                    if(window.confirm('Delete this task?')) {
                                                                        deleteTask(id);
                                                                    }
                                                                }}
                                                                getAssestColor={getAssestColor}
                                                                getTaskPriorityColor={getTaskPriorityColor}
                                                            />
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
                </div>

                {/* Edit Task Modal */}
                {editingTask && (
                    <TaskEditModal 
                        task={editingTask} 
                        allTasks={tasks}
                        onClose={() => setEditingTask(null)} 
                        onUpdate={(id, updates) => {
                            updateTask(id, updates);
                            setEditingTask(prev => prev ? { ...prev, ...updates } : null);
                        }}
                        onDelete={(id) => {
                            if(window.confirm('Delete this task?')) {
                                deleteTask(id);
                                setEditingTask(null);
                            }
                        }}
                        onCreateSubtask={(parentId, title) => {
                             createTask({
                                proyecto_id: selectedProject.id,
                                titulo_tarea: title,
                                estado: 'Por Hacer',
                                prioridad: 'Media',
                                es_subtarea_de_id: parentId
                             });
                        }}
                    />
                )}

                {/* Edit Project Modal */}
                {editingProject && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <form onSubmit={handleUpdateProject} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out] flex flex-col">
                            <h2 className="text-lg font-bold mb-6 text-gray-800">Edit Project</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Project Name</label>
                                    <input 
                                        autoFocus
                                        required 
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm" 
                                        value={editNombreProyecto} 
                                        onChange={e => setEditNombreProyecto(e.target.value)}
                                        placeholder="e.g. Nexus App Launch"
                                        title="Project Name"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Asset Type</label>
                                    <select 
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm"
                                        value={editTipoActivo}
                                        onChange={(e) => setEditTipoActivo(e.target.value)}
                                        title="Asset Type"
                                    >
                                        <option value="Web">Web Platform</option>
                                        <option value="App">Mobile App</option>
                                        <option value="Ebook">Digital Book</option>
                                        <option value="Curso">Online Course</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Assigned Budget</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        step="100"
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm" 
                                        value={editPresupuesto} 
                                        onChange={e => setEditPresupuesto(Number(e.target.value))} 
                                        title="Assigned Budget" 
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingProject(null)} 
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
                                >
                                    {loading && <Loader2 size={14} className="animate-spin" />}
                                    Update Project
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        );
    }

    // --- Main List Render ---
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg text-teal-600"><FolderKanban size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">Projects Portfolio</h1>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-all duration-200 hover:border-indigo-300 border border-transparent"
                >
                    <Plus size={16} /> New Project
                </button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search projects..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none text-sm transition-all duration-200 focus:border-teal-300"
                    />
                </div>
                {loading && <div className="text-xs text-indigo-500 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Syncing...</div>}
                {error && <div className="text-xs text-red-500">{error}</div>}
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
                {filteredProjects.length === 0 && !isModalOpen ? (
                     <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FolderKanban size={48} className="mb-4 text-gray-300" />
                        <p className="text-sm font-medium">No projects found.</p>
                     </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProjects.map(project => (
                            <div 
                                key={project.id} 
                                onClick={() => setSelectedProject(project)}
                                className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all cursor-pointer p-3 flex flex-col relative max-h-80 overflow-y-auto"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${getAssestColor(project.tipo_activo)}`}>
                                        {project.tipo_activo}
                                    </span>
                                    <div className="flex gap-1 opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(project); }} 
                                            className="text-gray-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded" 
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, project.id)} 
                                            className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded" 
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 text-base mb-1">{project.nombre_proyecto}</h3>
                                
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={14} />
                                            <span>Budget</span>
                                        </div>
                                        <span className="font-medium text-gray-900">${project.presupuesto_asignado?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <PieChart size={14} />
                                            <span>Expenses</span>
                                        </div>
                                        <span className="font-medium text-gray-900">${project.gastos_acumulados?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            <span>Updated</span>
                                        </div>
                                        <span className="font-medium text-gray-900">{new Date(project.ultima_actualizacion).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Task & Comments Info */}
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5" title="Tasks Completed / Total">
                                            <CheckCircle2 size={14} className="text-teal-500" />
                                            <span className="font-medium">
                                                {tasks.filter(t => t.proyecto_id === project.id && t.estado === 'Terminado').length}
                                                <span className="text-gray-400 mx-0.5">/</span>
                                                {tasks.filter(t => t.proyecto_id === project.id).length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5" title="Comments">
                                            <LayoutList size={14} className="text-indigo-400" />
                                            <span className="font-medium">0</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 mt-3">
                                    <div className="flex justify-between text-[10px] font-medium">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="text-gray-900">{Math.round(project.progreso_total || 0)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                            style={{ width: `${project.progreso_total || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out] flex flex-col">
                        <h2 className="text-lg font-bold mb-6 text-gray-800">New Project</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Project Name</label>
                                <input 
                                    autoFocus
                                    required 
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm" 
                                    value={nombreProyecto} 
                                    onChange={e => setNombreProyecto(e.target.value)}
                                    placeholder="e.g. Nexus App Launch"
                                    title="Project Name"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Asset Type</label>
                                <select 
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm"
                                    value={tipoActivo}
                                    onChange={(e) => setTipoActivo(e.target.value)}
                                    title="Asset Type"
                                >
                                    <option value="Web">Web Platform</option>
                                    <option value="App">Mobile App</option>
                                    <option value="Ebook">Digital Book</option>
                                    <option value="Curso">Online Course</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Assigned Budget</label>
                                <input 
                                    type="number"
                                    min="0"
                                    step="100"
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 text-sm" 
                                    value={presupuesto} 
                                    onChange={e => setPresupuesto(Number(e.target.value))} 
                                    title="Assigned Budget" 
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
                            >
                                {loading && <Loader2 size={14} className="animate-spin" />}
                                Create Project
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

// --- Sub-components (Placed in same file for simplicity, can be extracted) ---

const TaskItem = ({ task, allTasks, onEdit, onDelete, getAssestColor, getTaskPriorityColor }: any) => {
     const subtasks = allTasks.filter((t: any) => t.es_subtarea_de_id === task.id);
     const completedSub = subtasks.filter((t: any) => t.estado === 'Terminado').length;
     const totalSub = subtasks.length;
    
     return (
        <div 
             onClick={() => onEdit(task)}
             className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition-all group flex items-start gap-4 cursor-pointer"
        >
            <div className="mt-1 text-gray-400">
                {task.estado === 'Terminado' ? <CheckCircle2 className="text-green-500" /> : <Circle />}
            </div>
            <div className="flex-1">
                <h4 className={`font-medium text-gray-900 ${task.estado === 'Terminado' ? 'line-through text-gray-400' : ''}`}>
                    {task.titulo_tarea}
                </h4>
                <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getTaskPriorityColor(task.prioridad)}`}>
                        {task.prioridad} Priority
                    </span>
                    {task.fecha_vencimiento && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(task.fecha_vencimiento).toLocaleDateString()}
                        </span>
                    )}
                     {totalSub > 0 && (
                        <span className="text-xs text-indigo-500 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {completedSub}/{totalSub} Subtasks
                        </span>
                    )}
                     {task.descripcion && (
                         <span className="text-xs text-gray-400 flex items-center gap-1" title="Has comments">
                             <Pencil size={10} />
                         </span>
                     )}
                </div>
            </div>
             <button 
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-2 transition-all"
                title="Delete Task"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};