// UI Server - Agent Office Completo
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ============================================================
// 📦 BASE DE DATOS EN MEMORIA
// ============================================================
let agents = [];
let tasks = [];
let chatHistory = [];
let nextAgentId = 1;
let nextTaskId = 1;

// Agentes predefinidos para la oficina
const agentTemplates = [
    { name: 'Ana', role: 'CEO', icon: '👩‍💼', color: '#8b5cf6' },
    { name: 'Carlos', role: 'Desarrollador', icon: '👨‍💻', color: '#3b82f6' },
    { name: 'Marta', role: 'Diseñadora', icon: '🎨', color: '#ec4899' },
    { name: 'Luis', role: 'Marketing', icon: '📊', color: '#f59e0b' },
    { name: 'Sofía', role: 'Soporte', icon: '💁‍♀️', color: '#10b981' },
    { name: 'Javier', role: 'DevOps', icon: '🔧', color: '#ef4444' },
];

// Crear agentes iniciales
agentTemplates.forEach((template, index) => {
    agents.push({
        id: nextAgentId++,
        name: template.name,
        role: template.role,
        icon: template.icon,
        color: template.color,
        status: 'idle',
        energy: 100,
        tasks_completed: 0,
        current_task: null,
        x: 50 + (index * 80) % 400,
        y: 50 + Math.floor(index / 4) * 80,
        created_at: new Date().toISOString()
    });
});

// Tareas predefinidas
const taskTemplates = [
    { title: 'Revisar código', description: 'Revisar el código del proyecto', priority: 'alta' },
    { title: 'Diseñar interfaz', description: 'Diseñar la nueva interfaz de usuario', priority: 'media' },
    { title: 'Escribir documentación', description: 'Actualizar la documentación técnica', priority: 'baja' },
    { title: 'Optimizar rendimiento', description: 'Mejorar la velocidad de la aplicación', priority: 'alta' },
    { title: 'Corregir bugs', description: 'Arreglar los errores reportados', priority: 'alta' },
    { title: 'Reunión de equipo', description: 'Coordinar con el equipo de desarrollo', priority: 'media' },
];

// ============================================================
// 🗺️ FUNCIONES DE LA OFICINA
// ============================================================

// Mover agente aleatoriamente por la oficina
function moverAgente(agent) {
    const deltaX = (Math.random() - 0.5) * 30;
    const deltaY = (Math.random() - 0.5) * 30;
    agent.x = Math.max(10, Math.min(470, agent.x + deltaX));
    agent.y = Math.max(10, Math.min(470, agent.y + deltaY));
}

// Cambiar estado del agente
function cambiarEstadoAgente(agent, nuevoEstado) {
    const estados = ['idle', 'working', 'thinking', 'meeting'];
    if (estados.includes(nuevoEstado)) {
        agent.status = nuevoEstado;
        agent.last_change = new Date().toISOString();
        
        if (nuevoEstado === 'working' && !agent.current_task) {
            // Asignar tarea automática
            const tareaDisponible = tasks.find(t => t.assigned_to === null);
            if (tareaDisponible) {
                asignarTarea(tareaDisponible.id, agent.id);
            }
        }
        
        if (nuevoEstado === 'idle') {
            agent.current_task = null;
        }
    }
}

// ============================================================
// 🎯 FUNCIONES DE TAREAS
// ============================================================

function asignarTarea(taskId, agentId) {
    const task = tasks.find(t => t.id === taskId);
    const agent = agents.find(a => a.id === agentId);
    
    if (task && agent && !task.assigned_to) {
        task.assigned_to = agentId;
        task.assigned_to_name = agent.name;
        task.status = 'in_progress';
        agent.current_task = taskId;
        agent.status = 'working';
        
        // Registrar en el chat
        chatHistory.push({
            type: 'system',
            message: `📋 Tarea "${task.title}" asignada a ${agent.name}`,
            timestamp: new Date().toISOString()
        });
        
        return true;
    }
    return false;
}

