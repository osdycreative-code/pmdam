import React, { useContext, useState, useRef } from 'react';
import { usePersistence } from '../src/context/CentralizedPersistenceContext';
import { StoreContext } from '../App';
import { FolderOpen, FileText, File, Plus, ChevronRight, Home, Trash2, StickyNote, CheckSquare, Layers, Calendar, LayoutGrid, X, Download, Image as ImageIcon, FileCode, Pencil, Save, Check, Loader2, List as ListIcon, Grid, Type } from 'lucide-react';
import { FolderItem, FolderItemType, Block, BlockType } from '../types';
import { BlockEditor } from './BlockEditor';

export const FoldersView: React.FC = () => {
    // Legacy context for UI state (sidebar active item)
    const { activeListId } = useContext(StoreContext);
    
    // New Persistence Context for Data
    const { folderItems, createFolderItem, updateFolderItem, deleteFolderItem } = usePersistence();

    const [currentPath, setCurrentPath] = useState<{id: string, name: string}[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [isCreating, setIsCreating] = useState<FolderItemType | null>(null);
    const [previewItem, setPreviewItem] = useState<FolderItem | null>(null);
    const [editingItem, setEditingItem] = useState<FolderItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editorBlocks, setEditorBlocks] = useState<Block[]>([]);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // New View Mode State
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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeListId || !isCreating) return;

        const newItem: Omit<FolderItem, 'id'> = {
            listId: activeListId,
            parentId: currentFolderId,
            name: newItemName || `New ${isCreating}`,
            type: isCreating,
            updatedAt: new Date(),
            size: isCreating === FolderItemType.FOLDER ? undefined : '0 KB'
        };

        await createFolderItem(newItem);
        setNewItemName('');
        setIsCreating(null);
    };
    
    const handleRename = (item: FolderItem) => {
        setEditingItem(item);
        setEditName(item.name);
    }

    const handleSaveRename = async () => {
        if (editingItem && editName.trim() !== "") {
            await updateFolderItem(editingItem.id, { name: editName.trim() });
        }
        setEditingItem(null);
        setEditName('');
    }

    const handleDelete = async (itemId: string) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            await deleteFolderItem(itemId);
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeListId) return;

        // In a real app, this would upload to S3/Cloud storage.
        // For this demo, we use a blob URL to simulate "hosted" file.
        const fileUrl = URL.createObjectURL(file);

        const newItem: Omit<FolderItem, 'id'> = {
            listId: activeListId,
            parentId: currentFolderId,
            name: file.name,
            type: FolderItemType.FILE,
            updatedAt: new Date(),
            size: formatBytes(file.size),
            url: fileUrl
        };

        await createFolderItem(newItem);
        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const navigateTo = (item: FolderItem) => {
        if (item.type === FolderItemType.FOLDER) {
            setCurrentPath(prev => [...prev, { id: item.id, name: item.name }]);
        } else {
             // If opening a document, load blocks
             if (item.type === FolderItemType.DOCUMENT || item.type === FolderItemType.NOTE) {
                 if (item.content) {
                     try {
                         const parsed = JSON.parse(item.content);
                         setEditorBlocks(Array.isArray(parsed) ? parsed : []);
                     } catch(e) {
                         // Fallback if content is raw string or invalid
                         setEditorBlocks([{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: item.content || '' }]);
                     }
                 } else {
                     setEditorBlocks([{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }]);
                 }
             }
            setPreviewItem(item);
        }
    };
    
    const handleSaveContent = async () => {
        if(!previewItem) return;
        setSaveStatus('saving');
        const contentStr = JSON.stringify(editorBlocks);
        await updateFolderItem(previewItem.id, { content: contentStr });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
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

        // PDF Preview
        if (ext === 'pdf') {
             return (
                 <div className="w-full h-full min-h-[500px] flex flex-col">
                     <iframe 
                         src={item.url} 
                         className="w-full flex-1 rounded-lg border border-gray-200"
                         title={item.name}
                     />
                 </div>
             );
        }
        
        // Document / Note / Text Preview
        if (item.type === FolderItemType.DOCUMENT || item.type === FolderItemType.NOTE) {
             return (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 min-h-[400px] max-w-2xl mx-auto">
                     <h3 className="font-bold text-2xl mb-6 text-gray-800 border-b border-gray-100 pb-4">{item.name}</h3>
                     <div className="min-h-[300px]">
                        <BlockEditor 
                            blocks={editorBlocks} 
                            onChange={setEditorBlocks} 
                        />
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
                    {/* Organize Menu & View Toggle */}
                     <div className="flex bg-gray-100 p-0.5 rounded-lg mr-2">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md text-gray-500 hover:text-indigo-600 transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : ''}`}
                            title="Grid View"
                        >
                            <Grid size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md text-gray-500 hover:text-indigo-600 transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : ''}`}
                            title="List View"
                        >
                            <ListIcon size={16} />
                        </button>
                    </div>

                    <div className="relative group">
                        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-all duration-200 hover:border-gray-300">
                            <LayoutGrid size={16} /> Organize
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-20 py-1">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Group By</div>
                             <div className="px-4 py-2 text-sm text-gray-500 italic">Coming Soon</div>
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
            <div className="flex-1 overflow-auto p-6 bg-white slate-scroll">
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
                    <>
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {visibleItems.map(item => (
                                    <div 
                                        key={item.id}
                                        onDoubleClick={() => navigateTo(item)}
                                        className="group relative flex flex-col items-center p-6 rounded-xl hover:bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all duration-200 cursor-pointer select-none shadow-sm hover:shadow-md h-48 justify-between bg-white"
                                    >
                                        <div className="mb-1 transition-transform group-hover:scale-110 duration-200 flex-1 flex items-center justify-center">
                                            {React.cloneElement(getIcon(item.type) as React.ReactElement<any>, { size: 48 })}
                                        </div>
                                        <div className="w-full text-center">
                                             <span className="text-sm font-medium text-gray-700 block w-full line-clamp-2 leading-tight break-words px-1 h-[2.5em] flex items-center justify-center" title={item.name}>
                                                {item.name}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-2">
                                                {item.size || new Date(item.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white/80 p-0.5 rounded backdrop-blur-sm">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRename(item); }}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all duration-200"
                                                title="Rename"
                                            >
                                                <Type size={14} />
                                            </button>
                                            
                                            {(item.type === FolderItemType.DOCUMENT || item.type === FolderItemType.NOTE) && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigateTo(item); }}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all duration-200"
                                                    title="Edit Content"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            )}

                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'list' && (
                            <div className="min-w-full inline-block align-middle">
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Modified</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {visibleItems.map(item => (
                                                <tr 
                                                    key={item.id} 
                                                    onDoubleClick={() => navigateTo(item)}
                                                    className="hover:bg-gray-50 cursor-pointer group transition-colors"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                                                                {React.cloneElement(getIcon(item.type) as React.ReactElement<any>, { size: 20 })}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{new Date(item.updatedAt).toLocaleDateString()} {new Date(item.updatedAt).toLocaleTimeString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{item.size || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleRename(item); }}
                                                                className="text-indigo-600 hover:text-indigo-900 p-1 bg-indigo-50 rounded hover:bg-indigo-100"
                                                                title="Rename"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                                className="text-red-600 hover:text-red-900 p-1 bg-red-50 rounded hover:bg-red-100"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
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
                                    {/* Cast to any to avoid strict prop checks on cloned element */}
                                    {React.cloneElement(getIcon(previewItem.type) as React.ReactElement<any>, { size: 24 })}
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
                             
                             {/* Save Button for Editable Types */}
                             {(previewItem.type === FolderItemType.DOCUMENT || previewItem.type === FolderItemType.NOTE) && (
                                <button 
                                    onClick={handleSaveContent} 
                                    disabled={saveStatus === 'saving'}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all duration-200 border border-transparent 
                                        ${saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                >
                                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={16}/> : 
                                     saveStatus === 'saved' ? <Check size={16}/> : <Save size={16} />} 
                                    {saveStatus === 'saving' ? 'Saving...' : 
                                     saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
                                </button>
                             )}

                             {previewItem.url && (
                                <a 
                                    href={previewItem.url} 
                                    download={previewItem.name}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 border border-gray-200 shadow-sm transition-all duration-200"
                                >
                                    <Download size={16} /> Download
                                </a>
                             )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};