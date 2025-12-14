import React, { useState } from 'react';
import { Palette, BookOpen, Gamepad2, FileText, Sparkles, Loader2, Download, Copy, Image as ImageIcon, Save, Trash2, LayoutList, PenTool, CheckCircle, Plus } from 'lucide-react';
import { generateManual, generateCreativeText, generateColoringPage } from '../services/geminiService';
import { usePersistence } from '../src/context/CentralizedPersistenceContext';
import { CreativeArtifact } from '../types';

type StudioMode = 'story' | 'coloring' | 'manual' | 'game';

export const CreativeStudio: React.FC = () => {
    const { creativeArtifacts, createCreativeArtifact, updateCreativeArtifact, deleteCreativeArtifact } = usePersistence();
    const [mode, setMode] = useState<StudioMode>('story');
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // CRUD State
    const [selectedArtifactId, setSelectedArtifactId] = useState<number | null>(null);
    const [artifactTitle, setArtifactTitle] = useState('');
    const [showSaved, setShowSaved] = useState(false);

    // Story Phases
    const [storyPhase, setStoryPhase] = useState<'Idea' | 'Outline' | 'Draft' | 'Final'>('Idea');

    // Filtered lists
    const currentModeArtifacts = creativeArtifacts.filter(a => a.type === mode);

    const handleGenerate = async () => {
        if(!prompt.trim()) return;
        setIsGenerating(true);
        setResult(null);

        try {
            if (mode === 'manual') {
                const manual = await generateManual(prompt);
                setResult(manual);
            } else if (mode === 'coloring') {
                const img = await generateColoringPage(prompt);
                setResult(img); // Base64 image
            } else {
                // Story Phases Logic
                let finalPrompt = prompt;
                if(mode === 'story') {
                     if(storyPhase === 'Idea') finalPrompt = `Generate a unique story idea based on: ${prompt}`;
                     else if(storyPhase === 'Outline') finalPrompt = `Create a detailed chapter outline for a story about: ${prompt}`;
                     else if(storyPhase === 'Draft') finalPrompt = `Write a full story draft based on: ${prompt}`;
                     else if(storyPhase === 'Final') finalPrompt = `Polish and improve the following story text: ${prompt}`;
                }
                
                const text = await generateCreativeText(finalPrompt, mode === 'game' ? 'game' : 'story');
                setResult(text);
            }
        } catch (error) {
            setResult("Error generating content.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if(!result || !artifactTitle.trim()) return alert("Please generate content and provide a title first.");
        
        try {
            if(selectedArtifactId) {
                await updateCreativeArtifact(selectedArtifactId, {
                    title: artifactTitle,
                    content: result,
                    prompt: prompt
                });
            } else {
                await createCreativeArtifact({
                    title: artifactTitle,
                    type: mode,
                    content: result,
                    prompt: prompt,
                    created_at: new Date().toISOString()
                });
            }
            alert("Saved successfully!");
            setSelectedArtifactId(null); // Reset after save or keep it? Let's reset for new creations or better yet, load the new one.
            setArtifactTitle('');
        } catch(e) { console.error(e); }
    };

    const handleDelete = async (id: number) => {
        if(window.confirm("Delete this creation?")) {
            await deleteCreativeArtifact(id);
            if(selectedArtifactId === id) {
                setSelectedArtifactId(null);
                setResult(null);
                setPrompt('');
                setArtifactTitle('');
            }
        }
    };

    const handleLoad = (artifact: CreativeArtifact) => {
        setSelectedArtifactId(artifact.id);
        setResult(artifact.content);
        setPrompt(artifact.prompt);
        setArtifactTitle(artifact.title);
        setMode(artifact.type as StudioMode);
        setShowSaved(false); // Close saved list on mobile/if toggleable
    };

    const phases = ['Idea', 'Outline', 'Draft', 'Final'];

    const getPlaceholder = () => {
        switch(mode) {
            case 'story': return "Example: A rabbit who wants to go to the moon...";
            case 'coloring': return "Example: A cute dragon sitting on a castle...";
            case 'manual': return "Example: How to use the new coffee machine safely...";
            case 'game': return "Example: A math quiz for 3rd graders...";
        }
    };

    const modes: { id: StudioMode; label: string; icon: any }[] = [
        { id: 'story', label: 'Story Writer', icon: BookOpen },
        { id: 'coloring', label: 'Coloring Book', icon: ImageIcon },
        { id: 'game', label: 'Educational Game', icon: Gamepad2 },
        { id: 'manual', label: 'Manual Creator', icon: FileText },
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
                            onClick={() => { 
                                setMode(m.id); 
                                setResult(null); 
                                setPrompt(''); 
                                setSelectedArtifactId(null);
                                setArtifactTitle('');
                            }}
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
                <div className="w-80 border-r border-gray-200 p-6 flex flex-col bg-gray-50 overflow-y-auto shrink-0">
                    <div className="flex-1 flex flex-col">
                        
                        {/* Story Phases */}
                        {mode === 'story' && (
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Phase</label>
                                <div className="flex bg-gray-200 rounded-lg p-1 gap-1">
                                    {phases.map(p => (
                                        <button 
                                            key={p} 
                                            onClick={() => setStoryPhase(p as any)}
                                            className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all ${storyPhase === p ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            {mode === 'story' ? `${storyPhase} Prompt` : `${modes.find(m => m.id === mode)?.label} Prompt`}
                        </label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="w-full flex-1 min-h-[150px] p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none text-sm bg-white shadow-sm mb-4 transition-all duration-200 focus:border-pink-300"
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md transition-all duration-200 hover:border-pink-300 border border-transparent active:scale-[0.98] mb-8"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            Generate Content
                        </button>

                        {/* Saved Items List */}
                        <div className="mt-auto">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Saved Creations</label>
                                <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">{currentModeArtifacts.length}</span>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {currentModeArtifacts.length === 0 ? (
                                    <div className="text-center py-4 text-gray-400 text-xs italic bg-gray-100 rounded-lg border border-dashed border-gray-200">
                                        No saved items yet
                                    </div>
                                ) : (
                                    currentModeArtifacts.map(artifact => (
                                        <div key={artifact.id} className={`group flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${selectedArtifactId === artifact.id ? 'bg-pink-50 border-pink-200' : 'bg-white border-gray-200 hover:border-pink-200'}`}>
                                            <div className="flex items-center gap-2 overflow-hidden flex-1" onClick={() => handleLoad(artifact)}>
                                                {mode === 'coloring' ? <ImageIcon size={14} className="text-pink-500"/> : <FileText size={14} className="text-pink-500"/>}
                                                <span className="text-xs font-medium text-gray-700 truncate">{artifact.title}</span>
                                            </div>
                                            <button onClick={() => handleDelete(artifact.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                <Trash2 size={12}/>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
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
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        placeholder="Title..." 
                                        value={artifactTitle}
                                        onChange={(e) => setArtifactTitle(e.target.value)}
                                        className="text-xs border border-gray-200 rounded px-2 py-1.5 w-32 focus:border-pink-400 outline-none transition-colors"
                                    />
                                    <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors" title="Save Creation">
                                        <Save size={14} /> Save
                                    </button>
                                    <div className="h-4 w-px bg-gray-200 mx-1"></div>
                                    <button onClick={() => navigator.clipboard.writeText(result)} className="p-2 hover:bg-gray-100 rounded text-gray-500 transition-all duration-200 hover:border-gray-200 border border-transparent" title="Copy to Clipboard">
                                        <Copy size={16} />
                                    </button>
                                </div>
                             </div>

                             {mode === 'coloring' ? (
                                 <div className="border border-gray-100 rounded-xl p-8 bg-gray-50 flex justify-center">
                                     <img src={result} alt="Generated Coloring Page" className="max-w-full max-h-[600px] shadow-lg bg-white rounded-lg" />
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