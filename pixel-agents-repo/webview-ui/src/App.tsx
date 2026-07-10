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
// SPRITES DE CDN GRATUITOS (Pixel Art)
// ============================================================
const SPRITE_URLS = {
    // Agentes (personajes pixel art de código abierto)
    agent1: 'https://via.placeholder.com/48/8b5cf6/FFFFFF?text=🤖',
    agent2: 'https://via.placeholder.com/48/3b82f6/FFFFFF?text=🤖',
    agent3: 'https://via.placeholder.com/48/ec4899/FFFFFF?text=🤖',
    
    // Escritorio
    desk: 'https://via.placeholder.com/48/4a5563/FFFFFF?text=💻',
    
    // Piso
    floor: 'https://via.placeholder.com/48/2d3748/FFFFFF?text=⬜'
};

// ============================================================
// ESCENA DE PHASER CON SPRITES DE CDN
// ============================================================
class OfficeScene extends Phaser.Scene {
    private agents: Agent[] = [];
    private agentSprites: Map<number, Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics> = new Map();
    private agentNames: Map<number, Phaser.GameObjects.Text> = new Map();
    private statusTexts: Map<number, Phaser.GameObjects.Text> = new Map();
    private speechBubble: Phaser.GameObjects.Text | null = null;
    private speechTimer: number = 0;
    private ws: WebSocket | null = null;
    private isConnected: boolean = false;
    private gameStarted: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;

    constructor() {
        super('OfficeScene');
    }

    // ============================================================
    // PRECARGA DE SPRITES DESDE CDN
    // ============================================================
    preload() {
        // Cargar sprites desde CDN
        this.load.image('agent1', SPRITE_URLS.agent1);
        this.load.image('agent2', SPRITE_URLS.agent2);
        this.load.image('agent3', SPRITE_URLS.agent3);
        this.load.image('desk', SPRITE_URLS.desk);
        this.load.image('floor', SPRITE_URLS.floor);
        
        // Mostrar progreso de carga
        this.load.on('progress', (value: number) => {
            console.log(`Cargando sprites: ${Math.round(value * 100)}%`);
        });
        
        this.load.on('complete', () => {
            console.log('✅ Todos los sprites cargados correctamente');
            this.showSpeechBubble('✅ Oficina lista', 1500);
        });
        
        this.load.on('loaderror', (file: any) => {
            console.warn(`⚠️ Error cargando sprite: ${file.key}`, file.url);
            this.showSpeechBubble(`⚠️ Error cargando: ${file.key}`, 2000);
        });
    }

    // ============================================================
    // CREACIÓN DE LA ESCENA
    // ============================================================
    create() {
        // 1. Fondo de la oficina con degradado
        const bg = this.add.graphics();
        bg.fillStyle(0x1a202c, 1);
        bg.fillRect(0, 0, 800, 600);
        
        // 2. Dibujar escritorios con sprites
        const desks = [
            { x: 120, y: 120 }, { x: 320, y: 120 }, { x: 520, y: 120 },
            { x: 120, y: 320 }, { x: 320, y: 320 }, { x: 520, y: 320 }
        ];
        
        desks.forEach(pos => {
            // Usar sprite de escritorio si está cargado, si no, usar gráfico simple
            if (this.textures.exists('desk')) {
                const desk = this.add.image(pos.x, pos.y, 'desk');
                desk.setScale(1.5);
                desk.setAlpha(0.9);
            } else {
                // Fallback: dibujar un rectángulo con sombra
                const desk = this.add.graphics();
                desk.fillStyle(0x4a5563, 1);
                desk.fillRect(pos.x - 25, pos.y - 20, 50, 40);
                desk.lineStyle(2, 0x2d3748);
                desk.strokeRect(pos.x - 25, pos.y - 20, 50, 40);
            }
            
            // Ícono de computadora
            const computer = this.add.text(pos.x - 10, pos.y - 10, '💻', { 
                fontSize: '24px',
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000',
                    blur: 4,
                    fill: true
                }
            });
        });

        // 3. Inicializar contenedores
        this.agentSprites = new Map();
        this.agentNames = new Map();
        this.statusTexts = new Map();

