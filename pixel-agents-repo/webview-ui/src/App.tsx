// webview-ui/src/App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { PhaserGame } from './PhaserGame';
import { eventBus } from './eventBus';

function App() {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const [speech, setSpeech] = useState<{ agentId: string; text: string } | null>(null);

    useEffect(() => {
        if (gameContainerRef.current) {
            const game = PhaserGame.create(gameContainerRef.current);
            return () => {
                game.destroy(true);
            };
        }
    }, []);

    useEffect(() => {
        const handler = (data: { agentId: string; text: string }) => {
            setSpeech(data);
            setTimeout(() => setSpeech(null), 3000);
        };
        eventBus.on('agent-speech', handler);
        return () => {
            // Limpiar listeners si es necesario
        };
    }, []);

    return (
        <div style={{ position: 'relative' }}>
            <div ref={gameContainerRef} style={{ width: '800px', height: '600px' }} />
            {speech && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1a202c',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #4a5563',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}>
                    💬 {speech.agentId}: {speech.text}
                </div>
            )}
        </div>
    );
}

export default App;
