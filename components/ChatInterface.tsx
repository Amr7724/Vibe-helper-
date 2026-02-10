import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ClipboardCopy, Save, Paperclip, Check } from 'lucide-react';
import { ChatMessage, FileNode, SavedPrompt } from '../types';
import { Button } from './Button';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeFile?: FileNode;
  onSavePrompt?: (content: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading,
  activeFile,
  onSavePrompt
}) => {
  const [input, setInput] = useState('');
  const [savedMsgIds, setSavedMsgIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleSaveClick = (msgId: string, text: string) => {
    if (onSavePrompt) {
      onSavePrompt(text);
      setSavedMsgIds(prev => {
        const newSet = new Set(prev);
        newSet.add(msgId);
        return newSet;
      });
      
      // Reset after 2 seconds
      setTimeout(() => {
        setSavedMsgIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(msgId);
          return newSet;
        });
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
             </div>
             <div>
               <h3 className="font-bold text-white">Focus AI</h3>
               <p className="text-xs text-white/40 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
               </p>
             </div>
          </div>
          {activeFile && (
            <div className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full text-white/60">
               Context: {activeFile.name}
            </div>
          )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 opacity-50" />
            </div>
            <p>Start a conversation with your project.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-end gap-3 group ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1 ${msg.role === 'user' ? 'bg-white/10' : 'bg-gradient-to-tr from-blue-500 to-purple-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white/70" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              
              {/* Bubble */}
              <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`
                    p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-md
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' // User Bubble
                      : 'bg-[#1E2032] text-white/90 rounded-bl-none border border-white/5'} // AI Bubble
                  `}
                >
                  {msg.text}
                </div>
                
                <span className="text-[10px] text-white/20 px-1">{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                
                {/* Actions for Bot Messages */}
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => navigator.clipboard.writeText(msg.text)} 
                      className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white"
                      title="Copy to Clipboard"
                    >
                      <ClipboardCopy className="w-3 h-3" />
                    </button>
                    {onSavePrompt && (
                      <button 
                        onClick={() => handleSaveClick(msg.id, msg.text)} 
                        className={`p-1 rounded transition-colors ${savedMsgIds.has(msg.id) ? 'text-green-400 bg-green-500/10' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                        title="Save to Vibe Tools"
                      >
                        {savedMsgIds.has(msg.id) ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
           <div className="flex items-center gap-2 px-12">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-transparent">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-[#1E2032] p-2 rounded-[30px] border border-white/5 shadow-xl relative z-30">
          <button type="button" className="p-3 rounded-full hover:bg-white/5 text-white/40 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none text-white placeholder-white/30 focus:ring-0 outline-none text-sm"
            disabled={isLoading}
          />
          
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};