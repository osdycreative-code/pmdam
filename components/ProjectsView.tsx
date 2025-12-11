
import React, { useState, useEffect } from 'react';
import { usePersistence } from '../src/context/CentralizedPersistenceContext';
import { Search, Plus, Calendar, FolderKanban, Pencil, Trash2, Loader2, DollarSign, PieChart, ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import { ProyectoMaestro, Tarea, EstadoTarea } from '../types';

export const ProjectsView: React.FC = () => {
    const { 
        projects, createProject, deleteProject, 
        tasks, fetchTasks, createTask, updateTask, deleteTask,
        loading, error 
    } = usePersistence();
    
    // View State
    const [selectedProject, setSelectedProject] = useState<ProyectoMaestro | null>(null);
    const [editingTask, setEditingTask] = useState<Tarea | null>(null);

    // Project List State
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New Project Form State
    const [nombreProyecto, setNombreProyecto] = useState('');
    const [tipoActivo, setTipoActivo] = useState('Web');
    const [presupuesto, setPresupuesto] = useState(0);

    // New Task Form State
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('Media');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');

    // Fetch tasks when a project is selected
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createProject(nombreProyecto, tipoActivo, presupuesto);
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to create project", err);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
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
                    
                    <button 
                        onClick={() => setShowTaskForm(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-all shadow-sm"
                        title="Add New Task"
                    >
                        <Plus size={16} /> Add Task
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Task Creation Form (Inline) */}
                        {showTaskForm && (
                            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm animate-[slideDown_0.2s_ease-out]">
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

                        {/* Task List */}
                        <div className="space-y-3">
                            {tasks.filter(t => !t.es_subtarea_de_id).length === 0 ? (
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
                                        onEdit={(t) => setEditingTask(t)}
                                        onDelete={(id) => {
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
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

                                <div className="space-y-1 mt-4">
                                    <div className="flex justify-between text-[10px] font-medium">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="text-gray-900">{Math.round(project.progreso_total || 0)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        {/* eslint-disable-next-line */}
                                        <div 
                                            className="h-full bg-teal-500 rounded-full transition-all duration-500 w-[var(--prog)]"
                                            style={{ '--prog': `${project.progreso_total || 0}%` } as React.CSSProperties}
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


const TaskEditModal = ({ task, allTasks, onClose, onUpdate, onDelete, onCreateSubtask }: any) => {
    const [title, setTitle] = useState(task.titulo_tarea);
    const [status, setStatus] = useState(task.estado);
    const [priority, setPriority] = useState(task.prioridad);
    const [dueDate, setDueDate] = useState(task.fecha_vencimiento || '');
    const [desc, setDesc] = useState(task.descripcion || '');
    
    // Subtask input
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    
    const subtasks = allTasks.filter((t: any) => t.es_subtarea_de_id === task.id);

    const handleSave = () => {
        onUpdate(task.id, {
            titulo_tarea: title,
            estado: status,
            prioridad: priority,
            fecha_vencimiento: dueDate || null,
            descripcion: desc
        });
        onClose();
    };

    const handleAddSub = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newSubtaskTitle.trim()) return;
        onCreateSubtask(task.id, newSubtaskTitle);
        setNewSubtaskTitle('');
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-end backdrop-blur-sm animate-[fadeIn_0.2s]">
             <div className="w-full max-w-lg h-full bg-white shadow-2xl p-0 flex flex-col animate-[slideLeft_0.3s]">
                 <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                     <h2 className="font-bold text-gray-800">Edit Task</h2>
                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Close</button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-6">
                     <div className="space-y-4">
                         <input 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full text-xl font-bold border-none focus:ring-0 p-0 placeholder-gray-300" 
                            placeholder="Task Title"
                        />
                         
                         <div className="flex gap-4">
                             <div className="flex-1">
                                 <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                                 <select 
                                    className="w-full mt-1 border-gray-200 rounded-lg text-sm"
                                    value={status} 
                                    onChange={e => setStatus(e.target.value)}
                                    title="Task Status"
                                >
                                     <option value='Por Hacer'>To Do</option>
                                     <option value='En Progreso'>In Progress</option>
                                     <option value='Terminado'>Done</option>
                                 </select>
                             </div>
                             <div className="flex-1">
                                 <label className="text-xs font-bold text-gray-400 uppercase">Priority</label>
                                  <select 
                                    className="w-full mt-1 border-gray-200 rounded-lg text-sm"
                                    value={priority} 
                                    onChange={e => setPriority(e.target.value)}
                                    title="Task Priority"
                                >
                                     <option value='Alta'>High</option>
                                     <option value='Media'>Medium</option>
                                     <option value='Baja'>Low</option>
                                 </select>
                             </div>
                         </div>
                         
                          <div>
                             <label className="text-xs font-bold text-gray-400 uppercase">Due Date</label>
                             <input 
                                type="date"
                                className="w-full mt-1 border-gray-200 rounded-lg text-sm"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                title="Due Date"
                             />
                         </div>

                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase">Comments / Description</label>
                             <textarea 
                                className="w-full mt-1 border-gray-200 rounded-lg text-sm p-3 h-32 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Add details or comments here..."
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                             />
                         </div>
                     </div>
                     
                     <div className="border-t border-gray-100 pt-6">
                         <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                             Subtasks <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{subtasks.length}</span>
                         </h3>
                         
                          <ul className="space-y-2 mb-4">
                             {subtasks.map((sub: any) => (
                                 <li key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group">
                                     <button 
                                        onClick={() => onUpdate(sub.id, { estado: sub.estado === 'Terminado' ? 'Por Hacer' : 'Terminado' })}
                                        className={sub.estado === 'Terminado' ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'}
                                    >
                                         {sub.estado === 'Terminado' ? <CheckCircle2 size={16}/> : <Circle size={16}/>}
                                     </button>
                                     <span className={`flex-1 text-sm ${sub.estado === 'Terminado' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                         {sub.titulo_tarea}
                                     </span>
                                     <button 
                                        onClick={() => onDelete(sub.id)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete Subtask"
                                    >
                                         <Trash2 size={14} />
                                     </button>
                                 </li>
                             ))}
                         </ul>

                         <form onSubmit={handleAddSub} className="flex gap-2">
                             <input 
                                className="flex-1 border-gray-200 rounded-lg text-sm focus:ring-indigo-500" 
                                placeholder="Add a subtask..."
                                value={newSubtaskTitle}
                                onChange={e => setNewSubtaskTitle(e.target.value)}
                                title="New Subtask Title"
                            />
                             <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors" title="Add Subtask">Add</button>
                         </form>
                     </div>
                 </div>

                 <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
                     <button onClick={() => onDelete(task.id)} className="text-red-600 text-sm font-medium hover:underline">Delete Task</button>
                     <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-all">Save Changes</button>
                 </div>
             </div>
        </div>
    );
};