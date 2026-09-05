const io = require('socket.io-client');
const { Pool } = require('pg');
require('dotenv').config();

// Config
const API_URL = 'http://localhost:5000';
const POOL_CONFIG = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
};

const pool = new Pool(POOL_CONFIG);

async function verifyRealtimeFlow() {
    console.log('🚀 Starting Realtime Flow Verification...');

    let socket;
    let client;
    let projectId;
    let contractId;
    let expertId;
    let userId; // Client ID

    try {
        // 1. Setup Data (Create Project, Contract, etc.)
        // We need a fresh project and contract to test signing
        client = await pool.connect();

        // Get a test client user
        const clientRes = await client.query("SELECT id FROM users WHERE role = 'client' LIMIT 1");
        if (clientRes.rows.length === 0) throw new Error("No client user found");
        userId = clientRes.rows[0].id;

        // Get a test expert user
        const expertRes = await client.query("SELECT id FROM users WHERE role = 'expert' LIMIT 1");
        if (expertRes.rows.length === 0) throw new Error("No expert user found");
        expertId = expertRes.rows[0].id;

        // Create Project (Start as draft to satisfy constraints)
        const projRes = await client.query(`
            INSERT INTO projects (client_id, title, description, budget, status, tech_stack, deadline, duration, created_at, updated_at)
            VALUES ($1, 'Realtime Test Project', 'Testing sockets', 500, 'draft', '{}', NOW() + interval '1 month', '1 month', NOW(), NOW())
            RETURNING id
        `, [userId]);
        projectId = projRes.rows[0].id;
        console.log(`✅ Project created: ${projectId}`);

        // Update to 'active' which is allowed by constraint (bypassing posted/matched/contracted which are missing)
        await client.query("UPDATE projects SET status = 'active' WHERE id = $1", [projectId]);

        // Create Contract
        const contractRes = await client.query(`
            INSERT INTO contracts (project_id, expert_id, client_id, terms, amount, status)
            VALUES ($1, $2, $3, 'Test Terms', 500, 'pending')
            RETURNING id
        `, [projectId, expertId, userId]);
        contractId = contractRes.rows[0].id;
        console.log(`✅ Contract created: ${contractId}`);


        // 2. Connect Socket (Simulate Client Frontend)
        console.log('🔌 Connecting to socket...');
        socket = io(API_URL, {
            transports: ['websocket'],
            forceNew: true
        });

        await new Promise((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', reject);
            setTimeout(() => reject(new Error('Socket timeout')), 5000);
        });
        console.log('✅ Socket connected');

        // Join Project Room
        socket.emit('join_project', projectId);
        // Note: server/socket.js must handle 'join_project'. 
        // If it expects 'join_room' or similar, we need to match.
        // Looking at `socketService.joinProject` in frontend, usually sends 'join_project' or 'subscribe'.
        // Wait, standard `server/socket.js` often uses `socket.on('join_project', (id) => socket.join(id))`.
        // I will assume 'join_project' based on common patterns or check `server/socket.js` if failing.
        // Actually, let's peek at `socket.js` via a separate tool call if this fails, but for now 'join_project' is a safe guess given `useSocket` normally does that.
        // Re-reading `files`: I don't see `server/socket.js` content viewed yet.
        // But `Collaboration.jsx` calls `socketService.joinProject(projectId)`.
        // Let's assume standard implementation.

        // 3. Listen for Update
        const updatePromise = new Promise((resolve, reject) => {
            socket.on('project_update', (data) => {
                console.log('📩 Received project_update:', data);
                if (data.id === projectId && data.contract_status === 'signed') {
                    resolve(data);
                }
            });
            setTimeout(() => reject(new Error('Timeout waiting for project_update')), 5000);
        });

        // 4. Trigger Sign (Simulate Expert Action via API/Controller logic)
        // Since we are running on server, we can just call the DB directly to simulate the EFFECT of signing?
        // NO, the controller EMITS the event. We MUST call the controller.
        // But calling the controller requires a mock Request/Response or making an HTTP request.
        // I'll make an HTTP request using `fetch`.

        console.log('✍️  Signing contract (via HTTP)...');

        // We need an auth token for the `signContract` endpoint?
        // Existing `signContract` endpoint uses `req.user`.
        // Simulating authentication might be hard without generating a token.
        // Alternative: Mock the controller call by requiring it?
        // But then we need `req.app.get('io')` to work.
        // Best approach: Use `fetch` to hitting the API.

        // Wait, I need a JWT token to hit the API.
        // I can generate one using `jsonwebtoken` if I have the SECRET.

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: userId, role: 'client' }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

        const http = require('http');

        await new Promise((resolve, reject) => {
            const data = JSON.stringify({
                signatureMetadata: { ip: '1.2.3.4', consent: true }
            });

            const req = http.request(`${API_URL}/api/contracts/${contractId}/sign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Length': data.length
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const parsed = JSON.parse(body);
                            console.log('✅ API returned success:', res.statusCode);
                            resolve(parsed);
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        reject(new Error(`API Error: ${res.statusCode} ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(data);
            req.end();
        });
        console.log('✅ API returned success');

        // 5. Verify Socket Event
        await updatePromise;
        console.log('✅ Socket event verified!');

        // 6. Verify Database Metadata
        const checkRes = await client.query('SELECT signature_metadata, status FROM contracts WHERE id = $1', [contractId]);
        const contract = checkRes.rows[0];

        if (contract.status !== 'signed') throw new Error('DB status not signed');
        if (!contract.signature_metadata) throw new Error('DB metadata missing');
        if (contract.signature_metadata.ip !== '1.2.3.4') throw new Error('DB metadata mismatch');

        console.log('✅ DB Metadata verified:', contract.signature_metadata);

    } catch (err) {
        console.error('❌ Verification Failed:', err);
        process.exit(1);
    } finally {
        if (socket) socket.disconnect();
        if (client) client.release();
        await pool.end();
        console.log('✨ Verification Complete');
    }
}

verifyRealtimeFlow();
