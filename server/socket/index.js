const socketIo = require('socket.io');
const { query } = require('../database/db');
let io;

const setupSocket = (server) => {
    const allowedOrigins = [
        process.env.CLIENT_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://africakonnect.com",
        "https://www.africakonnect.com",
        "https://africa-konnect.netlify.app"
    ];

    io = socketIo(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // ... (rest of the logic)
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            socket.user = decoded; // Attach user info to socket
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        // console.log('New client connected:', socket.id);

        socket.on('join_project', async (projectId, acknowledge) => {
            try {
                const result = await query(
                    `SELECT 1 FROM projects p
                     WHERE p.id = $1
                       AND (
                           p.client_id = $2
                           OR (p.selected_expert_id = $2 AND p.expert_status = 'accepted')
                           OR EXISTS (
                               SELECT 1 FROM project_members pm
                               WHERE pm.project_id = p.id AND pm.user_id = $2
                           )
                       )`,
                    [projectId, socket.user.id]
                );
                const allowed = socket.user.role === 'admin' || result.rows.length > 0;
                if (!allowed) {
                    if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Access denied' });
                    return;
                }
                socket.join(`project_${projectId}`);
                if (typeof acknowledge === 'function') acknowledge({ ok: true });
            } catch (error) {
                if (typeof acknowledge === 'function') acknowledge({ ok: false, error: 'Unable to join project' });
            }
        });

        socket.on('leave_project', (projectId) => {
            socket.leave(`project_${projectId}`);
        });

        socket.on('join_user', (userId) => {
            if (socket.user.role === 'admin' || String(userId) === String(socket.user.id)) {
                socket.join(`user_${userId}`);
            }
        });

        socket.on('join_marketplace', () => socket.join('marketplace'));
        socket.on('leave_marketplace', () => socket.leave('marketplace'));

        socket.on('disconnect', () => {
            // console.log('Client disconnected:', socket.id);
        });

        // Typing Indicators
        socket.on('typing_start', ({ roomId, userName }) => {
            if (!socket.rooms.has(`project_${roomId}`)) return;
            socket.to(`project_${roomId}`).emit('user_typing', { userId: socket.user.id, userName });
        });

        socket.on('typing_stop', ({ roomId }) => {
            if (!socket.rooms.has(`project_${roomId}`)) return;
            socket.to(`project_${roomId}`).emit('user_stopped_typing', { userId: socket.user.id });
        });

        // Message Read Receipts
        socket.on('message_read', ({ messageId, roomId }) => {
            if (!socket.rooms.has(`project_${roomId}`)) return;
            socket.to(`project_${roomId}`).emit('message_read_update', { messageId, userId: socket.user.id });
        });

        // Direct Messaging Events
        socket.on('typing_dm', ({ toUserId }) => {
            socket.to(`user_${toUserId}`).emit('user_typing_dm', { userId: socket.user.id });
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { setupSocket, getIO };
