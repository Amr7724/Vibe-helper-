import React, { useState } from 'react';
import { Plus, Search, Folder, MessageSquare, ListTodo, MoreVertical, Zap, Clock, ArrowRight, Settings, Bell, Calendar } from 'lucide-react';
import { ProjectMetadata } from '../types';
import { Button } from './Button';

interface ProjectsDashboardProps {
  projects: ProjectMetadata[];
  onSelectProject: (project: ProjectMetadata) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ 
  projects, 
  onSelectProject, 
  onCreateProject,
  onDeleteProject
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName);
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock Days for the "Daily Task" view in image
  const days = [
    { day: 'MON', date: '15', active: true },
    { day: 'TUE', date: '16', active: false },
    { day: 'WED', date: '17', active: false },
    { day: 'THU', date: '18', active: false },
    { day: 'FRI', date: '19', active: false },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white font-sans p-4 md:p-6 pb-24 overflow-y-auto custom-scrollbar">
      
      {/* Header Profile Section */}
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-orange-500/50 p-1">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Vitaliy" alt="User" className="w-full h-full rounded-full bg-white/10" />
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-orange-500 border-2 border-black rounded-full"></div>
            </div>
            <div>
               <p className="text-xs text-white/50">Good Day 👋</p>
               <h2 className="text-xl font-bold">المطور الذكي</h2>
            </div>
         </div>
         <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center border border-white/10 hover:bg-white/10 cursor-pointer">
            <Settings className="w-6 h-6 text-white/70" />
         </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-white/30" />
        <input 
          type="text" 
          placeholder="ابحث عن مشروع..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1A1D2D] rounded-3xl py-4 pr-14 pl-6 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      {/* Projects Section (Horizontal Scroll) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-xl font-bold">Projects</h3>
          <button onClick={() => setIsCreating(true)} className="text-sm text-white/50 hover:text-white transition-colors">See All</button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {/* New Project Button */}
          <button 
             onClick={() => setIsCreating(true)}
             className="min-w-[160px] h-[200px] rounded-[30px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-white/30 hover:border-blue-500/50 hover:text-blue-400 hover:bg-white/5 transition-all flex-shrink-0"
          >
             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
               <Plus className="w-5 h-5" />
             </div>
             <span className="text-sm font-medium">New Project</span>
          </button>

          {isCreating && (
             <div className="min-w-[260px] h-[200px] rounded-[30px] glass-card p-6 flex flex-col justify-between flex-shrink-0 animate-pulse border border-blue-500/30">
               <h4 className="font-bold text-lg">Create New</h4>
               <input 
                  autoFocus
                  type="text"
                  className="bg-black/20 border-b border-white/20 p-2 text-white outline-none"
                  placeholder="Project Name..."
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateSubmit(e)}
               />
               <div className="flex gap-2">
                 <Button size="sm" onClick={handleCreateSubmit} className="flex-1">Create</Button>
                 <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
               </div>
             </div>
          )}

          {filteredProjects.map((project, idx) => (
             <div 
               key={project.id}
               onClick={() => onSelectProject(project)}
               className={`
                 min-w-[260px] h-[200px] rounded-[30px] p-6 flex flex-col justify-between flex-shrink-0 cursor-pointer relative overflow-hidden group transition-transform hover:scale-[1.02]
                 ${idx % 2 === 0 
                   ? 'bg-gradient-to-br from-[#E11D48]/20 to-[#9F1239]/5 border border-[#E11D48]/20' // Red/Pink tint
                   : 'bg-gradient-to-br from-[#3B82F6]/20 to-[#1D4ED8]/5 border border-[#3B82F6]/20' // Blue tint
                 }
               `}
             >
               <div className="flex justify-between items-start z-10">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    {idx % 2 === 0 ? <Zap className="w-5 h-5 text-pink-400" /> : <Folder className="w-5 h-5 text-blue-400" />}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete?')) onDeleteProject(project.id); }}
                    className="p-2 hover:bg-black/20 rounded-full"
                  >
                    <MoreVertical className="w-5 h-5 text-white/50" />
                  </button>
               </div>

               <div className="z-10">
                  <h4 className="text-xl font-bold mb-1 line-clamp-1">{project.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-white/60 mt-2">
                     <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> {project.stats.filesCount} Files</span>
                     <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {project.stats.chatsCount} Chats</span>
                  </div>
                  
                  {/* Avatar pile visual */}
                  <div className="flex -space-x-2 mt-4">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-white/5"></div>
                     ))}
                  </div>
               </div>

               {/* Background Glow */}
               <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] ${idx % 2 === 0 ? 'bg-pink-600/20' : 'bg-blue-600/20'}`}></div>
             </div>
          ))}
        </div>
      </div>

      {/* Progress Section (Large Card) */}
      <div className="mb-8">
         <div className="flex items-center justify-between mb-4 px-2">
           <h3 className="text-xl font-bold">Progress</h3>
           <span className="text-sm text-white/50">All Stats</span>
         </div>
         
         <div className="w-full rounded-[35px] bg-gradient-to-r from-[#1e1b4b] to-[#0f172a] border border-white/5 p-8 relative overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10">
               <h2 className="text-2xl font-bold mb-2">Create and Check<br/>Daily Task</h2>
               <p className="text-sm text-white/40 mb-8 max-w-xs">You can control the execution of a task by a command in the application</p>
               
               {/* Calendar Strip */}
               <div className="flex justify-between items-center bg-black/20 rounded-[25px] p-2 backdrop-blur-md">
                  {days.map((d, i) => (
                    <div 
                      key={i} 
                      className={`
                        flex flex-col items-center justify-center w-12 h-16 rounded-[20px] transition-all
                        ${d.active 
                           ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 transform scale-105' 
                           : 'text-white/40 hover:bg-white/5'}
                      `}
                    >
                       <span className="text-[10px] font-bold mb-1">{d.day}</span>
                       <span className="text-lg font-bold">{d.date}</span>
                    </div>
                  ))}
               </div>

               {/* Add Button Visual */}
               <div className="flex justify-center mt-6">
                  <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] cursor-pointer hover:scale-110 transition-transform">
                     <Plus className="w-8 h-8 text-white" />
                  </div>
               </div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-[20%] right-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px]"></div>
         </div>
      </div>

    </div>
  );
};