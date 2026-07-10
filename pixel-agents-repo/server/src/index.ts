// server/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { getAgentDecision } from './ai/adapter.js';

const server = Fastify({ logger: true });
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3100;

// --- Configuración ---
await server.register(cors, { origin: '*' });
await server.register(websocket);
await server.register(fastifyStatic, {
    root: path.join(__dirname, '../../webview-ui/dist'),
    prefix: '/',
});

// --- Estado de los Agentes ---
let agents = [
    { id: 'alice', name: 'Alice', role: 'Engineer', status: 'idle', x: 100, y: 100 },
    { id: 'bob', name: 'Bob', role: 'Manager', status: 'idle', x: 300, y: 200 },
];
const connectedClients = new Set();

// --- Bucle de Pensamiento de los Agentes ---
async function agentThinkLoop() {
    for (const agent of agents) {
        try {
            const prompt = `Eres ${agent.name}, un ${agent.role}. Tu estado actual es "${agent.status}". ¿Qué deberías hacer ahora?`;
            const decision = await getAgentDecision(prompt);
            const parsedDecision = JSON.parse(decision);
            agent.status = parsedDecision.action || 'idle';
            const message = parsedDecision.message || `${agent.name} está ${agent.status}.`;
            broadcastMessage({
                type: 'agent-update',
                agentId: agent.id,
                status: agent.status,
                message: message,
            });
            console.log(`🧠 ${agent.name} decide: ${parsedDecision.action} - ${message}`);
        } catch (error) {
            console.error(`Error en el ciclo de pensamiento para ${agent.name}:`, error);
        }
    }
}

// --- Función para Transmitir Mensajes ---
function broadcastMessage(data: any) {
    const message = JSON.stringify(data);
    connectedClients.forEach((client: any) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
        }
    });
}

// --- Ruta de Health Check ---
server.get('/api/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'pixel-agents-standalone' };
});

// --- WebSocket ---
server.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (connection, request) => {
        console.log('✅ Nuevo cliente conectado');
        connectedClients.add(connection.socket);

        // Enviar el estado inicial de los agentes al cliente
        connection.socket.send(JSON.stringify({
            type: 'init',
            agents: agents,
        }));

        connection.socket.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.type === 'agent-action') {
                    const agent = agents.find(a => a.id === data.agentId);
                    if (agent) {
                        agent.status = data.action;
                        broadcastMessage({
                            type: 'agent-update',
                            agentId: agent.id,
                            status: agent.status,
                            message: `${agent.name} cambió a estado: ${agent.status}`,
                        });
                    }
                }
            } catch (e) {
                console.error('Error procesando mensaje del cliente:', e);
            }
        });

        connection.socket.on('close', () => {
            console.log('❌ Cliente desconectado');
            connectedClients.delete(connection.socket);
        });
    });
});

// --- Iniciar el servidor y el bucle de agentes ---
await server.listen({ port: PORT, host: '0.0.0.0' });
console.log(`🚀 Servidor Pixel Agents en http://localhost:${PORT}`);
console.log(`📡 WebSocket en ws://localhost:${PORT}/ws`);

// Ejecutar el bucle de pensamiento cada 10 segundos
setInterval(agentThinkLoop, 10000);
