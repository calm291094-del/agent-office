// packages/server/index.js - Servidor API para Agent Office
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Base de datos en memoria (para pruebas)
let agents = [];
let nextId = 1;
let tasks = [];
let nextTaskId = 1;

// ========== RUTAS DE AGENTES ==========

// Obtener todos los agentes
app.get('/api/agents', (req, res) => {
    res.json(agents);
});

// Crear nuevo agente
app.post('/api/agents', (req, res) => {
    const { name, role } = req.body;
    const agent = {
        id: nextId++,
        name: name || 'Agente',
        role: role || 'Asistente',
        status: 'idle',
        icon: '🤖',
        tasks_completed: 0,
        created_at: new Date().toISOString()
    };
    agents.push(agent);
    res.status(201).json(agent);
});

// Obtener un agente específico
app.get('/api/agents/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const agent = agents.find(a => a.id === id);
    if (!agent) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    res.json(agent);
});

// Actualizar agente
app.put('/api/agents/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const agent = agents.find(a => a.id === id);
    if (!agent) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    const { name, role, status } = req.body;
    if (name) agent.name = name;
    if (role) agent.role = role;
    if (status) agent.status = status;
    res.json(agent);
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

// Eliminar agente
app.delete('/api/agents/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = agents.findIndex(a => a.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    agents.splice(index, 1);
    res.json({ message: 'Agente eliminado' });
});

// ========== RUTAS DE TAREAS ==========

// Obtener todas las tareas
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// Crear nueva tarea
app.post('/api/tasks', (req, res) => {
    const { title, description, priority, assigned_to } = req.body;
    const task = {
        id: nextTaskId++,
        title: title || 'Nueva tarea',
        description: description || '',
        priority: priority || 'media',
        status: 'pending',
        assigned_to: assigned_to || null,
        created_at: new Date().toISOString(),
        completed_at: null
    };
    tasks.push(task);
    res.status(201).json(task);
});

// Actualizar tarea
app.put('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (!task) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    const { title, description, priority, status, assigned_to } = req.body;
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (assigned_to !== undefined) task.assigned_to = assigned_to;
    if (status === 'completed') {
        task.completed_at = new Date().toISOString();
    }
    res.json(task);
});

// Completar tarea
app.put('/api/tasks/:id/complete', (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find(t => t.id === id);
    if (!task) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    task.status = 'completed';
    task.completed_at = new Date().toISOString();
    
    // Si la tarea estaba asignada, incrementar el contador del agente
    if (task.assigned_to) {
        const agent = agents.find(a => a.id === task.assigned_to);
        if (agent) {
            agent.tasks_completed = (agent.tasks_completed || 0) + 1;
            agent.status = 'idle';
        }
    }
    res.json(task);
});

// Eliminar tarea
app.delete('/api/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    tasks.splice(index, 1);
    res.json({ message: 'Tarea eliminada' });
});

// ========== RUTAS DE ESTADÍSTICAS ==========

app.get('/api/stats', (req, res) => {
    const totalAgents = agents.length;
    const working = agents.filter(a => a.status === 'working').length;
    const thinking = agents.filter(a => a.status === 'thinking').length;
    const idle = agents.filter(a => a.status === 'idle').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    
    res.json({
        agents: { total: totalAgents, working, thinking, idle },
        tasks: { total: totalTasks, completed: completedTasks, pending: pendingTasks, in_progress: inProgressTasks },
        productivity: totalAgents > 0 ? Math.round((working / totalAgents) * 100) : 0
    });
});

// ========== HEALTH CHECK ==========

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'agent-office-backend',
        version: '1.0.0'
    });
});

// ========== INICIAR SERVIDOR ==========

app.listen(PORT, () => {
    console.log('✅ Agent Office Server en puerto ' + PORT);
    console.log('🌐 http://localhost:' + PORT);
    console.log('📊 Endpoints disponibles:');
    console.log('   GET  /api/agents');
    console.log('   POST /api/agents');
    console.log('   GET  /api/tasks');
    console.log('   POST /api/tasks');
    console.log('   GET  /health');
});
