
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Copy, Check, FileCode, Bot, Sparkles, Edit3, Eye, Save, Download } from 'lucide-react';
import { Button } from './Button';
import { explainSqlCode } from '../services/geminiService';

interface SqlViewerProps {
  content: string;
  fileName: string;
  onContentChange?: (newContent: string) => void;
}

const SyntaxHighlighter: React.FC<{ code: string; fileName: string }> = React.memo(({ code, fileName }) => {
  const lines = useMemo(() => code.split('\n'), [code]);
  const isSql = fileName.toLowerCase().endsWith('.sql');
  
  // Performance Guard for massive files
  if (lines.length > 20000) {
      return (
         <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <FileCode className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg mb-2">الملف كبير جداً للمعاينة ({lines.length.toLocaleString()} سطر)</p>
            <p className="text-sm opacity-60">يرجى تحميل الملف لعرض المحتوى بالكامل أو استخدامه في الدردشة.</p>
         </div>
      );
  }

  const renderLine = (line: string) => {
    if (!line) return <span className="inline-block">&nbsp;</span>;
    
    // For non-SQL files (like the extracted context), just return the line text to improve performance and readability
    if (!isSql) {
        return <span className="text-slate-300">{line}</span>;
    }

    const tokens: React.ReactNode[] = [];
    let buffer = line;
    let key = 0;

    while (buffer.length > 0) {
      if (buffer.startsWith('--')) {
        tokens.push(<span key={key++} className="text-slate-500 italic">{buffer}</span>);
        break;
      }
      if (buffer.startsWith("'")) {
        const endIdx = buffer.indexOf("'", 1);
        if (endIdx > -1) {
          tokens.push(<span key={key++} className="text-green-400">{buffer.slice(0, endIdx + 1)}</span>);
          buffer = buffer.slice(endIdx + 1);
          continue;
        }
      }
      const wordMatch = buffer.match(/^[a-zA-Z_]\w*/);
      if (wordMatch) {
        const word = wordMatch[0];
        const upper = word.toUpperCase();
        const isKeyword = /^(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TABLE|INDEX|VIEW|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AND|OR|NOT|IN|IS|NULL|VALUES|SET|INTO|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|CONSTRAINT|UNION|ALL|CASE|WHEN|THEN|ELSE|END|CAST|TRUNCATE|BEGIN|COMMIT|ROLLBACK|DECLARE|PRAGMA|EXISTS|LIKE)$/.test(upper);
        
        tokens.push(
          <span key={key++} className={isKeyword ? "text-purple-400 font-bold" : "text-slate-300"}>
            {word}
          </span>
        );
        buffer = buffer.slice(word.length);
        continue;
      }
      const numMatch = buffer.match(/^\d+(\.\d+)?/);
      if (numMatch) {
        tokens.push(<span key={key++} className="text-orange-400">{numMatch[0]}</span>);
        buffer = buffer.slice(numMatch[0].length);
        continue;
      }
      tokens.push(<span key={key++} className="text-slate-400">{buffer[0]}</span>);
      buffer = buffer.slice(1);
    }
    return tokens;
  };

  return (
    <div className="font-mono text-sm min-w-full inline-block">
      {lines.map((line, i) => (
        <div key={i} className="flex hover:bg-white/5 group">
          <div className="flex-none w-12 pr-4 text-right text-slate-500 select-none border-r border-white/10 group-hover:bg-white/5 sticky left-0 z-10 backdrop-blur-sm">
            {i + 1}
          </div>
          <div className="flex-1 pl-4 whitespace-pre">
            {renderLine(line)}
          </div>
        </div>
      ))}
    </div>
  );
});

export const SqlViewer: React.FC<SqlViewerProps> = ({ content, fileName, onContentChange }) => {
  const [copied, setCopied] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (contentRef.current) {
        localStorage.setItem(`autosave_${fileName}`, contentRef.current);
        setLastAutoSave(new Date());
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fileName]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName || "download.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAnalyze = async () => {
    if (analysis) {
      setShowAnalysis(!showAnalysis);
      return;
    }

    setIsAnalyzing(true);
    setShowAnalysis(true);
    const result = await explainSqlCode(content);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-lg md:rounded-xl shadow-xl border border-white/20 overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 flex-shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-2 text-white font-semibold min-w-0">
          <FileCode className="w-5 h-5 text-primary-400" />
          <div className="flex flex-col min-w-0">
            <span className="truncate max-w-[150px] md:max-w-xs" dir="ltr">{fileName}</span>
            {lastAutoSave && (
              <span className="text-[10px] text-white/50 font-normal flex items-center gap-1">
                <Save className="w-3 h-3" />
                تم الحفظ تلقائياً {lastAutoSave.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setIsEditing(!isEditing)}
             icon={isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
             title={isEditing ? "معاينة" : "تعديل"}
           >
             {isEditing ? 'معاينة' : 'تعديل'}
           </Button>

           <Button 
            variant="secondary" 
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="hidden sm:flex"
            icon={isAnalyzing ? <Sparkles className="animate-spin w-4 h-4" /> : <Bot className="w-4 h-4" />}
          >
            {isAnalyzing ? 'جاري التحليل...' : (analysis ? (showAnalysis ? 'إخفاء التحليل' : 'عرض التحليل') : 'تحليل AI')}
          </Button>

          <Button 
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            icon={<Download className="w-4 h-4" />}
            title="تحميل الملف"
          />

          <Button 
            variant={copied ? "primary" : "secondary"}
            onClick={handleCopy}
            icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            size="sm"
          >
            {copied ? 'تم النسخ' : 'نسخ'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* SQL Code View / Edit */}
        <div className={`flex-1 overflow-auto bg-black/40 text-slate-300 ${showAnalysis ? 'hidden md:block w-1/2' : 'w-full'}`} dir="ltr">
          {isEditing ? (
            <textarea
              className="w-full h-full bg-transparent text-slate-300 p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary-500/50"
              value={content}
              onChange={(e) => onContentChange?.(e.target.value)}
              spellCheck={false}
            />
          ) : (
            <div className="min-h-full py-4">
              <SyntaxHighlighter code={content} fileName={fileName} />
            </div>
          )}
        </div>

        {/* AI Analysis Panel */}
        {showAnalysis && (
          <div className="flex-1 md:w-1/2 bg-white/10 backdrop-blur-2xl border-r border-white/10 overflow-auto p-6 md:border-r-0 md:border-l md:border-white/10">
            <div className="flex items-center gap-2 mb-4 text-primary-300">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-xl font-bold">تحليل الذكاء الاصطناعي</h3>
            </div>
            
            {isAnalyzing ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-white/90 leading-7 whitespace-pre-line">
                {analysis}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
