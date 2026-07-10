import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

// ============================================================
// INTERFAZ DE AGENTES
// ============================================================
interface Agent {
    id: number;
    name: string;
    role: string;
    status: string;
    icon: string;
    color: string;
    x: number;
    y: number;
}

// ============================================================
// SPRITES PIXEL ART EN BASE64
// ============================================================
const SPRITES = {
    // Agente 1 (personaje azul)
    agent1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAABdklEQVRYhe2Wz0rDQBDGfzvVNFCNkFBRQY/iwT4AiAdfQW9eBaEXD4L4RnoUQfSm/6WIVyG9eBIEQTSi5rCp0qbZJk2y+wXaWAxJNvvNb/ORAF4TRV3Xf0m2IRgbO2t1fwz7IDBDwBcIGg4z5WmCQh0wHlYrYAym1JCApP86e13ak3hCBVJNwLtwBhkxH0DMgGgygmhPjf6tARq5fQHjMP/DGGmAXDK/5zI2rQpFAsKwYHkmqRBzDpjxI94n96/0+F4rhPK5LBSW0oEnSJJF80DaRynadE6h8AAGJQCQzMMcIDVDzGu0PTGmCH1d9f6gj4eTbK8OB4N0Z9iQy0w6fQTCWShQMBt4oOwpcw8E8UQ4E7NA+4Td/1umQUHEBsAR+QhK0jtzTEhSo0Gh16dIIsjW/RlJS+AA9lC4omP+SCSpt6cBxUV6HQOejQGnT+5+8T4XcM/wDfAHn9O+2QLGGmQ22brP5d8SYA9cLcC+Kwfw/HC+Abt1P+wUfO3uAAAAAElFTkSuQmCC',
    
    // Agente 2 (personaje rojo)
    agent2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAABbUlEQVRYhe2Wv0rDUBjFnzSNtdaBJoUWoUjp0kXwARx8BZ25KQ7t5CgI4kt00wEW0aVOglKqS5ciLkKB2ilVKU0MibS9zU3j3dJ8CEhIbsi9H985nHME8J8p2rbtD7I5wQR5rDcGZxMAgHfA4RQRh8kyoAH+ygHMw7ACzNjfP2I++SUcQcTfB4w2HXg7xLCeIhMA90DunGseAiA+JpVMkDfeZdyXi0CEHhCPh1i/jxSLxUVg4WI7mDvTMPDQFiyXuZ9MQQlQbs8yBQTAsQzsRAEIf1L6jXqlxO98xrjgARU+ELDAANJUGGAuYSE6EVEYks5JjQCzUQAtESkpQjI7XcYv9+vQ3QjGzIx9piYzswWEM84CwWxi/UIY4BNUN3BQvTL7F/8MAEL9wPwBzDqhDSJXhE3q3aPv39O3TfYNfA/iADoYCQ+MH3zN2c29jge9FphYfz7g7AX4A5/uQ2eXWZ0HAAAAAElFTkSuQmCC',
    
    // Agente 3 (personaje verde)
    agent3: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAABfklEQVRYhe2WPUvDUBiFnzRprbVKdBD8AtuliyA4uDk4Ogid1E0w/gPpxT8gWEWnLs4KUhBcsot0q6CDf8HWSkM+Qk1bG5Kb5I3mpjQgAgnJkHtyH849hH4BBG3b/iTZhGBs7KzV/TFsg8AMAV8gaDjMlKcJCnXAeFgtgDGYUkMCkv7r7HVpT+IJFUg1Ae/CGWTEPAziOmA6GUG0p0b/1gCN3L6AcZj/IYw0QC6Z33MZm1aFIgFhWLA8k1SIOQfM+BHvk/tXenyvFUL5XBYKS+nAEyTJonkg7aMUbTqnUHgAAxIASOZhDpCaIeY12p4YU4S+rnp/0MfDSbZXh4NBujNsyGUm1z4B4SwUKJgNPFD2lLkHgnhCnIlZoH3C7v8t06CgBweBwymZTU7mCgBy2oygDTCp7nOeiQExB8x4k3qX3L/S43utEMrnsnDy8CJkAcBc2A5m7fREdAiK7WBm72EmyiFTADQ9MNPAVPfaY/eYkFuMVLn0ArPUHS3AF8Vaw1d6P7NwAAAAAElFTkSuQmCC',
    
    // Escritorio pixel art
    desk: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAAzUlEQVRYhe2WwQ2CMBRF35d0A+TqBsrALsC6gQ4mjgzqCMqQ7vSnxVsrQdhCG6UJb/Jem9A3vyEnQZAkiX3uA1oD9kC9DewcQAgBQohrhgCQUiKEUEJ/3p1z4JxzD2xmhpkhtxFO2xbk15OBgNauElLrI4YAglKKyE9tJRCAP2E1UJYliqJAURQQQmD4hBCCpmkghPj+R0jFMAxI0xRaa7TtREQEURShaRok8zAAwDBkSZJAVz2e53kIoIE+0DWl7mQghGjw+fiZ7N83Pnv0AJKLc8id77IYAAAAAElFTkSuQmCC',
    
    // Piso de la oficina
    floor: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAAqklEQVRYhe2WwQ2DMAxF30tH6AqM0BEYgQ2yQRUYgRU6QndgBIboCBmBLkyRSuoUGcUpQTzpu7T4xXo+GIiIbjqC9/5KfA6gj9ZitLYd0lpkpM/5FwgoisI451C3LcZhsCqCgBAiAIiIDt7n59r/BeB1hOD9+AFwzvnPXV4CArquQ1mW0FqjKAqUZQmtNR4POIaAEIJbLpfLYRiG34KUUllPGgIYhxU0TUNreVWv5Xie5weHm37akLe7LwAAAABJRU5ErkJggg=='
};

