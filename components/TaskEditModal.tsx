import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';

// Recursive Subtask Component
const SubtaskItem: React.FC<any> = ({ task, allTasks, onUpdate, onDelete, onCreateSubtask }) => {
    const children = allTasks.filter((t: any) => t.es_subtarea_de_id === task.id);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const handleAddSub = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newSubtaskTitle.trim()) return;
        onCreateSubtask(task.id, newSubtaskTitle);
        setNewSubtaskTitle('');
        setIsAdding(false);
    };

    return (
        <li className="flex flex-col">
            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group transition-colors">
                {/* Expand Toggle */}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`p-0.5 rounded text-gray-400 hover:text-gray-600 ${children.length === 0 ? 'invisible' : ''}`}
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Status Toggle */}
                <button 
                    onClick={() => onUpdate(task.id, { estado: task.estado === 'Terminado' ? 'Por Hacer' : 'Terminado' })}
                    className={task.estado === 'Terminado' ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'}
                    title={task.estado === 'Terminado' ? "Mark as Incomplete" : "Mark as Complete"}
                >
                    {task.estado === 'Terminado' ? <CheckCircle2 size={16}/> : <Circle size={16}/>}
                </button>

                {/* Title */}
                <span className={`flex-1 text-sm ${task.estado === 'Terminado' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {task.titulo_tarea}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Add Sub-subtask"
                    >
                        <Plus size={14} />
                    </button>
                    <button 
                        onClick={() => onDelete(task.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        title="Delete Subtask"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Nested Content */}
            <div className="pl-6 border-l border-gray-100 ml-3.5 space-y-2">
                {isAdding && (
                    <form onSubmit={handleAddSub} className="flex gap-2 p-2 animate-[fadeIn_0.2s]">
                        <input 
                            autoFocus
                            className="flex-1 py-1 px-2 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-500 outline-none" 
                            placeholder="Subtask title..."
                            value={newSubtaskTitle}
                            onChange={e => setNewSubtaskTitle(e.target.value)}
                        />
                        <button type="submit" className="bg-indigo-600 text-white px-2 py-1 rounded text-xs">Add</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600 text-xs px-1">Cancel</button>
                    </form>
                )}
                
                {isExpanded && children.length > 0 && (
                    <ul className="space-y-1">
                        {children.map((child: any) => (
                            <SubtaskItem 
                                key={child.id} 
                                task={child} 
                                allTasks={allTasks} 
                                onUpdate={onUpdate} 
                                onDelete={onDelete} 
                                onCreateSubtask={onCreateSubtask} 
                            />
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
};

export const TaskEditModal: React.FC<any> = ({ task, allTasks, onClose, onUpdate, onDelete, onCreateSubtask }) => {
    const [title, setTitle] = useState(task.titulo_tarea);
    const [status, setStatus] = useState(task.estado);
    const [priority, setPriority] = useState(task.prioridad);
    const [dueDate, setDueDate] = useState(task.fecha_vencimiento || '');
    const [desc, setDesc] = useState(task.descripcion || '');
    
    // Custom Fields State
    const [customFieldsList, setCustomFieldsList] = useState<{id: number, key: string, value: string}[]>(() => {
        const fields = task.campos_personalizados || {};
        return Object.entries(fields).map(([k, v], idx) => ({ id: idx, key: k, value: v as string }));
    });

    // Root level subtask input
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    
    // Get only direct children of the current task
    const subtasks = allTasks.filter((t: any) => t.es_subtarea_de_id === task.id);

    const handleSave = () => {
        // Convert custom fields list back to object
        const customFieldsObj = customFieldsList.reduce((acc, curr) => {
            if (curr.key.trim()) {
                acc[curr.key.trim()] = curr.value;
            }
            return acc;
        }, {} as Record<string, string>);

        onUpdate(task.id, {
            titulo_tarea: title,
            estado: status,
            prioridad: priority,
            fecha_vencimiento: dueDate || null,
            descripcion: desc,
            campos_personalizados: customFieldsObj
        });
        onClose();
    };

    const handleAddSub = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newSubtaskTitle.trim()) return;
        onCreateSubtask(task.id, newSubtaskTitle);
        setNewSubtaskTitle('');
    }

    const handleAddField = () => {
        setCustomFieldsList([...customFieldsList, { id: Date.now(), key: '', value: '' }]);
    };

    const handleRemoveField = (id: number) => {
        setCustomFieldsList(customFieldsList.filter(f => f.id !== id));
    };

    const handleFieldChange = (id: number, field: 'key' | 'value', newValue: string) => {
        setCustomFieldsList(customFieldsList.map(f => 
            f.id === id ? { ...f, [field]: newValue } : f
        ));
    };

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

                         {/* Custom Fields Section */}
                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase flex items-center justify-between mb-2">
                                 <span>Custom Fields</span>
                                 <button 
                                    onClick={handleAddField}
                                    className="text-indigo-600 hover:text-indigo-800 text-[10px] flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full"
                                 >
                                     <Plus size={10} /> Add Field
                                 </button>
                             </label>
                             
                             <div className="space-y-2">
                                {customFieldsList.map((field) => (
                                    <div key={field.id} className="flex gap-2">
                                        <input 
                                            className="w-1/3 text-xs border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-indigo-500"
                                            placeholder="Label (e.g. Client)"
                                            value={field.key}
                                            onChange={e => handleFieldChange(field.id, 'key', e.target.value)}
                                        />
                                        <input 
                                            className="flex-1 text-xs border-gray-200 rounded focus:ring-indigo-500"
                                            placeholder="Value"
                                            value={field.value}
                                            onChange={e => handleFieldChange(field.id, 'value', e.target.value)}
                                        />
                                        <button 
                                            onClick={() => handleRemoveField(field.id)}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                            title="Remove Field"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {customFieldsList.length === 0 && (
                                    <div className="text-xs text-center p-3 border border-dashed border-gray-200 rounded-lg text-gray-400">
                                        No custom fields added.
                                    </div>
                                )}
                             </div>
                         </div>
                     </div>
                     
                     <div className="border-t border-gray-100 pt-6">
                         <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                             Subtasks <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{subtasks.length}</span>
                         </h3>
                         
                          <ul className="space-y-1 mb-4">
                             {subtasks.map((sub: any) => (
                                 <SubtaskItem 
                                    key={sub.id} 
                                    task={sub} 
                                    allTasks={allTasks}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                    onCreateSubtask={onCreateSubtask}
                                 />
                             ))}
                         </ul>

                         <form onSubmit={handleAddSub} className="flex gap-2">
                             <input 
                                className="flex-1 border-gray-200 rounded-lg text-sm focus:ring-indigo-500" 
                                placeholder="Add a root subtask..."
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
