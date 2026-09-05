import { io } from 'socket.io-client';

// Socket URL configuration
// In development: use /api which Vite proxy will handle
// In production: use the actual backend URL
const getSocketURL = () => {
    const apiUrl = import.meta.env.VITE_API_URL;

    // If VITE_API_URL is set to /api (development with proxy)
    if (apiUrl === '/api') {
        return window.location.origin; // Use current origin, proxy will handle it
    }

    // If VITE_API_URL is a full URL (production)
    if (apiUrl && apiUrl.startsWith('http')) {
        return apiUrl.replace('/api', ''); // Remove /api suffix for socket connection
    }

    // Fallback to current origin
    return window.location.origin;
};

const SOCKET_URL = getSocketURL();

// Check if backend is configured
const isBackendConfigured = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    return apiUrl && !apiUrl.includes('your-backend-url.com');
};


class SocketClient {
    constructor() {
        this.isEnabled = isBackendConfigured();

        if (!this.isEnabled) {
            if (import.meta.env.DEV) {
                console.warn('⚠️ Socket.IO disabled: Backend URL not configured in .env.production');
            }
            // Create a noop socket object to prevent errors when components try to use it
            this.socket = this.createNoopSocket();
            return;
        }

        this.socket = null;
    }

    createNoopSocket() {
        // Return a mock socket object with noop methods
        return {
            connected: false,
            on: () => { },
            off: () => { },
            emit: () => { },
            joinUser: () => { },
            joinProject: () => { },
            connect: () => this,
            disconnect: () => { }
        };
    }

    connect() {
        if (!this.isEnabled) {
            if (import.meta.env.DEV) {
                console.log('Socket.IO connection skipped - backend not configured');
            }
            return this;
        }

        if (!this.socket) {
            const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const token = user?.token;

            this.socket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                timeout: 10000,
                auth: {
                    token: token
                }
            });

            this.socket.on('connect', () => {
                if (import.meta.env.DEV) {
                    console.log('Socket connected:', this.socket.id);
                }
            });

            this.socket.on('disconnect', () => {
                if (import.meta.env.DEV) {
                    console.log('Socket disconnected');
                }
            });

            this.socket.on('connect_error', (error) => {
                if (import.meta.env.DEV) {
                    console.error('Socket connection error:', error.message);
                }
            });

            this.socket.connect();
        }
        return this;
    }

    disconnect() {
        if (this.socket && this.isEnabled) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket && this.isEnabled) {
            this.socket.emit(event, data);
        } else if (import.meta.env.DEV) {
            console.log(`Socket emit skipped (${event}):`, data);
        }
    }

    joinUser(userId) {
        if (this.socket && this.isEnabled && userId) {
            this.socket.emit('join_user', userId);
            if (import.meta.env.DEV) {
                console.log(`Socket: Joined user room ${userId}`);
            }
        }
    }

    joinProject(projectId) {
        if (this.socket && this.isEnabled && projectId) {
            this.socket.emit('join_project', projectId);
            if (import.meta.env.DEV) {
                console.log(`Socket: Joined project room ${projectId}`);
            }
        }
    }

    on(event, callback) {
        if (this.socket && this.isEnabled) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket && this.isEnabled) {
            this.socket.off(event, callback);
        }
    }
}

const socketClient = new SocketClient();
export default socketClient;
