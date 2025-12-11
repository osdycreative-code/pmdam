
import React, { useState } from 'react';
import { Code2, Sparkles, Loader2, Copy } from 'lucide-react';
import { generateAppCode } from '../services/geminiService';

export const AppGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if(!prompt.trim()) return;
        setIsGenerating(true);
        setResult(null);

        try {
            const code = await generateAppCode(prompt);
            setResult(code);
        } catch (error) {
            setResult("Error generating code.");
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
                {/* Left Panel: Input Controls */}
                <div className="w-96 border-r border-gray-200 p-6 flex flex-col bg-gray-50 overflow-y-auto">
                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            Describe your Application
                        </label>
                        <p className="text-xs text-gray-500 mb-4">
                            Be specific about the framework (React, NestJS), features, and data structure.
                        </p>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Example: Create a React Login component with email and password fields, validation using Zod, and a submit button that calls a simulated API."
                            className="w-full flex-1 min-h-[300px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm bg-white shadow-sm mb-4 transition-all duration-200 focus:border-blue-300"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-all duration-200 hover:border-blue-300 border border-transparent active:scale-[0.98]"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            Generate Code
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="flex-1 bg-white p-0 overflow-y-auto flex flex-col">
                    {!result && !isGenerating && (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                <Code2 size={32} className="text-blue-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Your generated code will appear here</p>
                        </div>
                    )}
                    
                    {isGenerating && (
                         <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <Loader2 size={48} className="mb-4 text-blue-500 animate-spin" />
                            <p>Generating application boilerplate...</p>
                         </div>
                    )}

                    {result && (
                        <div className="flex-1 flex flex-col animate-[fadeIn_0.5s_ease-out]">
                             <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-sm font-bold text-gray-600 uppercase">Generated Output</h2>
                                <button onClick={() => navigator.clipboard.writeText(result)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:text-blue-600 transition-all duration-200 hover:border-blue-300">
                                    <Copy size={14} /> Copy Code
                                </button>
                             </div>
                             <div className="flex-1 bg-[#1e1e1e] p-6 overflow-auto">
                                 <pre className="text-gray-300 font-mono text-sm leading-relaxed">{result}</pre>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
