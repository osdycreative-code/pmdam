

import React, { useContext, useState, useEffect } from 'react';
import { StoreContext } from '../App';
import { BlockEditor } from './BlockEditor';
import { generateTaskContent } from '../services/geminiService';
import { X, Calendar, Flag, User as UserIcon, CheckSquare, Sparkles, Loader2, Plus, Type, Hash, Link as LinkIcon, List as ListIcon, Trash2, Download, Book, Bell, Clock, GripVertical } from 'lucide-react';
import { TaskStatus, TaskPriority, CustomFieldType, List, Subtask } from '../types';

export const TaskDetail: React.FC = () => {
  const { tasks, activeTaskId, setActiveTaskId, updateTask, lists, updateList, deleteTask } = useContext(StoreContext);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>(CustomFieldType.TEXT);
  const [isSettingReminder, setIsSettingReminder] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Drag and Drop State for Subtasks
  const [draggedSubtaskIndex, setDraggedSubtaskIndex] = useState<number | null>(null);
  
  const task = tasks.find(t => t.id === activeTaskId);
  const list = lists.find(l => l.id === task?.listId);

  useEffect(() => {
    // Reset generating state when task changes
    setIsGenerating(false);
    setIsAddingField(false);
    setIsSettingReminder(false);
    setNewSubtaskTitle('');
    setDraggedSubtaskIndex(null);
  }, [activeTaskId]);

  if (!task || !list) return null;

  const handleAICompletion = async () => {
      setIsGenerating(true);
      const currentText = task.contentBlocks.map(b => b.content).join('\n');
      const generatedText = await generateTaskContent(task.title, currentText);
      
      const newBlock = {
          id: crypto.randomUUID(),
          type: 'paragraph' as any,
          content: generatedText,
          checked: false
      };
      
      updateTask(task.id, {
          contentBlocks: [...task.contentBlocks, newBlock]
      });
      setIsGenerating(false);
  };

  const handleAddField = () => {
      if(newFieldName.trim()) {
          const newField = {
              id: crypto.randomUUID(),
              name: newFieldName,
              type: newFieldType,
              options: newFieldType === CustomFieldType.SELECT ? ['Option 1', 'Option 2'] : undefined
          };
          updateList(list.id, {
              customFields: [...list.customFields, newField]
          });
          setIsAddingField(false);
          setNewFieldName('');
      }
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
      updateTask(task.id, {
          customFieldValues: {
              ...task.customFieldValues,
              [fieldId]: value
          }
      });
  };

  const handleExportEbook = () => {
      const content = task.contentBlocks.map(b => {
          if(b.type.includes('heading')) return `\n# ${b.content}\n`;
          return b.content;
      }).join('\n');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${task.title.replace(/\s+/g, '_')}.epub.txt`; // Mock EPUB
      a.click();
  };

  const handleDelete = () => {
      if(window.confirm('Are you sure you want to delete this task?')) {
          deleteTask(task.id);
      }
  };

  const getIconForType = (type: CustomFieldType) => {
      switch(type) {
          case CustomFieldType.TEXT: return <Type size={14} />;
          case CustomFieldType.NUMBER: return <Hash size={14} />;
          case CustomFieldType.URL: return <LinkIcon size={14} />;
          case CustomFieldType.SELECT: return <ListIcon size={14} />;
      }
  };

  const handleSetReminder = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
          updateTask(task.id, { reminder: new Date(e.target.value), reminderFired: false });
      } else {
          updateTask(task.id, { reminder: undefined, reminderFired: undefined });
      }
      setIsSettingReminder(false);
  };

  // Helper to ensure date input shows local date correctly
  const formatDateForInput = (date: Date | string | undefined) => {
      if (!date) return '';
      
      // Handle string dates
      const d = typeof date === 'string' ? new Date(date) : date;
      
      // Validate date
      if (isNaN(d.getTime())) return '';
      
      // Ensure we're working with a valid date object
      const validDate = new Date(d);
      if (isNaN(validDate.getTime())) return '';
      
      const year = validDate.getFullYear();
      const month = String(validDate.getMonth() + 1).padStart(2, '0');
      const day = String(validDate.getDate()).padStart(2, '0');
      
      // Validate year range
      if (year < 1900 || year > 2100) return '';
      
      return `${year}-${month}-${day}`;
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) {
          updateTask(task.id, { dueDate: undefined });
          return;
      }
      
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(e.target.value)) {
          return; // Invalid format
      }
      
      // Create date at local midnight to avoid timezone shift issues
      const [year, month, day] = e.target.value.split('-').map(Number);
      
      // Validate date values
      if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
          return; // Invalid date values
      }
      
      const newDate = new Date(year, month - 1, day);
      
      // Check if date is valid
      if (isNaN(newDate.getTime())) {
          return; // Invalid date
      }
      
      updateTask(task.id, { dueDate: newDate });
  };

  // --- Subtask Handlers ---
  const handleAddSubtask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSubtaskTitle.trim()) return;

      const newSubtask: Subtask = {
          id: crypto.randomUUID(),
          title: newSubtaskTitle,
          completed: false
      };

      const updatedSubtasks = [...(task.subtasks || []), newSubtask];

      // If task was marked done but we add a new incomplete subtask, revert to In Progress
      let statusUpdate = {};
      if (task.status === TaskStatus.DONE) {
          statusUpdate = { status: TaskStatus.IN_PROGRESS };
      }

      updateTask(task.id, {
          subtasks: updatedSubtasks,
          ...statusUpdate
      });
      setNewSubtaskTitle('');
  };

  const toggleSubtask = (subtaskId: string) => {
      const updatedSubtasks = (task.subtasks || []).map(s => 
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
      );

      // Check for completion
      let statusUpdate = {};
      if (updatedSubtasks.length > 0) {
          const allCompleted = updatedSubtasks.every(s => s.completed);
          if (allCompleted && task.status !== TaskStatus.DONE) {
              statusUpdate = { status: TaskStatus.DONE };
          } else if (!allCompleted && task.status === TaskStatus.DONE) {
              statusUpdate = { status: TaskStatus.IN_PROGRESS };
          }
      }

      updateTask(task.id, { subtasks: updatedSubtasks, ...statusUpdate });
  };

  const deleteSubtask = (subtaskId: string) => {
      const updatedSubtasks = (task.subtasks || []).filter(s => s.id !== subtaskId);
      
      // If remaining tasks are all done, mark as done
      let statusUpdate = {};
      if (updatedSubtasks.length > 0) {
          const allCompleted = updatedSubtasks.every(s => s.completed);
          if (allCompleted && task.status !== TaskStatus.DONE) {
              statusUpdate = { status: TaskStatus.DONE };
          }
      }

      updateTask(task.id, { subtasks: updatedSubtasks, ...statusUpdate });
  };

  // --- DnD Handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSubtaskIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Optional: Set custom drag image if needed, but default is usually fine
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedSubtaskIndex === null || draggedSubtaskIndex === dropIndex) return;

    const newSubtasks = [...(task.subtasks || [])];
    const [movedItem] = newSubtasks.splice(draggedSubtaskIndex, 1);
    newSubtasks.splice(dropIndex, 0, movedItem);

    updateTask(task.id, { subtasks: newSubtasks });
    setDraggedSubtaskIndex(null);
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm" onClick={() => setActiveTaskId(null)}>
      <div 
        className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]"
        onClick={e => e.stopPropagation()} 
      >
        {/* Toolbar */}
        <div className="h-14 px-6 border-b border-gray-100 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2 text-sm text-gray-500">
                 <span className="bg-gray-100 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider">{list.name}</span>
                 <span className="text-gray-300">/</span>
                 <span className="font-mono text-xs">{task.id.substring(0,6)}</span>
             </div>
             <div className="flex items-center gap-2">
                 <div className="relative">
                     <button 
                        onClick={() => setIsSettingReminder(!isSettingReminder)}
                        className={`p-1.5 hover:bg-gray-100 rounded transition-all duration-200 hover:border-gray-200 border border-transparent ${task.reminder ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                        title="Set Reminder"
                     >
                         <Bell size={20} className={task.reminder ? "fill-current" : ""} />
                     </button>
                     {isSettingReminder && (
                         <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-10 w-64 animate-[fadeIn_0.1s_ease-out]">
                             <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Remind me at</h4>
                             <input 
                                type="datetime-local" 
                                className="w-full text-sm border-gray-200 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                onChange={handleSetReminder}
                                value={task.reminder ? new Date(new Date(task.reminder).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ''}
                             />
                             {task.reminder && (
                                 <button 
                                    onClick={() => { updateTask(task.id, { reminder: undefined, reminderFired: undefined }); setIsSettingReminder(false); }}
                                    className="mt-2 w-full text-xs text-red-500 hover:bg-red-50 py-1.5 rounded"
                                 >
                                     Remove Reminder
                                 </button>
                             )}
                         </div>
                     )}
                 </div>
                 <button 
                    onClick={handleExportEbook}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-xs font-semibold transition-all duration-200 hover:border-gray-200 border border-transparent"
                    title="Export as eBook"
                 >
                    <Book size={14} /> Export
                 </button>
                 <button 
                    onClick={() => updateTask(task.id, {})}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded text-xs font-semibold transition-all duration-200 hover:bg-green-600 hover:border-green-300 border border-transparent"
                    title="Save Changes"
                 >
                    <CheckSquare size={14} /> Save
                 </button>
                 <button 
                   onClick={handleAICompletion}
                   disabled={isGenerating}
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold rounded-full hover:shadow-md transition-all duration-200 hover:border-indigo-300 border border-transparent disabled:opacity-50"
                 >
                    {isGenerating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />}
                    {isGenerating ? 'Thinking...' : 'AI Assist'}
                 </button>
                 <button onClick={handleDelete} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-all duration-200 hover:border-red-200 border border-transparent" title="Delete Task">
                     <Trash2 size={20} />
                 </button>
                 <button onClick={() => setActiveTaskId(null)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all duration-200 hover:border-gray-200 border border-transparent">
                     <X size={20} />
                 </button>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="px-12 pt-10 pb-20">
                {/* Reminder Banner */}
                {task.reminder && (
                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg text-sm mb-4 inline-flex">
                        <Clock size={16} />
                        <span>Reminder set for {new Date(task.reminder).toLocaleString()}</span>
                    </div>
                )}

                {/* Title */}
                <input 
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTask(task.id, { title: e.target.value })}
                    className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent mb-8"
                    placeholder="Task Title"
                />

                {/* Properties Grid */}
                <div className="bg-gray-50/50 rounded-xl p-6 mb-8 border border-gray-100">
                    <div className="grid grid-cols-1 gap-y-1">
                        {/* Standard Fields */}
                        <div className="flex items-center py-1.5 group">
                            <div className="w-36 flex items-center gap-2 text-gray-500 text-sm">
                                <CheckSquare size={16} />
                                <span>Status</span>
                            </div>
                            <select 
                                value={task.status}
                                onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                                className="bg-transparent hover:bg-gray-200/50 px-2 py-1 rounded text-sm text-gray-900 font-medium cursor-pointer border-none focus:ring-0 w-full"
                            >
                                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center py-1.5 group">
                            <div className="w-36 flex items-center gap-2 text-gray-500 text-sm">
                                <Flag size={16} />
                                <span>Priority</span>
                            </div>
                            <select 
                                value={task.priority}
                                onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                                className="bg-transparent hover:bg-gray-200/50 px-2 py-1 rounded text-sm text-gray-900 font-medium cursor-pointer border-none focus:ring-0 w-full"
                            >
                                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center py-1.5 group">
                            <div className="w-36 flex items-center gap-2 text-gray-500 text-sm">
                                <UserIcon size={16} />
                                <span>Assignee</span>
                            </div>
                            <div className="flex items-center gap-2 hover:bg-gray-200/50 px-2 py-1 rounded cursor-pointer w-full">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold">AC</div>
                                <span className="text-sm text-gray-900">Alice Chen</span>
                            </div>
                        </div>

                        <div className="flex items-center py-1.5 group">
                            <div className="w-36 flex items-center gap-2 text-gray-500 text-sm">
                                <Calendar size={16} />
                                <span>Due Date</span>
                            </div>
                            <input 
                                type="date" 
                                className="bg-transparent hover:bg-gray-200/50 px-2 py-1 rounded text-sm text-gray-900 cursor-pointer border-none focus:ring-0"
                                value={formatDateForInput(task.dueDate)}
                                onChange={handleDueDateChange}
                            />
                        </div>

                        {/* Custom Fields */}
                        {list.customFields.map(field => (
                             <div key={field.id} className="flex items-center py-1.5 group">
                                <div className="w-36 flex items-center gap-2 text-gray-500 text-sm">
                                    {getIconForType(field.type)}
                                    <span className="truncate">{field.name}</span>
                                </div>
                                <div className="flex-1">
                                    {field.type === CustomFieldType.SELECT ? (
                                        <select 
                                            value={task.customFieldValues[field.id] || ''}
                                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                            className="bg-transparent hover:bg-gray-200/50 px-2 py-1 rounded text-sm text-gray-900 w-full border-none focus:ring-0"
                                        >
                                            <option value="">Empty</option>
                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (
                                        <input 
                                            type={field.type === CustomFieldType.NUMBER ? 'number' : 'text'}
                                            value={task.customFieldValues[field.id] || ''}
                                            placeholder="Empty"
                                            onChange={(e) => handleCustomFieldChange(field.id, field.type === CustomFieldType.NUMBER ? parseFloat(e.target.value) : e.target.value)}
                                            className="bg-transparent hover:bg-gray-200/50 px-2 py-1 rounded text-sm text-gray-900 w-full border-none focus:ring-0 placeholder-gray-400"
                                        />
                                    )}
                                </div>
                             </div>
                        ))}

                        {/* Add Property Button */}
                        <div className="pt-2 relative">
                            {!isAddingField ? (
                                <button 
                                    onClick={() => setIsAddingField(true)}
                                    className="flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-gray-600 px-1 py-1 rounded hover:bg-gray-100 transition-colors"
                                >
                                    <Plus size={14} /> Add Property
                                </button>
                            ) : (
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg absolute left-0 top-0 z-10 w-64">
                                    <div className="text-xs font-semibold text-gray-500 mb-2">NEW PROPERTY</div>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Property Name"
                                        className="w-full text-sm border-gray-200 rounded mb-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={newFieldName}
                                        onChange={e => setNewFieldName(e.target.value)}
                                    />
                                    <div className="text-xs font-semibold text-gray-500 mb-2">TYPE</div>
                                    <div className="grid grid-cols-2 gap-1 mb-3">
                                        {[CustomFieldType.TEXT, CustomFieldType.NUMBER, CustomFieldType.SELECT, CustomFieldType.URL].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setNewFieldType(t)}
                                                className={`text-xs p-1.5 rounded flex items-center gap-2 capitalize ${newFieldType === t ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' : 'hover:bg-gray-50 text-gray-600'}`}
                                            >
                                                {getIconForType(t)} {t}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsAddingField(false)} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                        <button onClick={handleAddField} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Create</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Subtasks Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <CheckSquare size={16} /> Subtasks
                        </h3>
                        {subtasks.length > 0 && (
                            <span className="text-xs text-gray-500 font-medium">
                                {Math.round(progress)}%
                            </span>
                        )}
                    </div>

                    {subtasks.length > 0 && (
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${progress}%` }} 
                            />
                        </div>
                    )}

                    <div className="space-y-1 mb-3">
                        {subtasks.map((subtask, index) => (
                            <div 
                                key={subtask.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                className={`group flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent 
                                    ${draggedSubtaskIndex === index ? 'opacity-40 bg-gray-50 border-dashed border-gray-300' : ''}
                                `}
                            >
                                <div className="cursor-move text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical size={14} />
                                </div>
                                <button 
                                    onClick={() => toggleSubtask(subtask.id)}
                                    className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${subtask.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 hover:border-indigo-400 bg-white'}`}
                                >
                                    {subtask.completed && <CheckSquare size={10} strokeWidth={4} />}
                                </button>
                                <span className={`flex-1 text-sm ${subtask.completed ? 'text-gray-400 line-through opacity-80 decoration-gray-400 decoration-1' : 'text-gray-700'}`}>
                                    {subtask.title}
                                </span>
                                <button 
                                    onClick={() => deleteSubtask(subtask.id)}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-3 p-2 pl-9">
                        <div className="w-4 h-4 flex items-center justify-center">
                            <Plus size={16} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Add a subtask..." 
                            className="flex-1 bg-transparent border-none text-sm placeholder-gray-400 focus:ring-0 p-0"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        />
                    </form>
                </div>

                <hr className="border-gray-100 mb-8" />

                {/* Block Editor */}
                <div className="min-h-[300px]">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Type size={16} /> Description
                    </h3>
                    <BlockEditor 
                        blocks={task.contentBlocks} 
                        onChange={(newBlocks) => updateTask(task.id, { contentBlocks: newBlocks })} 
                    />
                </div>
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
