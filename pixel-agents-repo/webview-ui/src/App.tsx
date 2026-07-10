import React, { useState, useEffect } from 'react';

function App() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ws, setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        // Conectar WebSocket
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            console.log('✅ Conectado al servidor WebSocket');
            setWs(socket);
        };
        
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
                setAgents(data.data.agents || []);
                setLoading(false);
            }
        };
        
        socket.onerror = (error) => {
            console.error('Error WebSocket:', error);
            setLoading(false);
        };
        
        return () => {
            socket.close();
        };
    }, []);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: '#0f172a',
                color: 'white',
                fontFamily: 'Segoe UI, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem' }}>🏢</div>
                    <p>Cargando oficina...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '20px',
            background: '#0f172a',
            color: 'white',
            minHeight: '100vh',
            fontFamily: 'Segoe UI, sans-serif'
        }}>
            <h1>🏢 Pixel Agents Office</h1>
            <p>Agentes conectados: {agents.length}</p>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '16px',
                marginTop: '20px'
            }}>
                {agents.length === 0 ? (
                    <p style={{ color: '#94a3b8' }}>No hay agentes conectados</p>
                ) : (
                    agents.map((agent: any, index) => (
                        <div key={index} style={{
                            background: '#1e293b',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            border: '1px solid #334155'
                        }}>
                            <div style={{ fontSize: '2rem' }}>🤖</div>
                            <div style={{ fontWeight: 'bold' }}>{agent.name || 'Agente'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {agent.role || 'Asistente'}
                            </div>
                            <div style={{
                                display: 'inline-block',
                                padding: '2px 12px',
                                borderRadius: '20px',
                                fontSize: '0.65rem',
                                marginTop: '8px',
                                background: agent.status === 'working' ? '#0d9488' : 
                                           agent.status === 'thinking' ? '#f59e0b' : '#475569',
                                color: 'white'
                            }}>
                                {agent.status || 'idle'}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default App;
