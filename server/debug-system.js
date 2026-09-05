const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ Loading .env file...');
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️  .env file not found.');
}

const { Pool } = require('pg');

const runDiagnostics = async () => {
    console.log('\n🔍 Starting System Diagnostics...\n');

    // 1. Environment Variables Check
    console.log('1️⃣  Checking Environment Variables:');
    const requiredVars = ['PORT', 'DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL'];
    const missingVars = requiredVars.filter(key => !process.env[key]);

    if (missingVars.length > 0) {
        console.error(`❌ Missing required variables: ${missingVars.join(', ')}`);
    } else {
        console.log('✅ All required variables present.');
    }

    // Log non-sensitive values
    console.log(`   - PORT: ${process.env.PORT || 5000}`);
    console.log(`   - CLIENT_URL: ${process.env.CLIENT_URL || 'Not Set'}`);
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

    // 2. Database Connection Check
    console.log('2️⃣  Checking Database Connection:');
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing. Skipping DB check.');
    } else {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Required for Supabase/Neon
        });

        try {
            const client = await pool.connect();
            console.log('✅ Successfully connected to PostgreSQL.');

            // Check Tables
            const res = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            `);

            console.log(`   Found ${res.rowCount} tables:`);
            res.rows.forEach(row => console.log(`   - ${row.table_name}`));

            client.release();
        } catch (err) {
            console.error('❌ Database connection failed:', err.message);
        } finally {
            await pool.end();
        }
    }

    console.log('\n🏁 Diagnostics Complete.\n');
};

runDiagnostics();
