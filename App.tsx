import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Code2, MessageSquare, Lightbulb, GitMerge, Clipboard, Activity, Brain, LogOut, FileText, Home, Plus, User as UserIcon, Book, CheckCircle, Zap } from 'lucide-react';
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
import { createProjectChat, sendMessageToChat, analyzeFullProject } from './services/geminiService';
import { saveProjectState, loadProjectState, saveChatHistory, loadChatHistory, saveProjectMetadata, getAllProjects, deleteProject } from './services/db';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Chat } from '@google/genai';

type AppTab = 'home' | 'code' | 'focus' | 'knowledge' | 'vibecoding';

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
  
  const defaultPlan: PlanNode[] = [
    {
      id: '1', title: 'تحليل المتطلبات', description: 'بناء على Knowledge Base', status: 'pending', type: 'structure',
      children: []
    }
  ];
  const [planNodes, setPlanNodes] = useState<PlanNode[]>(defaultPlan);
  const [isProjectAnalyzing, setIsProjectAnalyzing] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setShowLanding(false); 
      }
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
        let hasFiles = false;

        if (projectState) {
          setRootNodes(projectState.rootNodes);
          setKnowledgeBase(projectState.knowledgeBase || '');
          setClipboardItems(projectState.clipboardItems || []);
          hasFiles = projectState.rootNodes.length > 0;
          
          if (projectState.activeFileId) {
            const findNode = (nodes: FileNode[], id: string): FileNode | null => {
              for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                  const found = findNode(node.children, id);
                  if (found) return found;
                }
              }
              return null;
            };
            const file = findNode(projectState.rootNodes, projectState.activeFileId);
            if (file) {
              setActiveFile(file);
            }
          }
        }

        const history = await loadChatHistory(activeProject.id);
        setChatMessages(history || []);

        const chat = createProjectChat(hasFiles, projectState?.knowledgeBase || "");
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

  const processFile = async (file: File) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      await handleZipUpload(file);
    } else if (file.name.toLowerCase().endsWith('.sql')) {
      await handleSqlUpload(file);
    } else {
      alert('يرجى رفع ملفات .zip أو .sql');
      return;
    }
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const handleSqlUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newNode: FileNode = {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'file',
        path: `/${file.name}`,
        content: content
      };
      setRootNodes(prev => [...prev, newNode]);
      setActiveFile(newNode);
    };
    reader.readAsText(file);
  };

  const handleZipUpload = async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      const fileMap = new Map<string, FileNode>();
      zip.forEach((relativePath, zipEntry) => {
        const parts = relativePath.split('/');
        if (parts[parts.length - 1] === '') parts.pop();
        const fileName = parts[parts.length - 1];
        const isFolder = zipEntry.dir;
        const node: FileNode = {
          id: relativePath,
          name: fileName,
          type: isFolder ? 'folder' : 'file',
          path: relativePath,
          children: isFolder ? [] : undefined,
          isOpen: false 
        };
        fileMap.set(relativePath, node);
      });
      const root: FileNode[] = [];
      for (const [path, node] of fileMap) {
        if (node.type === 'file' && !isBinary(node.name)) {
          const content = await zip.file(node.path)?.async("string");
          node.content = content || "";
        }
        const parts = path.split('/');
        if (parts.length === 1 || (parts.length === 2 && path.endsWith('/'))) {
           root.push(node);
        } else {
           const parentPath = parts.slice(0, -1).join('/') + '/';
           const parent = fileMap.get(parentPath);
           if (parent && parent.children) parent.children.push(node);
           else root.push(node);
        }
      }
      setRootNodes(root);
      setChatSession(createProjectChat(true, knowledgeBase));
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء فك ضغط الملف.");
    }
  };

  const isBinary = (filename: string) => /\.(png|jpg|jpeg|gif|ico|pdf|zip|exe|dll|bin|mp3|mp4|webm)$/i.test(filename);

  const toggleFolder = (nodeId: string) => {
    const updateNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) return { ...node, isOpen: !node.isOpen };
        if (node.children) return { ...node, children: updateNodes(node.children) };
        return node;
      });
    };
    setRootNodes(updateNodes(rootNodes));
  };

  const handleExtractAllText = () => {
    setIsProjectAnalyzing(true);
    setTimeout(() => {
      let contentAccumulator = "";
      let fileCount = 0;
      
      const traverse = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'folder' && node.children) {
            traverse(node.children);
          } else if (node.type === 'file') {
             if (!isBinary(node.name)) {
                fileCount++;
                contentAccumulator += `\nFILE: ${node.path}\n${node.content}\n`;
             }
          }
        });
      };

      traverse(rootNodes);
      setFullProjectContext(contentAccumulator);
      setIsProjectAnalyzing(false);
      
      if (activeTab !== 'vibecoding') {
          const extractNode: FileNode = {
            id: 'extract-all-text',
            name: 'FULL_PROJECT_CONTEXT.txt',
            path: '/FULL_PROJECT_CONTEXT.txt',
            type: 'file',
            content: contentAccumulator
          };
          setActiveFile(extractNode);
          setActiveTab('code');
      }
    }, 500);
  };

  const applyFileChanges = (jsonStr: string) => {
      try {
          const changes = JSON.parse(jsonStr);
          if (Array.isArray(changes)) {
              setRootNodes(prev => {
                  const newNodes = [...prev];
                  changes.forEach(change => {
                      const updateNode = (nodes: FileNode[]): boolean => {
                          for (let i = 0; i < nodes.length; i++) {
                              if (nodes[i].path === change.path) {
                                  nodes[i] = { ...nodes[i], content: change.content };
                                  return true;
                              }
                              if (nodes[i].children && updateNode(nodes[i].children)) return true;
                          }
                          return false;
                      };
                      
                      if (!updateNode(newNodes)) {
                          // Create new file at root if not found
                          newNodes.push({
                              id: crypto.randomUUID(),
                              name: change.path.split('/').pop() || 'newfile',
                              path: change.path,
                              type: 'file',
                              content: change.content
                          });
                      }
                  });
                  return newNodes;
              });
              alert('تم تطبيق التعديلات بنجاح!');
          }
      } catch (e) { console.error("Apply error", e); }
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
    
    // Check for auto-edits
    if (responseText.includes('<file_changes>')) {
        const match = responseText.match(/<file_changes>([\s\S]*?)<\/file_changes>/);
        if (match && match[1]) {
            // Option to auto-apply or show button (already handled in VibeCodingView)
        }
    }

    const newAiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'model', text: responseText, timestamp: new Date() };
    setChatMessages(prev => [...prev, newAiMsg]);
    setIsChatLoading(false);
  };

  const handleAnalyzeProject = async () => {
    setIsProjectAnalyzing(true);
    const structure = JSON.stringify(rootNodes.map(n => n.path), null, 2);
    const report = await analyzeFullProject(structure, knowledgeBase);
    const reportMsg: ChatMessage = { 
      id: crypto.randomUUID(), 
      role: 'model', 
      text: report, 
      timestamp: new Date() 
    };
    setChatMessages(prev => [...prev, reportMsg]);
    setIsProjectAnalyzing(false);
    setActiveTab('focus');
    setFocusMode('chat');
  };

  const handleLinkItemToPlan = (nodeId: string, itemId: string, type: 'clipboard' | 'prompt') => {
      alert('تم الربط');
  };

  const handleSavePrompt = (content: string) => {
     const newPrompt: SavedPrompt = {
       id: crypto.randomUUID(),
       content,
       category: 'general',
       createdAt: new Date()
     };
     setSavedPrompts(prev => [newPrompt, ...prev]);
  };
  
  const handleUpdatePrompt = (id: string, updates: Partial<SavedPrompt>) => {
    setSavedPrompts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleUpdateClipboardItem = (id: string, updates: Partial<ClipboardItem>) => {
      setClipboardItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  
  const handleDeleteClipboardItem = (id: string) => {
      setClipboardItems(prev => prev.filter(item => item.id !== id));
  };

  if (authLoading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-white">Loading AutoCoder...</div>;
  if (!user) return showLanding ? <LandingPage onGetStarted={() => setShowLanding(false)} /> : <Auth />;
  
  if (!activeProject || activeTab === 'home') {
    return (
      <div className="relative h-screen flex flex-col overflow-hidden">
        <ProjectsDashboard 
          projects={projects} 
          onSelectProject={(p) => { setActiveProject(p); setActiveTab('code'); }}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          user={user}
          onSignOut={handleSignOut}
        />
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
             <BottomNavigation activeTab="home" onTabChange={(t) => setActiveTab(t)} activeProject={activeProject} onSignOut={handleSignOut} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col font-sans overflow-hidden bg-transparent relative"
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-50">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[0%] left-[0%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      {uploadSuccess && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 animate-in fade-in slide-in-from-top-5">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">تم رفع الملفات!</span>
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md m-4 rounded-3xl border-2 border-blue-500 border-dashed pointer-events-none">
            <div className="flex flex-col items-center text-white animate-bounce">
                <UploadCloud className="w-20 h-20 text-blue-400 mb-4" />
                <h2 className="text-3xl font-bold">إسقاط الملفات هنا</h2>
            </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden relative pb-24 pt-4 px-2 md:px-4">
        
        {activeTab === 'code' && (
           <div className="flex-1 flex gap-4 overflow-hidden h-full relative">
               <div className={`
                 w-full md:w-80 glass-sidebar rounded-[30px] flex-col border border-white/5 overflow-hidden flex-shrink-0
                 ${activeFile ? 'hidden md:flex' : 'flex'}
               `}>
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                     <h3 className="text-lg font-bold">Project Files</h3>
                     <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/10 rounded-full text-blue-400"><UploadCloud className="w-4 h-4"/></button>
                        <button onClick={handleExtractAllText} className="p-2 hover:bg-white/10 rounded-full text-green-400"><FileText className="w-4 h-4"/></button>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                     <FileTree nodes={rootNodes} selectedFileId={activeFile?.id || null} onSelectFile={(node) => setActiveFile(node)} onToggleFolder={toggleFolder} />
                  </div>
               </div>

               <div className={`
                 w-full md:flex-1 glass-card rounded-[30px] border border-white/5 overflow-hidden flex-col
                 ${activeFile ? 'flex' : 'hidden md:flex'}
               `}>
                  {activeFile ? (
                     <SqlViewer 
                        content={activeFile.content || ''} 
                        fileName={activeFile.name}
                        onContentChange={(newContent) => setActiveFile(prev => prev ? ({ ...prev, content: newContent }) : null)}
                        onBack={() => setActiveFile(null)}
                     />
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                        <Code2 className="w-20 h-20 opacity-20 mb-4" />
                        <p>اختر ملفاً للبدء</p>
                     </div>
                  )}
               </div>
           </div>
        )}

        {activeTab === 'focus' && (
           <div className="w-full max-w-5xl mx-auto h-full glass-card rounded-[35px] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-center p-4 border-b border-white/5 gap-2 overflow-x-auto no-scrollbar">
                 {['chat', 'plan', 'ideas', 'clip'].map((t) => (
                    <button key={t} onClick={() => setFocusMode(t as any)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${focusMode === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'}`}>
                       {t.toUpperCase()}
                    </button>
                 ))}
              </div>

              <div className="flex-1 overflow-hidden relative">
                 {focusMode === 'chat' && <ChatInterface messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isChatLoading || isProjectAnalyzing} activeFile={activeFile || undefined} onSavePrompt={handleSavePrompt} />}
                 {focusMode === 'plan' && <PlanViewer planNodes={planNodes} onLinkItem={handleLinkItemToPlan} />}
                 {focusMode === 'ideas' && <IdeasLab knowledgeBase={knowledgeBase} />}
                 {focusMode === 'clip' && <SmartClipboard items={clipboardItems} savedPrompts={savedPrompts} planNodes={planNodes} onAddItem={(item) => setClipboardItems(prev => [item, ...prev])} onUpdateItem={handleUpdateClipboardItem} onDeleteItem={handleDeleteClipboardItem} onUpdatePrompt={handleUpdatePrompt} />}
              </div>
           </div>
        )}

        {activeTab === 'knowledge' && (
           <div className="w-full max-w-5xl mx-auto h-full glass-card rounded-[35px] border border-white/5 overflow-hidden flex flex-col">
              <KnowledgeBaseView knowledgeBaseStr={knowledgeBase} onUpdate={(newKb) => setKnowledgeBase(newKb)} />
           </div>
        )}

        {activeTab === 'vibecoding' && (
           <VibeCodingView 
             messages={chatMessages} 
             onSendMessage={handleSendMessage} 
             isLoading={isChatLoading || isProjectAnalyzing}
             planNodes={planNodes}
             clipboardItems={clipboardItems}
             activeFile={activeFile}
             onSyncContext={handleExtractAllText}
             isSyncing={isProjectAnalyzing}
           />
        )}

      </main>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
         <BottomNavigation activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} activeProject={activeProject} onSignOut={handleSignOut} />
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".zip,.sql" className="hidden" />
    </div>
  );
};

const BottomNavigation: React.FC<{ activeTab: AppTab, onTabChange: (t: AppTab) => void, activeProject: ProjectMetadata | null, onSignOut: () => void }> = ({ activeTab, onTabChange, activeProject, onSignOut }) => {
   return (
      <div className="glass-card rounded-[40px] px-6 py-3 flex items-center gap-6 border border-white/10 shadow-2xl bg-black/60 backdrop-blur-2xl max-w-[95vw] overflow-x-auto no-scrollbar">
         <NavIcon icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => onTabChange('home')} />
         {activeProject && (
           <>
              <div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0"></div>
              <NavIcon icon={<Code2 />} label="Code" active={activeTab === 'code'} onClick={() => onTabChange('code')} />
              <NavIcon icon={<Book />} label="Knowledge" active={activeTab === 'knowledge'} onClick={() => onTabChange('knowledge')} />
              <NavIcon icon={<Brain />} label="Focus" active={activeTab === 'focus'} onClick={() => onTabChange('focus')} />
              <NavIcon icon={<Zap className="text-purple-400" />} label="Vibe" active={activeTab === 'vibecoding'} onClick={() => onTabChange('vibecoding')} />
           </>
         )}
         <div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0"></div>
         <button onClick={onSignOut} className="p-2.5 rounded-full text-white/40 hover:text-red-400 transition-all"><LogOut className="w-5 h-5" /></button>
      </div>
   );
};

// Fixed NavIcon with proper ReactElement typing and class merging to resolve TS overload issues
const NavIcon: React.FC<{ icon: React.ReactElement, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
   <button onClick={onClick} className="flex flex-col items-center gap-1 group min-w-[50px]">
      <div className={`p-2.5 rounded-[18px] transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
         {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { 
            className: `${(icon.props as any).className || ''} w-5 h-5`.trim() 
         }) : icon}
      </div>
   </button>
);

const NavIconSimple: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
   <button onClick={onClick} className="flex flex-col items-center gap-1 group min-w-[50px]">
      <div className={`p-2.5 rounded-[18px] transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
         {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
   </button>
);

export default App;