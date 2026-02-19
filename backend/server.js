const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- Projects ---

app.get('/api/projects', async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*, file_nodes(count), chat_messages(count), knowledge_base(count)')
    .order('last_opened', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Format stats to match frontend expected structure
  const formatted = data.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.created_at,
    lastOpened: p.last_opened,
    stats: {
      filesCount: p.file_nodes?.[0]?.count || 0,
      chatsCount: p.chat_messages?.[0]?.count || 0,
      tasksCount: p.knowledge_base?.[0]?.count || 0
    }
  }));

  res.json(formatted);
});

app.post('/api/projects', async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/projects/:id', async (req, res) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- Project State ---

app.get('/api/projects/:id/state', async (req, res) => {
  const projectId = req.params.id;

  // 1. Get Files
  const { data: files, error: fileError } = await supabase
    .from('file_nodes')
    .select('*')
    .eq('project_id', projectId);

  if (fileError) return res.status(500).json({ error: fileError.message });

  const buildTree = (parentId = null) => {
    return files
      .filter(f => f.parent_id === parentId)
      .map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        path: f.path,
        content: f.content,
        isOpen: f.is_open,
        children: f.type === 'folder' ? buildTree(f.id) : undefined
      }));
  };

  const rootNodes = buildTree(null);

  // 2. Get Knowledge Base
  const { data: kb, error: kbError } = await supabase
    .from('knowledge_base')
    .select('*')
    .eq('project_id', projectId);

  if (kbError) return res.status(500).json({ error: kbError.message });

  const knowledgeBase = JSON.stringify(kb.map(k => ({
    id: k.id,
    title: k.title,
    content: k.content,
    category: k.category,
    updatedAt: k.updated_at
  })));

  // 3. Extract Clipboard from special file
  const clipboardFile = files.find(f => f.name === '.vibecode_clipboard.json');
  let clipboardItems = [];
  if (clipboardFile && clipboardFile.content) {
    try { clipboardItems = JSON.parse(clipboardFile.content); } catch (e) {}
  }

  res.json({ 
    rootNodes: rootNodes.filter(n => n.name !== '.vibecode_clipboard.json'), 
    activeFileId: null, 
    knowledgeBase, 
    clipboardItems 
  });
});

app.post('/api/projects/:id/state', async (req, res) => {
  const projectId = req.params.id;
  const { rootNodes, knowledgeBase, clipboardItems } = req.body;

  // Update last opened
  await supabase.from('projects').update({ last_opened: new Date() }).eq('id', projectId);

  // Save Knowledge Base
  if (knowledgeBase) {
    try {
      const parsedKb = JSON.parse(knowledgeBase);
      await supabase.from('knowledge_base').delete().eq('project_id', projectId);
      if (Array.isArray(parsedKb) && parsedKb.length > 0) {
        await supabase.from('knowledge_base').insert(parsedKb.map(k => ({
          project_id: projectId,
          title: k.title,
          content: k.content,
          category: k.category || 'general'
        })));
      }
    } catch (e) { console.error("KB Save Error", e); }
  }

  // Save Files (Recursive)
  const allNodes = [...(rootNodes || [])];
  if (clipboardItems && clipboardItems.length > 0) {
    allNodes.push({
      id: `clip-${projectId}`,
      name: '.vibecode_clipboard.json',
      type: 'file',
      path: '/.vibecode_clipboard.json',
      content: JSON.stringify(clipboardItems),
      isOpen: false
    });
  }

  const upsertNodes = async (nodes, parentId = null) => {
    for (const node of nodes) {
      await supabase.from('file_nodes').upsert({
        id: node.id,
        project_id: projectId,
        parent_id: parentId,
        name: node.name,
        type: node.type,
        path: node.path,
        content: node.content,
        is_open: node.isOpen || false,
        updated_at: new Date()
      });
      if (node.children && node.children.length > 0) {
        await upsertNodes(node.children, node.id);
      }
    }
  };

  if (allNodes.length > 0) {
    await upsertNodes(allNodes);
  }

  res.json({ success: true });
});

// --- Chat ---

app.get('/api/projects/:id/chat', async (req, res) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('project_id', req.params.id)
    .order('timestamp', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/projects/:id/chat', async (req, res) => {
  const projectId = req.params.id;
  const { messages } = req.body;

  if (Array.isArray(messages)) {
    for (const msg of messages) {
      await supabase.from('chat_messages').upsert({
        id: msg.id,
        project_id: projectId,
        role: msg.role,
        text: msg.text,
        timestamp: new Date(msg.timestamp)
      });
    }
  }

  res.json({ success: true });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Supabase-backed server running at http://0.0.0.0:${port}`);
});
