
import React, { useContext, useState } from 'react';
import { StoreContext } from '../App';
import { Search, ExternalLink, BrainCircuit, Tag, Check, X, Plus, Pencil, Trash2 } from 'lucide-react';
import { AITool } from '../types';

export const AIDirectoryView: React.FC = () => {
    const { aiTools, addAITool, updateAITool, deleteAITool } = useContext(StoreContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newIsApi, setNewIsApi] = useState(false);
    const [newCost, setNewCost] = useState<'Free' | 'Freemium' | 'Paid'>('Freemium');

    const categories = Array.from(new Set(aiTools.map(t => t.category)));

    const filteredTools = aiTools.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter ? t.category === categoryFilter : true;
        return matchesSearch && matchesCategory;
    });

    const handleOpenAdd = () => {
        setEditingId(null);
        setNewName(''); setNewDesc(''); setNewCategory(''); setNewUrl(''); setNewIsApi(false); setNewCost('Freemium');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (tool: AITool) => {
        setEditingId(tool.id);
        setNewName(tool.name);
        setNewDesc(tool.description);
        setNewCategory(tool.category);
        setNewUrl(tool.url);
        setNewIsApi(tool.isApiAvailable);
        setNewCost(tool.costModel);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const toolData: Partial<AITool> = {
            name: newName,
            description: newDesc,
            category: newCategory,
            url: newUrl,
            isApiAvailable: newIsApi,
            costModel: newCost
        };

        if(editingId) {
            updateAITool(editingId, toolData);
        } else {
            addAITool({
                ...toolData,
                id: crypto.randomUUID(),
            } as AITool);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Delete this tool?')) {
            deleteAITool(id);
        }
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><BrainCircuit size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">AI Tool Directory</h1>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-all duration-200 hover:border-indigo-300 border border-transparent"
                >
                    <Plus size={16} /> Add Tool
                </button>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Find AI tools..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none text-sm transition-all duration-200 focus:border-purple-300"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button 
                        onClick={() => setCategoryFilter(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${!categoryFilter ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                         <button 
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${categoryFilter === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTools.map(tool => (
                        <div key={tool.id} className="group bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-400 flex flex-col h-full relative cursor-default">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                     <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">{tool.category}</span>
                                     {tool.costModel === 'Paid' && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">$$$</span>}
                                     {tool.costModel === 'Free' && <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">Free</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleOpenEdit(tool)}
                                        className="text-gray-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:border-indigo-200 border border-transparent"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(tool.id)}
                                        className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:border-red-200 border border-transparent"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <a href={tool.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-600 ml-1 transition-all duration-200 hover:border-purple-200 border border-transparent rounded" title={`Visit ${tool.name}`}>
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{tool.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 flex-1">{tool.description}</p>
                            
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1.5">
                                    {tool.isApiAvailable ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-gray-300" />}
                                    API Available
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-[fadeIn_0.2s_ease-out]">
                        <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Tool' : 'Add New Tool'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                <input required className="w-full border p-2 rounded" value={newName} onChange={e => setNewName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                <textarea required className="w-full border p-2 rounded resize-none" rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                                <input required className="w-full border p-2 rounded" list="categories" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                                <datalist id="categories">
                                    <option value="Chatbot"/>
                                    <option value="Image Gen"/>
                                    <option value="Copywriting"/>
                                    <option value="Video"/>
                                    <option value="Audio"/>
                                    <option value="Coding"/>
                                    <option value="Productivity"/>
                                    <option value="Data Analysis"/>
                                    <option value="Research"/>
                                    <option value="3D Models"/>
                                    <option value="Music"/>
                                    <option value="Marketing"/>
                                    <option value="Education"/>
                                    <option value="Legal"/>
                                    <option value="Finance"/>
                                    <option value="Automation"/>
                                    <option value="Translation"/>
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
                                <input required className="w-full border p-2 rounded" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Cost Model</label>
                                    <select className="w-full border p-2 rounded" value={newCost} onChange={e => setNewCost(e.target.value as any)} aria-label="Cost Model">
                                        <option value="Free">Free</option>
                                        <option value="Freemium">Freemium</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-2">
                                     <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={newIsApi} onChange={e => setNewIsApi(e.target.checked)} />
                                        <span>API Available</span>
                                     </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                {editingId ? 'Save Changes' : 'Add Tool'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
