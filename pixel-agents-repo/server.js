const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ============================================================
// BASE DE DATOS EN MEMORIA
// ============================================================
let agents = [
    { id: 1, name: 'Ana', role: 'CEO', status: 'working', icon: '👩‍💼', color: '#8b5cf6', x: 150, y: 150 },
    { id: 2, name: 'Carlos', role: 'Dev', status: 'thinking', icon: '👨‍💻', color: '#3b82f6', x: 350, y: 150 },
    { id: 3, name: 'Marta', role: 'Design', status: 'idle', icon: '🎨', color: '#ec4899', x: 550, y: 150 },
    { id: 4, name: 'Luis', role: 'Marketing', status: 'working', icon: '📊', color: '#f59e0b', x: 150, y: 350 },
    { id: 5, name: 'Sofía', role: 'Support', status: 'idle', icon: '💁‍♀️', color: '#10b981', x: 350, y: 350 }
];
let nextId = 6;

// ============================================================
// SERVIDOR HTTP Y WEBSOCKET
// ============================================================
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
    console.log('✅ Nuevo cliente WebSocket conectado');
    clients.add(ws);

    ws.send(JSON.stringify({
        type: 'init',
        agents: agents
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('Error procesando mensaje WebSocket:', error);
        }
    });

    ws.on('close', () => {
        console.log('❌ Cliente WebSocket desconectado');
        clients.delete(ws);
    });
});

function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'agent-action':
            const agent = agents.find(a => a.id === data.agentId);
            if (agent) {
                agent.status = data.action;
                broadcastToAll({
                    type: 'agent-update',
                    agent: agent
                });
            }
            break;

        case 'agent-move':
            const movingAgent = agents.find(a => a.id === data.agentId);
            if (movingAgent && data.x !== undefined && data.y !== undefined) {
                movingAgent.x = data.x;
                movingAgent.y = data.y;
                broadcastToAll({
                    type: 'agent-move',
                    agentId: movingAgent.id,
                    x: movingAgent.x,
                    y: movingAgent.y
                });
            }
            break;

        case 'agent-speech':
            broadcastToAll({
                type: 'agent-speech',
                agentId: data.agentId,
                text: data.text
            });
            break;

        default:
            console.log('Tipo de mensaje no manejado:', data.type);
    }
}

function broadcastToAll(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// ============================================================
// RUTAS API
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'pixel-agents-server',
        version: '2.0.0',
        agents_count: agents.length,
        clients_connected: clients.size
    });
});

app.get('/api/agents', (req, res) => {
    res.json(agents);
});

app.post('/api/agents', (req, res) => {
    const { name, role } = req.body;
    const newAgent = {
        id: nextId++,
        name: name || 'Agente',
        role: role || 'Asistente',
        status: 'idle',
        icon: '🤖',
        color: '#8b5cf6',
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        created_at: new Date().toISOString()
    };
    agents.push(newAgent);
    
    broadcastToAll({
        type: 'agent-created',
        agent: newAgent
    });
    
    res.status(201).json(newAgent);
});

app.put('/api/agents/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const agent = agents.find(a => a.id === id);
    if (!agent) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    agent.status = status;
    
    broadcastToAll({
        type: 'agent-update',
        agent: agent
    });
    
    res.json(agent);
});

// ============================================================
// SERVIDOR DE ARCHIVOS ESTÁTICOS
// ============================================================
const uiPath = path.join(__dirname, 'webview-ui/dist');
app.use(express.static(uiPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(uiPath, 'index.html'));
});

// ============================================================
// SIMULACIÓN DE MOVIMIENTO AUTOMÁTICO
// ============================================================
function simulateAgentActivity() {
    if (agents.length === 0 || clients.size === 0) return;

    const randomIndex = Math.floor(Math.random() * agents.length);
    const agent = agents[randomIndex];

    const statuses = ['idle', 'working', 'thinking'];
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    agent.status = newStatus;

    const newX = Math.max(50, Math.min(750, agent.x + (Math.random() - 0.5) * 60));
    const newY = Math.max(50, Math.min(550, agent.y + (Math.random() - 0.5) * 60));
    agent.x = newX;
    agent.y = newY;

    broadcastToAll({
        type: 'agent-move',
        agentId: agent.id,
        x: agent.x,
        y: agent.y
    });

    broadcastToAll({
        type: 'agent-update',
        agent: agent
    });
}

setInterval(simulateAgentActivity, 5000);

// ============================================================
// INICIAR SERVIDOR
// ============================================================
server.listen(PORT, () => {
    console.log(`✅ Pixel Agents Server en puerto ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📊 ${agents.length} agentes cargados`);
    console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}/ws`);
});
