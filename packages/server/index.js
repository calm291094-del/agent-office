// server.js - Servidor de Agent Office
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Estado de los agentes
let agents = [];

// Crear un agente
app.post('/api/agents', (req, res) => {
    const { name, role } = req.body;
    const newAgent = {
        id: 'agent-' + Date.now(),
        name: name || 'Agente',
        role: role || 'Assistant',
        status: 'idle',
        created_at: new Date().toISOString()
    };
    agents.push(newAgent);
    res.json(newAgent);
});

// Obtener todos los agentes
app.get('/api/agents', (req, res) => {
    res.json(agents);
});

// Asignar tarea a un agente
app.post('/api/tasks', (req, res) => {
    const { agentId, description } = req.body;
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    const task = {
        id: 'task-' + Date.now(),
        agentId,
        description,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    agent.status = 'working';
    res.json({ message: 'Tarea asignada', task });
});

// Obtener tareas
app.get('/api/tasks', (req, res) => {
    res.json({ tasks: [] });
});

app.listen(PORT, () => {
    console.log(`✅ Agent Office Server en puerto ${PORT}`);
});
