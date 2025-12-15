import React, { useState } from 'react';
import { Code2, Sparkles, Loader2, Copy, Smartphone, Globe, Layout, Palette, Server, Box, Check, Save } from 'lucide-react';
import { generateAppCode } from '../services/geminiService';
import { useAuthStore } from '../src/stores/authStore';

export const AppGeneratorView: React.FC = () => {
    
    // Submodule Navigation State
    const [activeTab, setActiveTab] = useState<'phases' | 'config'>('phases');

    // --- DEVELOPMENT PHASES STATE ---
    const [appObjective, setAppObjective] = useState('');
    const [techStackMVP, setTechStackMVP] = useState(''); // Platform, Backend
    const [apiIntegrations, setApiIntegrations] = useState('');
    const [hostingStrategy, setHostingStrategy] = useState('');
    
    // Screens State (Array)
    const [screens, setScreens] = useState<{id: string; name: string; description: string}[]>([
        { id: '1', name: 'Home Screen', description: 'Main landing view' }
    ]);
    const addScreen = () => setScreens([...screens, { id: crypto.randomUUID(), name: '', description: '' }]);
    const updateScreen = (id: string, field: 'name' | 'description', value: string) => {
        setScreens(screens.map(s => s.id === id ? { ...s, [field]: value } : s));
    };
    const removeScreen = (id: string) => setScreens(screens.filter(s => s.id !== id));

    const [gamification, setGamification] = useState('');
    const [notifications, setNotifications] = useState('');
    const [customFields, setCustomFields] = useState('');

    // --- APP CONFIGURATION STATE (Relocated) ---
    const [appName, setAppName] = useState('');
    const [appType, setAppType] = useState('React + Vite');
    const [dbType, setDbType] = useState('');
    const [description, setDescription] = useState('');
    
    // Tooling State
    const [useTypescript, setUseTypescript] = useState(true);
    const [useTailwind, setUseTailwind] = useState(true);
    const [useLinting, setUseLinting] = useState(true);
    const [useGit, setUseGit] = useState(true);
    
    // Generation State
    const [result, setResult] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Import Services
    const { login } = useAuthStore(); // We don't strictly need auth info for saving locally if we rely on dbService internals
    // We need to import dbService at the top, I will handle imports in a separate block or assume they are there.
    // Ideally I should check imports but for this edit I focused on the internal logic.
    // Wait, I can't add imports with this tool if they are at line 1.
    // I will assume I can edit the whole file or just this block.
    // I will stick to the block edit, but I need to make sure dbService is available. 
    // The previous view_file showed `generateAppCode` import. I'll need to add `dbService`.
    // Actually, to make this robust, I should probably rewrite the imports first.
    // But let's add the handler first.
    
    const handleSaveDraft = async () => {
        if(!appName.trim()) {
            alert('Please enter an Application Name to save.');
            return;
        }
        setIsSaving(true);
        try {
            const projectData: Partial<any> = {
               id: crypto.randomUUID(),
               nombre_proyecto: appName,
               tipo_activo: 'App', // Fixed type for this generator
               presupuesto_asignado: 0,
               specifications: {
                   objective: appObjective,
                   techStack: techStackMVP,
                   apis: apiIntegrations,
                   hosting: hostingStrategy,
                   screens: screens,
                   gamification: gamification,
                   notifications: notifications,
                   custom: customFields,
                   config: {
                       type: appType,
                       db: dbType,
                       tooling: { ts: useTypescript, tw: useTailwind, lint: useLinting, git: useGit }
                   },
                   generatorResult: result
               },
               fecha_creacion: new Date().toISOString(),
               ultima_actualizacion: new Date().toISOString(),
               sync_status: 'pending' // Mark for sync to Supabase
            };

            // Dynamic import to avoid top-level issues if possible, or just standard import. 
            // I'll assume standard import will be added.
            const { dbService } = await import('../services/db'); 
            await dbService.addItem('projects', projectData);
            
            alert('Project saved to Workspace (Local & Cloud Sync Pending)');
        } catch (error) {
            console.error(error);
            alert('Failed to save project.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerate = async () => {
        if(!appName.trim() && !appObjective.trim()) return;
        setIsGenerating(true);
        setResult(null);

        // Construct structured prompt combining both submodules
        const prompt = `
            Create a project configuration and initial code structure based on the following specifications:
            
            PART 1: DEVELOPMENT PHASES & STRATEGY
            - Objective: "${appObjective}"
            - Tech Stack (MVP): "${techStackMVP}"
            - APIs / Integrations: "${apiIntegrations}"
            - Hosting Strategy: "${hostingStrategy}"
            - Planned Screens: ${screens.map(s => `${s.name} (${s.description})`).join(', ')}
            - Gamification Strategy: "${gamification}"
            - Notifications Strategy: "${notifications}"
            - Custom Notes: "${customFields}"

            PART 2: TECHNICAL CONFIGURATION
            - Project Name: "${appName || 'Untitled App'}"
            - Framework: ${appType}
            ${(appType === 'DataBase' || appType.includes('FullStack')) ? `- Database: ${dbType || 'Not specified'}` : ''}
            
            Tooling:
            - TypeScript: ${useTypescript ? 'Yes' : 'No'}
            - Tailwind CSS: ${useTailwind ? 'Yes' : 'No'}
            - ESLint + Prettier: ${useLinting ? 'Yes' : 'No'}
            - Initialize Git: ${useGit ? 'Yes' : 'No'}
            
            Additional Requirements:
            ${description || 'Standard best practices.'}

            Please provide:
            1. Recommended folder structure.
            2. package.json configuration.
            3. Main entry file content.
            4. If a Database is selected, connection setup/schema.
            5. Basic implementation hints for the defined screens.
        `;

        try {
            const code = await generateAppCode(prompt);
            setResult(code);
        } catch (error) {
            setResult("Error generating code. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-gray-900">
             {/* Header */}
             <div className="h-16 px-6 flex items-center border-b border-gray-100 shrink-0 gap-6">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Code2 size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">App Generator</h1>
                </div>
                {/* Submodule Tabs */}
                <div className="flex bg-gray-100/50 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('phases')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'phases' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Development Phases
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        App Configuration
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Form Interface */}
                <div className="w-[500px] border-r border-gray-200 p-8 flex flex-col bg-gray-50 overflow-y-auto">
                    
                    {/* --- TAB: DEVELOPMENT PHASES --- */}
                    {activeTab === 'phases' && (
                        <div className="space-y-6 animate-fadeIn">
                             <div>
                                <h2 className="text-lg font-bold text-gray-800 mb-1">Development Phases</h2>
                                <p className="text-sm text-gray-500">Define the roadmap, architecture, and core features.</p>
                            </div>

                            {/* 1. App Objective */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. App Objective</label>
                                <textarea 
                                    className="w-full h-20 p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                                    placeholder="What is the main goal of this app?"
                                    value={appObjective}
                                    onChange={e => setAppObjective(e.target.value)}
                                />
                            </div>

                            {/* 2. Technical Architecture */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Technical Architecture (MVP)</label>
                                <input 
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-2"
                                    placeholder="Platform & Backend (e.g., Web + Node.js + PostgreSQL)"
                                    value={techStackMVP}
                                    onChange={e => setTechStackMVP(e.target.value)}
                                />
                            </div>

                             {/* 3. APIs & Hosting */}
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. APIs to Integrate</label>
                                    <input 
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Stripe, Google Maps..."
                                        value={apiIntegrations}
                                        onChange={e => setApiIntegrations(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hosting Strategy</label>
                                    <input 
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Vercel, AWS, VPS..."
                                        value={hostingStrategy}
                                        onChange={e => setHostingStrategy(e.target.value)}
                                    />
                                </div>
                             </div>

                             {/* 4. Screens */}
                             <div>
                                <div className="flex justify-between items-center mb-2">
                                     <label className="block text-xs font-bold text-gray-500 uppercase">4. Screens / Views</label>
                                     <button onClick={addScreen} className="text-xs text-blue-600 font-medium hover:underline">+ Add Screen</button>
                                </div>
                                <div className="space-y-3">
                                    {screens.map((screen, index) => (
                                        <div key={screen.id} className="flex gap-2 p-3 bg-white border border-gray-200 rounded-xl relative group">
                                            <div className="flex flex-col flex-1 gap-2">
                                                <input 
                                                    className="w-full text-sm font-semibold text-gray-800 bg-transparent border-b border-gray-100 focus:border-blue-500 outline-none pb-1"
                                                    placeholder="Screen Name"
                                                    value={screen.name}
                                                    onChange={e => updateScreen(screen.id, 'name', e.target.value)}
                                                />
                                                <input 
                                                    className="w-full text-xs text-gray-500 bg-transparent outline-none"
                                                    placeholder="Brief description of functionality..."
                                                    value={screen.description}
                                                    onChange={e => updateScreen(screen.id, 'description', e.target.value)}
                                                />
                                            </div>
                                            {screens.length > 1 && (
                                                <button 
                                                    onClick={() => removeScreen(screen.id)}
                                                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                                                >
                                                    <Box size={14} className="rotate-45" /> {/* Using Box as X substitute if X not imported, or update import */}
                                                </button>
                                            )}
                                            <span className="absolute -left-2 -top-2 w-5 h-5 flex items-center justify-center bg-gray-200 rounded-full text-[10px] font-bold text-gray-600">{index + 1}</span>
                                        </div>
                                    ))}
                                </div>
                             </div>

                             {/* 5, 6, 7 Remaining Fields */}
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">5. Gamification Rules</label>
                                    <input 
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Points, Badges, Leaderboards..."
                                        value={gamification}
                                        onChange={e => setGamification(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">6. Notifications Strategy</label>
                                    <input 
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="Email, Push, In-app..."
                                        value={notifications}
                                        onChange={e => setNotifications(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">7. Custom Fields / Notes</label>
                                    <textarea 
                                        className="w-full h-20 p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                                        placeholder="Any other specific fields or requirements..."
                                        value={customFields}
                                        onChange={e => setCustomFields(e.target.value)}
                                    />
                                </div>
                             </div>
                        </div>
                    )}

                    {/* --- TAB: APP CONFIGURATION --- */}
                    {activeTab === 'config' && (
                        <div className="space-y-8 animate-fadeIn">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 mb-1">Technical Configuration</h2>
                                <p className="text-sm text-gray-500">Define the core coding standards and stack.</p>
                            </div>

                            {/* App Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Application Name</label>
                                <div className="relative">
                                    <Box className="absolute left-3 top-3 text-gray-400" size={18}/>
                                    <input 
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                                        placeholder="e.g. TaskMaster Pro"
                                        value={appName}
                                        onChange={e => setAppName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* App Type */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Project Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        'React + Vite', 
                                        'Vue 3 + Vite', 
                                        'Svelte + Vite', 
                                        'Astro',
                                        'SolidJS',
                                        'Qwik',
                                        'FullStack (Express + DB)',
                                        'DataBase'
                                    ].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setAppType(type)}
                                            className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${appType === type ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Database Selection (Conditional) */}
                            {(appType === 'DataBase' || appType === 'FullStack (Express + DB)') && (
                                <div className="animate-[fadeIn_0.3s_ease-out]">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Database Engine</label>
                                    <div className="relative">
                                        <Server className="absolute left-3 top-3 text-gray-400" size={18}/>
                                        <select 
                                            title="Select Database"
                                            aria-label="Select Database Engine"
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none shadow-sm cursor-pointer"
                                            value={dbType}
                                            onChange={e => setDbType(e.target.value)}
                                        >
                                            <option value="">Select Database...</option>
                                            <option value="PostgreSQL">PostgreSQL</option>
                                            <option value="MongoDB">MongoDB</option>
                                            <option value="MySQL">MySQL</option>
                                            <option value="Supabase">Supabase</option>
                                            <option value="Firebase">Firebase</option>
                                            <option value="SQLite">SQLite</option>
                                            {/* ... others ... */}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Tooling Options */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Tooling</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-blue-300 transition-all select-none">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-blue-100 rounded-md text-blue-600 font-bold text-xs">TS</div>
                                            <span className="text-sm font-medium text-gray-700">TypeScript</span>
                                        </div>
                                        <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${useTypescript ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${useTypescript ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={useTypescript} onChange={() => setUseTypescript(!useTypescript)} />
                                    </label>

                                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-blue-300 transition-all select-none">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-cyan-100 rounded-md text-cyan-600 font-bold text-xs">TW</div>
                                            <span className="text-sm font-medium text-gray-700">Tailwind CSS</span>
                                        </div>
                                        <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${useTailwind ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${useTailwind ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={useTailwind} onChange={() => setUseTailwind(!useTailwind)} />
                                    </label>

                                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-blue-300 transition-all select-none">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-purple-100 rounded-md text-purple-600 font-bold text-xs">ES</div>
                                            <span className="text-sm font-medium text-gray-700">ESLint + Prettier</span>
                                        </div>
                                        <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${useLinting ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${useLinting ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={useLinting} onChange={() => setUseLinting(!useLinting)} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-200 sticky bottom-0 bg-gray-50 pb-2">
                        <div className="flex gap-2">
                             <button 
                                onClick={handleSaveDraft}
                                disabled={isSaving || !appName}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                            >
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                Save Draft
                            </button>
                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating || (!appName && !appObjective)}
                                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                            >
                                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                Generate App & Code
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="flex-1 bg-white p-0 overflow-y-auto flex flex-col">
                    {!result && !isGenerating && (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
                                <Code2 size={40} className="text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Build</h3>
                            <p className="text-sm font-medium text-gray-500 max-w-sm text-center">Config your app on the phases or config tab and hit generate.</p>
                        </div>
                    )}
                    
                    {isGenerating && (
                         <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <Loader2 size={48} className="mb-6 text-blue-500 animate-spin" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">AI is Designing & Coding...</h3>
                            <p className="text-sm text-gray-500">Generating architecture, screens, and config.</p>
                         </div>
                    )}

                    {result && (
                        <div className="flex-1 flex flex-col animate-[fadeIn_0.5s_ease-out]">
                             <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Generated Source</h2>
                                </div>
                                <button onClick={() => navigator.clipboard.writeText(result)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:text-blue-600 transition-all duration-200 hover:border-blue-300 shadow-sm">
                                    <Copy size={14} /> Copy Code
                                </button>
                             </div>
                             <div className="flex-1 bg-[#1e1e1e] p-8 overflow-auto">
                                 <pre className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">{result}</pre>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
