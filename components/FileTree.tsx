import React from 'react';
import { 
  Folder, FolderOpen, FileCode, FileText, ChevronRight, ChevronDown, 
  Image, FileJson, Database, Layout, Settings, FileSpreadsheet, 
  FileAudio, FileVideo, Terminal, Box, GitBranch, Lock, Info, Coffee, Shield, Eye
} from 'lucide-react';
import { FileNode } from '../types';

interface FileTreeProps {
  nodes: FileNode[];
  selectedFileId: string | null;
  onSelectFile: (node: FileNode) => void;
  onToggleFolder: (nodeId: string) => void;
  depth?: number;
}

const getFileIcon = (filename: string) => {
  const lowerName = filename.toLowerCase();
  const ext = lowerName.split('.').pop();
  
  // Specific full filenames
  if (lowerName === 'dockerfile') return <Box className="w-4 h-4 text-blue-400" />;
  if (lowerName === 'package.json') return <FileJson className="w-4 h-4 text-green-500" />;
  if (lowerName === 'package-lock.json' || lowerName === 'yarn.lock' || lowerName === 'pnpm-lock.yaml') return <Lock className="w-4 h-4 text-yellow-600" />;
  if (lowerName === 'tsconfig.json' || lowerName === 'jsconfig.json') return <FileCode className="w-4 h-4 text-blue-500" />;
  if (lowerName.startsWith('.git')) return <GitBranch className="w-4 h-4 text-orange-400" />;
  if (lowerName === '.env' || lowerName.startsWith('.env.')) return <Shield className="w-4 h-4 text-yellow-500" />;
  if (lowerName === 'readme.md') return <Info className="w-4 h-4 text-blue-300" />;
  if (lowerName === 'license' || lowerName === 'license.txt') return <FileText className="w-4 h-4 text-yellow-400" />;
  if (lowerName.includes('eslint') || lowerName.includes('prettier')) return <Settings className="w-4 h-4 text-purple-400" />;
  if (lowerName === 'vercel.json' || lowerName === 'netlify.toml') return <Settings className="w-4 h-4 text-white" />;
  
  switch (ext) {
    // Images
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
    case 'bmp':
    case 'tiff':
      return <Image className="w-4 h-4 text-purple-400" />;
    
    // Web - HTML
    case 'html':
    case 'htm':
      return <Layout className="w-4 h-4 text-orange-500" />;
    
    // Web - CSS
    case 'css':
    case 'scss':
    case 'less':
    case 'sass':
      return <Layout className="w-4 h-4 text-blue-400" />;
    
    // JS/TS
    case 'js':
    case 'jsx':
    case 'cjs':
    case 'mjs':
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-500" />;
    case 'vue':
    case 'svelte':
      return <FileCode className="w-4 h-4 text-green-500" />;
    case 'java':
      return <Coffee className="w-4 h-4 text-red-500" />;
      
    // Backend/System
    case 'py':
    case 'pyc':
    case 'ipynb':
      return <FileCode className="w-4 h-4 text-blue-300" />; // Python
    case 'jar':
    case 'class':
      return <FileCode className="w-4 h-4 text-red-500" />; // Java
    case 'rb':
      return <FileCode className="w-4 h-4 text-red-600" />; // Ruby
    case 'php':
      return <FileCode className="w-4 h-4 text-indigo-400" />; // PHP
    case 'go':
      return <FileCode className="w-4 h-4 text-cyan-400" />; // Go
    case 'rs':
      return <FileCode className="w-4 h-4 text-orange-600" />; // Rust
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
      return <FileCode className="w-4 h-4 text-blue-600" />; // C/C++
    case 'cs':
      return <FileCode className="w-4 h-4 text-purple-600" />; // C#
    case 'swift':
      return <FileCode className="w-4 h-4 text-orange-500" />; // Swift

    // Shell / Scripts
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'bat':
    case 'ps1':
    case 'cmd':
      return <Terminal className="w-4 h-4 text-green-400" />;

    // Data
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-300" />;
    case 'xml':
      return <FileCode className="w-4 h-4 text-orange-300" />;
    case 'yaml':
    case 'yml':
      return <Settings className="w-4 h-4 text-purple-300" />;
    case 'sql':
    case 'db':
    case 'sqlite':
    case 'pgsql':
      return <Database className="w-4 h-4 text-blue-300" />;
    case 'csv':
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
    
    // Config / System
    case 'env':
    case 'config':
    case 'ini':
    case 'toml':
      return <Settings className="w-4 h-4 text-slate-400" />;
    case 'gitignore':
    case 'dockerignore':
      return <GitBranch className="w-4 h-4 text-red-400" />;
    case 'lock':
      return <Lock className="w-4 h-4 text-yellow-600" />;
      
    // Media
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return <FileAudio className="w-4 h-4 text-pink-400" />;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
    case 'webm':
      return <FileVideo className="w-4 h-4 text-red-400" />;

    // Text/Docs
    case 'md':
      return <Info className="w-4 h-4 text-blue-200" />;
    case 'txt':
    case 'log':
      return <FileText className="w-4 h-4 text-slate-400" />;
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-500" />;
      
    default:
      return <FileText className="w-4 h-4 text-slate-500" />;
  }
};

export const FileTree: React.FC<FileTreeProps> = ({ 
  nodes, 
  selectedFileId, 
  onSelectFile, 
  onToggleFolder,
  depth = 0 
}) => {
  return (
    <ul className="flex flex-col select-none">
      {nodes.map((node) => {
        const isSelected = node.id === selectedFileId;
        
        return (
          <li key={node.id}>
            <div 
              className={`
                flex items-center gap-2 py-1.5 px-3 cursor-pointer text-sm transition-all duration-150 border-l-[3px]
                ${isSelected 
                  ? 'bg-white/10 border-primary-400 text-white font-medium backdrop-blur-md shadow-sm' 
                  : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/20'}
              `}
              style={{ paddingRight: `${depth * 16 + 12}px` }}
              onClick={() => node.type === 'folder' ? onToggleFolder(node.id) : onSelectFile(node)}
            >
              <span className="opacity-70 flex-shrink-0">
                {node.type === 'folder' ? (
                   node.isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                ) : (
                  <span className="w-4 block"></span>
                )}
              </span>
              
              <span className="flex-shrink-0">
                {node.type === 'folder' ? (
                  node.isOpen ? <FolderOpen className="w-4 h-4 text-primary-400" /> : <Folder className="w-4 h-4 text-primary-400" />
                ) : (
                  getFileIcon(node.name)
                )}
              </span>
              
              <span className="truncate" dir="ltr">{node.name}</span>
            </div>

            {node.type === 'folder' && node.isOpen && node.children && (
              <FileTree 
                nodes={node.children} 
                selectedFileId={selectedFileId} 
                onSelectFile={onSelectFile} 
                onToggleFolder={onToggleFolder}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
};