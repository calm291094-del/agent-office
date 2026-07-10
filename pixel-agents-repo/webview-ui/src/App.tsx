import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

// Interfaz para los agentes desde la API
interface Agent {
    id: number;
    name: string;
    role: string;
    status: string;
    icon: string;
    color: string;
}

// Escena de Phaser que carga agentes desde la API
class OfficeScene extends Phaser.Scene {
    private agents: Agent[] = [];
    private agentSprites: Map<number, Phaser.GameObjects.Image> = new Map();
    private speechBubble: Phaser.GameObjects.Text | null = null;
    private speechTimer: number = 0;

    constructor() {
        super('OfficeScene');
    }

    // Método para actualizar agentes desde la API
    updateAgents(agents: Agent[]) {
        this.agents = agents;
        this.updateAgentPositions();
    }

    create() {
        // 1. Fondo de la oficina
        this.add.graphics().fillStyle(0x2d3748, 1).fillRect(0, 0, 800, 600);
        
        // 2. Dibujar escritorios
        const desks = [
            { x: 150, y: 150 }, { x: 350, y: 150 }, { x: 550, y: 150 },
            { x: 150, y: 350 }, { x: 350, y: 350 }, { x: 550, y: 350 }
        ];
        desks.forEach(pos => {
            const desk = this.add.graphics();
            desk.fillStyle(0x4a5563, 1);
            desk.fillRect(pos.x - 20, pos.y - 20, 40, 40);
            this.add.text(pos.x - 10, pos.y - 25, '💻', { fontSize: '20px' });
        });

        // 3. Crear los agentes (se actualizarán con los datos de la API)
        this.agentSprites = new Map();
        this.speechBubble = this.add.text(400, 50, '', {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#1a202c',
            padding: { x: 16, y: 8 },
            borderColor: '#4a5563',
            borderWidth: 1,
            borderRadius: 12,
            fontFamily: 'Segoe UI, sans-serif'
        });
        this.speechBubble.setVisible(false);
        this.speechBubble.setOrigin(0.5, 0);

        // Cargar agentes iniciales desde la API
        this.loadAgentsFromAPI();
    }

    async loadAgentsFromAPI() {
        try {
            const response = await fetch('/api/agents');
            const agents = await response.json();
            this.updateAgents(agents);
        } catch (error) {
            console.error('Error cargando agentes desde la API:', error);
        }
    }

    updateAgentPositions() {
        // Limpiar sprites antiguos
        this.agentSprites.forEach(sprite => sprite.destroy());
        this.agentSprites.clear();

        // Crear nuevos sprites para cada agente
        this.agents.forEach((agent, index) => {
            // Posición aleatoria pero fija para cada agente
            const x = 100 + (index % 5) * 140;
            const y = 100 + Math.floor(index / 5) * 150;
            
            // Crear sprite usando un círculo de colores (reemplazaremos con sprites reales después)
            const sprite = this.add.graphics();
            const color = parseInt(agent.color.replace('#', ''), 16);
            sprite.fillStyle(color, 1);
            sprite.fillCircle(0, 0, 25);
            
            // Posicionar el sprite
            sprite.x = x;
            sprite.y = y;
            sprite.setInteractive();
            
            // Guardar referencia
            this.agentSprites.set(agent.id, sprite as any);

            // Nombre del agente
            this.add.text(x - 20, y - 40, agent.name, {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Segoe UI, sans-serif'
            });

            // Estado del agente
            const statusColors: Record<string, string> = {
                'working': '#10b981',
                'thinking': '#f59e0b',
                'idle': '#94a3b8'
            };
            this.add.text(x - 15, y + 35, agent.status, {
                fontSize: '10px',
                color: statusColors[agent.status] || '#94a3b8',
                fontFamily: 'Segoe UI, sans-serif'
            });

            // Interacción al hacer clic
            sprite.on('pointerdown', () => {
                this.showSpeechBubble(`💬 ${agent.name}: ¡Hola! Soy ${agent.role}`, 3000);
            });
        });
    }

