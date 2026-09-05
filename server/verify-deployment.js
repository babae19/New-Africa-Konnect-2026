const https = require('https');
const http = require('http');
const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Africa Konnect Deployment Verification\n');
console.log('='.repeat(50));
console.log('');

// Configuration
const FRONTEND_URL = 'https://africakonnect.com';
const BACKEND_URL = 'https://africa-konnect-api.onrender.com';

async function checkUrl(url, name) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, (res) => {
            console.log(`✅ ${name}: ${res.statusCode} ${res.statusMessage}`);
            resolve({ success: true, status: res.statusCode });
        });

        req.on('error', (error) => {
            console.log(`❌ ${name}: ${error.message}`);
            resolve({ success: false, error: error.message });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log(`⏱️  ${name}: Timeout (10s)`);
            resolve({ success: false, error: 'Timeout' });
        });
    });
}

async function checkDatabase() {
    console.log('\n📊 Database Connection Check:');
    console.log('-'.repeat(50));

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();

        // Test connection
        const result = await client.query('SELECT NOW()');
        console.log(`✅ Database connected: ${result.rows[0].now}`);

        // Check tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);

        console.log(`✅ Tables found: ${tablesResult.rows.length}`);

        // Check for data
        const userCount = await client.query('SELECT COUNT(*) FROM users');
        const projectCount = await client.query('SELECT COUNT(*) FROM projects');
        const expertCount = await client.query('SELECT COUNT(*) FROM expert_profiles');

        console.log(`\n📈 Data Summary:`);
        console.log(`   Users: ${userCount.rows[0].count}`);
        console.log(`   Experts: ${expertCount.rows[0].count}`);
        console.log(`   Projects: ${projectCount.rows[0].count}`);

        client.release();
        await pool.end();

        return true;
    } catch (error) {
        console.log(`❌ Database error: ${error.message}`);
        await pool.end();
        return false;
    }
}

async function checkBackendAPI() {
    console.log('\n🔌 Backend API Check:');
    console.log('-'.repeat(50));

    await checkUrl(`${BACKEND_URL}/api/health`, 'Health endpoint');
    await checkUrl(`${BACKEND_URL}/api/experts`, 'Experts endpoint');
}

async function checkFrontend() {
    console.log('\n🌐 Frontend Check:');
    console.log('-'.repeat(50));

    await checkUrl(FRONTEND_URL, 'Homepage');
    await checkUrl(`${FRONTEND_URL}/signup`, 'Signup page');
    await checkUrl(`${FRONTEND_URL}/signin`, 'Signin page');
    await checkUrl(`${FRONTEND_URL}/experts`, 'Experts page');
}

async function runVerification() {
    console.log('🚀 Starting verification...\n');

    try {
        // Check Frontend
        await checkFrontend();

        // Check Backend
        await checkBackendAPI();

        // Check Database
        const dbOk = await checkDatabase();

        console.log('\n' + '='.repeat(50));
        console.log('\n🎉 Verification Complete!\n');

        if (dbOk) {
            console.log('✅ All systems operational');
        } else {
            console.log('⚠️  Some issues detected - please review above');
        }

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
    }
}

runVerification()
    .then(() => {
        console.log('\n✅ Verification script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Verification script failed:', error);
        process.exit(1);
    });
