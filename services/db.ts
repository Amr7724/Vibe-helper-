
import { FileNode, ChatMessage, ProjectMetadata, ClipboardItem } from "../types";

// Configuration
const API_URL = 'http://localhost:3001/api';
const USE_API = true; // Enabled to connect to Supabase via backend

// --- IndexedDB Fallback Implementation ---
const DB_NAME = 'AutoCoderDB';
const DB_VERSION = 4; // Incremented for clipboard support
const STORE_PROJECTS = 'projects_meta';
const STORE_FILES = 'files_store';
const STORE_CHAT = 'chat_store';

interface ProjectData {
  projectId: string; 
  rootNodes: FileNode[];
  activeFileId: string | null;
  knowledgeBase?: string;
  clipboardItems?: ClipboardItem[]; // Added clipboard persistence
}

interface ChatData {
  projectId: string; 
  messages: ChatMessage[];
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
      // In this demo, metadata is handled by creation/state updates usually.
      // If we were to save it explicitly:
      /*
      try {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST', body: JSON.stringify(project) 
        });
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return;
      } catch (e) {
        console.warn("API Metadata save failed, falling back", e);
      }
      */
      return;
  }
  
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readwrite');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.put(project);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllProjects = async (): Promise<ProjectMetadata[]> => {
  if (USE_API) {
      try {
          const res = await fetch(`${API_URL}/projects`);
          if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
          return await res.json();
      } catch (e) {
          console.warn("Backend API unavailable, falling back to local DB", e);
      }
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS], 'readonly');
    const store = transaction.objectStore(STORE_PROJECTS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const deleteProject = async (projectId: string) => {
  if (USE_API) {
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return;
      } catch (e) {
        console.warn("API Delete failed, trying local", e);
      }
  }

  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_PROJECTS, STORE_FILES, STORE_CHAT], 'readwrite');
    transaction.objectStore(STORE_PROJECTS).delete(projectId);
    transaction.objectStore(STORE_FILES).delete(projectId);
    transaction.objectStore(STORE_CHAT).delete(projectId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// --- Project Data (Files & State) ---

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
       if (!res.ok) throw new Error(`Status: ${res.status}`);
       return;
     } catch (e) {
       console.warn("API Save State failed, falling back to local", e);
     }
  }

  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_FILES], 'readwrite');
    const store = transaction.objectStore(STORE_FILES);
    const data: ProjectData = { projectId, rootNodes, activeFileId, knowledgeBase, clipboardItems };
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const loadProjectState = async (projectId: string): Promise<ProjectData | null> => {
  if (USE_API) {
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}/state`);
        if (res.ok) {
            const data = await res.json();
            return {
                projectId,
                rootNodes: data.rootNodes,
                activeFileId: null,
                knowledgeBase: data.knowledgeBase,
                clipboardItems: data.clipboardItems || []
            };
        } else {
             throw new Error(`Status: ${res.status}`);
        }
      } catch (e) {
        console.warn("API Load State failed, trying local", e);
      }
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_FILES], 'readonly');
    const store = transaction.objectStore(STORE_FILES);
    const request = store.get(projectId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// --- Chat History ---

export const saveChatHistory = async (projectId: string, messages: ChatMessage[]) => {
  if (USE_API) {
      try {
        const res = await fetch(`${API_URL}/projects/${projectId}/chat`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ messages })
       });
       if (!res.ok) throw new Error(`Status: ${res.status}`);
       return;
      } catch(e) {
        console.warn("API Save Chat failed, falling back to local", e);
      }
  }

  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_CHAT], 'readwrite');
    const store = transaction.objectStore(STORE_CHAT);
    const data: ChatData = { projectId, messages };
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
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
        } else {
             throw new Error(`Status: ${res.status}`);
        }
      } catch (e) {
        console.warn("API Load Chat failed, trying local", e);
      }
  }

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_CHAT], 'readonly');
    const store = transaction.objectStore(STORE_CHAT);
    const request = store.get(projectId);
    request.onsuccess = () => resolve(request.result?.messages || []);
    request.onerror = () => reject(request.error);
  });
};
