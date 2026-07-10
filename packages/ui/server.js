// packages/ui/server.js - VERSIÓN CORREGIDA (sin template literals)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware para JSON
app.use(express.json());

// Base de datos en memoria
let agents = [];
let nextId = 1;

// ========== RUTAS API ==========

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
        created_at: new Date().toISOString()
    };
    agents.push(agent);
    res.status(201).json(agent);
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

// ========== UI ==========

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
    html += 'body { background: #0f172a; color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }';
    html += '.office { background: #1e293b; border-radius: 20px; padding: 40px; max-width: 900px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }';
    html += 'h1 { font-size: 2rem; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }';
    html += '.subtitle { color: #94a3b8; margin-bottom: 30px; }';
    html += '.office-floor { background: #1a2332; border-radius: 12px; padding: 10px; margin: 10px 0; min-height: 60px; display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; border: 1px solid #2a3a4a; }';
    html += '.pixel-agent { font-size: 1.5rem; display: inline-block; }';
    html += '.pixel-agent:nth-child(odd) { animation: walk 3s infinite; }';
    html += '.pixel-agent:nth-child(3n) { animation: walk 4s infinite reverse; }';
    html += '@keyframes walk { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }';
    html += '.agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin: 20px 0; }';
    html += '.agent-card { background: #334155; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s; border: 2px solid #475569; }';
    html += '.agent-card:hover { transform: translateY(-4px); border-color: #0d9488; }';
    html += '.agent-card .icon { font-size: 2.5rem; }';
    html += '.agent-card .name { font-weight: 600; }';
    html += '.agent-card .role { font-size: 0.75rem; color: #94a3b8; }';
    html += '.agent-card .status { display: inline-block; padding: 2px 12px; border-radius: 20px; font-size: 0.65rem; margin-top: 8px; }';
    html += '.status-idle { background: #475569; color: #94a3b8; }';
    html += '.status-working { background: #0d9488; color: white; }';
    html += '.status-thinking { background: #f59e0b; color: #0f172a; }';
    html += '.btn-create { background: #0d9488; color: white; padding: 8px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }';
    html += '.btn-create:hover { background: #0f766e; }';
    html += '.btn-delete { background: #ef4444; color: white; padding: 4px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.7rem; }';
    html += '.btn-delete:hover { background: #dc2626; }';
    html += '.stats { display: flex; gap: 20px; margin-top: 16px; color: #94a3b8; font-size: 0.85rem; flex-wrap: wrap; }';
    html += '.stats span { background: #1e293b; padding: 4px 16px; border-radius: 20px; }';
    html += '.input-group { display: flex; gap: 12px; margin-top: 20px; }';
    html += '.input-group input { flex: 1; padding: 12px 16px; border-radius: 10px; border: 1px solid #475569; background: #1e293b; color: white; outline: none; }';
    html += '.input-group input:focus { border-color: #0d9488; }';
    html += '.input-group button { padding: 12px 24px; background: #0d9488; color: white; border: none; border-radius: 10px; cursor: pointer; transition: all 0.3s; }';
    html += '.input-group button:hover { background: #0f766e; }';
    html += '.chat-area { margin-top: 20px; background: #0f172a; border-radius: 12px; padding: 16px; max-height: 200px; overflow-y: auto; border: 1px solid #334155; }';
    html += '.chat-message { padding: 6px 0; border-bottom: 1px solid #1e293b; font-size: 0.9rem; }';
    html += '.chat-message .user { color: #0d9488; font-weight: 600; }';
    html += '.chat-message .agent { color: #f59e0b; font-weight: 600; }';
    html += '.footer { margin-top: 20px; color: #475569; font-size: 0.75rem; text-align: center; }';
    html += '.footer a { color: #0d9488; text-decoration: none; }';
    html += '.footer a:hover { text-decoration: underline; }';
    html += '</style>';
    html += '</head>';
    html += '<body>';
    html += '<div class="office">';
    html += '<h1>🏢 Agent Office</h1>';
    html += '<p class="subtitle">🤖 Agentes IA trabajando en equipo</p>';
    html += '<div class="office-floor">';
    html += '<span class="pixel-agent">🧑‍💻</span>';
    html += '<span class="pixel-agent">👩‍💻</span>';
    html += '<span class="pixel-agent">🤖</span>';
    html += '<span class="pixel-agent">🧑‍🏫</span>';
    html += '<span class="pixel-agent">👨‍🔬</span>';
    html += '<span class="pixel-agent">👩‍⚕️</span>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">';
    html += '<div>';
    html += '<button class="btn-create" onclick="crearAgente()">+ Nuevo Agente</button>';
    html += '<button class="btn-create" style="background:#f59e0b;margin-left:8px;" onclick="simularActividad()">🎲 Simular</button>';
    html += '</div>';
    html += '<div class="stats">';
    html += '<span id="agent-count">0 Agentes</span>';
    html += '<span id="working-count">0 Trabajando</span>';
    html += '<span id="thinking-count">0 Pensando</span>';
    html += '</div>';
    html += '</div>';
    html += '<div class="agents-grid" id="agents-container">';
    html += '<p style="color:#475569;grid-column:1/-1;text-align:center;padding:20px;">No hay agentes aún. ¡Crea uno!</p>';
    html += '</div>';
    html += '<div style="margin-top:16px;">';
    html += '<h3 style="font-size:0.9rem;color:#94a3b8;margin-bottom:8px;">💬 Chat</h3>';
    html += '<div class="chat-area" id="chat-area">';
    html += '<div class="chat-message"><span class="user">Sistema:</span> Bienvenido a Agent Office 🏢</div>';
    html += '</div>';
    html += '<div class="input-group">';
    html += '<input type="text" id="chat-input" placeholder="Escribe un mensaje..." onkeypress="if(event.key===\'Enter\') enviarMensaje()">';
    html += '<button onclick="enviarMensaje()">Enviar</button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="footer">';
    html += '<span>🔒 Admin</span> · ';
    html += '<span>🤖 Agentes 24/7</span> · ';
    html += '<span><a href="https://meditech-tienda.onrender.com">← Volver a MediTech</a></span>';
    html += '</div>';
    html += '</div>';
    
    html += '<script>';
    html += 'let agents = [];';
    html += 'async function cargarAgentes() { try { const res = await fetch("/api/agents"); agents = await res.json(); renderAgentes(); actualizarEstadisticas(); } catch(e) { console.error(e); } }';
    html += 'function renderAgentes() { const container = document.getElementById("agents-container"); if (agents.length === 0) { container.innerHTML = "<p style=\\"color:#475569;grid-column:1/-1;text-align:center;padding:20px;\\">No hay agentes aún. ¡Crea uno!</p>"; return; } let html = ""; for (const a of agents) { const statusClass = "status-" + a.status; const statusText = a.status === "working" ? "🔧 Trabajando" : a.status === "thinking" ? "🧠 Pensando" : "💤 Inactivo"; html += "<div class=\\"agent-card\\"><div class=\\"icon\\">" + a.icon + "</div><div class=\\"name\\">" + a.name + "</div><div class=\\"role\\">" + a.role + "</div><span class=\\"status " + statusClass + "\\">" + statusText + "</span><div><button class=\\"btn-delete\\" onclick=\\"eliminarAgente(" + a.id + ")\\">Eliminar</button></div></div>"; } container.innerHTML = html; }';
    html += 'function actualizarEstadisticas() { const working = agents.filter(a => a.status === "working").length; const thinking = agents.filter(a => a.status === "thinking").length; document.getElementById("agent-count").textContent = agents.length + " Agentes"; document.getElementById("working-count").textContent = working + " Trabajando"; document.getElementById("thinking-count").textContent = thinking + " Pensando"; }';
    html += 'async function crearAgente() { const name = prompt("Nombre del agente:", "Agente " + (agents.length + 1)); if (!name) return; const role = prompt("Rol del agente:", "Asistente"); try { await fetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, role: role || "Asistente" }) }); await cargarAgentes(); agregarChat("Sistema", "✅ Agente \\"" + name + "\\" creado"); } catch(e) { alert("Error"); } }';
    html += 'async function eliminarAgente(id) { if (!confirm("¿Eliminar este agente?")) return; try { await fetch("/api/agents/" + id, { method: "DELETE" }); await cargarAgentes(); agregarChat("Sistema", "🗑️ Agente eliminado"); } catch(e) { alert("Error"); } }';
    html += 'async function simularActividad() { if (agents.length === 0) return; const statuses = ["idle", "working", "thinking"]; for (const agent of agents) { const newStatus = statuses[Math.floor(Math.random() * statuses.length)]; try { await fetch("/api/agents/" + agent.id + "/status", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) }); } catch(e) {} } await cargarAgentes(); agregarChat("Sistema", "🔄 Estados actualizados aleatoriamente"); }';
    html += 'function agregarChat(usuario, mensaje) { const area = document.getElementById("chat-area"); const div = document.createElement("div"); div.className = "chat-message"; const cls = usuario === "Sistema" ? "user" : "agent"; div.innerHTML = "<span class=\\"" + cls + "\\">" + usuario + ":</span> " + mensaje; area.appendChild(div); area.scrollTop = area.scrollHeight; }';
    html += 'function enviarMensaje() { const input = document.getElementById("chat-input"); const msg = input.value.trim(); if (!msg) return; input.value = ""; agregarChat("Tú", msg); setTimeout(() => { const respuestas = ["🤖 Recibido.", "📝 Anotado.", "✅ ¡Entendido!", "☕ Un momento...", "💡 ¡Excelente!"]; const random = respuestas[Math.floor(Math.random() * respuestas.length)]; const nombre = agents.length > 0 ? agents[Math.floor(Math.random() * agents.length)].name : "Agente"; agregarChat(nombre, random); }, 1000); }';
    html += 'cargarAgentes(); setInterval(cargarAgentes, 5000);';
    html += '</script>';
    html += '</body>';
    html += '</html>';
    
    res.send(html);
});

app.listen(PORT, () => {
    console.log('✅ Agent Office UI + API en puerto ' + PORT);
    console.log('🌐 http://localhost:' + PORT);
});
