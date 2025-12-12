import React, { useContext, useState, useRef } from 'react';
import { StoreContext } from '../App';
import { FolderOpen, FileText, File, Plus, ChevronRight, Home, Trash2, StickyNote, CheckSquare, Layers, Calendar, LayoutGrid, X, Download, Image as ImageIcon, FileCode, Pencil } from 'lucide-react';
import { FolderItem, FolderItemType } from '../types';

export const FoldersView: React.FC = () => {
    const { folderItems, activeListId, addFolderItem, updateFolderItem, deleteFolderItem, organizeFolderItems } = useContext(StoreContext);
    const [currentPath, setCurrentPath] = useState<{id: string, name: string}[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [isCreating, setIsCreating] = useState<FolderItemType | null>(null);
    const [previewItem, setPreviewItem] = useState<FolderItem | null>(null);
    const [editingItem, setEditingItem] = useState<FolderItem | null>(null);
    const [editName, setEditName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

    // Filter items for current view
    const visibleItems = folderItems.filter(item => 
        item.listId === activeListId && item.parentId === currentFolderId
    ).sort((a, b) => {
        // Sort folders first, then files
        if (a.type === FolderItemType.FOLDER && b.type !== FolderItemType.FOLDER) return -1;
        if (a.type !== FolderItemType.FOLDER && b.type === FolderItemType.FOLDER) return 1;
        return a.name.localeCompare(b.name);
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeListId || !isCreating) return;

        const newItem: FolderItem = {
            id: crypto.randomUUID(),
            listId: activeListId,
            parentId: currentFolderId,
            name: newItemName || `New ${isCreating}`,
            type: isCreating,
            updatedAt: new Date(),
            size: isCreating === FolderItemType.FOLDER ? undefined : '0 KB'
        };

        addFolderItem(newItem);
        setNewItemName('');
        setIsCreating(null);
    };
    
    const handleRename = (item: FolderItem) => {
        setEditingItem(item);
        setEditName(item.name);
    }

    const handleSaveRename = () => {
        if (editingItem && editName.trim() !== "") {
            updateFolderItem(editingItem.id, { name: editName.trim() });
        }
        setEditingItem(null);
        setEditName('');
    }

    const handleDelete = (itemId: string) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            deleteFolderItem(itemId);
        }
    }

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeListId) return;

        // In a real app, this would upload to S3/Cloud storage.
        // For this demo, we use a blob URL to simulate "hosted" file.
        const fileUrl = URL.createObjectURL(file);

        const newItem: FolderItem = {
            id: crypto.randomUUID(),
            listId: activeListId,
            parentId: currentFolderId,
            name: file.name,
            type: FolderItemType.FILE,
            updatedAt: new Date(),
            size: formatBytes(file.size),
            url: fileUrl
        };

        addFolderItem(newItem);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const navigateTo = (item: FolderItem) => {
        if (item.type === FolderItemType.FOLDER) {
            setCurrentPath(prev => [...prev, { id: item.id, name: item.name }]);
        } else {
            setPreviewItem(item);
        }
    };

    const navigateUp = (index: number) => {
        if (index === -1) {
            setCurrentPath([]);
        } else {
            setCurrentPath(prev => prev.slice(0, index + 1));
        }
    };

    const getIcon = (type: FolderItemType) => {
        switch(type) {
            case FolderItemType.FOLDER: return <FolderOpen className="text-yellow-500 fill-yellow-100" size={32} />;
            case FolderItemType.DOCUMENT: return <FileText className="text-blue-500" size={32} />;
            case FolderItemType.NOTE: return <StickyNote className="text-amber-500" size={32} />;
            case FolderItemType.TASK: return <CheckSquare className="text-emerald-500" size={32} />;
            case FolderItemType.FILE: return <File className="text-gray-400" size={32} />;
            default: return <File size={32} />;
        }
    };

    const renderPreviewContent = (item: FolderItem) => {
        const ext = item.name.split('.').pop()?.toLowerCase();
        
        // Image Preview
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
            const imgSrc = item.url || `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(item.name)}`;
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                     <img 
                        src={imgSrc} 
                        alt={item.name} 
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" 
                     />
                </div>
            );
        }
        
        // Document / Note / Text Preview
        if (item.type === FolderItemType.DOCUMENT || item.type === FolderItemType.NOTE || ['txt', 'md', 'json'].includes(ext || '')) {
             return (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 min-h-[400px] max-w-2xl mx-auto">
                     <h3 className="font-bold text-2xl mb-6 text-gray-800 border-b border-gray-100 pb-4">{item.name}</h3>
                     <div className="space-y-4 text-gray-600 leading-relaxed font-serif">
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Analysis of the project requirements</li>
                            <li>Resource allocation strategy</li>
                            <li>Timeline estimation</li>
                        </ul>
                        <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
                     </div>
                </div>
            );
        }

        // Default / Unsupported
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileCode size={40} className="text-gray-300"/>
                </div>
                <p className="text-lg font-medium text-gray-600">No preview available</p>
                <p className="text-sm">This file type cannot be previewed directly.</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
            />

            {/* Header */}
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><FolderOpen size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">Files & Documents</h1>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Organize Menu */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-all duration-200 hover:border-gray-300">
                            <LayoutGrid size={16} /> Organize
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-20 py-1">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Group By</div>
                            <button 
                                onClick={() => activeListId && organizeFolderItems(activeListId, currentFolderId, 'type')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all duration-200 hover:border-gray-200 border border-transparent"
                            >
                                <Layers size={14} className="text-gray-400" /> File Type
                            </button>
                            <button 
                                onClick={() => activeListId && organizeFolderItems(activeListId, currentFolderId, 'date')}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all duration-200 hover:border-gray-200 border border-transparent"
                            >
                                <Calendar size={14} className="text-gray-400" /> Date Modified
                            </button>
                        </div>
                    </div>

                    {/* Add Menu */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm transition-all duration-200 hover:border-indigo-300 border border-transparent shadow-sm">
                            <Plus size={16} /> New Item
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-20 py-1">
                            {[
                                { type: FolderItemType.FOLDER, label: 'New Folder', icon: FolderOpen },
                                { type: FolderItemType.DOCUMENT, label: 'New Document', icon: FileText },
                                { type: FolderItemType.NOTE, label: 'New Note', icon: StickyNote },
                                { type: FolderItemType.TASK, label: 'New Task', icon: CheckSquare },
                            ].map(opt => (
                                <button
                                    key={opt.type}
                                    onClick={() => setIsCreating(opt.type)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all duration-200 hover:border-gray-200 border border-transparent"
                                >
                                    <opt.icon size={14} className="text-gray-400" /> {opt.label}
                                </button>
                            ))}
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all duration-200 hover:border-gray-200 border border-transparent"
                            >
                                <File size={14} className="text-gray-400" /> Upload File
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
                <button 
                    onClick={() => navigateUp(-1)}
                    className={`flex items-center gap-1 hover:text-indigo-600 ${currentPath.length === 0 ? 'font-bold text-gray-900' : ''}`}
                >
                    <Home size={14} /> Home
                </button>
                {currentPath.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                        <ChevronRight size={14} className="text-gray-400" />
                        <button 
                            onClick={() => navigateUp(idx)}
                            className={`hover:text-indigo-600 whitespace-nowrap ${idx === currentPath.length - 1 ? 'font-bold text-gray-900' : ''}`}
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 bg-white">
                {/* Creation Input */}
                {isCreating && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm max-w-md animate-[fadeIn_0.2s_ease-out]">
                         <form onSubmit={handleCreate} className="flex flex-col gap-3">
                             <label className="text-xs font-bold text-gray-500 uppercase">Create New {isCreating}</label>
                             <div className="flex gap-2">
                                 <input 
                                     autoFocus
                                     type="text" 
                                     placeholder={`Enter ${isCreating} name...`}
                                     value={newItemName}
                                     onChange={e => setNewItemName(e.target.value)}
                                     className="flex-1 border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                 />
                                 <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">Create</button>
                                 <button type="button" onClick={() => setIsCreating(null)} className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                             </div>
                         </form>
                    </div>
                )}

                {/* Rename Input */}
                {editingItem && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm max-w-md animate-[fadeIn_0.2s_ease-out]">
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveRename(); }} className="flex flex-col gap-3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Rename {editingItem.type}</label>
                            <div className="flex gap-2">
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="flex-1 border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">Save</button>
                                <button type="button" onClick={() => setEditingItem(null)} className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {visibleItems.length === 0 && !isCreating && !editingItem ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <FolderOpen size={32} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">This folder is empty.</p>
                        <button onClick={() => fileInputRef.current?.click()} className="mt-4 text-indigo-600 hover:underline text-sm">Upload a file</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {visibleItems.map(item => (
                            <div 
                                key={item.id}
                                onDoubleClick={() => navigateTo(item)}
                                className="group relative flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200 cursor-pointer select-none"
                            >
                                <div className="mb-3 transition-transform group-hover:scale-110 duration-200">
                                    {getIcon(item.type)}
                                </div>
                                <span className="text-sm font-medium text-gray-700 text-center w-full truncate px-2">
                                    {item.name}
                                </span>
                                <div className="text-[10px] text-gray-400 mt-1">
                                    {item.size || new Date(item.updatedAt).toLocaleDateString()}
                                </div>

                                {/* Actions */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleRename(item); }}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all duration-200 hover:border-indigo-200 border border-transparent"
                                        title="Rename"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 hover:border-red-200 border border-transparent"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setPreviewItem(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    {React.cloneElement(getIcon(previewItem.type) as React.ReactElement, { size: 24 })}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-800 text-lg leading-tight">{previewItem.name}</h2>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {previewItem.size || 'Unknown size'} • Last modified {new Date(previewItem.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-all duration-200 hover:border-gray-200 border border-transparent">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto bg-gray-50 p-8 flex flex-col">
                            {renderPreviewContent(previewItem)}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
                             <button onClick={() => setPreviewItem(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-all duration-200 hover:border-gray-200 border border-transparent">
                                Close
                             </button>
                             <a 
                                href={previewItem.url || '#'} 
                                download={previewItem.name}
                                onClick={(e) => { if(!previewItem.url) e.preventDefault(); }} 
                                className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 shadow-sm transition-all duration-200 hover:border-indigo-300 border border-transparent ${!previewItem.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                             >
                                <Download size={16} /> Download
                             </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};