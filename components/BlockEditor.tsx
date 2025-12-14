import React, { useState, useRef, useEffect } from 'react';
import { Block, BlockType } from '../types';
import { GripVertical, Plus, Type, CheckSquare, Trash2, Wand2, Bold, Italic, Underline, MoreHorizontal, Copy, Check, Strikethrough } from 'lucide-react';
import { polishText } from '../services/geminiService';

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  readOnly?: boolean;
}

// Helper to execute rich text commands
const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ blocks, onChange, readOnly = false }) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [copied, setCopied] = useState(false);
  
      const editorRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Handle Selection for Floating Toolbar
  useEffect(() => {
    const handleSelection = () => {
        if (readOnly) return;
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setShowToolbar(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Only show if selection is inside our editor
        const editorContainer = document.getElementById('block-editor-container');
        if (editorContainer && editorContainer.contains(selection.anchorNode)) {
            setToolbarPosition({
                top: rect.top - 40, // Position above text
                left: rect.left + (rect.width / 2) - 75 // Center horizontally
            });
            setShowToolbar(true);
        } else {
            setShowToolbar(false);
        }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [readOnly]);

  const updateBlock = (id: string, updates: Partial<Block>) => {
    // Sanitize content to prevent XSS and handle special characters
    if (updates.content !== undefined) {
      // Basic sanitization - escape HTML entities that could cause issues
      let sanitizedContent = updates.content;
      
      // Handle contentEditable quirks
      if (sanitizedContent === '<br>' || sanitizedContent === '<br/>') {
        sanitizedContent = '';
      }
      
      // Remove any script tags for security
      sanitizedContent = sanitizedContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // Update with sanitized content
      const sanitizedUpdates = { ...updates, content: sanitizedContent };
      const newBlocks = blocks.map((b) => (b.id === id ? { ...b, ...sanitizedUpdates } : b));
      onChange(newBlocks);
    } else {
      const newBlocks = blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
      onChange(newBlocks);
    }
  };

  const addBlock = (afterId: string, type: BlockType = BlockType.PARAGRAPH) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      content: '',
      checked: false,
    };
    const index = blocks.findIndex((b) => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    
    // Focus next tick
    setTimeout(() => {
        setActiveBlockId(newBlock.id);
        const el = editorRefs.current[newBlock.id];
        if (el) {
            el.focus();
        }
    }, 0);
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return; // Don't remove last block
    const index = blocks.findIndex(b => b.id === id);
    const prevBlock = blocks[index - 1];
    
    const newBlocks = blocks.filter((b) => b.id !== id);
    onChange(newBlocks);

    if (prevBlock) {
        setTimeout(() => {
            setActiveBlockId(prevBlock.id);
            const el = editorRefs.current[prevBlock.id];
            if (el) {
                el.focus();
                // Move cursor to end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // 1. Capture current content from DOM to ensure it's saved
      const currentContent = editorRefs.current[block.id]?.innerHTML || '';
      
      // 2. Create the new block
      const newBlock: Block = {
          id: crypto.randomUUID(),
          type: BlockType.PARAGRAPH,
          content: '',
          checked: false,
      };

      // 3. Construct new state with BOTH updates (save current + add new)
      // This prevents stale state from one overwriting the other
      const index = blocks.findIndex((b) => b.id === block.id);
      const newBlocks = [...blocks];
      newBlocks[index] = { ...newBlocks[index], content: currentContent }; // Save current
      newBlocks.splice(index + 1, 0, newBlock); // Add new
      
      onChange(newBlocks);

      // 4. Focus new block
      setTimeout(() => {
          setActiveBlockId(newBlock.id);
          editorRefs.current[newBlock.id]?.focus();
      }, 0);
      
    } else if (e.key === 'Backspace' && !block.content) {
      e.preventDefault();
      removeBlock(block.id);
    } else if (e.key === 'ArrowUp') {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx > 0) {
            e.preventDefault();
            const prevId = blocks[idx - 1].id;
            setActiveBlockId(prevId);
            editorRefs.current[prevId]?.focus();
        }
    } else if (e.key === 'ArrowDown') {
        const idx = blocks.findIndex(b => b.id === block.id);
        if (idx < blocks.length - 1) {
            e.preventDefault();
            const nextId = blocks[idx + 1].id;
            setActiveBlockId(nextId);
            editorRefs.current[nextId]?.focus();
        }
    }
    
    // Markdown Shortcuts
    if (e.key === ' ') {
        const text = e.currentTarget.textContent || '';
        
        // Block Type Shortcuts
        if (text === '#' && block.type !== BlockType.HEADING_1) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.HEADING_1, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        } else if (text === '##' && block.type !== BlockType.HEADING_2) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.HEADING_2, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        } else if (text === '[]' && block.type !== BlockType.TODO) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.TODO, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        } else if (text === '-' && block.type !== BlockType.BULLET) {
             e.preventDefault();
             updateBlock(block.id, { type: BlockType.BULLET, content: '' });
             editorRefs.current[block.id]!.innerHTML = ''; 
             return;
        }

        // Inline Formatting Shortcuts
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.anchorNode?.nodeType === Node.TEXT_NODE) {
            const anchorNode = selection.anchorNode;
            const offset = selection.anchorOffset;
            const textContent = anchorNode.textContent || '';
            const textBefore = textContent.slice(0, offset);

            // Strikethrough (~text~)
            const strikeMatch = textBefore.match(/~(.+?)~$/);
            // Bold (**text**)
            const boldMatch = textBefore.match(/\*\*(.+?)\*\*$/);
            // Italic (*text*)
            const italicMatch = textBefore.match(/\*(.+?)\*$/);

            let match = null;
            let html = '';

            if (strikeMatch) {
                match = strikeMatch;
                html = `<span class="line-through">${match[1]}</span>&nbsp;`;
            } else if (boldMatch) {
                 match = boldMatch;
                 html = `<span class="font-bold">${match[1]}</span>&nbsp;`;
            } else if (italicMatch) {
                 match = italicMatch;
                 html = `<span class="italic">${match[1]}</span>&nbsp;`;
            }

            if (match) {
                e.preventDefault();
                const fullMatchText = match[0];
                const startOffset = offset - fullMatchText.length;
                
                const range = document.createRange();
                range.setStart(anchorNode, startOffset);
                range.setEnd(anchorNode, offset);
                selection.removeAllRanges();
                selection.addRange(range);
                
                document.execCommand('insertHTML', false, html);
            }
        }
    }
  };

  const handleAIImprove = async (block: Block) => {
      if(!block.content) return;
      // Remove HTML tags for AI processing for now, or assume AI handles simple HTML
      const plainText = block.content.replace(/<[^>]*>?/gm, ''); 
      const polished = await polishText(plainText);
      updateBlock(block.id, { content: polished });
      if(editorRefs.current[block.id]) {
          editorRefs.current[block.id]!.innerHTML = polished;
      }
  }

  const handleCopyPage = () => {
      const allText = blocks.map(b => {
          if(b.type === BlockType.TODO) return `[${b.checked ? 'x' : ' '}] ${b.content}`;
          if(b.type === BlockType.BULLET) return `- ${b.content}`;
          if(b.type === BlockType.HEADING_1) return `# ${b.content}`;
          if(b.type === BlockType.HEADING_2) return `## ${b.content}`;
          return b.content;
      }).join('\n\n');

      navigator.clipboard.writeText(allText).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      });
  };

  // Render a single block based on its type
  const renderBlock = (block: Block) => {
    const isActive = activeBlockId === block.id;
    
    switch (block.type) {
      case BlockType.HEADING_1:
        return (
          <div 
            ref={(el) => { if (el) editorRefs.current[block.id] = el; }}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            className={`text-2xl font-bold outline-none py-2 px-2 rounded ${isActive ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'} ${readOnly ? '' : 'cursor-text'}`}
            onBlur={(e) => {
              // Clean up content before saving
              let content = e.currentTarget.innerHTML;
              // Handle empty content
              if (content === '<br>' || content === '<br/>') {
                content = '';
              }
              updateBlock(block.id, { content });
            }}
            onKeyDown={(e) => handleKeyDown(e, block)}
            onFocus={() => setActiveBlockId(block.id)}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
        
      case BlockType.HEADING_2:
        return (
          <div 
            ref={(el) => { if (el) editorRefs.current[block.id] = el; }}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            className={`text-xl font-bold outline-none py-2 px-2 rounded ${isActive ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'} ${readOnly ? '' : 'cursor-text'}`}
            onBlur={(e) => {
              // Clean up content before saving
              let content = e.currentTarget.innerHTML;
              // Handle empty content
              if (content === '<br>' || content === '<br/>') {
                content = '';
              }
              updateBlock(block.id, { content });
            }}
            onKeyDown={(e) => handleKeyDown(e, block)}
            onFocus={() => setActiveBlockId(block.id)}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
        
      case BlockType.TODO:
        return (
          <div className="flex items-start gap-3 group">
            <input
              type="checkbox"
              checked={block.checked}
              onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
              className="mt-1.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div 
              ref={(el) => { if (el) editorRefs.current[block.id] = el; }}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              className={`flex-1 outline-none py-1 px-2 rounded min-h-[32px] ${block.checked ? 'line-through text-gray-400' : ''} ${isActive ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'} ${readOnly ? '' : 'cursor-text'}`}
              onBlur={(e) => {
                // Clean up content before saving
                let content = e.currentTarget.innerHTML;
                // Handle empty content
                if (content === '<br>' || content === '<br/>') {
                  content = '';
                }
                updateBlock(block.id, { content });
              }}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onFocus={() => setActiveBlockId(block.id)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
        
      case BlockType.BULLET:
        return (
          <div className="flex items-start gap-3 group">
            <div className="mt-2 w-2 h-2 rounded-full bg-gray-400"></div>
            <div 
              ref={(el) => { if (el) editorRefs.current[block.id] = el; }}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              className={`flex-1 outline-none py-1 px-2 rounded min-h-[32px] ${isActive ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'} ${readOnly ? '' : 'cursor-text'}`}
              onBlur={(e) => {
                // Clean up content before saving
                let content = e.currentTarget.innerHTML;
                // Handle empty content
                if (content === '<br>' || content === '<br/>') {
                  content = '';
                }
                updateBlock(block.id, { content });
              }}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onFocus={() => setActiveBlockId(block.id)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
        
      case BlockType.CODE:
        return (
          <div className="group relative">
            <pre 
              ref={(el) => { if (el) editorRefs.current[block.id] = el; }}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              className={`font-mono text-sm bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto outline-none ${isActive ? 'ring-2 ring-blue-200' : 'hover:bg-gray-800'} ${readOnly ? '' : 'cursor-text'}`}
              onBlur={(e) => {
                // Clean up content before saving
                let content = e.currentTarget.innerHTML;
                // Handle empty content
                if (content === '<br>' || content === '<br/>') {
                  content = '';
                }
                updateBlock(block.id, { content });
              }}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onFocus={() => setActiveBlockId(block.id)}
              dangerouslySetInnerHTML={{ __html: block.content }}
            />
          </div>
        );
        
      default: // PARAGRAPH
        return (
          <div 
            ref={(el) => { if (el) editorRefs.current[block.id] = el; }}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            className={`outline-none py-1 px-2 rounded min-h-[32px] ${isActive ? 'bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'} ${readOnly ? '' : 'cursor-text'}`}
            onBlur={(e) => {
              // Clean up content before saving
              let content = e.currentTarget.innerHTML;
              // Handle empty content
              if (content === '<br>' || content === '<br/>') {
                content = '';
              }
              updateBlock(block.id, { content });
            }}
            onKeyDown={(e) => handleKeyDown(e, block)}
            onFocus={() => setActiveBlockId(block.id)}
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        );
    }
  };

  return (
    <div className="w-full space-y-1 pb-20 relative" id="block-editor-container">
      
      {/* Floating Toolbar */}
      {showToolbar && (
          <div 
            className="fixed z-50 bg-gray-800 text-white rounded-md shadow-xl flex items-center p-1 gap-1 animate-[fadeIn_0.1s_ease-out]"
            style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
            onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
          >
              <button onClick={() => execFormat('bold')} className="p-1.5 hover:bg-gray-700 rounded transition-all duration-200 hover:border-gray-600 border border-transparent"><Bold size={14}/></button>
              <button onClick={() => execFormat('italic')} className="p-1.5 hover:bg-gray-700 rounded transition-all duration-200 hover:border-gray-600 border border-transparent"><Italic size={14}/></button>
              <button onClick={() => execFormat('underline')} className="p-1.5 hover:bg-gray-700 rounded transition-all duration-200 hover:border-gray-600 border border-transparent"><Underline size={14}/></button>
              <button onClick={() => execFormat('strikeThrough')} className="p-1.5 hover:bg-gray-700 rounded transition-all duration-200 hover:border-gray-600 border border-transparent"><Strikethrough size={14}/></button>
          </div>
      )}

      {/* Editor Header Actions */}
      <div className="absolute top-[-40px] right-0 flex gap-2">
         <button 
            onClick={handleCopyPage} 
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
         >
            {copied ? <Check size={14} className="text-green-600"/> : <Copy size={14} />}
            {copied ? <span className="text-green-600">Copied!</span> : "Copy Page"}
         </button>
      </div>
      
      {blocks.map((block) => (
        <div key={block.id} className="group relative flex items-start gap-2">
          {!readOnly && (
            <>
              <button 
                onClick={() => addBlock(block.id)}
                className="absolute left-[-30px] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:border-gray-200 border border-transparent p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <Plus size={16} />
              </button>
              
              <button 
                onClick={() => removeBlock(block.id)}
                className="absolute left-[-60px] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:border-gray-200 border border-transparent p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded"
              >
                <Trash2 size={16} />
              </button>
              
              <button 
                onClick={() => handleAIImprove(block)}
                className="absolute right-[-30px] opacity-0 group-hover:opacity-100 transition-all duration-200 hover:border-gray-200 border border-transparent p-1 text-gray-400 hover:text-purple-500 hover:bg-gray-100 rounded"
              >
                <Wand2 size={16} />
              </button>
            </>
          )}
          
          {renderBlock(block)}
        </div>
      ))}
    </div>
  );
};