        // 4. Burbuja de diálogo mejorada
        this.speechBubble = this.add.text(400, 30, '', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#1a202c',
            padding: { x: 16, y: 10 },
            borderColor: '#0d9488',
            borderWidth: 2,
            borderRadius: 12,
            fontFamily: 'Segoe UI, sans-serif',
            align: 'center',
            shadow: {
                offsetX: 0,
                offsetY: 4,
                color: '#000',
                blur: 8,
                fill: true
            }
        });
        this.speechBubble.setVisible(false);
        this.speechBubble.setOrigin(0.5, 0);

        // 5. Iniciar el juego (activar audio con interacción)
        this.input.on('pointerdown', () => {
            if (!this.gameStarted) {
                this.gameStarted = true;
                if (this.sound) {
                    this.sound.resumeAll();
                }
                console.log('🎮 Juego activado por interacción del usuario');
                this.showSpeechBubble('🎮 ¡Bienvenido a la oficina!', 2000);
            }
        });

        // 6. Cargar agentes desde la API
        this.loadAgentsFromAPI();

        // 7. Conectar WebSocket
        this.connectWebSocket();

        // 8. Mostrar mensaje de bienvenida
        this.showSpeechBubble('🎮 Haz clic en la pantalla para interactuar', 3000);
    }

    // ============================================================
    // CARGA DE AGENTES DESDE API
    // ============================================================
    async loadAgentsFromAPI() {
        try {
            const response = await fetch('/api/agents');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const agents = await response.json();
            if (Array.isArray(agents) && agents.length > 0) {
                this.updateAgents(agents);
                this.showSpeechBubble(`✅ ${agents.length} agentes cargados`, 2000);
            } else {
                this.loadFallbackAgents();
            }
        } catch (error) {
            console.error('Error cargando agentes:', error);
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
        this.showSpeechBubble('⚠️ Usando agentes de respaldo', 2000);
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

            // Seleccionar sprite según el ID (alternar entre 1, 2, 3)
            const spriteKey = `agent${(agent.id % 3) + 1}`;
            
            let sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
            
            // Usar sprite si está cargado, si no, usar un círculo de color
            if (this.textures.exists(spriteKey)) {
                sprite = this.add.sprite(x, y, spriteKey);
                (sprite as Phaser.GameObjects.Sprite).setScale(2);
                (sprite as Phaser.GameObjects.Sprite).setInteractive();
                // Agregar brillo al sprite
                (sprite as Phaser.GameObjects.Sprite).setTint(0xffffff);
            } else {
                // Fallback: círculo de color con borde
                const graphics = this.add.graphics();
                const color = parseInt(agent.color.replace('#', ''), 16);
                graphics.fillStyle(color, 1);
                graphics.fillCircle(0, 0, 25);
                graphics.lineStyle(3, 0x1a202c);
                graphics.strokeCircle(0, 0, 25);
                graphics.x = x;
                graphics.y = y;
                graphics.setInteractive();
                sprite = graphics;
            }

            this.agentSprites.set(agent.id, sprite);

            // Nombre del agente
            const nameText = this.add.text(x - 20, y - 45, agent.name, {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Segoe UI, sans-serif',
                fontStyle: 'bold',
                backgroundColor: 'rgba(26, 32, 44, 0.8)',
                padding: { x: 6, y: 2 },
                borderRadius: 6
            });
            nameText.setOrigin(0.5, 0);
            this.agentNames.set(agent.id, nameText);

            // Estado del agente con color y emoji
            const statusEmojis: Record<string, string> = {
                'working': '🔧',
                'thinking': '🧠',
                'idle': '💤'
            };
            const statusColors: Record<string, string> = {
                'working': '#10b981',
                'thinking': '#f59e0b',
                'idle': '#94a3b8'
            };
            const statusText = this.add.text(x, y + 35, `${statusEmojis[agent.status] || ''} ${agent.status}`, {
                fontSize: '11px',
                color: statusColors[agent.status] || '#94a3b8',
                fontFamily: 'Segoe UI, sans-serif',
                fontStyle: 'bold',
                backgroundColor: 'rgba(26, 32, 44, 0.8)',
                padding: { x: 8, y: 2 },
                borderRadius: 10
            });
            statusText.setOrigin(0.5, 0);
            this.statusTexts.set(agent.id, statusText);

            // Evento de clic
            sprite.on('pointerdown', () => {
                if (!this.gameStarted) {
                    this.gameStarted = true;
                    if (this.sound) {
                        this.sound.resumeAll();
                    }
                }
                this.sendAgentAction(agent.id, 'working');
                this.showSpeechBubble(`💬 ${agent.name}: ¡Hola! Soy ${agent.role}`, 3000);
            });

            // Evento hover
            sprite.on('pointerover', () => {
                sprite.setScale(2.2);
                this.showSpeechBubble(`👤 ${agent.name} - ${agent.role}`, 1500);
            });
            sprite.on('pointerout', () => {
                sprite.setScale(2);
            });

            // Animación de respiración
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
        const statusEmojis: Record<string, string> = {
            'working': '🔧',
            'thinking': '🧠',
            'idle': '💤'
        };
        const statusColors: Record<string, string> = {
            'working': '#10b981',
            'thinking': '#f59e0b',
            'idle': '#94a3b8'
        };
        
        const statusText = this.statusTexts.get(agentId);
        if (statusText) {
            statusText.setText(`${statusEmojis[status] || ''} ${status}`);
            statusText.setColor(statusColors[status] || '#94a3b8');
        }

        const sprite = this.agentSprites.get(agentId);
        if (sprite) {
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
    // WEBSOCKET CON RECONEXIÓN AUTOMÁTICA
    // ============================================================
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('✅ WebSocket conectado');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.showSpeechBubble('🔵 Conectado al servidor', 2000);
            this.events.emit('ws-status', true);
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
            this.isConnected = false;
            this.showSpeechBubble('🔴 Error de conexión', 3000);
            this.events.emit('ws-status', false);
        };

        this.ws.onclose = () => {
            console.log('❌ WebSocket desconectado');
            this.isConnected = false;
            this.showSpeechBubble('🔴 Desconectado, reconectando...', 3000);
            this.events.emit('ws-status', false);
            
            // Reconexión automática con backoff
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(5000 * this.reconnectAttempts, 30000);
                setTimeout(() => {
                    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                        this.connectWebSocket();
                    }
                }, delay);
            } else {
                this.showSpeechBubble('❌ No se pudo reconectar. Recarga la página.', 5000);
            }
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
                    const index = this.agents.findIndex(a => a.id === agent.id);
                    if (index !== -1) {
                        this.agents[index] = agent;
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
}

// ============================================================
// COMPONENTE REACT MEJORADO
// ============================================================
function App() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [game, setGame] = useState<Phaser.Game | null>(null);

    useEffect(() => {
        if (gameContainerRef.current && !game) {
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
                },
                audio: {
                    noAudio: true
                },
                physics: {
                    default: 'arcade',
                    arcade: {
                        gravity: { y: 0 },
                        debug: false
                    }
                }
            });

            setGame(newGame);

            const scene = newGame.scene.getScene('OfficeScene') as OfficeScene;
            if (scene) {
                scene.events.on('ws-status', (status: boolean) => {
                    setIsConnected(status);
                });
            }

            return () => {
                newGame.destroy(true);
                setGame(null);
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
            background: '#0f172a',
            padding: '20px'
        }}>
            <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                border: '1px solid #334155'
            }}>
                <div ref={gameContainerRef} style={{ 
                    width: '800px', 
                    height: '600px',
                    display: 'block'
                }} />
                
                {/* Indicador de estado de conexión */}
                <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    color: isConnected ? '#10b981' : '#ef4444',
                    fontSize: '13px',
                    fontFamily: 'Segoe UI, sans-serif',
                    background: 'rgba(0,0,0,0.75)',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    border: `1px solid ${isConnected ? '#10b981' : '#ef4444'}`,
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isConnected ? '#10b981' : '#ef4444',
                        animation: isConnected ? 'pulse 1.5s infinite' : 'none'
                    }} />
                    {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                </div>
            </div>
            
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

export default App;
