
export interface SqlFile {
  id: string;
  name: string;
  content: string;
  size: number;
}

export enum ViewMode {
  FILES = 'FILES',
  EDITOR = 'EDITOR',
  CHAT = 'CHAT',
  IDEAS = 'IDEAS',
  PLAN = 'PLAN',
  CLIPBOARD = 'CLIPBOARD'
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean; // For folders
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  metadata?: {
    type?: 'prompt_generated' | 'plan_update';
    relatedTo?: string; // ID of plan node or file
  };
}

// New Interface for Multiple Projects
export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastOpened: Date;
  stats: {
    filesCount: number;
    chatsCount: number;
    tasksCount: number;
  };
}

export type ProjectContext = {
  currentFile?: FileNode;
  allFilesSummary?: string;
  knowledgeBase?: string; // The "Knowledge" of the project
}

// Clipboard & AI Analysis Types
export type ClipboardCategory = 'idea' | 'prompt_tool' | 'prompt_helper' | 'link_tool' | 'link_article' | 'link_video' | 'video_tutorial' | 'irrelevant';

export interface ClipboardItem {
  id: string;
  content: string;
  type: ClipboardCategory;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
  timestamp: Date;
  pipelineStage?: 'backend' | 'frontend' | 'design' | 'deployment' | 'planning';
  metadata?: {
    url?: string;
    toolName?: string;
  };
  linkedPlanNodeId?: string; // Visual link
}

export interface SavedPrompt {
  id: string;
  content: string;
  category: 'backend' | 'frontend' | 'design' | 'general';
  createdAt: Date;
  chatMessageId?: string; // Link to where it was generated
  planPhaseId?: string; // Link to plan
}

// Plan Types
export interface PlanNode {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  type: 'feature' | 'structure' | 'task';
  children?: PlanNode[];
  linkedItems?: string[]; // IDs of linked clipboard items or prompts
}

// Idea Types
export interface IdeaSession {
  id: string;
  title: string;
  description: string;
  impactAnalysis: string; // How it affects the project
  implementationPlan: string;
  status: 'draft' | 'approved' | 'rejected';
}