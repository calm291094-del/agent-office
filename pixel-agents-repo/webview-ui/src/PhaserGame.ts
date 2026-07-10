// webview-ui/src/PhaserGame.ts
import Phaser from 'phaser';
import { eventBus } from './eventBus';

export class PhaserGame {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public static create(gameContainer: HTMLDivElement): Phaser.Game {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameContainer,
            width: 800,
            height: 600,
            backgroundColor: '#2d3748',
            scene: {
                preload: this.preload,
                create: this.create,
                update: this.update,
            },
        };
        return new Phaser.Game(config);
    }

    static preload() {
        // Carga los assets aquí. Por ahora, usaremos figuras geométricas.
        this.load.image('desk', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjNGE1NTYzIi8+PC9zdmc+');
    }

    static create() {
        const scene = this;
        const graphics = scene.add.graphics();

        // Dibujar un escritorio simple
        graphics.fillStyle(0x4a5563, 1);
        graphics.fillRect(100, 100, 40, 40);
        graphics.fillRect(300, 100, 40, 40);
        graphics.fillRect(500, 100, 40, 40);

        // Agregar un agente (círculo)
        const agent = scene.add.circle(150, 150, 15, 0x4299e1);
        agent.setData('agentId', 'alice');

        // Animación simple
        scene.tweens.add({
            targets: agent,
            y: 200,
            duration: 2000,
            yoyo: true,
            repeat: -1,
        });

        // Evento de clic en el agente
        agent.setInteractive();
        agent.on('pointerdown', () => {
            eventBus.emit('agent-speech', { agentId: 'alice', text: '¡Hola, soy Alice!' });
        });

        // Agregar otro agente
        const agent2 = scene.add.circle(350, 200, 15, 0x48bb78);
        agent2.setData('agentId', 'bob');
        scene.tweens.add({
            targets: agent2,
            y: 300,
            duration: 3000,
            yoyo: true,
            repeat: -1,
        });
        agent2.setInteractive();
        agent2.on('pointerdown', () => {
            eventBus.emit('agent-speech', { agentId: 'bob', text: '¡Hola, soy Bob!' });
        });

        // Aquí se debe implementar la lógica para conectar con WebSocket y actualizar agentes [citation:9]
        console.log('✅ Escena de Phaser creada con agentes de ejemplo.');
    }

    static update() {
        // Lógica de actualización del juego
    }
}