// ============================================================
// ESCENA DE PHASER
// ============================================================
class OfficeScene extends Phaser.Scene {
    private agents: Agent[] = [];
    private agentSprites: Map<number, Phaser.GameObjects.Image> = new Map();
    private agentNames: Map<number, Phaser.GameObjects.Text> = new Map();
    private speechBubble: Phaser.GameObjects.Text | null = null;
    private speechTimer: number = 0;
    private statusTexts: Map<number, Phaser.GameObjects.Text> = new Map();

    constructor() {
        super('OfficeScene');
    }

    // ============================================================
    // PRECARGA DE SPRITES
    // ============================================================
    preload() {
        // Cargar sprites de agentes
        this.load.image('agent1', SPRITES.agent1);
        this.load.image('agent2', SPRITES.agent2);
        this.load.image('agent3', SPRITES.agent3);
        
        // Cargar sprites de oficina
        this.load.image('desk', SPRITES.desk);
        this.load.image('floor', SPRITES.floor);
    }

    // ============================================================
    // CREACIÓN DE LA ESCENA
    // ============================================================
    create() {
        // 1. Piso de la oficina (patrón de baldosas)
        const floorPattern = this.add.image(400, 300, 'floor');
        floorPattern.setScale(20);
        floorPattern.setTint(0x2d3748);

        // 2. Dibujar escritorios con sprites
        const desks = [
            { x: 120, y: 120 }, { x: 320, y: 120 }, { x: 520, y: 120 },
            { x: 120, y: 320 }, { x: 320, y: 320 }, { x: 520, y: 320 }
        ];
        desks.forEach(pos => {
            const desk = this.add.image(pos.x, pos.y, 'desk');
            desk.setScale(1.8);
            
            // Etiqueta del escritorio
            this.add.text(pos.x - 15, pos.y + 25, '💻', {
                fontSize: '16px',
                fontFamily: 'Segoe UI, sans-serif'
            });
        });

        // 3. Inicializar contenedores de agentes
        this.agentSprites = new Map();
        this.agentNames = new Map();
        this.statusTexts = new Map();

        // 4. Burbuja de diálogo
        this.speechBubble = this.add.text(400, 30, '', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#1a202c',
            padding: { x: 16, y: 10 },
            borderColor: '#4a5563',
            borderWidth: 2,
            borderRadius: 12,
            fontFamily: 'Segoe UI, sans-serif',
            align: 'center'
        });
        this.speechBubble.setVisible(false);
        this.speechBubble.setOrigin(0.5, 0);

        // 5. Cargar agentes desde la API
        this.loadAgentsFromAPI();

