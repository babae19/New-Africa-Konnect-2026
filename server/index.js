const dotenv = require('dotenv');
const path = require('path');

// Initialize environment variables ASAP (before other imports)
const serverEnvResult = dotenv.config({ path: path.join(__dirname, '.env') });
if (serverEnvResult.error) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { testConnection } = require('./database/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

const http = require('http');
const setupSocket = require('./socket').setupSocket;

// ... imports remain ...

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = setupSocket(server);
app.set('io', io); // Make io available in routes via req.app.get('io')

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for Socket.IO
}));

const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://africakonnect.com",
    "https://www.africakonnect.com",
    "https://africa-konnect.netlify.app",
    "https://africa-konnect-v2.netlify.app"
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.includes(origin) || 
                         origin.endsWith('.netlify.app') || 
                         origin.includes('localhost');
                         
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiting
app.use('/api/', apiLimiter);

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use(require('morgan')('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/experts', require('./routes/expertRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api', require('./routes/collaborationRoutes')); // Handling tasks, milestones, files, activity
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api', require('./routes/paymentRoutes')); // Handling escrow, releases
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api', require('./routes/bidRoutes')); // Bidding system routes


// System Health Check Endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbStart = Date.now();
        const dbConnected = await testConnection();
        const dbLatency = Date.now() - dbStart;

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            system: {
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            },
            services: {
                database: {
                    status: dbConnected ? 'connected' : 'disconnected',
                    latency: `${dbLatency}ms`
                },
                server: {
                    status: 'running',
                    port: PORT
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Initialize Scheduled Jobs
const { initScheduledJobs } = require('./services/scheduledJobs');
initScheduledJobs();

// Health check route (Simple)
app.get('/', (req, res) => {
    res.json({
        message: 'Africa Konnect API Running',
        version: '2.0.0',
        database: 'PostgreSQL',
        realtime: 'Enabled'
    });
});

// API info route
app.get('/api', (req, res) => {
    res.json({
        message: 'Africa Konnect API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            experts: '/api/experts',
            projects: '/api/projects',
            contracts: '/api/contracts',
            messages: '/api/messages'
        }
    });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your credentials.');
            console.log('Make sure you have set the DB_PASSWORD in your .env file');
            process.exit(1);
        }

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📊 Database: PostgreSQL (Supabase)`);
            console.log(`🔌 Socket.IO: Enabled`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\n📡 API Endpoints:`);
            console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
            console.log(`   - Experts: http://localhost:${PORT}/api/experts`);
            console.log(`   - Projects: http://localhost:${PORT}/api/projects`);
            console.log(`   - Contracts: http://localhost:${PORT}/api/contracts`);
            console.log(`   - Messages: http://localhost:${PORT}/api/messages`);
            console.log(`   - Health: http://localhost:${PORT}/api/health\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
