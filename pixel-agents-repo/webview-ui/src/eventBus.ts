type EventMap = {
    'agent-speech': { agentId: string; text: string };
};

export const eventBus = {
    listeners: {} as Record<keyof EventMap, ((data: any) => void)[]>,

    emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    },

    on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
};
