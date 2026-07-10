// packages/ui/server.js - Agent Office UI con iframe + chat
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// ========== MIDDLEWARE ==========
app.use(express.json());

// ========== BASE DE DATOS EN MEMORIA ==========
let agents = [];
let nextId = 1;
let chatMessages = [
    { type: 'system', message: '🏢 Bienvenido a Agent Office', timestamp: new Date().toISOString() }
];

// ========== RUTAS API ==========
app.get('/api/agents', (req, res) => {
    res.json(agents);
});

app.post('/api/agents', (req, res) => {
    const { name, role } = req.body;
    const agent = {
        id: nextId++,
        name: name || 'Agente',
        role: role || 'Asistente',
        status: 'idle',
        icon: '🤖',
        created_at: new Date().toISOString()
    };
    agents.push(agent);
    chatMessages.push({
        type: 'system',
        message: `🎉 Nuevo agente "${agent.name}" creado`,
        timestamp: new Date().toISOString()
    });
    res.status(201).json(agent);
});

app.delete('/api/agents/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = agents.findIndex(a => a.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    const agent = agents[index];
    agents.splice(index, 1);
    chatMessages.push({
        type: 'system',
        message: `👋 Agente "${agent.name}" eliminado`,
        timestamp: new Date().toISOString()
    });
    res.json({ message: 'Agente eliminado' });
});

app.put('/api/agents/:id/status', (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const agent = agents.find(a => a.id === id);
    if (!agent) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    agent.status = status;
    chatMessages.push({
        type: 'system',
        message: `🔄 "${agent.name}" ahora está ${status}`,
        timestamp: new Date().toISOString()
    });
    res.json(agent);
});

app.get('/api/chat', (req, res) => {
    res.json(chatMessages.slice(-50)); // Últimos 50 mensajes
});

