import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

// Escena de Phaser (simplificada para evitar errores)
class OfficeScene extends Phaser.Scene {
    constructor() {
        super('OfficeScene');
    }

    create() {
        // Fondo
        this.add.graphics().fillStyle(0x2d3748, 1).fillRect(0, 0, 800, 600);
        
        // Escritorios
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

        // Agentes (círculos animados)
        const agentData = [
            { name: 'Ana', x: 100, y: 100, color: 0x8b5cf6 },
            { name: 'Carlos', x: 300, y: 200, color: 0x3b82f6 },
            { name: 'Marta', x: 500, y: 300, color: 0xec4899 }
        ];

        agentData.forEach((data, index) => {
            const agent = this.add.circle(data.x, data.y, 20, data.color);
            agent.setInteractive();
            
            this.tweens.add({
                targets: agent,
                y: data.y + 30,
                duration: 2000 + index * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.add.text(data.x - 20, data.y - 40, data.name, {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Segoe UI, sans-serif'
            });

            agent.on('pointerdown', () => {
                // Mostrar mensaje al hacer clic
                const speechDiv = document.getElementById('speech-bubble');
                if (speechDiv) {
                    speechDiv.textContent = `💬 ${data.name}: ¡Hola!`;
                    speechDiv.style.display = 'block';
                    setTimeout(() => {
                        speechDiv.style.display = 'none';
                    }, 3000);
                }
            });
        });
    }
}

function App() {
    const gameContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (gameContainerRef.current) {
            const game = new Phaser.Game({
                type: Phaser.AUTO,
                parent: gameContainerRef.current,
                width: 800,
                height: 600,
                backgroundColor: '#2d3748',
                scene: OfficeScene,
            });

            return () => {
                game.destroy(true);
            };
        }
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <div ref={gameContainerRef} style={{ width: '800px', height: '600px' }} />
            <div id="speech-bubble" style={{
                display: 'none',
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1a202c',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '12px',
                border: '1px solid #4a5563',
                pointerEvents: 'none',
                zIndex: 10,
                fontFamily: 'Segoe UI, sans-serif'
            }}></div>
        </div>
    );
}

export default App;
