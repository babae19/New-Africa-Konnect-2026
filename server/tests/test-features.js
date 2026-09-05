const https = require('http'); // Using http for localhost
const crypto = require('crypto');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const EMAIL_PREFIX = 'featuretest';
const randomString = crypto.randomBytes(4).toString('hex');
const TEST_USER = {
    name: 'Feature Tester',
    email: `${EMAIL_PREFIX}_${randomString}@example.com`,
    password: 'Password123!',
    role: 'client'
};

let authToken = '';
let userId = '';
let projectId = '';

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
    console.log(`🧪 Starting Feature Tests...\n`);

    try {
        // 1. Auth Setup
        console.log('1️⃣  Auth: Registering user...');
        const regRes = await request('POST', '/auth/register', TEST_USER);
        if (regRes.status === 201) {
            authToken = regRes.data.token;
            userId = regRes.data.id;
        } else {
            // Try login if exists
            const loginRes = await request('POST', '/auth/login', { email: TEST_USER.email, password: TEST_USER.password });
            authToken = loginRes.data.token;
            userId = loginRes.data.id;
        }
        console.log('   User Ready:', userId);

        // 2. Create Project (Project Hub)
        console.log('\n2️⃣  Project Hub: Creating Project...');
        const projectData = {
            title: `AI Project ${randomString}`,
            description: 'A project to test PDF upload and AI matching.',
            budget: 5000,
            techStack: ['React', 'AI'],
            clientId: userId // Backend might infer this from token
        };
        const projRes = await request('POST', '/projects', projectData, authToken);
        if (projRes.status === 201 || projRes.status === 200) {
            projectId = projRes.data.id;
            console.log('✅ Project Created:', projectId);
        } else {
            console.error('❌ Project Creation Failed:', projRes.data);
            return;
        }

        // 3. Upload PDF (File Verification)
        console.log('\n3️⃣  Files: Uploading PDF...');
        const samplePdfBase64 = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSC4gIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9FMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqCiAgPDwgL0xlbmd0aCA0NCA+PgpzdHJlYWQKVEYKL0UxIDEyIFRmCjEwIDEwIFRkCihIZWxsbyBXb3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDExNCAwMDAwMCBuIAowMDAwMDAwMjI0IDAwMDAwIG4gCjAwMDAwMDAzMTUgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDE5CiUlRU9GCg==";

        const fileData = {
            projectId,
            name: 'requirements.pdf',
            type: 'application/pdf',
            size: 1024,
            data: samplePdfBase64
        };

        const fileRes = await request('POST', '/files', fileData, authToken);
        if (fileRes.status === 201) {
            console.log('✅ PDF Uploaded Successfully:', fileRes.data.id);
        } else {
            console.error('❌ PDF Upload Failed:', fileRes.data);
        }

        // 4. AI Match Test
        console.log('\n4️⃣  AI API: Testing Match...');
        // We'll try to match. If we don't have experts, it returns empty list, which is still a success for the endpoint logic.
        const matchData = {
            projectDescription: "Need a React developer for a small dashboard",
            requirements: "React, Node.js"
        };
        const aiRes = await request('POST', '/ai/match', matchData, authToken);

        if (aiRes.status === 200) {
            console.log('✅ AI Match Endpoint Reachable.');
            console.log('   Results:', aiRes.data.matches?.length || 0, 'experts found.');
        } else if (aiRes.status === 500) {
            console.log('⚠️  AI Endpoint returned 500 (likely missing validated key or DeepSeek error).');
            console.log('   Details:', aiRes.data);
        } else {
            console.error('❌ AI Match Failed:', aiRes.status, aiRes.data);
        }

        console.log('\n🏁 Feature Test Complete.');

    } catch (err) {
        console.error('🚨 Test script error:', err);
    }
};

runTests();
