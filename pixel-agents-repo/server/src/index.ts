// pixel-agents-repo/server/src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import path from 'path';

const server = Fastify({
    logger: true
});

// Registrar plugins
await server.register(cors, {
    origin: '*'
});

await server.register(websocket);

// Ruta de health check
server.get('/api/health', async (request, reply) => {
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'pixel-agents-server'
    };
});

// Ruta para servir la UI estática
server.get('/*', async (request, reply) => {
    return reply.sendFile('index.html', path.join(__dirname, '../../webview-ui/dist'));
});

// Configurar WebSocket para comunicación en tiempo real
server.register(async (fastify) => {
    fastify.get('/ws', { websocket: true }, (connection, request) => {
        connection.socket.on('message', (message) => {
            // Procesar mensajes de agentes
            console.log('Mensaje recibido:', message.toString());
        });
        
        // Enviar estado inicial
        connection.socket.send(JSON.stringify({
            type: 'init',
            data: { agents: [] }
        }));
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3100;
const HOST = process.env.HOST || '0.0.0.0';

server.listen({ port: Number(PORT), host: HOST }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`✅ Pixel Agents Server en ${address}`);
    console.log(`🌐 UI disponible en ${address}`);
});
