import React, { useState } from 'react';
import { Code2, Sparkles, Loader2, Copy, Smartphone, Globe, Layout, Palette, Server, Box, Check } from 'lucide-react';
import { generateAppCode } from '../services/geminiService';

export const AppGeneratorView: React.FC = () => {
    
    // Form State
    const [appName, setAppName] = useState('');
    const [appType, setAppType] = useState('Web App (React)');
    const [theme, setTheme] = useState('Modern Light');
    const [features, setFeatures] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    
    // Generation State
    const [result, setResult] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const toggleFeature = (feat: string) => {
        setFeatures(prev => prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]);
    };

    const handleGenerate = async () => {
        if(!appName.trim() && !description.trim()) return;
        setIsGenerating(true);
        setResult(null);

        // Construct structured prompt
        const prompt = `
            Create a ${appType} named "${appName}".
            Theme Style: ${theme}.
            Key Features to include: ${features.join(', ') || 'Standard features'}.
            
            Detailed Description:
            ${description}

            Please provide the complete source code structure, focusing on the main entry point and key components.
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

    const featureOptions = [
        "User Authentication", "Database Integration", "Dark Mode", "Dashboard", 
        "Payment Gateway", "File Upload", "Real-time Chat", "Analytics Charts"
    ];

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
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Platform / Framework</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Web App (React)', 'Mobile App (React Native)', 'API Service (Node.js)', 'Static Site (HTML/CSS)'].map(type => (
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

                        {/* Theme */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Visual Theme</label>
                            <div className="relative">
                                <Palette className="absolute left-3 top-3 text-gray-400" size={18}/>
                                <select 
                                    title="Visual Theme"
                                    aria-label="Visual Theme"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none shadow-sm cursor-pointer"
                                    value={theme}
                                    onChange={e => setTheme(e.target.value)}
                                >
                                    <option>Modern Light</option>
                                    <option>Sleek Dark</option>
                                    <option>Corporate Blue</option>
                                    <option>Vibrant Creative</option>
                                    <option>Minimalist Monochrome</option>
                                </select>
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Key Features</label>
                            <div className="flex flex-wrap gap-2">
                                {featureOptions.map(feat => (
                                    <button
                                        key={feat}
                                        onClick={() => toggleFeature(feat)}
                                        className={`text-xs px-3 py-2 rounded-full border transition-all flex items-center gap-1.5 ${features.includes(feat) ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        {features.includes(feat) && <Check size={12}/>} {feat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Detailed Description */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Specific Requirements</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe specific business logic, data models, or particular functionality you need..."
                                className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm bg-white shadow-sm transition-all"
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
