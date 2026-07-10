// packages/ui/server.js - Agent Office UI con iframe + chat optimizado
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// ========== MIDDLEWARE ==========
app.use(express.json());

// ========== BASE DE DATOS EN MEMORIA ==========
let agents = [];
let nextId = 1;
let chatMessages = [];
const MAX_CHAT_MESSAGES = 50; // Límite para evitar sobrecarga

// Mensaje de bienvenida inicial
chatMessages.push({
    type: 'system',
    message: '🏢 Bienvenido a Agent Office',
    timestamp: new Date().toISOString()
});

// ========== FUNCIONES AUXILIARES ==========
function addChatMessage(type, message, username = null) {
    chatMessages.push({
        type,
        username,
        message,
        timestamp: new Date().toISOString()
    });
    // Mantener solo los últimos MAX_CHAT_MESSAGES mensajes
    if (chatMessages.length > MAX_CHAT_MESSAGES) {
        chatMessages = chatMessages.slice(-MAX_CHAT_MESSAGES);
    }
}

// ========== RUTAS API ==========

// Obtener agentes
app.get('/api/agents', (req, res) => {
    res.json(agents);
});

// Crear agente
app.post('/api/agents', (req, res) => {
    const { name, role } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    const agent = {
        id: nextId++,
        name: name || 'Agente',
        role: role || 'Asistente',
        status: 'idle',
        icon: '🤖',
        created_at: new Date().toISOString()
    };
    agents.push(agent);
    addChatMessage('system', `🎉 Nuevo agente "${agent.name}" creado`);
    res.status(201).json(agent);
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
    addChatMessage('system', `👋 Agente "${agent.name}" eliminado`);
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
    const validStatuses = ['idle', 'working', 'thinking'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }
    agent.status = status;
    addChatMessage('system', `🔄 "${agent.name}" ahora está ${status}`);
    res.json(agent);
});

// Obtener chat (últimos mensajes)
app.get('/api/chat', (req, res) => {
    res.json(chatMessages);
});

// Enviar mensaje al chat
app.post('/api/chat', (req, res) => {
    const { message, username } = req.body;
    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Mensaje vacío' });
    }
    
    addChatMessage('user', message.trim(), username || 'Admin');
    
    // Respuesta automática simple (solo una, no en bucle)
    const responses = [
        '🤖 Recibido, administrador. ¿En qué puedo ayudarte?',
        '📝 Anotado. Voy a procesar tu solicitud.',
        '✅ ¡Entendido! Estoy trabajando en ello.',
        '💡 Excelente idea. Voy a analizarlo.',
        '☕ Un momento, procesando tu mensaje...'
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Añadir respuesta después de un breve retraso (simula procesamiento)
    setTimeout(() => {
        addChatMessage('system', randomResponse);
    }, 500 + Math.random() * 1000);
    
    res.json({ message: 'Mensaje enviado' });
});

