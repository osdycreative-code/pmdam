import React, { useState } from 'react';
import { Palette, BookOpen, Gamepad2, Code2, Sparkles, Loader2, Download, Copy, Image as ImageIcon } from 'lucide-react';
import { generateAppCode, generateCreativeText, generateColoringPage } from '../services/geminiService';

type StudioMode = 'story' | 'coloring' | 'app' | 'game';

export const CreativeStudio: React.FC = () => {
    const [mode, setMode] = useState<StudioMode>('story');
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if(!prompt.trim()) return;
        setIsGenerating(true);
        setResult(null);

        try {
            if (mode === 'app') {
                const code = await generateAppCode(prompt);
                setResult(code);
            } else if (mode === 'coloring') {
                const img = await generateColoringPage(prompt);
                setResult(img); // Base64 image
            } else {
                const text = await generateCreativeText(prompt, mode === 'game' ? 'game' : 'story');
                setResult(text);
            }
        } catch (error) {
            setResult("Error generating content.");
        } finally {
            setIsGenerating(false);
        }
    };

    const getPlaceholder = () => {
        switch(mode) {
            case 'story': return "Example: A rabbit who wants to go to the moon...";
            case 'coloring': return "Example: A cute dragon sitting on a castle...";
            case 'app': return "Example: A React login form with validation...";
            case 'game': return "Example: A math quiz for 3rd graders...";
        }
    };

    const modes: { id: StudioMode; label: string; icon: any }[] = [
        { id: 'story', label: 'Story Writer', icon: BookOpen },
        { id: 'coloring', label: 'Coloring Book', icon: ImageIcon },
        { id: 'game', label: 'Educational Game', icon: Gamepad2 },
        { id: 'app', label: 'App Generator', icon: Code2 },
    ];

    return (
        <div className="flex flex-col h-full bg-white">
             {/* Header */}
             <div className="h-16 px-6 flex items-center border-b border-gray-100 shrink-0 gap-6">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><Palette size={20}/></div>
                    <h1 className="text-xl font-semibold text-gray-800">Creative Studio</h1>
                </div>
                
                <div className="h-8 w-px bg-gray-200 shrink-0"></div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {modes.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => { setMode(m.id); setResult(null); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap
                                ${mode === m.id 
                                    ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-sm' 
                                    : 'bg-white text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-200 hover:border-pink-200'
                                }
                            `}
                        >
                            <m.icon size={14} />
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Input Controls */}
                <div className="w-80 border-r border-gray-200 p-6 flex flex-col bg-gray-50 overflow-y-auto">
                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            {modes.find(m => m.id === mode)?.label} Prompt
                        </label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full flex-1 min-h-[200px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none text-sm bg-white shadow-sm mb-4 transition-all duration-200 focus:border-pink-300"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-all duration-200 hover:border-pink-300 border border-transparent active:scale-[0.98]"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            Generate Content
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="flex-1 bg-white p-8 overflow-y-auto">
                    {!result && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Sparkles size={32} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-500">Enter a prompt on the left to start creating</p>
                        </div>
                    )}
                    
                    {isGenerating && (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Loader2 size={48} className="mb-4 text-pink-500 animate-spin" />
                            <p>AI is creating your masterpiece...</p>
                         </div>
                    )}

                    {result && (
                        <div className="animate-[fadeIn_0.5s_ease-out]">
                             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800">Result</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => navigator.clipboard.writeText(result)} className="p-2 hover:bg-gray-100 rounded text-gray-500 transition-all duration-200 hover:border-gray-200 border border-transparent" title="Copy to Clipboard">
                                        <Copy size={16} />
                                    </button>
                                </div>
                             </div>

                             {mode === 'coloring' ? (
                                 <div className="border border-gray-100 rounded-xl p-8 bg-gray-50 flex justify-center">
                                     <img src={result} alt="Generated Coloring Page" className="max-w-full max-h-[600px] shadow-lg bg-white rounded-lg" />
                                 </div>
                             ) : mode === 'app' ? (
                                 <div className="bg-gray-900 text-gray-100 p-6 rounded-xl font-mono text-sm overflow-x-auto shadow-inner">
                                     <pre>{result}</pre>
                                 </div>
                             ) : (
                                 <div className="prose prose-pink max-w-none">
                                     <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">{result}</pre>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};