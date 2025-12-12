import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';

export const TaskEditModal: React.FC<any> = ({ task, allTasks, onClose, onUpdate, onDelete, onCreateSubtask }) => {
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