        // 6. Conectar WebSocket
        this.connectWebSocket();
    }

    // ============================================================
    // CARGA DE AGENTES DESDE API
    // ============================================================
    async loadAgentsFromAPI() {
        try {
            const response = await fetch('/api/agents');
            if (!response.ok) throw new Error('Error al cargar agentes');
            const agents = await response.json();
            this.updateAgents(agents);
        } catch (error) {
            console.error('Error cargando agentes:', error);
            // Cargar agentes de respaldo si la API falla
            this.loadFallbackAgents();
        }
    }

    loadFallbackAgents() {
        const fallbackAgents: Agent[] = [
            { id: 1, name: 'Ana', role: 'CEO', status: 'working', icon: '👩‍💼', color: '#8b5cf6', x: 150, y: 150 },
            { id: 2, name: 'Carlos', role: 'Dev', status: 'thinking', icon: '👨‍💻', color: '#3b82f6', x: 350, y: 150 },
            { id: 3, name: 'Marta', role: 'Design', status: 'idle', icon: '🎨', color: '#ec4899', x: 550, y: 150 },
            { id: 4, name: 'Luis', role: 'Marketing', status: 'working', icon: '📊', color: '#f59e0b', x: 150, y: 350 },
            { id: 5, name: 'Sofía', role: 'Support', status: 'idle', icon: '💁‍♀️', color: '#10b981', x: 350, y: 350 }
        ];
        this.updateAgents(fallbackAgents);
    }

    // ============================================================
    // ACTUALIZACIÓN DE AGENTES
    // ============================================================
    updateAgents(agents: Agent[]) {
        this.agents = agents;
        this.renderAgents();
    }

    renderAgents() {
        // Limpiar sprites anteriores
        this.agentSprites.forEach(sprite => sprite.destroy());
        this.agentNames.forEach(text => text.destroy());
        this.statusTexts.forEach(text => text.destroy());
        this.agentSprites.clear();
        this.agentNames.clear();
        this.statusTexts.clear();

        // Crear nuevos sprites para cada agente
        this.agents.forEach((agent, index) => {
            const x = agent.x || (100 + (index % 5) * 140);
            const y = agent.y || (100 + Math.floor(index / 5) * 180);

            // Seleccionar sprite según el ID
            const spriteKey = `agent${(agent.id % 3) + 1}`;
            const sprite = this.add.image(x, y, spriteKey);
            sprite.setScale(2);
            sprite.setInteractive();

            // Guardar referencia del sprite
            this.agentSprites.set(agent.id, sprite);

            // Nombre del agente
            const nameText = this.add.text(x - 20, y - 45, agent.name, {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Segoe UI, sans-serif',
                fontStyle: 'bold',
                backgroundColor: '#1a202c',
                padding: { x: 6, y: 2 },
                borderRadius: 6
            });
            nameText.setOrigin(0.5, 0);
            this.agentNames.set(agent.id, nameText);

            // Estado del agente con color
            const statusColors: Record<string, string> = {
                'working': '#10b981',
                'thinking': '#f59e0b',
                'idle': '#94a3b8'
            };
            const statusText = this.add.text(x, y + 35, agent.status, {
                fontSize: '11px',
                color: statusColors[agent.status] || '#94a3b8',
                fontFamily: 'Segoe UI, sans-serif',
                fontStyle: 'bold',
                backgroundColor: '#1a202c',
                padding: { x: 8, y: 2 },
                borderRadius: 10
            });
            statusText.setOrigin(0.5, 0);
            this.statusTexts.set(agent.id, statusText);

            // Interacción al hacer clic en el agente
            sprite.on('pointerdown', () => {
                // Cambiar estado vía WebSocket
                this.sendAgentAction(agent.id, 'working');
                this.showSpeechBubble(`💬 ${agent.name}: ¡Hola! Soy ${agent.role}`, 3000);
            });

            // Animación de "respiración" para agentes activos
            if (agent.status === 'working' || agent.status === 'thinking') {
                this.tweens.add({
                    targets: sprite,
                    scale: 2.1,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    // ============================================================
    // ACTUALIZACIÓN DE POSICIÓN (WebSocket)
    // ============================================================
    updateAgentPosition(agentId: number, x: number, y: number) {
        const sprite = this.agentSprites.get(agentId);
        if (sprite) {
            this.tweens.add({
                targets: sprite,
                x: x,
                y: y,
                duration: 800,
                ease: 'Linear'
            });
        }
        
        // Actualizar también el nombre y estado si existen
        const nameText = this.agentNames.get(agentId);
        if (nameText) {
            this.tweens.add({
                targets: nameText,
                x: x - 20,
                y: y - 45,
                duration: 800,
                ease: 'Linear'
            });
        }
        
        const statusText = this.statusTexts.get(agentId);
        if (statusText) {
            this.tweens.add({
                targets: statusText,
                x: x,
                y: y + 35,
                duration: 800,
                ease: 'Linear'
            });
        }
    }

    // ============================================================
    // ACTUALIZACIÓN DE ESTADO (WebSocket)
    // ============================================================
    updateAgentStatus(agentId: number, status: string) {
        const statusText = this.statusTexts.get(agentId);
        if (statusText) {
            const statusColors: Record<string, string> = {
                'working': '#10b981',
                'thinking': '#f59e0b',
                'idle': '#94a3b8'
            };
            statusText.setText(status);
            statusText.setColor(statusColors[status] || '#94a3b8');
        }

        // Actualizar animación del sprite
        const sprite = this.agentSprites.get(agentId);
        if (sprite) {
            // Detener animaciones existentes
            this.tweens.killTweensOf(sprite);
            sprite.setScale(2);
            
            if (status === 'working' || status === 'thinking') {
                this.tweens.add({
                    targets: sprite,
                    scale: 2.1,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        }
    }

    // ============================================================
    // BURBUJA DE DIÁLOGO
    // ============================================================
    showSpeechBubble(text: string, duration: number) {
        if (this.speechBubble) {
            this.speechBubble.setText(text);
            this.speechBubble.setVisible(true);
            this.speechBubble.x = 400;
            this.speechBubble.y = 30;
            
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

    // ============================================================
    // WEBSOCKET
    // ============================================================
    private ws: WebSocket | null = null;

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('✅ WebSocket conectado');
            // Mostrar estado en la UI
            this.showSpeechBubble('🔵 Conectado al servidor', 2000);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleWebSocketMessage(data);
            } catch (error) {
                console.error('Error en mensaje WebSocket:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            this.showSpeechBubble('🔴 Error de conexión', 3000);
        };

        this.ws.onclose = () => {
            console.log('❌ WebSocket desconectado');
            this.showSpeechBubble('🔴 Desconectado, reconectando...', 3000);
            // Reconectar después de 5 segundos
            setTimeout(() => {
                if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                    this.connectWebSocket();
                }
            }, 5000);
        };
    }

    handleWebSocketMessage(data: any) {
        switch (data.type) {
            case 'init':
                if (data.agents) {
                    this.updateAgents(data.agents);
                }
                break;
                
            case 'agent-update':
                if (data.agent) {
                    const agent = data.agent as Agent;
                    // Actualizar en la lista local
                    const index = this.agents.findIndex(a => a.id === agent.id);
                    if (index !== -1) {
                        this.agents[index] = agent;
                        // Actualizar en UI
                        this.updateAgentStatus(agent.id, agent.status);
                    }
                }
                break;
                
            case 'agent-move':
                if (data.agentId !== undefined && data.x !== undefined && data.y !== undefined) {
                    this.updateAgentPosition(data.agentId, data.x, data.y);
                }
                break;
                
            case 'agent-speech':
                if (data.agentId && data.text) {
                    const agent = this.agents.find(a => a.id === data.agentId);
                    const name = agent ? agent.name : 'Agente';
                    this.showSpeechBubble(`💬 ${name}: ${data.text}`, 4000);
                }
                break;
                
            case 'agent-created':
                if (data.agent) {
                    // Actualizar lista de agentes
                    this.agents.push(data.agent);
                    this.renderAgents();
                    this.showSpeechBubble(`🎉 Nuevo agente: ${data.agent.name}`, 3000);
                }
                break;
                
            default:
                console.log('Mensaje no manejado:', data);
        }
    }

    sendAgentAction(agentId: number, action: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'agent-action',
                agentId: agentId,
                action: action
            }));
        }
    }

    sendAgentSpeech(agentId: number, text: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'agent-speech',
                agentId: agentId,
                text: text
            }));
        }
    }

    // ============================================================
    // UPDATE CICLO (opcional)
    // ============================================================
    update() {
        // Aquí se puede agregar lógica de actualización continua si es necesario
    }
}

