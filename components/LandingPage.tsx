import React from 'react';
import { Button } from './Button';
import { Database, Code2, Bot, Shield, ChevronRight, Zap, Layers, LayoutGrid, Cpu, Globe } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden bg-[#000205] text-white">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[18px] flex items-center justify-center shadow-lg shadow-blue-900/20 border border-white/10">
            <Code2 className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Auto<span className="text-blue-500">Coder</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/5 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
           <Button variant="ghost" className="!rounded-full !px-6 text-white/70">المميزات</Button>
           <Button variant="ghost" className="!rounded-full !px-6 text-white/70">كيف يعمل</Button>
           <Button variant="primary" onClick={onGetStarted} className="!rounded-full !px-8 shadow-lg shadow-blue-600/20">ابدأ الآن</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 text-center relative z-10 max-w-7xl mx-auto w-full">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-xs font-bold text-blue-300 tracking-wide uppercase">AI-Powered Development V2.0</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-bold text-white mb-8 leading-tight tracking-tight">
          Build Software <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            At The Speed of Thought
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/40 max-w-2xl mb-12 leading-relaxed font-light">
          بيئة تطوير متكاملة تعتمد على الذكاء الاصطناعي لتحليل المشاريع، استخراج النصوص، والمساعدة في كتابة الكود بشكل تفاعلي.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-20">
          <Button onClick={onGetStarted} className="w-full sm:w-auto !text-lg !px-10 !py-5 !rounded-[25px] shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:scale-105 transition-transform">
            ابدأ التجربة مجاناً
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>

        {/* Floating UI Showcase */}
        <div className="relative w-full max-w-5xl mx-auto h-[400px] md:h-[500px] perspective-1000 hidden md:block">
           {/* Card 1: Project Card (Left) */}
           <div className="absolute left-0 top-20 w-[280px] h-[320px] rounded-[40px] bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/80 border border-white/10 backdrop-blur-xl p-6 flex flex-col justify-between transform -rotate-6 hover:rotate-0 transition-all duration-500 shadow-2xl z-10 group">
              <div>
                 <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-4 text-pink-400 border border-pink-500/20 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                 </div>
                 <h3 className="text-2xl font-bold mb-1">Redesign<br/>Dashboard</h3>
                 <p className="text-white/40 text-sm mt-2">Update UI components to match new glassmorphism style.</p>
              </div>
              <div className="flex -space-x-3">
                 {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-[#1E293B] bg-white/10"></div>)}
              </div>
           </div>

           {/* Card 2: Main Interface (Center) */}
           <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-[600px] h-[400px] rounded-[40px] bg-[#000205]/90 border border-white/10 backdrop-blur-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] z-20 overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10"></div>
                    <div className="space-y-2">
                       <div className="w-24 h-3 bg-white/20 rounded-full"></div>
                       <div className="w-16 h-2 bg-white/10 rounded-full"></div>
                    </div>
                 </div>
                 <div className="w-10 h-10 rounded-full border border-white/10"></div>
              </div>
              {/* Fake Chat Bubbles */}
              <div className="space-y-4">
                 <div className="flex items-end gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20"></div>
                    <div className="bg-[#1E2032] p-4 rounded-[20px] rounded-bl-none text-sm text-white/60 max-w-[80%]">
                       Analyzing project structure... Found 14 SQL files and 5 configurations.
                    </div>
                 </div>
                 <div className="flex items-end gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-white/10"></div>
                    <div className="bg-blue-600 p-4 rounded-[20px] rounded-br-none text-sm text-white max-w-[80%] shadow-lg shadow-blue-600/20">
                       Great! Extract all text content and generate a summary.
                    </div>
                 </div>
              </div>
              {/* Glow */}
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none"></div>
           </div>

           {/* Card 3: Stats (Right) */}
           <div className="absolute right-0 top-32 w-[260px] h-[280px] rounded-[40px] bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/80 border border-white/10 backdrop-blur-xl p-6 flex flex-col transform rotate-6 hover:rotate-0 transition-all duration-500 shadow-2xl z-10 group">
              <div className="flex justify-between items-center mb-6">
                 <span className="text-white/50 text-sm font-bold">Files</span>
                 <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-5xl font-bold mb-2">1,240</div>
              <div className="text-sm text-green-400 mb-8">+12% this week</div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-auto">
                 <div className="bg-blue-500 w-[70%] h-full rounded-full"></div>
              </div>
           </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">أدوات مصممة للمستقبل</h2>
            <p className="text-white/40">كل ما تحتاجه لإدارة مشاريعك البرمجية في مكان واحد</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Cpu className="w-8 h-8 text-blue-400" />}
              title="تحليل عميق"
              description="محرك ذكاء اصطناعي يفهم سياق المشروع بالكامل، وليس مجرد مقتطفات."
              color="blue"
            />
            <FeatureCard 
              icon={<LayoutGrid className="w-8 h-8 text-pink-400" />}
              title="واجهة عصرية"
              description="تصميم Glassmorphism داكن يركز على المحتوى ويقلل من تشتت الانتباه."
              color="pink"
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-purple-400" />}
              title="تكامل سحابي"
              description="احفظ أفكارك، وشارك النصوص البرمجية، وقم بإدارة المهام من أي مكان."
              color="purple"
            />
          </div>
        </div>
      </section>

    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string, color: 'blue'|'pink'|'purple'}> = ({icon, title, description, color}) => {
  const colorStyles = {
    blue: "group-hover:shadow-blue-500/20 border-blue-500/10",
    pink: "group-hover:shadow-pink-500/20 border-pink-500/10",
    purple: "group-hover:shadow-purple-500/20 border-purple-500/10"
  };

  return (
    <div className={`
      bg-[#0A0A0A] border border-white/5 p-8 rounded-[35px] hover:bg-white/5 transition-all duration-300 group hover:-translate-y-2
      ${colorStyles[color]}
    `}>
      <div className={`w-16 h-16 rounded-[20px] bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/40 leading-relaxed text-sm font-light">
        {description}
      </p>
    </div>
  );
};