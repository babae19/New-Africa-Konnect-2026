const https = require('http');
const crypto = require('crypto');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const EMAIL_PREFIX = 'collabtest';
const randomString = crypto.randomBytes(4).toString('hex');
const TEST_USER = {
    name: 'Collab Tester',
    email: `${EMAIL_PREFIX}_${randomString}@example.com`,
    password: 'Password123!',
    role: 'client'
};

let authToken = '';
let userId = '';
let projectId = '';
let taskId = '';

const request = (method, path, data = null, token = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

const runTests = async () => {
    console.log(`🧪 Starting Collaboration Hub Tests...\n`);

    try {
        // 1. Auth Setup
        console.log('1️⃣  Auth: Registering user...');
        const regRes = await request('POST', '/auth/register', TEST_USER);
        if (regRes.status === 201) {
            authToken = regRes.data.token;
            userId = regRes.data.id;
        } else {
            // Fallback
            const loginRes = await request('POST', '/auth/login', { email: TEST_USER.email, password: TEST_USER.password });
            authToken = loginRes.data.token;
            userId = loginRes.data.id;
        }
        console.log('   User Ready:', userId);

        // 2. Create Project
        console.log('\n2️⃣  Project: Creating Project...');
        const projectData = {
            title: `Collab Project ${randomString}`,
            description: 'Testing tasks and chat.',
            budget: 1000,
            techStack: ['Node'],
            clientId: userId
        };
        const projRes = await request('POST', '/projects', projectData, authToken);
        if (projRes.status === 201 || projRes.status === 200) {
            projectId = projRes.data.id;
            console.log('   Project Created:', projectId);
        } else {
            console.error('❌ Project Creation Failed:', projRes.status, projRes.data);
            return;
        }

        // 3. Create Task
        console.log('\n3️⃣  Tasks: Creating Task...');
        const taskData = {
            title: 'Initial Setup task',
            description: 'Setup the repo',
            status: 'todo',
            priority: 'high',
            dueDate: new Date().toISOString()
        };
        const taskRes = await request('POST', `/projects/${projectId}/tasks`, taskData, authToken);

        if (taskRes.status === 201) {
            taskId = taskRes.data.id;
            console.log('✅ Task Created:', taskId);
        } else {
            console.error('❌ Task Creation Failed:', taskRes.status, taskRes.data);
        }

        // 4. Update Task
        console.log('\n4️⃣  Tasks: Updating Task Status...');
        const updateData = { status: 'in_progress' };
        const updateRes = await request('PUT', `/tasks/${taskId}`, updateData, authToken);
        if (updateRes.status === 200 && updateRes.data.status === 'in_progress') {
            console.log('✅ Task Updated Successfully');
        } else {
            console.error('❌ Task Update Failed:', updateRes.status);
        }

        // 5. Send Message
        console.log('\n5️⃣  Chat: Sending Message...');
        const msgData = {
            projectId: projectId,
            content: "Hello team, let's start!"
        };
        const msgRes = await request('POST', '/messages', msgData, authToken);
        if (msgRes.status === 201) {
            console.log('✅ Message Sent');
        } else {
            console.error('❌ Message Send Failed:', msgRes.status, msgRes.data);
        }

        // 6. Fetch Messages
        console.log('\n6️⃣  Chat: Fetching History...');
        const histRes = await request('GET', `/messages/project/${projectId}`, null, authToken);
        if (histRes.status === 200 && histRes.data.messages && histRes.data.messages.length > 0) {
            console.log('✅ Message History Retrieved:', histRes.data.messages.length, 'messages');
        } else {
            console.error('❌ Fetch History Failed:', histRes.status);
        }

        console.log('\n🏁 Collaboration Test Complete.');

    } catch (err) {
        console.error('🚨 Test script error:', err);
    }
};

runTests();
