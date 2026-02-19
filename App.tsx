import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Code2, MessageSquare, Lightbulb, GitMerge, Clipboard, Activity, Brain, LogOut, FileText, Home, Plus, User as UserIcon, Book, CheckCircle, Zap, FileJson, Search, Download, Copy, Check } from 'lucide-react';
import JSZip from 'jszip';
import { FileNode, ChatMessage, ClipboardItem, SavedPrompt, PlanNode, ProjectMetadata } from './types';
import { SqlViewer } from './components/SqlViewer';
import { FileTree } from './components/FileTree';
import { ChatInterface } from './components/ChatInterface';
import { SmartClipboard, IdeasLab, PlanViewer } from './components/VibeTools';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { VibeCodingView } from './components/VibeCodingView';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { Button } from './components/Button';
import { createProjectChat, sendMessageToChat, analyzeFullProject } from './services/geminiService';
import { saveProjectState, loadProjectState, saveChatHistory, loadChatHistory, saveProjectMetadata, getAllProjects, deleteProject } from './services/db';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Chat } from '@google/genai';

type AppTab = 'home' | 'code' | 'focus' | 'knowledge' | 'vibecoding' | 'extractor';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectMetadata | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  const [rootNodes, setRootNodes] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  
  const [focusMode, setFocusMode] = useState<'chat' | 'plan' | 'ideas' | 'clip'>('chat');
  
  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [fullProjectContext, setFullProjectContext] = useState<string | null>(null);
  const [extractionStats, setExtractionStats] = useState({ files: 0, chars: 0 });
  
  const [planNodes, setPlanNodes] = useState<PlanNode[]>([
    { id: '1', title: 'تحليل المتطلبات', description: 'بناء على Knowledge Base', status: 'pending', type: 'structure' }
  ]);
  const [isProjectAnalyzing, setIsProjectAnalyzing] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setShowLanding(false); 
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      getAllProjects().then(setProjects).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !activeProject) return;

    const initializeProject = async () => {
      setIsDataLoaded(false);
      try {
        const projectState = await loadProjectState(activeProject.id);
        if (projectState) {
          setRootNodes(projectState.rootNodes);
          setKnowledgeBase(projectState.knowledgeBase || '');
          setClipboardItems(projectState.clipboardItems || []);
        }
        const history = await loadChatHistory(activeProject.id);
        setChatMessages(history || []);
        const chat = createProjectChat(!!projectState?.rootNodes?.length, projectState?.knowledgeBase || "");
        if (chat) setChatSession(chat);
        setActiveTab('code');
      } catch (e) {
        console.error("Error loading project data:", e);
      } finally {
        setIsDataLoaded(true);
      }
    };
    initializeProject();
  }, [activeProject, user]);

  useEffect(() => {
    if (isDataLoaded && user && activeProject) {
      saveProjectState(activeProject.id, rootNodes, activeFile?.id || null, knowledgeBase, clipboardItems).catch(console.error);
      saveChatHistory(activeProject.id, chatMessages).catch(console.error);
      
      const updatedMeta: ProjectMetadata = {
          ...activeProject,
          lastOpened: new Date(),
          stats: {
              filesCount: rootNodes.length,
              chatsCount: chatMessages.length,
              tasksCount: planNodes.length
          }
      };
      saveProjectMetadata(updatedMeta).catch(console.error);
    }
  }, [rootNodes, activeFile, chatMessages, isDataLoaded, user, knowledgeBase, activeProject, clipboardItems, planNodes]);

  const handleCreateProject = async (name: string) => {
    const newProject: ProjectMetadata = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date(),
      lastOpened: new Date(),
      stats: { filesCount: 0, chatsCount: 0, tasksCount: 0 }
    };
    await saveProjectMetadata(newProject);
    setProjects(prev => [...prev, newProject]);
    setActiveProject(newProject);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProject?.id === id) setActiveProject(null);
  };

  const handleSignOut = () => {
    signOut(auth);
    setActiveProject(null);
    setProjects([]);
    setShowLanding(true);
  };

  const isBinary = (filename: string) => /\.(png|jpg|jpeg|gif|ico|pdf|zip|exe|dll|bin|mp3|mp4|webm)$/i.test(filename);

  const handleExtractAllText = () => {
    setIsProjectAnalyzing(true);
    setTimeout(() => {
      let contentAccumulator = "";
      let fileCount = 0;
      const traverse = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'folder' && node.children) traverse(node.children);
          else if (node.type === 'file' && !isBinary(node.name)) {
            fileCount++;
            contentAccumulator += `\n--- FILE: ${node.path} ---\n${node.content}\n`;
          }
        });
      };
      traverse(rootNodes);
      setFullProjectContext(contentAccumulator);
      setExtractionStats({ files: fileCount, chars: contentAccumulator.length });
      setIsProjectAnalyzing(false);
      setActiveTab('extractor');
    }, 800);
  };

  const handleDownloadReport = () => {
    if (!fullProjectContext) return;
    const blob = new Blob([fullProjectContext], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Project_Analysis_${activeProject?.name || 'export'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    if (!fullProjectContext) return;
    navigator.clipboard.writeText(fullProjectContext);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendMessage = async (text: string) => {
    if (!chatSession) {
      const newChat = createProjectChat(rootNodes.length > 0, knowledgeBase);
      setChatSession(newChat);
      if (!newChat) return;
    }
    const newUserMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text, timestamp: new Date() };
    setChatMessages(prev => [...prev, newUserMsg]);
    setIsChatLoading(true);
    const responseText = await sendMessageToChat(chatSession!, text, activeFile || undefined, knowledgeBase, fullProjectContext || undefined);
    const newAiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: responseText, timestamp: new Date() };
    setChatMessages(prev => [...prev, newAiMsg]);
    setIsChatLoading(false);
  };

  if (authLoading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white font-mono">LOADING AUTOCODER CORE...</div>;
  if (!user) return showLanding ? <LandingPage onGetStarted={() => setShowLanding(false)} /> : <Auth />;
  
  if (!activeProject || activeTab === 'home') {
    return (
      <div className="relative h-screen flex flex-col overflow-hidden">
        <ProjectsDashboard projects={projects} onSelectProject={(p) => { setActiveProject(p); setActiveTab('code'); }} onCreateProject={handleCreateProject} onDeleteProject={handleDeleteProject} user={user} onSignOut={handleSignOut} />
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
             <BottomNavigation activeTab="home" onTabChange={(t) => setActiveTab(t)} activeProject={activeProject} onSignOut={handleSignOut} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-transparent relative">
      <main className="flex-1 flex overflow-hidden relative pb-24 pt-4 px-2 md:px-4">
        
        {activeTab === 'code' && (
           <div className="flex-1 flex gap-4 overflow-hidden h-full">
               <div className={`w-full md:w-80 glass-sidebar rounded-[30px] flex-col border border-white/5 overflow-hidden flex-shrink-0 ${activeFile ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                     <h3 className="text-lg font-bold">Project Files</h3>
                     <button onClick={handleExtractAllText} className="p-2 hover:bg-white/10 rounded-full text-blue-400" title="Extract All Text"><FileText className="w-5 h-5"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2"><FileTree nodes={rootNodes} selectedFileId={activeFile?.id || null} onSelectFile={(node) => setActiveFile(node)} onToggleFolder={(id) => setRootNodes(prev => {
                     const toggle = (nodes: FileNode[]): FileNode[] => nodes.map(n => n.id === id ? { ...n, isOpen: !n.isOpen } : n.children ? { ...n, children: toggle(n.children) } : n);
                     return toggle(prev);
                  })} /></div>
               </div>
               <div className={`w-full md:flex-1 glass-card rounded-[30px] border border-white/5 overflow-hidden flex-col ${activeFile ? 'flex' : 'hidden md:flex'}`}>
                  {activeFile ? <SqlViewer content={activeFile.content || ''} fileName={activeFile.name} onContentChange={(c) => setActiveFile(p => p ? ({ ...p, content: c }) : null)} onBack={() => setActiveFile(null)} /> : <div className="flex-1 flex flex-col items-center justify-center text-white/30"><Code2 className="w-20 h-20 opacity-20 mb-4" /><p>اختر ملفاً لبدء التحليل</p></div>}
               </div>
           </div>
        )}

        {activeTab === 'extractor' && (
           <div className="w-full max-w-5xl mx-auto h-full glass-card rounded-[35px] border border-white/5 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="p-6 border-b border-white/5 bg-black/40 flex items-center justify-between backdrop-blur-md">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/20 text-blue-400"><FileText className="w-6 h-6" /></div>
                    <div><h2 className="text-2xl font-bold">مستخرج النصوص الذكي</h2><p className="text-white/40 text-sm">تم استخراج النصوص من {extractionStats.files} ملفات ({Math.round(extractionStats.chars/1024)} KB)</p></div>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleCopyAll} icon={isCopied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>} className="!rounded-full">{isCopied ? 'تم النسخ' : 'نسخ الكل'}</Button>
                    <Button variant="primary" onClick={handleDownloadReport} icon={<Download className="w-4 h-4"/>} className="!rounded-full">تحميل التقرير</Button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-black/30 custom-scrollbar">
                 <pre className="font-mono text-sm text-blue-50/70 whitespace-pre-wrap leading-relaxed">{fullProjectContext || 'لا يوجد نصوص مستخرجة حالياً. يرجى البدء بعملية الاستخراج.'}</pre>
              </div>
           </div>
        )}

        {activeTab === 'focus' && <div className="w-full max-w-5xl mx-auto h-full glass-card rounded-[35px] border border-white/5 overflow-hidden flex flex-col"><div className="flex items-center justify-center p-4 border-b border-white/5 gap-2">{['chat', 'plan', 'ideas', 'clip'].map(t => <button key={t} onClick={() => setFocusMode(t as any)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${focusMode === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>{t.toUpperCase()}</button>)}</div><div className="flex-1 overflow-hidden relative">
          {focusMode === 'chat' && <ChatInterface messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isChatLoading} activeFile={activeFile || undefined} />}
          {focusMode === 'plan' && <PlanViewer planNodes={planNodes} />}
          {focusMode === 'ideas' && <IdeasLab knowledgeBase={knowledgeBase} />}
          {focusMode === 'clip' && <SmartClipboard items={clipboardItems} savedPrompts={savedPrompts} onAddItem={i => setClipboardItems(p => [i, ...p])} />}
        </div></div>}

        {activeTab === 'knowledge' && <div className="w-full max-w-5xl mx-auto h-full glass-card rounded-[35px] border border-white/5 overflow-hidden flex flex-col"><KnowledgeBaseView knowledgeBaseStr={knowledgeBase} onUpdate={setKnowledgeBase} /></div>}
        {activeTab === 'vibecoding' && <VibeCodingView messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isChatLoading || isProjectAnalyzing} planNodes={planNodes} clipboardItems={clipboardItems} activeFile={activeFile} onSyncContext={handleExtractAllText} isSyncing={isProjectAnalyzing} />}

      </main>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
         <BottomNavigation activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} activeProject={activeProject} onSignOut={handleSignOut} />
      </div>
    </div>
  );
};

const BottomNavigation: React.FC<{ activeTab: AppTab, onTabChange: (t: AppTab) => void, activeProject: ProjectMetadata | null, onSignOut: () => void }> = ({ activeTab, onTabChange, activeProject, onSignOut }) => (
  <div className="glass-card rounded-[40px] px-6 py-3 flex items-center gap-6 border border-white/10 shadow-2xl bg-black/60 backdrop-blur-2xl max-w-[95vw] overflow-x-auto no-scrollbar">
     <NavIcon icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
     {activeProject && (<><div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0"></div><NavIcon icon={<Code2 />} label="Code" active={activeTab === 'code'} onClick={() => onTabChange('code')} /><NavIcon icon={<FileText />} label="Extract" active={activeTab === 'extractor'} onClick={() => onTabChange('extractor')} /><NavIcon icon={<Book />} label="Base" active={activeTab === 'knowledge'} onClick={() => onTabChange('knowledge')} /><NavIcon icon={<Brain />} label="Focus" active={activeTab === 'focus'} onClick={() => onTabChange('focus')} /><NavIcon icon={<Zap className="text-purple-400" />} label="Vibe" active={activeTab === 'vibecoding'} onClick={() => onTabChange('vibecoding')} /></>)}
     <div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0"></div>
     <button onClick={onSignOut} className="p-2.5 rounded-full text-white/40 hover:text-red-400 transition-all"><LogOut className="w-5 h-5" /></button>
  </div>
);

const NavIcon: React.FC<{ icon: React.ReactElement, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
   <button onClick={onClick} className="flex flex-col items-center gap-1 group min-w-[50px]">
      <div className={`p-2.5 rounded-[18px] transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>{React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}</div>
   </button>
);

export default App;
