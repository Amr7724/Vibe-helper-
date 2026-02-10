import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Edit3, Save, X, Lightbulb, FileText } from 'lucide-react';
import { Button } from './Button';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: 'business' | 'technical' | 'user' | 'general';
  updatedAt: Date;
}

interface KnowledgeBaseViewProps {
  knowledgeBaseStr: string;
  onUpdate: (newKnowledge: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ knowledgeBaseStr, onUpdate }) => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null); // ID of entry being edited
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<KnowledgeEntry['category']>('general');

  // Parse knowledge string on load
  useEffect(() => {
    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(knowledgeBaseStr);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
        setEntries(parsed.map((e: any) => ({...e, updatedAt: new Date(e.updatedAt)})));
        return;
      }
    } catch (e) {
      // Not JSON, fallback to treating the whole string as one entry if not empty
      if (knowledgeBaseStr.trim()) {
        setEntries([{
          id: 'legacy-1',
          title: 'General Context',
          content: knowledgeBaseStr,
          category: 'general',
          updatedAt: new Date()
        }]);
      } else {
        setEntries([]);
      }
    }
  }, [knowledgeBaseStr]);

  // Save entries back to string
  const saveToParent = (newEntries: KnowledgeEntry[]) => {
    setEntries(newEntries);
    onUpdate(JSON.stringify(newEntries));
  };

  const handleAdd = () => {
    if (!title.trim() || !content.trim()) return;
    
    const newEntry: KnowledgeEntry = {
      id: crypto.randomUUID(),
      title,
      content,
      category,
      updatedAt: new Date()
    };
    
    saveToParent([newEntry, ...entries]);
    resetForm();
  };

  const handleUpdate = (id: string) => {
    const updated = entries.map(e => e.id === id ? { ...e, title, content, category, updatedAt: new Date() } : e);
    saveToParent(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this knowledge?')) {
      saveToParent(entries.filter(e => e.id !== id));
    }
  };

  const startEdit = (entry: KnowledgeEntry) => {
    setIsEditing(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('general');
    setIsEditing(null);
    setShowAddForm(false);
  };

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'business': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'technical': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'user': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="h-full flex flex-col font-sans relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Book className="w-6 h-6 text-blue-500" />
            قاعدة المعرفة
          </h2>
          <p className="text-white/40 text-sm mt-1">أضف معلومات وسياق للمشروع لمساعدة الذكاء الاصطناعي</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} icon={<Plus className="w-5 h-5" />} className="!rounded-full shadow-lg shadow-blue-600/20">
            معرفة جديدة
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
        
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4">
             <div className="glass-card p-6 rounded-[30px] border border-blue-500/30 bg-blue-900/10 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">{isEditing ? 'تعديل المعرفة' : 'إضافة معرفة جديدة'}</h3>
                  <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-full text-white/50"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="space-y-4">
                   <div className="flex gap-4">
                      <div className="flex-1">
                         <label className="text-xs text-white/40 mb-1 block">العنوان</label>
                         <input 
                            type="text" 
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="مثلاً: قواعد العمل، هيكلية البيانات..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                         />
                      </div>
                      <div className="w-1/3">
                         <label className="text-xs text-white/40 mb-1 block">التصنيف</label>
                         <select 
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                            value={category}
                            onChange={e => setCategory(e.target.value as any)}
                         >
                            <option value="general">عام</option>
                            <option value="business">Business Logic</option>
                            <option value="technical">Technical</option>
                            <option value="user">User Stories</option>
                         </select>
                      </div>
                   </div>
                   
                   <div>
                      <label className="text-xs text-white/40 mb-1 block">المحتوى</label>
                      <textarea 
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none h-40 resize-none font-mono text-sm leading-relaxed"
                        placeholder="اشرح التفاصيل هنا..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                      />
                   </div>

                   <div className="flex justify-end pt-2">
                      <Button onClick={() => isEditing ? handleUpdate(isEditing) : handleAdd()}>
                         {isEditing ? 'حفظ التعديلات' : 'إضافة للقاعدة'}
                      </Button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Entries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.length > 0 ? (
            entries.map(entry => (
              <div key={entry.id} className="glass-card p-5 rounded-[25px] hover:bg-white/5 transition-all group border border-white/5 relative overflow-hidden">
                 <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-[12px] border ${getCategoryColor(entry.category)}`}>
                          {entry.category === 'business' ? <Lightbulb className="w-4 h-4" /> : 
                           entry.category === 'technical' ? <FileText className="w-4 h-4" /> : 
                           <Book className="w-4 h-4" />}
                       </div>
                       <div>
                          <h4 className="font-bold text-white text-base">{entry.title}</h4>
                          <span className="text-[10px] text-white/30">{entry.updatedAt.toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => startEdit(entry)} className="p-2 hover:bg-white/10 rounded-full text-blue-400"><Edit3 className="w-4 h-4"/></button>
                       <button onClick={() => handleDelete(entry.id)} className="p-2 hover:bg-white/10 rounded-full text-red-400"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 </div>
                 
                 <p className="text-white/60 text-sm leading-relaxed line-clamp-4 relative z-10 font-light">
                   {entry.content}
                 </p>

                 {/* Decorative BG */}
                 <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tl from-white/5 to-transparent rounded-full blur-2xl group-hover:from-blue-500/10 transition-colors"></div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20 border-2 border-dashed border-white/5 rounded-[30px]">
               <Book className="w-16 h-16 mb-4 opacity-20" />
               <p>قاعدة المعرفة فارغة. أضف أول معلومة!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};