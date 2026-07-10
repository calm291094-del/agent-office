// webview-ui/src/App.tsx
import React, { useState, useEffect } from 'react';

// En lugar de usar vscode.postMessage, usamos fetch
const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await fetch(`${API_URL}/agents`);
            const data = await response.json();
            setAgents(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching agents:', error);
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>🏢 Pixel Agents Office</h1>
            <div className="agents-grid">
                {agents.map(agent => (
                    <div key={agent.id} className="agent-card">
                        <span className="icon">{agent.icon}</span>
                        <span className="name">{agent.name}</span>
                        <span className="role">{agent.role}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
