import React, { useState } from 'react';
import { Code2, Sparkles, Loader2, Copy, Smartphone, Globe, Layout, Palette, Server, Box, Check } from 'lucide-react';
import { generateAppCode } from '../services/geminiService';

export const AppGeneratorView: React.FC = () => {
    
    // Form State
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

    const handleGenerate = async () => {
        if(!appName.trim()) return;
        setIsGenerating(true);
        setResult(null);

        // Construct structured prompt
        const prompt = `
            Create a project configuration and initial code structure for:
            Project Name: "${appName}"
            Type/Framework: ${appType}
            ${(appType === 'DataBase' || appType.includes('FullStack')) ? `Database: ${dbType || 'Not specified'}` : ''}
            
            Configuration:
            - TypeScript: ${useTypescript ? 'Yes' : 'No'}
            - Tailwind CSS: ${useTailwind ? 'Yes' : 'No'}
            - ESLint + Prettier: ${useLinting ? 'Yes' : 'No'}
            - Initialize Git: ${useGit ? 'Yes' : 'No'}
            
            Additional Requirements:
            ${description || 'Standard best practices implementation.'}

            Please provide the following:
            1. Recommended folder structure.
            2. package.json configuration with these specific dependencies.
            3. Main entry file content (e.g., main.tsx, index.ts).
            4. If a Database is selected, provide the connection setup or schema initialization.
            5. A brief guide on how to run this project.
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
        <div className="flex flex-col h-full bg-white">
             {/* Header */}
             <div className="h-16 px-6 flex items-center border-b border-gray-100 shrink-0 gap-6">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Code2 size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">App Generator</h1>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Form Interface */}
                <div className="w-[500px] border-r border-gray-200 p-8 flex flex-col bg-gray-50 overflow-y-auto">
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 mb-1">App Configuration</h2>
                            <p className="text-sm text-gray-500">Define the core specifications for your application.</p>
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
                                        <option value="MariaDB">MariaDB</option>
                                        <option value="Redis">Redis</option>
                                        <option value="DynamoDB">AWS DynamoDB</option>
                                        <option value="MSSQL">Microsoft SQL Server</option>
                                        <option value="Oracle">Oracle DB</option>
                                        <option value="PlanetScale">PlanetScale</option>
                                        <option value="Neon">Neon (Serverless Postgres)</option>
                                        <option value="Convex">Convex</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Tooling Options */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Tooling & Configuration</label>
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

                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-blue-300 transition-all select-none">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-orange-100 rounded-md text-orange-600 font-bold text-xs">GIT</div>
                                        <span className="text-sm font-medium text-gray-700">Initialize Git</span>
                                    </div>
                                    <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${useGit ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${useGit ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={useGit} onChange={() => setUseGit(!useGit)} />
                                </label>
                            </div>
                        </div>

                         {/* Specific Description */}
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Additional Details</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Any specific requirements, structure preferences, or business logic..."
                                className="w-full h-24 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm bg-white shadow-sm transition-all"
                            />
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || (!appName && !description)}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                            Generate Application
                        </button>
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
                            <p className="text-sm font-medium text-gray-500 max-w-sm text-center">Config your app on the left and hit generate to see the magic happen.</p>
                        </div>
                    )}
                    
                    {isGenerating && (
                         <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <Loader2 size={48} className="mb-6 text-blue-500 animate-spin" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">AI is Writing Code...</h3>
                            <p className="text-sm text-gray-500">Generating components, styles, and logic based on your specs.</p>
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
