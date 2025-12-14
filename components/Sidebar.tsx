import React, { useContext, useState, useRef } from 'react';
import { StoreContext, DASHBOARD_VIEW_ID } from '../App';
import { CloudIndicator } from './CloudIndicator';
import { ModuleType } from '../types';
import { Banknote, Bell, Book, BrainCircuit, CheckSquare, ChevronDown, ChevronRight, Clock, Code2, Cog, FolderKanban, FolderOpen, Hexagon, Layout, LayoutDashboard, LogOut, Package, Palette, Plus, Search, Settings, Trash2, X, PanelLeftClose } from 'lucide-react';

export const Sidebar: React.FC = () => {

  const { spaces, lists, activeSpaceId, activeListId, setActiveSpaceId, setActiveListId, createSpace, updateSpace, deleteSpace, addModule, deleteList, notifications, markNotificationRead, clearAllNotifications, setActiveTaskId, logout, resetData, toggleSidebar } = useContext(StoreContext);
  const [collapsedSpaces, setCollapsedSpaces] = useState<Set<string>>(new Set());
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Create Space Form State
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedModules, setSelectedModules] = useState<Set<ModuleType>>(new Set([ModuleType.TASKS]));

  // Edit Space State
  const [editingSpaceId, setEditingId] = useState<string | null>(null);
  const [editSpaceName, setEditSpaceName] = useState('');

  // Add Module State
  const [addingModuleSpaceId, setAddingModuleSpaceId] = useState<string | null>(null);
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedModuleType, setSelectedModuleType] = useState<ModuleType>(ModuleType.TASKS);

  // Settings State
  const [showSettings, setShowSettings] = useState(false);

  const notifButtonRef = useRef<HTMLButtonElement>(null);

  const toggleSpace = (spaceId: string) => {
    const newCollapsed = new Set(collapsedSpaces);
    if (newCollapsed.has(spaceId)) newCollapsed.delete(spaceId);
    else newCollapsed.add(spaceId);
    setCollapsedSpaces(newCollapsed);
  };

  const handleOpenEditSpace = (spaceId: string, currentName: string) => {
      setEditingId(spaceId);
      setEditSpaceName(currentName);
  };

  const handleUpdateSpace = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingSpaceId && editSpaceName.trim()) {
          updateSpace(editingSpaceId, { name: editSpaceName });
          setEditingId(null);
      }
  };

  const handleDeleteSpace = () => {
      if(editingSpaceId && window.confirm("Are you sure you want to delete this Space and all its modules? This action cannot be undone.")) {
          deleteSpace(editingSpaceId);
          setEditingId(null);
      }
  };

  const handleDeleteModule = (listId: string) => {
      if(window.confirm("Are you sure you want to delete this module? This action cannot be undone.")) {
          deleteList(listId);
      }
  };

  const getModuleIcon = (type: ModuleType) => {
      switch(type) {
          case ModuleType.TASKS: return <Layout size={16} />;
          case ModuleType.INVENTORY: return <Package size={16} />;
          case ModuleType.DIRECTORY: return <BrainCircuit size={16} />;
          case ModuleType.STUDIO: return <Palette size={16} />;
          case ModuleType.PROJECTS: return <FolderKanban size={16} />;
          case ModuleType.FINANCE: return <Banknote size={16} />;
          case ModuleType.APP_GENERATOR: return <Code2 size={16} />;
          case ModuleType.FOLDERS: return <FolderOpen size={16} />;
          case ModuleType.EBOOKS: return <Book size={16} />;
          default: return <Layout size={16} />;
      }
  };

  const handleCreateSpace = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newSpaceName.trim()) return;
      createSpace(newSpaceName, Array.from(selectedModules));
      setIsCreatingSpace(false);
      setNewSpaceName('');
      setSelectedModules(new Set([ModuleType.TASKS]));
  };

  const handleAddModule = (e: React.FormEvent) => {
      e.preventDefault();
      if (!addingModuleSpaceId || !newModuleName.trim()) return;
      addModule(addingModuleSpaceId, selectedModuleType, newModuleName);
      setAddingModuleSpaceId(null);
      setNewModuleName('');
      setSelectedModuleType(ModuleType.TASKS);
  };

  const toggleModuleSelection = (type: ModuleType) => {
      const newSet = new Set(selectedModules);
      if(newSet.has(type)) newSet.delete(type);
      else newSet.add(type);
      setSelectedModules(newSet);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const availableModules = [
      { type: ModuleType.TASKS, label: 'Task List', icon: Layout, desc: 'Kanban, List, Calendar' },
      { type: ModuleType.PROJECTS, label: 'Projects', icon: FolderKanban, desc: 'Portfolio & Timelines' },
      { type: ModuleType.FOLDERS, label: 'Folders', icon: FolderOpen, desc: 'Files, Docs, Notes' },
      { type: ModuleType.FINANCE, label: 'Finance', icon: Banknote, desc: 'Income & Expenses' },
      { type: ModuleType.INVENTORY, label: 'Inventory', icon: Package, desc: 'Product tracking' },
      { type: ModuleType.DIRECTORY, label: 'AI Directory', icon: BrainCircuit, desc: 'Tool curation' },
      { type: ModuleType.STUDIO, label: 'Creative Studio', icon: Palette, desc: 'Generative AI' },
      { type: ModuleType.APP_GENERATOR, label: 'App Generator', icon: Code2, desc: 'Code Boilerplates' },
      { type: ModuleType.EBOOKS, label: 'eBooks', icon: Book, desc: 'Manage and export eBooks' }
  ];

  return (
    <div className="bg-gray-50 flex flex-col flex-shrink-0 h-full relative w-full header-sidebar">
      {/* App Header */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2 font-bold text-base text-indigo-600">
            <Hexagon className="fill-indigo-600 text-indigo-600" size={20} />
            <span>NexusFlow</span>
        </div>
        <button 
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            title="Collapse Sidebar"
        >
            <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Cloud Status */}
      <div className="px-3 py-1.5 border-b border-gray-100 bg-white/50 backdrop-blur-sm scale-90 origin-left w-[110%]">
          <CloudIndicator />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden py-1">
        {/* Navigation - Dashboard */}
        <div className="px-2 mb-1">
            <button 
                onClick={() => {
                    setActiveSpaceId(DASHBOARD_VIEW_ID);
                    setActiveListId(null);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeSpaceId === DASHBOARD_VIEW_ID ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 hover:border-indigo-200 hover:shadow-sm border border-transparent'}
                `}
            >
                <LayoutDashboard size={16} />
                Dashboard
            </button>
        </div>

        {/* Workspace / Spaces Header */}
        <div className="px-3 mb-0.5 flex items-center justify-between">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Spaces</div>
            <button 
                onClick={() => setIsCreatingSpace(true)}
                className="text-gray-400 hover:text-indigo-600 transition-colors"
                title="Create New Space"
            >
                <Plus size={14}/>
            </button>
        </div>

        {/* Spaces List */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-2 space-y-0.5">
            {spaces.map(space => {
                const spaceLists = lists.filter(l => l.spaceId === space.id);
                const isCollapsed = collapsedSpaces.has(space.id);
                const isActive = activeSpaceId === space.id;

                return (
                    <div key={space.id} className="space-y-0.5">
                        <div className="group flex items-center gap-0.5 pr-1">
                            <button
                                onClick={() => {
                                    setActiveSpaceId(space.id);
                                    if(isCollapsed) toggleSpace(space.id);
                                }}
                                className={`flex-1 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm transition-all duration-200
                                    ${isActive ? 'text-indigo-700 font-medium bg-indigo-50/50' : 'text-gray-600 hover:bg-gray-100 hover:border-indigo-200 border border-transparent'}
                                `}
                            >
                                <div 
                                    onClick={(e) => { e.stopPropagation(); toggleSpace(space.id); }}
                                    className="p-0.5 rounded hover:bg-black/5 text-gray-400"
                                >
                                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                </div>
                                <span className="text-sm">{space.icon}</span>
                                <span className="truncate flex-1 text-left text-xs">{space.name}</span>
                            </button>
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditSpace(space.id, space.name);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-all duration-200 hover:border-gray-300 border border-transparent opacity-0 group-hover:opacity-100"
                                title="Space Settings"
                            >
                                <Cog size={12} />
                            </button>
                        </div>

                        {/* Modules in Space */}
                        {!isCollapsed && (
                            <div className="ml-5 space-y-0.5 border-l border-gray-200 pl-1">
                                {spaceLists.map(list => (
                                    <div key={list.id} className="relative group/item w-full flex items-center">
                                        <button
                                            onClick={() => {
                                                setActiveSpaceId(space.id);
                                                setActiveListId(list.id);
                                            }}
                                            className={`flex-1 flex items-center gap-2 px-2 py-0.5 rounded-md text-xs transition-all duration-200
                                                ${activeListId === list.id ? 'bg-gray-200 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 hover:border-indigo-200 border border-transparent'}
                                            `}
                                        >
                                            <span className={`${activeListId === list.id ? 'text-gray-800' : 'text-gray-400 group-hover/item:text-gray-600'}`}>
                                                {getModuleIcon(list.type)}
                                            </span>
                                            <span className="truncate">{list.name}</span>
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteModule(list.id);
                                            }}
                                            className={`p-0.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200 hover:border-red-200 border border-transparent flex-shrink-0 ${activeListId === list.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}`}
                                            title="Delete Module"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        setAddingModuleSpaceId(space.id);
                                        setNewModuleName('');
                                        setSelectedModuleType(ModuleType.TASKS);
                                    }}
                                    className="w-full flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 hover:border-gray-200 border border-transparent"
                                >
                                    <Plus size={10} /> Add Module
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* User / Bottom Actions */}
      <div className="p-2 border-t border-gray-200 bg-white space-y-0.5 shrink-0">
        <button className="flex items-center gap-2 w-full text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50 transition-all duration-200 hover:border-gray-200 border border-transparent">
            <Search size={14} />
            Search
        </button>
        <div className="relative">
            <button 
                ref={notifButtonRef}
                onClick={() => setShowNotifications(!showNotifications)}
                className={`flex items-center gap-2 w-full text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50 transition-all duration-200 hover:border-gray-200 border border-transparent ${showNotifications ? 'bg-gray-100' : ''}`}
            >
                <div className="relative">
                    <Bell size={14} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                </div>
                Notifications
            </button>
            {/* Notification Popover */}
            {showNotifications && (
                <div className="absolute bottom-full left-0 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 mb-2 overflow-hidden z-50 flex flex-col animate-[fadeIn_0.1s_ease-out]">
                    <div className="flex items-center justify-between p-2 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-700 text-xs">Notifications</h3>
                        {notifications.length > 0 && (
                            <button onClick={clearAllNotifications} className="text-[10px] text-gray-400 hover:text-gray-600">Clear All</button>
                        )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-[10px]">No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div 
                                    key={n.id} 
                                    onClick={() => {
                                        markNotificationRead(n.id);
                                        if (n.linkTaskId) {
                                            setActiveTaskId(n.linkTaskId);
                                            setShowNotifications(false);
                                        }
                                    }}
                                    className={`p-2 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={`mt-0.5 p-1 rounded-full ${n.type === 'reminder' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Clock size={10} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-[11px] ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">{n.message}</p>
                                            <p className="text-[9px] text-gray-400 mt-0.5">{new Date(n.timestamp).toLocaleString()}</p>
                                        </div>
                                        {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
        <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 w-full text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-50 transition-all duration-200 hover:border-gray-200 border border-transparent"
        >
            <Settings size={14} />
            Settings
        </button>
        <button 
            onClick={logout}
            className="flex items-center gap-2 w-full text-xs text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 mt-0.5 border-t border-gray-100 pt-1.5 transition-all duration-200 hover:border-rose-200 border border-transparent"
        >
            <LogOut size={14} />
            Sign Out
        </button>
      </div>

      {/* Edit Space Modal */}
      {editingSpaceId && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/95 backdrop-blur-sm z-30 flex flex-col p-4 animate-[fadeIn_0.2s_ease-out]">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg text-gray-800">Space Settings</h2>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                  </button>
              </div>

              <form onSubmit={handleUpdateSpace} className="flex-1 flex flex-col">
                  <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Space Name</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={editSpaceName}
                        onChange={(e) => setEditSpaceName(e.target.value)}
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                  </div>

                  <button 
                    type="submit"
                    disabled={!editSpaceName.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm mb-6"
                  >
                      Save Changes
                  </button>

                  <div className="mt-auto border-t border-gray-200 pt-6">
                      <h3 className="text-xs font-bold text-red-600 uppercase mb-2">Danger Zone</h3>
                      <p className="text-xs text-gray-500 mb-4">Deleting a space will permanently remove all modules, tasks, and data within it.</p>
                      <button 
                        type="button"
                        onClick={handleDeleteSpace}
                        className="w-full py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                      >
                          Delete Space
                      </button>
                  </div>
              </form>
          </div>
      )}

      {/* Create Space Modal Overlay */}
      {isCreatingSpace && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/95 backdrop-blur-sm z-10 flex flex-col p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg text-gray-800">New Space</h2>
                  <button onClick={() => setIsCreatingSpace(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                  </button>
              </div>
              
              <form onSubmit={handleCreateSpace} className="flex-1 flex flex-col">
                  <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Space Name</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={newSpaceName}
                        onChange={(e) => setNewSpaceName(e.target.value)}
                        placeholder="e.g. Finance"
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                  </div>

                  <div className="mb-6 flex-1 overflow-y-auto pr-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Integrate Apps</label>
                      <div className="space-y-2 pr-2 max-h-64 overflow-y-auto">
                          {availableModules.map(module => (
                              <div 
                                key={module.type}
                                onClick={() => toggleModuleSelection(module.type)}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                    ${selectedModules.has(module.type) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}
                                `}
                              >
                                  <div className={`mt-0.5 ${selectedModules.has(module.type) ? 'text-indigo-600' : 'text-gray-400'}`}>
                                      {selectedModules.has(module.type) ? <CheckSquare size={18} /> : <div className="w-[18px] h-[18px] border-2 border-gray-300 rounded" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className={`text-sm font-semibold flex items-center gap-2 ${selectedModules.has(module.type) ? 'text-indigo-900' : 'text-gray-700'}`}>
                                          <module.icon size={14} /> <span className="truncate">{module.label}</span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5 truncate">{module.desc}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={!newSpaceName.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                      Create Space
                  </button>
              </form>
          </div>
      )}

      {/* Add Module Modal Overlay */}
      {addingModuleSpaceId && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/95 backdrop-blur-sm z-20 flex flex-col p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg text-gray-800">Add Module</h2>
                  <button onClick={() => setAddingModuleSpaceId(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                  </button>
              </div>
              
              <form onSubmit={handleAddModule} className="flex-1 flex flex-col">
                  <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Module Name</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        placeholder="e.g. Q4 Objectives"
                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      />
                  </div>

                  <div className="mb-6 flex-1 overflow-y-auto pr-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Select Type</label>
                      <div className="space-y-2 pr-2 max-h-64 overflow-y-auto">
                          {availableModules.map(module => (
                              <div 
                                key={module.type}
                                onClick={() => setSelectedModuleType(module.type)}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                    ${selectedModuleType === module.type ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}
                                `}
                              >
                                  <div className={`mt-0.5 ${selectedModuleType === module.type ? 'text-indigo-600' : 'text-gray-400'}`}>
                                      {selectedModuleType === module.type ? <div className="w-[18px] h-[18px] border-[5px] border-indigo-600 rounded-full" /> : <div className="w-[18px] h-[18px] border-2 border-gray-300 rounded-full" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className={`text-sm font-semibold flex items-center gap-2 ${selectedModuleType === module.type ? 'text-indigo-900' : 'text-gray-700'}`}>
                                          <module.icon size={14} /> <span className="truncate">{module.label}</span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5 truncate">{module.desc}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={!newModuleName.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                      Add Module
                  </button>
              </form>
          </div>
      )}

      {/* Settings Modal Overlay */}
      {showSettings && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/95 backdrop-blur-sm z-25 flex flex-col p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg text-gray-800">Application Settings</h2>
                  <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={20} />
                  </button>
              </div>
              
              <div className="flex-1 flex flex-col">
                  <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-3">Database</h3>
                      <button 
                          onClick={resetData}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 text-red-600 transition-colors"
                      >
                          Reset Local Data
                          <p className="text-xs text-gray-500 mt-1">Delete all local data and restore to demo state</p>
                      </button>
                  </div>
                  
                  <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-3">Appearance</h3>
                      <div className="p-3 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">Theme settings will be available in future versions</p>
                      </div>
                  </div>
                  
                  <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-3">About</h3>
                      <div className="p-3 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-600">NexusFlow - AI-Powered Workspace Manager</p>
                          <p className="text-xs text-gray-500 mt-1">Version 1.0.0</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};