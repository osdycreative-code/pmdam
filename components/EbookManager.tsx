import React, { useState, useEffect, useContext } from 'react';
import { Book, Plus, Search, Download, Trash2, Eye, Edit3, ArrowLeft, Save, Layout, Layers, FileText, Image as ImageIcon, Sparkles, ChevronDown, ChevronRight, Wand2 } from 'lucide-react';
import { StoreContext } from '../App';
import { Block, BlockType } from '../types';
import { CreativeArtifactsAPI } from '../services/api';
import { BlockEditor } from './BlockEditor';

interface EbookChapter {
  id: string;
  title: string;
  content: Block[];
  order: number;
}

interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string; // Used for "Contraportada" reference text or general metadata
  status: 'Draft' | 'Published' | 'Archived';
  
  // Visuals
  coverImage?: string; // Portada
  backCoverImage?: string; // Contraportada visual (Separate from description text)

  // Front Matter
  copyright: string; // Derechos reservados
  acknowledgments: Block[]; // Agradecimientos
  disclaimer: Block[]; // Disclaimer Page
  introduction: Block[]; // Introducción
  
  // Body
  chapters: EbookChapter[]; // Capitulos
  
  // Back Matter
  epilogue: Block[]; // Epilogo
  conclusion: Block[]; // Conclusión
  
  createdAt: Date;
  updatedAt: Date;
  taskId?: string; 
}

// Special Section Types for the Editor Switcher
type EditorSection = 'chapter' | 'acknowledgments' | 'disclaimer' | 'introduction' | 'epilogue' | 'conclusion';

