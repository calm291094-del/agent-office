// standalone-server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar la lógica del servidor original
// Asumiendo que el server original está en ../server/src/index.ts
const serverLogic = require('../server/src/index');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la UI
app.use(express.static(path.join(__dirname, '../webview-ui/dist')));

// Rutas de API (extraídas del server original)
app.get('/api/agents', (req, res) => {
    // Llamar a la función del servidor original
    res.json(serverLogic.getAgents());
});

app.post('/api/agents', (req, res) => {
    const agent = serverLogic.createAgent(req.body);
    res.status(201).json(agent);
});

// Ruta principal para la UI
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../webview-ui/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Pixel Agents Server en puerto ${PORT}`);
});
