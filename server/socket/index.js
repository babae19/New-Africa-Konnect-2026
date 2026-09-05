const socketIo = require('socket.io');
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

        socket.on('join_project', (projectId) => {
            socket.join(`project_${projectId}`);
            // console.log(`Socket ${socket.id} joined project_${projectId}`);
        });

        socket.on('leave_project', (projectId) => {
            socket.leave(`project_${projectId}`);
        });

        socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
        });

        socket.on('disconnect', () => {
            // console.log('Client disconnected:', socket.id);
        });

        // Typing Indicators
        socket.on('typing_start', ({ roomId, userId, userName }) => {
            socket.to(`project_${roomId}`).emit('user_typing', { userId, userName });
        });

        socket.on('typing_stop', ({ roomId, userId }) => {
            socket.to(`project_${roomId}`).emit('user_stopped_typing', { userId });
        });

        // Message Read Receipts
        socket.on('message_read', ({ messageId, roomId, userId }) => {
            socket.to(`project_${roomId}`).emit('message_read_update', { messageId, userId });
        });

        // Direct Messaging Events
        socket.on('typing_dm', ({ toUserId, userId }) => {
            socket.to(`user_${toUserId}`).emit('user_typing_dm', { userId });
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