function completarTarea(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'in_progress') {
        task.status = 'completed';
        task.completed_at = new Date().toISOString();
        
        const agent = agents.find(a => a.id === task.assigned_to);
        if (agent) {
            agent.tasks_completed++;
            agent.status = 'idle';
            agent.current_task = null;
            agent.energy = Math.min(100, agent.energy + 10);
            
            chatHistory.push({
                type: 'system',
                message: `✅ ${agent.name} completó la tarea "${task.title}"`,
                timestamp: new Date().toISOString()
            });
        }
        return true;
    }
    return false;
}

// ============================================================
// 💬 FUNCIONES DE IA (Pollinations)
// ============================================================

async function getAIResponse(message, agentName, agentRole) {
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { 
                        role: 'system', 
                        content: `Eres ${agentName}, un ${agentRole} en una oficina. Responde de manera profesional pero amigable. Usa emojis.`
                    },
                    { role: 'user', content: message }
                ],
                model: 'openai'
            })
        });

        if (response.ok) {
            let texto = await response.text();
            texto = texto.replace(/<[^>]*>/g, '').trim();
            if (texto.length > 10) return texto;
        }
    } catch (e) {
        console.error('Error en IA:', e.message);
    }
    
    // Respuestas de respaldo si la IA falla
    const respuestasFallback = [
        `🤖 Hola, soy ${agentName}. ¿En qué puedo ayudarte?`,
        `📝 Entendido, voy a procesar tu solicitud.`,
        `✅ ¡Perfecto! Voy a trabajar en eso.`,
        `💡 Interesante propuesta. Vamos a analizarla.`,
        `☕ Un momento, necesito pensar sobre esto.`,
        `🚀 Excelente idea! La voy a priorizar.`,
        `📊 Voy a revisar los datos y te respondo.`,
        `🎯 Entendido. Voy a enfocarme en eso.`
    ];
    return respuestasFallback[Math.floor(Math.random() * respuestasFallback.length)];
}

// ============================================================
// 🌐 RUTAS API
// ============================================================

// Obtener todos los agentes
app.get('/api/agents', (req, res) => {
    res.json(agents);
});

// Crear nuevo agente
app.post('/api/agents', (req, res) => {
    const { name, role } = req.body;
    const newAgent = {
        id: nextAgentId++,
        name: name || 'Agente',
        role: role || 'Asistente',
        icon: '🤖',
        color: '#8b5cf6',
        status: 'idle',
        energy: 100,
        tasks_completed: 0,
        current_task: null,
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
        created_at: new Date().toISOString()
    };
    agents.push(newAgent);
    
    chatHistory.push({
        type: 'system',
        message: `🎉 Nuevo agente "${newAgent.name}" se ha unido a la oficina`,
        timestamp: new Date().toISOString()
    });
    
    res.status(201).json(newAgent);
});

// Eliminar agente
app.delete('/api/agents/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = agents.findIndex(a => a.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    const agent = agents[index];
    agents.splice(index, 1);
    
    // Liberar tareas del agente
    tasks.forEach(t => {
        if (t.assigned_to === id) {
            t.assigned_to = null;
            t.assigned_to_name = null;
            t.status = 'pending';
        }
    });
    
    chatHistory.push({
        type: 'system',
        message: `👋 ${agent.name} ha dejado la oficina`,
        timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Agente eliminado' });
});

// Cambiar estado del agente
app.put('/api/agents/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const agent = agents.find(a => a.id === id);
    if (!agent) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    cambiarEstadoAgente(agent, status);
    res.json(agent);
});

// Obtener tareas
app.get('/api/tasks', (req, res) => {
    res.json(tasks);
});

// Crear tarea
app.post('/api/tasks', (req, res) => {
    const { title, description, priority } = req.body;
    const newTask = {
        id: nextTaskId++,
        title: title || 'Nueva tarea',
        description: description || '',
        priority: priority || 'media',
        status: 'pending',
        created_at: new Date().toISOString(),
        assigned_to: null,
        assigned_to_name: null,
        completed_at: null
    };
    tasks.push(newTask);
    
    // Intentar asignar automáticamente a un agente libre
    const agenteLibre = agents.find(a => a.status === 'idle' && !a.current_task);
    if (agenteLibre) {
        asignarTarea(newTask.id, agenteLibre.id);
    }
    
    res.status(201).json(newTask);
});