// ========== UI PRINCIPAL CON IFRAME + CHAT ==========
app.get('/', (req, res) => {
    // Escapar correctamente los datos para el HTML
    const agentsJson = JSON.stringify(agents).replace(/</g, '\\u003c');
    const chatJson = JSON.stringify(chatMessages).replace(/</g, '\\u003c');
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏢 Agent Office</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", sans-serif; }
        body { background: #0f172a; color: white; min-height: 100vh; padding: 16px; }
        .container { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; height: calc(100vh - 32px); }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #1e293b; border-radius: 10px; border: 1px solid #334155; flex-wrap: wrap; gap: 8px; }
        .header h1 { font-size: 1.3rem; display: flex; align-items: center; gap: 10px; }
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn { padding: 5px 14px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; transition: all 0.3s; }
        .btn-primary { background: #0d9488; color: white; }
        .btn-primary:hover { background: #0f766e; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }
        .btn-warning { background: #f59e0b; color: #0f172a; }
        .btn-warning:hover { background: #d97706; }
        .btn-secondary { background: #475569; color: white; text-decoration: none; display: inline-block; }
        .btn-secondary:hover { background: #334155; }
        .main-content { display: flex; flex: 1; gap: 12px; min-height: 0; }
        .iframe-wrapper { flex: 1; background: #0f172a; border-radius: 10px; overflow: hidden; border: 1px solid #334155; min-height: 250px; position: relative; }
        .iframe-wrapper iframe { width: 100%; height: 100%; border: none; background: #0f172a; position: absolute; top: 0; left: 0; }
        .sidebar { width: 300px; display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
        .card { background: #1e293b; border-radius: 10px; padding: 12px; border: 1px solid #334155; display: flex; flex-direction: column; }
        .card-title { font-size: 0.8rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .chat-container { flex: 1; overflow-y: auto; min-height: 0; max-height: 180px; font-size: 0.85rem; }
        .chat-message { padding: 3px 0; border-bottom: 1px solid #1e293b; word-break: break-word; }
        .chat-message .user { color: #0d9488; font-weight: 600; }
        .chat-message .system { color: #94a3b8; font-style: italic; }
        .chat-input-group { display: flex; gap: 6px; margin-top: 6px; }
        .chat-input-group input { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white; font-size: 0.85rem; }
        .chat-input-group input:focus { outline: none; border-color: #0d9488; }
        .chat-input-group button { padding: 6px 14px; font-size: 0.85rem; }
        .agent-list { max-height: 120px; overflow-y: auto; font-size: 0.8rem; }
        .agent-item { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid #1e293b; }
        .agent-item .status { font-size: 0.6rem; padding: 2px 8px; border-radius: 10px; }
        .status-working { background: #0d9488; color: white; }
        .status-thinking { background: #f59e0b; color: #0f172a; }
        .status-idle { background: #475569; color: #94a3b8; }
        .footer { text-align: center; color: #64748b; font-size: 0.7rem; padding: 4px; }
        .footer a { color: #0d9488; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        .empty-state { color: #64748b; font-size: 0.8rem; text-align: center; padding: 8px; }
        @media (max-width: 1024px) { .sidebar { width: 260px; } }
        @media (max-width: 768px) { 
            .main-content { flex-direction: column; } 
            .sidebar { width: 100%; } 
            .iframe-wrapper { min-height: 300px; } 
            .header { flex-direction: column; align-items: stretch; text-align: center; } 
            .header-actions { justify-content: center; } 
            .chat-container { max-height: 120px; }
            .agent-list { max-height: 100px; }
        }
        @media (max-width: 480px) {
            body { padding: 8px; }
            .container { gap: 8px; height: calc(100vh - 16px); }
            .header h1 { font-size: 1.1rem; }
            .btn { font-size: 0.75rem; padding: 4px 10px; }
            .sidebar { width: 100%; }
            .iframe-wrapper { min-height: 200px; }
        }
        /* Scrollbar personalizada */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <h1>🏢 Agent Office</h1>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="crearAgente()">+ Nuevo Agente</button>
                <button class="btn btn-warning" onclick="simularActividad()">🎲 Simular</button>
                <a href="https://meditech-tienda.onrender.com" target="_blank" class="btn btn-secondary">← Tienda</a>
            </div>
        </div>
        
        <!-- MAIN CONTENT: IFRAME + SIDEBAR -->
        <div class="main-content">
            <!-- IFRAME -->
            <div class="iframe-wrapper">
                <iframe src="https://pixel-agents-web.onrender.com" allow="autoplay; encrypted-media" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
            </div>
            
            <!-- SIDEBAR -->
            <div class="sidebar">
                <!-- CHAT CARD -->
                <div class="card" style="flex:1;">
                    <div class="card-title">💬 Chat</div>
                    <div class="chat-container" id="chat-container">
                        ${chatMessages.map(msg => {
                            const cls = msg.type === 'user' ? 'user' : 'system';
                            const name = msg.type === 'user' ? (msg.username || 'Tú') + ':' : '📢';
                            return `<div class="chat-message"><span class="${cls}">${name}</span> ${msg.message}</div>`;
                        }).join('')}
                    </div>
                    <div class="chat-input-group">
                        <input type="text" id="chat-input" placeholder="Escribe un mensaje..." onkeypress="if(event.key==='Enter') enviarMensaje()">
                        <button class="btn btn-primary" onclick="enviarMensaje()">Enviar</button>
                    </div>
                </div>
                
                <!-- AGENTS CARD -->
                <div class="card">
                    <div class="card-title">🤖 Agentes <span id="agent-count" style="color:#94a3b8;font-weight:normal;">(${agents.length})</span></div>
                    <div class="agent-list" id="agent-list">
                        ${agents.length === 0 ? '<div class="empty-state">No hay agentes</div>' : 
                            agents.map(a => {
                                const statusClass = 'status-' + a.status;
                                const statusText = a.status === 'working' ? '🔧 Trabajando' : 
                                                   a.status === 'thinking' ? '🧠 Pensando' : '💤 Inactivo';
                                return `<div class="agent-item"><span>${a.icon} ${a.name}</span><span class="status ${statusClass}">${statusText}</span></div>`;
                            }).join('')
                        }
                    </div>
                </div>
            </div>
        </div>
        
        <!-- FOOTER -->
        <div class="footer">
            <span>🤖 Agentes 24/7</span> · 
            <span>🔒 Administrador</span> · 
            <span><a href="https://github.com/calm291094-del/agent-office" target="_blank">GitHub</a></span>
        </div>
    </div>
    
    <script>
        // ============================================================
        // DATOS INICIALES (inyectados desde el servidor)
        // ============================================================
        let agents = ${agentsJson};
        let nextId = ${nextId};
        let chatUpdateTimeout = null;
        let agentUpdateTimeout = null;
        let isChatUpdating = false;
        let isAgentUpdating = false;
        
        // ============================================================
        // FUNCIONES DE AGENTES
        // ============================================================
        function renderAgentes() {
            const list = document.getElementById('agent-list');
            const count = document.getElementById('agent-count');
            if (!agents || agents.length === 0) {
                list.innerHTML = '<div class="empty-state">No hay agentes</div>';
                count.textContent = '(0)';
                return;
            }
            count.textContent = '(' + agents.length + ')';
            let html = '';
            agents.forEach(a => {
                const statusClass = 'status-' + a.status;
                const statusText = a.status === 'working' ? '🔧 Trabajando' : 
                                   a.status === 'thinking' ? '🧠 Pensando' : '💤 Inactivo';
                html += '<div class="agent-item"><span>' + a.icon + ' ' + a.name + '</span><span class="status ' + statusClass + '">' + statusText + '</span></div>';
            });
            list.innerHTML = html;
        }
        
        async function cargarAgentes() {
            if (isAgentUpdating) return;
            isAgentUpdating = true;
            try {
                const res = await fetch('/api/agents');
                if (!res.ok) throw new Error('Error al cargar agentes');
                const data = await res.json();
                agents = data;
                renderAgentes();
            } catch (e) {
                console.error('Error cargando agentes:', e);
            } finally {
                isAgentUpdating = false;
            }
        }
        
        async function crearAgente() {
            const name = prompt('Nombre del agente:', 'Agente ' + (agents.length + 1));
            if (!name || name.trim() === '') return;
            const role = prompt('Rol del agente:', 'Asistente');
            try {
                const res = await fetch('/api/agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name.trim(), role: (role || 'Asistente').trim() })
                });
                if (!res.ok) throw new Error('Error al crear agente');
                await cargarAgentes();
                await cargarChat();
            } catch (e) {
                alert('Error al crear agente: ' + e.message);
            }
        }
        
        async function simularActividad() {
            if (agents.length === 0) return;
            const statuses = ['idle', 'working', 'thinking'];
            for (const agent of agents) {
                const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                try {
                    await fetch('/api/agents/' + agent.id + '/status', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                } catch (e) {}
            }
            await cargarAgentes();
            await cargarChat();
        }
        
        // ============================================================
        // FUNCIONES DE CHAT
        // ============================================================
        function renderChat(messages) {
            const container = document.getElementById('chat-container');
            let html = '';
            messages.forEach(msg => {
                const cls = msg.type === 'user' ? 'user' : 'system';
                const name = msg.type === 'user' ? (msg.username || 'Tú') + ':' : '📢';
                html += '<div class="chat-message"><span class="' + cls + '">' + name + '</span> ' + msg.message + '</div>';
            });
            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
        }
        
        async function cargarChat() {
            if (isChatUpdating) return;
            isChatUpdating = true;
            try {
                const res = await fetch('/api/chat');
                if (!res.ok) throw new Error('Error al cargar chat');
                const messages = await res.json();
                renderChat(messages);
            } catch (e) {
                console.error('Error cargando chat:', e);
            } finally {
                isChatUpdating = false;
            }
        }
        
        async function enviarMensaje() {
            const input = document.getElementById('chat-input');
            const msg = input.value.trim();
            if (!msg) return;
            input.value = '';
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg })
                });
                if (!res.ok) throw new Error('Error al enviar mensaje');
                // Esperar un momento para que el servidor procese y luego actualizar
                setTimeout(cargarChat, 800);
            } catch (e) {
                console.error('Error enviando mensaje:', e);
                alert('Error al enviar mensaje: ' + e.message);
            }
        }
        
        // ============================================================
        // INICIALIZACIÓN CON INTERVALOS CONTROLADOS
        // ============================================================
        
        // Cargar datos iniciales
        renderAgentes();
        cargarChat();
        
        // Actualizar agentes cada 8 segundos (más espaciado)
        setInterval(() => {
            cargarAgentes();
        }, 8000);
        
        // Actualizar chat cada 5 segundos (solo si no hay actualización en curso)
        setInterval(() => {
            if (!isChatUpdating) {
                cargarChat();
            }
        }, 5000);
        
        // ============================================================
        // LIMPIEZA DE RECURSOS (opcional, para cuando la página se cierra)
        // ============================================================
        window.addEventListener('beforeunload', function() {
            if (chatUpdateTimeout) clearTimeout(chatUpdateTimeout);
            if (agentUpdateTimeout) clearTimeout(agentUpdateTimeout);
        });
    </script>
</body>
</html>`;
    
    res.send(html);
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
    console.log('✅ Agent Office UI + API en puerto ' + PORT);
    console.log('🌐 http://localhost:' + PORT);
});