// ============================================================
// COMPONENTE REACT
// ============================================================
function App() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const [game, setGame] = useState<Phaser.Game | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (gameContainerRef.current) {
            const newGame = new Phaser.Game({
                type: Phaser.AUTO,
                parent: gameContainerRef.current,
                width: 800,
                height: 600,
                backgroundColor: '#1a202c',
                scene: OfficeScene,
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH
                }
            });

            setGame(newGame);

            // Verificar conexión WebSocket cada 5 segundos
            const interval = setInterval(() => {
                const scene = newGame.scene.getScene('OfficeScene') as OfficeScene;
                if (scene && scene.ws) {
                    setIsConnected(scene.ws.readyState === WebSocket.OPEN);
                }
            }, 5000);

            return () => {
                clearInterval(interval);
                newGame.destroy(true);
            };
        }
    }, []);

    return (
        <div style={{ 
            position: 'relative', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '100vh',
            background: '#0f172a'
        }}>
            <div ref={gameContainerRef} style={{ 
                width: '800px', 
                height: '600px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
            }} />
            
            {/* Indicador de estado de conexión */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: isConnected ? '#10b981' : '#ef4444',
                fontSize: '14px',
                fontFamily: 'Segoe UI, sans-serif',
                background: 'rgba(0,0,0,0.7)',
                padding: '6px 16px',
                borderRadius: '20px',
                border: `1px solid ${isConnected ? '#10b981' : '#ef4444'}`
            }}>
                {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </div>
        </div>
    );
}

export default App;
