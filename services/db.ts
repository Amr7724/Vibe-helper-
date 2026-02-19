import { FileNode, ChatMessage, ProjectMetadata, ClipboardItem } from "../types";

// Configuration - Use relative /api for production or proxy
const API_URL = '/api'; 
const USE_API = true;

// --- IndexedDB Fallback ---
const DB_NAME = 'AutoCoderDB';
const DB_VERSION = 4;
const STORE_PROJECTS = 'projects_meta';
const STORE_FILES = 'files_store';
const STORE_CHAT = 'chat_store';

interface ProjectData {
  projectId: string; 
  rootNodes: FileNode[];
  activeFileId: string | null;
  knowledgeBase?: string;
  clipboardItems?: ClipboardItem[];
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_FILES)) db.createObjectStore(STORE_FILES, { keyPath: 'projectId' });
      if (!db.objectStoreNames.contains(STORE_CHAT)) db.createObjectStore(STORE_CHAT, { keyPath: 'projectId' });
    };
  });
};

// --- Projects Management ---

export const saveProjectMetadata = async (project: ProjectMetadata) => {
  if (USE_API) {
      // Handled via state updates usually, but can be a direct project PUT if needed
      return;
  }
  const db = await initDB();
  const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
  transaction.objectStore(STORE_PROJECTS).put(project);
};

export const getAllProjects = async (): Promise<ProjectMetadata[]> => {
  if (USE_API) {
      try {
          const res = await fetch(`${API_URL}/projects`);
          if (res.ok) return await res.json();
          throw new Error(`API Error: ${res.status}`);
      } catch (e) {
          console.warn("Backend API unavailable, falling back to local DB", e);
      }
  }
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readonly');
    const request = transaction.objectStore(STORE_PROJECTS).getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
};

export const deleteProject = async (projectId: string) => {
  if (USE_API) {
      try {
        await fetch(`${API_URL}/projects/${projectId}`, { method: 'DELETE' });
        return;
      } catch (e) { console.warn("API Delete failed", e); }
  }
  const db = await initDB();
  const transaction = db.transaction([STORE_PROJECTS, STORE_FILES, STORE_CHAT], 'readwrite');
  transaction.objectStore(STORE_PROJECTS).delete(projectId);
  transaction.objectStore(STORE_FILES).delete(projectId);
  transaction.objectStore(STORE_CHAT).delete(projectId);
};

// --- Project Data ---

export const saveProjectState = async (
  projectId: string, 
  rootNodes: FileNode[], 
  activeFileId: string | null, 
  knowledgeBase: string,
  clipboardItems: ClipboardItem[] = [] 
) => {
  if (USE_API) {
     try {
       const res = await fetch(`${API_URL}/projects/${projectId}/state`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ rootNodes, knowledgeBase, clipboardItems })
       });
       if (res.ok) return;
     } catch (e) { console.warn("API Save State failed", e); }
  }
  const db = await initDB();
  const transaction = db.transaction([STORE_FILES], 'readwrite');
  transaction.objectStore(STORE_FILES).put({ projectId, rootNodes, activeFileId, knowledgeBase, clipboardItems });
};

export const loadProjectState = async (projectId: string): Promise<ProjectData | null> => {
  if (USE_API) {
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}/state`);
        if (res.ok) return await res.json();
      } catch (e) { console.warn("API Load State failed", e); }
  }
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_FILES], 'readonly');
    const request = transaction.objectStore(STORE_FILES).get(projectId);
    request.onsuccess = () => resolve(request.result || null);
  });
};

// --- Chat History ---

export const saveChatHistory = async (projectId: string, messages: ChatMessage[]) => {
  if (USE_API) {
      try {
        await fetch(`${API_URL}/projects/${projectId}/chat`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ messages })
       });
       return;
      } catch(e) { console.warn("API Save Chat failed", e); }
  }
  const db = await initDB();
  const transaction = db.transaction([STORE_CHAT], 'readwrite');
  transaction.objectStore(STORE_CHAT).put({ projectId, messages });
};

export const loadChatHistory = async (projectId: string): Promise<ChatMessage[]> => {
  if (USE_API) {
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}/chat`);
        if (res.ok) {
            const msgs = await res.json();
            return msgs.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }));
        }
      } catch (e) { console.warn("API Load Chat failed", e); }
  }
  const db = await initDB();
  return new Promise((resolve) => {
    const transaction = db.transaction([STORE_CHAT], 'readonly');
    const request = transaction.objectStore(STORE_CHAT).get(projectId);
    request.onsuccess = () => resolve(request.result?.messages || []);
  });
};