    showSpeechBubble(text: string, duration: number) {
        if (this.speechBubble) {
            this.speechBubble.setText(text);
            this.speechBubble.setVisible(true);
            this.speechBubble.x = 400;
            this.speechBubble.y = 50;
            
            // Ocultar después de 'duration' ms
            if (this.speechTimer) {
                clearTimeout(this.speechTimer);
            }
            this.speechTimer = window.setTimeout(() => {
                if (this.speechBubble) {
                    this.speechBubble.setVisible(false);
                }
            }, duration);
        }
    }

    // Método para actualizar la posición de un agente (usado por WebSockets)
    updateAgentPosition(agentId: number, x: number, y: number) {
        const sprite = this.agentSprites.get(agentId);
        if (sprite) {
            // Animar el movimiento
            this.tweens.add({
                targets: sprite,
                x: x,
                y: y,
                duration: 1000,
                ease: 'Linear'
            });
        }
    }
}

// Componente React
function App() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const [game, setGame] = useState<Phaser.Game | null>(null);
    const [scene, setScene] = useState<OfficeScene | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);

    // Inicializar Phaser
    useEffect(() => {
        if (gameContainerRef.current) {
            const newGame = new Phaser.Game({
                type: Phaser.AUTO,
                parent: gameContainerRef.current,
                width: 800,
                height: 600,
                backgroundColor: '#2d3748',
                scene: OfficeScene,
            });

            setGame(newGame);

            // Obtener la escena cuando esté lista
            newGame.events.once('ready', () => {
                const sceneInstance = newGame.scene.getScene('OfficeScene') as OfficeScene;
                setScene(sceneInstance);
            });

            return () => {
                newGame.destroy(true);
            };
        }
    }, []);

    // Conectar WebSocket
    useEffect(() => {
        // Determinar la URL del WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log('✅ Conectado al WebSocket');
            setWs(socket);
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error procesando mensaje WebSocket:', error);
            }
        };

        socket.onerror = (error) => {
            console.error('Error WebSocket:', error);
        };

        socket.onclose = () => {
            console.log('❌ WebSocket desconectado');
            // Intentar reconectar después de 5 segundos
            setTimeout(() => {
                if (ws === null || ws.readyState === WebSocket.CLOSED) {
                    setWs(null);
                }
            }, 5000);
        };

        return () => {
            socket.close();
        };
    }, []);

    // Manejar mensajes del WebSocket
    const handleWebSocketMessage = (data: any) => {
        switch (data.type) {
            case 'init':
                // Recibir agentes iniciales
                if (scene && data.agents) {
                    scene.updateAgents(data.agents);
                }
                break;
                
            case 'agent-update':
                // Actualizar un agente específico
                if (scene && data.agent) {
                    // Actualizar lista de agentes
                    // (Implementar lógica de actualización)
                    console.log('Agente actualizado:', data.agent);
                }
                break;
                
            case 'agent-move':
                // Mover un agente
                if (scene && data.agentId !== undefined && data.x !== undefined && data.y !== undefined) {
                    scene.updateAgentPosition(data.agentId, data.x, data.y);
                }
                break;
                
            case 'agent-speech':
                // Mostrar mensaje de agente
                if (scene && data.agentId && data.text) {
                    // Buscar el nombre del agente
                    // (Por simplicidad, mostrar el mensaje directamente)
                    scene.showSpeechBubble(`💬 Agente: ${data.text}`, 3000);
                }
                break;
                
            default:
                console.log('Mensaje WebSocket no manejado:', data);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <div ref={gameContainerRef} style={{ width: '800px', height: '600px' }} />
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                color: '#94a3b8',
                fontSize: '12px',
                fontFamily: 'Segoe UI, sans-serif',
                background: 'rgba(0,0,0,0.7)',
                padding: '4px 12px',
                borderRadius: '8px'
            }}>
                {ws && ws.readyState === WebSocket.OPEN ? '🔵 Conectado' : '🔴 Desconectado'}
            </div>
        </div>
    );
}

export default App;
