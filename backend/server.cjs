const express = require('express');
const cors = require('cors');
const prisma = require('./db.cjs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Projects ---
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { lastOpened: 'desc' },
      include: {
        _count: {
          select: { files: true, chats: true, plans: true },
        },
      },
    });

    const formatted = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
      lastOpened: p.lastOpened,
      stats: {
        filesCount: p._count.files,
        chatsCount: p._count.chats,
        tasksCount: p._count.plans,
      },
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { id, name, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const project = await prisma.project.create({
      data: {
        ...(id ? { id } : {}),
        name: String(name).trim(),
        description: description || null,
      },
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Project State ---
app.get('/api/projects/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const files = await prisma.fileNode.findMany({ where: { projectId: id } });

    const buildTree = (parentId = null) =>
      files
        .filter((f) => f.parentId === parentId)
        .map((f) => ({
          ...f,
          children: f.type === 'folder' ? buildTree(f.id) : undefined,
        }));

    const rootNodes = buildTree(null);

    const kbEntries = await prisma.knowledgeBase.findMany({ where: { projectId: id } });
    const knowledgeBase = JSON.stringify(
      kbEntries.map((k) => ({
        id: k.id,
        title: k.title,
        content: k.content,
        category: k.category,
        updatedAt: k.updatedAt,
      }))
    );

    const clipboardFile = files.find((f) => f.name === '.vibecode_clipboard.json');
    let clipboardItems = [];
    if (clipboardFile?.content) {
      try {
        clipboardItems = JSON.parse(clipboardFile.content);
      } catch {
        clipboardItems = [];
      }
    }

    res.json({
      rootNodes: rootNodes.filter((n) => n.name !== '.vibecode_clipboard.json'),
      activeFileId: null,
      knowledgeBase,
      clipboardItems,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects/:id/state', async (req, res) => {
  try {
    const { id } = req.params;
    const { rootNodes, knowledgeBase, clipboardItems } = req.body;

    await prisma.project.update({
      where: { id },
      data: { lastOpened: new Date() },
    });

    if (knowledgeBase) {
      try {
        const parsedKb = JSON.parse(knowledgeBase);
        await prisma.knowledgeBase.deleteMany({ where: { projectId: id } });
        if (Array.isArray(parsedKb) && parsedKb.length > 0) {
          await prisma.knowledgeBase.createMany({
            data: parsedKb.map((k) => ({
              projectId: id,
              title: k.title || 'Untitled',
              content: k.content || '',
              category: k.category || 'general',
            })),
          });
        }
      } catch (e) {
        console.error('KB Error', e);
      }
    }

    const nodesToSave = [...(rootNodes || [])];
    if (Array.isArray(clipboardItems)) {
      nodesToSave.push({
        id: `clipboard-persistence-node-${id}`,
        name: '.vibecode_clipboard.json',
        type: 'file',
        path: '/.vibecode_clipboard.json',
        content: JSON.stringify(clipboardItems),
        isOpen: false,
      });
    }

    const persistedIds = new Set();

    const saveNodes = async (nodes, parentId = null) => {
      for (const node of nodes) {
        const saved = await prisma.fileNode.upsert({
          where: { id: node.id },
          update: {
            parentId,
            name: node.name,
            content: node.content || null,
            isOpen: Boolean(node.isOpen),
            path: node.path,
            type: node.type,
            updatedAt: new Date(),
          },
          create: {
            id: node.id,
            projectId: id,
            parentId,
            name: node.name,
            type: node.type,
            path: node.path,
            content: node.content || null,
            isOpen: Boolean(node.isOpen),
          },
        });

        persistedIds.add(saved.id);

        if (Array.isArray(node.children) && node.children.length > 0) {
          await saveNodes(node.children, saved.id);
        }
      }
    };

    await saveNodes(nodesToSave);

    await prisma.fileNode.deleteMany({
      where: {
        projectId: id,
        id: { notIn: Array.from(persistedIds) },
      },
    });

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
      orderBy: { timestamp: 'asc' },
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

    for (const msg of messages || []) {
      const exists = await prisma.chatMessage.findUnique({ where: { id: msg.id } });
      if (!exists) {
        await prisma.chatMessage.create({
          data: {
            id: msg.id,
            projectId,
            role: msg.role,
            text: msg.text,
            timestamp: new Date(msg.timestamp),
          },
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
