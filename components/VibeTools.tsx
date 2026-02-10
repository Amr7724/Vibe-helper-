
import React, { useState, useEffect } from 'react';
import { Lightbulb, GitMerge, Clipboard, Play, ExternalLink, Link as LinkIcon, FileText, Code, Video, List, CheckCircle, Circle, ArrowRight, Trash2, Copy, Sparkles, Filter, ChevronDown, GripVertical, Paperclip, Plus, Maximize2, X, Edit3, Save, Check } from 'lucide-react';
import { Button } from './Button';
import { ClipboardItem, IdeaSession, PlanNode, SavedPrompt } from '../types';
import { analyzeClipboardContent, analyzeIdeaImpact } from '../services/geminiService';

// --- Clipboard Tool ---
export const SmartClipboard: React.FC<{
  items: ClipboardItem[];
  savedPrompts: SavedPrompt[];
  planNodes?: PlanNode[];
  onAddItem: (item: ClipboardItem) => void;
  onUpdateItem?: (id: string, updates: Partial<ClipboardItem>) => void;
  onDeleteItem?: (id: string) => void;
  onUpdatePrompt?: (id: string, updates: Partial<SavedPrompt>) => void;
}> = ({ items, savedPrompts, planNodes = [], onAddItem, onUpdateItem, onDeleteItem, onUpdatePrompt }) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'incoming' | 'prompts'>('incoming');
  const [filterCategory, setFilterCategory] = useState<'all' | 'backend' | 'frontend' | 'design'>('all');
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    const result = await analyzeClipboardContent(inputText);
    if (result) {
      onAddItem(result);
      setInputText('');
    }
    setIsAnalyzing(false);
  };

  const getIconForType = (type: string) => {
    if (type.includes('video')) return <Video className="w-4 h-4 text-pink-400" />;
    if (type.includes('article')) return <FileText className="w-4 h-4 text-blue-400" />;
    if (type.includes('tool')) return <Code className="w-4 h-4 text-purple-400" />;
    if (type.includes('idea')) return <Lightbulb className="w-4 h-4 text-yellow-400" />;
    return <Clipboard className="w-4 h-4 text-slate-400" />;
  };

  const handleDragStart = (e: React.DragEvent, type: 'clipboard' | 'prompt', id: string) => {
    e.dataTransfer.setData('application/vibecode-id', id);
    e.dataTransfer.setData('application/vibecode-type', type);
    e.dataTransfer.effectAllowed = 'link';
  };

  const openItem = (item: ClipboardItem) => {
      setSelectedItem(item);
      setEditContent(item.content);
  };

  const closeItem = () => {
      setSelectedItem(null);
      setEditContent('');
      setIsCopied(false);
  };

  const handleSaveEdit = () => {
      if (selectedItem && onUpdateItem) {
          onUpdateItem(selectedItem.id, { content: editContent });
          // Update local selected item to reflect changes immediately in UI
          setSelectedItem({ ...selectedItem, content: editContent });
      }
  };

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  const getAllPlanNodes = (nodes: PlanNode[]): {id: string, title: string}[] => {
    let result: {id: string, title: string}[] = [];
    nodes.forEach(node => {
      result.push({id: node.id, title: node.title});
      if (node.children) result = [...result, ...getAllPlanNodes(node.children)];
    });
    return result;
  };
  const flatPlan = getAllPlanNodes(planNodes);

  const filteredPrompts = savedPrompts.filter(p => 
    filterCategory === 'all' ? true : p.category === filterCategory
  );

  return (
    <div className="h-full flex flex-col bg-transparent relative">
      {/* Tabs */}
      <div className="p-4 flex gap-4 border-b border-white/5 bg-[#000205]/40 backdrop-blur-md sticky top-0 z-10">
         <button 
            onClick={() => setActiveTab('incoming')} 
            className={`flex-1 py-3 rounded-[20px] text-sm font-bold transition-all ${activeTab === 'incoming' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
         >
           الوارد (Analysis)
         </button>
         <button 
            onClick={() => setActiveTab('prompts')} 
            className={`flex-1 py-3 rounded-[20px] text-sm font-bold transition-all ${activeTab === 'prompts' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
         >
           البرومبتس (Saved)
         </button>
      </div>

      {activeTab === 'incoming' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Input Box */}
          <div className="bg-[#151515] border border-white/5 rounded-[30px] p-4 mb-6 shadow-xl flex-shrink-0">
            <textarea
              className="w-full bg-transparent border-none text-white placeholder-white/20 focus:ring-0 resize-none h-20 text-sm custom-scrollbar"
              placeholder="الصق نصاً أو رابطاً هنا..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
               <span className="text-[10px] text-white/30 uppercase tracking-widest">AI Analyzer</span>
               <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing} className="!rounded-full" icon={isAnalyzing ? <Sparkles className="animate-spin w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}>
                 {isAnalyzing ? 'Analyzing...' : 'Add'}
               </Button>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pb-24">
            {items.map(item => (
              <div 
                key={item.id} 
                className="bg-[#1E1E1E]/50 border border-white/5 rounded-[25px] p-4 hover:bg-white/5 transition-all group relative cursor-pointer active:scale-[0.99]"
                draggable
                onDragStart={(e) => handleDragStart(e, 'clipboard', item.id)}
                onClick={() => openItem(item)}
              >
                {item.linkedPlanNodeId && (
                  <div className="absolute top-4 left-4 text-green-400 bg-green-500/10 p-1.5 rounded-full">
                    <LinkIcon className="w-3 h-3" />
                  </div>
                )}
                
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-[15px] bg-[#000000] border border-white/5">{getIconForType(item.type)}</span>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                item.pipelineStage === 'backend' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                item.pipelineStage === 'frontend' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                'bg-white/10 text-white/60 border-white/10'
                            }`}>
                                {item.pipelineStage || 'General'}
                            </span>
                            <span className="text-[10px] text-white/30">{item.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm line-clamp-1">{item.summary}</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleCopy(item.content)}
                        className="p-2 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                        title="Copy content"
                      >
                         <Copy className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-full hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                         <Maximize2 className="w-4 h-4" />
                      </button>
                  </div>
                </div>
                
                {/* Content Preview */}
                <div className="pl-[52px]">
                   <p className="text-xs text-white/50 line-clamp-2 leading-relaxed bg-black/20 p-2 rounded-lg font-mono border border-white/5">
                      {item.content}
                   </p>
                   {item.metadata?.url && (
                    <a href={item.metadata.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/10">
                        <ExternalLink className="w-3 h-3" /> {new URL(item.metadata.url).hostname}
                    </a>
                   )}
                </div>
              </div>
            ))}
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                    <Clipboard className="w-12 h-12 mb-4 opacity-20" />
                    <p>الحافظة فارغة</p>
                </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden p-4">
          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            <Filter className="w-4 h-4 text-white/30 flex-shrink-0" />
            {(['all', 'backend', 'frontend', 'design'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  filterCategory === cat 
                    ? 'bg-white text-black' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-20">
            {filteredPrompts.map(prompt => (
              <div 
                key={prompt.id} 
                className={`
                    rounded-[30px] p-5 flex flex-col gap-3 cursor-grab active:cursor-grabbing relative border border-white/5
                    ${prompt.category === 'backend' ? 'bg-gradient-to-br from-blue-900/20 to-blue-900/5' : 
                      prompt.category === 'frontend' ? 'bg-gradient-to-br from-pink-900/20 to-pink-900/5' :
                      prompt.category === 'design' ? 'bg-gradient-to-br from-purple-900/20 to-purple-900/5' :
                      'bg-gradient-to-br from-slate-900/20 to-slate-900/5'}
                `}
                draggable
                onDragStart={(e) => handleDragStart(e, 'prompt', prompt.id)}
              >
                 <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                     <span className={`w-2 h-8 rounded-full ${
                        prompt.category === 'backend' ? 'bg-blue-500' : 
                        prompt.category === 'frontend' ? 'bg-pink-500' :
                        prompt.category === 'design' ? 'bg-purple-500' : 'bg-slate-500'
                     }`}></span>
                     <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{prompt.category}</span>
                        <div className="text-[10px] text-white/30">{prompt.createdAt.toLocaleDateString()}</div>
                     </div>
                   </div>
                   <Button variant="ghost" size="sm" className="!p-2 rounded-full bg-white/5 hover:bg-white/10" onClick={() => navigator.clipboard.writeText(prompt.content)}>
                     <Copy className="w-4 h-4" />
                   </Button>
                 </div>
                 
                 <div className="bg-black/30 p-4 rounded-[20px] font-mono text-xs text-white/70 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar border border-white/5">
                   {prompt.content}
                 </div>

                 <div className="flex items-center gap-2 pt-2">
                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                        <LinkIcon className="w-3 h-3 text-white/30" />
                    </div>
                    <select 
                      className="bg-transparent border-none text-[11px] text-white/50 focus:ring-0 flex-1 p-0 cursor-pointer hover:text-white transition-colors"
                      value={prompt.planPhaseId || ''}
                      onChange={(e) => onUpdatePrompt?.(prompt.id, { planPhaseId: e.target.value })}
                    >
                      <option value="" className="bg-black">Link to plan phase...</option>
                      {flatPlan.map(node => (
                        <option key={node.id} value={node.id} className="bg-slate-900">{node.title}</option>
                      ))}
                    </select>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {selectedItem && (
         <div className="absolute inset-0 z-50 bg-[#050505]/95 backdrop-blur-md flex flex-col animate-in fade-in slide-in-from-bottom-10">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0A0A0A]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-[15px] border border-white/10">
                        {getIconForType(selectedItem.type)}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{selectedItem.summary}</h3>
                        <div className="flex items-center gap-2 mt-1">
                             <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                selectedItem.pipelineStage === 'backend' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                selectedItem.pipelineStage === 'frontend' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                'bg-white/10 text-white/60 border-white/10'
                            }`}>
                                {selectedItem.pipelineStage || 'General'}
                            </span>
                            <span className="text-[10px] text-white/30">{selectedItem.relevance} Relevance</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant={isCopied ? "primary" : "secondary"} 
                        onClick={() => handleCopy(editContent)}
                        className="!rounded-full"
                        icon={isCopied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                    >
                        {isCopied ? 'Copied' : 'Copy'}
                    </Button>
                    <button onClick={closeItem} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                <div className="flex-1 bg-[#101010] rounded-[25px] border border-white/5 p-1 relative overflow-hidden flex flex-col shadow-inner">
                    <div className="absolute top-0 right-0 p-2 z-10 flex gap-1">
                        <button 
                            className="p-2 bg-black/40 text-white/50 hover:text-white rounded-lg backdrop-blur-sm transition-colors border border-white/5"
                            onClick={handleSaveEdit}
                            title="Save Changes"
                        >
                           <Save className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea 
                        className="flex-1 w-full bg-transparent border-none text-white/80 p-6 font-mono text-sm leading-relaxed resize-none focus:ring-0 custom-scrollbar"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        spellCheck={false}
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-0 flex justify-between items-center">
                 <div className="text-xs text-white/30">
                    ID: {selectedItem.id}
                 </div>
                 {onDeleteItem && (
                    <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => { onDeleteItem(selectedItem.id); closeItem(); }}
                        icon={<Trash2 className="w-4 h-4" />}
                        className="!rounded-full !bg-red-500/5 hover:!bg-red-500/10 !border-red-500/10"
                    >
                        Delete Item
                    </Button>
                 )}
            </div>
         </div>
      )}
    </div>
  );
};

// --- Ideas Tool ---
export const IdeasLab: React.FC<{ knowledgeBase?: string }> = ({ knowledgeBase = '' }) => {
  const [idea, setIdea] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!idea) return;
    setLoading(true);
    const res = await analyzeIdeaImpact(idea, "Current Project Context Placeholder", knowledgeBase);
    setAnalysis(res);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Ideas Lab</h2>
        <p className="text-white/40 text-sm">Validate your features before implementing them.</p>
      </div>

      <div className="bg-[#151515] border border-white/5 rounded-[35px] p-6 mb-8 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lightbulb className="w-24 h-24 text-yellow-500" />
        </div>
        <textarea
          className="w-full bg-transparent border-none text-white placeholder-white/20 focus:ring-0 resize-none h-40 text-lg leading-relaxed relative z-10"
          placeholder="What's your new idea?"
          value={idea}
          onChange={e => setIdea(e.target.value)}
        />
        <div className="flex justify-end pt-4 border-t border-white/5 relative z-10">
          <Button onClick={handleCheck} disabled={loading} className="!rounded-full !px-6" icon={loading ? <Sparkles className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4" />}>
            Analyze Impact
          </Button>
        </div>
      </div>

      {analysis && (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-[35px] p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
             <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400"><Sparkles className="w-5 h-5"/></span>
             AI Report
          </h3>
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-line leading-loose text-white/80">
            {analysis}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Plan Tool ---
const PlanNodeView: React.FC<{ 
  node: PlanNode; 
  depth?: number; 
  onLinkItem?: (nodeId: string, itemId: string, type: 'clipboard' | 'prompt') => void 
}> = ({ node, depth = 0, onLinkItem }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const id = e.dataTransfer.getData('application/vibecode-id');
    const type = e.dataTransfer.getData('application/vibecode-type') as 'clipboard' | 'prompt';
    if (id && type && onLinkItem) {
      onLinkItem(node.id, id, type);
    }
  };

  return (
    <div className="mb-4 relative">
       {/* Connecting Line */}
       {depth > 0 && (
         <div className="absolute top-8 -left-4 w-4 h-[2px] bg-white/10"></div>
       )}
       {/* Vertical Line for children */}
       {node.children && node.children.length > 0 && (
         <div className="absolute top-12 left-6 bottom-0 w-[2px] bg-white/5 z-0"></div>
       )}

      <div 
        className={`
          relative z-10 p-5 rounded-[25px] transition-all border group
          ${isDragOver 
            ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20' 
            : 'bg-[#151515] border-white/5 hover:bg-[#1A1A1A] hover:border-white/10'}
        `}
        style={{ marginLeft: `${depth * 24}px` }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-start gap-4">
            <div className={`
              w-12 h-12 rounded-[18px] flex items-center justify-center flex-shrink-0 shadow-lg
              ${node.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                node.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                'bg-white/5 text-white/30 border border-white/5'}
            `}>
                {node.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : 
                 node.status === 'in_progress' ? <Sparkles className="w-6 h-6 animate-pulse" /> : 
                 <Circle className="w-6 h-6" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-base font-bold truncate ${node.status === 'completed' ? 'text-white/40 line-through' : 'text-white'}`}>{node.title}</h4>
                    <span className="text-[10px] uppercase tracking-wider text-white/20 border border-white/5 px-2 py-1 rounded-full">{node.type}</span>
                </div>
                <p className="text-xs text-white/50 mb-3">{node.description}</p>
                
                {node.linkedItems && node.linkedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {node.linkedItems.map((item, idx) => (
                            <span key={idx} className="flex items-center gap-1 text-[10px] bg-white/5 text-white/60 px-2 py-1 rounded-full border border-white/5">
                                <Paperclip className="w-3 h-3" /> Linked Item
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
        
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 rounded-[25px] backdrop-blur-sm z-20">
            <span className="text-white font-bold flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-full shadow-xl">
              <LinkIcon className="w-4 h-4" /> Link to this phase
            </span>
          </div>
        )}
      </div>

      {node.children && (
        <div className="mt-2">
          {node.children.map(child => (
            <PlanNodeView key={child.id} node={child} depth={depth + 1} onLinkItem={onLinkItem} />
          ))}
        </div>
      )}
    </div>
  );
};

export const PlanViewer: React.FC<{ 
  planNodes: PlanNode[]; 
  onLinkItem?: (nodeId: string, itemId: string, type: 'clipboard' | 'prompt') => void;
}> = ({ planNodes, onLinkItem }) => {
  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Project Roadmap</h2>
          <p className="text-white/40 text-sm">Track progress and link resources.</p>
        </div>
        <Button size="sm" variant="secondary" className="!rounded-full" icon={<Plus className="w-4 h-4" />}>Update</Button>
      </div>

      <div className="pb-20">
        {planNodes.length > 0 ? (
          planNodes.map(node => <PlanNodeView key={node.id} node={node} onLinkItem={onLinkItem} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[40px] bg-white/5 hover:bg-white/10 transition-colors">
            <GitMerge className="w-16 h-16 text-white/10 mb-4" />
            <p className="text-white/40">No plan generated yet.</p>
            <Button variant="ghost" className="mt-4 text-blue-400">Ask AI to generate one</Button>
          </div>
        )}
      </div>
    </div>
  );
};
