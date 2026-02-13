
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Zap, Sidebar, ArrowRight, CheckCircle, Circle, X, FileText, ClipboardCheck, Trash2 } from 'lucide-react';
import { ChatMessage, PlanNode, ClipboardItem, FileNode } from '../types';
import { Button } from './Button';

interface VibeCodingViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  planNodes: PlanNode[];
  clipboardItems: ClipboardItem[];
  activeFile: FileNode | null;
  onSyncContext?: () => void;
  isSyncing?: boolean;
}

export const VibeCodingView: React.FC<VibeCodingViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  planNodes,
  clipboardItems,
  activeFile,
  onSyncContext,
  isSyncing
}) => {
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [contextMode, setContextMode] = useState<'plan' | 'clip'>('plan');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeContextId, setActiveContextId] = useState<string | null>(null);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setShowSidebar(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
      setActiveContextId(null);
    }
  };

  const injectContext = (text: string, id: string) => {
    setInput(prev => prev + (prev ? '\n' : '') + `Context: ${text} `);
    setActiveContextId(id);
    if (window.innerWidth < 768) {
        setShowSidebar(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#02040a]">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[150px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[20%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Vibe Header */}
      <div className="z-20 flex items-center justify-between p-4 md:p-6 pb-2 border-b border-white/5 bg-black/40 backdrop-blur-xl">
         <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-white/10">
               <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div>
               <h2 className="text-lg md:text-2xl font-black text-white tracking-tight uppercase">Vibe Coding</h2>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-[10px] md:text-xs text-white/40 font-mono tracking-widest uppercase">
                    {activeFile ? `Target: ${activeFile.name}` : 'Flow State Active'}
                  </p>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-3">
            <Button 
                variant="glass" 
                size="sm" 
                onClick={onSyncContext} 
                disabled={isSyncing}
                className={`!rounded-full border-blue-500/20 group hover:border-blue-500/50 transition-all ${isSyncing ? 'animate-pulse' : ''}`}
                icon={<FileText className={`w-4 h-4 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />}
            >
               <span className="hidden sm:inline">استخراج المشروع</span>
            </Button>
            
            <button 
               onClick={() => setShowSidebar(!showSidebar)}
               className={`p-2.5 rounded-2xl transition-all border border-white/5 ${showSidebar ? 'bg-white/10 text-white border-white/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
               <Sidebar className="w-5 h-5" />
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden z-10 relative">
        <div className="flex-1 flex flex-col relative max-w-4xl mx-auto w-full">
           <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar scroll-smooth pb-40">
              {messages.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-6 text-center px-10">
                    <div className="w-20 h-20 rounded-[30px] bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                        <Sparkles className="w-10 h-10 opacity-30" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Ready for the Vibe?</h3>
                        <p className="text-base font-light max-w-sm mx-auto">ارفع الملفات، استخرج النصوص، ودع الذكاء الاصطناعي يبني مشروعك بلمسة واحدة.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-widest">Analyze</div>
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-widest">Extract</div>
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-widest">Build</div>
                    </div>
                 </div>
              )}
              
              {messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div 
                       className={`
                          max-w-[85%] md:max-w-[80%] p-5 md:p-7 rounded-[30px] text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-2xl
                          ${msg.role === 'user' 
                             ? 'bg-[#15171F] border border-white/10 text-white rounded-tr-none' 
                             : 'bg-gradient-to-br from-[#121421] to-[#0A0A0A] border border-white/5 text-blue-50/90 rounded-tl-none border-l-purple-500/50'}
                       `}
                    >
                       {msg.text.includes('<file_changes>') ? (
                          <div>
                             {msg.text.split('<file_changes>')[0]}
                             <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <ClipboardCheck className="w-5 h-5 text-green-400" />
                                   <span className="text-xs font-bold text-green-300">تعديلات مقترحة جاهزة للتطبيق</span>
                                </div>
                                <Button size="sm" variant="neon" className="!text-[10px] !py-2">تطبيق الآن</Button>
                             </div>
                          </div>
                       ) : msg.text}
                    </div>
                 </div>
              ))}
              
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/5 px-8 py-5 rounded-[30px] rounded-tl-none flex items-center gap-4">
                       <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                       </div>
                       <span className="text-xs font-bold text-white/40 tracking-widest uppercase">Thinking with the Vibe...</span>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           {/* Input Floating Box */}
           <div className="absolute bottom-8 left-4 right-4 md:left-10 md:right-10 z-40">
              <form 
                onSubmit={handleSubmit}
                className="bg-[#0D0F16]/80 backdrop-blur-2xl border border-white/10 p-2.5 pl-6 md:pl-8 rounded-full shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex items-center gap-3 md:gap-5 transition-all focus-within:border-purple-500/40 focus-within:scale-[1.01] focus-within:shadow-[0_0_40px_rgba(124,58,237,0.15)] group"
              >
                 <Sparkles className={`w-6 h-6 flex-shrink-0 transition-all ${isLoading ? 'text-purple-500 animate-spin' : 'text-white/20 group-focus-within:text-purple-400'}`} />
                 <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe a change or feature..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 font-medium text-sm md:text-lg min-w-0"
                    disabled={isLoading}
                    autoFocus
                 />
                 <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-4 bg-white text-black rounded-full hover:bg-purple-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black flex-shrink-0 shadow-lg active:scale-90"
                 >
                    <ArrowRight className="w-6 h-6 rtl:rotate-180" />
                 </button>
              </form>
           </div>
        </div>

        {/* Sidebar Overlay */}
        {showSidebar && (
            <div 
                className="md:hidden absolute inset-0 bg-black/90 z-30 backdrop-blur-md animate-in fade-in"
                onClick={() => setShowSidebar(false)}
            />
        )}

        {/* Right Sidebar Context */}
        <div className={`
           fixed inset-y-0 right-0 w-85 bg-[#08090E] border-l border-white/5 z-40 transition-transform duration-500 ease-out transform
           ${showSidebar ? 'translate-x-0' : 'translate-x-full'}
           md:translate-x-0 md:relative md:flex md:w-85
           flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.3)]
        `}>
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                     <h3 className="font-black text-xs uppercase tracking-widest text-white/50">Context Pool</h3>
                  </div>
                  <button onClick={() => setShowSidebar(false)} className="md:hidden p-2 text-white/30 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>

              <div className="flex p-2 bg-black/20 m-4 rounded-2xl border border-white/5">
                 <button 
                    onClick={() => setContextMode('plan')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${contextMode === 'plan' ? 'text-white bg-white/10 shadow-sm' : 'text-white/20 hover:text-white/40'}`}
                 >
                    Roadmap
                 </button>
                 <button 
                    onClick={() => setContextMode('clip')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${contextMode === 'clip' ? 'text-white bg-white/10 shadow-sm' : 'text-white/20 hover:text-white/40'}`}
                 >
                    Vibe Bits
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                 {contextMode === 'plan' && (
                    <>
                       {planNodes.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 text-white/10 opacity-50">
                             <Circle className="w-10 h-10 mb-2" />
                             <p className="text-[10px] font-bold">No items found</p>
                          </div>
                       )}
                       {planNodes.map(node => (
                          <div 
                             key={node.id} 
                             onClick={() => injectContext(node.title + ": " + node.description, node.id)}
                             className={`p-5 rounded-[25px] border cursor-pointer transition-all hover:bg-white/5 group
                                ${activeContextId === node.id ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-[#0F111A] border-white/5'}
                             `}
                          >
                             <div className="flex items-center gap-3 mb-2">
                                {node.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-400"/> : <div className="w-4 h-4 rounded-full border-2 border-purple-500/40 group-hover:border-purple-500 transition-colors"></div>}
                                <span className="font-bold text-white text-sm">{node.title}</span>
                             </div>
                             <p className="text-xs text-white/40 line-clamp-2 font-light leading-relaxed">{node.description}</p>
                          </div>
                       ))}
                    </>
                 )}

                 {contextMode === 'clip' && (
                    <>
                       {clipboardItems.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 text-white/10 opacity-50">
                             <FileText className="w-10 h-10 mb-2" />
                             <p className="text-[10px] font-bold">Clipboard empty</p>
                          </div>
                       )}
                       {clipboardItems.map(item => (
                          <div 
                             key={item.id}
                             onClick={() => injectContext(item.content, item.id)}
                             className={`p-5 rounded-[25px] border cursor-pointer transition-all hover:bg-white/5
                                ${activeContextId === item.id ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-[#0F111A] border-white/5'}
                             `}
                          >
                             <div className="flex items-center justify-between mb-3">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                                   item.type.includes('code') ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/5 text-white/30'
                                }`}>
                                   {item.type}
                                </span>
                                <span className="text-[9px] text-white/20">{item.timestamp.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                             </div>
                             <h5 className="text-xs font-bold text-white mb-1">{item.summary}</h5>
                             <p className="text-[11px] text-white/30 line-clamp-3 font-mono leading-relaxed">{item.content}</p>
                          </div>
                       ))}
                    </>
                 )}
              </div>
        </div>
      </div>
    </div>
  );
};
