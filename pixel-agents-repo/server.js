// pixel-agents-repo/server.js - Servidor completo para Pixel Agents
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());

// ============================================================
// BASE DE DATOS EN MEMORIA (AGENTES)
// ============================================================
let agents = [
    { id: 1, name: 'Ana', role: 'CEO', status: 'working', icon: '👩‍💼', color: '#8b5cf6' },
    { id: 2, name: 'Carlos', role: 'Desarrollador', status: 'thinking', icon: '👨‍💻', color: '#3b82f6' },
    { id: 3, name: 'Marta', role: 'Diseñadora', status: 'idle', icon: '🎨', color: '#ec4899' },
    { id: 4, name: 'Luis', role: 'Marketing', status: 'working', icon: '📊', color: '#f59e0b' },
    { id: 5, name: 'Sofía', role: 'Soporte', status: 'idle', icon: '💁‍♀️', color: '#10b981' },
];
let nextId = 6;

// ============================================================
// RUTAS API
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'pixel-agents-server',
        version: '1.0.0',
        agents_count: agents.length
    });
});

// Obtener todos los agentes
app.get('/api/agents', (req, res) => {
    res.json(agents);
});

// Crear nuevo agente
app.post('/api/agents', (req, res) => {
    const { name, role } = req.body;
    const newAgent = {
        id: nextId++,
        name: name || 'Agente',
        role: role || 'Asistente',
        status: 'idle',
        icon: '🤖',
        color: '#8b5cf6',
        created_at: new Date().toISOString()
    };
    agents.push(newAgent);
    res.status(201).json(newAgent);
});

// Cambiar estado del agente
app.put('/api/agents/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const agent = agents.find(a => a.id === id);
    if (!agent) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    agent.status = status;
    res.json(agent);
});

// ============================================================
// SERVIDOR DE ARCHIVOS ESTÁTICOS (UI)
// ============================================================

// Servir la UI
const uiPath = path.join(__dirname, 'webview-ui/dist');
app.use(express.static(uiPath));

// Ruta para la UI
app.get('/', (req, res) => {
    res.sendFile(path.join(uiPath, 'index.html'));
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log(`✅ Pixel Agents Server en puerto ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📊 ${agents.length} agentes cargados`);
});
