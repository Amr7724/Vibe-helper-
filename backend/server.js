
const express = require('express');
const cors = require('cors');
const prisma = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- Projects ---

// Get All Projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { lastOpened: 'desc' },
      include: {
        _count: {
          select: { files: true, chats: true, plans: true }
        }
      }
    });
    
    const formatted = projects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      lastOpened: p.lastOpened,
      stats: {
        filesCount: p._count.files,
        chatsCount: p._count.chats,
        tasksCount: p._count.plans
      }
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Project
app.post('/api/projects', async (req, res) => {
  try {
    const { name } = req.body;
    const project = await prisma.project.create({
      data: { name }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Transactional delete would be better, but cascading deletes in Prisma schema usually handle this
    await prisma.project.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Project State (Load) ---
app.get('/api/projects/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Load Files
    const files = await prisma.fileNode.findMany({ where: { projectId: id } });
    
    const buildTree = (parentId = null) => {
      return files
        .filter(f => f.parentId === parentId)
        .map(f => ({
          ...f,
          children: f.type === 'folder' ? buildTree(f.id) : undefined
        }));
    };
    
    const rootNodes = buildTree(null);
    
    // Load Knowledge Base
    const kbEntries = await prisma.knowledgeBase.findMany({ where: { projectId: id } });
    const knowledgeBase = JSON.stringify(kbEntries.map(k => ({
      id: k.id,
      title: k.title,
      content: k.content,
      category: k.category,
      updatedAt: k.updatedAt
    })));

    // Load Clipboard (Stored as a special file node or if you have a table)
    // NOTE: Since we don't have the schema for Clipboard, we will attempt to find a special file named '.vibecode_clipboard.json'
    // This is a workaround to persist clipboard without changing the provided DB Schema blindly.
    const clipboardFile = files.find(f => f.name === '.vibecode_clipboard.json');
    let clipboardItems = [];
    if (clipboardFile && clipboardFile.content) {
        try {
            clipboardItems = JSON.parse(clipboardFile.content);
        } catch (e) {}
    }

    res.json({ rootNodes: rootNodes.filter(n => n.name !== '.vibecode_clipboard.json'), activeFileId: null, knowledgeBase, clipboardItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Project State (Save) ---
app.post('/api/projects/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const { rootNodes, knowledgeBase, clipboardItems } = req.body;

    // 1. Update Metadata
    await prisma.project.update({
      where: { id },
      data: { lastOpened: new Date() }
    });

    // 2. Save Knowledge Base
    if (knowledgeBase) {
      try {
        const parsedKb = JSON.parse(knowledgeBase);
        await prisma.knowledgeBase.deleteMany({ where: { projectId: id } });
        if (Array.isArray(parsedKb)) {
            await prisma.knowledgeBase.createMany({
                data: parsedKb.map(k => ({
                    projectId: id,
                    title: k.title,
                    content: k.content,
                    category: k.category || 'general'
                }))
            });
        }
      } catch (e) { console.error("KB Error", e); }
    }

    // 3. Save Files
    // Inject Clipboard as a hidden file to persist it
    let nodesToSave = [...(rootNodes || [])];
    if (clipboardItems) {
        nodesToSave.push({
            id: 'clipboard-persistence-node',
            name: '.vibecode_clipboard.json',
            type: 'file',
            path: '/.vibecode_clipboard.json',
            content: JSON.stringify(clipboardItems),
            isOpen: false
        });
    }

    const saveNodes = async (nodes, parentId = null) => {
      for (const node of nodes) {
        await prisma.fileNode.upsert({
          where: { id: node.id },
          update: {
            name: node.name,
            content: node.content,
            isOpen: node.isOpen || false,
            updatedAt: new Date()
          },
          create: {
            id: node.id,
            projectId: id,
            parentId: parentId,
            name: node.name,
            type: node.type,
            path: node.path,
            content: node.content,
            isOpen: node.isOpen || false
          }
        });
        
        if (node.children && node.children.length > 0) {
          await saveNodes(node.children, saved.id);
        }
      }
    };

    if (nodesToSave.length > 0) {
       await saveNodes(nodesToSave);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- Chat History ---
app.get('/api/projects/:id/chat', async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { projectId: req.params.id },
      orderBy: { timestamp: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const projectId = req.params.id;
    
    // Simple sync: create messages that don't exist
    for (const msg of messages) {
        const exists = await prisma.chatMessage.findUnique({ where: { id: msg.id } });
        if (!exists) {
            await prisma.chatMessage.create({
                data: {
                    id: msg.id,
                    projectId,
                    role: msg.role,
                    text: msg.text,
                    timestamp: new Date(msg.timestamp)
                }
            });
        }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
