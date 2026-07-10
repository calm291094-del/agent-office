// pixel-agents-repo/server.js - Servidor standalone para Render
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());

// ============================================================
// RUTAS API
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'pixel-agents-server',
        version: '1.0.0'
    });
});

// Obtener agentes (ejemplo)
app.get('/api/agents', (req, res) => {
    res.json({
        agents: [
            { id: 1, name: 'Alice', role: 'Engineer', status: 'working' },
            { id: 2, name: 'Bob', role: 'Manager', status: 'thinking' }
        ]
    });
});

// ============================================================
// SERVIDOR DE ARCHIVOS ESTÁTICOS (UI)
// ============================================================

// Servir la UI si existe
const uiPath = path.join(__dirname, 'webview-ui/dist');
app.use(express.static(uiPath));

// Ruta catch-all para la UI
app.get('*', (req, res) => {
    res.sendFile(path.join(uiPath, 'index.html'));
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(PORT, () => {
    console.log(`✅ Pixel Agents Server en puerto ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