app.post('/api/chat', (req, res) => {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensaje vacío' });
    
    chatMessages.push({
        type: 'user',
        username: username || 'Admin',
        message: message,
        timestamp: new Date().toISOString()
    });
    
    // Respuesta automática simple
    setTimeout(() => {
        const responses = [
            '🤖 Recibido, administrador. ¿En qué puedo ayudarte?',
            '📝 Anotado. Voy a procesar tu solicitud.',
            '✅ ¡Entendido! Estoy trabajando en ello.',
            '💡 Excelente idea. Voy a analizarlo.',
            '☕ Un momento, procesando tu mensaje...'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        chatMessages.push({
            type: 'system',
            message: randomResponse,
            timestamp: new Date().toISOString()
        });
    }, 1000 + Math.random() * 2000);
    
    res.json({ message: 'Mensaje enviado' });
});

// ========== UI PRINCIPAL CON IFRAME + CHAT ==========
app.get('/', (req, res) => {
    let html = '';
    
    html += '<!DOCTYPE html>';
    html += '<html>';
    html += '<head>';
    html += '<meta charset="UTF-8">';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
    html += '<title>🏢 Agent Office</title>';
    html += '<style>';
    html += '* { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", sans-serif; }';
    html += 'body { background: #0f172a; color: white; min-height: 100vh; padding: 16px; }';
    html += '.container { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; height: calc(100vh - 32px); }';
    html += '.header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; flex-wrap: wrap; gap: 8px; }';
    html += '.header h1 { font-size: 1.5rem; display: flex; align-items: center; gap: 12px; }';
    html += '.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }';
    html += '.btn { padding: 6px 16px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s; }';
    html += '.btn-primary { background: #0d9488; color: white; }';
    html += '.btn-primary:hover { background: #0f766e; }';
    html += '.btn-danger { background: #ef4444; color: white; }';
    html += '.btn-danger:hover { background: #dc2626; }';
    html += '.btn-warning { background: #f59e0b; color: #0f172a; }';
    html += '.btn-warning:hover { background: #d97706; }';
    html += '.main-content { display: flex; flex: 1; gap: 16px; min-height: 0; }';
    html += '.iframe-wrapper { flex: 1; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #334155; min-height: 300px; }';
    html += '.iframe-wrapper iframe { width: 100%; height: 100%; border: none; background: #0f172a; }';
    html += '.sidebar { width: 320px; display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; }';
    html += '.card { background: #1e293b; border-radius: 12px; padding: 16px; border: 1px solid #334155; display: flex; flex-direction: column; }';
    html += '.card-title { font-size: 0.85rem; font-weight: 600; color: #94a3b8; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }';
    html += '.chat-container { flex: 1; overflow-y: auto; min-height: 0; max-height: 200px; }';
    html += '.chat-message { padding: 4px 0; font-size: 0.85rem; border-bottom: 1px solid #1e293b; }';
    html += '.chat-message .user { color: #0d9488; font-weight: 600; }';
    html += '.chat-message .system { color: #94a3b8; font-style: italic; }';
    html += '.chat-input-group { display: flex; gap: 8px; margin-top: 8px; }';
    html += '.chat-input-group input { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: white; }';
    html += '.chat-input-group input:focus { outline: none; border-color: #0d9488; }';
    html += '.chat-input-group button { padding: 8px 16px; }';
    html += '.agent-list { max-height: 150px; overflow-y: auto; }';
    html += '.agent-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 0.8rem; border-bottom: 1px solid #1e293b; }';
    html += '.agent-item .status { font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; }';
    html += '.status-working { background: #0d9488; color: white; }';
    html += '.status-thinking { background: #f59e0b; color: #0f172a; }';
    html += '.status-idle { background: #475569; color: #94a3b8; }';
    html += '.footer { text-align: center; color: #64748b; font-size: 0.75rem; padding: 8px; }';
    html += '.footer a { color: #0d9488; text-decoration: none; }';
    html += '@media (max-width: 1024px) { .sidebar { width: 260px; } }';
    html += '@media (max-width: 768px) { .main-content { flex-direction: column; } .sidebar { width: 100%; } .iframe-wrapper { min-height: 300px; } .header { flex-direction: column; align-items: stretch; text-align: center; } .header-actions { justify-content: center; } }';
    html += '</style>';
    html += '</head>';
    html += '<body>';
    html += '<div class="container">';
    
    // HEADER
    html += '<div class="header">';
    html += '<h1>🏢 Agent Office</h1>';
    html += '<div class="header-actions">';
    html += `<button class="btn btn-primary" onclick="crearAgente()">+ Nuevo Agente</button>`;
    html += `<button class="btn btn-warning" onclick="simularActividad()">🎲 Simular</button>`;
    html += `<a href="https://meditech-tienda.onrender.com" target="_blank" class="btn" style="background:#475569;text-decoration:none;color:white;">← Tienda</a>`;
    html += '</div></div>';
    
    // MAIN CONTENT: IFRAME + SIDEBAR
    html += '<div class="main-content">';
    
    // IFRAME
    html += '<div class="iframe-wrapper">';
    html += `<iframe src="https://pixel-agents-web.onrender.com" allow="autoplay; encrypted-media" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>`;
    html += '</div>';
    
    // SIDEBAR
    html += '<div class="sidebar">';
    
    // CHAT CARD
    html += '<div class="card" style="flex:1;">';
    html += '<div class="card-title">💬 Chat</div>';
    html += '<div class="chat-container" id="chat-container">';
    chatMessages.forEach(msg => {
        const cls = msg.type === 'user' ? 'user' : 'system';
        const name = msg.type === 'user' ? (msg.username || 'Tú') + ':' : '📢';
        html += `<div class="chat-message"><span class="${cls}">${name}</span> ${msg.message}</div>`;
    });
    html += '</div>';
    html += '<div class="chat-input-group">';
    html += `<input type="text" id="chat-input" placeholder="Escribe un mensaje..." onkeypress="if(event.key==='Enter') enviarMensaje()">`;
    html += `<button class="btn btn-primary" onclick="enviarMensaje()">Enviar</button>`;
    html += '</div></div>';
    
    // AGENTS CARD
    html += '<div class="card">';
    html += '<div class="card-title">🤖 Agentes <span id="agent-count" style="color:#94a3b8;font-weight:normal;">(0)</span></div>';
    html += '<div class="agent-list" id="agent-list">';
    if (agents.length === 0) {
        html += '<div style="color:#64748b;font-size:0.8rem;text-align:center;padding:8px;">No hay agentes</div>';
    } else {
        agents.forEach(a => {
            const statusClass = 'status-' + a.status;
            const statusText = a.status === 'working' ? '🔧 Trabajando' : 
                               a.status === 'thinking' ? '🧠 Pensando' : '💤 Inactivo';
            html += `<div class="agent-item"><span>${a.icon} ${a.name}</span><span class="status ${statusClass}">${statusText}</span></div>`;
        });
    }
    html += '</div></div>';
    
    html += '</div>'; // end sidebar
    html += '</div>'; // end main-content
    
    // FOOTER
    html += '<div class="footer">';
    html += '<span>🤖 Agentes 24/7</span> · ';
    html += '<span>🔒 Administrador</span> · ';
    html += '<span><a href="https://github.com/calm291094-del/agent-office">GitHub</a></span>';
    html += '</div>';
    
    html += '</div>'; // end container
    
    // SCRIPTS
    html += '<script>';
    html += 'let agents = ' + JSON.stringify(agents) + ';';
    html += 'let nextId = ' + nextId + ';';
    html += `
        async function cargarAgentes() {
            try {
                const res = await fetch('/api/agents');
                agents = await res.json();
                renderAgentes();
            } catch(e) { console.error(e); }
        }
        function renderAgentes() {
            const list = document.getElementById('agent-list');
            const count = document.getElementById('agent-count');
            if (!agents || agents.length === 0) {
                list.innerHTML = '<div style="color:#64748b;font-size:0.8rem;text-align:center;padding:8px;">No hay agentes</div>';
                count.textContent = '(0)';
                return;
            }
            count.textContent = '(' + agents.length + ')';
            let html = '';
            agents.forEach(a => {
                const statusClass = 'status-' + a.status;
                const statusText = a.status === 'working' ? '🔧 Trabajando' : a.status === 'thinking' ? '🧠 Pensando' : '💤 Inactivo';
                html += '<div class="agent-item"><span>' + a.icon + ' ' + a.name + '</span><span class="status ' + statusClass + '">' + statusText + '</span></div>';
            });
            list.innerHTML = html;
        }
        async function crearAgente() {
            const name = prompt('Nombre del agente:', 'Agente ' + (agents.length + 1));
            if (!name) return;
            const role = prompt('Rol del agente:', 'Asistente');
            try {
                await fetch('/api/agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, role: role || 'Asistente' })
                });
                await cargarAgentes();
                await cargarChat();
            } catch(e) { alert('Error al crear agente'); }
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
                } catch(e) {}
            }
            await cargarAgentes();
            await cargarChat();
        }
        async function cargarChat() {
            try {
                const res = await fetch('/api/chat');
                const messages = await res.json();
                const container = document.getElementById('chat-container');
                let html = '';
                messages.forEach(msg => {
                    const cls = msg.type === 'user' ? 'user' : 'system';
                    const name = msg.type === 'user' ? (msg.username || 'Tú') + ':' : '📢';
                    html += '<div class="chat-message"><span class="' + cls + '">' + name + '</span> ' + msg.message + '</div>';
                });
                container.innerHTML = html;
                container.scrollTop = container.scrollHeight;
            } catch(e) { console.error(e); }
        }
        async function enviarMensaje() {
            const input = document.getElementById('chat-input');
            const msg = input.value.trim();
            if (!msg) return;
            input.value = '';
            try {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg })
                });
                setTimeout(cargarChat, 500);
            } catch(e) { console.error(e); }
        }
        cargarAgentes();
        cargarChat();
        setInterval(cargarAgentes, 5000);
        setInterval(cargarChat, 3000);
    `;
    html += '</script>';
    
    html += '</body>';
    html += '</html>';
    
    res.send(html);
});

app.listen(PORT, () => {
    console.log('✅ Agent Office UI + API en puerto ' + PORT);
    console.log('🌐 http://localhost:' + PORT);
});
