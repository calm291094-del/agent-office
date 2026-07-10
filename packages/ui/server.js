// UI Server - Sirve la interfaz de Agent Office
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ========== BASE DE DATOS EN MEMORIA ==========
let agents = [];
let nextId = 1;
const statuses = ['idle', 'working', 'thinking'];

// ========== RUTAS API ==========
app.use(express.json());

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
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        tasks_completed: 0
    };
    agents.push(agent);
    res.status(201).json(agent);
});

// Eliminar agente
app.delete('/api/agents/:id', (req, res) => {
    const id = parseInt(req.params.id);
    agents = agents.filter(a => a.id !== id);
    res.json({ message: 'Agente eliminado' });
});

// Ruta principal (UI)
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏢 Agent Office</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", sans-serif; }
        body { background: #0f172a; color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
        .office { background: #1e293b; border-radius: 20px; padding: 40px; max-width: 900px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        h1 { font-size: 2rem; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
        .subtitle { color: #94a3b8; margin-bottom: 30px; }
        
        /* Grid de agentes */
        .agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin: 20px 0; }
        .agent-card { background: #334155; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s; border: 2px solid #475569; position: relative; overflow: hidden; }
        .agent-card:hover { transform: translateY(-4px); border-color: #0d9488; }
        .agent-card.working { border-color: #0d9488; background: #1e3a3a; }
        .agent-card.thinking { border-color: #f59e0b; background: #3a2e1e; animation: pulse 1s infinite; }
        .agent-card.idle { border-color: #475569; }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        
        @keyframes walk {
            0% { transform: translateX(0); }
            50% { transform: translateX(5px); }
            100% { transform: translateX(0); }
        }
        
        .agent-walking {
            animation: walk 2s infinite;
            display: inline-block;
        }
        
        .agent-card .icon { font-size: 2.5rem; margin-bottom: 8px; }
        .agent-card .name { font-weight: 600; }
        .agent-card .role { font-size: 0.75rem; color: #94a3b8; }
        .agent-card .status { display: inline-block; padding: 2px 12px; border-radius: 20px; font-size: 0.65rem; margin-top: 8px; }
        .agent-card .tasks { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
        
        .status-idle { background: #475569; color: #94a3b8; }
        .status-working { background: #0d9488; color: white; }
        .status-thinking { background: #f59e0b; color: #0f172a; }
        
        .input-group { display: flex; gap: 12px; margin-top: 20px; }
        .input-group input { flex: 1; padding: 12px 16px; border-radius: 10px; border: 1px solid #475569; background: #1e293b; color: white; outline: none; }
        .input-group input:focus { border-color: #0d9488; }
        .input-group button { padding: 12px 24px; background: #0d9488; color: white; border: none; border-radius: 10px; cursor: pointer; transition: all 0.3s; }
        .input-group button:hover { background: #0f766e; }
        
        .btn-create { background: #0d9488; color: white; padding: 8px 20px; border: none; border-radius: 8px; cursor: pointer; margin-top: 12px; }
        .btn-create:hover { background: #0f766e; }
        .btn-delete { background: #ef4444; color: white; padding: 4px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.7rem; margin-top: 8px; }
        .btn-delete:hover { background: #dc2626; }
        
        .stats { display: flex; gap: 20px; margin-top: 16px; color: #94a3b8; font-size: 0.85rem; flex-wrap: wrap; }
        .stats span { background: #1e293b; padding: 4px 16px; border-radius: 20px; }
        
        .chat-area { margin-top: 20px; background: #0f172a; border-radius: 12px; padding: 16px; max-height: 200px; overflow-y: auto; border: 1px solid #334155; }
        .chat-area .message { padding: 6px 0; border-bottom: 1px solid #1e293b; font-size: 0.9rem; }
        .chat-area .message .user { color: #0d9488; font-weight: 600; }
        .chat-area .message .agent { color: #f59e0b; font-weight: 600; }
        
        .footer { margin-top: 20px; color: #475569; font-size: 0.75rem; text-align: center; }
        .footer a { color: #0d9488; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        
        /* Animación de oficina */
        .office-floor { 
            background: #1a2332; 
            border-radius: 12px; 
            padding: 10px; 
            margin: 10px 0;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
            border: 1px solid #2a3a4a;
        }
        .pixel-agent {
            font-size: 1.5rem;
            animation: walk 3s infinite;
            display: inline-block;
        }
        .pixel-agent:nth-child(odd) { animation-delay: 0.5s; }
        .pixel-agent:nth-child(3n) { animation-delay: 1s; }
    </style>
</head>
<body>
    <div class="office">
        <h1>🏢 Agent Office</h1>
        <p class="subtitle">🤖 Agentes IA trabajando en equipo</p>
        
        <!-- Píxeles caminando por la oficina -->
        <div class="office-floor" id="office-floor">
            <span class="pixel-agent">🧑‍💻</span>
            <span class="pixel-agent">👩‍💻</span>
            <span class="pixel-agent">🤖</span>
            <span class="pixel-agent">🧑‍🏫</span>
            <span class="pixel-agent">👨‍🔬</span>
            <span class="pixel-agent">👩‍⚕️</span>
        </div>
        
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div>
                <button class="btn-create" onclick="crearAgente()">+ Nuevo Agente</button>
                <button class="btn-create" style="background:#f59e0b;margin-left:8px;" onclick="cambiarEstadoAleatorio()">🎲 Estado Aleatorio</button>
            </div>
            <div class="stats">
                <span id="agent-count">0 Agentes</span>
                <span id="working-count">0 Trabajando</span>
                <span id="thinking-count">0 Pensando</span>
            </div>
        </div>
        
        <div class="agents-grid" id="agents-container">
            <p style="color:#475569;grid-column:1/-1;text-align:center;padding:20px;">Cargando agentes...</p>
        </div>
        
        <div style="margin-top:16px;">
            <h3 style="font-size:0.9rem;color:#94a3b8;margin-bottom:8px;">💬 Chat</h3>
            <div class="chat-area" id="chat-area">
                <div class="message"><span class="user">Sistema:</span> Bienvenido a Agent Office 🏢</div>
            </div>
            <div class="input-group">
                <input type="text" id="chat-input" placeholder="Escribe un mensaje..." onkeypress="if(event.key==='Enter') enviarMensaje()">
                <button onclick="enviarMensaje()">Enviar</button>
            </div>
        </div>
        
        <div class="footer">
            <span>🔒 Admin</span> · 
            <span>🤖 ${agents.length} Agentes</span> · 
            <span><a href="https://meditech-tienda.onrender.com">← Volver a MediTech</a></span>
        </div>
    </div>

    <script>
        var agents = [];
        var chatMessages = [];

        // ========== CARGAR AGENTES ==========
        async function cargarAgentes() {
            try {
                var res = await fetch('/api/agents');
                agents = await res.json();
                renderAgentes();
                actualizarEstadisticas();
            } catch (e) {
                console.error('Error:', e);
            }
        }

        // ========== RENDERIZAR ==========
        function renderAgentes() {
            var container = document.getElementById('agents-container');
            if (agents.length === 0) {
                container.innerHTML = '<p style="color:#475569;grid-column:1/-1;text-align:center;padding:20px;">No hay agentes aún. ¡Crea uno!</p>';
                return;
            }
            
            var html = '';
            for (var i = 0; i < agents.length; i++) {
                var a = agents[i];
                var statusClass = 'status-' + a.status;
                var statusText = a.status === 'working' ? '🔧 Trabajando' : 
                                 a.status === 'thinking' ? '🧠 Pensando' : '💤 Inactivo';
                var cardClass = 'agent-card ' + a.status;
                var icon = a.status === 'working' ? '👨‍💻' : 
                           a.status === 'thinking' ? '🤔' : '🤖';
                
                html += '<div class="' + cardClass + '">' +
                    '<div class="icon">' + icon + '</div>' +
                    '<div class="name">' + a.name + '</div>' +
                    '<div class="role">' + a.role + '</div>' +
                    '<span class="status ' + statusClass + '">' + statusText + '</span>' +
                    '<div class="tasks">📋 Tareas: ' + (a.tasks_completed || 0) + '</div>' +
                    '<div><button class="btn-delete" onclick="eliminarAgente(' + a.id + ')">Eliminar</button></div>' +
                '</div>';
            }
            container.innerHTML = html;
        }

        // ========== ESTADÍSTICAS ==========
        function actualizarEstadisticas() {
            document.getElementById('agent-count').textContent = agents.length + ' Agentes';
            var working = agents.filter(a => a.status === 'working').length;
            var thinking = agents.filter(a => a.status === 'thinking').length;
            document.getElementById('working-count').textContent = working + ' Trabajando';
            document.getElementById('thinking-count').textContent = thinking + ' Pensando';
        }

        // ========== CREAR AGENTE ==========
        async function crearAgente() {
            var name = prompt('Nombre del agente:', 'Agente ' + (agents.length + 1));
            if (!name) return;
            var role = prompt('Rol del agente:', 'Asistente');
            try {
                var res = await fetch('/api/agents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, role: role || 'Asistente' })
                });
                await cargarAgentes();
                agregarChat('Sistema', '✅ Agente "' + name + '" creado');
            } catch (e) {
                alert('Error al crear agente');
                console.error(e);
            }
        }

        // ========== ELIMINAR AGENTE ==========
        async function eliminarAgente(id) {
            if (!confirm('¿Eliminar este agente?')) return;
            try {
                await fetch('/api/agents/' + id, { method: 'DELETE' });
                await cargarAgentes();
                agregarChat('Sistema', '🗑️ Agente eliminado');
            } catch (e) {
                alert('Error al eliminar');
            }
        }

        // ========== CAMBIAR ESTADO ALEATORIO ==========
        function cambiarEstadoAleatorio() {
            if (agents.length === 0) {
                alert('No hay agentes para cambiar estado');
                return;
            }
            
            for (var i = 0; i < agents.length; i++) {
                var statuses = ['idle', 'working', 'thinking'];
                var newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                agents[i].status = newStatus;
                if (newStatus === 'working') {
                    agents[i].tasks_completed = (agents[i].tasks_completed || 0) + 1;
                }
            }
            renderAgentes();
            actualizarEstadisticas();
            agregarChat('Sistema', '🔄 Estados de agentes actualizados aleatoriamente');
        }

        // ========== CHAT ==========
        function agregarChat(usuario, mensaje) {
            var area = document.getElementById('chat-area');
            var div = document.createElement('div');
            div.className = 'message';
            var cls = usuario === 'Sistema' ? 'user' : 'agent';
            div.innerHTML = '<span class="' + cls + '">' + usuario + ':</span> ' + mensaje;
            area.appendChild(div);
            area.scrollTop = area.scrollHeight;
        }

        function enviarMensaje() {
            var input = document.getElementById('chat-input');
            var msg = input.value.trim();
            if (!msg) return;
            input.value = '';
            agregarChat('Administrador', msg);
            
            setTimeout(function() {
                var respuestas = [
                    '🤖 Recibido, administrador. ¿En qué puedo ayudarte?',
                    '📝 Anotado. ¿Necesitas que gestione algo?',
                    '✅ ¡Entendido! Estoy trabajando en ello.',
                    '☕ Un momento, procesando tu solicitud...',
                    '💡 ¡Excelente idea! Voy a analizarlo.'
                ];
                var random = respuestas[Math.floor(Math.random() * respuestas.length)];
                var nombre = agents.length > 0 ? agents[Math.floor(Math.random() * agents.length)].name : 'Agente';
                agregarChat(nombre, random);
            }, 1000 + Math.random() * 2000);
        }

        // ========== CAMBIAR ESTADO AUTOMÁTICO ==========
        setInterval(function() {
            if (agents.length === 0) return;
            
            // Seleccionar un agente aleatorio y cambiar su estado
            var idx = Math.floor(Math.random() * agents.length);
            var statuses = ['idle', 'working', 'thinking'];
            var newStatus = statuses[Math.floor(Math.random() * statuses.length)];
            agents[idx].status = newStatus;
            if (newStatus === 'working') {
                agents[idx].tasks_completed = (agents[idx].tasks_completed || 0) + 1;
            }
            
            renderAgentes();
            actualizarEstadisticas();
        }, 5000); // Cada 5 segundos

        // ========== INICIALIZAR ==========
        cargarAgentes();
        setInterval(cargarAgentes, 10000);
    </script>
</body>
</html>`);
});

app.listen(PORT, () => {
    console.log(`✅ Agent Office UI + API en puerto ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
});