const EbookManager: React.FC = () => {
    const { lists, tasks } = useContext(StoreContext);
    const [ebooks, setEbooks] = useState<Ebook[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Studio State
    const [selectedEbookId, setSelectedEbookId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<{ type: EditorSection, id?: string } | null>(null);
    const [expandedSections, setExpandedSections] = useState({ frontMatter: true, chapters: true, backMatter: true });

    // Initialize
    useEffect(() => {
        const loadEbooks = async () => {
            try {
                // We reuse CreativeArtifacts store, but we need to parse content JSON to match Ebook structure if we store it as JSON string
                // OR we can store Ebook object directly in dexie if we want, but CreativeArtifact interface has specific fields.
                // Let's assume we store the whole object as content JSON or extend the store.
                // The previous code stored raw objects in 'ebooks' store.
                // Migration: The new 'CreativeArtifactsAPI' uses 'creative_artifacts' table.
                // But wait, the previous code used STORES.EBOOKS = 'ebooks'.
                // If we want to MIGRATE the 'ebooks' store to 'creative_artifacts', we should do it.
                // But for now, let's stick to using 'ebooks' but via a new API access or direct dexie if API doesn't support it directly.
                // 'CreativeArtifactsAPI' returns 'CreativeArtifact[]'.
                // If we want to keep full Ebook features, we should probably add an 'EbooksAPI' or use 'CreativeArtifactsAPI' and serialize.
                // Let's assume for this transition we just define a local helper or access dexie directly for the 'ebooks' store if it still existed,
                // BUT user asked to delete unused DBs. 'ebooks' store was in 'NexusFlowDB'.
                // So we MUST move data to 'PManLocalDB'.
                // 'PManLocalDB' has 'creative_artifacts'.
                // We will map Ebook <-> CreativeArtifact.
                
                const artifacts = await CreativeArtifactsAPI.getAll();
                const loadedEbooks: Ebook[] = artifacts
                    .filter(a => a.type === 'manual' || a.type === 'story') // Assuming 'manual'/'story' map to Ebooks
                    .map(a => {
                        try {
                            const parsed = JSON.parse(a.content);
                            // Merge with artifact metadata
                            return {
                                ...parsed,
                                id: a.id,
                                title: a.title,
                                createdAt: new Date(a.created_at),
                                updatedAt: new Date(a.created_at) // Approximate
                            };
                        } catch (e) {
                            return null;
                        }
                    })
                    .filter((e): e is Ebook => e !== null);

                setEbooks(loadedEbooks);
            } catch (e) {
                console.error('Failed to load ebooks', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadEbooks();
    }, []);

    // Save helper
    const saveEbook = async (ebook: Ebook) => {
         // Map back to CreativeArtifact
         const artifact = {
             id: ebook.id,
             title: ebook.title,
             type: 'manual' as const, // Defaulting to manual
             prompt: '',
             content: JSON.stringify(ebook), // Store full object in content
             created_at: ebook.createdAt.toISOString()
         };
         
         // We use Update if exists, Create if not. 
         // API create generates new ID, so we should check existence.
         // Actually, if we have ID, we can update.
         // But wait, our API update needs string ID.
         await CreativeArtifactsAPI.update(ebook.id, artifact);
    };

    const handleCreateEbook = async () => {
        // Selection: Manual or AI
        const mode = window.prompt("Create Ebook Mode:\n1. Manual\n2. AI Generate (Auto-Structure)", "1");
        if(!mode) return;

        let title = '';
        let author = 'Me';
        let description = 'New Book';
        let structure = null;

        if (mode === '2') {
             const topic = prompt("Enter Topic/Premise for AI Generation:");
             if(!topic) return;
             title = topic; // Placeholder
             description = `AI Generated book about ${topic}`;
             // Mock AI structure generation
             structure = [
                 { id: crypto.randomUUID(), title: 'Chapter 1: The Beginning', content: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: `Introduction to ${topic}...` }], order: 0 },
                 { id: crypto.randomUUID(), title: 'Chapter 2: Deep Dive', content: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: 'Going deeper...' }], order: 1 },
                 { id: crypto.randomUUID(), title: 'Chapter 3: Final Thoughts', content: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: 'Wrapping up...' }], order: 2 },
             ];
        } else {
             title = prompt("Enter Ebook Title:") || "Untitled";
        }

        const newEbookSkeleton: Ebook = {
            id: '', // Placeholder, will be replaced by API
            title,
            author,
            description,
            status: 'Draft',
            copyright: `Copyright © ${new Date().getFullYear()} ${author}. All rights reserved.`,
            acknowledgments: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }],
            disclaimer: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }],
            introduction: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }],
            epilogue: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }],
            conclusion: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }],
            chapters: structure || [
                {
                    id: crypto.randomUUID(),
                    title: 'Chapter 1',
                    content: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: 'Start writing here...' }],
                    order: 0
                }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Create via API
        const createdArtifact = await CreativeArtifactsAPI.create({
            title,
            type: 'manual',
            prompt: '',
            content: JSON.stringify(newEbookSkeleton),
            created_at: newEbookSkeleton.createdAt.toISOString()
        });

        const newEbook: Ebook = { ...newEbookSkeleton, id: createdArtifact.id };

        setEbooks(prev => [...prev, newEbook]);
        setSelectedEbookId(newEbook.id);
        setActiveSection({ type: 'introduction' }); 
    };

    const handleDeleteEbook = async (ebookId: string) => {
        if (window.confirm('Are you sure you want to delete this ebook?')) {
            setEbooks(prev => prev.filter(ebook => ebook.id !== ebookId));
            await CreativeArtifactsAPI.delete(ebookId);
            if (selectedEbookId === ebookId) setSelectedEbookId(null);
        }
    };

    const handleUpdateEbook = (id: string, updates: Partial<Ebook>) => {
        setEbooks(prev => {
            const next = prev.map(e => {
                if(e.id === id) {
                    const updated = { ...e, ...updates, updatedAt: new Date() };
                    saveEbook(updated); // Auto-save
                    return updated;
                }
                return e;
            });
            return next;
        });
    };

    // --- Chapter Management ---
    const handleAddChapter = (ebookId: string) => {
        const ebook = ebooks.find(e => e.id === ebookId);
        if(!ebook) return;
        const newChapter: EbookChapter = {
            id: crypto.randomUUID(),
            title: `Chapter ${ebook.chapters.length + 1}`,
            content: [{ id: crypto.randomUUID(), type: BlockType.PARAGRAPH, content: '' }],
            order: ebook.chapters.length
        };
        handleUpdateEbook(ebookId, { chapters: [...ebook.chapters, newChapter] });
        setActiveSection({ type: 'chapter', id: newChapter.id });
    };

    const handleDeleteChapter = (ebookId: string, chapterId: string) => {
        const ebook = ebooks.find(e => e.id === ebookId);
        if(!ebook) return;
        const newChapters = ebook.chapters.filter(c => c.id !== chapterId);
        handleUpdateEbook(ebookId, { chapters: newChapters });
        if(activeSection?.id === chapterId) setActiveSection(null);
    };

    const updateBlockContent = (ebookId: string, blocks: Block[]) => {
        if (!activeSection) return;
        
        if (activeSection.type === 'chapter' && activeSection.id) {
            const ebook = ebooks.find(e => e.id === ebookId);
            if(!ebook) return;
            const newChapters = ebook.chapters.map(c => c.id === activeSection.id ? { ...c, content: blocks } : c);
            handleUpdateEbook(ebookId, { chapters: newChapters });
        } else {
             // Special Sections
             const field = activeSection.type; // acknowledgments, disclaimer, etc.
             handleUpdateEbook(ebookId, { [field]: blocks });
        }
    };
    
    // --- Image Handling Helpers (Mock) ---
    const handleImageUpload = (ebookId: string, type: 'cover' | 'back') => {
        // In real app: open file picker, upload to storage, get URL.
        const url = prompt("Enter Image URL (or assume upload logic):", "https://via.placeholder.com/300x400");
        if(url) {
            if(type === 'cover') handleUpdateEbook(ebookId, { coverImage: url });
            else handleUpdateEbook(ebookId, { backCoverImage: url });
        }
    };

    const handleAIGenerateImage = (ebookId: string, type: 'cover' | 'back') => {
        // Mock AI Generation
        alert("Generating AI Image... (Mock)");
        const mockUrl = `https://source.unsplash.com/random/300x450?book,${type === 'cover' ? 'cover' : 'back'},abstract&sig=${Date.now()}`;
        if(type === 'cover') handleUpdateEbook(ebookId, { coverImage: mockUrl });
        else handleUpdateEbook(ebookId, { backCoverImage: mockUrl });
    };

    // --- Renderers ---
    
    const getActiveEbook = () => ebooks.find(e => e.id === selectedEbookId);

    const renderStudio = () => {
        const ebook = getActiveEbook();
        if (!ebook) return null;

        // Determine active content
        let activeContent: Block[] = [];
        let activeTitle = "";
        
        if (activeSection) {
            if (activeSection.type === 'chapter') {
                const chap = ebook.chapters.find(c => c.id === activeSection.id);
                if(chap) {
                    activeContent = chap.content;
                    activeTitle = chap.title;
                }
            } else {
                // Special sections
                activeContent = ebook[activeSection.type] as Block[];
                activeTitle = activeSection.type.charAt(0).toUpperCase() + activeSection.type.slice(1);
            }
        }

        return (
            <div className="h-full flex flex-col bg-white">
                {/* Header */}
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedEbookId(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col">
                            <input 
                                value={ebook.title} 
                                onChange={(e) => handleUpdateEbook(ebook.id, { title: e.target.value })}
                                className="font-bold text-gray-900 border-none p-0 focus:ring-0 text-sm h-5"
                                placeholder="Book Title"
                            />
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>by</span>
                                <input 
                                   value={ebook.author} 
                                   onChange={(e) => handleUpdateEbook(ebook.id, { author: e.target.value })}
                                   className="text-xs text-gray-500 border-none p-0 focus:ring-0 h-4 w-32"
                                   placeholder="Author Name"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400 mr-2 border-r border-gray-200 pr-3">
                            {ebook.chapters.length} Chapters • {ebook.status}
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
                            <Download size={14} /> Export
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* SIDEBAR */}
                    <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto">
                        {/* Cover Image Slot */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center justify-between">
                                <span>Cover (Portada)</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleImageUpload(ebook.id, 'cover')} title="Upload" className="p-1 hover:bg-gray-200 rounded"><ImageIcon size={12}/></button>
                                    <button onClick={() => handleAIGenerateImage(ebook.id, 'cover')} title="Generate AI" className="p-1 hover:bg-gray-200 rounded text-purple-600"><Sparkles size={12}/></button>
                                </div>
                            </div>
                            <div className="aspect-[2/3] bg-gray-200 rounded-md border border-gray-300 flex items-center justify-center overflow-hidden relative group">
                                {ebook.coverImage ? (
                                    <img src={ebook.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-xs">No Cover</span>
                                )}
                            </div>
                        </div>

                        {/* Front Matter */}
                        <div className="border-b border-gray-200">
                            <button 
                                onClick={() => setExpandedSections(p => ({...p, frontMatter: !p.frontMatter}))}
                                className="w-full flex items-center justify-between p-3 text-xs font-bold text-gray-500 uppercase bg-gray-100/50 hover:bg-gray-100"
                            >
                                <span>Front Matter</span>
                                {expandedSections.frontMatter ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </button>
                            
                            {expandedSections.frontMatter && (
                                <div className="p-2 space-y-0.5">
                                    {/* Copyright (Special: Text Field) */}
                                    <div className="px-3 py-2 text-sm text-gray-600">
                                        <label className="text-[10px] text-gray-400 block uppercase mb-1">Copyright</label>
                                        <textarea 
                                            value={ebook.copyright}
                                            onChange={e => handleUpdateEbook(ebook.id, { copyright: e.target.value })}
                                            className="w-full text-xs border border-gray-200 rounded p-1.5 focus:border-indigo-300 resize-none bg-white"
                                            rows={2}
                                        />
                                    </div>
                                    {/* Sections */}
                                    {[
                                        { id: 'acknowledgments', label: 'Acknowledgements' },
                                        { id: 'disclaimer', label: 'Disclaimer' },
                                        { id: 'introduction', label: 'Introduction' }
                                    ].map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => setActiveSection({ type: item.id as EditorSection })}
                                            className={`px-3 py-2 rounded-md text-sm cursor-pointer mx-2 ${activeSection?.type === item.id ? 'bg-white shadow-sm text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Chapters */}
                        <div className="border-b border-gray-200">
                             <div className="flex items-center justify-between p-3 bg-gray-100/50 hover:bg-gray-100">
                                <button 
                                    onClick={() => setExpandedSections(p => ({...p, chapters: !p.chapters}))}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase"
                                >
                                    {expandedSections.chapters ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                    <span>Chapters</span>
                                </button>
                                <button onClick={() => handleAddChapter(ebook.id)} className="p-1 hover:bg-gray-200 rounded text-gray-500" title="Add Chapter"><Plus size={14}/></button>
                            </div>
                            
                            {expandedSections.chapters && (
                                <div className="p-2 space-y-0.5">
                                    {ebook.chapters.map((chap, idx) => (
                                        <div 
                                            key={chap.id}
                                            onClick={() => setActiveSection({ type: 'chapter', id: chap.id })}
                                            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer mx-2 group ${activeSection?.type === 'chapter' && activeSection.id === chap.id ? 'bg-white shadow-sm text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            <div className="truncate flex-1">
                                                <span className="opacity-50 text-xs mr-2">{idx + 1}.</span>
                                                {chap.title}
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDeleteChapter(ebook.id, chap.id); }}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Back Matter */}
                         <div className="border-b border-gray-200">
                            <button 
                                onClick={() => setExpandedSections(p => ({...p, backMatter: !p.backMatter}))}
                                className="w-full flex items-center justify-between p-3 text-xs font-bold text-gray-500 uppercase bg-gray-100/50 hover:bg-gray-100"
                            >
                                <span>Back Matter</span>
                                {expandedSections.backMatter ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                            </button>
                            
                            {expandedSections.backMatter && (
                                <div className="p-2 space-y-0.5">
                                     {[
                                        { id: 'epilogue', label: 'Epilogue' },
                                        { id: 'conclusion', label: 'Conclusion' }
                                    ].map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => setActiveSection({ type: item.id as EditorSection })}
                                            className={`px-3 py-2 rounded-md text-sm cursor-pointer mx-2 ${activeSection?.type === item.id ? 'bg-white shadow-sm text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                         {/* Back Cover Image Slot */}
                         <div className="p-4 border-b border-gray-200">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center justify-between">
                                <span>Back Cover (Contraportada)</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleImageUpload(ebook.id, 'back')} title="Upload" className="p-1 hover:bg-gray-200 rounded"><ImageIcon size={12}/></button>
                                    <button onClick={() => handleAIGenerateImage(ebook.id, 'back')} title="Generate AI" className="p-1 hover:bg-gray-200 rounded text-purple-600"><Sparkles size={12}/></button>
                                </div>
                            </div>
                            <div className="aspect-[2/3] bg-gray-200 rounded-md border border-gray-300 flex items-center justify-center overflow-hidden relative group">
                                {ebook.backCoverImage ? (
                                    <img src={ebook.backCoverImage} alt="Back Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-400 text-xs">No Back Cover</span>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* MAIN EDITOR */}
                    <div className="flex-1 flex flex-col bg-white relative">
                        {activeSection ? (
                            <>
                                <div className="p-8 pb-0 max-w-3xl mx-auto w-full">
                                    {/* Editable Title for Chapters Only, Static for Sections? */}
                                    {activeSection.type === 'chapter' ? (
                                        <input 
                                            value={activeTitle}
                                            onChange={(e) => {
                                                const newChapters = ebook.chapters.map(c => c.id === activeSection.id ? { ...c, title: e.target.value } : c);
                                                handleUpdateEbook(ebook.id, { chapters: newChapters });
                                            }}
                                            className="text-3xl font-bold text-gray-900 border-none focus:ring-0 p-0 w-full placeholder-gray-300 mb-4"
                                            placeholder="Section Title"
                                        />
                                    ) : (
                                        <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">{activeTitle}</h2>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto px-8 pb-20">
                                    <div className="max-w-3xl mx-auto">
                                        <BlockEditor 
                                            blocks={activeContent} 
                                            onChange={(blocks) => updateBlockContent(ebook.id, blocks)}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <FileText size={48} className="mb-4 text-gray-200" />
                                <p>Select a section from the sidebar to edit.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if(selectedEbookId) return renderStudio();

    return (
        <div className="h-full flex flex-col bg-gray-50/50">
            {/* Main List View (Gallery) same as before... */}
             <div className="border-b border-gray-200 p-6 bg-white shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Book className="text-indigo-600" size={28} />
                        Gestor de eBooks
                        </h1>
                        <p className="text-gray-500 mt-1">Write, organize and publish your digital books</p>
                    </div>
                    
                    <button
                        onClick={() => handleCreateEbook()}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Crear eBook
                    </button>
                </div>
            </div>
             <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search eBooks..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                </div>
            </div>
            
             <div className="flex-1 overflow-y-auto p-6">
                 {ebooks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                        <Book size={48} className="mb-4 text-gray-200" />
                        <h3 className="text-lg font-medium text-gray-500 mb-2">Library is empty</h3>
                        <p className="text-gray-400 max-w-sm text-center mb-6 text-sm">
                        Start writing your next bestseller. Create a new ebook to begin.
                        </p>
                        <button onClick={handleCreateEbook} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                            <Plus size={18} /> Create your first eBook
                        </button>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {ebooks.filter(e => e.title.includes(searchTerm)).map(ebook => (
                             <div 
                                key={ebook.id}
                                onClick={() => { setSelectedEbookId(ebook.id); setActiveSection({type: 'introduction'}); }}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:border-indigo-300 hover:shadow-md cursor-pointer group"
                                >
                                <div className="h-40 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center relative border-b border-gray-100 overflow-hidden">
                                    {ebook.coverImage ? (
                                        <img src={ebook.coverImage} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" alt="Cover" />
                                    ) : (
                                        <Book size={48} className="text-indigo-200 group-hover:scale-110 transition-transform duration-300" />
                                    )}
                                    <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ebook.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ebook.status}</span>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{ebook.title}</h3>
                                    <p className="text-gray-500 text-xs mb-3">by {ebook.author}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50 mt-auto">
                                        <span className="flex items-center gap-1"><Layers size={12}/> {ebook.chapters.length} Ch</span>
                                        <span>{new Date(ebook.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        </div>
    );
}

export default EbookManager;