// Asignar tarea a agente
app.put('/api/tasks/:id/assign', (req, res) => {
    const taskId = parseInt(req.params.id);
    const { agentId } = req.body;
    const success = asignarTarea(taskId, agentId);
    if (!success) {
        return res.status(400).json({ error: 'No se pudo asignar la tarea' });
    }
    res.json({ message: 'Tarea asignada' });
});

// Completar tarea
app.put('/api/tasks/:id/complete', (req, res) => {
    const taskId = parseInt(req.params.id);
    const success = completarTarea(taskId);
    if (!success) {
        return res.status(400).json({ error: 'No se pudo completar la tarea' });
    }
    res.json({ message: 'Tarea completada' });
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

// Obtener chat
app.get('/api/chat', (req, res) => {
    res.json(chatHistory.slice(-50)); // Últimos 50 mensajes
});

// Enviar mensaje al chat
app.post('/api/chat', async (req, res) => {
    const { message, agentId } = req.body;
    
    // Buscar agente específico o usar uno aleatorio
    let agent = null;
    if (agentId) {
        agent = agents.find(a => a.id === parseInt(agentId));
    }
    if (!agent) {
        const disponibles = agents.filter(a => a.status !== 'working');
        agent = disponibles.length > 0 ? 
            disponibles[Math.floor(Math.random() * disponibles.length)] : 
            agents[Math.floor(Math.random() * agents.length)];
    }
    
    // Guardar mensaje del usuario
    chatHistory.push({
        type: 'user',
        agentId: null,
        message: message,
        timestamp: new Date().toISOString()
    });
    
    // Obtener respuesta de IA
    const respuesta = await getAIResponse(message, agent.name, agent.role);
    
    // Guardar respuesta del agente
    chatHistory.push({
        type: 'agent',
        agentId: agent.id,
        agentName: agent.name,
        message: respuesta,
        timestamp: new Date().toISOString()
    });
    
    // Cambiar estado del agente
    cambiarEstadoAgente(agent, 'thinking');
    setTimeout(() => {
        if (agent.status === 'thinking') {
            cambiarEstadoAgente(agent, 'idle');
        }
    }, 3000);
    
    res.json({
        agent: agent.name,
        message: respuesta
    });
});

// Estadísticas para gráficas
app.get('/api/stats', (req, res) => {
    const totalAgents = agents.length;
    const working = agents.filter(a => a.status === 'working').length;
    const thinking = agents.filter(a => a.status === 'thinking').length;
    const idle = agents.filter(a => a.status === 'idle').length;
    const meeting = agents.filter(a => a.status === 'meeting').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    
    // Tareas por agente para gráfica
    const agentTasks = agents.map(a => ({
        name: a.name,
        tasks: a.tasks_completed || 0
    }));
    
    res.json({
        agents: {
            total: totalAgents,
            working,
            thinking,
            idle,
            meeting
        },
        tasks: {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            in_progress: inProgressTasks
        },
        agentTasks: agentTasks,
        productivity: totalAgents > 0 ? Math.round((working / totalAgents) * 100) : 0
    });
});

// ============================================================
// 🖥️ UI - Interfaz Principal
// ============================================================

app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏢 Agent Office</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        body { background: #0f172a; color: white; min-height: 100vh; padding: 20px; }
        
        .container { max-width: 1400px; margin: 0 auto; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .header h1 { font-size: 2rem; display: flex; align-items: center; gap: 12px; }
        .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        
        .btn { padding: 8px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
        .btn:hover { transform: scale(1.05); }
        .btn-primary { background: #0d9488; color: white; }
        .btn-primary:hover { background: #0f766e; }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; }
        .btn-warning { background: #f59e0b; color: #0f172a; }
        .btn-warning:hover { background: #d97706; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .btn-purple { background: #8b5cf6; color: white; }
        .btn-purple:hover { background: #7c3aed; }
        
        /* Grid principal */
        .main-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
        @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } }
        
        /* 🗺️ MAPA DE LA OFICINA */
        .office-map { background: #1e293b; border-radius: 16px; padding: 20px; border: 1px solid #334155; }
        .map-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .map-title h2 { font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
        .map-container { position: relative; background: #0f172a; border-radius: 12px; height: 500px; overflow: hidden; border: 1px solid #334155; }
        
        /* Escritorios en el mapa */
        .desk { position: absolute; width: 40px; height: 40px; background: #334155; border-radius: 8px; border: 2px solid #475569; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; color: #94a3b8; }
        .desk-label { position: absolute; bottom: -18px; font-size: 0.5rem; color: #64748b; white-space: nowrap; }
        
        /* Agentes en el mapa */
        .agent-icon { position: absolute; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; transition: all 0.5s; cursor: pointer; border: 2px solid transparent; }
        .agent-icon:hover { transform: scale(1.2); z-index: 10; }
        .agent-icon.idle { border-color: #475569; }
        .agent-icon.working { border-color: #10b981; animation: pulse-green 1.5s infinite; }
        .agent-icon.thinking { border-color: #f59e0b; animation: pulse-yellow 1s infinite; }
        .agent-icon.meeting { border-color: #8b5cf6; animation: pulse-purple 1.5s infinite; }
        
        @keyframes pulse-green { 0%, 100% { box-shadow: 0 0 10px #10b981; } 50% { box-shadow: 0 0 30px #10b981; } }
        @keyframes pulse-yellow { 0%, 100% { box-shadow: 0 0 10px #f59e0b; } 50% { box-shadow: 0 0 30px #f59e0b; } }
        @keyframes pulse-purple { 0%, 100% { box-shadow: 0 0 10px #8b5cf6; } 50% { box-shadow: 0 0 30px #8b5cf6; } }
        
        .agent-tooltip { display: none; position: absolute; background: #1e293b; padding: 8px 12px; border-radius: 8px; font-size: 0.7rem; border: 1px solid #475569; width: 150px; z-index: 20; }
        .agent-icon:hover .agent-tooltip { display: block; bottom: 45px; left: 50%; transform: translateX(-50%); }
        
        /* Panel lateral */
        .sidebar { display: flex; flex-direction: column; gap: 16px; }
        .card { background: #1e293b; border-radius: 16px; padding: 16px; border: 1px solid #334155; }
        .card-title { font-size: 0.9rem; font-weight: 600; color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        
        /* Lista de tareas */
        .task-item { background: #0f172a; border-radius: 8px; padding: 10px; margin-bottom: 8px; border-left: 3px solid #475569; }
        .task-item.priority-alta { border-left-color: #ef4444; }
        .task-item.priority-media { border-left-color: #f59e0b; }
        .task-item.priority-baja { border-left-color: #10b981; }
        .task-item .task-title { font-weight: 600; font-size: 0.85rem; }
        .task-item .task-meta { font-size: 0.7rem; color: #94a3b8; display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
        .task-item .task-actions { margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; }
        
        /* Chat */
        .chat-container { height: 200px; overflow-y: auto; background: #0f172a; border-radius: 8px; padding: 10px; }
        .chat-message { padding: 4px 0; font-size: 0.85rem; border-bottom: 1px solid #1e293b; }
        .chat-message .user { color: #0d9488; font-weight: 600; }
        .chat-message .agent { color: #f59e0b; font-weight: 600; }
        .chat-message .system { color: #94a3b8; font-style: italic; }
        .chat-input-group { display: flex; gap: 8px; margin-top: 8px; }
        .chat-input-group input { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: white; }
        .chat-input-group input:focus { outline: none; border-color: #0d9488; }
        
        /* Gráficas */
        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
        .chart-container { background: #0f172a; border-radius: 8px; padding: 12px; height: 180px; }
        .chart-container canvas { width: 100% !important; height: 100% !important; }
        
        /* Stats */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px; }
        .stat-item { background: #0f172a; border-radius: 8px; padding: 10px; text-align: center; }
        .stat-item .number { font-size: 1.5rem; font-weight: 700; }
        .stat-item .label { font-size: 0.6rem; color: #94a3b8; }
        
        .stat-item.working .number { color: #10b981; }
        .stat-item.thinking .number { color: #f59e0b; }
        .stat-item.idle .number { color: #94a3b8; }
        .stat-item.meeting .number { color: #8b5cf6; }
        
        /* Scrollbar personalizado */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🏢 Agent Office <span style="font-size:0.8rem;color:#94a3b8;">v2.0</span></h1>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="crearAgente()">+ Nuevo Agente</button>
                <button class="btn btn-success" onclick="crearTarea()">+ Nueva Tarea</button>
                <button class="btn btn-warning" onclick="simularActividad()">🎲 Simular Actividad</button>
                <button class="btn btn-purple" onclick="asignarTareasAutomaticas()">🎯 Asignar Tareas</button>
            </div>
        </div>
        
        <!-- Grid Principal -->
        <div class="main-grid">
            <!-- 🗺️ Mapa de la Oficina -->
            <div class="office-map">
                <div class="map-title">
                    <h2>🗺️ Oficina</h2>
                    <span style="font-size:0.7rem;color:#64748b;">Agentes: <span id="agent-count">0</span></span>
                </div>
                <div class="map-container" id="map-container">
                    <!-- Escritorios -->
                    <div class="desk" style="left:80px;top:80px;"><span class="desk-label">💻</span></div>
                    <div class="desk" style="left:200px;top:80px;"><span class="desk-label">💻</span></div>
                    <div class="desk" style="left:320px;top:80px;"><span class="desk-label">💻</span></div>
                    <div class="desk" style="left:80px;top:220px;"><span class="desk-label">💻</span></div>
                    <div class="desk" style="left:200px;top:220px;"><span class="desk-label">💻</span></div>
                    <div class="desk" style="left:320px;top:220px;"><span class="desk-label">💻</span></div>
                    <div class="desk" style="left:80px;top:360px;"><span class="desk-label">💻</span></div>
                    <div class="desk" style="left:200px;top:360px;"><span class="desk-label">💻</span></div>
                    <div class="desk" style="left:320px;top:360px;"><span class="desk-label">💻</span></div>
                    
                    <!-- Sala de reuniones -->
                    <div style="position:absolute;right:20px;top:20px;background:#2d1b4e;border:2px solid #8b5cf6;border-radius:12px;padding:8px 16px;font-size:0.7rem;color:#a78bfa;">
                        🗣️ Sala de Reuniones
                    </div>
                    
                    <!-- Agentes se renderizan aquí -->
                    <div id="agents-map"></div>
                </div>
            </div>
            
            <!-- Sidebar -->
            <div class="sidebar">
                <!-- 📊 Estadísticas -->
                <div class="card">
                    <div class="card-title">📊 Rendimiento</div>
                    <div class="stats-grid" id="stats-grid">
                        <div class="stat-item working"><div class="number" id="working-count">0</div><div class="label">Trabajando</div></div>
                        <div class="stat-item thinking"><div class="number" id="thinking-count">0</div><div class="label">Pensando</div></div>
                        <div class="stat-item idle"><div class="number" id="idle-count">0</div><div class="label">Inactivos</div></div>
                        <div class="stat-item meeting"><div class="number" id="meeting-count">0</div><div class="label">Reunión</div></div>
                    </div>
                    <div class="charts-grid">
                        <div class="chart-container"><canvas id="tasksChart"></canvas></div>
                        <div class="chart-container"><canvas id="agentsChart"></canvas></div>
                    </div>
                </div>
                
                <!-- 🎯 Tareas -->
                <div class="card">
                    <div class="card-title">🎯 Tareas <span style="font-size:0.7rem;color:#64748b;" id="task-count">(0)</span></div>
                    <div id="tasks-list" style="max-height:200px;overflow-y:auto;">
                        <p style="color:#475569;text-align:center;padding:10px;font-size:0.8rem;">No hay tareas</p>
                    </div>
                </div>
                
                <!-- 💬 Chat -->
                <div class="card">
                    <div class="card-title">💬 Chat</div>
                    <div class="chat-container" id="chat-container">
                        <div class="chat-message"><span class="system">🏢 Bienvenido a Agent Office</span></div>
                    </div>
                    <div class="chat-input-group">
                        <input type="text" id="chat-input" placeholder="Mensaje..." onkeypress="if(event.key==='Enter') enviarMensaje()">
                        <button class="btn btn-primary" onclick="enviarMensaje()">Enviar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // ============================================================
        // CONFIGURACIÓN
        // ============================================================
        let agents = [];
        let tasks = [];
        let chatHistory = [];
        let statsInterval = null;
        let moveInterval = null;
        
        // Gráficas
        let tasksChartInstance = null;
        let agentsChartInstance = null;
        
        // ============================================================
        // FUNCIONES API
        // ============================================================
        async function apiRequest(endpoint, options = {}) {
            try {
                const response = await fetch('/api' + endpoint, options);
                if (!response.ok) {
                    throw new Error('Error en la petición');
                }
                return await response.json();
            } catch (error) {
                console.error('Error API:', error);
                throw error;
            }
        }
        
        // ============================================================
        // CARGAR DATOS
        // ============================================================
        async function cargarAgentes() {
            try {
                agents = await apiRequest('/agents');
                renderizarMapa();
                actualizarEstadisticas();
                document.getElementById('agent-count').textContent = agents.length;
            } catch (e) {
                console.error('Error cargando agentes:', e);
            }
        }
        
        async function cargarTareas() {
            try {
                tasks = await apiRequest('/tasks');
                renderizarTareas();
                document.getElementById('task-count').textContent = '(' + tasks.length + ')';
            } catch (e) {
                console.error('Error cargando tareas:', e);
            }
        }
        
        async function cargarChat() {
            try {
                chatHistory = await apiRequest('/chat');
                renderizarChat();
            } catch (e) {
                console.error('Error cargando chat:', e);
            }
        }
        
        async function cargarEstadisticas() {
            try {
                const stats = await apiRequest('/stats');
                actualizarGraficas(stats);
            } catch (e) {
                console.error('Error cargando estadísticas:', e);
            }
        }
        
        // ============================================================
        // 🗺️ RENDERIZAR MAPA
        // ============================================================
        function renderizarMapa() {
            const container = document.getElementById('agents-map');
            if (agents.length === 0) {
                container.innerHTML = '<p style="color:#475569;text-align:center;padding:40px;">No hay agentes en la oficina</p>';
                return;
            }
            
            let html = '';
            agents.forEach(a => {
                html += \`
                    <div class="agent-icon \${a.status}" style="left:\${a.x}px;top:\${a.y}px;background:\${a.color}33;border-color:\${a.color};">
                        \${a.icon}
                        <div class="agent-tooltip">
                            <strong>\${a.name}</strong><br>
                            \${a.role}<br>
                            Estado: \${a.status}<br>
                            Tareas: \${a.tasks_completed}
                            \${a.current_task ? '<br>📋 Tarea en curso' : ''}
                        </div>
                    </div>
                \`;
            });
            container.innerHTML = html;
        }
        
        // ============================================================
        // 📊 ACTUALIZAR ESTADÍSTICAS
        // ============================================================
        function actualizarEstadisticas() {
            const working = agents.filter(a => a.status === 'working').length;
            const thinking = agents.filter(a => a.status === 'thinking').length;
            const idle = agents.filter(a => a.status === 'idle').length;
            const meeting = agents.filter(a => a.status === 'meeting').length;
            
            document.getElementById('working-count').textContent = working;
            document.getElementById('thinking-count').textContent = thinking;
            document.getElementById('idle-count').textContent = idle;
            document.getElementById('meeting-count').textContent = meeting;
        }
        
        // ============================================================
        // 📊 GRÁFICAS CON CHART.JS
        // ============================================================
        function actualizarGraficas(stats) {
            // Gráfica de tareas
            const tasksCtx = document.getElementById('tasksChart').getContext('2d');
            if (tasksChartInstance) tasksChartInstance.destroy();
            tasksChartInstance = new Chart(tasksCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completadas', 'En Progreso', 'Pendientes'],
                    datasets: [{
                        data: [stats.tasks.completed, stats.tasks.in_progress, stats.tasks.pending],
                        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                        borderColor: ['#0f172a', '#0f172a', '#0f172a'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#94a3b8', font: { size: 8 }, boxWidth: 8 }
                        }
                    }
                }
            });
            
            // Gráfica de agentes
            const agentsCtx = document.getElementById('agentsChart').getContext('2d');
            if (agentsChartInstance) agentsChartInstance.destroy();
            agentsChartInstance = new Chart(agentsCtx, {
                type: 'bar',
                data: {
                    labels: stats.agentTasks.map(a => a.name),
                    datasets: [{
                        label: 'Tareas completadas',
                        data: stats.agentTasks.map(a => a.tasks),
                        backgroundColor: '#0d9488',
                        borderColor: '#0f172a',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: '#94a3b8', font: { size: 8 } }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { color: '#94a3b8', font: { size: 8 } },
                            grid: { color: '#1e293b' }
                        },
                        x: {
                            ticks: { color: '#94a3b8', font: { size: 7 } },
                            grid: { color: '#1e293b' }
                        }
                    }
                }
            });
        }
        
        // ============================================================
        // 🎯 RENDERIZAR TAREAS
        // ============================================================
        function renderizarTareas() {
            const container = document.getElementById('tasks-list');
            if (tasks.length === 0) {
                container.innerHTML = '<p style="color:#475569;text-align:center;padding:10px;font-size:0.8rem;">No hay tareas</p>';
                return;
            }
            
            let html = '';
            tasks.forEach(t => {
                const statusText = t.status === 'completed' ? '✅' :
                                   t.status === 'in_progress' ? '🔄' : '📋';
                const assignedText = t.assigned_to_name ? `👤 ${t.assigned_to_name}` : 'Sin asignar';
                html += \`
                    <div class="task-item priority-\${t.priority}">
                        <div class="task-title">\${statusText} \${t.title}</div>
                        <div class="task-meta">
                            <span>\${t.priority}</span>
                            <span>\${assignedText}</span>
                            <span>\${new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="task-actions">
                            \${t.status !== 'completed' ? \`
                                <button class="btn btn-success" style="font-size:0.6rem;padding:2px 8px;" onclick="completarTarea(\${t.id})">✅ Completar</button>
                                <button class="btn btn-warning" style="font-size:0.6rem;padding:2px 8px;" onclick="asignarTarea(\${t.id})">🎯 Asignar</button>
                            \` : ''}
                            <button class="btn btn-danger" style="font-size:0.6rem;padding:2px 8px;" onclick="eliminarTarea(\${t.id})">🗑️</button>
                        </div>
                    </div>
                \`;
            });
            container.innerHTML = html;
        }
        
        // ============================================================
        // 💬 RENDERIZAR CHAT
        // ============================================================
        function renderizarChat() {
            const container = document.getElementById('chat-container');
            let html = '';
            chatHistory.forEach(msg => {
                const cls = msg.type === 'user' ? 'user' :
                           msg.type === 'agent' ? 'agent' : 'system';
                const name = msg.type === 'agent' ? msg.agentName + ':' :
                             msg.type === 'user' ? 'Tú:' : '📢';
                html += \`<div class="chat-message"><span class="\${cls}">\${name}</span> \${msg.message}</div>\`;
            });
            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
        }
        
        // ============================================================
        // 🎯 ACCIONES
        // ============================================================
        
        // Crear agente
        async function crearAgente() {
            const name = prompt('Nombre del agente:');
            if (!name) return;
            const role = prompt('Rol del agente (CEO, Desarrollador, Diseñador, Marketing, Soporte, DevOps):') || 'Asistente';
            try {
                await apiRequest('/agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, role })
                });
                await cargarAgentes();
                await cargarChat();
            } catch (e) {
                alert('Error al crear agente');
            }
        }
        
        // Crear tarea
        async function crearTarea() {
            const title = prompt('Título de la tarea:');
            if (!title) return;
            const priority = prompt('Prioridad (alta/media/baja):', 'media');
            try {
                await apiRequest('/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, priority, description: '' })
                });
                await cargarTareas();
                await cargarEstadisticas();
            } catch (e) {
                alert('Error al crear tarea');
            }
        }
        
        // Completar tarea
        async function completarTarea(taskId) {
            try {
                await apiRequest('/tasks/' + taskId + '/complete', { method: 'PUT' });
                await cargarTareas();
                await cargarAgentes();
                await cargarEstadisticas();
            } catch (e) {
                alert('Error al completar tarea');
            }
        }
        
        // Asignar tarea
        async function asignarTarea(taskId) {
            const agentId = prompt('ID del agente (escribe el número):');
            if (!agentId) return;
            try {
                await apiRequest('/tasks/' + taskId + '/assign', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId: parseInt(agentId) })
                });
                await cargarTareas();
                await cargarAgentes();
                await cargarEstadisticas();
            } catch (e) {
                alert('Error al asignar tarea');
            }
        }
        
        // Eliminar tarea
        async function eliminarTarea(taskId) {
            if (!confirm('¿Eliminar esta tarea?')) return;
            try {
                await apiRequest('/tasks/' + taskId, { method: 'DELETE' });
                await cargarTareas();
            } catch (e) {
                alert('Error al eliminar tarea');
            }
        }
        
        // Enviar mensaje
        async function enviarMensaje() {
            const input = document.getElementById('chat-input');
            const msg = input.value.trim();
            if (!msg) return;
            input.value = '';
            
            try {
                await apiRequest('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg })
                });
                await cargarChat();
                await cargarAgentes();
            } catch (e) {
                alert('Error al enviar mensaje');
            }
        }
        
        // Simular actividad
        async function simularActividad() {
            try {
                // Cambiar estados aleatoriamente
                const statuses = ['idle', 'working', 'thinking', 'meeting'];
                for (const agent of agents) {
                    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                    await apiRequest('/agents/' + agent.id + '/status', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                }
                await cargarAgentes();
                await cargarEstadisticas();
                await cargarChat();
            } catch (e) {
                console.error('Error en simulación:', e);
            }
        }
        
        // Asignar tareas automáticas
        async function asignarTareasAutomaticas() {
            try {
                const tareasPendientes = tasks.filter(t => t.status === 'pending');
                const agentesLibres = agents.filter(a => a.status === 'idle' && !a.current_task);
                
                let asignadas = 0;
                for (const tarea of tareasPendientes) {
                    if (agentesLibres.length === 0) break;
                    const agente = agentesLibres.shift();
                    await apiRequest('/tasks/' + tarea.id + '/assign', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ agentId: agente.id })
                    });
                    asignadas++;
                }
                
                await cargarTareas();
                await cargarAgentes();
                await cargarEstadisticas();
                await cargarChat();
                
                alert('✅ ' + asignadas + ' tareas asignadas automáticamente');
            } catch (e) {
                console.error('Error:', e);
            }
        }
        
        // ============================================================
        // MOVIMIENTO AUTOMÁTICO DE AGENTES
        // ============================================================
        function moverAgentes() {
            // Simular movimiento de agentes en el mapa
            agents.forEach(a => {
                const deltaX = (Math.random() - 0.5) * 10;
                const deltaY = (Math.random() - 0.5) * 10;
                a.x = Math.max(10, Math.min(470, a.x + deltaX));
                a.y = Math.max(10, Math.min(470, a.y + deltaY));
            });
            renderizarMapa();
        }
        
        // ============================================================
        // INICIALIZACIÓN
        // ============================================================
        async function init() {
            await cargarAgentes();
            await cargarTareas();
            await cargarChat();
            await cargarEstadisticas();
            
            // Mover agentes cada 2 segundos
            moveInterval = setInterval(moverAgentes, 2000);
            
            // Actualizar estadísticas cada 5 segundos
            statsInterval = setInterval(async () => {
                await cargarEstadisticas();
                await cargarAgentes();
                await cargarTareas();
            }, 5000);
        }
        
        // Iniciar
        init();
        
        // ============================================================
        // EXPONER FUNCIONES GLOBALES
        // ============================================================
        window.crearAgente = crearAgente;
        window.crearTarea = crearTarea;
        window.completarTarea = completarTarea;
        window.asignarTarea = asignarTarea;
        window.eliminarTarea = eliminarTarea;
        window.enviarMensaje = enviarMensaje;
        window.simularActividad = simularActividad;
        window.asignarTareasAutomaticas = asignarTareasAutomaticas;
    </script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`✅ Agent Office Completo en puerto ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📊 Características:`);
    console.log(`   🗺️ Mapa de oficina con agentes animados`);
    console.log(`   📊 Gráficas de rendimiento en tiempo real`);
    console.log(`   🎯 Sistema de tareas con asignación automática`);
    console.log(`   💬 Chat con IA usando Pollinations`);
    console.log(`   🎲 Simulación de actividad automática`);
});
