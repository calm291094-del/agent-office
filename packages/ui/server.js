// packages/ui/server.js - Agent Office UI con iframe a Pixel Agents
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// ========== MIDDLEWARE ==========
app.use(express.json());

// ========== BASE DE DATOS EN MEMORIA (para la UI antigua) ==========
let agents = [];
let nextId = 1;
let chatMessages = [];

// ========== RUTAS API (para mantener compatibilidad) ==========
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
    res.status(201).json(agent);
});

app.delete('/api/agents/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = agents.findIndex(a => a.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    agents.splice(index, 1);
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
    res.json(agent);
});

// ========== UI PRINCIPAL CON IFRAME ==========
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
    html += '.container { width: 100%; max-width: 1400px; height: 90vh; display: flex; flex-direction: column; gap: 16px; }';
    html += '.header { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; }';
    html += '.header h1 { font-size: 1.5rem; display: flex; align-items: center; gap: 12px; }';
    html += '.header a { color: #0d9488; text-decoration: none; font-size: 0.9rem; }';
    html += '.header a:hover { text-decoration: underline; }';
    html += '.iframe-wrapper { flex: 1; background: #0f172a; border-radius: 12px; overflow: hidden; border: 1px solid #334155; }';
    html += '.iframe-wrapper iframe { width: 100%; height: 100%; border: none; background: #0f172a; }';
    html += '.footer { text-align: center; color: #64748b; font-size: 0.8rem; padding: 8px; }';
    html += '.footer a { color: #0d9488; text-decoration: none; }';
    html += '@media (max-width: 768px) { .header { flex-direction: column; gap: 8px; text-align: center; } }';
    html += '</style>';
    html += '</head>';
    html += '<body>';
    html += '<div class="container">';
    html += '  <div class="header">';
    html += '    <h1>🏢 Agent Office</h1>';
    html += '    <div>';
    html += '      <a href="https://pixel-agents-web.onrender.com" target="_blank">🔗 Abrir en nueva ventana</a>';
    html += '      <span style="color: #64748b; margin: 0 12px;">·</span>';
    html += '      <a href="https://meditech-tienda.onrender.com">← Volver a MediTech</a>';
    html += '    </div>';
    html += '  </div>';
    html += '  <div class="iframe-wrapper">';
    html += '    <iframe src="https://pixel-agents-web.onrender.com" allow="autoplay; encrypted-media" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>';
    html += '  </div>';
    html += '  <div class="footer">';
    html += '    <span>🤖 Agentes 24/7</span> · ';
    html += '    <span>🔒 Administrador</span> · ';
    html += '    <span><a href="https://github.com/calm291094-del/agent-office">GitHub</a></span>';
    html += '  </div>';
    html += '</div>';
    html += '</body>';
    html += '</html>';
    
    res.send(html);
});

app.listen(PORT, () => {
    console.log('✅ Agent Office UI + API en puerto ' + PORT);
    console.log('🌐 http://localhost:' + PORT);
});
