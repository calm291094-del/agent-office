// UI Server - Sirve la interfaz de Agent Office
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏢 Agent Office</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", sans-serif; }
        body { background: #0f172a; color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .office { background: #1e293b; border-radius: 20px; padding: 40px; max-width: 800px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
        h1 { font-size: 2rem; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
        .subtitle { color: #94a3b8; margin-bottom: 30px; }
        .agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin: 20px 0; }
        .agent-card { background: #334155; border-radius: 12px; padding: 16px; text-align: center; transition: all 0.3s; border: 1px solid #475569; }
        .agent-card:hover { transform: translateY(-4px); border-color: #0d9488; }
        .agent-card .icon { font-size: 2.5rem; margin-bottom: 8px; }
        .agent-card .name { font-weight: 600; }
        .agent-card .role { font-size: 0.75rem; color: #94a3b8; }
        .agent-card .status { display: inline-block; padding: 2px 12px; border-radius: 20px; font-size: 0.65rem; margin-top: 8px; }
        .status-idle { background: #475569; color: #94a3b8; }
        .status-working { background: #0d9488; color: white; }
        .status-thinking { background: #f59e0b; color: #0f172a; }
        .input-group { display: flex; gap: 12px; margin-top: 20px; }
        .input-group input { flex: 1; padding: 12px 16px; border-radius: 10px; border: 1px solid #475569; background: #1e293b; color: white; }
        .input-group input:focus { outline: none; border-color: #0d9488; }
        .input-group button { padding: 12px 24px; background: #0d9488; color: white; border: none; border-radius: 10px; cursor: pointer; transition: all 0.3s; }
        .input-group button:hover { background: #0f766e; transform: scale(1.02); }
        .chat-area { margin-top: 20px; background: #0f172a; border-radius: 12px; padding: 16px; max-height: 200px; overflow-y: auto; border: 1px solid #334155; }
        .chat-area .message { padding: 6px 0; border-bottom: 1px solid #1e293b; font-size: 0.9rem; }
        .chat-area .message .user { color: #0d9488; font-weight: 600; }
        .chat-area .message .agent { color: #f59e0b; font-weight: 600; }
        .btn-create { background: #0d9488; color: white; padding: 8px 20px; border: none; border-radius: 8px; cursor: pointer; margin-top: 12px; }
        .btn-create:hover { background: #0f766e; }
        .stats { display: flex; gap: 20px; margin-top: 16px; color: #94a3b8; font-size: 0.85rem; }
        .stats span { background: #1e293b; padding: 4px 16px; border-radius: 20px; }
        .footer { margin-top: 20px; color: #475569; font-size: 0.75rem; text-align: center; }
        .footer a { color: #0d9488; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="office">
        <h1>🏢 Agent Office</h1>
        <p class="subtitle">Gestiona tu equipo de agentes IA</p>
        
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div>
                <button class="btn-create" onclick="crearAgente()">+ Nuevo Agente</button>
            </div>
            <div class="stats">
                <span id="agent-count">0 Agentes</span>
                <span id="task-count">0 Tareas</span>
            </div>
        </div>
        
        <div class="agents-grid" id="agents-container">
            <p style="color:#475569;grid-column:1/-1;text-align:center;padding:20px;">Cargando agentes...</p>
        </div>
        
        <div style="margin-top:16px;">
            <h3 style="font-size:0.9rem;color:#94a3b8;margin-bottom:8px;">💬 Chat con los agentes</h3>
            <div class="chat-area" id="chat-area">
                <div class="message"><span class="user">Sistema:</span> Bienvenido a Agent Office</div>
            </div>
            <div class="input-group">
                <input type="text" id="chat-input" placeholder="Escribe un mensaje para los agentes..." onkeypress="if(event.key==='Enter') enviarMensaje()">
                <button onclick="enviarMensaje()">Enviar</button>
            </div>
        </div>
        
        <div class="footer">
            <span>🔒 Acceso administrador</span> · 
            <span>Agentes trabajando 24/7</span> · 
            <span><a href="https://meditech-tienda.onrender.com">← Volver a MediTech</a></span>
        </div>
    </div>

    <script>
        const API_URL = window.location.origin;
        let agents = [];

        async function cargarAgentes() {
            try {
                const res = await fetch(API_URL + "/api/agents");
                const data = await res.json();
                agents = data;
                renderAgentes();
                document.getElementById("agent-count").textContent = agents.length + " Agentes";
            } catch (e) {
                console.error("Error cargando agentes:", e);
            }
        }

        function renderAgentes() {
            const container = document.getElementById("agents-container");
            if (agents.length === 0) {
                container.innerHTML = "<p style=\"color:#475569;grid-column:1/-1;text-align:center;padding:20px;\">No hay agentes aún. Crea uno!</p>";
                return;
            }
            container.innerHTML = agents.map(function(a) {
                var statusClass = a.status === "working" ? "status-working" : 
                                  a.status === "thinking" ? "status-thinking" : "status-idle";
                var statusText = a.status === "working" ? "🔧 Trabajando" : 
                                 a.status === "thinking" ? "🧠 Pensando" : "💤 Inactivo";
                return "<div class=\"agent-card\">" +
                    "<div class=\"icon\">🤖</div>" +
                    "<div class=\"name\">" + a.name + "</div>" +
                    "<div class=\"role\">" + a.role + "</div>" +
                    "<span class=\"status " + statusClass + "\">" + statusText + "</span>" +
                    "<div style=\"margin-top:8px;font-size:0.65rem;color:#475569;\">" + 
                    new Date(a.created_at).toLocaleDateString() + 
                    "</div>" +
                "</div>";
            }).join("");
        }

        async function crearAgente() {
            var name = prompt("Nombre del agente:", "Agente " + (agents.length + 1));
            if (!name) return;
            var role = prompt("Rol del agente:", "Asistente");
            try {
                var res = await fetch(API_URL + "/api/agents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: name, role: role || "Asistente" })
                });
                var data = await res.json();
                await cargarAgentes();
                agregarChat("Sistema", "✅ Agente \"" + data.name + "\" creado");
            } catch (e) {
                alert("Error al crear agente");
            }
        }

        function agregarChat(usuario, mensaje) {
            var area = document.getElementById("chat-area");
            var div = document.createElement("div");
            div.className = "message";
            var cls = usuario === "Sistema" ? "user" : "agent";
            div.innerHTML = "<span class=\"" + cls + "\">" + usuario + ":</span> " + mensaje;
            area.appendChild(div);
            area.scrollTop = area.scrollHeight;
        }

        function enviarMensaje() {
            var input = document.getElementById("chat-input");
            var msg = input.value.trim();
            if (!msg) return;
            input.value = "";
            agregarChat("Administrador", msg);
            
            setTimeout(function() {
                var respuestas = [
                    "🤖 Recibido, administrador. ¿En qué puedo ayudarte?",
                    "📝 Anotado. ¿Necesitas que gestione algo?",
                    "✅ ¡Entendido! Estoy trabajando en ello.",
                    "☕ Un momento, procesando tu solicitud...",
                    "💡 ¡Excelente idea! Voy a analizarlo."
                ];
                var random = respuestas[Math.floor(Math.random() * respuestas.length)];
                var nombre = agents.length > 0 ? agents[Math.floor(Math.random() * agents.length)].name : "Agente";
                agregarChat(nombre, random);
            }, 1000 + Math.random() * 2000);
        }

        cargarAgentes();
        setInterval(cargarAgentes, 5000);
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ Agent Office UI en puerto ${PORT}`);
});
