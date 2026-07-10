// server.js - Servidor de Agent Office
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Estado de los agentes
let agents = [];

// Crear un agente
app.post('/api/agents', (req, res) => {
    const { name, role } = req.body;
    const newAgent = {
        id: 'agent-' + Date.now(),
        name: name || 'Agente',
        role: role || 'Assistant',
        status: 'idle',
        created_at: new Date().toISOString()
    };
    agents.push(newAgent);
    res.json(newAgent);
});

// Obtener todos los agentes
app.get('/api/agents', (req, res) => {
    res.json(agents);
});

// Asignar tarea a un agente
app.post('/api/tasks', (req, res) => {
    const { agentId, description } = req.body;
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
        return res.status(404).json({ error: 'Agente no encontrado' });
    }
    const task = {
        id: 'task-' + Date.now(),
        agentId,
        description,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    agent.status = 'working';
    res.json({ message: 'Tarea asignada', task });
});

// Obtener tareas
app.get('/api/tasks', (req, res) => {
    res.json({ tasks: [] });
});

app.listen(PORT, () => {
    console.log(`✅ Agent Office Server en puerto ${PORT}`);
});

// Agrega esta función al servidor
async function consultarIA(mensaje) {
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { 
                        role: 'system', 
                        content: 'Eres un asistente virtual de MediTech. Hablas en español, eres amable y profesional. Ayudas con tareas de administración, gestión de productos y atención al cliente.' 
                    },
                    { role: 'user', content: mensaje }
                ],
                model: 'openai'
            })
        });
        const texto = await response.text();
        return texto || "Lo siento, no pude procesar tu solicitud.";
    } catch (error) {
        console.error('Error en IA:', error);
        return "Lo siento, hubo un error al procesar tu solicitud.";
    }
}

// Nueva ruta para chat con IA
app.post('/api/chat', async (req, res) => {
    const { message, agentId } = req.body;
    try {
        const respuesta = await consultarIA(message);
        const agent = agents.find(a => a.id === agentId);
        res.json({ 
            response: respuesta,
            agent: agent ? agent.name : 'Asistente'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar el mensaje' });
    }
});
